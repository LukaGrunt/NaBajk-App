import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { submitRoute } from '@/repositories/routesRepo';
import { Difficulty } from '@/types/Route';
import { StoryShareSheet } from '@/components/share/StoryShareSheet';

type UploadState = 'idle' | 'uploading' | 'success';

const REGIONS = ['Gorenjska', 'Dolenjska', 'Primorska', 'Štajerska', 'Prekmurje', 'Osrednja Slovenija'];
const DIFFICULTIES: Difficulty[] = ['Lahka', 'Srednja', 'Težka'];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Lahka: '#33CC91',
  Srednja: '#FF6B35',
  Težka: '#EF4444',
};

export default function UploadRouteScreen() {
  const router = useRouter();

  const [isClimb, setIsClimb] = useState<boolean | null>(null);
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('Gorenjska');
  const [difficulty, setDifficulty] = useState<Difficulty>('Srednja');
  const [gpxFile, setGpxFile] = useState<{ name: string; uri: string } | null>(null);
  const [traffic, setTraffic] = useState('');
  const [roadCondition, setRoadCondition] = useState('');
  const [whyGood, setWhyGood] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [showShare, setShowShare] = useState(false);

  // Checkmark animation
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const handlePickGpx = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setGpxFile({ name: result.assets[0].name, uri: result.assets[0].uri });
      }
    } catch (err) {
      Alert.alert('Napaka', 'Datoteke ni bilo mogoče odpreti.');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Manjka ime', 'Vnesi ime poti.');
      return;
    }
    if (!gpxFile) {
      Alert.alert('Manjka datoteka', 'Izberi GPX datoteko.');
      return;
    }

    setUploadState('uploading');

    try {
      const gpxContent = await FileSystem.readAsStringAsync(gpxFile.uri);

      const { error } = await submitRoute({
        title: title.trim(),
        difficulty,
        gpxData: gpxContent,
        isClimb: isClimb ?? false,
        region,
        traffic: traffic.trim() || undefined,
        roadCondition: roadCondition.trim() || undefined,
        whyGood: whyGood.trim() || undefined,
      });

      if (error) throw new Error(error);

      // Animate checkmark
      setUploadState('success');
      checkScale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
      checkOpacity.value = withTiming(1, { duration: 200 });

      setTimeout(() => setShowShare(true), 800);
    } catch (err) {
      setUploadState('idle');
      Alert.alert('Napaka pri nalaganju', 'Poskusi znova.');
    }
  };

  const isUploading = uploadState === 'uploading';
  const isSuccess = uploadState === 'success';
  const canUpload = title.trim().length > 0 && gpxFile !== null && isClimb !== null && !isUploading && !isSuccess;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={16} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Naloži pot</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Success state */}
        {isSuccess && (
          <Animated.View style={[styles.successContainer, checkAnimStyle]}>
            <View style={styles.successCircle}>
              <FontAwesome name="check" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Pot naložena!</Text>
            <Text style={styles.successSubtitle}>Preverili jo bomo in kmalu objavili.</Text>
          </Animated.View>
        )}

        {!isSuccess && (
          <>
            {/* Route type — must be selected first */}
            <View style={styles.section}>
              <Text style={styles.label}>Tip poti</Text>
              <View style={styles.typeRow}>
                <Pressable
                  style={[styles.typeCard, isClimb === false && styles.typeCardActive]}
                  onPress={() => setIsClimb(false)}
                  disabled={isUploading}
                >
                  <View style={[styles.typeIconBox, isClimb === false && styles.typeIconBoxActive]}>
                    <FontAwesome name="bicycle" size={26} color={isClimb === false ? '#FFFFFF' : Colors.brandGreen} />
                  </View>
                  <Text style={[styles.typeTitle, isClimb === false && styles.typeTitleActive]}>Redna pot</Text>
                  <Text style={styles.typeSubtitle}>Kolesarska tura</Text>
                </Pressable>

                <Pressable
                  style={[styles.typeCard, isClimb === true && styles.typeCardClimbActive]}
                  onPress={() => setIsClimb(true)}
                  disabled={isUploading}
                >
                  <View style={[styles.typeIconBox, isClimb === true && styles.typeIconBoxClimbActive]}>
                    <FontAwesome name="area-chart" size={26} color={isClimb === true ? '#FFFFFF' : '#FF6B35'} />
                  </View>
                  <Text style={[styles.typeTitle, isClimb === true && styles.typeTitleClimbActive]}>Vzpon</Text>
                  <Text style={styles.typeSubtitle}>Klanec od dna do vrha</Text>
                </Pressable>
              </View>
            </View>

            {/* Route name */}
            <View style={styles.section}>
              <Text style={styles.label}>Ime poti</Text>
              <TextInput
                style={styles.input}
                placeholder="npr. Kranj – Škofja Loka – Žiri"
                placeholderTextColor={Colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                returnKeyType="done"
                editable={!isUploading}
              />
            </View>

            {/* Region */}
            <View style={styles.section}>
              <Text style={styles.label}>Regija</Text>
              <View style={styles.chipsRow}>
                {REGIONS.map((r) => (
                  <Pressable
                    key={r}
                    style={[styles.chip, region === r && styles.chipActive]}
                    onPress={() => setRegion(r)}
                    disabled={isUploading}
                  >
                    <Text style={[styles.chipText, region === r && styles.chipTextActive]}>{r}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Difficulty */}
            <View style={styles.section}>
              <Text style={styles.label}>Težavnost</Text>
              <View style={styles.chipsRow}>
                {DIFFICULTIES.map((d) => (
                  <Pressable
                    key={d}
                    style={[
                      styles.chip,
                      difficulty === d && { backgroundColor: DIFFICULTY_COLORS[d] + '22', borderColor: DIFFICULTY_COLORS[d] },
                    ]}
                    onPress={() => setDifficulty(d)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        difficulty === d && { color: DIFFICULTY_COLORS[d], fontWeight: '600' },
                      ]}
                    >
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Traffic */}
            <View style={styles.section}>
              <Text style={styles.label}>Promet (neobvezno)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Opiši prometne razmere..."
                placeholderTextColor={Colors.textSecondary}
                value={traffic}
                onChangeText={setTraffic}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isUploading}
              />
            </View>

            {/* Road condition */}
            <View style={styles.section}>
              <Text style={styles.label}>Kakovost ceste (neobvezno)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Opiši stanje ceste..."
                placeholderTextColor={Colors.textSecondary}
                value={roadCondition}
                onChangeText={setRoadCondition}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isUploading}
              />
            </View>

            {/* Why good */}
            <View style={styles.section}>
              <Text style={styles.label}>Zakaj je dobra? (neobvezno)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Kaj naredi to pot posebno..."
                placeholderTextColor={Colors.textSecondary}
                value={whyGood}
                onChangeText={setWhyGood}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isUploading}
              />
            </View>

            {/* GPX file picker */}
            <View style={styles.section}>
              <Text style={styles.label}>GPX datoteka</Text>
              <Pressable
                style={({ pressed }) => [styles.gpxCard, pressed && styles.gpxCardPressed, gpxFile && styles.gpxCardSelected]}
                onPress={handlePickGpx}
                disabled={isUploading}
              >
                <View style={[styles.gpxIconBox, gpxFile && styles.gpxIconBoxSelected]}>
                  <FontAwesome
                    name={gpxFile ? 'check' : 'upload'}
                    size={22}
                    color={gpxFile ? '#FFFFFF' : Colors.brandGreen}
                  />
                </View>
                <View style={styles.gpxTextBox}>
                  <Text style={styles.gpxTitle}>
                    {gpxFile ? gpxFile.name : 'Izberi GPX datoteko'}
                  </Text>
                  <Text style={styles.gpxSubtitle}>
                    {gpxFile ? 'Tapni za zamenjavo' : 'Tapni za brskanje'}
                  </Text>
                </View>
                {!gpxFile && (
                  <FontAwesome name="chevron-right" size={14} color={Colors.textSecondary} />
                )}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Upload button */}
      {!isSuccess && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.uploadButton, !canUpload && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={!canUpload}
            activeOpacity={0.85}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <FontAwesome name="cloud-upload" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={styles.uploadButtonText}>Naloži pot</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <StoryShareSheet
        visible={showShare}
        onSkip={() => router.back()}
        rideName=""
        distanceKm=""
        durationSeconds={0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 16,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  // Text input
  input: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 14,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface1,
  },
  chipActive: {
    backgroundColor: Colors.brandGreen + '22',
    borderColor: Colors.brandGreen,
  },
  chipDisabled: {
    opacity: 0.3,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.brandGreen,
    fontWeight: '600',
  },
  chipTextDisabled: {
    color: Colors.textSecondary,
  },

  // Route type picker
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface1,
    gap: 10,
  },
  typeCardActive: {
    borderColor: Colors.brandGreen,
    backgroundColor: Colors.brandGreen + '12',
  },
  typeCardClimbActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B3512',
  },
  typeIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.brandGreen + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconBoxActive: {
    backgroundColor: Colors.brandGreen,
  },
  typeIconBoxClimbActive: {
    backgroundColor: '#FF6B35',
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  typeTitleActive: {
    color: Colors.brandGreen,
  },
  typeTitleClimbActive: {
    color: '#FF6B35',
  },
  typeSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // GPX picker card
  gpxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  gpxCardPressed: {
    opacity: 0.8,
  },
  gpxCardSelected: {
    borderColor: Colors.brandGreen + '80',
    backgroundColor: Colors.brandGreen + '0D',
  },
  gpxIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.brandGreen + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpxIconBoxSelected: {
    backgroundColor: Colors.brandGreen,
  },
  gpxTextBox: {
    flex: 1,
  },
  gpxTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  gpxSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Footer upload button
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  uploadButton: {
    backgroundColor: Colors.brandGreen,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.4,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Success state
  successContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.brandGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
