import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCategories, getTags } from '@/app/actions/blog'
import { getMyPosts } from '@/app/actions/posts'
import { PostForm } from '@/components/PostForm'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const myPosts = await getMyPosts()
  const post = myPosts.find(p => p.id === id)

  if (!post) {
    notFound()
  }

  const [categories, tags] = await Promise.all([getCategories(), getTags()])

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold text-black dark:text-zinc-50">Edit Post</h1>
      <PostForm categories={categories} tags={tags} post={post} />
    </div>
  )
}
