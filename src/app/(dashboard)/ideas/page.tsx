"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CommentsSection } from "@/components/comments-section";
import { Plus, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Idea, Comment } from "@/lib/types";

const columns = [
  { id: "new" as const, label: "New", color: "bg-blue-500" },
  { id: "evaluating" as const, label: "Evaluating", color: "bg-yellow-500" },
  { id: "approved" as const, label: "Approved", color: "bg-green-500" },
  { id: "archived" as const, label: "Archived", color: "bg-gray-500" },
];

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [ideaComments, setIdeaComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    async function fetchIdeas() {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching ideas:", error);
      } else {
        setIdeas(data ?? []);
      }

      // Fetch comment counts per idea
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
    }

    fetchIdeas();
  }, []);

  async function openIdeaDetail(idea: Idea) {
    setSelectedIdea(idea);
    setLoadingComments(true);

    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("idea_id", idea.id)
      .order("created_at", { ascending: true });

    setIdeaComments((data as Comment[]) ?? []);
    setLoadingComments(false);
  }

  function handleCommentAdded(comment: Comment) {
    setIdeaComments((prev) => [...prev, comment]);
    if (selectedIdea) {
      setCommentCounts((prev) => ({
        ...prev,
        [selectedIdea.id]: (prev[selectedIdea.id] || 0) + 1,
      }));
    }
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
        <Button>
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
                      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                      onClick={() => openIdeaDetail(idea)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-medium text-sm">{idea.title}</h3>
                        {idea.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {idea.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
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
                          {(commentCounts[idea.id] || 0) > 0 && (
                            <div className="flex items-center gap-1 ml-auto text-muted-foreground">
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

      <Dialog
        open={!!selectedIdea}
        onOpenChange={(open) => !open && setSelectedIdea(null)}
      >
        <DialogContent className="max-w-md">
          {selectedIdea && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedIdea.title}</DialogTitle>
                <DialogDescription>
                  {selectedIdea.description || "No description"}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2">
                {selectedIdea.priority && (
                  <Badge
                    variant={
                      selectedIdea.priority === "high"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {selectedIdea.priority}
                  </Badge>
                )}
                <Badge variant="outline">{selectedIdea.status}</Badge>
                {selectedIdea.source && (
                  <Badge variant="outline">{selectedIdea.source}</Badge>
                )}
              </div>
              <div className="border-t pt-3">
                {loadingComments ? (
                  <p className="text-xs text-muted-foreground">
                    Loading comments...
                  </p>
                ) : (
                  <CommentsSection
                    comments={ideaComments}
                    ideaId={selectedIdea.id}
                    onCommentAdded={handleCommentAdded}
                  />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
