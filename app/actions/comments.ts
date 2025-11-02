'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function getPostComments(postId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles(id, username, full_name, avatar_url)
    `)
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return { comments: [], error }
  }

  // Get replies for each comment
  const commentsWithReplies = await Promise.all(
    data.map(async (comment) => {
      const { data: replies } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url)
        `)
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true })

      return {
        ...comment,
        replies: replies || [],
      }
    })
  )

  return { comments: commentsWithReplies, error: null }
}

export async function createComment(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { comment: null, error: { message: 'Unauthorized' } }
  }

  const postId = formData.get('post_id') as string
  const content = formData.get('content') as string
  const parentId = formData.get('parent_id') as string

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      content,
      parent_id: parentId || null,
    })
    .select(`
      *,
      author:profiles(id, username, full_name, avatar_url)
    `)
    .single()

  if (error) {
    return { comment: null, error }
  }

  revalidatePath(`/posts/${postId}`)
  return { comment, error: null }
}

export async function updateComment(commentId: string, content: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { comment: null, error: { message: 'Unauthorized' } }
  }

  // Verify ownership
  const { data: existingComment } = await supabase
    .from('comments')
    .select('author_id, post_id')
    .eq('id', commentId)
    .single()

  if (!existingComment || existingComment.author_id !== user.id) {
    return { comment: null, error: { message: 'Forbidden' } }
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .update({ content })
    .eq('id', commentId)
    .select(`
      *,
      author:profiles(id, username, full_name, avatar_url)
    `)
    .single()

  if (error) {
    return { comment: null, error }
  }

  revalidatePath(`/posts/${existingComment.post_id}`)
  return { comment, error: null }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { message: 'Unauthorized' } }
  }

  // Verify ownership
  const { data: existingComment } = await supabase
    .from('comments')
    .select('author_id, post_id')
    .eq('id', commentId)
    .single()

  if (!existingComment || existingComment.author_id !== user.id) {
    return { error: { message: 'Forbidden' } }
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    return { error }
  }

  revalidatePath(`/posts/${existingComment.post_id}`)
  return { error: null }
}

