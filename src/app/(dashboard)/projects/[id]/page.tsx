"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CommentsSection } from "@/components/comments-section";
import { ProjectFormModal } from "@/components/project-form-modal";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { ArrowLeft, Pencil, Trash2, Star, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Project, Comment, RANKING_LABELS } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchProject = useCallback(async () => {
    const [projectResult, commentsResult] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase
        .from("comments")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (projectResult.error) {
      router.push("/projects");
      return;
    }

    setProject(projectResult.data as Project);
    setComments((commentsResult.data as Comment[]) ?? []);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  function handleCommentAdded(comment: Comment) {
    setComments((prev) => [...prev, comment]);
  }

  async function handleEditSubmit(data: {
    name: string;
    description: string;
    status: "planning" | "in-progress" | "review" | "complete";
    ranking: number;
    github_url: string;
    dashboard_url: string;
  }) {
    if (!project) return;

    const { error } = await supabase
      .from("projects")
      .update({
        name: data.name,
        description: data.description || null,
        status: data.status,
        ranking: data.ranking,
        github_url: data.github_url || null,
        dashboard_url: data.dashboard_url || null,
      })
      .eq("id", project.id);

    if (error) {
      toast({
        title: "Error updating project",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    setProject({
      ...project,
      name: data.name,
      description: data.description || null,
      status: data.status,
      ranking: data.ranking,
      github_url: data.github_url || null,
      dashboard_url: data.dashboard_url || null,
      updated_at: new Date().toISOString(),
    });

    toast({
      title: "Project updated",
      description: `"${data.name}" has been updated.`,
    });
  }

  async function handleDelete() {
    if (!project) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Project deleted",
      description: `"${project.name}" has been removed.`,
    });
    router.push("/projects");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) return null;

  const ranking = project.ranking ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/projects")}
        className="gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Button>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
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
          <Badge variant="outline">{project.status}</Badge>
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

        {project.description && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm whitespace-pre-wrap">
                {project.description}
              </p>
            </CardContent>
          </Card>
        )}

        {(project.github_url || project.dashboard_url) && (
          <div className="flex items-center gap-3">
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                GitHub
              </a>
            )}
            {project.dashboard_url && (
              <a
                href={project.dashboard_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Live Dashboard
              </a>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Created {new Date(project.created_at).toLocaleDateString()} &middot;
          Updated {new Date(project.updated_at).toLocaleDateString()}
        </div>
      </div>

      <div className="border-t pt-6">
        <CommentsSection
          comments={comments}
          projectId={project.id}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      <ProjectFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        project={project}
        onSubmit={handleEditSubmit}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
