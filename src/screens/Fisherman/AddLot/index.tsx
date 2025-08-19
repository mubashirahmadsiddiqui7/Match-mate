/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormProvider, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';
// import { createLot } from '../../../redux/actions/lotApiActions';
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
import { createLot, type CreateLotBody  } from '../../../services/lots';

type Nav = NativeStackNavigationProp<FishermanStackParamList, 'Lots'>;
type LotsRoute = RouteProp<FishermanStackParamList, 'Lots'>;

interface FormValues {
  tripId?: string | number;     // <-- add selected trip id here
  species: string;
  weightKg: string;
  grade: string;
}

type TripRow = {
  id: number | string;
  trip_id: string; // e.g., "TRIP-20250819-001"
  status?: string;
  departure_port?: string | null;
  destination_port?: string | null;
  departure_time?: string | null;
};

const PALETTE = {
  green700: '#1B5E20',
  green600: '#2E7D32',
  green50: '#E8F5E9',
  text900: '#111827',
  text700: '#374151',
  text600: '#4B5563',
  border: '#E5E7EB',
  surface: '#FFFFFF',
  warn: '#EF6C00',
  info: '#1E88E5',
  purple: '#6A1B9A',
  error: '#C62828',
};

export default function AddLotScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();
  const route = useRoute<LotsRoute>();
  const routeTripId = route.params?.tripId; // may be undefined

  const methods = useForm<FormValues>({
    defaultValues: {
      tripId: routeTripId ?? undefined,   // preselect if passed from Trip screen
      species: '',
      weightKg: '',
      grade: '',
    },
    mode: 'onTouched',
  });

  const [lotNo] = useState(buildLotNo());
  const { gps, loading: locLoading, recapture } = useCurrentLocation();
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);

  const [loadingTrips, setLoadingTrips] = useState(false);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [saving, setSaving] = useState(false);


  // Build dropdown options
  const tripOptions = useMemo(
    () =>
      trips.map(t => ({
        label: t.trip_id,      // visible string
        value: t.id,           // numeric/string id used for API
      })),
    [trips],
  );

  // Pretty label for review row
  const selectedTripValue = methods.watch('tripId');
  const selectedTripLabel = useMemo(() => {
    const found = tripOptions.find(
      o => String(o.value) === String(selectedTripValue ?? ''),
    );
    return found?.label;
  }, [tripOptions, selectedTripValue]);

  // Weight validation
  const weightValue = methods.watch('weightKg');
  const weightValid = useMemo(() => {
    const n = Number(weightValue);
    return !isNaN(n) && n > 0;
  }, [weightValue]);

  // Load trips from the provided external API
  const loadTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      const res = await api('https://smartaisoft.com/MFD-Trace-Fish/api/trips', {
        query: { page: 1, per_page: 100 },
      });
      // shape: { success, data: { data: Trip[], ...pagination } }
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
      console.log('[AddLotScreen] trips load failed:', e?.message || e);
      Alert.alert('Error', e?.message || 'Failed to load trips');
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // const onSave = methods.handleSubmit(values => {
  //   const effectiveTripId = values.tripId ?? routeTripId;
  //   if (!effectiveTripId) {
  //     Alert.alert('Trip required', 'Please select a trip to link this lot.');
  //     return;
  //   }
  //   if (!gps) {
  //     Alert.alert('Location required', 'Please capture location before saving.');
  //     return;
  //   }

  //   const lotDraft = {
  //     lotNo,
  //     tripId: Number(effectiveTripId),
  //     species: values.species.trim(),
  //     grade: values.grade.trim(),
  //     weightKg: Number(values.weightKg),
  //     capturedAt: new Date().toISOString(),
  //     gps,
  //     photoLocalPath: photoUri || undefined,
  //     _dirty: true,
  //   };

  //   dispatch<any>(createLot(lotDraft));
  //   Alert.alert('Saved', `Lot ${lotNo} saved.`, [{ text: 'OK' }]);
  // });

  const onSave = methods.handleSubmit(async values => {
  const effectiveTripId = methods.getValues('tripId') ?? tripId;
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
    // optional extras if you want to send them:
    gps_latitude: gps.lat,
    gps_longitude: gps.lng,
    captured_at: new Date().toISOString(),
    // port_location: 'Karachi Port', // provide if you collect it
  };

  try {
    setSaving(true);
    const created = await createLot(body);
    console.log('[createLot] success:', created);
    Alert.alert('Saved', `Lot ${lotNo} created successfully.`, [{ text: 'OK' }]);
    // (optional) reset fields
    methods.reset({ tripId: effectiveTripId, species: '', weightKg: '', grade: '' });
  } catch (err: any) {
    console.error('[createLot] error:', err?.response || err);
    Alert.alert('Failed', err?.message || 'Could not create lot.');
  } finally {
    setSaving(false);
  }
});


  return (
    <>
      {/* iOS: paint the notch/top area to match header color */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.primary }}>
        <FocusAwareStatusBar barStyle="light-content" backgroundColor={theme.primary} />
      </SafeAreaView>

      {/* Main safe area (sides/bottom) */}
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
            <Text style={s.heroTitle}>Add Lot</Text>
            <View style={{ width: 22 }} />{/* spacer for symmetry */}
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
        <ScrollView
          style={s.container}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <FormProvider {...methods}>
            <SectionCard title="Details" subtitle="Select trip & fill lot details">
              {/* Trip selector */}
              <DropdownField
                name="tripId"
                label="Trip"
                options={tripOptions}
                placeholder={loadingTrips ? 'Loading…' : 'Select Trip'}
                rules={{ required: 'Trip is required' }}
              />

              <TextField
                name="species"
                label="Species"
                placeholder="e.g., Pomfret"
                rules={{ required: 'Species is required' }}
              />

              <NumberField
                name="weightKg"
                label="Weight (kg)"
                placeholder="0.0"
                rules={{ required: 'Weight is required' }}
              />
              {!weightValid && weightValue?.length > 0 && (
                <Text style={s.errorText}>Enter a number greater than 0</Text>
              )}

              <TextField
                name="grade"
                label="Grade"
                placeholder="A / B / C"
                rules={{ required: 'Grade is required' }}
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
              value={`Lot ${lotNo} will be linked to Trip ${
                selectedTripLabel ?? selectedTripValue ?? routeTripId ?? '—'
              }`}
            />

            <SaveBar
              label="Save Lot"
              disabled={!gps || !weightValid || !(selectedTripValue ?? routeTripId)}
              onPress={onSave}
            />
          </FormProvider>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
