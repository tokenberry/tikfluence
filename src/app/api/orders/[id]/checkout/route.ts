import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, userId: true, companyName: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Authorization: brand owner or managing agency
    let authorized = order.brand.userId === session.user.id
    if (!authorized && session.user.role === "AGENCY") {
      const agency = await prisma.agency.findUnique({ where: { userId: session.user.id } })
      if (agency) {
        const link = await prisma.agencyBrand.findFirst({
          where: { agencyId: agency.id, brandId: order.brand.id, status: "APPROVED" },
        })
        if (link) authorized = true
      }
    }
    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (order.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft orders can be published" },
        { status: 400 }
      )
    }

    // Validate budget against platform settings
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    })
    if (settings) {
      if (order.budget < settings.minOrderBudget) {
        return NextResponse.json(
          { error: `Order budget must be at least $${settings.minOrderBudget}` },
          { status: 400 }
        )
      }
      if (order.budget > settings.maxOrderBudget) {
        return NextResponse.json(
          { error: `Order budget cannot exceed $${settings.maxOrderBudget}` },
          { status: 400 }
        )
      }
    }

    // Calculate brand credit balance
    const creditRecords = await prisma.brandCredit.findMany({
      where: { brandId: order.brand.id },
    })
    const creditBalance = creditRecords.reduce((sum, c) => sum + c.amount, 0)
    const creditToApply = Math.min(Math.max(creditBalance, 0), order.budget)
    const amountToCharge = order.budget - creditToApply

    // If fully covered by credit, publish directly
    if (amountToCharge <= 0) {
      await prisma.$transaction(async (tx) => {
        // Deduct credit
        if (creditToApply > 0) {
          await tx.brandCredit.create({
            data: {
              brandId: order.brand.id,
              amount: -creditToApply,
              reason: `Credit applied to order "${order.title}"`,
              orderId: id,
            },
          })
        }

        await tx.order.update({
          where: { id },
          data: {
            status: "OPEN",
            paymentStatus: "HELD",
            creditApplied: creditToApply,
            amountCharged: 0,
          },
        })
      })

      return NextResponse.json({ success: true, creditApplied: creditToApply })
    }

    // Create Stripe Checkout Session
    const stripe = getStripeClient()

    if (!stripe) {
      // Dev mode: no Stripe key, publish directly with warning
      console.warn("[checkout] STRIPE_SECRET_KEY not set — publishing order without payment (dev mode)")
      await prisma.$transaction(async (tx) => {
        if (creditToApply > 0) {
          await tx.brandCredit.create({
            data: {
              brandId: order.brand.id,
              amount: -creditToApply,
              reason: `Credit applied to order "${order.title}"`,
              orderId: id,
            },
          })
        }

        await tx.order.update({
          where: { id },
          data: {
            status: "OPEN",
            paymentStatus: "HELD",
            creditApplied: creditToApply,
            amountCharged: amountToCharge,
          },
        })
      })

      return NextResponse.json({ success: true, devMode: true, creditApplied: creditToApply })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.foxolog.com"

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: order.title,
              description: `Campaign budget for "${order.title}" — ${order.brand.companyName}`,
            },
            unit_amount: Math.round(amountToCharge * 100), // cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: id,
        brandId: order.brand.id,
        creditApplied: creditToApply.toString(),
      },
      payment_intent_data: {
        transfer_group: `order_${id}`,
      },
      success_url: `${appUrl}/brand/orders/${id}?payment=success`,
      cancel_url: `${appUrl}/brand/orders/${id}?payment=cancelled`,
    })

    // Store checkout session ID on order
    await prisma.order.update({
      where: { id },
      data: {
        stripeCheckoutSessionId: checkoutSession.id,
        creditApplied: creditToApply,
        amountCharged: amountToCharge,
      },
    })

    return NextResponse.json({ checkoutUrl: checkoutSession.url })
  } catch (error) {
    console.error("Error creating checkout:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
