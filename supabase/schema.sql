-- SwipeLearn Supabase schema
create extension if not exists "pgcrypto";

drop policy if exists "Public can read lessons" on public.lessons;
drop policy if exists "Admins manage lessons" on public.lessons;
drop policy if exists "Users manage own actions" on public.user_lesson_actions;
drop policy if exists "Users manage own profile" on public.user_profile;
drop policy if exists "Users can read own admin record" on public.admin_users;
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'push_subscriptions'
  ) then
    execute 'drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions';
  end if;
end $$;

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  duration_seconds int not null default 60,
  body text not null,
  key_idea text not null,
  example text not null,
  code_snippet text,
  quiz_question text not null,
  quiz_choices jsonb not null,
  quiz_answer_index int not null,
  deep_dive text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_lesson_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  action text not null check (action in ('saved', 'learned', 'skipped')),
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id, action)
);

create index if not exists idx_actions_user_created on public.user_lesson_actions (user_id, created_at desc);
create index if not exists idx_actions_action on public.user_lesson_actions (action);

create table if not exists public.user_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streak_count int not null default 0,
  last_learned_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lessons enable row level security;
alter table public.user_lesson_actions enable row level security;
alter table public.user_profile enable row level security;
alter table public.admin_users enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Public can read lessons" on public.lessons
  for select using (true);

create policy "Admins manage lessons" on public.lessons
  for all
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

create policy "Users manage own actions" on public.user_lesson_actions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own profile" on public.user_profile
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own admin record" on public.admin_users
  for select
  using (auth.uid() = user_id);

create policy "Users manage own push subscriptions" on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
