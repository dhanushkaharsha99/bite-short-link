import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { shortCode } = await req.json();

    if (!shortCode) {
      return new Response(
        JSON.stringify({ error: 'Short code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Look up the original URL
    const { data, error } = await supabase
      .from('shortened_urls')
      .select('original_url, click_count')
      .eq('short_code', shortCode)
      .single();

    if (error || !data) {
      console.error('URL not found:', shortCode, error);
      return new Response(
        JSON.stringify({ error: 'Short URL not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Increment click count in background
    supabase
      .from('shortened_urls')
      .update({ click_count: (data.click_count || 0) + 1 })
      .eq('short_code', shortCode)
      .then(({ error: updateError }) => {
        if (updateError) {
          console.error('Failed to update click count:', updateError);
        }
      });

    console.log('Redirecting:', shortCode, '->', data.original_url);

    return new Response(
      JSON.stringify({ redirectUrl: data.original_url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in redirect-url function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});