import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">Blog</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Share your thoughts and connect with readers.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-black dark:text-zinc-50">Navigation</h4>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/" className="transition-colors hover:text-black dark:hover:text-zinc-50">
                  Posts
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="transition-colors hover:text-black dark:hover:text-zinc-50"
                >
                  Categories
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-black dark:text-zinc-50">Account</h4>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link
                  href="/auth/signin"
                  className="transition-colors hover:text-black dark:hover:text-zinc-50"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <p>&copy; {new Date().getFullYear()} Blog. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
