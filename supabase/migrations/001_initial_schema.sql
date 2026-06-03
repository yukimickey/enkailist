-- ============================================================
-- EnkaiList Database Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- EVENTS
-- ============================================================
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  host_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  room_code text unique not null,
  status text default 'draft' not null check (status in ('draft', 'lobby', 'active', 'finished')),
  current_question_index integer default -1 not null,
  question_duration_sec integer default 15 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.events enable row level security;

create policy "Hosts can manage own events"
  on public.events for all
  using (auth.uid() = host_id);

create policy "Anyone can view active events by room code"
  on public.events for select
  using (status in ('lobby', 'active', 'finished'));

-- Index for room code lookup
create index idx_events_room_code on public.events(room_code);

-- ============================================================
-- QUESTIONS
-- ============================================================
create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  question_text text not null,
  choice_a text not null,
  choice_b text not null,
  choice_c text not null,
  choice_d text not null,
  correct_choice text not null check (correct_choice in ('a', 'b', 'c', 'd')),
  order_index integer not null,
  time_limit_sec integer default 15,
  created_at timestamptz default now() not null
);

alter table public.questions enable row level security;

-- Hosts can manage questions for their events
create policy "Hosts can manage questions"
  on public.questions for all
  using (
    exists (
      select 1 from public.events
      where events.id = questions.event_id
      and events.host_id = auth.uid()
    )
  );

-- Players can view questions (but NOT correct_choice - enforced via API)
create policy "Anyone can view questions for active events"
  on public.questions for select
  using (
    exists (
      select 1 from public.events
      where events.id = questions.event_id
      and events.status in ('active', 'finished')
    )
  );

-- ============================================================
-- PARTICIPANTS
-- ============================================================
create table public.participants (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  nickname text not null,
  session_token text not null,
  total_score integer default 0 not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

alter table public.participants enable row level security;

-- Anyone can join (no auth required for participants)
create policy "Anyone can create participants"
  on public.participants for insert
  with check (true);

create policy "Anyone can view participants"
  on public.participants for select
  using (true);

create policy "Participants can update own record"
  on public.participants for update
  using (true);

-- Unique nickname per event
create unique index idx_participants_event_nickname
  on public.participants(event_id, nickname);

-- Index for session token lookup
create index idx_participants_session_token
  on public.participants(session_token);

-- ============================================================
-- ANSWERS
-- ============================================================
create table public.answers (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid references public.participants(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  selected_choice text not null check (selected_choice in ('a', 'b', 'c', 'd')),
  is_correct boolean not null,
  response_time_ms integer not null,
  score integer default 0 not null,
  created_at timestamptz default now() not null
);

alter table public.answers enable row level security;

create policy "Anyone can insert answers"
  on public.answers for insert
  with check (true);

create policy "Anyone can view answers"
  on public.answers for select
  using (true);

-- One answer per participant per question
create unique index idx_answers_participant_question
  on public.answers(participant_id, question_id);

-- ============================================================
-- ANSWER COUNTS (for real-time distribution display)
-- ============================================================
create table public.answer_counts (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references public.questions(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  count_a integer default 0 not null,
  count_b integer default 0 not null,
  count_c integer default 0 not null,
  count_d integer default 0 not null,
  total_count integer default 0 not null,
  updated_at timestamptz default now() not null
);

alter table public.answer_counts enable row level security;

create policy "Anyone can view answer counts"
  on public.answer_counts for select
  using (true);

create policy "System can manage answer counts"
  on public.answer_counts for all
  using (true);

create unique index idx_answer_counts_question
  on public.answer_counts(question_id);

-- ============================================================
-- TRIGGER: Update answer_counts on new answer
-- ============================================================
create or replace function public.update_answer_counts()
returns trigger as $$
begin
  insert into public.answer_counts (question_id, event_id, count_a, count_b, count_c, count_d, total_count)
  values (
    new.question_id,
    new.event_id,
    case when new.selected_choice = 'a' then 1 else 0 end,
    case when new.selected_choice = 'b' then 1 else 0 end,
    case when new.selected_choice = 'c' then 1 else 0 end,
    case when new.selected_choice = 'd' then 1 else 0 end,
    1
  )
  on conflict (question_id) do update set
    count_a = answer_counts.count_a + case when new.selected_choice = 'a' then 1 else 0 end,
    count_b = answer_counts.count_b + case when new.selected_choice = 'b' then 1 else 0 end,
    count_c = answer_counts.count_c + case when new.selected_choice = 'c' then 1 else 0 end,
    count_d = answer_counts.count_d + case when new.selected_choice = 'd' then 1 else 0 end,
    total_count = answer_counts.total_count + 1,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_answer_inserted
  after insert on public.answers
  for each row execute function public.update_answer_counts();

-- ============================================================
-- TRIGGER: Update participant total_score on new answer
-- ============================================================
create or replace function public.update_participant_score()
returns trigger as $$
begin
  update public.participants
  set total_score = total_score + new.score
  where id = new.participant_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_answer_score_update
  after insert on public.answers
  for each row execute function public.update_participant_score();

-- ============================================================
-- FUNCTION: Generate unique room code
-- ============================================================
create or replace function public.generate_room_code()
returns text as $$
declare
  code text;
  exists_check boolean;
begin
  loop
    code := lpad(floor(random() * 1000000)::text, 6, '0');
    select exists(select 1 from public.events where room_code = code) into exists_check;
    if not exists_check then
      return code;
    end if;
  end loop;
end;
$$ language plpgsql;

-- ============================================================
-- Enable Realtime for required tables
-- ============================================================
alter publication supabase_realtime add table public.answer_counts;
alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.events;
