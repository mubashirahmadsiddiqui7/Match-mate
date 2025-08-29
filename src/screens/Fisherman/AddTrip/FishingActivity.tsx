/* eslint-disable react-native/no-inline-styles */
// src/screens/Fisherman/AddTrip/FishingActivity.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import {
  createFishingActivity,
  updateFishingActivity,
  getFishingActivityById,
  type CreateFishingActivityBody,
} from '../../../services/fishingActivity';
import { isOnline } from '../../../offline/net';
import { enqueueCreateActivity } from '../../../offline/TripQueues';

type Nav = NativeStackNavigationProp<
  FishermanStackParamList,
  'FishingActivity'
>;
type R = RouteProp<FishermanStackParamList, 'FishingActivity'>;

type ActivityMeta = {
  id: number | string; // trip DB id
  captain?: string | null;
  boat?: string | null;
  trip_id?: string | number; // pretty code for display
};

const MESH_INCHES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

type FormValues = {
  activityNo: number;
  mesh?: (typeof MESH_INCHES)[number] | null;
  netLen?: string;
  netWid?: string;
  netting?: Date | null;
  hauling?: Date | null;
};

function fmt24h(d: Date | null): string | null {
  if (!d) return null;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function parseHHMM(t?: string | null): Date | null {
  if (!t) return null;
  const [h, m] = t.split(':').map(n => Number(n));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export default function FishingActivity() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();

  const {
    mode = 'create',
    activityId,
    tripId: tripIdParam,
    activityNo: activityNoParam,
    meta,
    prefill,
  } = route.params ?? {};

  const displayTripCode = String(meta?.trip_id ?? tripIdParam ?? '');
  const tripPkForApi = meta?.id;
  const initialActivity = activityNoParam ?? 1;

  const { gps, loading: gpsLoading, recapture } = useCurrentLocation();

  const { watch, setValue, getValues, reset } = useForm<FormValues>({
    mode: 'onTouched',
    defaultValues: {
      activityNo: initialActivity,
      mesh: null,
      netLen: '',
      netWid: '',
      netting: null,
      hauling: null,
    },
  });

  const existingGpsRef = useRef<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [loadingExisting, setLoadingExisting] = useState<boolean>(
    mode === 'edit',
  );

  // ---- Prefill for EDIT ----
  useEffect(() => {
    let cancelled = false;

    async function loadExisting() {
      try {
        setLoadingExisting(true);

        // show instantaneous prefill if caller passed it
        if (prefill && typeof prefill === 'object') {
          safeApplyPrefill(prefill);
        }

        if (activityId != null) {
          const a = await getFishingActivityById(activityId);
          if (!cancelled) safeApplyPrefill(a);
        }
      } catch (e: any) {
        if (!cancelled)
          Alert.alert('Failed', e?.message || 'Unable to load activity.');
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    }

    if (mode === 'edit') loadExisting();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activityId]);

  function safeApplyPrefill(a: any) {
    // These keys should exist on your adapted DTO (adjust if your adapter names differ)
    const activity_number =
      Number(a?.activity_number ?? a?.activityNo ?? initialActivity) ||
      initialActivity;
    const mesh_size = a?.mesh_size ?? a?.mesh;
    const net_length = a?.net_length ?? a?.netLen;
    const net_width = a?.net_width ?? a?.netWid;
    const time_of_netting = a?.time_of_netting ?? a?.netting;
    const time_of_hauling = a?.time_of_hauling ?? a?.hauling;

    reset({
      activityNo: activity_number,
      mesh: (mesh_size as any) ?? null,
      netLen: net_length != null ? String(net_length) : '',
      netWid: net_width != null ? String(net_width) : '',
      netting: parseHHMM(String(time_of_netting ?? '')),
      hauling: parseHHMM(String(time_of_hauling ?? '')),
    });

    const lat = a?.gps_latitude ?? a?.lat ?? null;
    const lng = a?.gps_longitude ?? a?.lng ?? null;
    existingGpsRef.current = {
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
    };
  }

  const [submitting, setSubmitting] = useState(false);
  const [showNetting, setShowNetting] = useState(false);
  const [showHauling, setShowHauling] = useState(false);

  const header = useMemo(
    () =>
      mode === 'edit' ? 'Edit Fishing Activity' : 'Create Fishing Activity',
    [mode],
  );

  function onPickTime(
    kind: 'netting' | 'hauling',
    e: DateTimePickerEvent,
    d?: Date,
  ) {
    if (Platform.OS === 'android') {
      setTimeout(
        () =>
          kind === 'netting' ? setShowNetting(false) : setShowHauling(false),
        0,
      );
    }
    if (e.type === 'dismissed') return;
    setValue(kind, d ?? null, { shouldDirty: true, shouldTouch: true });
  }

  function validate(): string | null {
    if (tripPkForApi == null || tripPkForApi === '') return 'Trip is missing.';
    const aNo = Number(getValues('activityNo'));
    if (!Number.isInteger(aNo) || aNo < 1 || aNo > 20)
      return 'Activity Number must be between 1 and 20.';
    if (!getValues('netting')) return 'Please set Netting Time.';
    if (!getValues('hauling')) return 'Please set Hauling Time.';

    // GPS: allow saved coordinates in edit mode
    const hasNewGps = !!gps;
    const hasOldGps =
      !!existingGpsRef.current.lat && !!existingGpsRef.current.lng;
    if (!hasNewGps && !hasOldGps)
      return 'Please enable GPS and wait for coordinates.';
    return null;
  }

  async function onSubmit() {
    const online = await isOnline();

    const err = validate();
    if (err) {
      Alert.alert('Missing info', err);
      return;
    }

    try {
      setSubmitting(true);

      const lat = gps?.lat ?? existingGpsRef.current.lat ?? null;
      const lng = gps?.lng ?? existingGpsRef.current.lng ?? null;

      const body: CreateFishingActivityBody & { trip_code?: string | number } =
        {
          trip_id:
            typeof tripPkForApi === 'string'
              ? Number(tripPkForApi) || tripPkForApi
              : tripPkForApi,
          trip_code: displayTripCode,
          activity_number: Number(getValues('activityNo')),
          time_of_netting: fmt24h(getValues('netting')),
          time_of_hauling: fmt24h(getValues('hauling')),
          mesh_size: (getValues('mesh') as any) ?? null,
          net_length: getValues('netLen') ? Number(getValues('netLen')) : null,
          net_width: getValues('netWid') ? Number(getValues('netWid')) : null,
          gps_latitude: lat != null ? Number(lat) : null,
          gps_longitude: lng != null ? Number(lng) : null,
        };
      if (!online) {
        // If meta.id is string => could be a localId of trip; pass as dependency
        const tripServerId =
          typeof tripPkForApi === 'number' ? tripPkForApi : undefined;
        const tripLocalId =
          typeof tripPkForApi === 'string' ? String(tripPkForApi) : undefined;

        const job = await enqueueCreateActivity(body as any, {
          tripServerId,
          tripLocalId,
        });

        Toast.show({
          type: 'success',
          text1: 'Saved Offline 🎉',
          text2: 'Activity will sync when online.',
          position: 'top',
        });

        // Navigate to details with a local fallback
        navigation.replace('FishingActivityDetails', {
          activityId: job.localId, // local placeholder id
          fallback: {
            id: job.localId,
            activity_id: `ACT-${job.localId.slice(-6).toUpperCase()}`,
            activity_number: body.activity_number,
            time_of_netting: body.time_of_netting,
            time_of_hauling: body.time_of_hauling,
            mesh_size: body.mesh_size,
            net_length: body.net_length,
            net_width: body.net_width,
            gps_latitude: body.gps_latitude,
            gps_longitude: body.gps_longitude,
            trip_id: body.trip_code ?? displayTripCode,
            status: 'pending-sync',
            status_label: 'Pending Sync',
            trip_pk: tripServerId ?? undefined,
          },
          tripId: displayTripCode,
        });

        return;
      }

      if (mode === 'edit' && activityId != null) {
        const updated = await updateFishingActivity(activityId, body);
        Toast.show({
          type: 'success',
          text1: 'Updated ✅',
          text2: 'Fishing activity updated successfully.',
          position: 'top',
          visibilityTime: 2500,
        });
        navigation.replace('FishingActivityDetails', {
          activityId,
          fallback: updated?.data ?? updated,
          tripId: displayTripCode,
        });
      } else {
        const created = await createFishingActivity(body);
        Toast.show({
          type: 'success',
          text1: 'Saved 🎉',
          text2: 'Fishing activity recorded successfully.',
          position: 'top',
          visibilityTime: 2500,
        });
        const newId = created?.data?.id ?? created?.id ?? created?.activity?.id;
        navigation.replace('FishingActivityDetails', {
          activityId: newId,
          fallback: created?.data ?? created,
          tripId: displayTripCode,
        });
      }
    } catch (e: any) {
      Alert.alert(
        'Failed',
        e?.message ||
          (mode === 'edit'
            ? 'Unable to update activity.'
            : 'Unable to create activity.'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------ UI ------------ */

  const netting = watch('netting');
  const hauling = watch('hauling');
  const mesh = watch('mesh');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Top bar */}
      <View style={s.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={s.iconBtn}
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>{header}</Text>
      </View>

      {loadingExisting ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: '#475569' }}>
            Loading activity…
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
          {/* Selected Trip */}
          <View style={[s.card, { backgroundColor: '#E9F5FF' }]}>
            <Text style={[s.cardTitle, { color: '#0F172A' }]}>
              Selected Trip Information
            </Text>
            <View style={s.rowBetween}>
              <KV label="Trip ID" value={displayTripCode} />
              <KV
                label="Boat "
                value={meta?.boat ? String(meta.boat) : 'N/A'}
              />
              <KV
                label="Captain"
                value={meta?.captain ? String(meta.captain) : 'N/A'}
              />
            </View>
            <View>
              <Text
                style={{
                  color: '#64748B',
                  alignSelf: 'center',
                  fontSize: 12,
                  paddingBottom: 5,
                }}
              >
                Status
              </Text>
              <Badge text="Active" />
            </View>

            {!!meta?.id && (
              <Text style={{ marginTop: 6, fontSize: 11, color: '#64748B' }}>
                Internal ID: {String(meta.id)}
              </Text>
            )}
          </View>

          {/* Basic Activity */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Basic Activity Information</Text>
            <View style={s.col}>
              <Text style={s.label}>Activity Number *</Text>
              <TextInput
                value={String(watch('activityNo'))}
                editable={false}
                style={[s.input, { backgroundColor: '#F1F5F9' }]}
              />
              <Text style={s.hint}>
                Auto-increment for create. Non-editable here.
              </Text>
            </View>
          </View>

          {/* Timing */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Fishing Timing Information</Text>

            <View style={s.duo}>
              <View style={s.duoItem}>
                <Text style={s.label}>Netting Time *</Text>
                <Pressable style={s.input} onPress={() => setShowNetting(true)}>
                  <Text style={s.inputText}>
                    {netting ? netting.toLocaleTimeString() : 'Select time'}
                  </Text>
                </Pressable>
                {showNetting && (
                  <DateTimePicker
                    value={netting ?? new Date()}
                    onChange={(e, d) => onPickTime('netting', e, d!)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    is24Hour={false}
                  />
                )}
                <Text style={s.hint}>
                  Time when netting started (24-hour format sent to server).
                </Text>
              </View>

              <View style={s.duoItem}>
                <Text style={s.label}>Hauling Time *</Text>
                <Pressable style={s.input} onPress={() => setShowHauling(true)}>
                  <Text style={s.inputText}>
                    {hauling ? hauling.toLocaleTimeString() : 'Select time'}
                  </Text>
                </Pressable>
                {showHauling && (
                  <DateTimePicker
                    value={hauling ?? new Date()}
                    onChange={(e, d) => onPickTime('hauling', e, d!)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    is24Hour={false}
                  />
                )}
                <Text style={s.hint}>
                  Time when hauling finished (24-hour format sent to server).
                </Text>
              </View>
            </View>
          </View>

          {/* Net Specs */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Net Specifications</Text>

            <Text style={s.label}>Mesh Size (inches)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MESH_INCHES.map(v => {
                const sel = mesh === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => setValue('mesh', v)}
                    style={[
                      s.pill,
                      sel && {
                        backgroundColor: '#14532D',
                        borderColor: '#14532D',
                      },
                    ]}
                  >
                    <Text style={[s.pillText, sel && { color: '#fff' }]}>
                      {v}"
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={s.duo}>
              <View style={s.duoItem}>
                <Text style={s.label}>Net Length (meters)</Text>
                <TextInput
                  value={watch('netLen') ?? ''}
                  onChangeText={t =>
                    setValue('netLen', t.replace(/[^0-9.]/g, ''))
                  }
                  keyboardType="decimal-pad"
                  placeholder="e.g., 100.5"
                  placeholderTextColor={'#94A3B8'}
                  style={s.input}
                />
              </View>
              <View style={s.duoItem}>
                <Text style={s.label}>Net Width (meters)</Text>
                <TextInput
                  value={watch('netWid') ?? ''}
                  onChangeText={t =>
                    setValue('netWid', t.replace(/[^0-9.]/g, ''))
                  }
                  keyboardType="decimal-pad"
                  placeholderTextColor={'#94A3B8'}
                  placeholder="e.g., 8"
                  style={s.input}
                />
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Location Information</Text>
            <View style={s.duo}>
              <View style={s.duoItem}>
                <Text style={s.label}>Latitude *</Text>
                <TextInput
                  editable={false}
                  value={
                    gpsLoading
                      ? 'Locating…'
                      : gps
                      ? String(gps.lat.toFixed(6))
                      : existingGpsRef.current.lat != null
                      ? String(existingGpsRef.current.lat?.toFixed(6))
                      : 'Not captured'
                  }
                  style={[s.input, { backgroundColor: '#F1F5F9' }]}
                />
              </View>
              <View style={s.duoItem}>
                <Text style={s.label}>Longitude *</Text>
                <TextInput
                  editable={false}
                  value={
                    gpsLoading
                      ? 'Locating…'
                      : gps
                      ? String(gps.lng.toFixed(6))
                      : existingGpsRef.current.lng != null
                      ? String(existingGpsRef.current.lng?.toFixed(6))
                      : 'Not captured'
                  }
                  style={[s.input, { backgroundColor: '#F1F5F9' }]}
                />
              </View>
            </View>

            <Pressable onPress={recapture} style={s.secondaryBtn}>
              <Text style={s.secondaryBtnText}>
                {mode === 'edit'
                  ? 'Re-capture GPS (optional)'
                  : 'Auto-fill GPS Coordinates'}
              </Text>
            </Pressable>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              disabled={submitting || gpsLoading}
              onPress={onSubmit}
              style={[
                s.primaryBtn,
                (submitting || gpsLoading) && { opacity: 0.7 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons
                    name={mode === 'edit' ? 'save' : 'save'}
                    size={18}
                    color="#fff"
                  />
                  <Text style={s.primaryBtnText}>
                    {mode === 'edit'
                      ? 'Update Fishing Activity'
                      : 'Create Fishing Activity'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ---- small atoms ---- */
function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginRight: 16 }}>
      <Text style={{ fontSize: 12, color: '#64748B' }}>{label}</Text>
      <Text style={{ fontWeight: '700', color: '#0F172A' }}>{value}</Text>
    </View>
  );
}
function Badge({ text }: { text: string }) {
  return (
    <View
      style={{
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        alignItems: 'center',
        margin: 'auto',
      }}
    >
      <Text style={{ color: '#166534', fontWeight: '700', fontSize: 15 }}>
        {text}
      </Text>
    </View>
  );
}

/* ---- styles ---- */
const s = StyleSheet.create({
  header: {
    backgroundColor: '#1B5E20',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: { padding: 8, borderRadius: 999 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { fontWeight: '800', color: '#0F172A', marginBottom: 10 },

  label: { fontSize: 12, color: '#475569', marginBottom: 6 },
  hint: { fontSize: 11, color: '#6B7280', marginTop: 6 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  inputText: { color: '#0F172A' },

  pill: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillText: { color: '#0F172A', fontWeight: '700', fontSize: 12 },

  col: { marginBottom: 8 },
  duo: { flexDirection: 'row', gap: 12 },
  duoItem: { flex: 1 },

  secondaryBtn: {
    marginTop: 10,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#0F172A', fontWeight: '700' },

  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
