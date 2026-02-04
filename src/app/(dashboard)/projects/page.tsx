"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Project } from "@/lib/types";

const columns = [
  { id: "planning" as const, label: "Planning", color: "bg-purple-500" },
  { id: "in-progress" as const, label: "In Progress", color: "bg-blue-500" },
  { id: "review" as const, label: "Review", color: "bg-yellow-500" },
  { id: "complete" as const, label: "Complete", color: "bg-green-500" },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
      } else {
        setProjects(data ?? []);
      }
      setLoading(false);
    }

    fetchProjects();
  }, []);

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
        <Button>
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
                    <Card key={project.id}>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-sm">{project.name}</h3>
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
    </div>
  );
}
