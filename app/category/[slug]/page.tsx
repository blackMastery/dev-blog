import { notFound } from 'next/navigation'
import { getCategoryBySlug } from '@/app/actions/categories'
import { getPublishedPosts } from '@/app/actions/posts'
import { PostCard } from '@/components/PostCard'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const { category } = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const { posts } = await getPublishedPosts(1, 12, slug)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              {category.description}
            </p>
          )}
        </div>
        {posts.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              No posts in this category yet.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

