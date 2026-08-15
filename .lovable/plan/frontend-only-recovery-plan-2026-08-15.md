# Frontend-Only Recovery Plan

Remove all Supabase and backend dependencies while preserving the entire UI, animations, and features of Pookie Heart Sync. The application will transition to a local/demo mode using `localStorage` and a simplified frontend-only architecture.

## User Review Required

> [!IMPORTANT]
> The application will no longer synchronize across different devices/browsers because the backend (Supabase) is being removed. Everything (chat, games, hold hands, memories) will work locally within your current browser.

- **Authentication**: Will be replaced by a local identity (stored in `localStorage`). You can still "login" or "register", but it's a simulation.
- **Realtime Features**: Room synchronization, shared cursors, and live chat will be simulated locally.
- **Data Persistence**: Memories, schedules, and settings will be saved to your browser's `localStorage` instead of a remote database.

## Proposed Changes

### 1. Supabase & Backend Removal
- Delete `supabase/` directory and `src/integrations/supabase/` files.
- Remove `@supabase/supabase-js` and `@lovable.dev/cloud-auth-js` from `package.json`.
- Strip all `supabase` imports and calls from the codebase.
- Clean up `.env` and remove all `VITE_SUPABASE_*` variables.

### 2. Frontend Infrastructure Refactor
- **Time Utility**: Create `src/lib/time.ts` to provide browser-based time, replacing the `server-time` edge function.
- **Auth Context**: Refactor `src/contexts/AuthContext.tsx` to handle local sessions in `localStorage`.
- **Room System**: Refactor `src/contexts/RoomContext.tsx` and `src/hooks/useRealtimeRoom.ts` to use a local state machine instead of Supabase Realtime channels.

### 3. Feature Preservation (Local Fallbacks)
- **Chat & Games**: Store message history and game state in React state/`localStorage`.
- **Hold Hands Mode**: Preserve the cinematic UI and heartbeat animations, making the state machine locally controllable.
- **Memory & Schedule**: Use `localStorage` for all CRUD operations.
- **Cursor System**: Maintain the full `CursorLibrary` and selection logic, persisting choices locally.
- **Push Notifications**: Gracefully disable backend-dependent notifications in `src/lib/pushNotifications.ts`.

### 4. Build & Validation
- Run `npm install` and `npm run build`.
- Fix all TypeScript and build errors resulting from the removal of generated Supabase types.
- Verify that the app loads, allows "login", and navigates through all pages without backend errors.

## Technical Details

- **Realtime Abstraction**: `useRealtimeRoom` will be refactored to return a mocked interface that triggers local state updates instead of sending network broadcasts.
- **Storage**: All data previously in Supabase tables (`memories`, `schedules`, `messages`) will be mapped to `localStorage` keys like `pookie_memories`, `pookie_schedules`, etc.
- **Types**: Custom interfaces will replace the generated `Database` types from Supabase to ensure TypeSript compatibility.
