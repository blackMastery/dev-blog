'use server'

import { createClient } from '@/utils/supabase/server'

export async function uploadImage(file: File, folder: string = 'banners') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', url: null }
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    return { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.', url: null }
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { error: 'File size too large. Maximum size is 5MB.', url: null }
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer()

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('post-images')
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    // Provide helpful error message for RLS policy violations
    if (error.message.includes('row-level security') || error.message.includes('policy')) {
      return { 
        error: 'Storage policy error. Please ensure the Supabase storage policies are set up. See files/storage_policies.sql for setup instructions.', 
        url: null 
      }
    }
    return { error: error.message, url: null }
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('post-images')
    .getPublicUrl(data.path)

  return { error: null, url: urlData.publicUrl }
}

