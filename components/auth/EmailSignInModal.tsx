import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AuthLanguage } from './LanguageToggle';

interface EmailSignInModalProps {
  visible: boolean;
  language: AuthLanguage;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
}

const strings = {
  SLO: {
    title: 'Prijava z e-pošto',
    placeholder: 'vnesi e-pošto',
    cta: 'Nadaljuj',
    errorInvalid: 'Vnesi veljaven e-poštni naslov',
    errorApi: 'Prijava ni uspela. Poskusi znova.',
    successTitle: 'Preveri e-pošto',
    successMessage: 'Poslali smo ti povezavo za prijavo na',
    done: 'V redu',
  },
  ENG: {
    title: 'Email sign in',
    placeholder: 'Enter your email',
    cta: 'Continue',
    errorInvalid: 'Enter a valid email address',
    errorApi: 'Sign in failed. Please try again.',
    successTitle: 'Check your email',
    successMessage: 'We sent a login link to',
    done: 'Got it',
  },
};

export function EmailSignInModal({ visible, language, onClose, onSubmit }: EmailSignInModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const t = strings[language];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setError('');

    if (!validateEmail(email.trim())) {
      setError(t.errorInvalid);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(email.trim());
      setSentToEmail(email.trim());
      setEmailSent(true);
      setEmail('');
    } catch (err: unknown) {
      console.error('Email sign in error:', err);
      const message = err instanceof Error ? err.message : '';
      if (message.includes('Invalid') || message.includes('invalid')) {
        setError(t.errorInvalid);
      } else {
        setError(t.errorApi);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setEmailSent(false);
    setSentToEmail('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modal}>
            <View style={styles.content}>
              {emailSent ? (
                <>
                  <Text style={styles.successIcon}>✉️</Text>
                  <Text style={styles.title}>{t.successTitle}</Text>
                  <Text style={styles.successMessage}>
                    {t.successMessage}
                  </Text>
                  <Text style={styles.sentEmail}>{sentToEmail}</Text>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>{t.done}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.title}>{t.title}</Text>

                  <TextInput
                    style={[styles.input, error ? styles.inputError : null]}
                    placeholder={t.placeholder}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>{t.cta}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '85%',
    maxWidth: 400,
  },
  content: {
    backgroundColor: 'rgba(15, 25, 20, 0.95)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 4,
  },
  sentEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00BC7C',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: -12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#00BC7C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0F0D',
  },
});
