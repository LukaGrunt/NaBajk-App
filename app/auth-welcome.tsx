import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Inter_300Light, Inter_400Regular } from '@expo-google-fonts/inter';
import { VideoBackground } from '@/components/auth/VideoBackground';
import { LogoTile } from '@/components/auth/LogoTile';
import { AuthButton } from '@/components/auth/AuthButton';
import { EmailSignInModal } from '@/components/auth/EmailSignInModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const strings = {
  SLO: {
    tagline: 'Izberi pot. Poglej razmere. Pojdi vozit.',
    googleButton: 'Prijava z Google',
    emailButton: 'Prijava z e-pošto',
  },
  ENG: {
    tagline: 'Pick a route. Check conditions. Go ride.',
    googleButton: 'Continue with Google',
    emailButton: 'Continue with Email',
  },
};

export default function AuthWelcomeScreen() {
  const router = useRouter();
  const { user, signInWithGoogle, signInWithEmail } = useAuth();
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { language, setLanguage } = useLanguage();

  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Redirect to main app when user signs in
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign in failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (email: string) => {
    await signInWithEmail(email);
  };

  if (!fontsLoaded) {
    return null;
  }

  const authLang = language === 'sl' ? 'SLO' : 'ENG';
  const t = strings[authLang];

  return (
    <View style={styles.container}>
      {/* Background Video */}
      <VideoBackground />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Temporary Skip Button - Top Right */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleGoogleSignIn}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip (Dev)</Text>
        </TouchableOpacity>

        {/* Center Section - Logo */}
        <View style={styles.centerSection}>
          <LogoTile />
          <Text style={styles.tagline}>{t.tagline}</Text>
        </View>

        {/* Bottom Section - Text, Language Toggle and Auth Buttons */}
        <View style={styles.bottomSection}>
          {/* Welcome Text */}
          <Text style={styles.welcomeText}>Gremo NaBajk</Text>

          {/* Language Toggle */}
          <View style={styles.languageToggle}>
            <TouchableOpacity
              style={[styles.languageButton, language === 'sl' && styles.languageButtonActive]}
              onPress={() => setLanguage('sl')}
              activeOpacity={0.7}
            >
              <Text style={[styles.languageText, language === 'sl' && styles.languageTextActive]}>
                SLO
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.7}
            >
              <Text style={[styles.languageText, language === 'en' && styles.languageTextActive]}>
                ENG
              </Text>
            </TouchableOpacity>
          </View>

          {/* Auth Buttons */}
          <AuthButton
            label={t.googleButton}
            onPress={handleGoogleSignIn}
            loading={loading}
            icon="google"
          />
          <AuthButton
            label={t.emailButton}
            onPress={() => setEmailModalVisible(true)}
            icon="envelope"
          />
        </View>
      </Animated.View>

      {/* Email Sign-In Modal */}
      <EmailSignInModal
        visible={emailModalVisible}
        language={authLang}
        onClose={() => setEmailModalVisible(false)}
        onSubmit={handleEmailSignIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03130E',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagline: {
    fontSize: 15,
    fontFamily: 'Inter_300Light',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'Inter_300Light',
    color: '#FFFFFF',
    letterSpacing: 4,
    textAlign: 'center',
  },
  bottomSection: {
    gap: 24,
  },
  languageToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 50,
    padding: 4,
    gap: 4,
  },
  languageButton: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 50,
  },
  languageButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  languageTextActive: {
    color: '#000000',
  },
  skipButton: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
