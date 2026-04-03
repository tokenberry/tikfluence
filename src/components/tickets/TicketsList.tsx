import Link from "next/link"
import { TicketStatusBadge } from "@/components/ui/Badge"

interface Ticket {
  id: string
  subject: string
  status: string
  createdAt: Date
  _count: { messages: number }
}

export default function TicketsList({
  tickets,
  basePath,
}: {
  tickets: Ticket[]
  basePath: string
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
        <Link
          href={`${basePath}/new`}
          className="rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a]"
        >
          New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500">You have no support tickets yet.</p>
          <Link
            href={`${basePath}/new`}
            className="mt-4 inline-block rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a]"
          >
            Create Your First Ticket
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`${basePath}/${ticket.id}`}
                className="block px-6 py-4 transition hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {ticket.subject}
                  </h3>
                  <TicketStatusBadge status={ticket.status} />
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                  <span>
                    {ticket._count.messages}{" "}
                    {ticket._count.messages === 1 ? "message" : "messages"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
