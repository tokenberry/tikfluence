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

export default async function AMOrdersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ACCOUNT_MANAGER")
    redirect("/login");

  const am = await prisma.accountManager.findUnique({
    where: { userId: session.user.id },
  });
  if (!am) redirect("/login");

  // Get all brand IDs assigned to this AM
  const assignedBrands = await prisma.accountManagerBrand.findMany({
    where: { accountManagerId: am.id },
    select: { brandId: true },
  });

  const brandIds = assignedBrands.map((ab) => ab.brandId);

  const t = await getTranslations("orders");

  const orders = await prisma.order.findMany({
    where: { brandId: { in: brandIds } },
    include: {
      brand: { select: { companyName: true } },
      category: { select: { name: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Client Orders</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No client orders yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Title</TableHead>
                <TableHead className="px-6">{t("brand_heading")}</TableHead>
                <TableHead className="px-6">{t("category_label")}</TableHead>
                <TableHead className="px-6">Type</TableHead>
                <TableHead className="px-6">Status</TableHead>
                <TableHead className="px-6">{t("budget_label")}</TableHead>
                <TableHead className="px-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="px-6 font-medium text-gray-900">{order.title}</TableCell>
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
        )}
      </div>
    </div>
  );
}
