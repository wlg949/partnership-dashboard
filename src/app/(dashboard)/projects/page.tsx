"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectFormModal } from "@/components/project-form-modal";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Plus, MessageSquare, Pencil, Trash2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Project } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

const columns = [
  { id: "planning" as const, label: "Planning", color: "bg-purple-500" },
  { id: "in-progress" as const, label: "In Progress", color: "bg-blue-500" },
  { id: "review" as const, label: "Review", color: "bg-yellow-500" },
  { id: "complete" as const, label: "Complete", color: "bg-green-500" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {}
  );

  // CRUD modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
    } else {
      setProjects(data ?? []);
    }

    const { data: comments } = await supabase
      .from("comments")
      .select("project_id");

    if (comments) {
      const counts: Record<string, number> = {};
      comments.forEach((c: { project_id: string | null }) => {
        if (c.project_id) {
          counts[c.project_id] = (counts[c.project_id] || 0) + 1;
        }
      });
      setCommentCounts(counts);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // --- Create / Edit ---
  async function handleProjectSubmit(data: {
    name: string;
    description: string;
    status: "planning" | "in-progress" | "review" | "complete";
    ranking: number;
    github_url: string;
    dashboard_url: string;
  }) {
    if (editingProject) {
      // Optimistic update
      const previous = projects;
      const updated: Project = {
        ...editingProject,
        name: data.name,
        description: data.description || null,
        status: data.status,
        ranking: data.ranking,
        github_url: data.github_url || null,
        dashboard_url: data.dashboard_url || null,
        updated_at: new Date().toISOString(),
      };
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? updated : p))
      );

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
        .eq("id", editingProject.id);

      if (error) {
        setProjects(previous);
        toast({
          title: "Error updating project",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Project updated",
        description: `"${data.name}" has been updated.`,
      });
    } else {
      // Create new
      const { data: newProject, error } = await supabase
        .from("projects")
        .insert({
          name: data.name,
          description: data.description || null,
          status: data.status,
          ranking: data.ranking,
          github_url: data.github_url || null,
          dashboard_url: data.dashboard_url || null,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error creating project",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      setProjects((prev) => [newProject as Project, ...prev]);
      toast({
        title: "Project created",
        description: `"${data.name}" has been added to the board.`,
      });
    }
  }

  // --- Delete ---
  async function handleDeleteProject() {
    if (!deletingProject) return;

    const previous = projects;
    setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", deletingProject.id);

    if (error) {
      setProjects(previous);
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Project deleted",
      description: `"${deletingProject.name}" has been removed.`,
    });
  }

  function openNewProject() {
    setEditingProject(null);
    setFormOpen(true);
  }

  function openEditProject(project: Project, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingProject(project);
    setFormOpen(true);
  }

  function openDeleteProject(project: Project, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingProject(project);
    setDeleteOpen(true);
  }

  const getProjectsForColumn = (status: string) =>
    projects.filter((project) => project.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Track collaborative partnership projects.
          </p>
        </div>
        <Button onClick={openNewProject}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnProjects = getProjectsForColumn(column.id);
          return (
            <div key={column.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${column.color}`} />
                <h2 className="text-sm font-semibold">{column.label}</h2>
                <Badge variant="secondary" className="ml-auto">
                  {columnProjects.length}
                </Badge>
              </div>
              {columnProjects.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex min-h-[200px] items-center justify-center p-6">
                    <p className="text-sm text-muted-foreground">
                      No projects yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {columnProjects.map((project) => (
                    <Card
                      key={project.id}
                      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm">
                            {project.name}
                          </h3>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => openEditProject(project, e)}
                              className="p-1 rounded hover:bg-muted"
                              title="Edit"
                            >
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </button>
                            <button
                              onClick={(e) => openDeleteProject(project, e)}
                              className="p-1 rounded hover:bg-destructive/10"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          </div>
                        </div>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {project.github_url && (
                            <Badge variant="outline" className="text-xs">
                              GitHub
                            </Badge>
                          )}
                          {project.dashboard_url && (
                            <Badge variant="outline" className="text-xs">
                              Dashboard
                            </Badge>
                          )}
                          {(project.ranking ?? 0) > 0 && (
                            <div className="flex items-center gap-0.5 ml-auto">
                              {[1, 2, 3, 4, 5].map((v) => (
                                <Star
                                  key={v}
                                  className={`h-3 w-3 ${
                                    v <= (project.ranking ?? 0)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted-foreground/20"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                          {(commentCounts[project.id] || 0) > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              <span className="text-xs">
                                {commentCounts[project.id]}
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
      <ProjectFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
        onSubmit={handleProjectSubmit}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${deletingProject?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}
