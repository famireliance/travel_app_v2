-- Create newsletters table for delivery history
CREATE TABLE IF NOT EXISTS public.newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    target_tier TEXT NOT NULL DEFAULT 'all', -- 'all', 'free', 'premium', 'ultimate'
    sent_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    promo_code_id UUID REFERENCES public.app_promo_codes(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

-- Only service role can manage newsletters in MVP (or add specific admin policies if needed)
CREATE POLICY "Admins can view newsletters" ON public.newsletters FOR SELECT USING (true);
