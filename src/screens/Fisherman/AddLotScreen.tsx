// =============================================
// File: src/screens/Fisherman/AddLotScreen.tsx
// Simple, big-button form for fishermen to add a Lot
// Requirements: react-hook-form, ulid, react-native-permissions,
// react-native-geolocation-service, react-native-image-picker
// =============================================
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Platform } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
//import { FishermanStackParamList } from '../../app/navigation/stacks/FishermanStack';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { ulid } from 'ulid';
import { ScrollView } from 'react-native-gesture-handler';

// ---- Types ----
interface FormValues {
  species: string;
  weightKg: string; // keep as string for input; convert to number on submit
  grade: string; 
}

//type Props = NativeStackScreenProps<FishermanStackParamList, 'AddLot'>;

// ---- Helpers ----
// function buildLotNo(now = new Date()) {
//   // LOT-YYYYMMDD-HHMM-xxxxx
//   const y = now.getFullYear();
//   const m = String(now.getMonth() + 1).padStart(2, '0');
//   const d = String(now.getDate()).padStart(2, '0');
//   const hh = String(now.getHours()).padStart(2, '0');
//   const mm = String(now.getMinutes()).padStart(2, '0');
//   const suffix = ulid().slice(-5).toUpperCase();
//   return `LOT-${y}${m}${d}-${hh}${mm}-${suffix}`;
// }

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

//{ route, navigation }: Props
export default function AddLotScreen() {
  //const { tripId } = route.params;
  //const [lotNo] = useState(buildLotNo());
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({
    defaultValues: { species: '', weightKg: '', grade: '' },
    mode: 'onTouched',
  });

  const weightValue = watch('weightKg');
  const weightValid = useMemo(() => {
    const n = Number(weightValue);
    return !isNaN(n) && n > 0;
  }, [weightValue]);

  useEffect(() => {
    // auto-capture GPS on mount
    (async () => {
      setLocLoading(true);
      try {
        const ok = await ensureLocationPermission();
        if (!ok) {
          Alert.alert('Location needed', 'Please allow location to attach coordinates to the lot.');
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

  const pickPhoto = async () => {
    const res: ImagePickerResponse = await launchCamera({ mediaType: 'photo', quality: 0.7, includeBase64: false });
    if (res.didCancel) return;
    const uri = res.assets?.[0]?.uri;
    if (uri) setPhotoUri(uri);
  };

  const chooseFromGallery = async () => {
    const res: ImagePickerResponse = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (res.didCancel) return;
    const uri = res.assets?.[0]?.uri;
    if (uri) setPhotoUri(uri);
  };

  const onSubmit = (values: FormValues) => {
    if (!gps) {
      Alert.alert('Location required', 'Please capture location before saving.');
      return;
    }

    const lotDraft = {
      id: ulid(),
      //tripId,
     // lotNo,
      species: values.species.trim(),
      grade: values.grade.trim(),
      weightKg: Number(values.weightKg),
      capturedAt: new Date().toISOString(),
      gps,
      photoLocalPath: photoUri,
      _dirty: true,
    };

    // TODO: dispatch your Redux action to save locally + outbox enqueue
    // dispatch(createLotLocal(lotDraft));

    //onPress: () => navigation.goBack()
    Alert.alert('Saved', 'Lot saved offline and will sync when online.', [
      { text: 'OK',  },
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Add Lot</Text>

      {/* Read-only lot no and trip id */}
      <View style={styles.readonlyRow}>
        <Text style={styles.readonlyLabel}>Lot No</Text>
        {/* <Text style={styles.readonlyValue}>{lotNo}</Text> */}
      </View>
      <View style={styles.readonlyRow}>
        <Text style={styles.readonlyLabel}>Trip ID</Text>
        {/* <Text style={styles.readonlyValue}>{tripId}</Text> */}
      </View>

      {/* Species */}
      <View style={styles.field}> 
        <Text style={styles.label}>Species</Text>
        <Controller
          name="species"
          control={control}
          rules={{ required: 'Species is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.species && styles.inputError]}
              placeholder="e.g., Pomfrets"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholderTextColor={'#999999'}
            />
          )}
        />
        {errors.species && <Text style={styles.errorText}>{errors.species.message}</Text>}
      </View>

      {/* Weight */}
      <View style={styles.field}> 
        <Text style={styles.label}>Weight (kg)</Text>
        <Controller
          name="weightKg"
          control={control}
          rules={{ required: 'Weight is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.weightKg && styles.inputError]}
              placeholder="0.0"
              keyboardType="decimal-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholderTextColor={'#999999'}
            />
          )}
        />
        {!weightValid && weightValue?.length > 0 && (
          <Text style={styles.errorText}>Enter a number greater than 0</Text>
        )}
        {errors.weightKg && <Text style={styles.errorText}>{errors.weightKg.message}</Text>}
      </View>

        {/* grade */}
      <View style={styles.field}> 
        <Text style={styles.label}>Grade</Text>
        <Controller
          name="grade"
          control={control}
          rules={{ required: 'Grade is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.species && styles.inputError]}
              placeholder="A/B/C"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholderTextColor={'#999999'}
            />
          )}
        />
        {errors.grade && <Text style={styles.errorText}>{errors.grade.message}</Text>}
      </View>

      {/* GPS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        {gps ? (
          <Text style={styles.cardText}>Lat {gps.lat.toFixed(5)}, Lng {gps.lng.toFixed(5)}{gps.accuracy ? ` (±${Math.round(gps.accuracy)}m)` : ''}</Text>
        ) : (
          <Text style={styles.cardText}>No location yet</Text>
        )}
        <TouchableOpacity style={[styles.buttonSecondary, locLoading && styles.buttonDisabled]} onPress={recaptureLocation} disabled={locLoading}>
          <Text style={styles.buttonSecondaryText}>{locLoading ? 'Getting location…' : 'Capture/Refresh Location'}</Text>
        </TouchableOpacity>
      </View>

      {/* Photo (optional) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photo (optional)</Text>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <Text style={styles.cardText}>No photo added</Text>
        )}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.buttonSecondary} onPress={pickPhoto}>
            <Text style={styles.buttonSecondaryText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={chooseFromGallery}>
            <Text style={styles.buttonSecondaryText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.button, (!gps || !weightValid) && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={!gps || !weightValid}
      >
        <Text style={styles.buttonText}>Save Lot</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },

  readonlyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  readonlyLabel: { fontSize: 14, color: '#555' },
  readonlyValue: { fontSize: 14, fontWeight: '600' },

  field: { marginTop: 10 },
  label: { fontSize: 16, marginBottom: 6, color: '#222' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 12, height: 48, fontSize: 16 },
  inputError: { borderColor: '#d00' },
  errorText: { color: '#d00', marginTop: 6, fontSize: 12 },

  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginTop: 14, backgroundColor: '#fafafa' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  cardText: { fontSize: 14, color: '#333', marginBottom: 8 },

  photo: { width: '100%', height: 180, borderRadius: 10, marginBottom: 10, backgroundColor: '#ddd' },

  button: { backgroundColor: '#0A84FF', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 18, marginBottom: 35 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  buttonSecondary: { backgroundColor: '#EAF3FF', paddingHorizontal: 14, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonSecondaryText: { color: '#0A84FF', fontSize: 14, fontWeight: '600' },

  buttonDisabled: { opacity: 0.6 },
});