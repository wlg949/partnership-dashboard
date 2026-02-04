"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IdeaFormModal } from "@/components/idea-form-modal";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Plus, MessageSquare, Pencil, Trash2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Idea } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

const columns = [
  { id: "new" as const, label: "New", color: "bg-blue-500" },
  { id: "evaluating" as const, label: "Evaluating", color: "bg-yellow-500" },
  { id: "approved" as const, label: "Approved", color: "bg-green-500" },
  { id: "archived" as const, label: "Archived", color: "bg-gray-500" },
];

export default function IdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {}
  );

  // CRUD modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingIdea, setDeletingIdea] = useState<Idea | null>(null);

  const fetchIdeas = useCallback(async () => {
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ideas:", error);
    } else {
      setIdeas(data ?? []);
    }

    const { data: comments } = await supabase
      .from("comments")
      .select("idea_id");

    if (comments) {
      const counts: Record<string, number> = {};
      comments.forEach((c: { idea_id: string | null }) => {
        if (c.idea_id) {
          counts[c.idea_id] = (counts[c.idea_id] || 0) + 1;
        }
      });
      setCommentCounts(counts);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  // --- Create / Edit ---
  async function handleIdeaSubmit(data: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    status: "new" | "evaluating" | "approved" | "archived";
    ranking: number;
  }) {
    if (editingIdea) {
      // Optimistic update
      const previous = ideas;
      const updated: Idea = {
        ...editingIdea,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        ranking: data.ranking,
        updated_at: new Date().toISOString(),
      };
      setIdeas((prev) =>
        prev.map((i) => (i.id === editingIdea.id ? updated : i))
      );

      const { error } = await supabase
        .from("ideas")
        .update({
          title: data.title,
          description: data.description || null,
          priority: data.priority,
          status: data.status,
          ranking: data.ranking,
        })
        .eq("id", editingIdea.id);

      if (error) {
        setIdeas(previous);
        toast({
          title: "Error updating idea",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Idea updated",
        description: `"${data.title}" has been updated.`,
      });
    } else {
      // Create new
      const { data: newIdea, error } = await supabase
        .from("ideas")
        .insert({
          title: data.title,
          description: data.description || null,
          priority: data.priority,
          status: data.status,
          ranking: data.ranking,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error creating idea",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      setIdeas((prev) => [newIdea as Idea, ...prev]);
      toast({
        title: "Idea created",
        description: `"${data.title}" has been added to the board.`,
      });
    }
  }

  // --- Delete ---
  async function handleDeleteIdea() {
    if (!deletingIdea) return;

    const previous = ideas;
    setIdeas((prev) => prev.filter((i) => i.id !== deletingIdea.id));

    const { error } = await supabase
      .from("ideas")
      .delete()
      .eq("id", deletingIdea.id);

    if (error) {
      setIdeas(previous);
      toast({
        title: "Error deleting idea",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Idea deleted",
      description: `"${deletingIdea.title}" has been removed.`,
    });
  }

  function openNewIdea() {
    setEditingIdea(null);
    setFormOpen(true);
  }

  function openEditIdea(idea: Idea, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingIdea(idea);
    setFormOpen(true);
  }

  function openDeleteIdea(idea: Idea, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingIdea(idea);
    setDeleteOpen(true);
  }

  const getIdeasForColumn = (status: string) =>
    ideas.filter((idea) => idea.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading ideas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ideas</h1>
          <p className="text-muted-foreground">
            Kanban board for partnership ideas.
          </p>
        </div>
        <Button onClick={openNewIdea}>
          <Plus className="mr-2 h-4 w-4" />
          New Idea
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnIdeas = getIdeasForColumn(column.id);
          return (
            <div key={column.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${column.color}`} />
                <h2 className="text-sm font-semibold">{column.label}</h2>
                <Badge variant="secondary" className="ml-auto">
                  {columnIdeas.length}
                </Badge>
              </div>
              {columnIdeas.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex min-h-[200px] items-center justify-center p-6">
                    <p className="text-sm text-muted-foreground">
                      No ideas yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {columnIdeas.map((idea) => (
                    <Card
                      key={idea.id}
                      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                      onClick={() => router.push(`/ideas/${idea.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm">{idea.title}</h3>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => openEditIdea(idea, e)}
                              className="p-1 rounded hover:bg-muted"
                              title="Edit"
                            >
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </button>
                            <button
                              onClick={(e) => openDeleteIdea(idea, e)}
                              className="p-1 rounded hover:bg-destructive/10"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          </div>
                        </div>
                        {idea.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {idea.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {idea.priority && (
                            <Badge
                              variant={
                                idea.priority === "high"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {idea.priority}
                            </Badge>
                          )}
                          {idea.source && (
                            <Badge variant="outline" className="text-xs">
                              {idea.source}
                            </Badge>
                          )}
                          {(idea.ranking ?? 0) > 0 && (
                            <div className="flex items-center gap-0.5 ml-auto">
                              {[1, 2, 3, 4, 5].map((v) => (
                                <Star
                                  key={v}
                                  className={`h-3 w-3 ${
                                    v <= (idea.ranking ?? 0)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted-foreground/20"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                          {(commentCounts[idea.id] || 0) > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              <span className="text-xs">
                                {commentCounts[idea.id]}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      <IdeaFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        idea={editingIdea}
        onSubmit={handleIdeaSubmit}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Idea"
        description={`Are you sure you want to delete "${deletingIdea?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteIdea}
      />
    </div>
  );
}
