-- ============ Roles ============
create type public.app_role as enum ('admin', 'participant', 'team_leader');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can read their own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

-- ============ Profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "Signed-in users can view profiles" on public.profiles
  for select to authenticated using (true);
create policy "Users can insert their own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'Hacker'),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'participant');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Hackathons (public, seeded) ============
create table public.hackathons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  url text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.hackathons to anon, authenticated;
grant all on public.hackathons to service_role;
alter table public.hackathons enable row level security;
create policy "Anyone can browse hackathons" on public.hackathons for select to anon, authenticated using (true);

insert into public.hackathons (name, location, url, starts_at, ends_at) values
  ('HackZurich 2026', 'Zurich, Switzerland', 'https://hackzurich.com', '2026-09-25 09:00+00', '2026-09-27 15:00+00'),
  ('Junction 2026', 'Helsinki, Finland', 'https://hackjunction.com', '2026-11-06 16:00+00', '2026-11-08 18:00+00'),
  ('HackHarvard 2026', 'Cambridge, MA, USA', 'https://hackharvard.com', '2026-10-16 18:00+00', '2026-10-18 12:00+00'),
  ('TreeHacks 2027', 'Stanford, CA, USA', 'https://treehacks.com', '2027-02-12 18:00+00', '2027-02-14 12:00+00'),
  ('Hack the North 2026', 'Waterloo, Canada', 'https://hackthenorth.com', '2026-09-18 20:00+00', '2026-09-20 12:00+00'),
  ('LA Hacks 2027', 'Los Angeles, CA, USA', 'https://lahacks.com', '2027-04-16 18:00+00', '2027-04-18 12:00+00'),
  ('ETHGlobal Bangkok 2026', 'Bangkok, Thailand', 'https://ethglobal.com', '2026-11-13 09:00+00', '2026-11-15 17:00+00'),
  ('Global Hack Week: AI/ML', 'Online', 'https://ghw.mlh.io', '2026-09-04 00:00+00', '2026-09-11 00:00+00'),
  ('Startup Weekend Joburg 2026', 'Johannesburg, South Africa', 'https://startupweekend.org', '2026-10-02 17:00+00', '2026-10-04 20:00+00'),
  ('NASA Space Apps Challenge 2026', 'Worldwide / Online', 'https://spaceappschallenge.org', '2026-10-03 00:00+00', '2026-10-04 23:59+00');

-- ============ Projects ============
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  idea text,
  logo_path text,
  hackathon_id uuid references public.hackathons(id) on delete set null,
  hackathon_name text,
  deadline timestamptz,
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  created_by uuid not null references public.profiles(id),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('leader', 'member')),
  joined_at timestamptz not null default now(),
  unique (project_id, user_id)
);
grant select, insert, update, delete on public.project_members to authenticated;
grant all on public.project_members to service_role;
alter table public.project_members enable row level security;

create or replace function public.is_project_member(_project_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.project_members where project_id = _project_id and user_id = _user_id)
$$;

create or replace function public.is_project_leader(_project_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.project_members where project_id = _project_id and user_id = _user_id and member_role = 'leader')
$$;

create policy "Members can view their projects" on public.projects
  for select to authenticated using (public.is_project_member(id, auth.uid()));
create policy "Signed-in users can create projects" on public.projects
  for insert to authenticated with check (created_by = auth.uid());
create policy "Leaders can update projects" on public.projects
  for update to authenticated using (public.is_project_leader(id, auth.uid())) with check (public.is_project_leader(id, auth.uid()));
create policy "Leaders can delete projects" on public.projects
  for delete to authenticated using (public.is_project_leader(id, auth.uid()));

create policy "Members can view memberships" on public.project_members
  for select to authenticated using (public.is_project_member(project_id, auth.uid()) or user_id = auth.uid());
create policy "Leaders add members, users join themselves" on public.project_members
  for insert to authenticated with check (user_id = auth.uid() or public.is_project_leader(project_id, auth.uid()));
create policy "Leaders manage members, members can leave" on public.project_members
  for delete to authenticated using (user_id = auth.uid() or public.is_project_leader(project_id, auth.uid()));
create policy "Leaders can update member roles" on public.project_members
  for update to authenticated using (public.is_project_leader(project_id, auth.uid()));

-- ============ Milestones & Tasks ============
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  position int not null default 0,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.milestones to authenticated;
grant all on public.milestones to service_role;
alter table public.milestones enable row level security;

create policy "Members manage milestones" on public.milestones
  for all to authenticated
  using (public.is_project_member(project_id, auth.uid()))
  with check (public.is_project_member(project_id, auth.uid()));

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone_id uuid references public.milestones(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'backlog' check (status in ('backlog', 'todo', 'in_progress', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  labels text[] not null default '{}',
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  position double precision not null default 0,
  created_by uuid not null references public.profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;

create policy "Members manage tasks" on public.tasks
  for all to authenticated
  using (public.is_project_member(project_id, auth.uid()))
  with check (public.is_project_member(project_id, auth.uid()));

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.task_comments to authenticated;
grant all on public.task_comments to service_role;
alter table public.task_comments enable row level security;

create or replace function public.is_task_member(_task_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tasks t
    join public.project_members pm on pm.project_id = t.project_id
    where t.id = _task_id and pm.user_id = _user_id
  )
$$;

create policy "Members read task comments" on public.task_comments
  for select to authenticated using (public.is_task_member(task_id, auth.uid()));
create policy "Members add task comments" on public.task_comments
  for insert to authenticated with check (user_id = auth.uid() and public.is_task_member(task_id, auth.uid()));
create policy "Authors delete own comments" on public.task_comments
  for delete to authenticated using (user_id = auth.uid());

-- ============ Daily stand-up ============
create table public.daily_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  update_date date not null default current_date,
  finished text not null default '',
  planned text not null default '',
  blockers text not null default '',
  created_at timestamptz not null default now(),
  unique (project_id, user_id, update_date)
);
grant select, insert, update, delete on public.daily_updates to authenticated;
grant all on public.daily_updates to service_role;
alter table public.daily_updates enable row level security;

create policy "Members read team standups" on public.daily_updates
  for select to authenticated using (public.is_project_member(project_id, auth.uid()));
create policy "Members post their own standup" on public.daily_updates
  for insert to authenticated with check (user_id = auth.uid() and public.is_project_member(project_id, auth.uid()));
create policy "Members edit their own standup" on public.daily_updates
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ Team discussion ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  parent_id uuid references public.messages(id) on delete cascade,
  content text not null,
  reactions jsonb not null default '{}',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;

create policy "Members read messages" on public.messages
  for select to authenticated using (public.is_project_member(project_id, auth.uid()));
create policy "Members post messages" on public.messages
  for insert to authenticated with check (user_id = auth.uid() and public.is_project_member(project_id, auth.uid()));
create policy "Members update reactions" on public.messages
  for update to authenticated using (public.is_project_member(project_id, auth.uid()));
create policy "Authors delete own messages" on public.messages
  for delete to authenticated using (user_id = auth.uid());

create table public.shared_notes (
  project_id uuid primary key references public.projects(id) on delete cascade,
  content text not null default '',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.shared_notes to authenticated;
grant all on public.shared_notes to service_role;
alter table public.shared_notes enable row level security;

create policy "Members manage shared notes" on public.shared_notes
  for all to authenticated
  using (public.is_project_member(project_id, auth.uid()))
  with check (public.is_project_member(project_id, auth.uid()));

-- ============ Files ============
create table public.files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id),
  file_name text not null,
  file_path text not null,
  content_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.files to authenticated;
grant all on public.files to service_role;
alter table public.files enable row level security;

create policy "Members read files" on public.files
  for select to authenticated using (public.is_project_member(project_id, auth.uid()));
create policy "Members add files" on public.files
  for insert to authenticated with check (uploader_id = auth.uid() and public.is_project_member(project_id, auth.uid()));
create policy "Uploader or leader deletes files" on public.files
  for delete to authenticated using (uploader_id = auth.uid() or public.is_project_leader(project_id, auth.uid()));

-- ============ Notifications ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;

create policy "Users read own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "Members can notify teammates" on public.notifications
  for insert to authenticated with check (project_id is null or public.is_project_member(project_id, auth.uid()));
create policy "Users update own notifications" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users delete own notifications" on public.notifications
  for delete to authenticated using (user_id = auth.uid());

-- ============ AI mentor conversations ============
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  title text not null default 'Mentor chat',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ai_conversations to authenticated;
grant all on public.ai_conversations to service_role;
alter table public.ai_conversations enable row level security;

create policy "Owners manage mentor chats" on public.ai_conversations
  for all to authenticated
  using (user_id = auth.uid() and public.is_project_member(project_id, auth.uid()))
  with check (user_id = auth.uid() and public.is_project_member(project_id, auth.uid()));

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ai_messages to authenticated;
grant all on public.ai_messages to service_role;
alter table public.ai_messages enable row level security;

create or replace function public.owns_conversation(_conversation_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ai_conversations where id = _conversation_id and user_id = _user_id)
$$;

create policy "Owners manage mentor messages" on public.ai_messages
  for all to authenticated
  using (public.owns_conversation(conversation_id, auth.uid()))
  with check (public.owns_conversation(conversation_id, auth.uid()));

-- ============ Generated submission documents ============
create table public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  doc_type text not null check (doc_type in ('readme', 'devpost', 'overview', 'tech_stack', 'demo_script', 'pitch')),
  content text not null default '',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (project_id, doc_type)
);
grant select, insert, update, delete on public.generated_documents to authenticated;
grant all on public.generated_documents to service_role;
alter table public.generated_documents enable row level security;

create policy "Members manage documents" on public.generated_documents
  for all to authenticated
  using (public.is_project_member(project_id, auth.uid()))
  with check (public.is_project_member(project_id, auth.uid()));

-- ============ Storage policies ============
create policy "Users manage their own avatar" on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Members view project logos" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-logos' and public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid()));
create policy "Leaders upload project logos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-logos' and public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid()));
create policy "Leaders update project logos" on storage.objects
  for update to authenticated
  using (bucket_id = 'project-logos' and public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid()));
create policy "Leaders delete project logos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-logos' and public.is_project_leader((storage.foldername(name))[1]::uuid, auth.uid()));

create policy "Members read project files" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-files' and public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid()));
create policy "Members upload project files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-files' and public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid()));
create policy "Members delete project files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-files' and public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid()));

-- ============ Realtime ============
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.daily_updates;