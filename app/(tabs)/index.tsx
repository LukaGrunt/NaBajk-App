import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { SectionHeader } from '@/components/SectionHeader';
import { Chip } from '@/components/Chip';
import { RouteCard } from '@/components/RouteCard';
import { RouteListItem } from '@/components/RouteListItem';
import { featuredRoutes, allRoutes } from '@/data/mockRoutes';

const regions = [
  { id: 'gorenjska', label: 'Gorenjska', selected: true, disabled: false },
  { id: 'dolenjska', label: 'Dolenjska (kmalu)', selected: false, disabled: true },
  { id: 'stajerska', label: 'Štajerska (kmalu)', selected: false, disabled: true },
];

export default function PotiScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>NaBajk</Text>
          <Text style={styles.subtitle}>Najlepše ceste za cestno kolesarjenje</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Išči poti…"
            placeholderTextColor={Colors.textMuted}
            editable={false}
          />
        </View>

        {/* Region Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsContainer}
          contentContainerStyle={styles.chipsContent}
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

        {/* Featured Routes Section */}
        <SectionHeader title="Izpostavljene poti" />
        <FlatList
          horizontal
          data={featuredRoutes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RouteCard route={item} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          scrollEnabled={true}
        />

        {/* All Routes Section */}
        <SectionHeader title="Vse poti · Gorenjska" />
        <View style={styles.listContainer}>
          {allRoutes.slice(0, 3).map((route) => (
            <RouteListItem key={route.id} route={route} />
          ))}
        </View>

        {/* Bottom spacing */}
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
    paddingBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: Colors.cardSurface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  chipsContainer: {
    marginBottom: 8,
  },
  chipsContent: {
    paddingHorizontal: 16,
  },
  carouselContent: {
    paddingHorizontal: 16,
  },
  listContainer: {
    marginTop: 4,
  },
  bottomSpacer: {
    height: 20,
  },
});
