import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { constructWebhookEvent } from "@/lib/stripe"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? undefined
  const log = logger.child({
    route: "api/payments/webhook",
    ...(requestId ? { requestId } : {}),
  })

  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      )
    }

    let event
    try {
      event = constructWebhookEvent(body, signature)
    } catch (err) {
      log.warn(
        { event: "stripe_webhook_signature_failed", err },
        "Stripe webhook signature verification failed"
      )
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object
        const orderId = checkoutSession.metadata?.orderId
        const creditApplied = parseFloat(checkoutSession.metadata?.creditApplied || "0")

        if (orderId) {
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true, brand: { select: { id: true } } },
          })

          // Only process if order is still DRAFT (idempotency)
          if (order && order.status === "DRAFT") {
            await prisma.$transaction(async (tx) => {
              // Apply credit deduction if any
              if (creditApplied > 0) {
                await tx.brandCredit.create({
                  data: {
                    brandId: order.brand.id,
                    amount: -creditApplied,
                    reason: "Credit applied to order",
                    orderId,
                  },
                })
              }

              await tx.order.update({
                where: { id: orderId },
                data: {
                  status: "OPEN",
                  paymentStatus: "HELD",
                  stripePaymentId: checkoutSession.payment_intent as string,
                },
              })
            })
          }
        }
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object
        const orderId = paymentIntent.transfer_group?.replace("order_", "")

        if (orderId) {
          // Idempotency: only update if not already marked as HELD
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { paymentStatus: true, stripePaymentId: true },
          })
          if (order && order.stripePaymentId !== paymentIntent.id) {
            await prisma.order.update({
              where: { id: orderId },
              data: {
                stripePaymentId: paymentIntent.id,
                paymentStatus: "HELD",
              },
            })
          }
        }
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object
        const orderId = paymentIntent.transfer_group?.replace("order_", "")

        if (orderId) {
          // Idempotency: only update if not already FAILED or further along
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { paymentStatus: true },
          })
          if (order && !["FAILED", "RELEASED", "REFUNDED"].includes(order.paymentStatus)) {
            await prisma.order.update({
              where: { id: orderId },
              data: {
                paymentStatus: "FAILED",
              },
            })
          }
        }
        break
      }

      case "account.updated": {
        const account = event.data.object
        if (account.details_submitted) {
          // Update creator or network onboarding status
          await prisma.creator.updateMany({
            where: { stripeAccountId: account.id },
            data: { stripeOnboarded: true },
          })
          await prisma.creatorNetwork.updateMany({
            where: { stripeAccountId: account.id },
            data: { stripeOnboarded: true },
          })
        }
        break
      }

      case "transfer.created": {
        const transfer = event.data.object
        const orderId = transfer.transfer_group?.replace("order_", "")

        if (orderId) {
          await prisma.transaction.updateMany({
            where: { orderId, stripeTransferId: null },
            data: {
              stripeTransferId: transfer.id,
              status: "RELEASED",
            },
          })
        }
        break
      }

      case "charge.refunded": {
        const charge = event.data.object
        const paymentIntentId = charge.payment_intent

        if (paymentIntentId) {
          await prisma.order.updateMany({
            where: { stripePaymentId: paymentIntentId as string },
            data: { paymentStatus: "REFUNDED" },
          })
          await prisma.transaction.updateMany({
            where: { stripePaymentId: paymentIntentId as string },
            data: { status: "REFUNDED" },
          })
        }
        break
      }

      default:
        log.info(
          { event: "stripe_webhook_unhandled", type: event.type },
          `Unhandled Stripe webhook event: ${event.type}`
        )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    log.error(
      { event: "stripe_webhook_error", err: error },
      "Stripe webhook handler failed"
    )
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
