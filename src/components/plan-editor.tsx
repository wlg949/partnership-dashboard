"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { FileText, Pencil, Save, X } from "lucide-react";

interface PlanEditorProps {
  projectId: string;
  plan: string | null;
  onPlanUpdated: (plan: string | null) => void;
}

export function PlanEditor({ projectId, plan, onPlanUpdated }: PlanEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(plan || "");
  const [saving, setSaving] = useState(false);

  function handleEdit() {
    setDraft(plan || "");
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setDraft(plan || "");
  }

  async function handleSave() {
    setSaving(true);
    const value = draft.trim() || null;
    const { error } = await supabase
      .from("projects")
      .update({ plan: value })
      .eq("id", projectId);

    if (error) {
      toast({
        title: "Error saving plan",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onPlanUpdated(value);
      setEditing(false);
      toast({ title: "Plan updated" });
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Project Plan
          </CardTitle>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={handleEdit} className="h-7 gap-1 text-xs">
              <Pencil className="h-3 w-3" />
              {plan ? "Edit" : "Add Plan"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write the project plan here... (supports plain text)"
              rows={10}
              className="text-sm font-mono"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-3 w-3 mr-1" />
                {saving ? "Saving..." : "Save Plan"}
              </Button>
            </div>
          </div>
        ) : plan ? (
          <p className="text-sm whitespace-pre-wrap">{plan}</p>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            No plan yet. Click &quot;Add Plan&quot; to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
