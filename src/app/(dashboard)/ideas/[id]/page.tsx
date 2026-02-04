"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CommentsSection } from "@/components/comments-section";
import { IdeaFormModal } from "@/components/idea-form-modal";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { ArrowLeft, Pencil, Trash2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Idea, Comment, RANKING_LABELS } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchIdea = useCallback(async () => {
    const [ideaResult, commentsResult] = await Promise.all([
      supabase.from("ideas").select("*").eq("id", id).single(),
      supabase
        .from("comments")
        .select("*")
        .eq("idea_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (ideaResult.error) {
      router.push("/ideas");
      return;
    }

    setIdea(ideaResult.data as Idea);
    setComments((commentsResult.data as Comment[]) ?? []);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchIdea();
  }, [fetchIdea]);

  function handleCommentAdded(comment: Comment) {
    setComments((prev) => [...prev, comment]);
  }

  async function handleEditSubmit(data: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    status: "new" | "evaluating" | "approved" | "archived";
    ranking: number;
  }) {
    if (!idea) return;

    const { error } = await supabase
      .from("ideas")
      .update({
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        ranking: data.ranking,
      })
      .eq("id", idea.id);

    if (error) {
      toast({
        title: "Error updating idea",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    setIdea({
      ...idea,
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      status: data.status,
      ranking: data.ranking,
      updated_at: new Date().toISOString(),
    });

    toast({
      title: "Idea updated",
      description: `"${data.title}" has been updated.`,
    });
  }

  async function handleDelete() {
    if (!idea) return;

    const { error } = await supabase
      .from("ideas")
      .delete()
      .eq("id", idea.id);

    if (error) {
      toast({
        title: "Error deleting idea",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Idea deleted",
      description: `"${idea.title}" has been removed.`,
    });
    router.push("/ideas");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading idea...</p>
      </div>
    );
  }

  if (!idea) return null;

  const ranking = idea.ranking ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/ideas")}
        className="gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Ideas
      </Button>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{idea.title}</h1>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFormOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{idea.status}</Badge>
          {idea.priority && (
            <Badge
              variant={
                idea.priority === "high" ? "destructive" : "secondary"
              }
            >
              {idea.priority} priority
            </Badge>
          )}
          {idea.source && (
            <Badge variant="outline">{idea.source}</Badge>
          )}
        </div>

        {ranking > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((v) => (
                <Star
                  key={v}
                  className={`h-4 w-4 ${
                    v <= ranking
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {RANKING_LABELS[ranking]}
            </span>
          </div>
        )}

        {idea.description && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm whitespace-pre-wrap">{idea.description}</p>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground">
          Created {new Date(idea.created_at).toLocaleDateString()} &middot;
          Updated {new Date(idea.updated_at).toLocaleDateString()}
        </div>
      </div>

      <div className="border-t pt-6">
        <CommentsSection
          comments={comments}
          ideaId={idea.id}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      <IdeaFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        idea={idea}
        onSubmit={handleEditSubmit}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Idea"
        description={`Are you sure you want to delete "${idea.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
