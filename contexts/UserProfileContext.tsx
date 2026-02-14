import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

interface UserProfile {
  name: string;
  userId: string;
}

interface UserProfileContextType {
  userProfile: UserProfile | null;
  setUserName: (name: string) => Promise<void>;
  hasName: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

const USER_PROFILE_KEY = '@nabajk_user_profile';

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load profile when user changes
  useEffect(() => {
    if (user?.id) {
      loadUserProfile(user.id);
    } else {
      setUserProfile(null);
    }
  }, [user?.id]);

  const loadUserProfile = async (userId: string) => {
    try {
      const stored = await AsyncStorage.getItem(`${USER_PROFILE_KEY}_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure userId matches current auth user
        setUserProfile({ ...parsed, userId });
      } else {
        // Initialize with authenticated user ID but no name
        setUserProfile({ userId, name: '' });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUserProfile({ userId, name: '' });
    }
  };

  const setUserName = useCallback(async (name: string) => {
    if (!user?.id) {
      throw new Error('Cannot set user name without authenticated user');
    }

    try {
      const profile: UserProfile = {
        userId: user.id,
        name: name.trim(),
      };
      await AsyncStorage.setItem(`${USER_PROFILE_KEY}_${user.id}`, JSON.stringify(profile));
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to save user profile:', error);
      throw error;
    }
  }, [user?.id]);

  const hasName = Boolean(userProfile?.name && userProfile.name.trim().length > 0);

  const value = useMemo(() => ({
    userProfile,
    setUserName,
    hasName,
  }), [userProfile, setUserName, hasName]);

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
