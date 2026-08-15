-- Create memories table
CREATE TABLE public.memories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    emoji text not null,
    date text not null,
    created_at timestamptz default now()
);

-- Create schedules table
CREATE TABLE public.schedules (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    date text not null,
    time text not null,
    created_at timestamptz default now()
);

-- Create secret_messages table
CREATE TABLE public.secret_messages (
    id uuid primary key default gen_random_uuid(),
    sender_id uuid references auth.users(id) on delete cascade not null,
    receiver_id uuid, -- Optional, can be used for targeted secrets
    text text not null,
    reveal_type text not null, -- 'timer' or 'click'
    timer_seconds integer,
    revealed boolean default false,
    created_at timestamptz default now()
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.secret_messages TO authenticated;
GRANT ALL ON public.memories TO service_role;
GRANT ALL ON public.schedules TO service_role;
GRANT ALL ON public.secret_messages TO service_role;

-- Enable RLS
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_messages ENABLE ROW LEVEL SECURITY;

-- Basic Policies (scope to owner)
CREATE POLICY "Users can manage their own memories" ON public.memories FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own schedules" ON public.schedules FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own secret messages" ON public.secret_messages FOR ALL TO authenticated USING (auth.uid() = sender_id);

-- Enable Realtime for these tables as well
ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.secret_messages;
