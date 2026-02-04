import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { Chip } from '@/components/Chip';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

interface HeaderPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  regions: Array<{
    id: string;
    label: string;
    selected: boolean;
    disabled: boolean;
  }>;
}

export function HeaderPanel({ searchQuery, onSearchChange, regions }: HeaderPanelProps) {
  const { language } = useLanguage();

  return (
    <View style={styles.panelWrapper}>
      {/* Optional brand green glow */}
      <View style={styles.glowBlob} />

      {/* Main Panel */}
      <View style={styles.panel}>
        {/* Top Row: Logo + Search */}
        <View style={styles.topRow}>
          {/* Logo Container - 56px width */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo-navbar.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Search Bar - flex 1 */}
          <View style={styles.searchContainer}>
            <FontAwesome
              name="search"
              size={14}
              color="rgba(255,255,255,0.35)"
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t(language, 'searchPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.42)"
              value={searchQuery}
              onChangeText={onSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange('')}>
                <FontAwesome
                  name="times-circle"
                  size={14}
                  color="rgba(255,255,255,0.35)"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Region Chips Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          style={styles.chipsScroll}
        >
          {regions.map((region) => (
            <Chip
              key={region.id}
              label={region.label}
              selected={region.selected}
              disabled={region.disabled}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panelWrapper: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },

  // Optional brand green glow
  glowBlob: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(0, 188, 124, 0.12)',
    borderRadius: 38,
    opacity: 0.6,
    zIndex: 0,
  },

  // Main glass panel
  panel: {
    backgroundColor: 'rgba(18, 26, 23, 0.65)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    padding: 15,
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // Top Row Layout
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },

  // Logo - 100px container for bike + text logo
  logoContainer: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 36,
    opacity: 0.92,
  },

  // Search - flex 1, improved contrast
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.11)',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },

  // Region Chips
  chipsScroll: {
    marginTop: 2,
    marginHorizontal: -4,
  },
  chipsContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
});
