# Blog Database Schema for Supabase

A comprehensive database schema for building a full-featured blog application with Supabase.

## Overview

This schema provides a complete solution for a blog platform with the following features:
- User profiles with authentication
- Blog posts with categories and tags
- Nested comments system
- Post likes/reactions
- View counting
- Row Level Security (RLS) policies

## Tables

### 1. **profiles**
Extends Supabase's `auth.users` with additional profile information.

**Columns:**
- `id` (UUID, PK) - References auth.users
- `username` (TEXT, UNIQUE) - Unique username
- `full_name` (TEXT) - User's full name
- `avatar_url` (TEXT) - Profile picture URL
- `bio` (TEXT) - User biography
- `website` (TEXT) - Personal website
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2. **categories**
Organize posts into categories.

**Columns:**
- `id` (UUID, PK)
- `name` (TEXT, UNIQUE) - Category name
- `slug` (TEXT, UNIQUE) - URL-friendly slug
- `description` (TEXT) - Category description
- `created_at` (TIMESTAMPTZ)

### 3. **posts**
The main blog posts table.

**Columns:**
- `id` (UUID, PK)
- `title` (TEXT) - Post title
- `slug` (TEXT, UNIQUE) - URL-friendly slug
- `content` (TEXT) - Post content (Markdown/HTML)
- `excerpt` (TEXT) - Short summary
- `featured_image` (TEXT) - Featured image URL
- `author_id` (UUID, FK) - References profiles
- `category_id` (UUID, FK) - References categories
- `published` (BOOLEAN) - Publication status
- `published_at` (TIMESTAMPTZ) - Publication date
- `view_count` (INTEGER) - View counter
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 4. **tags**
Flexible tagging system for posts.

**Columns:**
- `id` (UUID, PK)
- `name` (TEXT, UNIQUE) - Tag name
- `slug` (TEXT, UNIQUE) - URL-friendly slug
- `created_at` (TIMESTAMPTZ)

### 5. **post_tags**
Junction table for many-to-many relationship between posts and tags.

**Columns:**
- `post_id` (UUID, FK) - References posts
- `tag_id` (UUID, FK) - References tags
- Primary Key: (post_id, tag_id)

### 6. **comments**
Hierarchical comments system supporting nested replies.

**Columns:**
- `id` (UUID, PK)
- `post_id` (UUID, FK) - References posts
- `author_id` (UUID, FK) - References profiles
- `content` (TEXT) - Comment content
- `parent_id` (UUID, FK) - References comments (for nested replies)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 7. **likes**
Track user likes/reactions on posts.

**Columns:**
- `id` (UUID, PK)
- `post_id` (UUID, FK) - References posts
- `user_id` (UUID, FK) - References profiles
- `created_at` (TIMESTAMPTZ)
- UNIQUE constraint: (post_id, user_id)

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

**Profiles:**
- Everyone can view all profiles
- Users can insert their own profile (backup for trigger)
- Users can only update their own profile

**Categories & Tags:**
- Everyone can view
- Authenticated users can create

**Posts:**
- Everyone can view published posts
- Authors can view their own unpublished posts
- Authors can create, update, and delete their own posts

**Comments:**
- Everyone can view comments
- Authenticated users can create comments
- Users can update/delete their own comments

**Likes:**
- Everyone can view likes
- Authenticated users can like/unlike posts

## Functions

### `update_updated_at()`
Automatically updates the `updated_at` timestamp on record updates.

### `increment_post_views(post_id UUID)`
Safely increments the view count for a post.

### `create_profile_for_user()`
Automatically creates a profile entry when a new user signs up. This trigger function:
- Extracts username from user metadata (or generates one from email)
- Extracts full_name and avatar_url from user metadata if provided
- Creates a profile record linked to the auth.users entry

## Triggers

### Automatic Profile Creation
When a user signs up via Supabase Auth, a profile is automatically created using the `on_auth_user_created` trigger. This eliminates the need to manually create profiles after signup.

## Installation

### 1. In Supabase Dashboard:

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `blog_schema.sql`
5. Run the query

### 2. Via Supabase CLI:

```bash
supabase db push
```

## Usage Examples

### User Signup (Profile Auto-Created)

When a user signs up, their profile is automatically created. You can pass metadata during signup:

```javascript
// Signup with metadata (recommended)
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      username: 'johndoe',
      full_name: 'John Doe',
      avatar_url: 'https://example.com/avatar.jpg'
    }
  }
});
// Profile is automatically created with this data!
```

### Update Profile

```sql
UPDATE profiles 
SET bio = 'Software developer and blogger',
    website = 'https://johndoe.com'
WHERE id = auth.uid();
```

### Create a Blog Post

```sql
INSERT INTO posts (title, slug, content, excerpt, author_id, category_id, published)
VALUES (
    'Getting Started with Supabase',
    'getting-started-with-supabase',
    'Full content here...',
    'Learn the basics of Supabase',
    auth.uid(),
    (SELECT id FROM categories WHERE slug = 'technology'),
    true
);
```

### Add Tags to a Post

```sql
INSERT INTO post_tags (post_id, tag_id)
VALUES 
    ('post-uuid', (SELECT id FROM tags WHERE slug = 'javascript')),
    ('post-uuid', (SELECT id FROM tags WHERE slug = 'tutorial'));
```

### Query Posts with Related Data

```sql
SELECT 
    p.*,
    prof.username as author_name,
    prof.avatar_url as author_avatar,
    c.name as category_name,
    COUNT(DISTINCT l.id) as like_count,
    COUNT(DISTINCT com.id) as comment_count
FROM posts p
LEFT JOIN profiles prof ON p.author_id = prof.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN comments com ON p.id = com.post_id
WHERE p.published = true
GROUP BY p.id, prof.username, prof.avatar_url, c.name
ORDER BY p.published_at DESC;
```

### Increment Post Views

```sql
SELECT increment_post_views('post-uuid-here');
```

## API Integration

### Using Supabase JavaScript Client

```javascript
// Fetch published posts with author info
const { data: posts } = await supabase
  .from('posts')
  .select(`
    *,
    profiles:author_id (username, avatar_url),
    categories (name, slug),
    post_tags (tags (name, slug))
  `)
  .eq('published', true)
  .order('published_at', { ascending: false });

// Create a new post
const { data: newPost } = await supabase
  .from('posts')
  .insert({
    title: 'My New Post',
    slug: 'my-new-post',
    content: 'Post content...',
    author_id: user.id,
    published: true
  });

// Add a comment
const { data: comment } = await supabase
  .from('comments')
  .insert({
    post_id: postId,
    author_id: user.id,
    content: 'Great post!'
  });

// Like a post
const { data: like } = await supabase
  .from('likes')
  .insert({
    post_id: postId,
    user_id: user.id
  });
```

## Indexes

The schema includes indexes on frequently queried columns:
- Post author, category, published status, and slug
- Comment post and author
- Likes post and user

## Extending the Schema

### Add a Draft/Schedule Feature

```sql
ALTER TABLE posts ADD COLUMN scheduled_for TIMESTAMPTZ;
```

### Add Post Status Enum

```sql
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
ALTER TABLE posts ALTER COLUMN published TYPE post_status USING 
  CASE WHEN published THEN 'published'::post_status ELSE 'draft'::post_status END;
```

### Add Full-Text Search

```sql
ALTER TABLE posts ADD COLUMN search_vector tsvector;

CREATE INDEX posts_search_idx ON posts USING gin(search_vector);

CREATE TRIGGER posts_search_update BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);
```

## Best Practices

1. **Always use slugs for URLs** - Never expose database IDs in URLs
2. **Use RLS policies** - Let Supabase handle authorization at the database level
3. **Validate slugs** - Ensure slugs are URL-friendly before insertion
4. **Set published_at** - Update this timestamp when publishing posts
5. **Use transactions** - When creating posts with tags, use transactions
6. **Cache strategically** - Cache category/tag lists as they change infrequently

## License

This schema is provided as-is for use in your projects.
