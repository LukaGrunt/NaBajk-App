import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';

// Proper type for FontAwesome icon names
type FAIconName = React.ComponentProps<typeof FontAwesome>['name'];

export interface Partner {
  id: string;
  name: string;
  valueProp: { sl: string; en: string };
  url: string;
  icon?: FAIconName;
}

interface PartnerStripProps {
  partners: Partner[];
}

export function PartnerStrip({ partners }: PartnerStripProps) {
  const { language } = useLanguage();

  return (
    <View style={styles.container}>
      {/* Muted section label */}
      <Text style={styles.sectionLabel}>PARTNERS</Text>

      {/* Slim horizontal strip */}
      <View style={styles.strip}>
        {partners.map((partner, index) => (
          <React.Fragment key={partner.id}>
            <Pressable
              style={({ pressed }) => [
                styles.partnerButton,
                pressed && styles.partnerButtonPressed,
              ]}
              onPress={() => Linking.openURL(partner.url)}
            >
              {/* Icon */}
              {partner.icon && (
                <FontAwesome
                  name={partner.icon}
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.icon}
                />
              )}

              {/* Name + one-liner */}
              <View style={styles.textBlock}>
                <Text style={styles.name}>{partner.name}</Text>
                <Text style={styles.valueProp}>{partner.valueProp[language]}</Text>
              </View>

              {/* Chevron */}
              <FontAwesome
                name="chevron-right"
                size={12}
                color={Colors.textSecondary}
              />
            </Pressable>

            {/* Divider (not after last item) */}
            {index < partners.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.02 * 14, // +0.02em tracking
    marginBottom: 12,
  },
  strip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  partnerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  partnerButtonPressed: {
    backgroundColor: Colors.surface2,
  },
  icon: {
    marginRight: 12,
  },
  textBlock: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  valueProp: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
});
