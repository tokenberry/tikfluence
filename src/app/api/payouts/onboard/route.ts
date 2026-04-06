import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { registerPayee } from "@/lib/payoneer"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user.role
    if (role !== "CREATOR" && role !== "NETWORK") {
      return NextResponse.json(
        { error: "Only creators and networks can onboard for payouts" },
        { status: 403 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.foxolog.com"

    if (role === "CREATOR") {
      const creator = await prisma.creator.findUnique({
        where: { userId: session.user.id },
        include: { user: { select: { email: true, name: true } } },
      })
      if (!creator) {
        return NextResponse.json({ error: "Creator not found" }, { status: 404 })
      }

      if (creator.payoneerPayeeId) {
        return NextResponse.json({
          message: "Already registered with Payoneer",
          payeeId: creator.payoneerPayeeId,
        })
      }

      const payeeId = `creator_${creator.id}`
      const nameParts = creator.user.name.split(" ")

      const result = await registerPayee({
        payeeId,
        email: creator.user.email,
        firstName: nameParts[0] || creator.user.name,
        lastName: nameParts.slice(1).join(" ") || ".",
        redirectUrl: `${appUrl}/creator/earnings?payoneer=success`,
      })

      // Store payee ID
      await prisma.creator.update({
        where: { id: creator.id },
        data: { payoneerPayeeId: payeeId },
      })

      if (result.devMode) {
        return NextResponse.json({
          message: "Payoneer not configured — payee ID stored for dev mode",
          payeeId,
          devMode: true,
        })
      }

      return NextResponse.json({
        registrationUrl: result.registrationUrl,
        payeeId,
      })
    }

    // NETWORK
    const network = await prisma.creatorNetwork.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { email: true, name: true } } },
    })
    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 })
    }

    if (network.payoneerPayeeId) {
      return NextResponse.json({
        message: "Already registered with Payoneer",
        payeeId: network.payoneerPayeeId,
      })
    }

    const payeeId = `network_${network.id}`
    const nameParts = network.user.name.split(" ")

    const result = await registerPayee({
      payeeId,
      email: network.user.email,
      firstName: nameParts[0] || network.companyName,
      lastName: nameParts.slice(1).join(" ") || ".",
      redirectUrl: `${appUrl}/network/earnings?payoneer=success`,
    })

    await prisma.creatorNetwork.update({
      where: { id: network.id },
      data: { payoneerPayeeId: payeeId },
    })

    if (result.devMode) {
      return NextResponse.json({
        message: "Payoneer not configured — payee ID stored for dev mode",
        payeeId,
        devMode: true,
      })
    }

    return NextResponse.json({
      registrationUrl: result.registrationUrl,
      payeeId,
    })
  } catch (error) {
    console.error("Error onboarding payout:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
