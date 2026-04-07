import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge, OrderTypeBadge } from "@/components/ui/Badge";
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

export default async function AgencyOrdersPage() {
  const t = await getTranslations("agency");
  const session = await auth();
  if (!session?.user || session.user.role !== "AGENCY") redirect("/login");

  const agency = await prisma.agency.findUnique({
    where: { userId: session.user.id },
  });
  if (!agency) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { agencyId: agency.id },
    include: {
      brand: { select: { companyName: true } },
      category: { select: { name: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t("orders_title")}</h1>
        <a
          href="/agency/orders/new"
          className="rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a]"
        >
          {t("orders_create")}
        </a>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">{t("orders_empty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Title</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Brand</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Category</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Type</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Budget</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="px-6">
                    <a
                      href={`/agency/orders/${order.id}`}
                      className="font-medium text-gray-900 hover:text-[#d4772c]"
                    >
                      {order.title}
                    </a>
                    <p className="text-xs text-gray-500">
                      {order._count.assignments} assignment(s)
                    </p>
                  </TableCell>
                  <TableCell className="px-6 text-gray-600">{order.brand.companyName}</TableCell>
                  <TableCell className="px-6 text-gray-600">{order.category.name}</TableCell>
                  <TableCell className="px-6">
                    <OrderTypeBadge type={order.type} />
                  </TableCell>
                  <TableCell className="px-6">
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="px-6 text-gray-600">{formatCurrency(order.budget)}</TableCell>
                  <TableCell className="px-6 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
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
