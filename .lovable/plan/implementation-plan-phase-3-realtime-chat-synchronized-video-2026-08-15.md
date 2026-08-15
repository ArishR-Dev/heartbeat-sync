---
name: Pookie Heart Sync - Phase 3 (Chat & Video)
description: Implementation plan for persistent real-time chat and synchronized video playback.
type: feature
---
## Implementation Plan - Phase 3: Realtime Chat & Synchronized Video

### 1. Phase 3A: Realtime Chat
- **Database Logic**: Verify `messages` table policies and structure.
- **Message Service**: Create `src/lib/services/chatService.ts` to handle fetching history and sending messages to Supabase.
- **Chat Hook**: Refactor existing chat logic to use real-time subscriptions for incoming messages.
- **Deduplication**: Implement optimistic UI with client-side IDs and server reconciliation.
- **Typing Indicators**: Use Supabase Realtime Presence to broadcast and display "typing" status.

### 2. Phase 3B: Synchronized Video
- **Shared State**: Update `rooms` table to act as the source of truth for `media_url`, `is_playing`, `position`, and `updated_at`.
- **Sync Hook**: Create `src/hooks/useVideoSync.ts` to handle broadcasting and receiving playback events.
- **Drift Correction**: Calculate expected position using `position + (now - updated_at)` and adjust playback if drift exceeds a threshold (e.g., 2 seconds).
- **Host Control**: Enforce `host_id` permissions for playback control if `hostOnlyControl` is enabled.
- **Loop Prevention**: Distinguish between local user actions and remote sync events to prevent infinite loops.

### 3. Frontend Integration
- **ChatPanel**: Connect to the new real-time chat service while preserving existing UI/animations.
- **VideoPlayer**: Connect to the sync hook to listen for remote commands and broadcast local changes.

### 4. Verification
- **Two-Device Test**:
    - Verify chat messages appear instantly on both devices.
    - Verify Play/Pause/Seek synchronizes across devices.
    - Verify "Drift Correction" works after network interruption.
- **Build**: Ensure `npm run build` succeeds.
