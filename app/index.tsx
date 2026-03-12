import { useEffect, useState, useRef } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTermsAccepted } from '@/utils/localSettings';

const QUOTES: Record<string, string[]> = {
  sl: [
    'Vsaka pot se začne z enim pedalnim udarcem.',
    'Pojdi ven. Pojdi kolesarit.',
    'Pot je nagrada.',
  ],
  en: [
    'Every journey starts with one pedal stroke.',
    'Get out. Go ride.',
    'The road is the reward.',
  ],
};

export default function Index() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [minReady, setMinReady] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const quoteRef = useRef('');

  // Logo animation
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    // Pick a random quote
    const lang = language === 'sl' ? 'sl' : 'en';
    const pool = QUOTES[lang];
    quoteRef.current = pool[Math.floor(Math.random() * pool.length)];

    // Animate logo in
    opacity.value = withTiming(1, { duration: 600 });
    translateY.value = withTiming(0, { duration: 600 });

    // Start typewriter after 500ms
    let charIndex = 0;
    const typeTimer = setTimeout(() => {
      const interval = setInterval(() => {
        charIndex += 1;
        setDisplayedText(quoteRef.current.slice(0, charIndex));
        if (charIndex >= quoteRef.current.length) clearInterval(interval);
      }, 45);
      return () => clearInterval(interval);
    }, 500);

    // Minimum display time
    const minTimer = setTimeout(() => setMinReady(true), 2500);

    return () => {
      clearTimeout(typeTimer);
      clearTimeout(minTimer);
    };
  }, []);

  useEffect(() => {
    if (authLoading || !minReady) return;

    if (!user) {
      router.replace('/auth-welcome');
      return;
    }

    getTermsAccepted().then((accepted) => {
      if (!accepted) {
        router.replace('/terms-acceptance');
      } else {
        router.replace('/(tabs)');
      }
    });
  }, [authLoading, minReady, user]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('@/assets/images/logo-navbar.png')}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
      <Text style={styles.quote}>{displayedText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0B',
    paddingHorizontal: 32,
  },
  logo: {
    width: 180,
    height: 60,
    marginBottom: 40,
  },
  quote: {
    color: '#888',
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    minHeight: 44,
  },
});
