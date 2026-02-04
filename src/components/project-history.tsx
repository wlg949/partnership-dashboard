"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { ProjectHistory as ProjectHistoryType } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { History, Plus } from "lucide-react";

interface ProjectHistoryProps {
  projectId: string;
  entries: ProjectHistoryType[];
  onEntriesChanged: (entries: ProjectHistoryType[]) => void;
}

export function ProjectHistorySection({
  projectId,
  entries,
  onEntriesChanged,
}: ProjectHistoryProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sorted = [...entries].sort(
    (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedSummary = summary.trim();
    if (!trimmedSummary) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("project_history")
      .insert({
        project_id: projectId,
        summary: trimmedSummary,
        details: details.trim() || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error adding entry",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      onEntriesChanged([...entries, data as ProjectHistoryType]);
      setSummary("");
      setDetails("");
      setFormOpen(false);
      toast({ title: "History entry added" });
    }
    setSubmitting(false);
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              History ({entries.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFormOpen(true)}
              className="h-7 gap-1 text-xs"
            >
              <Plus className="h-3 w-3" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No history entries yet. Click &quot;Add Entry&quot; to log activity.
            </p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {sorted.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-md border p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.entry_date).toLocaleDateString()} &middot;{" "}
                      {new Date(entry.entry_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{entry.summary}</p>
                  {entry.details && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {entry.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add History Entry</DialogTitle>
            <DialogDescription>
              Log activity or a milestone for this project.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="history-summary">
                Summary <span className="text-destructive">*</span>
              </Label>
              <Input
                id="history-summary"
                placeholder="What happened?"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="history-details">Details</Label>
              <Textarea
                id="history-details"
                placeholder="Additional context..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !summary.trim()}>
                {submitting ? "Adding..." : "Add Entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
