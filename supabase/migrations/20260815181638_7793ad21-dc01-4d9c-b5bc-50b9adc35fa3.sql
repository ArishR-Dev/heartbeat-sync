
create type public.hold_hands_state as enum ('idle', 'requesting', 'approaching', 'holding', 'releasing');

create table public.hold_hands_sessions (
    id uuid primary key default gen_random_uuid(),
    couple_id uuid references public.couples(id) on delete cascade not null,
    room_id uuid references public.rooms(id) on delete cascade not null,
    requester_id uuid references auth.users(id) on delete cascade not null,
    receiver_id uuid references auth.users(id) on delete cascade,
    state hold_hands_state not null default 'idle',
    version integer not null default 1,
    expires_at timestamptz not null default (now() + interval '1 minute'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(couple_id)
);

grant select, insert, update, delete on public.hold_hands_sessions to authenticated;
grant all on public.hold_hands_sessions to service_role;

alter table public.hold_hands_sessions enable row level security;

create policy "Couples can manage their own hold hands session"
on public.hold_hands_sessions
for all
to authenticated
using (
    exists (
        select 1 from public.couples
        where id = hold_hands_sessions.couple_id
        and (user1_id = auth.uid() or user2_id = auth.uid())
    )
);

-- Realtime
alter publication supabase_realtime add table public.hold_hands_sessions;
