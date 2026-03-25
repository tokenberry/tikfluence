import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const transactions = await prisma.transaction.findMany({
    include: {
      order: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    HELD: "bg-blue-100 text-blue-700",
    RELEASED: "bg-green-100 text-green-700",
    REFUNDED: "bg-gray-100 text-gray-700",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">Order</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Amount</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Platform Fee</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Creator Payout</th>
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
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatCurrency(tx.creatorPayout)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[tx.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
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
