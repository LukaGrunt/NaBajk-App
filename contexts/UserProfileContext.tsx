import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
const DEFAULT_USER_ID = 'user-lea'; // Mock user ID

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (stored) {
        setUserProfile(JSON.parse(stored));
      } else {
        // Initialize with default user ID but no name
        setUserProfile({ userId: DEFAULT_USER_ID, name: '' });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUserProfile({ userId: DEFAULT_USER_ID, name: '' });
    }
  };

  const setUserName = async (name: string) => {
    try {
      const profile: UserProfile = {
        userId: userProfile?.userId || DEFAULT_USER_ID,
        name: name.trim(),
      };
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to save user profile:', error);
      throw error;
    }
  };

  const hasName = Boolean(userProfile?.name && userProfile.name.trim().length > 0);

  return (
    <UserProfileContext.Provider value={{ userProfile, setUserName, hasName }}>
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
