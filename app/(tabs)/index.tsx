import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { SectionHeader } from '@/components/SectionHeader';
import { Chip } from '@/components/Chip';
import { RouteCard } from '@/components/RouteCard';
import { RouteListItem } from '@/components/RouteListItem';
import { RegionalWeatherCard } from '@/components/RegionalWeatherCard';
import { CategoryTile } from '@/components/CategoryTile';
import { TimeTile } from '@/components/TimeTile';
import { HeaderPanel } from '@/components/home/HeaderPanel';
import { listRoutes, getFeaturedRoutes } from '@/repositories/routesRepo';
import { Route, RouteCategory, TimeDuration } from '@/types/Route';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import { normalizeForSearch } from '@/utils/textNormalization';
import { useAnnouncement } from '@/hooks/useAnnouncement';
import { AnnouncementModal } from '@/components/AnnouncementModal';

const CATEGORIES: RouteCategory[] = ['vzponi', 'coffee', 'family', 'trainingLong'];
const TIME_DURATIONS: TimeDuration[] = ['1h', '2h', '3h', '4h+'];

export default function PotiScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [featuredRoutes, setFeaturedRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const { announcement, visible: announcementVisible, dismiss: dismissAnnouncement } = useAnnouncement(language);

  const regions = [
    { id: 'gorenjska', label: t(language, 'gorenjska'), selected: true, disabled: false },
    { id: 'dolenjska', label: t(language, 'dolenjska'), selected: false, disabled: true },
    { id: 'stajerska', label: t(language, 'stajerska'), selected: false, disabled: true },
  ];

  // Load routes from Supabase on mount
  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const [all, featured] = await Promise.all([
        listRoutes(),
        getFeaturedRoutes(),
      ]);
      setAllRoutes(all);
      setFeaturedRoutes(featured);
    } catch (error) {
      console.error('Failed to load routes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter routes based on search query (with diacritic-insensitive matching)
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) {
      return allRoutes;
    }
    const normalizedQuery = normalizeForSearch(searchQuery);
    return allRoutes.filter((route) =>
      normalizeForSearch(route.title).includes(normalizedQuery)
    );
  }, [searchQuery, allRoutes]);

  const handleCategoryPress = (category: RouteCategory) => {
    router.push(`/routes/category/${category}`);
  };

  const handleTimePress = (duration: TimeDuration) => {
    router.push(`/time/${duration}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brandGreen} />
          <Text style={styles.loadingText}>{t(language, 'loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Panel with Search + Chips */}
        <HeaderPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          regions={regions}
        />

        {/* Show regional content only when not searching */}
        {!searchQuery.trim() && (
          <>
            {/* Regional Weather - only for Gorenjska */}
            <RegionalWeatherCard region={t(language, 'gorenjska')} />

            {/* Category Browsing Section */}
            <SectionHeader title={t(language, 'categoryBrowsing')} />
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <CategoryTile category={item} onPress={handleCategoryPress} />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
              scrollEnabled={true}
            />

            {/* Time Browsing Section */}
            <SectionHeader title={t(language, 'timeBrowsing')} />
            <FlatList
              horizontal
              data={TIME_DURATIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TimeTile duration={item} onPress={handleTimePress} />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
              scrollEnabled={true}
            />
          </>
        )}

        {/* All Routes Section or Search Results */}
        <SectionHeader
          title={
            searchQuery.trim()
              ? `${filteredRoutes.length} ${
                  filteredRoutes.length === 1
                    ? t(language, 'searchResult')
                    : t(language, 'searchResults')
                }`
              : `${t(language, 'allRoutes')} · ${t(language, 'gorenjska')}`
          }
        />
        <View style={styles.listContainer}>
          {filteredRoutes.length > 0 ? (
            filteredRoutes.map((route) => (
              <RouteListItem key={route.id} route={route} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="search" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyStateText}>{t(language, 'noRoutesFound')}</Text>
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AnnouncementModal
        visible={announcementVisible}
        announcement={announcement}
        language={language}
        onDismiss={dismissAnnouncement}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  carouselContent: {
    paddingHorizontal: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContainer: {
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 16,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
