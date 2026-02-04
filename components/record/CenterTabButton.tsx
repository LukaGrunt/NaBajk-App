import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import FontAwesome    from '@expo/vector-icons/FontAwesome';
import { useRouter, usePathname } from 'expo-router';
import Colors         from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Subtle raised pill in the center of the tab bar.
 * Navigates to /record on tap.  Shows a thin green outline when active.
 */
export function CenterTabButton(_props: any) {
  const router       = useRouter();
  const pathname     = usePathname();
  const { language } = useLanguage();
  const isActive     = pathname === '/record' || pathname === '/ride-summary';

  return (
    <TouchableOpacity
      style={styles.touchable}
      onPress={() => router.push('/record')}
      activeOpacity={0.78}
      accessibilityLabel="Record ride"
      accessibilityRole="button"
    >
      <View style={[styles.pill, isActive && styles.pillActive]}>
        <FontAwesome name="bicycle" size={16} color={Colors.brandGreen} />
        <Text style={styles.label}>{language === 'sl' ? 'Vožnja' : 'Ride'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },

  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    minWidth:          120,
    height:            40,
    paddingHorizontal: 24,
    borderRadius:      999,
    backgroundColor:   '#1E2824',       // one step lighter than cardSurface (#141A17)
    borderWidth:       1,
    borderColor:       'transparent',   // reserved for active; avoids layout shift
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 1.5 },
    shadowOpacity:     0.2,
    shadowRadius:      3,
    elevation:         2,
  },

  pillActive: {
    borderColor: Colors.brandGreen,
  },

  label: {
    color:      Colors.textPrimary,
    fontSize:   14,
    fontWeight: '600',
  },
});
