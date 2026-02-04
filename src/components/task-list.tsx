"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskFormModal } from "@/components/task-form-modal";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { supabase } from "@/lib/supabase";
import { Task } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  Pencil,
  Plus,
  Trash2,
  XCircle,
  ChevronDown,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

interface TaskListProps {
  projectId: string;
  tasks: Task[];
  onTasksChanged: (tasks: Task[]) => void;
}

const STATUS_ORDER: Record<string, number> = {
  "in-progress": 0,
  pending: 1,
  complete: 2,
  cancelled: 3,
};

function statusIcon(status: string) {
  switch (status) {
    case "pending":
      return <Circle className="h-4 w-4 text-muted-foreground" />;
    case "in-progress":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "cancelled":
      return <XCircle className="h-4 w-4 text-muted-foreground/50" />;
    default:
      return <Circle className="h-4 w-4" />;
  }
}

function statusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "in-progress":
      return "default";
    case "pending":
      return "secondary";
    case "complete":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

export function TaskList({ projectId, tasks, onTasksChanged }: TaskListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...tasks].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
  );

  async function handleToggleComplete(task: Task) {
    const newStatus = task.status === "complete" ? "pending" : "complete";
    const completedAt = newStatus === "complete" ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus, completed_at: completedAt })
      .eq("id", task.id);

    if (error) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    onTasksChanged(
      tasks.map((t) =>
        t.id === task.id
          ? { ...t, status: newStatus as Task["status"], completed_at: completedAt }
          : t
      )
    );
    toast({ title: newStatus === "complete" ? "Task completed" : "Task reopened" });
  }

  async function handleCreateOrEdit(data: {
    title: string;
    description: string;
    status: "pending" | "in-progress" | "complete" | "cancelled";
    due_date: string;
    completion_notes: string;
  }) {
    if (editingTask) {
      const updates: Record<string, unknown> = {
        title: data.title,
        description: data.description || null,
        status: data.status,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        completion_notes: data.completion_notes || null,
      };
      if (
        data.status === "complete" &&
        editingTask.status !== "complete"
      ) {
        updates.completed_at = new Date().toISOString();
      } else if (data.status !== "complete") {
        updates.completed_at = null;
      }

      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", editingTask.id);

      if (error) {
        toast({
          title: "Error updating task",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      onTasksChanged(
        tasks.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                ...updates,
                due_date: updates.due_date as string | null,
                status: data.status,
                completed_at: updates.completed_at as string | null,
              } as Task
            : t
        )
      );
      toast({ title: "Task updated", description: `"${data.title}" has been updated.` });
    } else {
      const { data: newTask, error } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          title: data.title,
          description: data.description || null,
          status: data.status,
          due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
          completion_notes: data.completion_notes || null,
          completed_at: data.status === "complete" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error creating task",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      onTasksChanged([...tasks, newTask as Task]);
      toast({ title: "Task created", description: `"${data.title}" has been added.` });
    }
    setEditingTask(null);
  }

  async function handleDelete() {
    if (!deleteTask) return;
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", deleteTask.id);

    if (error) {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    onTasksChanged(tasks.filter((t) => t.id !== deleteTask.id));
    toast({ title: "Task deleted", description: `"${deleteTask.title}" has been removed.` });
    setDeleteTask(null);
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Tasks ({tasks.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingTask(null);
                setFormOpen(true);
              }}
              className="h-7 gap-1 text-xs"
            >
              <Plus className="h-3 w-3" />
              New Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No tasks yet. Click &quot;New Task&quot; to add one.
            </p>
          ) : (
            <div className="space-y-1">
              {sorted.map((task) => {
                const expanded = expandedId === task.id;
                const isDone = task.status === "complete" || task.status === "cancelled";
                return (
                  <div key={task.id} className="rounded-md border">
                    <div
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedId(expanded ? null : task.id)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(task);
                        }}
                        className="shrink-0"
                      >
                        {statusIcon(task.status)}
                      </button>
                      <span
                        className={`text-sm flex-1 ${
                          isDone ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <Badge variant={statusBadgeVariant(task.status)} className="text-[10px] shrink-0">
                        {task.status}
                      </Badge>
                      {expanded ? (
                        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    {expanded && (
                      <div className="px-3 pb-3 pt-1 border-t space-y-2">
                        {task.description && (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {task.description}
                          </p>
                        )}
                        {task.completion_notes && (
                          <div className="text-xs">
                            <span className="font-medium">Notes:</span>{" "}
                            <span className="text-muted-foreground">{task.completion_notes}</span>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Created {new Date(task.created_at).toLocaleDateString()}
                          {task.completed_at &&
                            ` · Completed ${new Date(task.completed_at).toLocaleDateString()}`}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs gap-1"
                            onClick={() => {
                              setEditingTask(task);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs gap-1 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTask(task)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onSubmit={handleCreateOrEdit}
      />

      <DeleteConfirmDialog
        open={!!deleteTask}
        onOpenChange={(open) => {
          if (!open) setDeleteTask(null);
        }}
        title="Delete Task"
        description={`Are you sure you want to delete "${deleteTask?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
