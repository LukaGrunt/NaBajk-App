import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { Race } from '@/repositories/racesRepo';
import { formatRaceDate } from '@/utils/dateFormatting';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import { inferType } from './RaceRow';

interface RaceDetailModalProps {
  race:    Race | null;
  visible: boolean;
  onClose: () => void;
}

export function RaceDetailModal({ race, visible, onClose }: RaceDetailModalProps) {
  const { language } = useLanguage();

  if (!race) return null;

  const type = inferType(race.name);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop — tap outside dismisses */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        {/* Sheet — taps inside do NOT dismiss */}
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.handle} />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <FontAwesome name="times" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Larger type icon chip */}
          <View style={[styles.detailIconChip, { backgroundColor: type.bgCol }]}>
            <FontAwesome name={type.icon} size={22} color={type.iconCol} />
          </View>

          <Text style={styles.title}>{race.name}</Text>

          <View style={styles.detailRow}>
            <FontAwesome name="calendar" size={15} color={Colors.textMuted} />
            <Text style={styles.detailText}>{formatRaceDate(race.raceDate, language)}</Text>
          </View>

          {race.region && (
            <View style={styles.detailRow}>
              <FontAwesome name="map-marker" size={15} color={Colors.textMuted} />
              <Text style={styles.detailText}>{race.region}</Text>
            </View>
          )}

          {race.link && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => Linking.openURL(race.link!)}
              activeOpacity={0.75}
            >
              <FontAwesome name="external-link" size={15} color={Colors.background} />
              <Text style={styles.linkText}>{t(language, 'openLink')}</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent:  'flex-end',
  },
  sheet: {
    backgroundColor:      'rgba(15, 25, 20, 0.95)',
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    borderWidth:          1,
    borderColor:          'rgba(255, 255, 255, 0.1)',
    borderBottomWidth:    0,
    paddingTop:           12,
    paddingHorizontal:    24,
    paddingBottom:        44,
  },

  handle: {
    width:           36,
    height:          4,
    borderRadius:    2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf:       'center',
    marginBottom:    8,
  },
  closeBtn: {
    alignSelf: 'flex-end',
  },

  /* type icon — larger version of the row chip */
  detailIconChip: {
    width:          48,
    height:         48,
    borderRadius:   14,
    justifyContent: 'center',
    alignItems:     'center',
    marginTop:      8,
    marginBottom:   16,
  },

  title: {
    fontSize:     20,
    fontWeight:   '700',
    color:        Colors.textPrimary,
    marginBottom: 18,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginBottom:  10,
  },
  detailText: {
    fontSize: 15,
    color:    Colors.textSecondary,
  },

  /* CTA — only green element in the modal */
  linkButton: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    marginTop:       28,
    paddingVertical: 16,
    backgroundColor: Colors.brandGreen,
    borderRadius:    12,
  },
  linkText: {
    fontSize:   16,
    fontWeight: '700',
    color:      Colors.background,
  },
});
