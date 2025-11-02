'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function toggleLike(postId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { message: 'Unauthorized' } }
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
      .eq('post_id', postId)
      .eq('user_id', user.id)

    if (error) {
      return { error }
    }
  } else {
    // Like
    const { error } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: user.id,
      })

    if (error) {
      return { error }
    }
  }

  // Get post slug for revalidation
  const { data: post } = await supabase
    .from('posts')
    .select('slug')
    .eq('id', postId)
    .single()

  if (post) {
    revalidatePath(`/posts/${post.slug}`)
    revalidatePath('/')
  }

  return { error: null }
}

