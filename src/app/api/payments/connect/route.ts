import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createConnectAccount, createOnboardingLink } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "CREATOR" && session.user.role !== "NETWORK") {
      return NextResponse.json(
        { error: "Only creators and networks can create Connect accounts" },
        { status: 403 }
      )
    }

    const returnUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    if (session.user.role === "CREATOR") {
      const creator = await prisma.creator.findUnique({
        where: { userId: session.user.id },
      })

      if (!creator) {
        return NextResponse.json({ error: "Creator profile not found" }, { status: 404 })
      }

      let stripeAccountId = creator.stripeAccountId

      if (!stripeAccountId) {
        const account = await createConnectAccount(session.user.email)
        stripeAccountId = account.id

        await prisma.creator.update({
          where: { id: creator.id },
          data: { stripeAccountId },
        })
      }

      const onboardingUrl = await createOnboardingLink(
        stripeAccountId,
        `${returnUrl}/dashboard/payments`
      )

      return NextResponse.json({ url: onboardingUrl })
    } else {
      const network = await prisma.creatorNetwork.findUnique({
        where: { userId: session.user.id },
      })

      if (!network) {
        return NextResponse.json({ error: "Network profile not found" }, { status: 404 })
      }

      let stripeAccountId = network.stripeAccountId

      if (!stripeAccountId) {
        const account = await createConnectAccount(session.user.email)
        stripeAccountId = account.id

        await prisma.creatorNetwork.update({
          where: { id: network.id },
          data: { stripeAccountId },
        })
      }

      const onboardingUrl = await createOnboardingLink(
        stripeAccountId,
        `${returnUrl}/dashboard/payments`
      )

      return NextResponse.json({ url: onboardingUrl })
    }
  } catch (error) {
    console.error("Error creating Connect account:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
