import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NetworkEarningsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const network = await prisma.creatorNetwork.findUnique({
    where: { userId: session.user.id },
    include: { creators: { select: { id: true } } },
  });

  if (!network) redirect("/network/creators");

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

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    HELD: "bg-blue-100 text-blue-700",
    RELEASED: "bg-green-100 text-green-700",
    REFUNDED: "bg-gray-100 text-gray-700",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Network Earnings</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Payouts</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{formatCurrency(totalEarned)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pending</p>
          <p className="mt-1 text-3xl font-bold text-yellow-600">{formatCurrency(pendingPayout)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Creators</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{creatorIds.length}</p>
        </div>
      </div>

      {/* Stripe Connect */}
      {!network.stripeOnboarded && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-6">
          <h2 className="text-lg font-semibold text-yellow-800">Connect Your Stripe Account</h2>
          <p className="mt-1 text-sm text-yellow-700">
            Connect a Stripe account to manage payouts for your network.
          </p>
          <a
            href="/api/stripe/connect"
            className="mt-3 inline-block rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
          >
            Connect Stripe
          </a>
        </div>
      )}

      {/* Transactions */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">Order</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Amount</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Fee</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Payout</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{tx.order.title}</td>
                    <td className="px-6 py-4 text-gray-600">{formatCurrency(tx.amount)}</td>
                    <td className="px-6 py-4 text-gray-600">{formatCurrency(tx.platformFee)}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(tx.creatorPayout)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[tx.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
