CREATE TABLE IF NOT EXISTS public.island_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users(id)
    island_id TEXT NOT NULL REFERENCES public.islands(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    visited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, island_id)
);

ALTER TABLE public.island_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visits" ON public.island_visits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visits" ON public.island_visits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visits" ON public.island_visits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visits" ON public.island_visits
  FOR DELETE USING (auth.uid() = user_id);
