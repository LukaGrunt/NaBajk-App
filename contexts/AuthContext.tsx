import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_EMAIL: 'nb_auth_user_email',
  PUSH_PERMISSION_ASKED: 'nb_push_permission_asked',
  PUSH_PERMISSION_STATUS: 'nb_push_permission_status',
};

interface User {
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushPermissionAsked, setPushPermissionAsked] = useState(false);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<string | null>(null);

  // Load stored auth state on mount
  useEffect(() => {
    async function loadAuthState() {
      try {
        const [email, permAsked, permStatus] = await Promise.all([
          AsyncStorage.getItem(KEYS.USER_EMAIL),
          AsyncStorage.getItem(KEYS.PUSH_PERMISSION_ASKED),
          AsyncStorage.getItem(KEYS.PUSH_PERMISSION_STATUS),
        ]);

        if (email) {
          setUser({ email });
        }

        setPushPermissionAsked(permAsked === 'true');
        setPushPermissionStatus(permStatus);
      } catch (error) {
        console.error('Failed to load auth state:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAuthState();
  }, []);

  const signInWithGoogle = async () => {
    // TODO: Implement real Google Sign-In with Supabase
    // await supabase.auth.signInWithOAuth({ provider: 'google' })

    // Mock implementation for now
    const mockEmail = 'user@gmail.com';
    await AsyncStorage.setItem(KEYS.USER_EMAIL, mockEmail);
    setUser({ email: mockEmail });
  };

  const signInWithEmail = async (email: string) => {
    // TODO: Implement real Email Sign-In with Supabase (magic link/OTP)
    // await supabase.auth.signInWithOtp({ email })

    // Mock implementation for now
    await AsyncStorage.setItem(KEYS.USER_EMAIL, email);
    setUser({ email });
  };

  const signOut = async () => {
    // TODO: Implement real sign out with Supabase
    // await supabase.auth.signOut()

    await AsyncStorage.removeItem(KEYS.USER_EMAIL);
    setUser(null);

    // Reset push permission state on sign out
    await AsyncStorage.removeItem(KEYS.PUSH_PERMISSION_ASKED);
    await AsyncStorage.removeItem(KEYS.PUSH_PERMISSION_STATUS);
    setPushPermissionAsked(false);
    setPushPermissionStatus(null);
  };

  const markPushPermissionAsked = async (status: string) => {
    await AsyncStorage.setItem(KEYS.PUSH_PERMISSION_ASKED, 'true');
    await AsyncStorage.setItem(KEYS.PUSH_PERMISSION_STATUS, status);
    setPushPermissionAsked(true);
    setPushPermissionStatus(status);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        pushPermissionAsked,
        pushPermissionStatus,
        markPushPermissionAsked,
      }}
    >
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
