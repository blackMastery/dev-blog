'use server'

import { createClient } from '@/utils/supabase/server'

export async function getTags() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  return { tags: data || [], error }
}

