---
name: Pookie Heart Sync - Phase 2 (Pairing & Presence)
description: Implementation plan for two-person couple pairing and real-time presence system.
type: feature
---
## Implementation Plan - Phase 2: Couple Pairing & Realtime Presence

### 1. Database & Security (Supabase)
- **Pairing Logic**: Implement a function/trigger to handle pairing code validation and couple creation atomically.
- **RLS Refinement**: 
    - Ensure `couples` table only allows users to see their own couple.
    - Ensure `pairing_code` is only readable by the creator or via a secure RPC/validation check.
- **Presence**: Leverage Supabase Realtime Presence for "Online/Offline" status.

### 2. Frontend Infrastructure
- **CoupleContext**: Create `src/contexts/CoupleContext.tsx` to manage couple state, pairing status, and partner profile.
- **Presence System**: Implement a hook `usePresence` that handles Supabase Realtime Presence, updating `online_status` and `last_seen`.
- **Refactor RoomContext**: Move couple-related logic to `CoupleContext` and update `RoomContext` to depend on it.

### 3. Pairing Flow
- **Invite Creation**: User A clicks "Create Room", which generates a `pairing_code` in the `couples` table.
- **Joining**: User B enters the code, the backend validates, adds User B to the couple, and updates status to `paired`.
- **Realtime Sync**: Use Supabase Realtime to notify User A immediately when User B joins.

### 4. Presence UI
- Connect the status indicators in `RoomPage.tsx` and `RoomLobby.tsx` to the real presence state from `CoupleContext`.
- Ensure "Last seen" timestamps are formatted correctly using existing project patterns.

### 5. Verification
- **Build**: Ensure `npm run build` succeeds.
- **Two-Device Test**: Verify pairing and presence updates across two separate browser sessions without manual refresh.
