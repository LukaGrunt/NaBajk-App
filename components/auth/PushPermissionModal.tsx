import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/contexts/AuthContext';

interface PushPermissionModalProps {
  visible: boolean;
  language: 'SLO' | 'ENG';
  onClose: () => void;
}

const strings = {
  SLO: {
    title: 'Dovoli obvestila?',
    subtitle: 'Za pomembne informacije o poteh in novostih.',
    allow: 'Dovoli',
    notNow: 'Ne zdaj',
  },
  ENG: {
    title: 'Allow notifications?',
    subtitle: 'For important route updates and news.',
    allow: 'Allow',
    notNow: 'Not now',
  },
};

export function PushPermissionModal({ visible, language, onClose }: PushPermissionModalProps) {
  const { markPushPermissionAsked } = useAuth();
  const [loading, setLoading] = useState(false);

  const t = strings[language];

  const handleAllow = async () => {
    setLoading(true);
    try {
      // TODO: Fully test this in standalone build (Expo Go has limitations)
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      await markPushPermissionAsked(finalStatus);

      // TODO: If granted, register for push notifications with your backend
      // if (finalStatus === 'granted') {
      //   const token = (await Notifications.getExpoPushTokenAsync()).data;
      //   // Send token to your backend
      // }
    } catch (error) {
      console.error('Failed to request push permissions:', error);
      await markPushPermissionAsked('error');
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleNotNow = async () => {
    await markPushPermissionAsked('denied');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={40} tint="dark" style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.content}>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.allowButton}
                onPress={handleAllow}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.allowText}>{t.allow}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.notNowButton}
                onPress={handleNotNow}
                disabled={loading}
                activeOpacity={0.6}
              >
                <Text style={styles.notNowText}>{t.notNow}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    maxWidth: 400,
  },
  content: {
    backgroundColor: 'rgba(15, 25, 20, 0.95)',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 21,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  allowButton: {
    backgroundColor: '#00BC7C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  allowText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0F0D',
  },
  notNowButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  notNowText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
