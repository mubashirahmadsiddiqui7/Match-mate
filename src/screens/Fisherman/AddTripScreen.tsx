import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { ScrollView } from 'react-native-gesture-handler';
import { Dropdown } from 'react-native-element-dropdown';

// ---- Types ----
interface FormValues {
  captainName: string;
  boatNameId: string;
  tripPurpose: string;
  port: string;
  seaType: string;
  numCrew: string;
  numLifejackets: string;
  emergencyContact: string;
  seaConditions: string;
  targetSpecies: string;
  tripCost: string;
}

async function ensureLocationPermission(): Promise<boolean> {
  const perm = Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  });
  if (!perm) return false;
  let status = await check(perm);
  if (status === RESULTS.DENIED || status === RESULTS.LIMITED) {
    status = await request(perm);
  }
  return status === RESULTS.GRANTED;
}

async function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
      forceRequestLocation: true,
      showLocationDialog: true,
    });
  });
}

export default function AddTripScreen() {
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({
    defaultValues: {
      captainName: '',
      boatNameId: '',
      tripPurpose: '',
      port: '',
      seaType: '',
      numCrew: '',
      numLifejackets: '',
      emergencyContact: '',
      seaConditions: '',
      targetSpecies: '',
      tripCost: '',
    },
    mode: 'onTouched',
  });

  const crewValue = watch('numCrew');
  const lifejacketsValue = watch('numLifejackets');
  const costValue = watch('tripCost');
  const numbersValid = useMemo(() => {
    const crewValid = Number(crewValue) > 0;
    const lifeValid = Number(lifejacketsValue) >= 0;
    const costValid = Number(costValue) >= 0;
    return crewValid && lifeValid && costValid;
  }, [crewValue, lifejacketsValue, costValue]);

  useEffect(() => {
    (async () => {
      setLocLoading(true);
      try {
        const ok = await ensureLocationPermission();
        if (!ok) {
          Alert.alert('Location needed', 'Please allow location to attach coordinates to the trip.');
          setLocLoading(false);
          return;
        }
        const pos = await getCurrentPosition();
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
      } catch (e: any) {
        console.warn('GPS error', e?.message || e);
        Alert.alert('Location error', 'Could not get GPS location. You can try again.');
      } finally {
        setLocLoading(false);
      }
    })();
  }, []);

  const onSubmit = (values: FormValues) => {
    if (!gps) {
      Alert.alert('Location required', 'Please capture location before saving.');
      return;
    }

    const tripDraft = {
      id: Date.now().toString(),
      captainName: values.captainName.trim(),
      boatNameId: values.boatNameId.trim(),
      tripPurpose: values.tripPurpose.trim(),
      port: values.port,
      seaType: values.seaType,
      numCrew: Number(values.numCrew),
      numLifejackets: Number(values.numLifejackets),
      emergencyContact: values.emergencyContact.trim(),
      seaConditions: values.seaConditions,
      targetSpecies: values.targetSpecies.trim(),
      tripCost: Number(values.tripCost),
      gps,
      capturedAt: new Date().toISOString(),
      _dirty: true,
    };

    Alert.alert('Saved', 'Trip saved offline and will sync when online.', [
      { text: 'OK' },
    ]);
  };

  const recaptureLocation = async () => {
    setLocLoading(true);
    try {
      const ok = await ensureLocationPermission();
      if (!ok) { setLocLoading(false); return; }
      const pos = await getCurrentPosition();
      setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
    } catch (e: any) {
      Alert.alert('Location error', 'Could not refresh GPS location.');
    } finally {
      setLocLoading(false);
    }
  };

  const ports = [
    'Karachi Fish Harbour',
    'Bin Qasim Port',
    'Gwadar',
    'Pasni',
    'Ormara',
    'Jiwani',
    'Keti Bandar',
    'Korangi Creek',
    'Fisherman`s Wharf'
  ];
  const seaTypes = ['Nearshore', 'Offshore', 'Deep Sea'];
  const seaConditionOptions = ['Calm', 'Moderate', 'Rough', 'Stormy'];

  // Updated dropdown renderer using react-native-element-dropdown
  const renderDropdown = (label: string, name: keyof FormValues, options: string[]) => {
    const dropdownData = options.map(opt => ({ label: opt, value: opt }));

    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <Controller
          name={name}
          control={control}
          rules={{ required: `${label} is required` }}
          render={({ field: { onChange, value } }) => (
            <Dropdown
              style={[styles.dropdown, errors[name] && styles.inputError]}
              placeholderStyle={{ color: '#999', fontSize: 16 }}
              selectedTextStyle={{ color: '#000', fontSize: 16 }}
              data={dropdownData}
              labelField="label"
              valueField="value"
              placeholder={`Select ${label}`}
              value={value}
              onChange={item => onChange(item.value)}
            />
          )}
        />
        {errors[name] && (
          <Text style={styles.errorText}>
            {(errors[name]?.message as string) || ''}
          </Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Add Trip</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Captain Name</Text>
        <Controller
          name="captainName"
          control={control}
          rules={{ required: 'Captain name is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.captainName && styles.inputError]}
              placeholder="Captain Name"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholderTextColor={'#999'}
            />
          )}
        />
        {errors.captainName && <Text style={styles.errorText}>{errors.captainName.message}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Boat Name & ID</Text>
        <Controller
          name="boatNameId"
          control={control}
          rules={{ required: 'Boat name & ID are required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.boatNameId && styles.inputError]}
              placeholder="Boat Name / ID"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholderTextColor={'#999'}
            />
          )}
        />
        {errors.boatNameId && <Text style={styles.errorText}>{errors.boatNameId.message}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Trip Purpose</Text>
        <Controller
          name="tripPurpose"
          control={control}
          rules={{ required: 'Trip purpose is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.tripPurpose && styles.inputError]}
              placeholder="Fishing / Survey / Transport"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholderTextColor={'#999'}
            />
          )}
        />
        {errors.tripPurpose && <Text style={styles.errorText}>{errors.tripPurpose.message}</Text>}
      </View>

      {renderDropdown('Port', 'port', ports)}
      {renderDropdown('Type of Sea Going', 'seaType', seaTypes)}
      {renderDropdown('Sea Conditions', 'seaConditions', seaConditionOptions)}

      <View style={styles.field}>
        <Text style={styles.label}>Number of Crew</Text>
        <Controller
          name="numCrew"
          control={control}
          rules={{ required: 'Number of crew is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.numCrew && styles.inputError]}
              placeholder="0"
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholderTextColor={'#999'}
            />
          )}
        />
        {errors.numCrew && <Text style={styles.errorText}>{errors.numCrew.message}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Number of Lifejackets</Text>
        <Controller
          name="numLifejackets"
          control={control}
          rules={{ required: 'Number of lifejackets is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.numLifejackets && styles.inputError]}
              placeholder="0"
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholderTextColor={'#999'}
            />
          )}
        />
        {errors.numLifejackets && <Text style={styles.errorText}>{errors.numLifejackets.message}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Emergency Contact</Text>
        <Controller
          name="emergencyContact"
          control={control}
          rules={{ required: 'Emergency contact is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.emergencyContact && styles.inputError]}
              placeholder="Contact Number"
              keyboardType="phone-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholderTextColor={'#999'}
            />
          )}
        />
        {errors.emergencyContact && <Text style={styles.errorText}>{errors.emergencyContact.message}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Target Species</Text>
        <Controller
          name="targetSpecies"
          control={control}
          rules={{ required: 'Target species is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.targetSpecies && styles.inputError]}
              placeholder="e.g., Tuna, Mackerel"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholderTextColor={'#999'}
            />
          )}
        />
        {errors.targetSpecies && <Text style={styles.errorText}>{errors.targetSpecies.message}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Cost for Trip</Text>
        <Controller
          name="tripCost"
          control={control}
          rules={{ required: 'Cost is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.tripCost && styles.inputError]}
              placeholder="0.00"
              keyboardType="decimal-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholderTextColor={'#999'}
            />
          )}
        />
        {errors.tripCost && <Text style={styles.errorText}>{errors.tripCost.message}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Starting Location</Text>
        {gps ? (
          <Text style={styles.cardText}>Lat {gps.lat.toFixed(5)}, Lng {gps.lng.toFixed(5)}{gps.accuracy ? ` (±${Math.round(gps.accuracy)}m)` : ''}</Text>
        ) : (
          <Text style={styles.cardText}>No location yet</Text>
        )}
        <TouchableOpacity style={[styles.buttonSecondary, locLoading && styles.buttonDisabled]} onPress={recaptureLocation} disabled={locLoading}>
          <Text style={styles.buttonSecondaryText}>{locLoading ? 'Getting location…' : 'Capture/Refresh Location'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, (!gps || !numbersValid) && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={!gps || !numbersValid}
      >
        <Text style={styles.buttonText}>Save Trip</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  field: { marginTop: 10 },
  label: { fontSize: 16, marginBottom: 6, color: '#222' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 12, height: 48, fontSize: 16 },
  inputError: { borderColor: '#d00' },
  errorText: { color: '#d00', marginTop: 6, fontSize: 12 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginTop: 14, backgroundColor: '#fafafa' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  cardText: { fontSize: 14, color: '#333', marginBottom: 8 },
  button: { backgroundColor: '#0A84FF', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 18, marginBottom: 35 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  buttonSecondary: { backgroundColor: '#EAF3FF', paddingHorizontal: 14, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonSecondaryText: { color: '#0A84FF', fontSize: 14, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  dropdown: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 12, height: 48, justifyContent: 'center' },
});
