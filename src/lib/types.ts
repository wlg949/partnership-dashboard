export interface Idea {
  id: string;
  title: string;
  description: string | null;
  status: "new" | "evaluating" | "approved" | "archived";
  priority: "low" | "medium" | "high" | null;
  source: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "planning" | "in-progress" | "review" | "complete";
  github_url: string | null;
  dashboard_url: string | null;
  created_at: string;
  updated_at: string;
}
