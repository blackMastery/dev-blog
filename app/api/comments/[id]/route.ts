import { NextRequest, NextResponse } from 'next/server'
import { deleteComment, updateComment } from '@/app/actions/comments'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error } = await deleteComment(id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { content } = await request.json()

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const { comment, error } = await updateComment(id, content)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comment })
}

