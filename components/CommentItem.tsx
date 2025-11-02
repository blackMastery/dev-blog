'use client'

import { useState, useEffect } from 'react'
import type { Comment } from '@/types/database'
import { CommentForm } from './CommentForm'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { deleteComment } from '@/app/actions/comments'

interface CommentItemProps {
  comment: Comment
  postId: string
  replyingTo: string | null
  setReplyingTo: (id: string | null) => void
  onSuccess?: () => void
}

export function CommentItem({
  comment,
  postId,
  replyingTo,
  setReplyingTo,
  onSuccess,
}: CommentItemProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkOwner() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsOwner(user?.id === comment.author_id)
    }
    checkOwner()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment.author_id])

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setIsDeleting(true)
    const { error } = await deleteComment(comment.id)
    if (!error) {
      onSuccess?.()
      router.refresh()
    }
    setIsDeleting(false)
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {comment.author?.full_name || comment.author?.username || 'Anonymous'}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
      <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">{comment.content}</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          {replyingTo === comment.id ? 'Cancel' : 'Reply'}
        </button>
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
      {replyingTo === comment.id && (
        <div className="mt-4 border-t pt-4 dark:border-zinc-800">
          <CommentForm postId={postId} parentId={comment.id} onSuccess={onSuccess} />
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4 border-t pt-4 dark:border-zinc-800">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {reply.author?.full_name || reply.author?.username || 'Anonymous'}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

