import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AMClientsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ACCOUNT_MANAGER")
    redirect("/login");

  const am = await prisma.accountManager.findUnique({
    where: { userId: session.user.id },
  });
  if (!am) redirect("/login");

  const assignedBrands = await prisma.accountManagerBrand.findMany({
    where: { accountManagerId: am.id },
    include: {
      brand: {
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { orders: true } },
        },
      },
    },
    orderBy: { priority: "desc" },
  });

  const assignedAgencies = await prisma.accountManagerAgency.findMany({
    where: { accountManagerId: am.id },
    include: {
      agency: {
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { managedBrands: true } },
        },
      },
    },
    orderBy: { priority: "desc" },
  });

  const priorityBadge = (priority: number) => {
    if (priority >= 2)
      return (
        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
          VIP
        </span>
      );
    if (priority === 1)
      return (
        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
          High
        </span>
      );
    return (
      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
        Normal
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <h1 className="text-3xl font-bold text-gray-900">My Clients</h1>

      {/* Brands Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Brands</h2>
        {assignedBrands.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">No brands assigned yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignedBrands.map(({ brand, priority }) => (
              <a
                key={brand.id}
                href={`/account-manager/clients/${brand.id}?type=brand`}
                className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#d4772c] hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {brand.companyName}
                  </h3>
                  {priorityBadge(priority)}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {brand.industry ?? "No industry"}
                </p>
                <div className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-700">Contact:</span>{" "}
                    {brand.user.name ?? "—"} ({brand.user.email})
                  </p>
                  <p className="mt-1">
                    <span className="font-medium text-gray-700">Orders:</span>{" "}
                    {brand._count.orders}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Agencies Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Agencies</h2>
        {assignedAgencies.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">No agencies assigned yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignedAgencies.map(({ agency, priority }) => (
              <a
                key={agency.id}
                href={`/account-manager/clients/${agency.id}?type=agency`}
                className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#d4772c] hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {agency.companyName}
                  </h3>
                  {priorityBadge(priority)}
                </div>
                <div className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-700">Contact:</span>{" "}
                    {agency.user.name ?? "—"} ({agency.user.email})
                  </p>
                  <p className="mt-1">
                    <span className="font-medium text-gray-700">
                      Managed Brands:
                    </span>{" "}
                    {agency._count.managedBrands}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
