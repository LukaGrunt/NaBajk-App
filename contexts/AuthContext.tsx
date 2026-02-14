import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Required for expo-auth-session to work properly
WebBrowser.maybeCompleteAuthSession();

const KEYS = {
  PUSH_PERMISSION_ASKED: 'nb_push_permission_asked',
  PUSH_PERMISSION_STATUS: 'nb_push_permission_status',
};

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  pushPermissionAsked: boolean;
  pushPermissionStatus: string | null;
  markPushPermissionAsked: (status: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(supabaseUser: SupabaseUser | null): User | null {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushPermissionAsked, setPushPermissionAsked] = useState(false);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<string | null>(null);

  // Handle deep link URLs (for email magic links)
  const handleDeepLink = useCallback(async (url: string) => {
    try {
      // Parse tokens from URL hash (e.g., nabajk://auth/callback#access_token=...&refresh_token=...)
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return;

      const hash = url.substring(hashIndex + 1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        if (error) console.error('Failed to set session from deep link:', error);
      }
    } catch (error) {
      console.error('Failed to handle deep link:', error);
    }
  }, []);

  // Load stored state and listen to auth changes
  useEffect(() => {
    async function initialize() {
      try {
        // Load push permission state
        const [permAsked, permStatus] = await Promise.all([
          AsyncStorage.getItem(KEYS.PUSH_PERMISSION_ASKED),
          AsyncStorage.getItem(KEYS.PUSH_PERMISSION_STATUS),
        ]);
        setPushPermissionAsked(permAsked === 'true');
        setPushPermissionStatus(permStatus);

        // Check for initial deep link (app opened via URL)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await handleDeepLink(initialUrl);
        }

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        setUser(mapSupabaseUser(session?.user ?? null));
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    }

    initialize();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSupabaseUser(session?.user ?? null));
    });

    // Listen for deep links while app is running
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, [handleDeepLink]);

  const signInWithGoogle = useCallback(async () => {
    try {
      // Create redirect URI for the app
      const redirectUri = makeRedirectUri({
        scheme: 'nabajk',
        path: 'auth/callback',
      });

      console.log('Google OAuth redirect URI:', redirectUri);

      // Get OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      console.log('Opening OAuth URL...');

      // Open browser for Google sign-in
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri,
        { showInRecents: true }
      );

      console.log('OAuth result type:', result.type);
      if (result.type === 'success') {
        console.log('OAuth success URL:', result.url);
        // Extract tokens from the URL
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.substring(1)); // Remove #

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        console.log('Access token found:', !!accessToken);

        if (accessToken) {
          // Set the session with the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) throw sessionError;
          console.log('Session set successfully');
        }
      } else {
        console.log('OAuth was cancelled or dismissed');
      }
    } catch (error) {
      console.error('Google sign in failed:', error);
      throw error;
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    try {
      // Create redirect URI for the app
      const redirectUri = makeRedirectUri({
        scheme: 'nabajk',
        path: 'auth/callback',
      });

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUri,
        },
      });

      if (error) throw error;

      // For magic link, user clicks link in email which will redirect back to app
      // The onAuthStateChange listener will handle the session
    } catch (error) {
      console.error('Email sign in failed:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Reset push permission state on sign out
      await AsyncStorage.removeItem(KEYS.PUSH_PERMISSION_ASKED);
      await AsyncStorage.removeItem(KEYS.PUSH_PERMISSION_STATUS);
      setPushPermissionAsked(false);
      setPushPermissionStatus(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }, []);

  const markPushPermissionAsked = useCallback(async (status: string) => {
    await AsyncStorage.setItem(KEYS.PUSH_PERMISSION_ASKED, 'true');
    await AsyncStorage.setItem(KEYS.PUSH_PERMISSION_STATUS, status);
    setPushPermissionAsked(true);
    setPushPermissionStatus(status);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signOut,
      pushPermissionAsked,
      pushPermissionStatus,
      markPushPermissionAsked,
    }),
    [user, loading, signInWithGoogle, signInWithEmail, signOut, pushPermissionAsked, pushPermissionStatus, markPushPermissionAsked]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
