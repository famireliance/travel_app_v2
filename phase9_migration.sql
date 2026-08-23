-- Phase 9 Migration: Certificates, Visit Logs, User Titles, and User Profiles extension

-- 1. Extend user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS total_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS player_level INT DEFAULT 1;

-- 2. Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    island_id TEXT NOT NULL REFERENCES public.islands(id) ON DELETE CASCADE,
    serial_number INT NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(island_id, serial_number)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Island Visit Logs
CREATE TABLE IF NOT EXISTS public.island_visit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    island_id TEXT NOT NULL REFERENCES public.islands(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.island_visit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own visit logs" ON public.island_visit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own visit logs" ON public.island_visit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. User Titles
CREATE TABLE IF NOT EXISTS public.user_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title_id TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, title_id)
);

ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own titles" ON public.user_titles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own titles" ON public.user_titles FOR INSERT WITH CHECK (auth.uid() = user_id);
