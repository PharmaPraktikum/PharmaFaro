// ============================================
// PharmaFaro – Supabase Client Setup
// Die Bibliothek wird lokal ausgeliefert (js/vendor/supabase.js, UMD) und muss
// per <script src="./js/vendor/supabase.js"></script> VOR den Modulen geladen werden.
// ============================================
window.SUPABASE_URL = 'https://wotwmwcgbihlhlcwlvbm.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvdHdtd2NnYmlobGhsY3dsdmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzc4MDcsImV4cCI6MjA4NjA1MzgwN30.Zwt-clrOnntZQZ_NvpKJVB5xBCZTl_PgzrC9F_7F-uU';

const lib = window.supabase;
if (!lib || typeof lib.createClient !== 'function') {
    throw new Error('supabase.js (UMD) wurde nicht vor supabase-client.js geladen');
}

export const supabase = lib.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
