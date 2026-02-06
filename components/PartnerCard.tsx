import React from 'react';
import { Pressable, View, Text, StyleSheet, Linking } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

export interface Partner {
  id: string;
  name: string;
  valueProp: { sl: string; en: string };
  url: string;
}

interface PartnerCardProps {
  partner: Partner;
}

export function PartnerCard({ partner }: PartnerCardProps) {
  const { language } = useLanguage();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => Linking.openURL(partner.url)}
    >
      <View style={styles.content}>
        <Text style={styles.tag}>{t(language, 'partnerTag')}</Text>
        <Text style={styles.name}>{partner.name}</Text>
        <Text style={styles.valueProp}>{partner.valueProp[language]}</Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color={Colors.brandGreen} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.cardSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPressed: {
    borderColor: Colors.brandGreen,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  tag: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  valueProp: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
