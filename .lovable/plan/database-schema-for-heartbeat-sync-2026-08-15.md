# Database Schema for Heartbeat Sync

The synced repository relies on Supabase for authentication and real-time communication. The following schema has been provisioned:

## Tables

### `public.messages`
Used for real-time chat between room participants.
- `id`: uuid (PK)
- `room_code`: text
- `user_id`: uuid (FK to auth.users)
- `text`: text
- `created_at`: timestamptz

### `public.user_roles`
Used for role-based access control.
- `id`: uuid (PK)
- `user_id`: uuid (FK to auth.users)
- `role`: app_role (enum: 'admin', 'moderator', 'user')

## Realtime Configuration
- The `messages` table is added to the `supabase_realtime` publication.
- Presence and Broadcast features are used for cursor tracking, video sync, and reaction effects.

## Authentication
- Email/Password sign-up and login.
- Google OAuth (Managed by Lovable Cloud).
