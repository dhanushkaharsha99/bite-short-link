-- Create table for URL mappings
CREATE TABLE IF NOT EXISTS public.shortened_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_url TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  click_count INTEGER DEFAULT 0,
  CONSTRAINT short_code_length CHECK (length(short_code) >= 3 AND length(short_code) <= 50)
);

-- Create index for fast lookups
CREATE INDEX idx_short_code ON public.shortened_urls(short_code);
CREATE INDEX idx_created_at ON public.shortened_urls(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.shortened_urls ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read shortened URLs (needed for redirects)
CREATE POLICY "Anyone can read shortened URLs" 
ON public.shortened_urls 
FOR SELECT 
USING (true);

-- Allow anyone to insert shortened URLs (no auth required)
CREATE POLICY "Anyone can create shortened URLs" 
ON public.shortened_urls 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update click counts
CREATE POLICY "Anyone can update click counts" 
ON public.shortened_urls 
FOR UPDATE 
USING (true);