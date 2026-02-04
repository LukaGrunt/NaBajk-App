import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import * as Linking from 'expo-linking';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Announcement } from '@/lib/announcements';
import Colors from '@/constants/Colors';
import { Language, t } from '@/constants/i18n';

interface AnnouncementModalProps {
  visible: boolean;
  announcement: Announcement | null;
  language: Language;
  onDismiss: () => void;
}

export function AnnouncementModal({
  visible,
  announcement,
  language,
  onDismiss,
}: AnnouncementModalProps) {
  if (!announcement) return null;

  const hasCta = announcement.ctaLabel && announcement.ctaUrl;

  const handleCta = () => {
    if (announcement.ctaUrl) {
      Linking.openURL(announcement.ctaUrl);
    }
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {/* Close icon */}
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss} activeOpacity={0.7}>
            <FontAwesome name="times" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Brand accent */}
          <View style={styles.accentLine} />

          <Text style={styles.title}>{announcement.title}</Text>
          <Text style={styles.body}>{announcement.body}</Text>

          {hasCta ? (
            <TouchableOpacity style={styles.ctaButton} onPress={handleCta} activeOpacity={0.8}>
              <Text style={styles.ctaText}>{announcement.ctaLabel}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss} activeOpacity={0.8}>
              <Text style={styles.dismissText}>{t(language, 'continue')}</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
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
  card: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'rgba(15, 25, 20, 0.95)',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  accentLine: {
    width: 40,
    height: 3,
    backgroundColor: Colors.brandGreen,
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: Colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.background,
  },
  dismissButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
