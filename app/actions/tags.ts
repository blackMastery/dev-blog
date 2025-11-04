'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTags() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  return { tags: data || [], error }
}

export async function createTag(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (!name || name.trim().length === 0) {
    return { error: 'Tag name is required' }
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  if (slug.length === 0) {
    return { error: 'Invalid tag name' }
  }

  // Check if tag with same name or slug already exists
  const trimmedName = name.trim()
  
  // Check by name (case-insensitive)
  const { data: byName } = await supabase
    .from('tags')
    .select('id, name, slug')
    .ilike('name', trimmedName)
    .maybeSingle()
  
  if (byName) {
    return { data: byName, error: null }
  }

  // Check by slug
  const { data: bySlug } = await supabase
    .from('tags')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()
  
  if (bySlug) {
    return { data: bySlug, error: null }
  }

  // Create new tag
  const { data: tag, error } = await supabase
    .from('tags')
    .insert({
      name: name.trim(),
      slug,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message || 'Failed to create tag' }
  }

  revalidatePath('/posts')
  revalidatePath('/tags')
  return { data: tag, error: null }
}

