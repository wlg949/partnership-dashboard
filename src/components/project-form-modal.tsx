"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project, RANKING_LABELS } from "@/lib/types";
import { Star } from "lucide-react";

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSubmit: (data: {
    name: string;
    description: string;
    status: "planning" | "in-progress" | "review" | "complete";
    ranking: number;
    github_url: string;
    dashboard_url: string;
  }) => Promise<void>;
}

export function ProjectFormModal({
  open,
  onOpenChange,
  project,
  onSubmit,
}: ProjectFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<
    "planning" | "in-progress" | "review" | "complete"
  >("planning");
  const [ranking, setRanking] = useState(3);
  const [githubUrl, setGithubUrl] = useState("");
  const [dashboardUrl, setDashboardUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");

  const isEdit = !!project;

  useEffect(() => {
    if (open) {
      if (project) {
        setName(project.name);
        setDescription(project.description || "");
        setStatus(project.status);
        setRanking(project.ranking ?? 3);
        setGithubUrl(project.github_url || "");
        setDashboardUrl(project.dashboard_url || "");
      } else {
        setName("");
        setDescription("");
        setStatus("planning");
        setRanking(3);
        setGithubUrl("");
        setDashboardUrl("");
      }
      setNameError("");
    }
  }, [open, project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is required");
      return;
    }
    setNameError("");
    setSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim(),
        status,
        ranking,
        github_url: githubUrl.trim(),
        dashboard_url: dashboardUrl.trim(),
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Project" : "New Project"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this project."
              : "Add a new collaborative project to the board."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-name"
              placeholder="Enter project name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="Describe the project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) =>
                setStatus(
                  v as "planning" | "in-progress" | "review" | "complete"
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ranking</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRanking(value)}
                  className="p-0.5"
                >
                  <Star
                    className={`h-5 w-5 transition-colors ${
                      value <= ranking
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                {RANKING_LABELS[ranking]}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-github">GitHub URL</Label>
            <Input
              id="project-github"
              placeholder="https://github.com/..."
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-dashboard">Dashboard URL</Label>
            <Input
              id="project-dashboard"
              placeholder="https://..."
              value={dashboardUrl}
              onChange={(e) => setDashboardUrl(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
