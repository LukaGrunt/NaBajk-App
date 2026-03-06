import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import { setTermsAccepted } from '@/utils/localSettings';
import Colors from '@/constants/Colors';

export default function TermsAcceptanceScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  const bothAccepted = termsChecked && privacyChecked;

  const handleContinue = async () => {
    if (!bothAccepted) return;
    await setTermsAccepted();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.inner}>
        <Text style={styles.title}>{t(language, 'termsAcceptanceTitle')}</Text>

        {/* Terms of Service row */}
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => setTermsChecked((v) => !v)}
        >
          <View style={[styles.checkbox, termsChecked && styles.checkboxChecked]}>
            {termsChecked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/terms-of-service')}
            activeOpacity={0.7}
          >
            <Text style={styles.rowText}>
              <Text style={styles.rowTextPlain}>
                {language === 'sl' ? 'Strinjam se s ' : 'I agree to the '}
              </Text>
              <Text style={styles.rowTextLink}>
                {t(language, 'termsOfServiceTitle')}
              </Text>
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Privacy Policy row */}
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => setPrivacyChecked((v) => !v)}
        >
          <View style={[styles.checkbox, privacyChecked && styles.checkboxChecked]}>
            {privacyChecked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/privacy-policy')}
            activeOpacity={0.7}
          >
            <Text style={styles.rowText}>
              <Text style={styles.rowTextPlain}>
                {language === 'sl' ? 'Strinjam se s ' : 'I agree to the '}
              </Text>
              <Text style={styles.rowTextLink}>
                {t(language, 'privacyPolicyTitle')}
              </Text>
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, !bothAccepted && styles.continueButtonDisabled]}
          onPress={handleContinue}
          activeOpacity={bothAccepted ? 0.8 : 1}
        >
          <Text style={[styles.continueText, !bothAccepted && styles.continueTextDisabled]}>
            {t(language, 'termsContinue')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 32,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.brandGreen,
    borderColor: Colors.brandGreen,
  },
  checkmark: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  rowText: {
    fontSize: 16,
  },
  rowTextPlain: {
    color: Colors.textSecondary,
  },
  rowTextLink: {
    color: Colors.brandGreen,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  continueButton: {
    marginTop: 40,
    backgroundColor: Colors.brandGreen,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: Colors.cardSurface,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  continueTextDisabled: {
    color: Colors.textMuted,
  },
});
