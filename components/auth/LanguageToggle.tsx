import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'nb_language';

export type AuthLanguage = 'SLO' | 'ENG';

interface LanguageToggleProps {
  onLanguageChange?: (lang: AuthLanguage) => void;
}

export function LanguageToggle({ onLanguageChange }: LanguageToggleProps) {
  const [language, setLanguage] = useState<AuthLanguage>('SLO');

  useEffect(() => {
    async function loadLanguage() {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (stored === 'SLO' || stored === 'ENG') {
        setLanguage(stored);
      }
    }
    loadLanguage();
  }, []);

  const handleLanguageChange = async (lang: AuthLanguage) => {
    setLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    onLanguageChange?.(lang);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, language === 'SLO' && styles.buttonActive]}
        onPress={() => handleLanguageChange('SLO')}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, language === 'SLO' && styles.textActive]}>SLO</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, language === 'ENG' && styles.buttonActive]}
        onPress={() => handleLanguageChange('ENG')}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, language === 'ENG' && styles.textActive]}>ENG</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    minWidth: 80,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: 'rgba(0, 188, 124, 0.15)',
    borderColor: '#00BC7C',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  textActive: {
    color: '#FFFFFF',
  },
});
