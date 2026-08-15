-- Fix linter warnings and add missing policies
alter function public.handle_new_user() set search_path = public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.handle_new_user() from anon;

-- Policies for Messages
create policy "Users can view messages in their couples"
on public.messages for select to authenticated
using (couple_id in (
  select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
));

create policy "Users can insert messages in their couples"
on public.messages for insert to authenticated
with check (couple_id in (
  select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
) and sender_id = auth.uid());

-- Policies for Rooms
create policy "Users can view rooms in their couples"
on public.rooms for select to authenticated
using (couple_id in (
  select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
));

create policy "Users can insert/update rooms in their couples"
on public.rooms for all to authenticated
using (couple_id in (
  select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
));

-- Policies for Memories
create policy "Users can view memories in their couples"
on public.memories for select to authenticated
using (couple_id in (
  select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
));

create policy "Users can manage memories in their couples"
on public.memories for all to authenticated
using (couple_id in (
  select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
));

-- Policies for Schedules
create policy "Users can view schedules in their couples"
on public.schedules for select to authenticated
using (couple_id in (
  select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
));

create policy "Users can manage schedules in their couples"
on public.schedules for all to authenticated
using (couple_id in (
  select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
));

-- Policies for Secret Messages
create policy "Users can view secret messages in their couples"
on public.secret_messages for select to authenticated
using (couple_id in (
  select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
));

create policy "Users can insert secret messages in their couples"
on public.secret_messages for insert to authenticated
with check (couple_id in (
  select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
) and sender_id = auth.uid());

create policy "Users can update their own secret messages (reveal)"
on public.secret_messages for update to authenticated
using (couple_id in (
  select id from public.couples where user1_id = auth.uid() or user2_id = auth.uid()
));

-- Policies for User Roles
create policy "Users can view their own roles"
on public.user_roles for select to authenticated
using (user_id = auth.uid());
