import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// TODO: Add actual Supabase credentials to .env file:
// EXPO_PUBLIC_SUPABASE_URL=your-project-url
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// TODO: Wire this client into AuthContext:
// - Replace mock signInWithGoogle with: supabase.auth.signInWithOAuth({ provider: 'google' })
// - Replace mock signInWithEmail with: supabase.auth.signInWithOtp({ email })
// - Replace mock signOut with: supabase.auth.signOut()
// - Listen to auth state changes: supabase.auth.onAuthStateChange((event, session) => { ... })
