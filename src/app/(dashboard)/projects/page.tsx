"use client";

import { useEffect, useState, useCallback } from "react";
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
import { ProjectFormModal } from "@/components/project-form-modal";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Plus, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Project, Comment } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

const columns = [
  { id: "planning" as const, label: "Planning", color: "bg-purple-500" },
  { id: "in-progress" as const, label: "In Progress", color: "bg-blue-500" },
  { id: "review" as const, label: "Review", color: "bg-yellow-500" },
  { id: "complete" as const, label: "Complete", color: "bg-green-500" },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {}
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectComments, setProjectComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

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

  async function openProjectDetail(project: Project) {
    setSelectedProject(project);
    setLoadingComments(true);

    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true });

    setProjectComments((data as Comment[]) ?? []);
    setLoadingComments(false);
  }

  function handleCommentAdded(comment: Comment) {
    setProjectComments((prev) => [...prev, comment]);
    if (selectedProject) {
      setCommentCounts((prev) => ({
        ...prev,
        [selectedProject.id]: (prev[selectedProject.id] || 0) + 1,
      }));
    }
  }

  // --- Create / Edit ---
  async function handleProjectSubmit(data: {
    name: string;
    description: string;
    status: "planning" | "in-progress" | "review" | "complete";
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
        github_url: data.github_url || null,
        dashboard_url: data.dashboard_url || null,
        updated_at: new Date().toISOString(),
      };
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? updated : p))
      );
      if (selectedProject?.id === editingProject.id) {
        setSelectedProject(updated);
      }

      const { error } = await supabase
        .from("projects")
        .update({
          name: data.name,
          description: data.description || null,
          status: data.status,
          github_url: data.github_url || null,
          dashboard_url: data.dashboard_url || null,
        })
        .eq("id", editingProject.id);

      if (error) {
        setProjects(previous);
        if (selectedProject?.id === editingProject.id) {
          setSelectedProject(editingProject);
        }
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
    if (selectedProject?.id === deletingProject.id) {
      setSelectedProject(null);
    }

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
                      onClick={() => openProjectDetail(project)}
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
                        <div className="flex items-center gap-2 mt-2">
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
                          {(commentCounts[project.id] || 0) > 0 && (
                            <div className="flex items-center gap-1 ml-auto text-muted-foreground">
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

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      >
        <DialogContent className="max-w-md">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-2 pr-6">
                  <DialogTitle>{selectedProject.name}</DialogTitle>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        setSelectedProject(null);
                        openEditProject(selectedProject, e);
                      }}
                      className="p-1 rounded hover:bg-muted"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => {
                        openDeleteProject(selectedProject, e);
                      }}
                      className="p-1 rounded hover:bg-destructive/10"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
                <DialogDescription>
                  {selectedProject.description || "No description"}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{selectedProject.status}</Badge>
                {selectedProject.github_url && (
                  <a
                    href={selectedProject.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge variant="secondary" className="cursor-pointer">
                      GitHub
                    </Badge>
                  </a>
                )}
                {selectedProject.dashboard_url && (
                  <a
                    href={selectedProject.dashboard_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge variant="secondary" className="cursor-pointer">
                      Live Dashboard
                    </Badge>
                  </a>
                )}
              </div>
              <div className="border-t pt-3">
                {loadingComments ? (
                  <p className="text-xs text-muted-foreground">
                    Loading comments...
                  </p>
                ) : (
                  <CommentsSection
                    comments={projectComments}
                    projectId={selectedProject.id}
                    onCommentAdded={handleCommentAdded}
                  />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
