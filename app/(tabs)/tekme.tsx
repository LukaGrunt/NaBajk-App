import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, Language } from '@/constants/i18n';
import { listRaces, Race } from '@/repositories/racesRepo';
import { RaceRow }          from '@/components/races/RaceRow';
import { RaceDetailModal }  from '@/components/races/RaceDetailModal';

// ── types ──────────────────────────────────────────────

interface RaceSection {
  title: string; // e.g. "Maj 2026"
  data:  Race[];
}

// ── helpers ────────────────────────────────────────────

/** Group a sorted Race[] into month-year sections. */
function groupByMonth(races: Race[], language: Language): RaceSection[] {
  const sections: RaceSection[] = [];
  let currentTitle = '';

  for (const race of races) {
    const date   = new Date(race.raceDate + 'T12:00:00');
    const locale = language === 'sl' ? 'sl-SI' : 'en-US';
    const raw    = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
    const title  = raw.charAt(0).toUpperCase() + raw.slice(1);

    if (title !== currentTitle) {
      currentTitle = title;
      sections.push({ title, data: [] });
    }
    sections[sections.length - 1].data.push(race);
  }

  return sections;
}

const todayStr = new Date().toISOString().split('T')[0];

// ── screen ─────────────────────────────────────────────

export default function TekmeScreen() {
  const { language } = useLanguage();

  const [races, setRaces]                   = useState<Race[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [query, setQuery]                   = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedRace, setSelectedRace]     = useState<Race | null>(null);

  /* ── fetch ──────────────────────────────────────────── */
  const fetchRaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRaces(await listRaces());
    } catch {
      setError(t(language, 'fetchRacesError'));
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => { fetchRaces(); }, [fetchRaces]);

  /* ── debounce ─────────────────────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  /* ── memoised filter + grouping ─────────────────── */
  const sections = useMemo(() => {
    const filtered = debouncedQuery
      ? races.filter(r => {
          const q = debouncedQuery.toLowerCase();
          return (
            r.name.toLowerCase().includes(q) ||
            (r.region?.toLowerCase().includes(q) ?? false)
          );
        })
      : races;
    return groupByMonth(filtered, language);
  }, [races, debouncedQuery, language]);

  /* ── layout ─────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header: title + subtitle */}
      <View style={styles.header}>
        <Text style={styles.title}>{t(language, 'events')}</Text>
        <Text style={styles.subtitle}>{t(language, 'racesSubtitle')}</Text>
      </View>

      {/* Search — subtle, compact */}
      <View style={styles.searchWrap}>
        <FontAwesome name="search" size={14} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t(language, 'racesSearch')}
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
            <FontAwesome name="times-circle" size={15} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error banner (only on fetch failure) */}
      {error && (
        <View style={styles.errorBanner}>
          <FontAwesome name="exclamation-circle" size={16} color={Colors.errorRed} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Spinner or month-grouped list */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.brandGreen} style={styles.spinner} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          stickySectionHeadersEnabled
          renderItem={({ item }) => (
            <RaceRow
              race={item}
              isToday={item.raceDate === todayStr}
              onPress={() => setSelectedRace(item)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="trophy" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>{t(language, 'noRaces')}</Text>
              <Text style={styles.emptyHelper}>{t(language, 'racesEmptyHelper')}</Text>
            </View>
          }
          onRefresh={fetchRaces}
          refreshing={loading}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Detail bottom sheet */}
      <RaceDetailModal
        race={selectedRace}
        visible={selectedRace !== null}
        onClose={() => setSelectedRace(null)}
      />
    </SafeAreaView>
  );
}

// ── styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.background,
  },

  /* header */
  header: {
    paddingHorizontal: 16,
    paddingTop:        16,
    paddingBottom:     8,
  },
  title: {
    fontSize:   28,
    fontWeight: '700',
    color:      Colors.textPrimary,
  },
  subtitle: {
    fontSize:  13,
    color:     Colors.textMuted,
    marginTop: 3,
  },

  /* search */
  searchWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    marginHorizontal:  16,
    marginTop:         4,
    paddingHorizontal: 12,
    paddingVertical:   9,
    backgroundColor:   'rgba(255,255,255,0.05)',
    borderRadius:      12,
    gap:               8,
  },
  searchInput: {
    flex:     1,
    fontSize: 14,
    color:    Colors.textPrimary,
  },

  /* error */
  errorBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    marginHorizontal:  16,
    marginTop:         8,
    paddingVertical:   10,
    paddingHorizontal: 12,
    backgroundColor:   'rgba(229, 57, 53, 0.12)',
    borderRadius:      10,
  },
  errorText: {
    flex:     1,
    fontSize: 14,
    color:    Colors.errorRed,
  },

  /* sticky section header — background covers cards as they scroll under */
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop:        20,
    paddingBottom:     10,
    backgroundColor:   Colors.background,
  },
  sectionTitle: {
    fontSize:   15,
    fontWeight: '600',
    color:      Colors.textPrimary, // white-ish, not green
  },

  /* spinner / empty */
  spinner: {
    flex:           1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize:   16,
    fontWeight: '600',
    color:      Colors.textMuted,
    marginTop:  16,
  },
  emptyHelper: {
    fontSize:  13,
    color:     Colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },

  /* list */
  list: {
    paddingBottom: 100,
  },
});
