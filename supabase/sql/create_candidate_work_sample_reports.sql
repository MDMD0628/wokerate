create table if not exists candidate_work_sample_reports (
  id uuid primary key default gen_random_uuid(),

  candidate_submission_id uuid references candidate_submissions(id) on delete cascade,
  candidate_email text,
  candidate_name_or_nickname text,

  report_type text default 'work_sample_analysis',
  report_version text not null,
  scenario_id text not null,
  target_role text not null,

  report jsonb not null,

  source text default 'ai_generated',
  fallback_used boolean default false,
  fallback_reason text,

  created_at timestamptz default now()
);

alter table candidate_work_sample_reports enable row level security;
