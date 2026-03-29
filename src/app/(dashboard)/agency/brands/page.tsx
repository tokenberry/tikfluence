import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AgencyBrandsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "AGENCY") redirect("/login");

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
        <h1 className="text-3xl font-bold text-gray-900">Managed Brands</h1>
        <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
          Contact admin to link brands
        </span>
      </div>

      {agencyBrands.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No brands linked yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Added
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agencyBrands.map((ab) => (
                <tr key={ab.id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <a
                      href={`/agency/brands/${ab.brand.id}`}
                      className="font-medium text-gray-900 hover:text-[#d4772c]"
                    >
                      {ab.brand.companyName}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {ab.brand.industry ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {ab.brand.user.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">{ab.brand.user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {ab.brand._count.orders}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(ab.addedAt).toLocaleDateString()}
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
