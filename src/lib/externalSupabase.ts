import { createClient } from '@supabase/supabase-js';

// External Supabase project with existing inventory data
const EXTERNAL_SUPABASE_URL = 'https://eccsxhhfbkfcsddwpanl.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjY3N4aGhmYmtmY3NkZHdwYW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzU2OTEsImV4cCI6MjA4MDYxMTY5MX0.lVUxvPAFLvEeWGK55O24gsqxFdhQ3W3rA0oZkSJUB1k';

export const externalSupabase = createClient(
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_ANON_KEY
);
