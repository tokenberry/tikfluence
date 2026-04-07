import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TicketStatusBadge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const t = await getTranslations("admin");
  const tTickets = await getTranslations("tickets");
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
    0: { label: tTickets("priority_low"), color: "text-gray-500" },
    1: { label: tTickets("priority_medium"), color: "text-yellow-600" },
    2: { label: tTickets("priority_high"), color: "text-orange-600" },
    3: { label: tTickets("priority_critical"), color: "text-red-600" },
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("tickets_title")}</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t("tickets_empty")}</div>
        ) : (
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Subject</TableHead>
                <TableHead className="px-6">User</TableHead>
                <TableHead className="px-6">Status</TableHead>
                <TableHead className="px-6">Priority</TableHead>
                <TableHead className="px-6">Messages</TableHead>
                <TableHead className="px-6">Assignee</TableHead>
                <TableHead className="px-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const priority = priorityLabels[ticket.priority] ?? priorityLabels[0];
                return (
                  <TableRow key={ticket.id}>
                    <TableCell className="px-6 font-medium text-gray-900">
                      <Link href={`/admin/tickets/${ticket.id}`} className="hover:text-[#d4772c]">
                        {ticket.subject}
                      </Link>
                    </TableCell>
                    <TableCell className="px-6">
                      <div>
                        <p className="text-gray-900">{ticket.creator.name}</p>
                        <p className="text-xs text-gray-500">{ticket.creator.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-6">
                      <TicketStatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell className={`px-6 font-medium ${priority.color}`}>
                      {priority.label}
                    </TableCell>
                    <TableCell className="px-6 text-gray-600">{ticket._count.messages}</TableCell>
                    <TableCell className="px-6 text-gray-600">
                      {ticket.assignee?.name ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="px-6 text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
