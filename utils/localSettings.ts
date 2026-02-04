import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, RiderLevel } from '@/constants/i18n';

const KEYS = {
  LANGUAGE: 'nabajk_language',
  RIDER_LEVEL: 'nabajk_rider_level',
  ONBOARDING_DONE: 'nabajk_onboarding_done',
};

// Language
export async function getLanguage(): Promise<Language> {
  const value = await AsyncStorage.getItem(KEYS.LANGUAGE);
  return (value as Language) || 'sl';
}

export async function setLanguage(lang: Language): Promise<void> {
  await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
}

// Rider Level
export async function getRiderLevel(): Promise<RiderLevel> {
  const value = await AsyncStorage.getItem(KEYS.RIDER_LEVEL);
  return (value as RiderLevel) || 'intermediate';
}

export async function setRiderLevel(level: RiderLevel): Promise<void> {
  await AsyncStorage.setItem(KEYS.RIDER_LEVEL, level);
}

// Onboarding
export async function getOnboardingDone(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return value === 'true';
}

export async function setOnboardingDone(done: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, done ? 'true' : 'false');
}

// Reset onboarding (DEV only)
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.ONBOARDING_DONE);
}
