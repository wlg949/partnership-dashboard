import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

const columns = [
  { id: "new", label: "New", color: "bg-blue-500" },
  { id: "evaluating", label: "Evaluating", color: "bg-yellow-500" },
  { id: "approved", label: "Approved", color: "bg-green-500" },
  { id: "archived", label: "Archived", color: "bg-gray-500" },
];

export default function IdeasPage() {
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
        {columns.map((column) => (
          <div key={column.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${column.color}`} />
              <h2 className="text-sm font-semibold">{column.label}</h2>
              <Badge variant="secondary" className="ml-auto">
                0
              </Badge>
            </div>
            <Card className="border-dashed">
              <CardContent className="flex min-h-[200px] items-center justify-center p-6">
                <p className="text-sm text-muted-foreground">
                  No ideas yet
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
