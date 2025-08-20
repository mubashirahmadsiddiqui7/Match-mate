/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  StatusBar,
  StyleSheet,
  Pressable,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { s } from './styles';
import { buildTripId } from '../../../utils/ids';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import BasicInfoSection, { parseYmd12h, formatYmd12h } from './components/sections/BasicInfoSection';
import DropdownsSection from './components/sections/DropdownsSection';
import ContactSpeciesCostSection from './components/sections/ContactSpeciesCostSection';
import LocationCard from './components/LocationCard';
import SaveBar from './components/SaveBar';

import type { FormValues } from './types';
import type { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';
import SectionCard from './components/SectionCard';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createTrip, getTripById, updateTrip, type TripDetails } from '../../../services/trips';
import type { RouteProp } from '@react-navigation/native';

const HEADER_BG = '#1f720d';
type TripRoute = RouteProp<FishermanStackParamList, 'Trip'>;


type Nav = NativeStackNavigationProp<FishermanStackParamList, 'Trip'>;

// ---- helpers ----
const pad = (n: number) => String(n).padStart(2, '0');
const formatYmd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Backend-safe enum mapping (labels <-> enum)
const TRIP_TYPE_MAP: Record<string, string> = {
  'Fishing Trip': 'fishing',
  'Transport Trip': 'transport',
  'Inspection Trip': 'inspection',
  'Patrol Trip': 'patrol',
  'Research Trip': 'research',
};
const TRIP_TYPE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(TRIP_TYPE_MAP).map(([label, val]) => [val, label])
);

export default function AddTripScreen() {
  const navigation = useNavigation<Nav>();
   const { params } = useRoute<TripRoute>();

  const isEdit = !!params?.id || params?.mode === 'edit';
  const editingId = params?.id;

  const methods = useForm<FormValues>({
    defaultValues: {
      fisherman: '',            // fisher id (stringifiable)
      departure_time: formatYmd12h(new Date()),
      boatNameId: '',
      crewCount: '',
      tripType: '',
      tripPurpose: '',
      departure_port: '',
      destination_port: '',
      seaType: '',
      seaConditions: '',
      emergencyContact: '',
      targetSpecies: '',
      tripCost: '',
      fuelCost: '',
      estimatedCatch: '',
      equipmentCost: '',
    },
    mode: 'onTouched',
  });

  // keep an immutable snapshot of initial values (for dirty patch)
  const [initialValues, setInitialValues] = useState<FormValues | null>(null);

  const [tripId] = useState(buildTripId()); // used for create header chip
  const { gps, loading: gpsLoading, recapture } = useCurrentLocation();

  const [loading, setLoading] = useState<boolean>(isEdit); // show while fetching for edit
  const [serverTrip, setServerTrip] = useState<TripDetails | null>(null);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('FishermanHome');
  };

  // ---- load existing for EDIT ----
  const loadForEdit = useCallback(async () => {
    if (!isEdit || !editingId) return;
    try {
      setLoading(true);
      const t = await getTripById(editingId);
      setServerTrip(t);

      // map server -> form fields
      const formVals: FormValues = {
        fisherman: t.fisherman?.id ? String(t.fisherman.id) : '',
        departure_time: t.departure_time || formatYmd12h(new Date()),
        boatNameId: t.boat_registration_no ?? '',
        crewCount: t.crew_count != null ? String(t.crew_count) : '',
        tripType: TRIP_TYPE_REVERSE[t.trip_type ?? ''] || t.trip_type || 'Fishing Trip',
        tripPurpose: '', // server has trip_purpose? Add if you store it.
        departure_port: t.departure_port ?? '',
        destination_port: '', // fill if you store a distinct destination in server
        seaType: '', // if you store sea_type; not present in sample payload
        seaConditions: t.sea_conditions ?? '',
        emergencyContact: t.emergency_contact ?? '',
        targetSpecies: t.target_species ?? '',
        tripCost: '', // if you track trip_cost separately
        fuelCost: t.fuel_cost != null ? String(t.fuel_cost) : '',
        estimatedCatch: t.estimated_catch != null ? String(t.estimated_catch) : '',
        equipmentCost: t.operational_cost != null ? String(t.operational_cost) : '',
      };

      // set defaults + keep a pristine copy for dirty diff
      methods.reset(formVals, { keepDefaultValues: false });
      setInitialValues(formVals);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load trip for edit.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [isEdit, editingId, methods, navigation]);

  useEffect(() => {
    loadForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  // ---- submit handlers ----
  const onSaveCreate = methods.handleSubmit(async (values) => {
    if (!gps) {
      Alert.alert('Location required', 'Please capture location before saving.');
      return;
    }
    try {
      const departureDisplay = values.departure_time?.trim() || formatYmd12h(new Date());
      const dt = parseYmd12h(departureDisplay);
      const departure_date = formatYmd(dt);

      const fishermanId =
        values.fisherman !== '' && values.fisherman != null
          ? Number(values.fisherman)
          : undefined;

      const tripTypeRaw = values.tripType?.trim() || 'Fishing Trip';
      const trip_type = TRIP_TYPE_MAP[tripTypeRaw] ?? 'fishing';

      const port_location =
        values.destination_port?.trim() ||
        values.departure_port?.trim() ||
        undefined;

      const body = {
        trip_name: tripId,
        fisherman_id: fishermanId,
        trip_type,
        port_location,
        crew_count: Number(values.crewCount || 0), // your backend accepted crew_count for create
        departure_port: values.departure_port || undefined,
        destination_port: values.destination_port || undefined,
        departure_date,
        departure_time: departureDisplay,
        departure_latitude: gps?.lat,
        departure_longitude: gps?.lng,
        fishing_method: tripTypeRaw,
        target_species: values.targetSpecies?.trim() || undefined,
        boat_registration_number: values.boatNameId?.trim() || undefined,
        sea_type: values.seaType || undefined,
        sea_conditions: values.seaConditions || undefined,
        emergency_contact: values.emergencyContact?.trim() || undefined,
        trip_cost: values.tripCost !== '' ? Number(values.tripCost) : undefined,
        fuel_cost: values.fuelCost !== '' ? Number(values.fuelCost) : undefined,
        estimated_catch:
          values.estimatedCatch !== '' ? Number(values.estimatedCatch) : undefined,
        equipment_cost:
          values.equipmentCost !== '' ? Number(values.equipmentCost) : undefined,
      } as const;

      const created = await createTrip(body as any);
      console.log('created trip:', created);

      Alert.alert('Trip created', `Trip ${tripId} was saved successfully.`, [
        { text: 'OK', onPress: () => navigation.navigate('FishermanHome') },
      ]);
    } catch (err: any) {
      Alert.alert('Save failed', err?.message || 'Failed to save trip to server.');
    }
  });

  // Build a small patch with only dirty changes:
  const buildPatch = (values: FormValues) => {
    // If you need exact dirty fields: methods.formState.dirtyFields (nested flags)
    // For simplicity, compare against initialValues snapshot when editing.
    const from = initialValues || values;
    const changed = <T extends keyof FormValues>(key: T) => values[key] !== from[key];

    // Map labels -> enums again
    const tripTypeRaw = values.tripType?.trim() || 'Fishing Trip';
    const trip_type = TRIP_TYPE_MAP[tripTypeRaw] ?? 'fishing';

    const departureDisplay = values.departure_time?.trim();
    const dt = departureDisplay ? parseYmd12h(departureDisplay) : null;
    const departure_date = dt ? formatYmd(dt) : undefined;

    // Patch uses server field names commonly accepted by your API on update
    const patch: Record<string, any> = {};
    if (changed('fisherman')) patch.fisherman_id = values.fisherman ? Number(values.fisherman) : undefined;
    if (changed('tripType')) patch.trip_type = trip_type;
    if (changed('tripPurpose')) patch.trip_purpose = values.tripPurpose?.trim() || undefined;

    if (changed('departure_port')) patch.departure_port = values.departure_port || undefined;
    if (changed('destination_port')) patch.destination_port = values.destination_port || undefined;
    if (changed('departure_time') && departureDisplay) {
      patch.departure_time = departureDisplay;
      patch.departure_date = departure_date; // many backends like both
    }

    if (changed('boatNameId')) patch.boat_registration_number = values.boatNameId?.trim() || undefined;

    if (changed('crewCount')) {
      const n = values.crewCount === '' ? undefined : Number(values.crewCount);
      // Your updateTrip earlier used crew_size; some endpoints accept crew_count too.
      patch.crew_size = n;
      patch.crew_count = n;
    }

    if (changed('targetSpecies')) patch.target_species = values.targetSpecies?.trim() || undefined;
    if (changed('seaType')) patch.sea_type = values.seaType || undefined;
    if (changed('seaConditions')) patch.sea_conditions = values.seaConditions || undefined;
    if (changed('emergencyContact')) patch.emergency_contact = values.emergencyContact?.trim() || undefined;

    if (changed('tripCost')) patch.trip_cost = values.tripCost !== '' ? Number(values.tripCost) : undefined;
    if (changed('fuelCost')) patch.fuel_cost = values.fuelCost !== '' ? Number(values.fuelCost) : undefined;
    if (changed('estimatedCatch')) patch.estimated_catch = values.estimatedCatch !== '' ? Number(values.estimatedCatch) : undefined;
    if (changed('equipmentCost')) {
      // Your detail screen shows "Operational Cost" from operational_cost
      patch.operational_cost = values.equipmentCost !== '' ? Number(values.equipmentCost) : undefined;
      // If your server expects equipment_cost instead, keep both:
      patch.equipment_cost = values.equipmentCost !== '' ? Number(values.equipmentCost) : undefined;
    }

    // port_location convenience (if either port changed)
    if (changed('departure_port') || changed('destination_port')) {
      patch.port_location =
        values.destination_port?.trim() ||
        values.departure_port?.trim() ||
        undefined;
    }

    return patch;
  };

  const onSaveEdit = methods.handleSubmit(async (values) => {
    if (!isEdit || !editingId) return;

    // crew count guard (1–50) if present
    if (values.crewCount !== '') {
      const n = Number(values.crewCount);
      if (Number.isNaN(n) || n < 1 || n > 50) {
        Alert.alert('Invalid crew', 'Crew count must be between 1 and 50.');
        return;
      }
    }

    try {
      const patch = buildPatch(values);
      if (Object.keys(patch).length === 0) {
        Alert.alert('No changes', 'You have not changed anything.');
        return;
      }
      await updateTrip(editingId, patch);
      Alert.alert('Updated', 'Trip changes have been saved.', [
        { text: 'OK', onPress: () => navigation.navigate('FishermanHome') },
      ]);
    } catch (err: any) {
      Alert.alert('Update failed', err?.message || 'Could not update trip.');
    }
  });

  const onSave = isEdit ? onSaveEdit : onSaveCreate;

  // ---- header labels & chips ----
  const headerTitle = isEdit ? 'Edit Trip' : 'Add Trip';
  const chipTripId = isEdit ? (serverTrip?.trip_name ?? serverTrip?.id ?? '') : tripId;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: HEADER_BG }}>
      <StatusBar backgroundColor={HEADER_BG} barStyle="light-content" translucent={false} />

      <View style={[s.page, { flex: 1 }]}>
        {/* Header */}
        <View style={[s.hero, { backgroundColor: HEADER_BG }]}>
          <View style={styles.topRow}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={s.heroTitle}>{headerTitle}</Text>

          <View style={s.chipRow}>
            <View style={s.chip}>
              <Text style={s.chipLabel}>Trip ID</Text>
              <Text style={s.chipValue} numberOfLines={1}>
                {String(chipTripId)}
              </Text>
            </View>

            {/* GPS chip: required on create, optional on edit */}
            <View style={[s.chip, (!isEdit && !gps) ? s.chipWarn : s.chipOk]}>
              <Text style={s.chipLabel}>GPS</Text>
              <Text style={s.chipValue}>
                {isEdit ? (gps ? 'Captured' : 'Optional') : (gps ? 'Captured' : 'Pending')}
              </Text>
            </View>
          </View>
        </View>

        {/* Body */}
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
            <Text>Loading trip…</Text>
          </View>
        ) : (
          <ScrollView
            style={s.container}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <FormProvider {...methods}>
              <SectionCard title="Basic Info" subtitle="Captain & vessel details">
                <BasicInfoSection />
              </SectionCard>

              <SectionCard title="Route & Conditions" subtitle="Port and sea conditions">
                <DropdownsSection />
              </SectionCard>

              <SectionCard title="Contacts & Targets" subtitle="Emergency contact and species">
                <ContactSpeciesCostSection />
              </SectionCard>

              <SectionCard title="Starting Location" subtitle={isEdit ? 'Optional for edits' : 'Capture your current coordinates'}>
                <LocationCard gps={gps} loading={gpsLoading} onRecapture={recapture} />
              </SectionCard>

              {/* Save bar: GPS required only for create */}
              <SaveBar gpsAvailable={isEdit ? true : !!gps} onSave={onSave} />
            </FormProvider>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topRow: {
    position: 'absolute',
    top: 5,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 10,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 22,
  },
});
