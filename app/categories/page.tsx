import Link from 'next/link'
import { getCategories } from '@/app/actions/blog'

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-black dark:text-zinc-50 sm:text-5xl">
          Categories
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Browse posts by category
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">No categories yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="mb-2 text-xl font-semibold text-black transition-colors group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {category.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
