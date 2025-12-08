import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CSVRow {
  Symbol: string;
  "Kod kreskowy": string | null;
  Nazwa: string | null;
  Kontener: string | null;
  Regał: string | null;
  Półka: string | null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]);
  
  console.log('CSV Headers:', headers);
  
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= 1 && values[0]) {
      rows.push({
        Symbol: values[0] || '',
        "Kod kreskowy": values[1] || null,
        Nazwa: values[2] || null,
        Kontener: values[3] || null,
        Regał: values[4] || null,
        Półka: values[5] || null,
      });
    }
  }
  
  return rows;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify caller is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { csvContent } = await req.json()
    
    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'CSV content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Parsing CSV content, length:', csvContent.length)
    
    const rows = parseCSV(csvContent)
    console.log('Parsed rows count:', rows.length)

    // First, clear existing data (optional - skip duplicates instead)
    // await supabaseAdmin.from('Lokalizacje').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert in batches of 500
    const batchSize = 500
    let inserted = 0
    let errors = 0

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      
      const { error } = await supabaseAdmin
        .from('Lokalizacje')
        .upsert(batch, { 
          onConflict: 'Symbol',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error.message)
        errors += batch.length
      } else {
        inserted += batch.length
        console.log(`Batch ${Math.floor(i / batchSize) + 1} inserted: ${batch.length} rows`)
      }
    }

    console.log('Import complete:', { inserted, errors, total: rows.length })

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: inserted,
        errors,
        total: rows.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Import error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})