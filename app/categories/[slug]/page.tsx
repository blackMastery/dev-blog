import { notFound } from 'next/navigation'
import { getCategoryBySlug } from '@/app/actions/blog'
import { getPosts } from '@/app/actions/posts'
import { PostCard } from '@/components/PostCard'

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const posts = await getPosts(20, 0, category.id)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-black dark:text-zinc-50 sm:text-5xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">{category.description}</p>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">No posts in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
