'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { Comment as CommentType } from '@/types/database'
import { createComment, deleteComment } from '@/app/actions/blog'
import { useRouter } from 'next/navigation'

export function Comment({
  comment,
  postId,
  currentUserId,
}: {
  comment: CommentType & { replies?: CommentType[] }
  postId: string
  currentUserId?: string
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replying, setReplying] = useState(false)
  const router = useRouter()

  const handleReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setReplying(true)
    const formData = new FormData(e.currentTarget)
    const content = formData.get('content') as string

    const result = await createComment(postId, content, comment.id)
    if (!result.error) {
      setShowReplyForm(false)
      router.refresh()
    }
    setReplying(false)
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(comment.id)
      router.refresh()
    }
  }

  return (
    <div className="border-b border-zinc-200 py-4 last:border-0 dark:border-zinc-800">
      <div className="flex items-start gap-3">
        {comment.author?.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt={comment.author.username}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
            <span className="text-sm font-medium">
              {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-black dark:text-zinc-50">
              {comment.author?.full_name || comment.author?.username || 'Anonymous'}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{comment.content}</p>
          <div className="mt-2 flex items-center gap-4">
            {currentUserId && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Reply
              </button>
            )}
            {currentUserId === comment.author_id && (
              <button
                onClick={handleDelete}
                className="text-xs text-red-500 transition-colors hover:text-red-700"
              >
                Delete
              </button>
            )}
          </div>
          {showReplyForm && (
            <form onSubmit={handleReply} className="mt-3">
              <textarea
                name="content"
                required
                rows={3}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                placeholder="Write a reply..."
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={replying}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                >
                  {replying ? 'Posting...' : 'Post Reply'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-6 mt-4 space-y-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800">
              {comment.replies.map((reply) => (
                <Comment
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
