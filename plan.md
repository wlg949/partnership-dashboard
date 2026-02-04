# Partnership Dashboard — Project Plan

## Overview
Kanban-style dashboard for managing partnership ideas and tracking all collaborative projects between Richard and Shaka.

**Dashboard:** https://partnership-dashboard-omega.vercel.app  
**GitHub:** https://github.com/wlg949/partnership-dashboard  
**Supabase:** https://supabase.com/dashboard/project/fuknarvxtmgejhuvttjz

---

## Completed Phases

### Phase 1: Foundation ✅ (2026-02-03)
- [x] Next.js 14 + TypeScript + Tailwind CSS + App Router
- [x] shadcn/ui components installed
- [x] Sidebar navigation with Dashboard, Ideas, Projects
- [x] Basic Kanban layout for Ideas and Projects pages
- [x] Login page + auth middleware
- [x] Deployed to Vercel

### Phase 2: Supabase Integration ✅ (2026-02-04)
- [x] Supabase project created (PRO tier)
- [x] Database tables: `ideas`, `projects`
- [x] Supabase client with env var fallback for builds
- [x] TypeScript interfaces for Idea and Project
- [x] Dashboard shows real counts from Supabase
- [x] Ideas/Projects pages fetch from database
- [x] PR #1 merged (+373/-46)

### Phase 3: Clickable Cards + Comments ✅ (2026-02-04)
- [x] Stat cards clickable (link to /ideas and /projects)
- [x] Comments table created in Supabase
- [x] CommentsSection component with author select (Richard/Shaka)
- [x] Comment count badges on Kanban cards
- [x] Detail dialogs for ideas/projects with comments
- [x] Real data seeded: 4 projects, 6 ideas
- [x] PR #2 merged (+597/-38)

---

## Current Phase

### Phase 4: CRUD Operations 🔄
Add, edit, and delete functionality for ideas and projects.

**Tasks:**
- [ ] "New Idea" button opens modal form
- [ ] "New Project" button opens modal form
- [ ] Edit button on cards → pre-filled modal
- [ ] Delete with confirmation dialog
- [ ] Drag-and-drop to change status columns
- [ ] Optimistic UI updates
- [ ] Form validation with error messages
- [ ] Toast notifications for actions

---

## Future Phases

### Phase 5: Daily Brief Integration
- [ ] API endpoint for idea ingestion (`POST /api/ideas`)
- [ ] Shaka's daily brief cron auto-creates ideas with source="daily_brief"
- [ ] Auto-tag ideas based on keywords (legal, automation, etc.)

### Phase 6: Enhanced UX
- [ ] Search and filter (by status, priority, source, project)
- [ ] Keyboard shortcuts (n = new, e = edit, / = search)
- [ ] Mobile responsive improvements
- [ ] Dark mode toggle

### Phase 7: Analytics & Insights
- [ ] Ideas-to-projects conversion tracking
- [ ] Activity timeline (recent changes)
- [ ] Weekly summary stats

---

## Technical Notes

### Database Schema
```sql
-- projects table
id, name, description, status, github_url, dashboard_url, created_at, updated_at
status CHECK: 'planning', 'in-progress', 'review', 'complete'

-- ideas table  
id, title, description, status, priority, source, project_id, created_at, updated_at
status CHECK: 'new', 'evaluating', 'approved', 'archived'
priority CHECK: 'low', 'medium', 'high'

-- comments table
id, content, author, idea_id, project_id, created_at
author CHECK: 'Richard', 'Shaka'
```

### Key Files
- `src/app/(dashboard)/page.tsx` — Dashboard with stat cards
- `src/app/(dashboard)/ideas/page.tsx` — Ideas Kanban
- `src/app/(dashboard)/projects/page.tsx` — Projects Kanban
- `src/lib/supabase.ts` — Supabase client
- `src/lib/types.ts` — TypeScript interfaces
- `src/components/comments-section.tsx` — Comments component
- `scripts/migration.sql` — Database schema + seed data

### Environment Variables (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

*Last updated: 2026-02-04*
