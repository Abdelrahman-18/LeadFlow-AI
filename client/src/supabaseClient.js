import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kbnegfabfehhzkznofop.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibmVnZmFiZmVoaHprem5vZm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MzI3MzUsImV4cCI6MjEwMjAwODczNX0.XSOvCUAoHylpkcUSIrbKYQfZTM7SUCwwOIbJ8dxD1pM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
