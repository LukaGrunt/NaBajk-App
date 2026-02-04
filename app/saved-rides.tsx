import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import FontAwesome        from '@expo/vector-icons/FontAwesome';
import Colors             from '@/constants/Colors';
import { useLanguage }    from '@/contexts/LanguageContext';
import { t }              from '@/constants/i18n';
import { listSavedRides, SavedRide } from '@/lib/rideStorage';

// ── helpers ───────────────────────────────────────────────

function formatDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function formatDur(s: number) {
  const min = Math.floor(s / 60);
  if (min >= 60) {
    const h = Math.floor(min / 60);
    return `${h}h ${min % 60}m`;
  }
  return `${min}m`;
}

function formatDate(iso: string, language: string) {
  const date   = new Date(iso);
  const locale = language === 'sl' ? 'sl-SI' : 'en-US';
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── row ───────────────────────────────────────────────────

function RideRow({ ride, onPress }: { ride: SavedRide; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{ride.name}</Text>
        <Text style={styles.rowMeta}>
          {formatDate(ride.createdAt, 'sl')} · {formatDist(ride.distanceMeters)} · {formatDur(ride.durationSeconds)}
        </Text>
      </View>
      <FontAwesome name="chevron-right" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

// ── screen ────────────────────────────────────────────────

export default function SavedRidesScreen() {
  const { language }      = useLanguage();
  const router            = useRouter();
  const [rides, setRides] = useState<SavedRide[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listSavedRides().then(r => { setRides(r); setLoaded(true); });
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <Stack.Screen options={{
        title:           t(language, 'savedRidesTitle'),
        headerStyle:     { backgroundColor: Colors.background },
        headerTintColor: Colors.textPrimary,
      }} />

      {loaded && rides.length === 0 ? (
        <View style={styles.emptyCenter}>
          <FontAwesome name="bicycle" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>{t(language, 'savedRidesEmpty')}</Text>
          <Text style={styles.emptyHelper}>{t(language, 'savedRidesEmptyHelper')}</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <RideRow ride={item} onPress={() => router.push(`/saved-rides/${item.id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

// ── styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  /* empty */
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle:  { color: Colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptyHelper: { color: Colors.textMuted,   fontSize: 14, marginTop: 6,     textAlign: 'center' },

  /* list row */
  row:     { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowInfo: { flex: 1 },
  rowName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  rowMeta: { color: Colors.textMuted,   fontSize: 13, marginTop: 2 },

  separator: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
});
