// src/screens/Fisherman/AddTrip/FishingActivity.tsx
/* eslint-disable react-native/no-inline-styles */
import React, { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {  useFieldArray, useForm } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useCurrentLocation } from './hooks/useCurrentLocation';
import { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';
import { buildLotNo } from '../../../utils/ids';
import { createLot } from '../../../services/lots';
import { completeTrip } from '../../../services/trips';


type Nav = NativeStackNavigationProp<FishermanStackParamList, 'FishingActivity'>;
type R = RouteProp<FishermanStackParamList, 'FishingActivity'>;

const MESH_INCHES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** If the screen receives boatType (optional), we fix the gear accordingly. */
function gearFromBoatType(boatType?: string) {
  if (!boatType) return undefined;
  const t = boatType.toLowerCase();
  if (t.includes('trawl')) return 'Trawl';
  if (t.includes('gill')) return 'Gillnet';
  return undefined;
}

type CatchRow = { species: string; weightKg: string; lotNo: string };
type DiscardRow = { species: string; weightKg: string };

type FormValues = {
  activityNo?: number;
  // meta
  gear?: string; // fixed from boat type if provided
  meshInch?: number;
  netLengthM?: string;
  netWidthM?: string;
  timeNetting?: string; // "HH:MM"
  timeHauling?: string; // "HH:MM"
  // dynamic arrays
  catches: CatchRow[];
  discards: DiscardRow[];
};

export default function FishingActivity() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const tripId = (params as any).tripId as number | string;
  const activityNo = (params as any).activityNo as number | undefined;
  const boatType = (params as any).boatType as string | undefined; // optional: if provided from previous screen

  const fixedGear = gearFromBoatType(boatType);

  const { gps, loading: gpsLoading, recapture } = useCurrentLocation();

  const methods = useForm<FormValues>({
    defaultValues: {
      activityNo: activityNo ?? 1,
      gear: fixedGear, // stays read-only if provided
      meshInch: 4 as any,
      netLengthM: '',
      netWidthM: '',
      timeNetting: '',
      timeHauling: '',
      catches: [{ species: '', weightKg: '', lotNo: buildLotNo() }],
      discards: [],
    },
    mode: 'onTouched',
  });

  const { control, watch, setValue } = methods;

  const catchesFA = useFieldArray({ control, name: 'catches' });
  const discardsFA = useFieldArray({ control, name: 'discards' });

  const [saving, setSaving] = useState(false);

  const headerTitle = useMemo(
    () => `Fishing Activity ${watch('activityNo') ?? 1}`,
    [watch],
  );

  const onAddCatch = useCallback(() => {
    catchesFA.append({ species: '', weightKg: '', lotNo: buildLotNo() });
  }, [catchesFA]);

  const onAddDiscard = useCallback(() => {
    discardsFA.append({ species: '', weightKg: '' });
  }, [discardsFA]);

  const removeCatch = (idx: number) => catchesFA.remove(idx);
  const removeDiscard = (idx: number) => discardsFA.remove(idx);

  const validateForm = (): string | null => {
    if (!tripId) return 'Trip ID missing.';
    if (!gps) return 'Please capture GPS before saving.';
    const catches = watch('catches') || [];
    if (catches.length === 0) return 'Add at least one species entry.';
    for (const c of catches) {
      if (!c.species.trim() || Number(c.weightKg) <= 0) {
        return 'Each species must have a name and weight > 0.';
      }
    }
    // basic time checks (optional)
    const tNet = watch('timeNetting')?.trim();
    const tHaul = watch('timeHauling')?.trim();
    if (!tNet || !tHaul) return 'Please enter Time of Netting and Time of Hauling.';
    return null;
  };

  /** Saves all lots for the activity (one lot per species row) */
  const saveActivity = async () => {
    const err = validateForm();
    if (err) {
      Alert.alert('Missing info', err);
      return false;
    }
    try {
      setSaving(true);

      const nowIso = new Date().toISOString();
      const mesh = watch('meshInch');
      const netLength = watch('netLengthM');
      const netWidth = watch('netWidthM');
      const timeNetting = watch('timeNetting');
      const timeHauling = watch('timeHauling');
      const gear = fixedGear ?? watch('gear');

      // Save each species row as a lot
      const rows = watch('catches') || [];
      for (const row of rows) {
        const body = {
          lot_no: row.lotNo, // pre-generated per row
          trip_id: typeof tripId === 'string' ? Number(tripId) : (tripId as number),
          species: row.species.trim(),
          weight_kg: Number(row.weightKg),
          grade: '', // not used anymore per new flow
          gps_latitude: gps?.lat,
          gps_longitude: gps?.lng,
          captured_at: nowIso,
          // Embed activity meta for server auditors (if no activity table yet)
          meta: {
            activity_no: watch('activityNo') ?? 1,
            time_of_netting: timeNetting,
            time_of_hauling: timeHauling,
            gear,
            mesh_inch: mesh,
            net_length_m: netLength ? Number(netLength) : null,
            net_width_m: netWidth ? Number(netWidth) : null,
          },
        } as const;

        await createLot(body as any);
      }

      // If you need to save discards too, either:
      // 1) Call a dedicated endpoint (preferred), or
      // 2) Add a special lot with species="DISCARD:<name>" — not recommended long-term.
      // For now we only validate and keep them in the form; wire your backend when ready.

      Alert.alert('Saved', 'Fishing activity recorded.');
      return true;
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not save activity.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    const ok = await saveActivity();
    if (!ok) return;
    // Return to activity hub or stay—up to you.
    // Here: stay on this screen (so user can decide next step).
  };

  const onSaveAndAddAnother = async () => {
    const ok = await saveActivity();
    if (!ok) return;
    const next = (watch('activityNo') ?? 1) + 1;
    navigation.replace('FishingActivity', { tripId, activityNo: next, boatType });
  };

  const onCloseTrip = async () => {
    try {
      setSaving(true);
      // Ask landing port here if needed; for now, send a minimal close.
      await completeTrip(tripId, {
        arrival_port: 'Karachi Fish Harbour', // TODO: choose dynamically
        arrival_notes: `Closed after activity #${watch('activityNo') ?? 1}`,
      });
      Alert.alert('Trip Closed', 'Trip has been marked completed.', [
        { text: 'OK', onPress: () => navigation.navigate('FishermanHome') },
      ]);
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not close trip.');
    } finally {
      setSaving(false);
    }
  };

  const renderRow = (idx: number, kind: 'catch' | 'discard') => {
    const baseName = kind === 'catch' ? `catches.${idx}` : `discards.${idx}`;
    const lotNo = kind === 'catch' ? (watch(`catches.${idx}.lotNo`) as string) : undefined;
    return (
      <View key={`${kind}-${idx}`} style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{kind === 'catch' ? 'Species' : 'Discard Species'}</Text>
          <TextInput
            value={watch(`${baseName}.species`) as unknown as string}
            onChangeText={t => setValue(`${baseName}.species` as any, t)}
            placeholder="e.g., Tuna"
            style={styles.input}
          />
        </View>
        <View style={{ width: 110, marginLeft: 8 }}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            value={watch(`${baseName}.weightKg`) as unknown as string}
            onChangeText={t =>
              setValue(`${baseName}.weightKg` as any, t.replace(/[^0-9.]/g, ''))
            }
            keyboardType="numeric"
            placeholder="0.0"
            style={styles.input}
          />
        </View>
        <Pressable
          onPress={() => (kind === 'catch' ? removeCatch(idx) : removeDiscard(idx))}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.8 }]}
          accessibilityLabel="Remove row"
        >
          <Icon name="delete" size={18} color="#B91C1C" />
        </Pressable>
        {kind === 'catch' && (
          <View style={{ width: '100%', marginTop: 6 }}>
            <Text style={styles.hint}>Lot No: {lotNo}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.hero}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.heroTitle}>{headerTitle}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        {/* Auto date/time and GPS summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Auto Capture</Text>
          <Text style={styles.hint}>
            Date/Time: {new Date().toLocaleString()}
          </Text>
          <Text style={styles.hint}>
            GPS:{' '}
            {gpsLoading
              ? 'Locating…'
              : gps
              ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`
              : 'Not captured'}
          </Text>
          <Pressable
            onPress={recapture}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.secondaryBtnText}>Recapture GPS</Text>
          </Pressable>
        </View>

        {/* Activity details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activity Details</Text>

          {/* Gear */}
          <Text style={styles.label}>Gear</Text>
          <TextInput
            value={fixedGear ?? (watch('gear') as string)}
            onChangeText={t => setValue('gear', t)}
            editable={!fixedGear}
            placeholder={fixedGear ? 'Fixed from boat' : 'Gillnet / Trawl'}
            style={[styles.input, fixedGear && { backgroundColor: '#F3F4F6' }]}
          />

          {/* Mesh size */}
          <Text style={[styles.label, { marginTop: 12 }]}>Mesh Size (inch)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row' }}>
              {MESH_INCHES.map(inch => {
                const sel = watch('meshInch') === inch;
                return (
                  <Pressable
                    key={inch}
                    onPress={() => setValue('meshInch', inch as any)}
                    style={[
                      styles.pill,
                      sel && { backgroundColor: '#1f720d' },
                    ]}
                  >
                    <Text style={[styles.pillText, sel && { color: '#fff' }]}>
                      {inch}"
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Net dimensions */}
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Net Length (m)</Text>
              <TextInput
                value={watch('netLengthM')}
                onChangeText={t => setValue('netLengthM', t.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                placeholder="e.g., 120"
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Net Width (m)</Text>
              <TextInput
                value={watch('netWidthM')}
                onChangeText={t => setValue('netWidthM', t.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                placeholder="e.g., 8"
                style={styles.input}
              />
            </View>
          </View>

          {/* Times */}
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Time of Netting</Text>
              <TextInput
                value={watch('timeNetting')}
                onChangeText={t => setValue('timeNetting', t)}
                placeholder="HH:MM"
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Time of Hauling</Text>
              <TextInput
                value={watch('timeHauling')}
                onChangeText={t => setValue('timeHauling', t)}
                placeholder="HH:MM"
                style={styles.input}
              />
            </View>
          </View>
        </View>

        {/* Catch (lots) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Catch (Lots per Species)</Text>

          {catchesFA.fields.map((f, i) => renderRow(i, 'catch'))}

          <Pressable
            onPress={onAddCatch}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
          >
            <Icon name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Species</Text>
          </Pressable>
        </View>

        {/* Discards */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Discards (Optional)</Text>

          {discardsFA.fields.map((f, i) => renderRow(i, 'discard'))}

          <Pressable
            onPress={onAddDiscard}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.secondaryBtnText}>Add Discard</Text>
          </Pressable>
        </View>

        {/* Actions */}
        <View style={{ height: 8 }} />
        <Pressable
          disabled={saving || gpsLoading}
          onPress={onSave}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.95 },
            (saving || gpsLoading) && { opacity: 0.7 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="save" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Save Activity</Text>
            </>
          )}
        </Pressable>

        <View style={{ height: 8 }} />

        <Pressable
          disabled={saving || gpsLoading}
          onPress={onSaveAndAddAnother}
          style={({ pressed }) => [
            styles.primaryHollowBtn,
            pressed && { opacity: 0.95 },
            (saving || gpsLoading) && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.primaryHollowBtnText}>Save & Add Another</Text>
        </Pressable>

        <View style={{ height: 16 }} />

        <Pressable
          disabled={saving}
          onPress={onCloseTrip}
          style={({ pressed }) => [
            styles.dangerBtn,
            pressed && { opacity: 0.95 },
            saving && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.dangerBtnText}>Close Trip</Text>
        </Pressable>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#1f720d',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
    borderRadius: 22,
    marginRight: 8,
  },
  heroTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    color: '#111827',
  },
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  iconBtn: {
    height: 36,
    width: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 18,
    backgroundColor: '#FEF2F2',
  },
  pill: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  pillText: {
    color: '#111827',
    fontSize: 12,
  },
  addBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1f720d',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  secondaryBtn: {
    marginTop: 10,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  secondaryBtnText: { color: '#111827', fontWeight: '600' },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1f720d',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  primaryHollowBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1f720d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryHollowBtnText: { color: '#1f720d', fontWeight: '700' },
  dangerBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtnText: { color: '#fff', fontWeight: '700' },
});
