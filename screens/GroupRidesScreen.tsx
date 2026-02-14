import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { listGroupRides, getRSVPCounts } from '@/repositories/groupRidesRepo';
import { getRoute } from '@/repositories/routesRepo';
import { GroupRide } from '@/types/GroupRide';
import { Route } from '@/types/Route';
import { GroupRideListItem } from '@/components/group-rides/GroupRideListItem';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

const REGIONS = ['gorenjska', 'dolenjska', 'stajerska'] as const;
type Region = typeof REGIONS[number];

const NOTIFICATION_PREFS_KEY = 'nabajk_group_ride_notifications';

export default function GroupRidesScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [groupRides, setGroupRides] = useState<GroupRide[]>([]);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
  const [routes, setRoutes] = useState<Record<string, Route>>({});
  const [loading, setLoading] = useState(true);

  // Notification preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifyRegions, setNotifyRegions] = useState<Region[]>([]);

  useEffect(() => {
    loadGroupRides();
    loadNotificationPrefs();
  }, []);

  const loadNotificationPrefs = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        setNotificationsEnabled(prefs.enabled ?? false);
        setNotifyRegions(prefs.regions ?? []);
      }
    } catch (error) {
      console.error('Failed to load notification prefs:', error);
    }
  };

  const saveNotificationPrefs = async (enabled: boolean, regions: Region[]) => {
    try {
      await AsyncStorage.setItem(
        NOTIFICATION_PREFS_KEY,
        JSON.stringify({ enabled, regions })
      );
    } catch (error) {
      console.error('Failed to save notification prefs:', error);
    }
  };

  const toggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    if (!value) {
      setNotifyRegions([]);
      saveNotificationPrefs(false, []);
    } else {
      setNotifyRegions([...REGIONS]);
      saveNotificationPrefs(true, [...REGIONS]);
    }
  };

  const toggleNotifyRegion = (regionToToggle: Region) => {
    const newRegions = notifyRegions.includes(regionToToggle)
      ? notifyRegions.filter((r) => r !== regionToToggle)
      : [...notifyRegions, regionToToggle];
    setNotifyRegions(newRegions);
    saveNotificationPrefs(notificationsEnabled, newRegions);
  };

  const getRegionLabel = (r: Region): string => {
    const labels: Record<Region, { sl: string; en: string }> = {
      gorenjska: { sl: 'Gorenjska', en: 'Gorenjska' },
      dolenjska: { sl: 'Dolenjska', en: 'Dolenjska' },
      stajerska: { sl: 'Štajerska', en: 'Štajerska' },
    };
    return labels[r][language];
  };

  const loadGroupRides = async () => {
    setLoading(true);
    try {
      const rides = await listGroupRides();
      setGroupRides(rides);

      // Load RSVP counts and routes in parallel (not sequentially!)
      const [rsvpResults, routeResults] = await Promise.all([
        // Fetch all RSVP counts in parallel
        Promise.all(rides.map(ride => getRSVPCounts(ride.id))),
        // Fetch all routes in parallel (filter to only rides with routeId)
        Promise.all(
          rides
            .filter(ride => ride.routeId)
            .map(ride => getRoute(ride.routeId!).then(route => ({ routeId: ride.routeId!, route })))
        ),
      ]);

      // Build counts record
      const counts: Record<string, number> = {};
      rides.forEach((ride, index) => {
        counts[ride.id] = rsvpResults[index].going;
      });

      // Build routes record
      const routesData: Record<string, Route> = {};
      routeResults.forEach(({ routeId, route }) => {
        if (route) {
          routesData[routeId] = route;
        }
      });

      setRsvpCounts(counts);
      setRoutes(routesData);
    } catch (error) {
      console.error('Failed to load group rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePress = () => {
    router.push('/group-rides/create');
  };

  // Memoized render item for FlatList
  const renderGroupRideItem: ListRenderItem<GroupRide> = useCallback(
    ({ item: ride }) => {
      const route = ride.routeId ? routes[ride.routeId] : undefined;
      return (
        <GroupRideListItem
          groupRide={ride}
          route={route}
          rsvpCount={rsvpCounts[ride.id] || 0}
        />
      );
    },
    [routes, rsvpCounts]
  );

  const keyExtractor = useCallback((item: GroupRide) => item.id, []);

  // List header with create card and notifications
  const ListHeader = useMemo(() => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t(language, 'groupRideTitle')}</Text>
      </View>

      {/* Create Your Own Card */}
      <TouchableOpacity
        style={styles.createCard}
        onPress={handleCreatePress}
        activeOpacity={0.8}
      >
        <View style={styles.createCardGlow} />
        <View style={styles.createCardContent}>
          <View style={styles.createIconCircle}>
            <FontAwesome name="plus" size={24} color={Colors.background} />
          </View>
          <View style={styles.createCardText}>
            <Text style={styles.createCardTitle}>{t(language, 'createYourOwn')}</Text>
            <Text style={styles.createCardDesc}>{t(language, 'createYourOwnDesc')}</Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color={Colors.brandGreen} />
        </View>
      </TouchableOpacity>

      {/* Notification Preferences */}
      <View style={styles.notificationSection}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitleRow}>
            <FontAwesome name="bell" size={16} color={Colors.textSecondary} />
            <Text style={styles.notificationTitle}>{t(language, 'notifyNewRides')}</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: Colors.border, true: Colors.brandGreen }}
            thumbColor={Colors.textPrimary}
          />
        </View>
        {notificationsEnabled && (
          <View style={styles.notificationRegions}>
            <Text style={styles.notificationSubtitle}>{t(language, 'notifyRegionsLabel')}</Text>
            <View style={styles.regionChipsRow}>
              {REGIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.notifyRegionChip,
                    notifyRegions.includes(r) && styles.notifyRegionChipSelected,
                  ]}
                  onPress={() => toggleNotifyRegion(r)}
                  activeOpacity={0.7}
                >
                  <FontAwesome
                    name={notifyRegions.includes(r) ? 'check-square-o' : 'square-o'}
                    size={14}
                    color={notifyRegions.includes(r) ? Colors.brandGreen : Colors.textSecondary}
                    style={styles.checkIcon}
                  />
                  <Text
                    style={[
                      styles.notifyRegionChipText,
                      notifyRegions.includes(r) && styles.notifyRegionChipTextSelected,
                    ]}
                  >
                    {getRegionLabel(r)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>{t(language, 'upcomingRides')}</Text>
    </>
  ), [language, notificationsEnabled, notifyRegions]);

  // Empty state component
  const ListEmpty = useCallback(() => {
    if (loading) {
      return <Text style={styles.loadingText}>Loading...</Text>;
    }
    return (
      <View style={styles.emptyState}>
        <FontAwesome name="calendar" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyText}>{t(language, 'noGroupRides')}</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={handleCreatePress}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyButtonText}>
            {t(language, 'createGroupRide')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, language]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={groupRides}
        renderItem={renderGroupRideItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={<View style={styles.bottomSpacer} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
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
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  createCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  createCardGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: 'rgba(0, 188, 124, 0.2)',
    borderRadius: 20,
  },
  createCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSurface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.brandGreen,
    gap: 16,
  },
  createIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brandGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createCardText: {
    flex: 1,
  },
  createCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  createCardDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.brandGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.background,
  },
  bottomSpacer: {
    height: 20,
  },
  // Notification preferences styles
  notificationSection: {
    backgroundColor: Colors.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  notificationRegions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  notificationSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  regionChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  notifyRegionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifyRegionChipSelected: {
    backgroundColor: 'rgba(11, 191, 118, 0.1)',
    borderColor: Colors.brandGreen,
  },
  notifyRegionChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  notifyRegionChipTextSelected: {
    color: Colors.brandGreen,
  },
  checkIcon: {
    marginRight: 6,
  },
});
