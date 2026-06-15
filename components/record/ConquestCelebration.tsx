/**
 * ConquestCelebration — full-screen "VZPON OSVOJEN!" moment shown after
 * saving a ride that conquered one or more climbs (Kralj vzponov).
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import type { ConquestResult } from '@/repositories/conquestsRepo';

const GOLD = '#FFC83D';

function pad2(n: number) { return n.toString().padStart(2, '0'); }

export function formatClimbTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
}

interface Props {
  visible:   boolean;
  conquests: ConquestResult[];
  onShare:   (conquest: ConquestResult) => void;
  onClose:   () => void;
}

export function ConquestCelebration({ visible, conquests, onShare, onClose }: Props) {
  const { language } = useLanguage();
  if (conquests.length === 0) return null;

  const title = conquests.length > 1
    ? t(language, 'climbConqueredMulti')
    : t(language, 'climbConqueredTitle');

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.trophyCircle}>
            <FontAwesome name="trophy" size={44} color={GOLD} />
          </View>
          <Text style={styles.title}>{title}</Text>

          {conquests.map(c => (
            <View key={c.climbId} style={styles.conquestRow}>
              <Text style={styles.climbName} numberOfLines={1}>{c.title}</Text>
              <Text style={styles.climbTime}>{formatClimbTime(c.timeSeconds)}</Text>
              {c.isPersonalBest && !c.isFirstTime && (
                <Text style={styles.pbTag}>
                  ⚡ {t(language, 'newPersonalBest')}
                  {c.previousBest != null && `  (${t(language, 'previousBestLabel')}: ${formatClimbTime(c.previousBest)})`}
                </Text>
              )}
            </View>
          ))}

          <Pressable style={styles.shareBtn} onPress={() => onShare(conquests[0])}>
            <FontAwesome name="instagram" size={18} color="#0A0A0B" />
            <Text style={styles.shareBtnText}>{t(language, 'conquestShareBtn')}</Text>
          </Pressable>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t(language, 'conquestCloseBtn')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.cardSurface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 24,
    alignItems: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 14,
  },
  trophyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: GOLD + '22',
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  conquestRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  climbName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  climbTime: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.brandGreen,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  pbTag: {
    fontSize: 13,
    color: GOLD,
    marginTop: 4,
    textAlign: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0A0B',
  },
  closeBtn: {
    paddingVertical: 12,
    marginTop: 4,
  },
  closeBtnText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
