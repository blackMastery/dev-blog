import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getPosts } from '@/app/actions/posts'
import { PostCard } from '@/components/PostCard'

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  // Check if the param is a UUID (has dashes and is 36 chars) or a username
  const isUUID = username.includes('-') && username.length === 36

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq(isUUID ? 'id' : 'username', username)
    .single()

  if (error || !profile) {
    notFound()
  }

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const isOwnProfile = currentUser?.id === profile.id

  // Get user's posts (published or all if own profile)
  const { data: postsData } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*),
      post_tags(tags(*))
    `)
    .eq('author_id', profile.id)
    .eq('published', true)
    .order('published_at', { ascending: false })

  const posts = (postsData || []).map(post => ({
    ...post,
    tags: post.post_tags?.map((pt: any) => pt.tags).flat() || [],
    author: profile,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              width={128}
              height={128}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
              <span className="text-4xl font-medium">
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
              {profile.full_name || profile.username}
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-4 text-zinc-700 dark:text-zinc-300">{profile.bio}</p>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {profile.website}
              </a>
            )}
          </div>
          {isOwnProfile && (
            <Link
              href="/posts/new"
              className="rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              Write Post
            </Link>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">Posts</h2>
        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              {isOwnProfile ? "You haven't published any posts yet." : 'No posts yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
