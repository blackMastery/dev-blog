'use server'

import { createClient } from '@/utils/supabase/server'
import type { Category, Tag, Comment } from '@/types/database'

export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return (data || []) as Category[]
}

export async function getTags() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }

  return (data || []) as Tag[]
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return null
  }

  return data as Category
}

export async function getTagBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return null
  }

  return data as Tag
}

export async function getCommentsByPostId(postId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles!comments_author_id_fkey(*)
    `)
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  const comments = (data || []) as Comment[]

  // Get replies for each comment
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const { data: replies } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles!comments_author_id_fkey(*)
        `)
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true })

      return {
        ...comment,
        replies: (replies || []) as Comment[],
      }
    })
  )

  return commentsWithReplies
}

export async function createComment(postId: string, content: string, parentId: string | null = null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      content,
      parent_id: parentId,
    })
    .select(`
      *,
      author:profiles!comments_author_id_fkey(*)
    `)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data: data as Comment }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify ownership
  const { data: comment } = await supabase
    .from('comments')
    .select('author_id, post_id')
    .eq('id', commentId)
    .single()

  if (!comment || comment.author_id !== user.id) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function toggleLike(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id)

    if (error) {
      return { error: error.message }
    }

    return { data: { liked: false } }
  } else {
    // Like
    const { error } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: user.id,
      })

    if (error) {
      return { error: error.message }
    }

    return { data: { liked: true } }
  }
}
