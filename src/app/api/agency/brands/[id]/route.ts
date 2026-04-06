import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "AGENCY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const agency = await prisma.agency.findUnique({
      where: { userId: session.user.id },
    })

    if (!agency) {
      return NextResponse.json({ error: "Agency profile not found" }, { status: 404 })
    }

    const { id } = await params

    const agencyBrand = await prisma.agencyBrand.findUnique({
      where: { id },
    })

    if (!agencyBrand || agencyBrand.agencyId !== agency.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.agencyBrand.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing brand from agency:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
