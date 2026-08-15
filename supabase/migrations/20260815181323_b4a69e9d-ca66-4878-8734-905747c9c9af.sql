
create type public.game_status as enum ('active', 'finished', 'rematch_requested');

create table public.game_sessions (
    id uuid primary key default gen_random_uuid(),
    couple_id uuid references public.couples(id) on delete cascade not null,
    game_type text not null,
    status public.game_status default 'active',
    player1_id uuid references public.profiles(id),
    player2_id uuid references public.profiles(id),
    current_turn_id uuid references public.profiles(id),
    state jsonb not null default '{}'::jsonb,
    winner_id uuid references public.profiles(id),
    version integer default 1,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter publication supabase_realtime add table public.game_sessions;

grant select, insert, update, delete on public.game_sessions to authenticated;
grant all on public.game_sessions to service_role;

alter table public.game_sessions enable row level security;

create policy "Users can view games for their couple"
on public.game_sessions for select to authenticated
using (
  exists (
    select 1 from public.couples
    where id = game_sessions.couple_id
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);

create policy "Users can update games for their couple"
on public.game_sessions for update to authenticated
using (
  exists (
    select 1 from public.couples
    where id = game_sessions.couple_id
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);

create policy "Users can insert games for their couple"
on public.game_sessions for insert to authenticated
with check (
  exists (
    select 1 from public.couples
    where id = couple_id
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);
