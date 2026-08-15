## Phase 4A: Multiplayer Games

Implement a persistent, validated, and real-time backend for the existing Tic Tac Toe, Connect Four, and Dots & Boxes games.

### 1. Database Schema
Create a new `game_sessions` table to store authoritative state.

```sql
create type public.game_status as enum ('active', 'finished', 'rematch_requested');

create table public.game_sessions (
    id uuid primary key default gen_random_uuid(),
    couple_id uuid references public.couples(id) on delete cascade not null,
    game_type text not null, -- 'tictactoe', 'connect4', 'dots'
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

-- Realtime
alter publication supabase_realtime add table public.game_sessions;

-- RLS & Grants
alter table public.game_sessions enable row level security;
grant select, insert, update, delete on public.game_sessions to authenticated;

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
```

### 2. Implementation Steps

#### A. Backend Infrastructure
- Apply the SQL migration to create `game_sessions`.
- Update `RoomContext.tsx` to handle game session discovery and initialization.
- Refactor `useRealtimeRoom.ts` to use real Supabase broadcast for game events if needed, but primary state should live in `game_sessions`.

#### B. Tic Tac Toe
- Reconnect `TicTacToe.tsx` to fetch/update `game_sessions`.
- Add validation: turn check, cell occupancy, active status.
- Implement versioning to avoid race conditions.
- Support Reset/Rematch via database updates.

#### C. Connect Four
- Reconnect `ConnectFour.tsx`.
- Sync board, turn, and winner via JSONB `state`.
- Validate column capacity and turn.

#### D. Dots & Boxes
- Reconnect `DotsAndBoxes.tsx`.
- Sync lines and boxes.
- Preserve the "extra turn" rule by correctly updating `current_turn_id` based on box completion.

### 3. Verification
- Verify that two paired accounts see the same board state.
- Verify that refreshing one device restores the exact game progress.
- Verify that invalid moves (playing out of turn) are rejected by the backend logic/policies.
