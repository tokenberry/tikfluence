import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import TicketsList from "@/components/tickets/TicketsList"

export const dynamic = "force-dynamic"

export default async function NetworkTicketsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const tickets = await prisma.supportTicket.findMany({
    where: { creatorId: session.user.id },
    include: { _count: { select: { messages: true } } },
    orderBy: { createdAt: "desc" },
  })

  return <TicketsList tickets={tickets} basePath="/network/tickets" />
}
