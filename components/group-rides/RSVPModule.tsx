import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GroupRideStatus, GroupRideRSVP } from '@/types/GroupRide';
import { upsertRSVP, listRSVPs } from '@/repositories/groupRidesRepo';
import { useUserProfile } from '@/contexts/UserProfileContext';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

interface RSVPModuleProps {
  groupRideId: string;
}

export function RSVPModule({ groupRideId }: RSVPModuleProps) {
  const { language } = useLanguage();
  const { userProfile, setUserName, hasName } = useUserProfile();
  const [rsvps, setRsvps] = useState<GroupRideRSVP[]>([]);
  const [currentStatus, setCurrentStatus] = useState<GroupRideStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<GroupRideStatus | null>(null);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    loadRSVPs();
  }, [groupRideId]);

  const loadRSVPs = async () => {
    const data = await listRSVPs(groupRideId);
    setRsvps(data);
    const userRsvp = data.find((r) => r.userId === userProfile?.userId);
    // Only set current status if user has actually RSVP'd, otherwise keep it null
    setCurrentStatus(userRsvp?.status || null);
  };

  const handleRSVPAttempt = (status: GroupRideStatus) => {
    if (!hasName) {
      // Show name prompt
      setPendingStatus(status);
      setNameInput('');
      setShowNamePrompt(true);
    } else {
      // Has name, proceed with RSVP
      performRSVP(status, userProfile?.name || '');
    }
  };

  const handleSaveName = async () => {
    const trimmedName = nameInput.trim();
    if (trimmedName.length < 2) {
      return; // Require at least 2 characters
    }

    try {
      await setUserName(trimmedName);
      setShowNamePrompt(false);
      // Now perform the RSVP
      if (pendingStatus) {
        performRSVP(pendingStatus, trimmedName);
      }
    } catch (error) {
      console.error('Failed to save name:', error);
    }
  };

  const performRSVP = async (status: GroupRideStatus, userName: string) => {
    if (!userProfile?.userId) return;

    setLoading(true);
    try {
      await upsertRSVP(groupRideId, userProfile.userId, userName, status);
      setCurrentStatus(status);
      await loadRSVPs();
    } catch (error) {
      console.error('Failed to RSVP:', error);
    } finally {
      setLoading(false);
      setPendingStatus(null);
    }
  };

  const goingRsvps = rsvps.filter((r) => r.status === 'going');
  const maybeRsvps = rsvps.filter((r) => r.status === 'maybe');

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t(language, 'attendees')}</Text>

      {/* RSVP Buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[
            styles.rsvpButton,
            currentStatus === 'going' && styles.rsvpButtonActive,
          ]}
          onPress={() => handleRSVPAttempt('going')}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.rsvpButtonText,
              currentStatus === 'going' && styles.rsvpButtonTextActive,
            ]}
          >
            {t(language, 'going')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.rsvpButton,
            currentStatus === 'maybe' && styles.rsvpButtonActive,
          ]}
          onPress={() => handleRSVPAttempt('maybe')}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.rsvpButtonText,
              currentStatus === 'maybe' && styles.rsvpButtonTextActive,
            ]}
          >
            {t(language, 'maybe')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.rsvpButton,
            currentStatus === 'not_going' && styles.rsvpButtonActive,
          ]}
          onPress={() => handleRSVPAttempt('not_going')}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.rsvpButtonText,
              currentStatus === 'not_going' && styles.rsvpButtonTextActive,
            ]}
          >
            {t(language, 'notGoing')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Attendee Lists */}
      {goingRsvps.length > 0 && (
        <View style={styles.attendeeSection}>
          <Text style={styles.attendeeLabel}>
            {goingRsvps.length} {t(language, 'rsvpGoing')}
          </Text>
          <Text style={styles.attendeeNames}>
            {goingRsvps.map((r) => r.userName).join(', ')}
          </Text>
        </View>
      )}

      {maybeRsvps.length > 0 && (
        <View style={styles.attendeeSection}>
          <Text style={styles.attendeeLabel}>
            {maybeRsvps.length} {t(language, 'rsvpMaybe')}
          </Text>
          <Text style={styles.attendeeNames}>
            {maybeRsvps.map((r) => r.userName).join(', ')}
          </Text>
        </View>
      )}

      {goingRsvps.length === 0 && maybeRsvps.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t(language, 'noAttendees')}</Text>
          <Text style={styles.emptySubtext}>{t(language, 'beFirstRSVP')}</Text>
        </View>
      )}

      {/* Name Prompt Modal */}
      <Modal
        visible={showNamePrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNamePrompt(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t(language, 'enterYourName')}</Text>
            <Text style={styles.modalHelper}>{t(language, 'namePromptHelper')}</Text>

            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder={t(language, 'namePlaceholder')}
              placeholderTextColor={Colors.textMuted}
              autoFocus
              autoCapitalize="words"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNamePrompt(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{t(language, 'cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, nameInput.trim().length < 2 && styles.disabledButton]}
                onPress={handleSaveName}
                disabled={nameInput.trim().length < 2}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>{t(language, 'save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.cardSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  rsvpButtonActive: {
    backgroundColor: 'rgba(0, 188, 124, 0.15)',
    borderColor: Colors.brandGreen,
  },
  rsvpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  rsvpButtonTextActive: {
    color: Colors.brandGreen,
  },
  attendeeSection: {
    marginBottom: 12,
  },
  attendeeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  attendeeNames: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.cardSurface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  modalHelper: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  nameInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    backgroundColor: Colors.brandGreen,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.background,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
