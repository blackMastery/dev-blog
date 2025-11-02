import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
      <h1 className="text-6xl font-bold text-black dark:text-zinc-50">404</h1>
      <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
      >
        Go Home
      </Link>
    </div>
  )
}
