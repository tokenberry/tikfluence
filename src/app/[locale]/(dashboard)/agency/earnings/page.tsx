import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgencyEarningsPage() {
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
      <h1 className="text-3xl font-bold text-gray-900">Agency Earnings</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Platform Fees</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(totalPlatformFees)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Payouts</p>
          <p className="mt-2 text-2xl font-bold text-[#d4772c]">
            {formatCurrency(totalPayouts)}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No earnings yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Platform Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Payout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((tx) => (
                <tr key={tx.id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {tx.order.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatCurrency(tx.platformFee)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[#d4772c]">
                    {formatCurrency(tx.creatorPayout)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
