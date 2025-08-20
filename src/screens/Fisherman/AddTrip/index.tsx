/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { s } from './styles';
import { buildTripId } from '../../../utils/ids';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import BasicInfoSection, {
  parseYmd12h,
} from './components/sections/BasicInfoSection';
import DropdownsSection from './components/sections/DropdownsSection';
import ContactSpeciesCostSection from './components/sections/ContactSpeciesCostSection';
import LocationCard from './components/LocationCard';
import SaveBar from './components/SaveBar';

import type { FormValues } from './types';
import type { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';
import SectionCard from './components/SectionCard';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createTrip } from '../../../services/trips';
import { saveOrUploadTrip } from '../../../offline/tripSync';

const HEADER_BG = '#1f720d';
type Nav = NativeStackNavigationProp<FishermanStackParamList, 'Trip'>;

const pad = (n: number) => String(n).padStart(2, '0');
const formatYmd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatYmd12h = (d: Date) => {
  const yyyy = d.getFullYear(),
    mm = pad(d.getMonth() + 1),
    dd = pad(d.getDate());
  let h = d.getHours();
  const m = pad(d.getMinutes());
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hh = pad(h);
  return `${yyyy}-${mm}-${dd} ${hh}:${m} ${ap}`;
};

// Backend-safe enum mapping
const TRIP_TYPE_MAP: Record<string, string> = {
  'Fishing Trip': 'fishing',
  'Transport Trip': 'transport',
  'Inspection Trip': 'inspection',
  'Patrol Trip': 'patrol',
  'Research Trip': 'research',
};

export default function AddTripScreen() {
  const methods = useForm<FormValues>({
    defaultValues: {
      fisherman: '', // if you changed to number | null, set null here
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

  const [tripId] = useState(buildTripId());
  const { gps, loading, recapture } = useCurrentLocation();
  const navigation = useNavigation<Nav>();

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('FishermanHome');
  };

  const onSave = methods.handleSubmit(async values => {
    if (!gps) {
      Alert.alert(
        'Location required',
        'Please capture location before saving.',
      );
      return;
    }

    try {
      const departureDisplay =
        values.departure_time?.trim() || formatYmd12h(new Date());
      const dt = parseYmd12h(departureDisplay);
      const departure_date = formatYmd(dt); // ✅ YYYY-MM-DD

      const fishermanId =
        values.fisherman !== '' && values.fisherman != null
          ? Number(values.fisherman)
          : undefined;

      const tripTypeRaw = values.tripType?.trim() || 'Fishing Trip';
      const trip_type = TRIP_TYPE_MAP[tripTypeRaw] ?? 'fishing'; // ✅ backend enum

      const port_location =
        values.destination_port?.trim() ||
        values.departure_port?.trim() ||
        undefined;

      const body = {
        // identifiers
        trip_name: tripId,
        fisherman_id: fishermanId,

        // required by backend
        trip_type, // ✅ enum value
        port_location, // ✅ required
        crew_count: Number(values.crewCount || 0), // must be ≥ 1 (form rule ensures it)

        // ports & schedule
        departure_port: values.departure_port || undefined,
        destination_port: values.destination_port || undefined,
        departure_date, // ✅ date-only
        departure_time: departureDisplay, // time string (if API accepts)

        // coordinates
        departure_latitude: gps?.lat,
        departure_longitude: gps?.lng,

        // optional/extra
        fishing_method: tripTypeRaw, // ok if API keeps a human-readable field
        target_species: values.targetSpecies?.trim() || undefined,
        boat_registration_number: values.boatNameId?.trim() || undefined,
        sea_type: values.seaType || undefined,
        sea_conditions: values.seaConditions || undefined,
        emergency_contact: values.emergencyContact?.trim() || undefined,

        // costs & metrics (numbers)
        trip_cost: values.tripCost !== '' ? Number(values.tripCost) : undefined,
        fuel_cost: values.fuelCost !== '' ? Number(values.fuelCost) : undefined,
        estimated_catch:
          values.estimatedCatch !== ''
            ? Number(values.estimatedCatch)
            : undefined,
        equipment_cost:
          values.equipmentCost !== ''
            ? Number(values.equipmentCost)
            : undefined,
      } as const;
      // const result = saveOrUploadTrip(tripId, body);

      const created = await createTrip(body as any);
      console.log('created trip data or response:', created);

      Alert.alert(
        'Trip created',
        `Trip ${tripId} was saved to the server successfully.`,
        [
          { text: 'OK',
            onPress: () => navigation.navigate('FishermanHome'),
           },
        ],
      );
    } catch (err: any) {
      const msg = err?.message || 'Failed to save trip to server.';
      Alert.alert('Save failed', msg);
    }
  });

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: HEADER_BG }}
    >
      <StatusBar
        backgroundColor={HEADER_BG}
        barStyle="light-content"
        translucent={false}
      />
      <View style={[s.page, { flex: 1 }]}>
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

          <Text style={s.heroTitle}>Add Trip</Text>

          <View style={s.chipRow}>
            <View style={s.chip}>
              <Text style={s.chipLabel}>Trip ID</Text>
              <Text style={s.chipValue} numberOfLines={1}>
                {tripId}
              </Text>
            </View>

            <View style={[s.chip, gps ? s.chipOk : s.chipWarn]}>
              <Text style={s.chipLabel}>GPS</Text>
              <Text style={s.chipValue}>{gps ? 'Captured' : 'Pending'}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={s.container}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <FormProvider {...methods}>
            <SectionCard title="Basic Info" subtitle="Captain & vessel details">
              <BasicInfoSection />
            </SectionCard>

            <SectionCard
              title="Route & Conditions"
              subtitle="Port and sea conditions"
            >
              <DropdownsSection />
            </SectionCard>

            <SectionCard
              title="Contacts & Targets"
              subtitle="Emergency contact and species"
            >
              <ContactSpeciesCostSection />
            </SectionCard>

            <SectionCard
              title="Starting Location"
              subtitle="Capture your current coordinates"
            >
              <LocationCard
                gps={gps}
                loading={loading}
                onRecapture={recapture}
              />
            </SectionCard>

            <SaveBar gpsAvailable={!!gps} onSave={onSave} />
          </FormProvider>
        </ScrollView>
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
  backIcon: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
});
