import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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

export default async function NetworkEarningsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const network = await prisma.creatorNetwork.findUnique({
    where: { userId: session.user.id },
    include: { creators: { select: { id: true } } },
  });

  if (!network) redirect("/network/creators");

  const t = await getTranslations("network");

  const creatorIds = network.creators.map((c) => c.id);

  const transactions = await prisma.transaction.findMany({
    where: {
      order: {
        assignments: {
          some: {
            OR: [
              { networkId: network.id },
              { creatorId: { in: creatorIds } },
            ],
          },
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

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("earnings_title")}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">{t("earnings_revenue")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">{t("earnings_payouts")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-green-600">{formatCurrency(totalEarned)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">{t("earnings_pending")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-yellow-600">{formatCurrency(pendingPayout)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">{t("earnings_creators")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">{creatorIds.length}</p>
        </div>
      </div>

      {/* Payoneer Connect */}
      {!network.stripeOnboarded && (
        <Alert variant="warning" className="p-6">
          <AlertTitle className="text-base">{t("earnings_setup_title")}</AlertTitle>
          <AlertDescription>
            <p>{t("earnings_setup_desc")}</p>
            <a
              href="/api/payouts/onboard"
              className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              {t("earnings_connect")}
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Transactions */}
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
                <TableHead className="px-6">Order</TableHead>
                <TableHead className="px-6">Amount</TableHead>
                <TableHead className="px-6">Fee</TableHead>
                <TableHead className="px-6">Payout</TableHead>
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
