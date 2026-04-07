import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic"

export default async function AdminTransactionsPage() {
  const t = await getTranslations("admin");
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const transactions = await prisma.transaction.findMany({
    include: {
      order: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No transactions yet.</div>
        ) : (
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Order</TableHead>
                <TableHead className="px-6">Amount</TableHead>
                <TableHead className="px-6">Platform Fee</TableHead>
                <TableHead className="px-6">Creator Payout</TableHead>
                <TableHead className="px-6">Status</TableHead>
                <TableHead className="px-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="px-6 font-medium text-gray-900">{tx.order.title}</TableCell>
                  <TableCell className="px-6 text-gray-600">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell className="px-6 text-gray-600">{formatCurrency(tx.platformFee)}</TableCell>
                  <TableCell className="px-6 font-medium text-gray-900">
                    {formatCurrency(tx.creatorPayout)}
                  </TableCell>
                  <TableCell className="px-6">
                    <PaymentStatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell className="px-6 text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
