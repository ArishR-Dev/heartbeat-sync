# Pookie Heart Sync Backend Reconstruction Plan

We are rebuilding the backend from scratch for this new Lovable project, reconnecting it to the existing recovered frontend without changing the UI.

## Phase 1: Infrastructure & Authentication
- Provision initial database schema (Users, Profiles, Couples, Rooms, Messages, etc.).
- Enable Row Level Security (RLS) and Realtime on all public tables.
- Re-implement `AuthContext.tsx` to use the new backend auth.
- Update `LoginPage.tsx` to work with real auth.

## Phase 2: Couple & Pairing System
- Implement a two-person pairing system with difficult-to-guess codes.
- Create policies to ensure only paired users can interact.
- Implement Presence system for online/offline status.

## Phase 3: Room & State Synchronization
- Convert local room logic to backend rooms.
- Implement synchronized room state (Mood themes, active modes).
- Add reconnection logic.

## Phase 4: Chat & Presence
- Reconnect Chat UI to the database with realtime updates.
- Implement typing indicators via ephemeral realtime events.
- Maintain message history.

## Phase 5: Video Synchronization & Games
- Implement authoritative video state with drift correction.
- Reconnect Tic Tac Toe, Connect Four, and Dots & Boxes.
- Synchronize turns and board states.

## Phase 6: Signature Features
- Reconnect "Hold Hands" mode state machine.
- Reconnect Shared Cursors (using ephemeral realtime).
- Reconnect Memories, Secret Messages, and Schedules to persistent storage.

## Phase 7: Reliability & Audit
- Final security audit of RLS policies.
- Performance optimization for realtime events.
- Graceful error handling for connection loss.

## Technical Details
- **Auth:** Managed Google OAuth and Email/Password.
- **Realtime:** Ephemeral events for cursors/typing, persistent for chat/state.
- **Storage:** LocalStorage for UI preferences, Database for shared truth.
- **Ownership:** User -> Couple -> Shared Entities.
