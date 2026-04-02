import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TicketStatusBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const tickets = await prisma.supportTicket.findMany({
    include: {
      creator: { select: { name: true, email: true } },
      assignee: { select: { name: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const priorityLabels: Record<number, { label: string; color: string }> = {
    0: { label: "Low", color: "text-gray-500" },
    1: { label: "Medium", color: "text-yellow-600" },
    2: { label: "High", color: "text-orange-600" },
    3: { label: "Critical", color: "text-red-600" },
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tickets yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">Subject</th>
                  <th className="px-6 py-3 font-medium text-gray-500">User</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Priority</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Messages</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Assignee</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.map((ticket) => {
                  const priority = priorityLabels[ticket.priority] ?? priorityLabels[0];
                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <Link href={`/admin/tickets/${ticket.id}`} className="hover:text-[#d4772c]">
                          {ticket.subject}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-900">{ticket.creator.name}</p>
                          <p className="text-xs text-gray-500">{ticket.creator.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <TicketStatusBadge status={ticket.status} />
                      </td>
                      <td className={`px-6 py-4 font-medium ${priority.color}`}>
                        {priority.label}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{ticket._count.messages}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {ticket.assignee?.name ?? "Unassigned"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
