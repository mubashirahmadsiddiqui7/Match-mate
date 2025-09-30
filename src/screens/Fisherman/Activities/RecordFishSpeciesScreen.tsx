/* eslint-disable react-native/no-inline-styles */
import React, { JSX, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
// BiText not needed here currently
import { launchImageLibrary, Asset } from 'react-native-image-picker';

import PALETTE from '../../../theme/palette';
import { createFishSpeciesWithPhotos } from '../../../services/fishSpecies';
import { isOnline } from '../../../offline/net';
import { enqueueCreateSpecies } from '../../../offline/TripQueues';
import { buildLotNo, generateLocalId } from '../../../utils/ids';

type Params = {
  activityId: number | string;
  activityCode?: string | null; // "ACT-..."
  tripCode?: string | null; // "TRIP-..."
  activityNumber?: number | null;
  date?: string | null;
  fallback?: any;
};

const PRIMARY = PALETTE.green700;

function Section({
  title,
  icon,
  children,
}: React.PropsWithChildren<{ title: string; icon: string }>) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon as any} size={20} color={PRIMARY} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function RecordFishSpeciesScreen(): JSX.Element {
  const navigation = useNavigation();
  const { params } = useRoute<any>();
  const { activityId, activityCode, tripCode, activityNumber, date, fallback }: Params =
    params || {};

  useWindowDimensions();

  const [species, setSpecies] = useState('');
  const [qty, setQty] = useState('');
  const [type, setType] = useState<'catch' | 'discard' | ''>('');
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<Asset[]>([]);
  const [pickingPhotos, setPickingPhotos] = useState(false);

  const isValid = useMemo(() => {
    const q = Number(qty);
    return species.trim().length > 0 && !!type && !Number.isNaN(q) && q > 0;
  }, [species, qty, type]);

  async function onSubmit() {
    if (!isValid) {
      Toast.show({
        type: 'error',
        text1: 'Missing info',
        text2: 'Species, Type and Quantity (kg) are required.',
        position: 'top',
      });
      return;
    }

    try {
      setSubmitting(true);
      const online = await isOnline();
      
      const speciesBody = {
        activity_code: activityCode ?? undefined,
        trip_code: tripCode ?? undefined,
        species_name: species.trim(),
        quantity_kg: Number(qty),
        type: type as 'catch' | 'discard',
        grade: grade.trim() ? grade.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      };

      if (!online) {
        // Offline mode - generate local IDs and enqueue
        const lotNumber = buildLotNo();
        const localSpeciesId = generateLocalId('SPECIES');
        
        // Determine if we have server IDs or local IDs
        const activityServerId = typeof activityId === 'number' ? activityId : undefined;
        const activityLocalId = typeof activityId === 'string' ? String(activityId) : undefined;

        // Enqueue the species creation
        await enqueueCreateSpecies(speciesBody as any, {
          activityServerId,
          activityLocalId,
        });

        Toast.show({
          type: 'success',
          text1: 'Saved Offline 🎉',
          text2: `Species recorded with lot ${lotNumber}. Will sync when online.`,
          position: 'top',
          visibilityTime: 3000,
        });

        // Go back to details with merged fallback that includes new species
        // @ts-ignore
        navigation.replace('FishingActivityDetails', {
          activityId,
          tripId: tripCode,
          fallback: {
            ...(fallback || {}),
            fish_species: [
              ...((fallback?.fish_species as any[]) || []),
              {
                id: localSpeciesId,
                lot_no: lotNumber,
                fishing_activity_id: activityId,
                trip_id: undefined,
                fisherman_id: undefined,
                species_name: species.trim(),
                quantity_kg: Number(qty),
                type: type as any,
                type_label: type === 'catch' ? 'Catch' : 'Discard',
                grade: grade.trim() || null,
                grade_label: grade.trim() || null,
                notes: notes.trim() || null,
                created_at: null,
                updated_at: null,
              },
            ],
          },
        });
        return;
      }

      // Online mode
      const body = {
        activity_code: activityCode ?? undefined,
        trip_code: tripCode ?? undefined,
        species_name: species.trim(),
        quantity_kg: Number(qty),
        type: type as 'catch' | 'discard',
        grade: grade.trim() ? grade.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      } as const;

      // Debug logs for photos
      try {
        console.log('[SpeciesSubmit] photos.length =', photos.length);
        console.log('[SpeciesSubmit] photo uris =', photos.map(p => p.uri));
        console.log('[SpeciesSubmit] payload =', {
          species_name: body.species_name,
          quantity_kg: body.quantity_kg,
          type: body.type,
          grade: body.grade,
          notes: body.notes,
          activity_code: body.activity_code,
          trip_code: body.trip_code,
        });
      } catch (e) {
        // ignore logging errors
      }

      await createFishSpeciesWithPhotos(
        activityId,
        body as any,
        photos
          .filter(p => !!p.uri)
          .map(p => ({ uri: p.uri!, name: p.fileName, type: p.type })),
      );

      console.log('[SpeciesSubmit] multipart request completed successfully');

      // NOTE: Photo upload can be integrated here if the API supports it.
      // We are capturing selected photos in state; they can be posted after species creation.

      Toast.show({
        type: 'success',
        text1: 'Saved 🎉',
        text2: 'Fish species recorded successfully.',
        position: 'top',
        visibilityTime: 2500,
      });

      // Go back to the details screen for this activity
      // @ts-ignore
      navigation.replace('FishingActivityDetails', { 
        activityId,
        tripId: tripCode 
      });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: e?.message || 'Unable to record fish species.',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handlePickPhotos() {
    if (pickingPhotos) return;
    setPickingPhotos(true);
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 0, // 0 = unlimited (multiple)
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) { setPickingPhotos(false); return; }
        if (response.errorCode) {
          Toast.show({ type: 'error', text1: 'Photos', text2: response.errorMessage || 'Could not open gallery' });
          setPickingPhotos(false);
          return;
        }
        const assets = response.assets || [];
        setPhotos((prev) => {
          const existingUris = new Set(prev.map(p => p.uri));
          const merged = [...prev];
          for (const a of assets) {
            if (a.uri && !existingUris.has(a.uri)) merged.push(a);
          }
          return merged;
        });
        setPickingPhotos(false);
      }
    );
  }

  function handleRemovePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" translucent={false} />
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: PRIMARY }}>
        <View style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Record Fish Species / مچھلی کی قسم ریکارڈ کریں</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Context Info */}
        <View style={styles.contextCard}>
          <Text style={styles.contextTitle}>Activity Context / سرگرمی کا سیاق و سباق</Text>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Trip / سفر:</Text>
            <Text style={styles.contextValue}>{tripCode || 'N/A'}</Text>
          </View>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Activity / سرگرمی:</Text>
            <Text style={styles.contextValue}>
              {activityCode || `#${activityNumber || 'N/A'}`}
            </Text>
          </View>
          {date && (
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Date / تاریخ:</Text>
              <Text style={styles.contextValue}>{date}</Text>
            </View>
          )}
        </View>

        {/* Species Information */}
        <Section title="Species Details / انواع کی تفصیلات" icon="set-meal">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Species Name * / قسم کا نام *</Text>
            <TextInput
              style={styles.input}
              value={species}
              onChangeText={setSpecies}
              placeholder="e.g., Tuna, Mackerel, Snapper / مثال: ٹونا، میکریل، سنپر"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity (kg) * / مقدار (کلوگرام) *</Text>
            <TextInput
              style={styles.input}
              value={qty}
              onChangeText={setQty}
              placeholder="0.0 / ۰٫۰"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type * / قسم *</Text>
            <View style={styles.typeButtons}>
              <Pressable
                onPress={() => setType('catch')}
                style={[
                  styles.typeButton,
                  type === 'catch' && styles.typeButtonActive,
                ]}
              >
                <MaterialIcons
                  name="sailing"
                  size={18}
                  color={type === 'catch' ? '#fff' : PRIMARY}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'catch' && styles.typeButtonTextActive,
                  ]}
                >
                  Catch / پکڑ
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setType('discard')}
                style={[
                  styles.typeButton,
                  type === 'discard' && styles.typeButtonActive,
                ]}
              >
                <MaterialIcons
                  name="delete"
                  size={18}
                  color={type === 'discard' ? '#fff' : PRIMARY}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'discard' && styles.typeButtonTextActive,
                  ]}
                >
                  Discard / ضائع کریں
                </Text>
              </Pressable>
            </View>
          </View>
        </Section>

        {/* Quality & Notes */}
        <Section title="Quality & Notes / معیار اور نوٹس" icon="grade">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Grade (Optional) / گریڈ (اختیاری)</Text>
            <TextInput
              style={styles.input}
              value={grade}
              onChangeText={setGrade}
              placeholder="e.g., A, B, C / مثال: A, B, C"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional) / نوٹس (اختیاری)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes about this species... / اس قسم کے بارے میں اضافی نوٹس..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </Section>

        {/* Photos */}
        <Section title="Photos / تصاویر" icon="image">
          <View style={{ gap: 12 }}>
            <Pressable onPress={handlePickPhotos} disabled={pickingPhotos} style={[styles.addPhotosButton, pickingPhotos && { opacity: 0.7 }] }>
              {pickingPhotos ? (
                <ActivityIndicator size="small" color={PRIMARY} />
              ) : (
                <MaterialIcons name="upload-file" size={18} color={PRIMARY} />
              )}
              <Text style={styles.addPhotosText}>{pickingPhotos ? 'Loading…' : 'Upload / اپ لوڈ'}</Text>
              <Text style={styles.addPhotosHint}>(Multiple ok / متعدد)</Text>
            </Pressable>

            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((p, idx) => (
                  <View key={p.uri || String(idx)} style={styles.photoItem}>
                    {p.uri ? (
                      <Image source={{ uri: p.uri }} style={styles.photoImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.photoImage, { alignItems: 'center', justifyContent: 'center' }]}> 
                        <MaterialIcons name="image" size={24} color={PALETTE.text400} />
                      </View>
                    )}
                    <Pressable onPress={() => handleRemovePhoto(idx)} style={styles.photoRemove}>
                      <MaterialIcons name="close" size={16} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Section>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          {/* Debug Validation Status */}
          {/* <View style={{ 
            backgroundColor: '#f3f4f6', 
            padding: 12, 
            borderRadius: 8, 
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#d1d5db'
          }}>
            <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
              Debug: Species="{species}" | Type="{type}" | Qty="{qty}" | Valid={isValid ? 'true' : 'false'}
            </Text>
          </View> */}
          
          <Pressable
            onPress={onSubmit}
            disabled={!isValid || submitting}
            style={[
              styles.submitButton,
              !isValid && styles.submitButtonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color="#fff" />
                <Text style={styles.submitButtonText} numberOfLines={1} ellipsizeMode="tail">Record Species / قسم ریکارڈ کریں</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  contextCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  contextValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#374151',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: PRIMARY,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: PRIMARY,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  submitContainer: {
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addPhotosButton: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FAFAFA',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addPhotosText: {
    color: PRIMARY,
    fontWeight: '700',
  },
  addPhotosHint: {
    marginLeft: 'auto',
    color: PALETTE.text500,
    fontSize: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EEE',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    padding: 4,
  },
});
