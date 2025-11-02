import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getPublishedPosts } from '@/app/actions/posts'
import { PostCard } from '@/components/PostCard'

interface TagPageProps {
  params: Promise<{ slug: string }>
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tag) {
    notFound()
  }

  // Get posts with this tag
  const { data: postTags } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tag.id)

  const postIds = postTags?.map((pt) => pt.post_id) || []

  if (postIds.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="mb-12 text-4xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            #{tag.name}
          </h1>
          <div className="text-center py-12">
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              No posts with this tag yet.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles(id, username, full_name, avatar_url),
      category:categories(id, name, slug),
      tags:post_tags(
        tag:tags(id, name, slug)
      )
    `)
    .in('id', postIds)
    .eq('published', true)
    .order('published_at', { ascending: false })

  const postsWithCounts = await Promise.all(
    (posts || []).map(async (post: any) => {
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)

      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)

      return {
        ...post,
        tags: post.tags?.map((pt: any) => pt.tag) || [],
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
      }
    })
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-12 text-4xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          #{tag.name}
        </h1>
        {postsWithCounts.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {postsWithCounts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              No posts with this tag yet.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

