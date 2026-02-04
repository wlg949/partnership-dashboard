"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Idea } from "@/lib/types";

const columns = [
  { id: "new" as const, label: "New", color: "bg-blue-500" },
  { id: "evaluating" as const, label: "Evaluating", color: "bg-yellow-500" },
  { id: "approved" as const, label: "Approved", color: "bg-green-500" },
  { id: "archived" as const, label: "Archived", color: "bg-gray-500" },
];

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }

    fetchIdeas();
  }, []);

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
                    <Card key={idea.id}>
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
