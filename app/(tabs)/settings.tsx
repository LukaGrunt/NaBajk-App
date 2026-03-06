import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { RiderLevel, t } from '@/constants/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRiderLevel } from '@/contexts/RiderLevelContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useShowOnboarding } from '@/contexts/OnboardingTriggerContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { user, signOut, deleteAccount } = useAuth();
  const { userProfile, setUserName } = useUserProfile();
  const { riderLevel, setRiderLevel } = useRiderLevel();
  const showOnboarding = useShowOnboarding();

  const handleLanguageChange = async (lang: typeof language) => {
    await setLanguage(lang);
  };

  const handleRiderLevelChange = async (level: RiderLevel) => {
    await setRiderLevel(level);
  };

  const getLevelLabel = (level: RiderLevel) => {
    switch (level) {
      case 'beginner':
        return t(language, 'levelBeginner');
      case 'intermediate':
        return t(language, 'levelIntermediate');
      case 'hardcore':
        return t(language, 'levelHardcore');
    }
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset to auth screen?',
      'This will sign you out and show the auth welcome screen.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth-welcome');
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign out?',
      'You will need to sign in again to access the app.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth-welcome');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      language === 'sl' ? 'Izbriši račun?' : 'Delete account?',
      language === 'sl'
        ? 'To bo trajno izbrisalo tvoj račun in vse tvoje podatke. Te akcije ni mogoče razveljaviti.'
        : 'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: language === 'sl' ? 'Prekliči' : 'Cancel', style: 'cancel' },
        {
          text: language === 'sl' ? 'Izbriši račun' : 'Delete account',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/auth-welcome');
            } catch (e: any) {
              Alert.alert(
                language === 'sl' ? 'Napaka' : 'Error',
                e?.message || (language === 'sl' ? 'Brisanje ni uspelo.' : 'Deletion failed.')
              );
            }
          },
        },
      ]
    );
  };

  const handleFeedback = () => {
    Linking.openURL('mailto:nabajk.si@gmail.com?subject=FEEDBACK');
  };

  const handleEditNickname = () => {
    Alert.prompt(
      t(language, 'displayName'),
      language === 'sl' ? 'Vnesi svoje prikazno ime' : 'Enter your display name',
      [
        { text: t(language, 'cancel') || 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: (name?: string) => {
            if (name && name.trim()) {
              setUserName(name.trim());
            }
          },
        },
      ],
      'plain-text',
      userProfile?.name || ''
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Language Toggle */}
        <View style={styles.header}>
          <Text style={styles.title}>{t(language, 'settings')}</Text>
          <View style={styles.languageToggle}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                language === 'sl' && styles.languageButtonActive,
              ]}
              onPress={() => handleLanguageChange('sl')}
              activeOpacity={0.7}
            >
              <Text style={styles.flagEmoji}>🇸🇮</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                language === 'en' && styles.languageButtonActive,
              ]}
              onPress={() => handleLanguageChange('en')}
              activeOpacity={0.7}
            >
              <Text style={styles.flagEmoji}>🇬🇧</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountCard}>
            <View style={styles.accountInfo}>
              <FontAwesome name="user-circle" size={40} color={Colors.brandGreen} />
              <View style={styles.accountText}>
                <Text style={styles.accountLabel}>Signed in as</Text>
                <Text style={styles.accountEmail}>{user?.email || 'Not signed in'}</Text>
              </View>
            </View>
          </View>

          {/* Nickname/Display Name */}
          <TouchableOpacity
            style={styles.nicknameCard}
            onPress={handleEditNickname}
            activeOpacity={0.7}
          >
            <View style={styles.nicknameIcon}>
              <FontAwesome name="id-badge" size={20} color={Colors.brandGreen} />
            </View>
            <View style={styles.nicknameContent}>
              <Text style={styles.nicknameLabel}>{t(language, 'displayName')}</Text>
              <Text style={styles.nicknameValue}>
                {userProfile?.name || t(language, 'setNickname')}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nicknameCard}
            onPress={() => router.push('/saved-rides')}
            activeOpacity={0.7}
          >
            <View style={styles.nicknameIcon}>
              <FontAwesome name="bicycle" size={20} color={Colors.brandGreen} />
            </View>
            <View style={styles.nicknameContent}>
              <Text style={styles.nicknameLabel}>{language === 'sl' ? 'Moje vožnje' : 'My rides'}</Text>
              <Text style={styles.nicknameValue}>{language === 'sl' ? 'Oglej si shranjene vožnje' : 'View saved rides'}</Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

        </View>

        {/* Riding Level Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(language, 'levelLabel')}</Text>
          <View style={styles.levelDropdown}>
            {([
              { key: 'beginner',     speed: 26 },
              { key: 'intermediate', speed: 29 },
              { key: 'hardcore',     speed: 33 },
            ] as { key: RiderLevel; speed: number }[]).map(({ key, speed }) => (
              <TouchableOpacity
                key={key}
                style={[styles.levelOptionCompact, riderLevel === key && styles.levelOptionCompactActive]}
                onPress={() => handleRiderLevelChange(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.levelTextCompact, riderLevel === key && styles.levelTextCompactActive]}>
                  {getLevelLabel(key)}
                </Text>
                <Text style={[styles.levelSpeedText, riderLevel === key && styles.levelTextCompactActive]}>
                  {speed} km/h
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Informacije Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'sl' ? 'Informacije' : 'Information'}
          </Text>

          {/* Tutorial replay button */}
          <TouchableOpacity
            style={[styles.feedbackCard, styles.tutorialCard]}
            onPress={() => { router.navigate('/(tabs)'); showOnboarding(); }}
            activeOpacity={0.7}
          >
            <View style={styles.feedbackIcon}>
              <FontAwesome name="question-circle" size={20} color={Colors.brandGreen} />
            </View>
            <View style={styles.feedbackContent}>
              <Text style={styles.feedbackTitle}>{t(language, 'showTutorial')}</Text>
              <Text style={styles.feedbackSubtitle}>{t(language, 'showTutorialDesc')}</Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.feedbackCard}
            onPress={handleFeedback}
            activeOpacity={0.7}
          >
            <View style={styles.feedbackIcon}>
              <FontAwesome name="envelope" size={20} color={Colors.brandGreen} />
            </View>
            <View style={styles.feedbackContent}>
              <Text style={styles.feedbackTitle}>
                {language === 'sl' ? 'Pošlji povratno informacijo' : 'Send feedback'}
              </Text>
              <Text style={styles.feedbackSubtitle}>
                {language === 'sl'
                  ? 'Aplikacija je nova — sporoči nam, kaj bi izboljšal!'
                  : "The app is new — let us know what you'd improve!"}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign out / Delete account */}
        <View style={[styles.section, { marginBottom: 8 }]}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <FontAwesome name="sign-out" size={18} color="#EF4444" />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <FontAwesome name="trash" size={16} color={Colors.textMuted} />
            <Text style={styles.deleteAccountText}>
              {language === 'sl' ? 'Izbriši račun' : 'Delete account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <View style={styles.legalRow}>
            <TouchableOpacity
              style={styles.legalButton}
              activeOpacity={0.7}
              onPress={() => router.push('/privacy-policy')}
            >
              <Text style={styles.legalText}>{t(language, 'privacyPolicy')}</Text>
            </TouchableOpacity>
            <View style={styles.legalSeparator} />
            <TouchableOpacity
              style={styles.legalButton}
              activeOpacity={0.7}
              onPress={() => router.push('/terms-of-service')}
            >
              <Text style={styles.legalText}>{t(language, 'termsOfService')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Developer Section - DEV ONLY */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer</Text>
            <TouchableOpacity
              style={styles.devButton}
              onPress={handleResetOnboarding}
              activeOpacity={0.7}
            >
              <View style={styles.devButtonIcon}>
                <FontAwesome name="refresh" size={18} color="#EF4444" />
              </View>
              <View style={styles.devButtonContent}>
                <Text style={styles.devButtonLabel}>Reset to auth screen (DEV)</Text>
                <Text style={styles.devButtonDescription}>Signs out and shows auth welcome</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Version at Bottom */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{t(language, 'version')} 1.0.0</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  languageToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardSurface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: 'rgba(0, 188, 124, 0.15)',
    borderColor: Colors.brandGreen,
  },
  flagEmoji: {
    fontSize: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSurface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 188, 124, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  levelDropdown: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  levelOptionCompact: {
    flex: 1,
    backgroundColor: Colors.cardSurface,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  levelOptionCompactActive: {
    backgroundColor: 'rgba(0, 188, 124, 0.15)',
    borderColor: Colors.brandGreen,
  },
  levelTextCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  levelTextCompactActive: {
    color: Colors.brandGreen,
  },
  levelSpeedText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSurface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  legalButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  legalSeparator: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  legalText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 26, 23, 0.65)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  devButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  devButtonContent: {
    flex: 1,
  },
  devButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 2,
  },
  devButtonDescription: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  bottomSpacer: {
    height: 100, // Space for floating tab bar + safe area
  },
  accountCard: {
    backgroundColor: Colors.cardSurface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  accountText: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
  },
  deleteAccountText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  nicknameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSurface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  nicknameIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 188, 124, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nicknameContent: {
    flex: 1,
  },
  nicknameLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  nicknameValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSurface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 124, 0.25)',
  },
  tutorialCard: {
    marginBottom: 10,
  },
  feedbackIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 188, 124, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  feedbackSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
