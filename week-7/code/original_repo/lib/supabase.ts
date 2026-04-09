import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://kmwyatnrzrbygwaygtku.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3lhdG5yenJieWd3YXlndGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MzY4MTcsImV4cCI6MjA5MTExMjgxN30.m63kugViT2H5gPUa01bTCyHUjOnVuEtNclGDf0fFqj8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});