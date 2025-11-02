import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getPostBySlug } from '@/app/actions/posts'
import { getCommentsByPostId } from '@/app/actions/blog'
import { createClient } from '@/utils/supabase/server'
import { Comment } from '@/components/Comment'
import { formatDistanceToNow } from 'date-fns'
import { LikeButton } from '@/components/LikeButton'
import { CommentForm } from '@/components/CommentForm'
import { EditButton } from './edit-button'


export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const comments = await getCommentsByPostId(post.id)

  return (
    <>
      {(post as any).banner_image && (
        <div className="relative h-64 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 sm:h-80 md:h-96">
          <Image
            src={(post as any).banner_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {post.featured_image && !(post as any).banner_image && (
          <div className="relative mb-8 h-64 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 sm:h-96">
            <Image src={post.featured_image} alt={post.title} fill className="object-cover" />
          </div>
        )}

        <header className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          {post.category && (
            <Link
              href={`/categories/${post.category.slug}`}
              className="rounded-full bg-zinc-100 px-3 py-1 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              {post.category.name}
            </Link>
          )}
          {post.published_at && (
            <span>{formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}</span>
          )}
          <span>{post.view_count} views</span>
        </div>
        <h1 className="mb-4 text-4xl font-bold text-black dark:text-zinc-50 sm:text-5xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-xl text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
        )}
        {post.author && (
          <div className="mt-6 flex items-center gap-3">
            {post.author.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt={post.author.username}
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                <span className="text-lg font-medium">
                  {post.author.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div>
              <Link
                href={`/profile/${post.author.username}`}
                className="font-semibold text-black hover:underline dark:text-zinc-50"
              >
                {post.author.full_name || post.author.username}
              </Link>
              {post.author.bio && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{post.author.bio}</p>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="mb-8 flex flex-wrap gap-2">
        {post.tags?.map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="text-sm text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            #{tag.name}
          </Link>
        ))}
      </div>

      <div className="mb-12 prose prose-zinc max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="text-black dark:text-zinc-50">{children}</h1>,
            h2: ({ children }) => <h2 className="text-black dark:text-zinc-50">{children}</h2>,
            h3: ({ children }) => <h3 className="text-black dark:text-zinc-50">{children}</h3>,
            a: ({ href, children }) => (
              <a href={href} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                {children}
              </a>
            ),
            code: ({ className, children }) => {
              const isInline = !className
              return isInline ? (
                <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-sm font-mono text-black dark:text-zinc-50">
                  {children}
                </code>
              ) : (
                <code className={className}>{children}</code>
              )
            },
            pre: ({ children }) => (
              <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto mb-4">
                {children}
              </pre>
            ),
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      <div className="mb-12 flex items-center justify-between border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <div className="flex items-center gap-6">
          <LikeButton postId={post.id} initialLiked={post.is_liked} likesCount={post.likes_count} />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>
        <EditButton postId={post.id} />
      </div>

      <section className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">Comments</h2>
        {user ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              href="/auth/signin"
              className="font-medium text-black hover:underline dark:text-zinc-50"
            >
              Sign in
            </Link>{' '}
            to join the conversation.
          </p>
        )}
        <div className="mt-8 space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-zinc-500 dark:text-zinc-400">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                postId={post.id}
                currentUserId={user?.id}
              />
            ))
          )}
        </div>
      </section>
    </article>
    </>
  )
}
