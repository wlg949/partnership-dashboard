export interface Idea {
  id: string;
  title: string;
  description: string | null;
  status: "new" | "evaluating" | "approved" | "archived";
  priority: "low" | "medium" | "high" | null;
  ranking: number | null;
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
  ranking: number | null;
  github_url: string | null;
  dashboard_url: string | null;
  plan: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in-progress" | "complete" | "cancelled";
  due_date: string | null;
  cron_job_id: string | null;
  created_at: string;
  completed_at: string | null;
  completion_notes: string | null;
}

export interface ProjectHistory {
  id: string;
  project_id: string;
  entry_date: string;
  summary: string;
  details: string | null;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  idea_id: string | null;
  project_id: string | null;
  created_at: string;
}

export const RANKING_LABELS: Record<number, string> = {
  1: "Not happening",
  2: "Maybe later",
  3: "Under consideration",
  4: "Planned",
  5: "Actively working on",
};
