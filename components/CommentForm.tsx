'use client'

import { useState, useTransition } from 'react'
import { createComment } from '@/app/actions/blog'
import { useRouter } from 'next/navigation'

export function CommentForm({ postId }: { postId: string }) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      const result = await createComment(postId, content)
      if (!result.error) {
        setContent('')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={4}
        placeholder="Write a comment..."
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="rounded-lg bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  )
}
