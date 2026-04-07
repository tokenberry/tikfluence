import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RequestBrandForm from "./RequestBrandForm";
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

export default async function AgencyBrandsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "AGENCY") redirect("/login");

  const t = await getTranslations("agency");

  const agency = await prisma.agency.findUnique({
    where: { userId: session.user.id },
  });
  if (!agency) redirect("/login");

  const agencyBrands = await prisma.agencyBrand.findMany({
    where: { agencyId: agency.id },
    include: {
      brand: {
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { orders: true } },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t("brands_title")}</h1>
        <RequestBrandForm />
      </div>

      {agencyBrands.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">{t("brands_empty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Company Name</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Industry</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Contact</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Orders</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 text-xs uppercase tracking-wider">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agencyBrands.map((ab) => (
                <TableRow key={ab.id}>
                  <TableCell className="px-6">
                    {ab.status === "APPROVED" ? (
                      <a
                        href={`/agency/brands/${ab.brand.id}`}
                        className="font-medium text-gray-900 hover:text-[#d4772c]"
                      >
                        {ab.brand.companyName}
                      </a>
                    ) : (
                      <span className="font-medium text-gray-400">
                        {ab.brand.companyName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 text-gray-600">{ab.brand.industry ?? "—"}</TableCell>
                  <TableCell className="px-6">
                    <p className="font-medium text-gray-900">{ab.brand.user.name ?? "—"}</p>
                    <p className="text-xs text-gray-500">{ab.brand.user.email}</p>
                  </TableCell>
                  <TableCell className="px-6 text-gray-600">{ab.brand._count.orders}</TableCell>
                  <TableCell className="px-6">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ab.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : ab.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {ab.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 text-gray-500">
                    {new Date(ab.addedAt).toLocaleDateString()}
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
