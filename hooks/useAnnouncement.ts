import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getLatestAnnouncement, Announcement } from '@/lib/announcements';
import { Language } from '@/constants/i18n';

function seenKey(id: string, lang: Language): string {
  return `seen_announcement:${Constants.expoConfig?.version ?? '0.0.0'}:${id}:${lang}`;
}

export function useAnnouncement(language: Language) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchAndCheck();
  }, [language]);

  const fetchAndCheck = async () => {
    try {
      const latest = await getLatestAnnouncement(language);
      if (!latest) return;

      const alreadySeen = await AsyncStorage.getItem(seenKey(latest.id, language));
      if (alreadySeen) return;

      setAnnouncement(latest);
      setVisible(true);
    } catch {
      // Network failure or storage error — silently skip
    }
  };

  const dismiss = async () => {
    setVisible(false);
    if (announcement) {
      try {
        await AsyncStorage.setItem(seenKey(announcement.id, language), 'true');
      } catch {
        // Best-effort persist; won't re-show in this session anyway
      }
    }
  };

  return { announcement, visible, dismiss };
}
