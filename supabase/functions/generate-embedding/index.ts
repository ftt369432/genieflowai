import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// OpenAI API embeddings endpoint
const OPENAI_EMBEDDING_ENDPOINT = 'https://api.openai.com/v1/embeddings';
const OPENAI_EMBEDDING_MODEL = 'text-embedding-ada-002';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text parameter is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean and truncate the text
    const input = text.replace(/\n/g, ' ').trim();

    // Check if OpenAI API key is available
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not found. Make sure OPENAI_API_KEY is set in your environment variables.',
          // Return a zero-filled embedding as a fallback
          embedding: new Array(1536).fill(0)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embedding using OpenAI API
    const embeddingResponse = await fetch(OPENAI_EMBEDDING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_EMBEDDING_MODEL,
        input: input
      })
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const { data } = await embeddingResponse.json();
    const embedding = data[0].embedding;

    // Create Supabase client with admin privileges
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Log the embedding generation in the database for monitoring purposes
    await supabase
      .from('embedding_logs')
      .insert({
        text_length: input.length,
        model: OPENAI_EMBEDDING_MODEL,
        dimensions: embedding.length,
        status: 'success'
      });

    return new Response(
      JSON.stringify({ embedding }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating embedding:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        // Return a zero-filled embedding as a fallback
        embedding: new Array(1536).fill(0)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 