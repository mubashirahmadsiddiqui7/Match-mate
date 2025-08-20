// src/screens/Fisherman/TripDetails/TripDetailsScreen.tsx
/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  StatusBar,
  Platform,
  ToastAndroid,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {
  getTripById,
  deleteTrip,
  type TripDetails,
  startTrip,
  completeTrip,
  cancelTrip,
} from '../../../services/trips';
import { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';
import PALETTE from '../../../theme/palette';
import { CancelTripModal, CompleteTripModal, type CompleteForm } from './TripActionModals';

/* ---------- constants ---------- */
const PRIMARY = PALETTE.green700;
const DANGER = PALETTE.error;

const STATUS_COLORS: Record<NonNullable<TripDetails['status']>, string> = {
  pending: PALETTE.warn,
  approved: PALETTE.info,
  active: PALETTE.purple,
  completed: PALETTE.green600,
  cancelled: PALETTE.error,
};

/* ---------- utils ---------- */
function shadow(opacity: number, radius: number, height: number) {
  if (Platform.OS === 'android') return { elevation: 2 };
  return {
    shadowColor: '#000',
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height },
  };
}
function n(v?: number | string | null) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}
function currency(v?: number | string | null) {
  if (v === null || v === undefined || v === '') return '—';
  const num = Number(v);
  if (Number.isNaN(num)) return '—';
  return num.toFixed(2);
}
function toTitle(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function toast(msg: string) {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert(msg);
}

/* ---------- screen ---------- */
export default function TripDetailsScreen() {
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<FishermanStackParamList, 'TripDetails'>>();

  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTripById(params.id);
      setTrip(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load trip');
      // @ts-ignore
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [params.id, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  // also refresh whenever screen regains focus (after actions)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const isPending  = trip?.status === 'pending';
  const isApproved = trip?.status === 'approved';
  const isActive   = trip?.status === 'active';
  const statusColor = trip ? STATUS_COLORS[trip.status] : PALETTE.text700;

  const reload = useCallback(async () => {
    try {
      const fresh = await getTripById(params.id);
      setTrip(fresh);
    } catch {
      // ignore
    }
  }, [params.id]);

  /* ---------- actions ---------- */
  const handleStart = useCallback(async () => {
    if (!trip) return;
    try {
      setActionLoading(true);
      await startTrip(trip.id);
      Alert.alert('Trip Started', 'Status updated to Active.');
      await reload();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  }, [trip, reload]);

  const handleCancel = useCallback(async (reason: string) => {
    if (!trip) return;
    try {
      setActionLoading(true);
      await cancelTrip(trip.id, { cancellation_reason: reason });
      Alert.alert('Trip Cancelled', 'Status updated to Cancelled.');
      setShowCancel(false);
      await reload();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to cancel trip');
    } finally {
      setActionLoading(false);
    }
  }, [trip, reload]);

  const handleComplete = useCallback(async (form: CompleteForm) => {
    if (!trip) return;
    try {
      setActionLoading(true);
      await completeTrip(trip.id, {
        arrival_port: form.arrival_port.trim(),
        arrival_notes: form.arrival_notes?.trim() || undefined,
        estimated_catch_weight: form.estimated_catch_weight ? Number(form.estimated_catch_weight) : undefined,
        catch_notes: form.catch_notes?.trim() || undefined,
        revenue: form.revenue ? Number(form.revenue) : undefined,
        arrival_latitude: form.arrival_latitude ? Number(form.arrival_latitude) : undefined,
        arrival_longitude: form.arrival_longitude ? Number(form.arrival_longitude) : undefined,
      });
      Alert.alert('Trip Completed', 'Status updated to Completed.');
      setShowComplete(false);
      await reload();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  }, [trip, reload]);

  const handleDelete = useCallback(() => {
    if (!trip) return;
    Alert.alert(
      'Delete Trip',
      `Delete "${trip.trip_name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteTrip(trip.id);
              // back to list (let that screen refresh on focus)
              // @ts-ignore
              navigation.navigate('AllTrip', { refresh: true });
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete trip');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [trip, navigation]);

  const handleEditPress = useCallback(() => {
    if (!trip) return;
    if (!isPending) {
      toast('Only pending trips can be edited');
      return;
    }
    // @ts-ignore
    navigation.navigate('Trip', { id: trip.id, mode: 'edit' });
  }, [navigation, trip, isPending]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  if (!trip) return null;

  /* ---------- Actions Bar by status ---------- */
  function ActionsBar() {
    if (!trip) return null;

    if (isApproved) {
      return (
        <Pressable
          style={[styles.bigBtn, actionLoading && { opacity: 0.5 }]}
          onPress={handleStart}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="play-circle-filled" size={22} color="#fff" />
              <Text style={styles.bigBtnText}>Start Trip</Text>
            </>
          )}
        </Pressable>
      );
    }

    if (isActive) {
      return (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            style={[styles.halfBtn, { backgroundColor: DANGER }, actionLoading && { opacity: 0.6 }]}
            onPress={() => setShowCancel(true)}
            disabled={actionLoading}
          >
            <MaterialIcons name="cancel" size={18} color="#fff" />
            <Text style={styles.halfBtnText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[styles.halfBtn, { backgroundColor: PRIMARY }, actionLoading && { opacity: 0.6 }]}
            onPress={() => setShowComplete(true)}
            disabled={actionLoading}
          >
            <MaterialIcons name="check-circle" size={18} color="#fff" />
            <Text style={styles.halfBtnText}>Complete</Text>
          </Pressable>
        </View>
      );
    }

    // pending/completed/cancelled → no state buttons here
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{trip.trip_name}</Text>

          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {toTitle(trip.status)}
            </Text>
          </View>

          {trip.trip_type ? <Text style={styles.subtitle}>{trip.trip_type}</Text> : null}
        </View>

        {/* Pending-only header actions */}
        {isPending ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={handleEditPress}
              style={styles.headerBtn}
              accessibilityLabel="Edit trip"
            >
              <MaterialIcons name="edit" size={16} color={PRIMARY} />
              <Text style={styles.headerBtnText}>Edit</Text>
            </Pressable>

            <Pressable
              disabled={deleting}
              onPress={handleDelete}
              style={styles.headerBtnDanger}
              accessibilityLabel="Delete trip"
            >
              <MaterialIcons name="delete" size={16} color="#fff" />
              <Text style={styles.headerBtnDangerText}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Quick info strip */}
      <View style={[styles.quickStrip, shadow(0.05, 8, 3)]}>
        <View style={styles.quickItem}>
          <MaterialIcons name="schedule" size={16} color={PALETTE.text600} />
        <Text style={styles.quickText}>{trip.departure_time || 'Time not set'}</Text>
        </View>
        <View style={styles.quickDivider} />
        <View style={styles.quickItem}>
          <MaterialIcons name="place" size={16} color={PALETTE.text600} />
          <Text style={styles.quickText}>
            {trip.departure_port || trip.port_location || 'Port not set'}
          </Text>
        </View>
      </View>

      {/* Actions bar (approved/active) */}
      <View style={{ paddingHorizontal: 14, paddingTop: 10 }}>
        <ActionsBar />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {/* Basic Trip Information */}
        <Section title="Basic Trip Information" icon="assignment">
          <Row icon="person" label="Fisherman" value={trip.fisherman?.name} />
          <Row icon="category" label="Trip Type" value={trip.trip_type} />
          <Row icon="sailing" label="Boat Reg. No." value={trip.boat_registration_no} />
          <Row icon="directions-boat" label="Boat Name" value={trip.boat_name} />
        </Section>

        {/* Location & Schedule */}
        <Section title="Location & Schedule" icon="map">
          <Row icon="directions-boat" label="Departure Port" value={trip.departure_port} />
          <Row icon="schedule" label="Departure Time" value={trip.departure_time} />
          <Row icon="public" label="Fishing Zone" value={trip.fishing_zone} />
          <Row icon="place" label="Port Location" value={trip.port_location} />
          <Row icon="my-location" label="Departure Lat" value={String(trip.departure_lat ?? '—')} />
          <Row icon="my-location" label="Departure Lng" value={String(trip.departure_lng ?? '—')} />
        </Section>

        {/* Safety & Weather */}
        <Section title="Safety & Weather" icon="health-and-safety">
          <Row icon="groups" label="Crew Count" value={n(trip.crew_count)} />
          <Row icon="contacts" label="Emergency Contact" value={trip.emergency_contact} />
          <Row icon="medical-services" label="Safety Equipment" value={trip.safety_equipment} />
          <Row icon="cloud" label="Weather" value={trip.weather} />
          <Row icon="waves" label="Sea Conditions" value={trip.sea_conditions} />
          <Row icon="air" label="Wind Speed" value={n(trip.wind_speed)} />
          <Row icon="opacity" label="Wave Height" value={n(trip.wave_height)} />
        </Section>

        {/* Fishing & Costs */}
        <Section title="Fishing & Costs" icon="attach-money">
          <Row icon="restaurant" label="Target Species" value={trip.target_species} />
          <Row icon="scale" label="Estimated Catch (kg)" value={n(trip.estimated_catch)} />
          <Row icon="local-gas-station" label="Fuel Cost" value={currency(trip.fuel_cost)} />
          <Row icon="build" label="Operational Cost" value={currency(trip.operational_cost)} />
          <Row icon="summarize" label="Total Cost" value={currency(trip.total_cost)} />
        </Section>

        {/* Notes */}
        <Section title="Notes" icon="sticky-note-2">
          <Row value={(trip as any).notes ?? (trip as any).trip_purpose ?? '—'} />
        </Section>

        {/* Fish Lots */}
        <Section title="Fish Lots" icon="inventory-2">
          {trip.lots?.length ? (
            <View style={{ gap: 8 }}>
              {trip.lots.map(l => (
                <View key={String(l.id)} style={styles.lotRow}>
                  <MaterialIcons name="chevron-right" size={18} color={PALETTE.text700} />
                  <Text style={styles.lotText}>
                    Lot #{l.id} — {toTitle(l.status)}
                    {l.lot_no ? `  (${l.lot_no})` : ''}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>—</Text>
          )}
        </Section>
      </ScrollView>

      {/* Modals */}
      <CancelTripModal
        visible={showCancel}
        loading={actionLoading}
        onClose={() => setShowCancel(false)}
        onSubmit={handleCancel}
      />
      <CompleteTripModal
        visible={showComplete}
        loading={actionLoading}
        onClose={() => setShowComplete(false)}
        onSubmit={handleComplete}
      />
    </SafeAreaView>
  );
}

/* ---------- presentational pieces ---------- */
function Section({
  title,
  icon = 'info',
  children,
}: React.PropsWithChildren<{ title: string; icon?: string }>) {
  return (
    <View style={[styles.card, shadow(0.05, 8, 3)]}>
      <View style={styles.cardHeader}>
        <MaterialIcons name={icon as any} size={16} color={PALETTE.text700} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={{ marginTop: 10, gap: 10 }}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label?: string;
  value?: string | number | null;
  icon?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon ? (
          <MaterialIcons name={icon as any} size={16} color={PALETTE.text600} />
        ) : null}
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
      <Text style={styles.value}>{value ?? '—'}</Text>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  iconBtn: { padding: 8, borderRadius: 999 },
  title: { color: '#fff', fontWeight: '800', fontSize: 16 },
  subtitle: { color: '#fff', opacity: 0.9, marginTop: 2, fontSize: 12 },

  bigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    ...Platform.select({
      ios: { shadowColor: '#0B3A05', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 6 },
    }),
  },
  bigBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.2 },

  halfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
  },
  halfBtnText: { color: '#fff', fontWeight: '800' },

  statusPill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#fff' },
  statusText: { fontWeight: '800', fontSize: 12 },

  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  headerBtnText: { color: PRIMARY, fontWeight: '800', fontSize: 12 },

  headerBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DANGER,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  headerBtnDangerText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  quickStrip: {
    marginTop: 8,
    marginHorizontal: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  quickDivider: { width: 1, height: 18, backgroundColor: PALETTE.border, marginHorizontal: 10 },
  quickText: { color: PALETTE.text900, fontWeight: '700', flexShrink: 1 },

  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontWeight: '800', color: PALETTE.text900, fontSize: 14 },

  row: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  label: { color: PALETTE.text600, fontSize: 12, marginBottom: 6, fontWeight: '700' },
  value: { color: PALETTE.text900, fontWeight: '800' },

  lotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    padding: 10,
  },
  lotText: { color: PALETTE.text900, fontWeight: '700' },
  muted: { color: PALETTE.text600 },
});
