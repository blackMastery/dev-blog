'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Comment } from '@/types/database'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { getPostComments } from '@/app/actions/comments'

interface CommentListProps {
  comments: Comment[]
  postId: string
}

export function CommentList({ comments: initialComments, postId }: CommentListProps) {
  const router = useRouter()
  const [comments, setComments] = useState(initialComments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  async function handleCommentSuccess() {
    // Refresh comments by refetching
    const { comments: refreshedComments } = await getPostComments(postId)
    setComments(refreshedComments)
    setReplyingTo(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <CommentForm postId={postId} onSuccess={handleCommentSuccess} />
      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            onSuccess={handleCommentSuccess}
          />
        ))}
      </div>
      {comments.length === 0 && (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  )
}

