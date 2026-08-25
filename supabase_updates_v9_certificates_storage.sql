-- Create storage bucket for certificates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the 'certificates' bucket
CREATE POLICY "Public Access Certificates" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'certificates');

CREATE POLICY "Authenticated users can upload certificates" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own certificates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificates' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

-- Add image_url to certificates table
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS image_url TEXT;
