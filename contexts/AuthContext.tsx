import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Configure Google Sign-In
GoogleSignin.configure({
  // Web client ID from Google Cloud Console
  webClientId: '968402921869-0sot9ovufftpjqb9orjvsfnn8vnvspd2.apps.googleusercontent.com',
  iosClientId: '968402921869-0sot9ovufftpjqb9orjvsfnn8vnvspd2.apps.googleusercontent.com',
});

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
        const [permAsked, permStatus] = await Promise.all([
          AsyncStorage.getItem(KEYS.PUSH_PERMISSION_ASKED),
          AsyncStorage.getItem(KEYS.PUSH_PERMISSION_STATUS),
        ]);
        setPushPermissionAsked(permAsked === 'true');
        setPushPermissionStatus(permStatus);

        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await handleDeepLink(initialUrl);
        }

        const { data: { session } } = await supabase.auth.getSession();
        setUser(mapSupabaseUser(session?.user ?? null));
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    }

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSupabaseUser(session?.user ?? null));
    });

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
      // Check if Google Play Services are available (Android only, always true on iOS)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google natively
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error('No ID token returned from Google');
      }

      // Sign in to Supabase with the Google ID token
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.data.idToken,
      });

      if (error) throw error;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled - don't show error
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Sign In', 'Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        console.error('Google sign in failed:', error);
        Alert.alert('Sign In Failed', error.message || 'Unknown error');
      }
      throw error;
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'nabajk://auth/callback',
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Email sign in failed:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Sign out from Google
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if not signed in with Google
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

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
