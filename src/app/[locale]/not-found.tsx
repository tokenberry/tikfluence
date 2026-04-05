import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf6e3] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Page not found</p>
        <p className="mt-2 text-gray-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-[#d4772c] px-6 py-3 text-sm font-medium text-white hover:bg-[#b85c1a] transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
