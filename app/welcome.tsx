import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { Language, RiderLevel, t } from '@/constants/i18n';
import { setLanguage, setRiderLevel, setOnboardingDone } from '@/utils/localSettings';

const LEVEL_ICONS = {
  beginner: '🚴',
  intermediate: '🚴‍♂️',
  hardcore: '🏆',
} as const;

export default function WelcomeScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [language, setLanguageState] = useState<Language>('sl');
  const [level, setLevel] = useState<RiderLevel>('intermediate');

  // Animation values
  const heroAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = async () => {
    await setLanguage(language);
    await setRiderLevel(level);
    await setOnboardingDone(true);
    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    await setLanguage('sl');
    await setRiderLevel('intermediate');
    await setOnboardingDone(true);
    router.replace('/(tabs)');
  };

  const isShortScreen = height < 700;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.layout}>
        {/* HERO SECTION */}
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Logo with green glow */}
          <View style={styles.logoContainer}>
            <View style={styles.logoGlow} />
            <Image
              source={require('@/assets/images/logo.png')}
              style={[styles.logo, isShortScreen && styles.logoSmall]}
              resizeMode="contain"
            />
          </View>

          {/* Hero headline */}
          <Text style={[styles.heroTitle, isShortScreen && styles.heroTitleSmall]}>
            {t(language, 'heroTitle')}
          </Text>
        </Animated.View>

        {/* BOTTOM SHEET */}
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: sheetAnim,
              transform: [
                {
                  translateY: sheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            style={styles.sheetScroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Language Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t(language, 'languageSectionLabel')}</Text>
              <View style={styles.languageSegment}>
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    language === 'sl' && styles.languageOptionActive,
                  ]}
                  onPress={() => setLanguageState('sl')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flagEmoji}>🇸🇮</Text>
                  <Text
                    style={[
                      styles.languageText,
                      language === 'sl' && styles.languageTextActive,
                    ]}
                  >
                    SL
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    language === 'en' && styles.languageOptionActive,
                  ]}
                  onPress={() => setLanguageState('en')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flagEmoji}>🇬🇧</Text>
                  <Text
                    style={[
                      styles.languageText,
                      language === 'en' && styles.languageTextActive,
                    ]}
                  >
                    EN
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Level Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t(language, 'levelSectionLabel')}</Text>
              <View style={styles.levelList}>
                {(['beginner', 'intermediate', 'hardcore'] as const).map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.levelRow,
                      level === lvl && styles.levelRowActive,
                    ]}
                    onPress={() => setLevel(lvl)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.levelIcon}>{LEVEL_ICONS[lvl]}</Text>
                    <View style={styles.levelContent}>
                      <Text
                        style={[
                          styles.levelTitle,
                          level === lvl && styles.levelTitleActive,
                        ]}
                      >
                        {t(language, `level${lvl.charAt(0).toUpperCase() + lvl.slice(1)}` as any)}
                      </Text>
                      <Text style={styles.levelDesc}>
                        {t(language, `level${lvl.charAt(0).toUpperCase() + lvl.slice(1)}Desc` as any)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Helper Text */}
            <Text style={styles.helperText}>{t(language, 'levelHelper')}</Text>

            {/* CTA Section */}
            <View style={styles.ctaSection}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
                activeOpacity={0.85}
              >
                <Text style={styles.continueText}>{t(language, 'continue')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.6}
              >
                <Text style={styles.skipText}>{t(language, 'skip')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03130E',
  },
  layout: {
    flex: 1,
  },

  // HERO
  hero: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
    flex: 0.38,
    justifyContent: 'center',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  logoGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 280,
    height: 280,
    marginLeft: -140,
    marginTop: -140,
    backgroundColor: '#00BC7C',
    opacity: 0.15,
    borderRadius: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#00BC7C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 60,
      },
    }),
  },
  logo: {
    width: 180,
    height: 180,
  },
  logoSmall: {
    width: 140,
    height: 140,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    paddingHorizontal: 24,
    maxWidth: 360,
  },
  heroTitleSmall: {
    fontSize: 21,
    lineHeight: 27,
  },

  // BOTTOM SHEET
  sheet: {
    flex: 0.62,
    backgroundColor: 'rgba(15, 25, 20, 0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  sheetScroll: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },

  // SECTIONS
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },

  // LANGUAGE SEGMENT
  languageSegment: {
    flexDirection: 'row',
    gap: 10,
  },
  languageOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  languageOptionActive: {
    backgroundColor: 'rgba(0, 188, 124, 0.12)',
    borderColor: '#00BC7C',
    ...Platform.select({
      ios: {
        shadowColor: '#00BC7C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  flagEmoji: {
    fontSize: 22,
  },
  languageText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  languageTextActive: {
    color: '#00BC7C',
  },

  // LEVEL LIST
  levelList: {
    gap: 8,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  levelRowActive: {
    backgroundColor: 'rgba(0, 188, 124, 0.12)',
    borderColor: '#00BC7C',
    ...Platform.select({
      ios: {
        shadowColor: '#00BC7C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
    }),
  },
  levelIcon: {
    fontSize: 28,
  },
  levelContent: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  levelTitleActive: {
    color: '#00BC7C',
  },
  levelDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // HELPER TEXT
  helperText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  // CTA
  ctaSection: {
    paddingBottom: 24,
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#00BC7C',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#00BC7C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A0F0D',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.45)',
  },
});
