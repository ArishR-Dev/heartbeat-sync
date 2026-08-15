-- Create messages table for Realtime
CREATE TABLE public.messages (
    id uuid primary key default gen_random_uuid(),
    room_code text not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    text text not null,
    created_at timestamptz default now()
);

-- Grant access
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for now, assuming room access logic is handled via code or future RLS)
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read room messages" ON public.messages FOR SELECT TO authenticated USING (true);

-- Enable Realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
