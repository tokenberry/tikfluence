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
import AddNoteForm from "./AddNoteForm";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AMClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;

  const session = await auth();
  if (!session?.user || session.user.role !== "ACCOUNT_MANAGER")
    redirect("/login");

  const am = await prisma.accountManager.findUnique({
    where: { userId: session.user.id },
  });
  if (!am) redirect("/login");

  const t = await getTranslations("orders");
  const tAgency = await getTranslations("agency");

  if (type === "brand") {
    // Verify assignment
    const assignment = await prisma.accountManagerBrand.findUnique({
      where: {
        accountManagerId_brandId: { accountManagerId: am.id, brandId: id },
      },
    });
    if (!assignment) redirect("/account-manager/clients");

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!brand) redirect("/account-manager/clients");

    const orders = await prisma.order.findMany({
      where: { brandId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const notes = await prisma.internalNote.findMany({
      where: { accountManagerId: am.id, brandId: id },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <a
          href="/account-manager/clients"
          className="text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Clients
        </a>

        {/* Brand Info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            {brand.companyName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {brand.industry ?? "No industry specified"}
          </p>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Contact:</span>{" "}
              {brand.user.name ?? "—"} ({brand.user.email})
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Recent Orders
          </h2>
          {orders.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <p className="text-gray-500">No orders yet for this brand.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6">Title</TableHead>
                    <TableHead className="px-6">Status</TableHead>
                    <TableHead className="px-6">Type</TableHead>
                    <TableHead className="px-6">{t("budget_label")}</TableHead>
                    <TableHead className="px-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="px-6 font-medium text-gray-900">{order.title}</TableCell>
                      <TableCell className="px-6">
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="px-6">
                        <OrderTypeBadge type={order.type} />
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

        {/* Internal Notes */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Internal Notes
          </h2>

          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              Add Note
            </h3>
            <AddNoteForm brandId={brand.id} />
          </div>

          {notes.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <p className="text-gray-500">No notes yet for this client.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === "agency") {
    // Verify assignment
    const assignment = await prisma.accountManagerAgency.findUnique({
      where: {
        accountManagerId_agencyId: {
          accountManagerId: am.id,
          agencyId: id,
        },
      },
    });
    if (!assignment) redirect("/account-manager/clients");

    const agency = await prisma.agency.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        managedBrands: {
          include: { brand: { select: { companyName: true } } },
        },
      },
    });
    if (!agency) redirect("/account-manager/clients");

    const notes = await prisma.internalNote.findMany({
      where: { accountManagerId: am.id, agencyId: id },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <a
          href="/account-manager/clients"
          className="text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Clients
        </a>

        {/* Agency Info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            {agency.companyName}
          </h1>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Contact:</span>{" "}
              {agency.user.name ?? "—"} ({agency.user.email})
            </p>
          </div>
        </div>

        {/* Managed Brands */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            {tAgency("brands_title")}
          </h2>
          {agency.managedBrands.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <p className="text-gray-500">
                No brands managed by this agency.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {agency.managedBrands.map((ab) => (
                <div
                  key={ab.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="font-medium text-gray-900">
                    {ab.brand.companyName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Internal Notes */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Internal Notes
          </h2>

          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              Add Note
            </h3>
            <AddNoteForm agencyId={agency.id} />
          </div>

          {notes.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <p className="text-gray-500">No notes yet for this client.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Invalid type parameter
  redirect("/account-manager/clients");
}
