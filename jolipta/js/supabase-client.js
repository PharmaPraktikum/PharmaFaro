// ============================================
// PharmaFaro – Supabase Client Setup
// ============================================

// WICHTIG: Ersetze diese Werte mit deinen eigenen!
window.SUPABASE_URL = 'https://wotwmwcgbihlhlcwlvbm.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvdHdtd2NnYmlobGhsY3dsdmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzc4MDcsImV4cCI6MjA4NjA1MzgwN30.Zwt-clrOnntZQZ_NvpKJVB5xBCZTl_PgzrC9F_7F-uU';

// Importiere Supabase von CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Erstelle Supabase Client
export const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

console.log('✅ PharmaFaro – Supabase Client initialisiert');
