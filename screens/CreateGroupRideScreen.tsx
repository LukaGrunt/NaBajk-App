import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createGroupRide } from '@/repositories/groupRidesRepo';
import { listRoutes } from '@/repositories/routesRepo';
import { Route } from '@/types/Route';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { FormInput } from '@/components/forms/FormInput';
import { DateTimePicker } from '@/components/forms/DateTimePicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { parseCoordinatesInput } from '@/utils/coordinates';
import {
  validateTitle,
  validateMeetingPoint,
  validateCoordinatesInput,
  validateDateTime,
  validateCapacity,
  validateUrl,
} from '@/utils/validation';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function CreateGroupRideScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { userProfile } = useUserProfile();

  // Routes state
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [region] = useState('gorenjska'); // Only Gorenjska active for MVP
  const [date, setDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default: 1 week from now
  const [time, setTime] = useState(new Date());
  const [meetingPoint, setMeetingPoint] = useState('');
  const [coordinatesInput, setCoordinatesInput] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [visibility] = useState<'public' | 'unlisted'>('public');
  const [capacity, setCapacity] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading state
  const [loading, setLoading] = useState(false);

  // Load routes on mount
  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setRoutesLoading(true);
    try {
      const data = await listRoutes();
      setRoutes(data);
    } catch (error) {
      console.error('Failed to load routes:', error);
    } finally {
      setRoutesLoading(false);
    }
  };

  // Filtered routes based on search query
  const filteredRoutes = useMemo(() => {
    if (!routeSearchQuery.trim()) {
      return routes;
    }
    const query = routeSearchQuery.toLowerCase();
    return routes.filter((route) =>
      route.title.toLowerCase().includes(query)
    );
  }, [routeSearchQuery, routes]);

  const handleSubmit = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};

    const titleValidation = validateTitle(title);
    if (!titleValidation.valid) newErrors.title = titleValidation.error || '';

    const meetingPointValidation = validateMeetingPoint(meetingPoint);
    if (!meetingPointValidation.valid) newErrors.meetingPoint = meetingPointValidation.error || '';

    const coordsValidation = validateCoordinatesInput(coordinatesInput);
    if (!coordsValidation.valid) newErrors.coordinates = coordsValidation.error || '';

    // Combine date and time
    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

    const dateTimeValidation = validateDateTime(combinedDateTime);
    if (!dateTimeValidation.valid) newErrors.dateTime = dateTimeValidation.error || '';

    const capacityValidation = validateCapacity(capacity);
    if (!capacityValidation.valid) newErrors.capacity = capacityValidation.error || '';

    const urlValidation = validateUrl(externalUrl);
    if (!urlValidation.valid) newErrors.externalUrl = urlValidation.error || '';

    // If any errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Parse coordinates (optional)
    let coords: { lat: number; lng: number } | undefined;
    if (coordinatesInput.trim()) {
      const parsed = parseCoordinatesInput(coordinatesInput);
      if (!parsed) {
        setErrors({ coordinates: 'Invalid coordinates' });
        return;
      }
      coords = parsed;
    }

    // Create group ride
    setLoading(true);
    try {
      const newRide = await createGroupRide({
        title: title.trim(),
        region: region as 'gorenjska' | 'dolenjska' | 'stajerska',
        startsAt: combinedDateTime.toISOString(),
        meetingPoint: meetingPoint.trim(),
        meetingCoordinates: coords || { lat: 0, lng: 0 }, // Default if not provided
        routeId: selectedRouteId || '', // Empty if not selected
        notes: notes.trim() || undefined,
        externalUrl: externalUrl.trim() || undefined,
        visibility,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        createdBy: userProfile?.userId || 'user-default',
      });

      // Navigate to detail screen
      router.replace(`/group-rides/${newRide.id}`);
    } catch (error) {
      console.error('Failed to create group ride:', error);
      setErrors({ submit: 'Failed to create ride. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t(language, 'createGroupRide')}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FormInput
            label={t(language, 'rideTitle')}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) {
                const { title: _, ...rest } = errors;
                setErrors(rest);
              }
            }}
            placeholder={t(language, 'rideTitlePlaceholder')}
            error={errors.title}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <DateTimePicker
                label={t(language, 'selectDate')}
                value={date}
                onChange={(newDate) => {
                  setDate(newDate);
                  if (errors.dateTime) {
                    const { dateTime: _, ...rest } = errors;
                    setErrors(rest);
                  }
                }}
                mode="date"
                error={errors.dateTime}
                minimumDate={new Date()}
              />
            </View>
            <View style={styles.halfWidth}>
              <DateTimePicker
                label={t(language, 'selectTime')}
                value={time}
                onChange={setTime}
                mode="time"
              />
            </View>
          </View>

          <FormInput
            label={t(language, 'meetingPointLabel')}
            value={meetingPoint}
            onChangeText={(text) => {
              setMeetingPoint(text);
              if (errors.meetingPoint) {
                const { meetingPoint: _, ...rest } = errors;
                setErrors(rest);
              }
            }}
            placeholder={t(language, 'meetingPointPlaceholder')}
            error={errors.meetingPoint}
          />

          <FormInput
            label={`${t(language, 'meetingCoordinatesLabel')} ${t(language, 'optional')}`}
            value={coordinatesInput}
            onChangeText={(text) => {
              setCoordinatesInput(text);
              if (errors.coordinates) {
                const { coordinates: _, ...rest } = errors;
                setErrors(rest);
              }
            }}
            placeholder={t(language, 'meetingCoordinatesPlaceholder')}
            error={errors.coordinates}
            keyboardType="url"
          />

          {/* Route Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{`${t(language, 'selectRoute')} ${t(language, 'optional')}`}</Text>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <FontAwesome name="search" size={14} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={routeSearchQuery}
                onChangeText={setRouteSearchQuery}
                placeholder={t(language, 'searchRoutes')}
                placeholderTextColor={Colors.textMuted}
              />
              {routeSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setRouteSearchQuery('')}>
                  <FontAwesome name="times-circle" size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Route Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.routeScroll}
              contentContainerStyle={styles.routeScrollContent}
            >
              {filteredRoutes.map((route) => (
                <TouchableOpacity
                  key={route.id}
                  style={[
                    styles.routeChip,
                    selectedRouteId === route.id && styles.routeChipSelected,
                  ]}
                  onPress={() => {
                    setSelectedRouteId(route.id);
                    if (errors.route) {
                      const { route: _, ...rest } = errors;
                      setErrors(rest);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.routeChipText,
                      selectedRouteId === route.id && styles.routeChipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {route.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredRoutes.length === 0 && (
              <Text style={styles.noResultsText}>No routes found</Text>
            )}

            {errors.route && <Text style={styles.error}>{errors.route}</Text>}
            {/* TODO: For GPX upload - add button here to upload custom GPX file */}
          </View>

          <FormInput
            label={t(language, 'notesLabel')}
            value={notes}
            onChangeText={setNotes}
            placeholder={t(language, 'notesPlaceholder')}
            multiline
            numberOfLines={4}
          />

          <FormInput
            label={t(language, 'externalUrlLabel')}
            value={externalUrl}
            onChangeText={(text) => {
              setExternalUrl(text);
              if (errors.externalUrl) {
                const { externalUrl: _, ...rest } = errors;
                setErrors(rest);
              }
            }}
            placeholder={t(language, 'externalUrlPlaceholder')}
            error={errors.externalUrl}
            keyboardType="url"
          />

          <FormInput
            label={t(language, 'capacityLabel')}
            value={capacity}
            onChangeText={(text) => {
              setCapacity(text);
              if (errors.capacity) {
                const { capacity: _, ...rest } = errors;
                setErrors(rest);
              }
            }}
            placeholder={t(language, 'capacityPlaceholder')}
            error={errors.capacity}
            keyboardType="number-pad"
          />

          {errors.submit && (
            <Text style={styles.submitError}>{errors.submit}</Text>
          )}

          {/* Action Buttons */}
          <View style={styles.buttons}>
            <View style={styles.buttonHalf}>
              <PrimaryButton
                label={t(language, 'cancel')}
                onPress={handleCancel}
                variant="secondary"
                disabled={loading}
              />
            </View>
            <View style={styles.buttonHalf}>
              <PrimaryButton
                label={t(language, 'createRide')}
                onPress={handleSubmit}
                loading={loading}
              />
            </View>
          </View>
        </View>
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
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  form: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfWidth: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSurface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  routeScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  routeScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  routeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.cardSurface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routeChipSelected: {
    backgroundColor: 'rgba(0, 188, 124, 0.15)',
    borderColor: Colors.brandGreen,
  },
  routeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  routeChipTextSelected: {
    color: Colors.brandGreen,
    fontWeight: '600',
  },
  noResultsText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: 16,
  },
  error: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
  },
  submitError: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  buttonHalf: {
    flex: 1,
  },
});
