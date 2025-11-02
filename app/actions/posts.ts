'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Post, PostWithDetails } from '@/types/database'

export async function getPosts(limit = 10, offset = 0, categoryId?: string, tagId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(*),
      category:categories(*),
      post_tags(tags(*))
    `)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  let posts = (data || []).map(post => ({
    ...post,
    tags: post.post_tags?.map((pt: any) => pt.tags).flat() || [],
    likes_count: 0,
    comments_count: 0,
  })) as Post[]

  // Filter by tag if specified
  if (tagId) {
    posts = posts.filter(post => 
      post.tags?.some(tag => tag.id === tagId)
    )
  }

  return posts
}

export async function getPostBySlug(slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(*),
      category:categories(*),
      post_tags(tags(*))
    `)
    .eq('slug', slug)
    .single()

  if (error || !post) {
    return null
  }

  // Check if user can view this post
  if (!post.published && (!user || post.author_id !== user.id)) {
    return null
  }

  // Get likes count
  const { count: likesCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)

  // Check if current user liked the post
  let isLiked = false
  if (user) {
    const { data: like } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .single()
    isLiked = !!like
  }

  // Get comments count
  const { count: commentsCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)

  // Increment view count
  await supabase.rpc('increment_post_views', { post_id: post.id })

  return {
    ...post,
    tags: post.post_tags?.map((pt: any) => pt.tags).flat() || [],
    likes_count: likesCount || 0,
    comments_count: commentsCount || 0,
    is_liked: isLiked,
  } as PostWithDetails
}

export async function getMyPosts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*),
      post_tags(tags(*))
    `)
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching my posts:', error)
    return []
  }

  return (data || []).map(post => ({
    ...post,
    tags: post.post_tags?.map((pt: any) => pt.tags).flat() || [],
  })) as Post[]
}

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const excerpt = formData.get('excerpt') as string
  const categoryId = formData.get('category_id') as string
  const featuredImage = formData.get('featured_image') as string
  const bannerImage = formData.get('banner_image') as string
  const published = formData.get('published') === 'true'
  const tagIds = formData.getAll('tags') as string[]

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      title,
      slug,
      content,
      excerpt: excerpt || null,
      category_id: categoryId || null,
      featured_image: featuredImage || null,
      banner_image: bannerImage || null,
      author_id: user.id,
      published,
      published_at: published ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (postError || !post) {
    return { error: postError?.message || 'Failed to create post' }
  }

  // Add tags if any
  if (tagIds.length > 0) {
    const postTags = tagIds.map(tagId => ({
      post_id: post.id,
      tag_id: tagId,
    }))

    await supabase.from('post_tags').insert(postTags)
  }

  revalidatePath('/')
  revalidatePath('/posts')
  return { data: post }
}

export async function updatePost(postId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify ownership
  const { data: existingPost } = await supabase
    .from('posts')
    .select('author_id, published_at')
    .eq('id', postId)
    .single()

  if (!existingPost || existingPost.author_id !== user.id) {
    return { error: 'Not authorized' }
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const excerpt = formData.get('excerpt') as string
  const categoryId = formData.get('category_id') as string
  const featuredImage = formData.get('featured_image') as string
  const bannerImage = formData.get('banner_image') as string
  const published = formData.get('published') === 'true'

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const updateData: any = {
    title,
    slug,
    content,
    excerpt: excerpt || null,
    category_id: categoryId || null,
    featured_image: featuredImage || null,
    banner_image: bannerImage || null,
    published,
  }

  if (published && !existingPost.published_at) {
    updateData.published_at = new Date().toISOString()
  }

  const { data: post, error: postError } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', postId)
    .select()
    .single()

  if (postError || !post) {
    return { error: postError?.message || 'Failed to update post' }
  }

  // Update tags
  const tagIds = formData.getAll('tags') as string[]
  await supabase.from('post_tags').delete().eq('post_id', postId)

  if (tagIds.length > 0) {
    const postTags = tagIds.map(tagId => ({
      post_id: post.id,
      tag_id: tagId,
    }))
    await supabase.from('post_tags').insert(postTags)
  }

  revalidatePath('/')
  revalidatePath(`/posts/${post.slug}`)
  return { data: post }
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify ownership
  const { data: post } = await supabase
    .from('posts')
    .select('author_id, slug')
    .eq('id', postId)
    .single()

  if (!post || post.author_id !== user.id) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/posts')
  return { success: true }
}
