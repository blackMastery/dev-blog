'use client'

import { useState, useTransition } from 'react'
import { toggleLike } from '@/app/actions/blog'
import { useRouter } from 'next/navigation'

export function LikeButton({
  postId,
  initialLiked,
  likesCount: initialLikesCount,
}: {
  postId: string
  initialLiked: boolean
  likesCount: number
}) {
  const [liked, setLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleLike(postId)
      if (!result.error && result.data) {
        setLiked(result.data.liked)
        setLikesCount((prev) => (result.data.liked ? prev + 1 : prev - 1))
        router.refresh()
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        liked
          ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
      }`}
    >
      <svg
        className={`h-5 w-5 ${liked ? 'fill-current' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{likesCount}</span>
    </button>
  )
}
