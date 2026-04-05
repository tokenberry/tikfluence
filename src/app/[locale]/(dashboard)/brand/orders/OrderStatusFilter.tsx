"use client";

import { useRouter } from "next/navigation";

const statuses = ["ALL", "DRAFT", "OPEN", "ASSIGNED", "IN_PROGRESS", "DELIVERED", "APPROVED", "COMPLETED", "DISPUTED", "CANCELLED"];

export default function OrderStatusFilter({ currentStatus }: { currentStatus: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => (
        <button
          key={s}
          onClick={() =>
            router.push(s === "ALL" ? "/brand/orders" : `/brand/orders?status=${s}`)
          }
          className={`rounded-full px-3 py-1 text-sm font-medium transition ${
            currentStatus === s
              ? "bg-[#d4772c] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {s.replace("_", " ")}
        </button>
      ))}
    </div>
  );
}
