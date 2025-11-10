-- Create shortened_urls table
CREATE TABLE IF NOT EXISTS public.shortened_urls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_code TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shortened_urls_short_code ON public.shortened_urls(short_code);

-- Enable Row Level Security
ALTER TABLE public.shortened_urls ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public URL shortener)
CREATE POLICY "Anyone can create shortened URLs"
  ON public.shortened_urls
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view shortened URLs"
  ON public.shortened_urls
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update click counts"
  ON public.shortened_urls
  FOR UPDATE
  USING (true);