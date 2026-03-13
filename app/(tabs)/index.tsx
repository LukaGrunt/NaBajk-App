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
  ScrollView,
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
import { RandomPickCard } from '@/components/RandomPickCard';
import { VzponiPickCard } from '@/components/VzponiPickCard';
import { RandomRouteOverlay } from '@/components/RandomRouteOverlay';
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

const REGION_ID_TO_DB: Record<string, string> = {
  gorenjska: 'Gorenjska',
  dolenjska: 'Dolenjska',
  primorska: 'Primorska',
  stajerska: 'Štajerska',
  prekmurje: 'Prekmurje',
  osrednjaSlovenija: 'Osrednja Slovenija',
};

// TODO: replace with backend-fetched partners when ready
const PARTNERS: Partner[] = [
  {
    id: 'vitamini-si',
    name: 'Vitamini.si',
    valueProp: { sl: 'Prehrana za kolesarje', en: 'Cycling nutrition' },
    url: 'https://www.vitamini.si/shop/category/prehrana-ogljikovi-hidrati-geli-126',
    logoImage: require('@/assets/images/partner-left.png'),
    category: { sl: 'PREHRANA', en: 'NUTRITION' },
  },
  {
    id: 'a2u',
    name: 'A2U',
    valueProp: { sl: 'Kolesarska oprema', en: 'Cycling gear' },
    url: 'https://www.a2u.si/kolesarstvo/',
    logoImage: require('@/assets/images/partner-right.png'),
    category: { sl: 'SERVIS / TRGOVINA', en: 'SERVICE / SHOP' },
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

  // Random route picker state
  const [randomOverlayVisible, setRandomOverlayVisible] = useState(false);
  const [randomRoute, setRandomRoute] = useState<Route | null>(null);

  const [selectedRegion, setSelectedRegion] = useState('all');

  const REGION_IDS = ['all', 'gorenjska', 'dolenjska', 'primorska', 'stajerska', 'prekmurje', 'osrednjaSlovenija'] as const;
  const regions = REGION_IDS.map((id) => ({
    id,
    label: t(language, id),
    selected: selectedRegion === id,
    disabled: false,
    onPress: () => setSelectedRegion(id),
  }));

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

  // Filter routes based on selected region and search query
  const filteredRoutes = useMemo(() => {
    let routes = allRoutes;

    if (selectedRegion !== 'all') {
      const dbRegion = normalizeForSearch(REGION_ID_TO_DB[selectedRegion]);
      routes = routes.filter((route) => normalizeForSearch(route.region ?? '') === dbRegion);
    }

    if (searchQuery.trim()) {
      const normalizedQuery = normalizeForSearch(searchQuery);
      routes = routes.filter((route) =>
        normalizeForSearch(route.title).includes(normalizedQuery)
      );
    }

    return routes;
  }, [searchQuery, allRoutes, selectedRegion]);

  const handleTimePress = (duration: TimeDuration) => {
    router.push(`/time/${duration}`);
  };

  // Random route picker handlers
  const handleRandomPress = () => {
    if (allRoutes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allRoutes.length);
    setRandomRoute(allRoutes[randomIndex]);
    setRandomOverlayVisible(true);
  };

  const handleRandomRouteSelect = (route: Route) => {
    setRandomOverlayVisible(false);
    router.push(`/route/${route.id}`);
  };

  const handleRandomDismiss = () => {
    setRandomOverlayVisible(false);
    setRandomRoute(null);
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
          <RegionalWeatherCard region={selectedRegion === 'all' ? 'gorenjska' : selectedRegion} />

          {/* Quick picks – time-based route filters */}
          <SectionHeader title={t(language, 'quickPicks')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rowContent}
          >
            <RandomPickCard onPress={handleRandomPress} />
            <VzponiPickCard onPress={() => router.push('/climbs')} />
            {TIME_DURATIONS.map((duration) => (
              <QuickPickCard key={duration} duration={duration} onPress={handleTimePress} />
            ))}
          </ScrollView>

          <SectionHeader title={t(language, 'partners')} />
          <PartnerStrip partners={PARTNERS} language={language} />
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
            : selectedRegion === 'all'
          ? t(language, 'allRoutes')
          : `${t(language, 'allRoutes')} · ${t(language, selectedRegion as any)}`
        }
      />
    </>
  ), [searchQuery, language, filteredRoutes.length, regions, selectedRegion]);

  // List footer with bottom spacer
  const ListFooter = useMemo(() => (
    <View style={styles.bottomSpacer} />
  ), []);

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

      <RandomRouteOverlay
        visible={randomOverlayVisible}
        route={randomRoute}
        onSelectRoute={handleRandomRouteSelect}
        onDismiss={handleRandomDismiss}
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
    height: 100, // Space for floating tab bar + safe area
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
