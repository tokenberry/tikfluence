import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { constructWebhookEvent } from "@/lib/stripe"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
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
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    switch (event.type) {
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
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
