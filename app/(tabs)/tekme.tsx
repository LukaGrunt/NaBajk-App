import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, Language } from '@/constants/i18n';
import { listRaces, createRaceSubmission, Race } from '@/repositories/racesRepo';
import { RaceRow }          from '@/components/races/RaceRow';
import { RaceDetailModal }  from '@/components/races/RaceDetailModal';
import RNDateTimePicker     from '@react-native-community/datetimepicker';

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

  // Create race form
  const [createVisible, setCreateVisible]   = useState(false);
  const [newName, setNewName]               = useState('');
  const [newDate, setNewDate]               = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newType, setNewType]               = useState('');
  const [newLink, setNewLink]               = useState('');
  const [submitting, setSubmitting]         = useState(false);

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

  const handleCreateSubmit = async () => {
    if (!newName.trim()) { Alert.alert(t(language, 'error'), t(language, 'addRaceErrorName')); return; }
    if (!newDate) {
      Alert.alert(t(language, 'error'), t(language, 'addRaceErrorDate'));
      return;
    }
    setSubmitting(true);
    try {
      await createRaceSubmission({
        name:     newName.trim(),
        raceDate: newDate.toISOString().split('T')[0],
        type:     newType || undefined,
        link:     newLink.trim() || undefined,
      });
      setCreateVisible(false);
      setNewName(''); setNewDate(new Date()); setNewType(''); setNewLink('');
      fetchRaces();
    } catch {
      Alert.alert(t(language, 'error'), t(language, 'addRaceErrorSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

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
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.createCard}
              onPress={() => setCreateVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.createCardGlow} />
              <View style={styles.createCardContent}>
                <View style={styles.createIconCircle}>
                  <FontAwesome name="plus" size={22} color={Colors.background} />
                </View>
                <View style={styles.createCardText}>
                  <Text style={styles.createCardTitle}>{t(language, 'addRaceCreateCardTitle')}</Text>
                  <Text style={styles.createCardDesc}>{t(language, 'addRaceCreateCardDesc')}</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color={Colors.brandGreen} />
              </View>
            </TouchableOpacity>
          }
          renderItem={({ item, index, section }) => (
            <RaceRow
              race={item}
              isToday={item.raceDate === todayStr}
              isFirst={index === 0}
              isLast={index === section.data.length - 1}
              onPress={() => setSelectedRace(item)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.countChip}>
                <Text style={styles.countText}>{section.data.length}</Text>
              </View>
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

      {/* Create race modal */}
      <Modal visible={createVisible} animationType="slide" transparent onRequestClose={() => setCreateVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t(language, 'addRaceTitle')}</Text>
              <TouchableOpacity onPress={() => setCreateVisible(false)} activeOpacity={0.7}>
                <FontAwesome name="times" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>{t(language, 'addRaceNameLabel')}</Text>
              <TextInput
                style={styles.fieldInput}
                value={newName}
                onChangeText={setNewName}
                placeholder={t(language, 'addRaceNamePlaceholder')}
                placeholderTextColor={Colors.textMuted}
                editable={!submitting}
              />
              <Text style={styles.fieldLabel}>{t(language, 'addRaceDateLabel')}</Text>
              <TouchableOpacity
                style={[styles.fieldInput, styles.dateButton, showDatePicker && styles.dateButtonOpen]}
                onPress={() => setShowDatePicker(!showDatePicker)}
                activeOpacity={0.7}
                disabled={submitting}
              >
                <Text style={styles.dateButtonText}>
                  {newDate.toLocaleDateString(language === 'sl' ? 'sl-SI' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                <FontAwesome name="calendar" size={15} color={Colors.textSecondary} />
              </TouchableOpacity>
              {showDatePicker && (
                <RNDateTimePicker
                  value={newDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_event, selected) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (selected) setNewDate(selected);
                  }}
                  minimumDate={new Date()}
                  style={styles.nativePicker}
                />
              )}
              <Text style={styles.fieldLabel}>{t(language, 'addRaceTypeLabel')}</Text>
              <View style={styles.typeChipsRow}>
                {(['cestna', 'kronometer', 'vzpon'] as const).map(key => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.typeChip, newType === key && styles.typeChipSelected]}
                    onPress={() => setNewType(newType === key ? '' : key)}
                    activeOpacity={0.7}
                    disabled={submitting}
                  >
                    <Text style={[styles.typeChipText, newType === key && styles.typeChipTextSelected]}>
                      {t(language, key === 'cestna' ? 'raceTypeCestna' : key === 'kronometer' ? 'raceTypeKronometer' : 'raceTypeVzpon')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>{t(language, 'addRaceWebsiteLabel')}</Text>
              <TextInput
                style={styles.fieldInput}
                value={newLink}
                onChangeText={setNewLink}
                placeholder="https://..."
                placeholderTextColor={Colors.textMuted}
                keyboardType="url"
                autoCapitalize="none"
                editable={!submitting}
              />
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
                onPress={handleCreateSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitBtnText}>{t(language, 'addRaceSubmitBtn')}</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  /* create card — matches GroupRidesScreen style */
  createCard: {
    marginHorizontal: 16,
    marginTop:        12,
    marginBottom:     8,
    borderRadius:     16,
    overflow:         'hidden',
    position:         'relative',
  },
  createCardGlow: {
    position:        'absolute',
    top:             -4,
    left:            -4,
    right:           -4,
    bottom:          -4,
    backgroundColor: 'rgba(0, 188, 124, 0.2)',
    borderRadius:    20,
  },
  createCardContent: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.cardSurface,
    padding:         20,
    borderRadius:    16,
    borderWidth:     2,
    borderColor:     Colors.brandGreen,
    gap:             16,
  },
  createIconCircle: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: Colors.brandGreen,
    justifyContent:  'center',
    alignItems:      'center',
  },
  createCardText: {
    flex: 1,
  },
  createCardTitle: {
    fontSize:     17,
    fontWeight:   '700',
    color:        Colors.textPrimary,
    marginBottom: 3,
  },
  createCardDesc: {
    fontSize:   13,
    color:      Colors.textSecondary,
    lineHeight: 18,
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
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingTop:        20,
    paddingBottom:     10,
    backgroundColor:   Colors.background,
  },
  sectionTitle: {
    flex:       1,
    fontSize:   15,
    fontWeight: '600',
    color:      Colors.textPrimary,
  },
  countChip: {
    backgroundColor:   'rgba(255,255,255,0.08)',
    borderRadius:      10,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  countText: {
    fontSize:   12,
    fontWeight: '600',
    color:      Colors.textMuted,
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

  /* create race modal */
  modalOverlay: {
    flex:            1,
    justifyContent:  'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    paddingHorizontal:    20,
    paddingTop:           20,
    paddingBottom:        40,
    maxHeight:            '85%',
  },
  modalHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   20,
  },
  modalTitle: {
    fontSize:   20,
    fontWeight: '700',
    color:      Colors.textPrimary,
  },
  fieldLabel: {
    fontSize:     13,
    fontWeight:   '600',
    color:        Colors.textSecondary,
    marginBottom: 6,
    marginTop:    14,
  },
  fieldInput: {
    backgroundColor:   'rgba(255,255,255,0.05)',
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       Colors.border,
    paddingHorizontal: 14,
    paddingVertical:   12,
    fontSize:          15,
    color:             Colors.textPrimary,
  },
  dateButton: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  dateButtonOpen: {
    borderColor: Colors.brandGreen,
  },
  dateButtonText: {
    fontSize: 15,
    color:    Colors.textPrimary,
  },
  nativePicker: {
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: Colors.brandGreen,
    borderRadius:    14,
    paddingVertical: 16,
    alignItems:      'center',
    marginTop:       24,
  },
  submitBtnText: {
    fontSize:   16,
    fontWeight: '700',
    color:      '#fff',
  },

  /* type chip picker */
  typeChipsRow: {
    flexDirection: 'row',
    gap:           8,
  },
  typeChip: {
    flex:              1,
    paddingVertical:   10,
    borderRadius:      10,
    borderWidth:       1,
    borderColor:       Colors.border,
    backgroundColor:   'rgba(255,255,255,0.05)',
    alignItems:        'center',
  },
  typeChipSelected: {
    borderColor:     Colors.brandGreen,
    backgroundColor: 'rgba(0, 188, 124, 0.12)',
  },
  typeChipText: {
    fontSize:   13,
    fontWeight: '600',
    color:      Colors.textSecondary,
  },
  typeChipTextSelected: {
    color: Colors.brandGreen,
  },
});
