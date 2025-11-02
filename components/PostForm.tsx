'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { createPost, updatePost } from '@/app/actions/posts'
import { uploadImage } from '@/app/actions/upload'
import type { Post, Category, Tag } from '@/types/database'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
})

export function PostForm({
  categories,
  tags,
  post,
}: {
  categories: Category[]
  tags: Tag[]
  post?: Post
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(post?.title || '')
  const [content, setContent] = useState(post?.content || '')
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image || '')
  const [bannerImage, setBannerImage] = useState((post as any)?.banner_image || '')
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>((post as any)?.banner_image || null)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [categoryId, setCategoryId] = useState(post?.category_id || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    post?.tags?.map(t => t.id) || []
  )
  const [published, setPublished] = useState(post?.published || false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark') || 
                window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    formData.append('excerpt', excerpt)
    formData.append('featured_image', featuredImage)
    formData.append('banner_image', bannerImage)
    formData.append('category_id', categoryId)
    formData.append('published', published.toString())
    selectedTags.forEach(tagId => formData.append('tags', tagId))

    startTransition(async () => {
      const result = post
        ? await updatePost(post.id, formData)
        : await createPost(formData)

      if (result.error) {
        alert(result.error)
        return
      }

      if (result.data) {
        router.push(`/posts/${result.data.slug}`)
      }
    })
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('File size too large. Maximum size is 5MB.')
      return
    }

    setBannerFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setBannerPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploadingBanner(true)
    const result = await uploadImage(file, 'banners')
    setIsUploadingBanner(false)

    if (result.error) {
      alert(result.error)
      console.log("🚀 ~ handleBannerFileChange ~ result.error:", result.error)
      setBannerFile(null)
      setBannerPreview(null)
      return
    }

    if (result.url) {
      setBannerImage(result.url)
    }
  }

  const handleRemoveBanner = () => {
    setBannerFile(null)
    setBannerPreview(null)
    setBannerImage('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Title
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          placeholder="Enter post title"
        />
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          placeholder="Brief description of your post"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Content (Markdown)
        </label>
        <div className="w-full" data-color-mode={isDark ? 'dark' : 'light'}>
          <MDEditor
            value={content}
            onChange={(value) => setContent(value || '')}
            preview="edit"
            visibleDragbar={false}
            height={400}
            textareaProps={{
              placeholder: 'Write your post content in Markdown',
              required: true,
            }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="banner_image" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Banner Image
        </label>
        {bannerPreview ? (
          <div className="relative mt-2 w-full overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-600">
            <div className="relative h-64 w-full sm:h-80">
              <Image
                src={bannerPreview}
                alt="Banner preview"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={handleRemoveBanner}
              className="absolute right-2 top-2 rounded-lg bg-black/70 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-black/90 dark:bg-zinc-900/70 dark:hover:bg-zinc-900/90"
            >
              Remove
            </button>
            {isUploadingBanner && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">
                  Uploading...
                </div>
              </div>
            )}
          </div>
        ) : (
          <label
            htmlFor="banner_image_input"
            className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-white px-6 py-8 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
          >
            <svg
              className="mb-4 h-12 w-12 text-zinc-400 dark:text-zinc-500"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-12l-3.172-3.172a4 4 0 00-5.656 0L28 8m8 8l-8-8m-8 8l8 8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Click to upload banner image
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              PNG, JPG, WebP or GIF (MAX. 5MB)
            </span>
            <input
              id="banner_image_input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleBannerFileChange}
              className="hidden"
              disabled={isUploadingBanner}
            />
          </label>
        )}
      </div>

      <div>
        <label htmlFor="featured_image" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Featured Image URL
        </label>
        <input
          id="featured_image"
          type="url"
          value={featuredImage}
          onChange={(e) => setFeaturedImage(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Category
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'bg-black text-white dark:bg-zinc-50 dark:text-black'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="published"
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black dark:border-zinc-600 dark:focus:ring-zinc-400"
        />
        <label htmlFor="published" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Publish immediately
        </label>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
