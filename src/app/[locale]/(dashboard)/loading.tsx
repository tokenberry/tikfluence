export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-lg bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-200" />
        </div>
        <div className="h-8 w-24 rounded-full bg-gray-200" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="mt-2 h-6 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Content block skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-3">
        <div className="h-5 w-32 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
      </div>

      {/* List skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="h-5 w-40 rounded bg-gray-200" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-200" />
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
