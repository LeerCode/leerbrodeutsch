// js/supabase-config.js

// ⚠️ WAJIB DIISI: Ganti dengan URL dan ANON KEY dari project Supabase kamu
const SUPABASE_URL = 'https://https://xpttaqnqlyuhkawnrxjz.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_wPIhYEY6dyDxJhNDbUkI-Q_nrn-tWiO'; 

// Kita gunakan nama 'supabaseClient' agar terhindar dari SyntaxError
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
