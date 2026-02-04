import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { listGroupRides, getRSVPCounts } from '@/repositories/groupRidesRepo';
import { getRoute } from '@/repositories/routesRepo';
import { GroupRide } from '@/types/GroupRide';
import { Route } from '@/types/Route';
import { GroupRideListItem } from '@/components/group-rides/GroupRideListItem';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

export default function GroupRidesScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [groupRides, setGroupRides] = useState<GroupRide[]>([]);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
  const [routes, setRoutes] = useState<Record<string, Route>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroupRides();
  }, []);

  const loadGroupRides = async () => {
    setLoading(true);
    try {
      const rides = await listGroupRides();
      setGroupRides(rides);

      // Load RSVP counts and routes for each ride
      const counts: Record<string, number> = {};
      const routesData: Record<string, Route> = {};

      for (const ride of rides) {
        const rsvpData = await getRSVPCounts(ride.id);
        counts[ride.id] = rsvpData.going;

        // Fetch route if ride has a routeId
        if (ride.routeId) {
          const route = await getRoute(ride.routeId);
          if (route) {
            routesData[ride.routeId] = route;
          }
        }
      }

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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

        {/* Group Rides List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(language, 'upcomingRides')}</Text>

          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : groupRides.length === 0 ? (
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
          ) : (
            groupRides.map((ride) => {
              const route = ride.routeId ? routes[ride.routeId] : undefined;

              return (
                <GroupRideListItem
                  key={ride.id}
                  groupRide={ride}
                  route={route}
                  rsvpCount={rsvpCounts[ride.id] || 0}
                />
              );
            })
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  section: {
    marginBottom: 24,
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
});
