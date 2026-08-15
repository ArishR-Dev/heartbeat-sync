-- Clean up any partial state
drop table if exists public.messages cascade;
drop table if exists public.secret_messages cascade;
drop table if exists public.memories cascade;
drop table if exists public.schedules cascade;
drop table if exists public.rooms cascade;
drop table if exists public.couples cascade;
drop table if exists public.profiles cascade;
drop table if exists public.user_roles cascade;

drop type if exists public.app_role cascade;
drop type if exists public.relationship_status cascade;
drop type if exists public.reveal_type cascade;

-- Re-create
create type public.app_role as enum ('admin', 'user');
create type public.relationship_status as enum ('pairing', 'paired', 'unpaired');
create type public.reveal_type as enum ('timer', 'click');

create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    username text unique not null,
    display_name text,
    avatar text,
    gender text,
    last_seen timestamptz default now(),
    online_status text default 'offline',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.couples (
    id uuid primary key default gen_random_uuid(),
    user1_id uuid references public.profiles(id) on delete set null,
    user2_id uuid references public.profiles(id) on delete set null,
    pairing_code text unique not null,
    status public.relationship_status default 'pairing',
    paired_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint two_users_per_couple check (user1_id != user2_id)
);

create table public.rooms (
    id uuid primary key default gen_random_uuid(),
    couple_id uuid references public.couples(id) on delete cascade not null,
    room_code text unique not null,
    host_id uuid references public.profiles(id),
    mood_theme text default 'default',
    is_active boolean default true,
    last_activity timestamptz default now(),
    created_at timestamptz default now()
);

create table public.messages (
    id uuid primary key default gen_random_uuid(),
    room_id uuid references public.rooms(id) on delete cascade,
    couple_id uuid references public.couples(id) on delete cascade,
    sender_id uuid references public.profiles(id) not null,
    content text not null,
    type text default 'text',
    created_at timestamptz default now()
);

create table public.memories (
    id uuid primary key default gen_random_uuid(),
    couple_id uuid references public.couples(id) on delete cascade not null,
    title text not null,
    date text not null,
    emoji text,
    created_at timestamptz default now()
);

create table public.schedules (
    id uuid primary key default gen_random_uuid(),
    couple_id uuid references public.couples(id) on delete cascade not null,
    title text not null,
    date text not null,
    time text not null,
    created_at timestamptz default now()
);

create table public.secret_messages (
    id uuid primary key default gen_random_uuid(),
    couple_id uuid references public.couples(id) on delete cascade not null,
    sender_id uuid references public.profiles(id) not null,
    text text not null,
    reveal_type public.reveal_type default 'click',
    timer_seconds integer,
    is_revealed boolean default false,
    revealed_at timestamptz,
    created_at timestamptz default now()
);

create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role public.app_role not null,
    unique (user_id, role)
);

-- Realtime
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.profiles;

-- GRANTS
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.couples to authenticated;
grant select, insert, update, delete on public.rooms to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update, delete on public.memories to authenticated;
grant select, insert, update, delete on public.schedules to authenticated;
grant select, insert, update, delete on public.secret_messages to authenticated;
grant select on public.user_roles to authenticated;

grant all on all tables in schema public to service_role;
grant usage on schema public to authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.rooms enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.schedules enable row level security;
alter table public.secret_messages enable row level security;
alter table public.user_roles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone" on public.profiles for select to authenticated using (true);
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users can view couples they belong to" on public.couples for select to authenticated using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Profile Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.email),
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
