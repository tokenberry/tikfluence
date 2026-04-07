import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic"

export default async function CreatorEarningsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("creator");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });

  if (!creator) redirect("/creator/profile");

  const transactions = await prisma.transaction.findMany({
    where: {
      order: {
        assignments: {
          some: { creatorId: creator.id },
        },
      },
    },
    include: {
      order: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalEarned = transactions
    .filter((t) => t.status === "RELEASED")
    .reduce((sum, t) => sum + t.creatorPayout, 0);

  const pendingPayout = transactions
    .filter((t) => t.status === "HELD" || t.status === "PENDING")
    .reduce((sum, t) => sum + t.creatorPayout, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("earnings_title")}</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">{t("earnings_total")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-green-600">{formatCurrency(totalEarned)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">{t("earnings_pending")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-yellow-600">{formatCurrency(pendingPayout)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">{t("earnings_transactions")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">{transactions.length}</p>
        </div>
      </div>

      {/* Payoneer Payout Onboarding */}
      {!creator.payoneerPayeeId && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-6">
          <h2 className="text-lg font-semibold text-yellow-800">{t("earnings_setup_title")}</h2>
          <p className="mt-1 text-sm text-yellow-700">
            {t("earnings_setup_desc")}
          </p>
          <form
            action="/api/payouts/onboard"
            method="POST"
            className="mt-3"
          >
            <button
              type="submit"
              className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
            >
              {t("earnings_setup_button")}
            </button>
          </form>
        </div>
      )}

      {/* Transactions Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{t("earnings_history")}</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">{t("earnings_no_transactions")}</div>
        ) : (
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">{t("earnings_table_order")}</TableHead>
                <TableHead className="px-6">{t("earnings_table_amount")}</TableHead>
                <TableHead className="px-6">{t("earnings_table_fee")}</TableHead>
                <TableHead className="px-6">{t("earnings_table_payout")}</TableHead>
                <TableHead className="px-6">{t("earnings_table_status")}</TableHead>
                <TableHead className="px-6">{t("earnings_table_date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="px-6 font-medium text-gray-900">{tx.order.title}</TableCell>
                  <TableCell className="px-6 text-gray-600">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell className="px-6 text-gray-600">{formatCurrency(tx.platformFee)}</TableCell>
                  <TableCell className="px-6 font-medium text-gray-900">{formatCurrency(tx.creatorPayout)}</TableCell>
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
