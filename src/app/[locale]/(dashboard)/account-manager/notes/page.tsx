import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AMNotesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ACCOUNT_MANAGER")
    redirect("/login");

  const am = await prisma.accountManager.findUnique({
    where: { userId: session.user.id },
  });
  if (!am) redirect("/login");

  const notes = await prisma.internalNote.findMany({
    where: { accountManagerId: am.id },
    orderBy: { createdAt: "desc" },
    include: {
      brand: { select: { companyName: true } },
      agency: { select: { companyName: true } },
      creator: { include: { user: { select: { name: true } } } },
      order: { select: { title: true } },
    },
  });

  function noteContext(note: (typeof notes)[number]): string {
    const parts: string[] = [];
    if (note.brand) parts.push(`Brand: ${note.brand.companyName}`);
    if (note.agency) parts.push(`Agency: ${note.agency.companyName}`);
    if (note.creator)
      parts.push(`Creator: ${note.creator.user.name ?? "Unknown"}`);
    if (note.order) parts.push(`Order: ${note.order.title}`);
    return parts.join(" · ") || "General";
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Internal Notes</h1>

      {notes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No notes yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {noteContext(note)}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(note.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-900 whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
