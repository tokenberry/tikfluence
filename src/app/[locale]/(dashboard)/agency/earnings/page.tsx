import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AgencyEarningsPage() {
  const t = await getTranslations("agency");
  const session = await auth();
  if (!session?.user || session.user.role !== "AGENCY") redirect("/login");

  const agency = await prisma.agency.findUnique({
    where: { userId: session.user.id },
  });
  if (!agency) redirect("/login");

  const transactions = await prisma.transaction.findMany({
    where: {
      order: { agencyId: agency.id },
      status: "RELEASED",
    },
    include: {
      order: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalPlatformFees = transactions.reduce((sum, t) => sum + t.platformFee, 0);
  const totalPayouts = transactions.reduce((sum, t) => sum + t.creatorPayout, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">{t("earnings_title")}</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">{t("earnings_revenue")}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">{t("earnings_fees")}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(totalPlatformFees)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">{t("earnings_payouts")}</p>
          <p className="mt-2 text-2xl font-bold text-[#d4772c]">
            {formatCurrency(totalPayouts)}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">{t("earnings_empty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Order</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Amount</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Platform Fee</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Payout</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="px-6 font-medium text-gray-900">{tx.order.title}</TableCell>
                  <TableCell className="px-6 text-gray-600">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell className="px-6 text-gray-600">{formatCurrency(tx.platformFee)}</TableCell>
                  <TableCell className="px-6 font-medium text-[#d4772c]">{formatCurrency(tx.creatorPayout)}</TableCell>
                  <TableCell className="px-6 text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
