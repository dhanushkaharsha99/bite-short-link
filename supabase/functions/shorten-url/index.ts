import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a random short code
function generateShortCode(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Validate URL
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Validate custom slug
function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return slugRegex.test(slug);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { originalUrl, customSlug } = await req.json();

    // Validate original URL
    if (!originalUrl || !isValidUrl(originalUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    let shortCode = customSlug;

    // If custom slug provided, validate it
    if (customSlug) {
      if (!isValidSlug(customSlug)) {
        return new Response(
          JSON.stringify({ error: 'Invalid custom slug. Use 3-50 alphanumeric characters, hyphens, or underscores.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Check if custom slug already exists
      const { data: existing } = await supabase
        .from('shortened_urls')
        .select('short_code')
        .eq('short_code', customSlug)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'This custom slug is already taken. Please try another one.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        );
      }
    } else {
      // Generate random short code
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        shortCode = generateShortCode();

        const { data: existing } = await supabase
          .from('shortened_urls')
          .select('short_code')
          .eq('short_code', shortCode)
          .single();

        if (!existing) break;
        attempts++;
      }

      if (attempts >= maxAttempts) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate unique short code. Please try again.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Insert into database
    const { data, error } = await supabase
      .from('shortened_urls')
      .insert({
        original_url: originalUrl,
        short_code: shortCode,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create shortened URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Successfully created shortened URL:', data);

    return new Response(
      JSON.stringify({
        shortCode: data.short_code,
        originalUrl: data.original_url,
        shortUrl: `https://urlbite.site/${data.short_code}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in shorten-url function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});