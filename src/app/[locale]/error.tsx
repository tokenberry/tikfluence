"use client"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf6e3] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">500</h1>
        <p className="mt-4 text-xl text-gray-600">Something went wrong</p>
        <p className="mt-2 text-gray-500">An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          className="mt-8 inline-block rounded-lg bg-[#d4772c] px-6 py-3 text-sm font-medium text-white hover:bg-[#b85c1a] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
