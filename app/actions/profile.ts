'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function getProfile(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { profile: data, error }
}

export async function getCurrentUserProfile() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { profile: null, error: { message: 'Unauthorized' } }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { profile: data, error }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { profile: null, error: { message: 'Unauthorized' } }
  }

  const username = formData.get('username') as string
  const fullName = formData.get('full_name') as string
  const bio = formData.get('bio') as string
  const website = formData.get('website') as string
  const avatarUrl = formData.get('avatar_url') as string

  const { data, error } = await supabase
    .from('profiles')
    .update({
      username,
      full_name: fullName || null,
      bio: bio || null,
      website: website || null,
      avatar_url: avatarUrl || null,
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return { profile: null, error }
  }

  revalidatePath('/')
  return { profile: data, error: null }
}

