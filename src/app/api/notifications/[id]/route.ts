import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Mark single notification as read
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const notification = await prisma.notification.findUnique({ where: { id } })
    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking notification read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
