import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getPostBySlug } from '@/app/actions/posts'
import { getCategories } from '@/app/actions/categories'
import { getTags } from '@/app/actions/tags'
import { PostForm } from '@/components/PostForm'

interface EditPostPageProps {
  params: Promise<{ slug: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { post } = await getPostBySlug(slug, user.id)
  if (!post) {
    notFound()
  }

  if (post.author_id !== user.id) {
    redirect('/')
  }

  const { categories } = await getCategories()
  const { tags } = await getTags()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Edit Post
        </h1>
        <PostForm post={post} categories={categories} tags={tags} />
      </main>
    </div>
  )
}

