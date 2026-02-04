import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase configuration" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { action } = await request.json();

  try {
    if (action === "create-comments-table") {
      const { error } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS comments (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            content text NOT NULL,
            author text NOT NULL CHECK (author IN ('Richard', 'Shaka')),
            idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
            project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
            created_at timestamptz DEFAULT now()
          );

          ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "Allow all access to comments" ON comments
            FOR ALL USING (true) WITH CHECK (true);
        `,
      });

      if (error) {
        // If rpc doesn't exist, try direct table operations
        // The table may need to be created via the Supabase dashboard SQL editor
        return NextResponse.json(
          {
            error: error.message,
            hint: "Run the SQL in scripts/migration.sql via the Supabase dashboard SQL editor",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "Comments table created" });
    }

    if (action === "seed-data") {
      // Delete existing data
      await supabase.from("ideas").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("projects").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert projects
      const { error: projectsError } = await supabase.from("projects").insert([
        {
          name: "PTR Project (OC Probate Rulings)",
          status: "in-progress",
          github_url: "https://github.com/wlg949/oc-rulings-dashboard",
          dashboard_url: "https://oc-rulings-dashboard.vercel.app",
          description:
            "Legal intelligence from Orange County Superior Court probate tentative rulings. Weekly auto-scrape, PDF extraction, AI summaries.",
        },
        {
          name: "Sleep Dashboard",
          status: "in-progress",
          github_url: "https://github.com/wlg949/sleep-dashboard",
          dashboard_url: "https://sleep-dashboard.vercel.app",
          description:
            "Eight Sleep data visualization with AI insights. Daily sync of sleep scores, HRV, heart rate.",
        },
        {
          name: "Partnership Dashboard",
          status: "in-progress",
          github_url: "https://github.com/wlg949/partnership-dashboard",
          dashboard_url: "https://partnership-dashboard-omega.vercel.app",
          description:
            "Kanban dashboard for partnership ideas and project tracking.",
        },
        {
          name: "WLG Website Redesign",
          status: "in-progress",
          github_url: "https://github.com/wlg949/wlg-website",
          dashboard_url: "https://www.watsonlaw.org",
          description:
            "Watson Law Group website modernization with Anthropic-inspired aesthetic.",
        },
      ]);

      if (projectsError) {
        return NextResponse.json({ error: projectsError.message }, { status: 500 });
      }

      // Insert ideas
      const { error: ideasError } = await supabase.from("ideas").insert([
        {
          title: "AI Document Summarization",
          description:
            "Use Claude to summarize trust instruments, wills, and probate pleadings for case preparation.",
          source: "daily_brief",
          priority: "high",
          status: "new",
        },
        {
          title: "Court Hearing Reminder Automation",
          description:
            "Auto-alert 7 days before hearings to check probate notes and file supplements.",
          source: "daily_brief",
          priority: "high",
          status: "new",
        },
        {
          title: "OC Case Party/Attorney Lookup",
          description:
            "Scraper to pull party names and attorneys from OC court case search.",
          source: "daily_brief",
          priority: "medium",
          status: "new",
        },
        {
          title: "Calendar Sync with Court Dates",
          description:
            "Automatically sync court hearing dates from Smokeball to Outlook calendar.",
          source: "daily_brief",
          priority: "medium",
          status: "new",
        },
        {
          title: "Sleep-Productivity Correlation",
          description:
            "Track whether sleep scores correlate with work output and billable hours.",
          source: "daily_brief",
          priority: "low",
          status: "new",
        },
        {
          title: "Client Intake Form Automation",
          description:
            "Digital intake forms that auto-populate into Smokeball matter creation.",
          source: "daily_brief",
          priority: "medium",
          status: "new",
        },
      ]);

      if (ideasError) {
        return NextResponse.json({ error: ideasError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Data seeded successfully" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
