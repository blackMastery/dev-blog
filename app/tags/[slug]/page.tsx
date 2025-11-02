import { notFound } from 'next/navigation'
import { getTagBySlug } from '@/app/actions/blog'
import { getPosts } from '@/app/actions/posts'
import { PostCard } from '@/components/PostCard'

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tag = await getTagBySlug(slug)

  if (!tag) {
    notFound()
  }

  const posts = await getPosts(20, 0, undefined, tag.id)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-black dark:text-zinc-50 sm:text-5xl">
          #{tag.name}
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Posts tagged with {tag.name}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">No posts with this tag yet.</p>
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
