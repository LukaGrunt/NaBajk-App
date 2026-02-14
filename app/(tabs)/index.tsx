import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ListRenderItem,
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
import { QuickPickCard } from '@/components/QuickPickCard';
import { PartnerStrip, Partner } from '@/components/PartnerStrip';
import { HeaderPanel } from '@/components/home/HeaderPanel';
import { listRoutes, getFeaturedRoutes } from '@/repositories/routesRepo';
import { Route, TimeDuration } from '@/types/Route';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import { normalizeForSearch } from '@/utils/textNormalization';
import { useAnnouncement } from '@/hooks/useAnnouncement';
import { AnnouncementModal } from '@/components/AnnouncementModal';

const TIME_DURATIONS: TimeDuration[] = ['1h', '2h', '3h', '4h+'];

// TODO: replace with backend-fetched partners when ready
const PARTNERS: Partner[] = [
  {
    id: 'trek-lj',
    name: 'Trek Ljubljana',
    valueProp: { sl: 'Servis & oprema', en: 'Service & gear' },
    url: 'https://example.com/trek-lj',
    icon: 'bicycle',
  },
  {
    id: 'decathlon-slo',
    name: 'Decathlon SLO',
    valueProp: { sl: 'Sport za vsakogar', en: 'Sport for everyone' },
    url: 'https://example.com/decathlon-slo',
    icon: 'shopping-bag',
  },
];

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

  const handleTimePress = (duration: TimeDuration) => {
    router.push(`/time/${duration}`);
  };

  // Memoized render item for FlatList
  const renderRouteItem: ListRenderItem<Route> = useCallback(
    ({ item }) => <RouteListItem key={item.id} route={item} />,
    []
  );

  const keyExtractor = useCallback((item: Route) => item.id, []);

  // List header with search, weather, quick picks
  const ListHeader = useMemo(() => (
    <>
      {/* Header Panel with Search + Chips */}
      <HeaderPanel
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        regions={regions}
      />

      {/* Show regional content only when not searching */}
      {!searchQuery.trim() && (
        <>
          {/* Regional Weather - compact */}
          <RegionalWeatherCard />

          {/* Quick picks – time-based route filters */}
          <SectionHeader title={t(language, 'quickPicks')} />
          <FlatList
            horizontal
            data={TIME_DURATIONS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <QuickPickCard duration={item} onPress={handleTimePress} />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rowContent}
            scrollEnabled={false}
          />
        </>
      )}

      {/* All Routes Section Header */}
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
    </>
  ), [searchQuery, language, filteredRoutes.length, regions]);

  // List footer with partners
  const ListFooter = useMemo(() => (
    <>
      {!searchQuery.trim() && <PartnerStrip partners={PARTNERS} />}
      <View style={styles.bottomSpacer} />
    </>
  ), [searchQuery]);

  // Empty state component
  const ListEmpty = useCallback(() => (
    <View style={styles.emptyState}>
      <FontAwesome name="search" size={48} color={Colors.textMuted} />
      <Text style={styles.emptyStateText}>{t(language, 'noRoutesFound')}</Text>
    </View>
  ), [language]);

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
      <FlatList
        data={filteredRoutes}
        renderItem={renderRouteItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />

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
  scrollContent: {
    paddingBottom: 24,
  },
  rowContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
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
