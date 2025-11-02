export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  featured_image: string | null
  banner_image: string | null
  author_id: string
  category_id: string | null
  published: boolean
  published_at: string | null
  view_count: number
  created_at: string
  updated_at: string
  author?: Profile
  category?: Category | null
  tags?: Tag[]
  likes_count?: number
  comments_count?: number
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  parent_id: string | null
  created_at: string
  updated_at: string
  author?: Profile
  replies?: Comment[]
}

export interface Like {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface PostWithDetails extends Post {
  author: Profile
  category: Category | null
  tags: Tag[]
  likes_count: number
  comments_count: number
  comments: Comment[]
  is_liked: boolean
}
