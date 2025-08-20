/* src/screens/Fisherman/AddLot/index.tsx */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';
import { buildLotNo } from '../../../utils/ids';

import { s, theme } from './styles';
import { useCurrentLocation } from './useCurrentLocation';
import SectionCard from './components/SectionCard';
import { ReadonlyRow } from './components/ReadonlyRow';
import { TextField, NumberField } from './components/Fields';
import LocationCard from './components/LocationCard';
import PhotoCard from './components/PhotoCard';
import SaveBar from './components/SaveBar';
import FocusAwareStatusBar from './components/FocusAwareStatusBar';
import DropdownField from '../AddTrip/components/fields/DropdownField';
import { api } from '../../../services/https';
import {
  createLot,
  type CreateLotBody,
  fetchFishLotById,
  type FishLotById,
} from '../../../services/lots';
import { updateLot } from '../../../services/lots'; // ⬅️ new

type Nav = NativeStackNavigationProp<FishermanStackParamList, 'Lots'>;
type LotsRoute = RouteProp<FishermanStackParamList, 'Lots'>;

interface FormValues {
  tripId?: string | number;
  species: string;
  weightKg: string;
  grade: string;
}

type TripRow = {
  id: number | string;
  trip_id: string;
  status?: string;
  departure_port?: string | null;
  destination_port?: string | null;
  departure_time?: string | null;
};
 
export default function AddLotScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<LotsRoute>();

  // Are we editing?
  const isEdit = (route.params as any)?.mode === 'edit';
  const editingLotId = isEdit ? (route.params as any).lotId : undefined;

  const routeTripId = !isEdit ? (route.params as any)?.tripId : undefined;

  const methods = useForm<FormValues>({
    defaultValues: {
      tripId: routeTripId ?? undefined,
      species: '',
      weightKg: '',
      grade: '',
    },
    mode: 'onTouched',
  });

  const [lotNo, setLotNo] = useState(buildLotNo());
  const { gps, loading: locLoading, recapture } = useCurrentLocation();
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);

  const [loadingTrips, setLoadingTrips] = useState(false);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [saving, setSaving] = useState(false);

  const [editingLot, setEditingLot] = useState<FishLotById | null>(null);

  // Load trips
  const loadTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      const res = await api('http://192.168.18.44:8000/api/trips', {
        query: { page: 1, per_page: 100 },
      });
      const rows: TripRow[] = (res?.data?.data ?? []).map((t: any) => ({
        id: t.id,
        trip_id: t.trip_id,
        status: t.status,
        departure_port: t.departure_port,
        destination_port: t.arrival_port ?? t.destination_port ?? null,
        departure_time: t.departure_time,
      }));
      setTrips(rows);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load trips');
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // If editing, load lot and prefill
  useEffect(() => {
    if (!isEdit || !editingLotId) return;
    (async () => {
      try {
        const dto = await fetchFishLotById(editingLotId);
        setEditingLot(dto);

        // prefill form + lot no
        setLotNo(dto.lot_no || buildLotNo());
        methods.reset({
          tripId: dto.trip_id,
          species: dto.species ?? '',
          weightKg: dto.weight_kg ? String(dto.weight_kg) : '',
          grade: dto.grade ?? '',
        });
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to load lot');
        navigation.goBack();
      }
    })();
  }, [isEdit, editingLotId, methods, navigation]);

  // dropdown & validations
  const tripOptions = useMemo(
    () =>
      trips.map(t => ({ label: t.trip_id, value: t.id })),
    [trips]
  );

  const selectedTripValue = methods.watch('tripId');
  const selectedTripLabel = useMemo(() => {
    const found = tripOptions.find(
      o => String(o.value) === String(selectedTripValue ?? '')
    );
    return found?.label;
  }, [tripOptions, selectedTripValue]);

  const weightValue = methods.watch('weightKg');
  const weightValid = useMemo(() => {
    const n = Number(weightValue);
    return !isNaN(n) && n > 0;
  }, [weightValue]);

  // Save handler (create OR update)
  const onSave = methods.handleSubmit(async values => {
    const effectiveTripId = methods.getValues('tripId');
    if (!effectiveTripId) {
      Alert.alert('Trip required', 'Please select a trip to link this lot.');
      return;
    }
    if (!gps) {
      Alert.alert('Location required', 'Please capture location before saving.');
      return;
    }
    if (!values.species?.trim() || !values.grade?.trim() || Number(values.weightKg) <= 0) {
      Alert.alert('Missing info', 'Please fill species, grade, and a weight > 0.');
      return;
    }

    const body: CreateLotBody = {
      lot_no: lotNo,
      trip_id: Number(effectiveTripId),
      species: values.species.trim(),
      weight_kg: Number(values.weightKg),
      grade: values.grade.trim(),
      gps_latitude: gps.lat,
      gps_longitude: gps.lng,
      captured_at: new Date().toISOString(),
    };

    try {
      setSaving(true);

      if (isEdit && editingLotId) {
        // guard: only allow update for pending
        const isPending = editingLot?.status?.toLowerCase() === 'pending';
        if (!isPending) {
          Alert.alert('Not Allowed', 'Verified lots cannot be edited.');
          return;
        }

        const updated = await updateLot(editingLotId, body);
        Alert.alert(
          'Updated',
          `Lot ${updated?.lot_no || lotNo} updated successfully.`,
          [
            {
              text: 'OK',
              onPress: () =>
                // back to details and refresh it
                navigation.navigate('LotsList'),
            },
          ],
        );
      } else {
        const created = await createLot(body);
        Alert.alert(
          'Saved',
          `Lot ${created?.lot_no || lotNo} created successfully.`,
          [{ text: 'OK', onPress: () => navigation.navigate('FishermanHome') }],
        );
        methods.reset({
          tripId: effectiveTripId,
          species: '',
          weightKg: '',
          grade: '',
        });
        setLotNo(buildLotNo());
      }
    } catch (err: any) {
      Alert.alert('Failed', err?.message || (isEdit ? 'Could not update lot.' : 'Could not create lot.'));
    } finally {
      setSaving(false);
    }
  });

  // UI labels & disable rules
  const headerTitle = isEdit ? 'Edit Lot' : 'Add Lot';
  const saveLabel = isEdit ? 'Update Lot' : 'Save Lot';
  const canEdit = !isEdit || editingLot?.status?.toLowerCase() === 'pending';

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.primary }}>
        <FocusAwareStatusBar barStyle="light-content" backgroundColor={theme.primary} />
      </SafeAreaView>

      <SafeAreaView style={s.page} edges={['left', 'right', 'bottom']}>
        {/* Hero Header */}
        <View style={s.hero}>
          <View style={s.topRow}>
            <MaterialIcons
              name="arrow-back"
              size={22}
              color="#fff"
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
            />
            <Text style={s.heroTitle}>{headerTitle}</Text>
            <View style={{ width: 22 }} />
          </View>

          <View style={s.chipRow}>
            <View style={s.chip}>
              <Text style={s.chipLabel}>Lot No</Text>
              <Text style={s.chipValue} numberOfLines={1}>{lotNo}</Text>
            </View>
            <View style={[s.chip, gps ? s.chipOk : s.chipWarn]}>
              <Text style={s.chipLabel}>GPS</Text>
              <Text style={s.chipValue}>{gps ? 'Captured' : 'Pending'}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <FormProvider {...methods}>
            <SectionCard title="Details" subtitle={isEdit ? 'Update lot details' : 'Select trip & fill lot details'}>
              <DropdownField
                name="tripId"
                label="Trip"
                options={tripOptions}
                placeholder={loadingTrips ? 'Loading…' : 'Select Trip'}
                rules={{ required: 'Trip is required' }}
                disabled={!canEdit}
              />

              <TextField
                name="species"
                label="Species"
                placeholder="e.g., Pomfret"
                rules={{ required: 'Species is required' }}
                editable={canEdit}
              />

              <NumberField
                name="weightKg"
                label="Weight (kg)"
                placeholder="0.0"
                rules={{ required: 'Weight is required' }}
                editable={canEdit}
              />
              {!weightValid && weightValue?.length > 0 && (
                <Text style={s.errorText}>Enter a number greater than 0</Text>
              )}

              <TextField
                name="grade"
                label="Grade"
                placeholder="A / B / C"
                rules={{ required: 'Grade is required' }}
                editable={canEdit}
              />
            </SectionCard>

            <SectionCard title="Location" subtitle="Capture your current coordinates">
              <LocationCard gps={gps} loading={locLoading} onRecapture={recapture} />
            </SectionCard>

            <SectionCard title="Photo (optional)" subtitle="Attach a picture of the lot">
              <PhotoCard photoUri={photoUri} onChange={setPhotoUri} />
            </SectionCard>

            <ReadonlyRow
              label="Review"
              value={
                isEdit
                  ? `Updating ${lotNo} linked to Trip ${selectedTripLabel ?? selectedTripValue ?? '—'}`
                  : `Lot ${lotNo} will be linked to Trip ${selectedTripLabel ?? selectedTripValue ?? routeTripId ?? '—'}`
              }
            />

            <SaveBar
              label={saveLabel}
              disabled={
                !canEdit ||
                !gps ||
                !weightValid ||
                !(selectedTripValue ?? routeTripId) ||
                saving
              }
              onPress={onSave}
            />
          </FormProvider>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
