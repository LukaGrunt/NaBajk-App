import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Missing Supabase credentials. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// TODO: Wire this client into AuthContext:
// - Replace mock signInWithGoogle with: supabase.auth.signInWithOAuth({ provider: 'google' })
// - Replace mock signInWithEmail with: supabase.auth.signInWithOtp({ email })
// - Replace mock signOut with: supabase.auth.signOut()
// - Listen to auth state changes: supabase.auth.onAuthStateChange((event, session) => { ... })
