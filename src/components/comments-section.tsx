"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Comment } from "@/lib/types";
import { MessageSquare, Send } from "lucide-react";

interface CommentsSectionProps {
  comments: Comment[];
  ideaId?: string;
  projectId?: string;
  onCommentAdded: (comment: Comment) => void;
}

export function CommentsSection({
  comments,
  ideaId,
  projectId,
  onCommentAdded,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [author, setAuthor] = useState<"Richard" | "Shaka">("Richard");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({
        content: newComment.trim(),
        author,
        idea_id: ideaId || null,
        project_id: projectId || null,
      })
      .select()
      .single();

    if (!error && data) {
      onCommentAdded(data as Comment);
      setNewComment("");
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4" />
        Comments ({comments.length})
      </div>

      {comments.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          No comments yet. Start the conversation.
        </p>
      ) : (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-md border p-2 text-sm space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs">{comment.author}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <select
          value={author}
          onChange={(e) => setAuthor(e.target.value as "Richard" | "Shaka")}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-xs"
        >
          <option value="Richard">Richard</option>
          <option value="Shaka">Shaka</option>
        </select>
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="text-xs"
        />
        <Button type="submit" size="sm" disabled={submitting || !newComment.trim()}>
          <Send className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
}
