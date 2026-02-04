-- ============================================
-- Partnership Dashboard - Database Migration
-- ============================================

-- 0. Add ranking column to ideas and projects
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS ranking INTEGER DEFAULT 3;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ranking INTEGER DEFAULT 3;

-- 1. Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  author text NOT NULL CHECK (author IN ('Richard', 'Shaka')),
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow all access (dashboard is already password-protected)
CREATE POLICY "Allow all access to comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'in-progress', 'complete', 'cancelled')) DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  cron_job_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completion_notes TEXT
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Create project_history table
CREATE TABLE IF NOT EXISTS project_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  summary TEXT NOT NULL,
  details TEXT
);

ALTER TABLE project_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to project_history" ON project_history
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Add plan column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS plan TEXT;

-- 5. Clear existing sample data
DELETE FROM ideas;
DELETE FROM projects;

-- 3. Insert real projects
INSERT INTO projects (name, status, github_url, dashboard_url, description) VALUES
  ('PTR Project (OC Probate Rulings)', 'in-progress', 'https://github.com/wlg949/oc-rulings-dashboard', 'https://oc-rulings-dashboard.vercel.app', 'Legal intelligence from Orange County Superior Court probate tentative rulings. Weekly auto-scrape, PDF extraction, AI summaries.'),
  ('Sleep Dashboard', 'in-progress', 'https://github.com/wlg949/sleep-dashboard', 'https://sleep-dashboard.vercel.app', 'Eight Sleep data visualization with AI insights. Daily sync of sleep scores, HRV, heart rate.'),
  ('Partnership Dashboard', 'in-progress', 'https://github.com/wlg949/partnership-dashboard', 'https://partnership-dashboard-omega.vercel.app', 'Kanban dashboard for partnership ideas and project tracking.'),
  ('WLG Website Redesign', 'in-progress', 'https://github.com/wlg949/wlg-website', 'https://www.watsonlaw.org', 'Watson Law Group website modernization with Anthropic-inspired aesthetic.');

-- 4. Insert real ideas
INSERT INTO ideas (title, description, source, priority, status) VALUES
  ('AI Document Summarization', 'Use Claude to summarize trust instruments, wills, and probate pleadings for case preparation.', 'daily_brief', 'high', 'new'),
  ('Court Hearing Reminder Automation', 'Auto-alert 7 days before hearings to check probate notes and file supplements.', 'daily_brief', 'high', 'new'),
  ('OC Case Party/Attorney Lookup', 'Scraper to pull party names and attorneys from OC court case search.', 'daily_brief', 'medium', 'new'),
  ('Calendar Sync with Court Dates', 'Automatically sync court hearing dates from Smokeball to Outlook calendar.', 'daily_brief', 'medium', 'new'),
  ('Sleep-Productivity Correlation', 'Track whether sleep scores correlate with work output and billable hours.', 'daily_brief', 'low', 'new'),
  ('Client Intake Form Automation', 'Digital intake forms that auto-populate into Smokeball matter creation.', 'daily_brief', 'medium', 'new');
