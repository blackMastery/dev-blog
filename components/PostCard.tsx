'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Post } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

export function PostCard({ post }: { post: Post }) {
  const router = useRouter()
  const publishedDate = post.published_at
    ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
    : null

  const handleCategoryClick = (e: React.MouseEvent, slug: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/categories/${slug}`)
  }

  const handleTagClick = (e: React.MouseEvent, slug: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/tags/${slug}`)
  }

  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <Link href={`/posts/${post.slug}`}>
        {post.featured_image && (
          <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {post.category && (
              <span
                onClick={(e) => handleCategoryClick(e, post.category!.slug)}
                className="cursor-pointer rounded-full bg-zinc-100 px-3 py-1 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                {post.category.name}
              </span>
            )}
            {publishedDate && <span>{publishedDate}</span>}
          </div>
          <h2 className="mb-2 text-xl font-semibold text-black transition-colors group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mb-4 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
              {post.excerpt}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {post.tags?.map((tag) => (
              <span
                key={tag.id}
                onClick={(e) => handleTagClick(e, tag.slug)}
                className="cursor-pointer text-xs text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                #{tag.name}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            {post.author && (
              <div className="flex items-center gap-2">
                {post.author.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.username}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <span className="text-xs">
                      {post.author.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <span>{post.author.full_name || post.author.username}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
