/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
// src/screens/Fisherman/TripDetails/TripDetailsScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Pressable,
  StatusBar,
  Platform,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

import {
  getTripById,
  deleteTrip,
  type TripDetails,
  startTrip,
  cancelTrip,
  completedTrip,
  type TripCompletionMeta,
  getTripCompletionData,
} from '../../../services/trips';
import { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';
import PALETTE from '../../../theme/palette';
import {
  CancelTripModal,
  CompleteTripModal,
} from './TripActionModals';

/* ---------- constants ---------- */
const PRIMARY = PALETTE.green700;
const DANGER = PALETTE.error;

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
function n(v?: number | string | boolean | null) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}
function currency(v?: number | string | null) {
  if (v === null || v === undefined || v === '') return '—';
  const num = Number(v);
  if (Number.isNaN(num)) return '—';
  return num.toFixed(2);
}
function toTitle(s?: string | null) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- tiny confirm modal ---------- */
function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onCancel,
  onConfirm,
  loading,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  if (!visible) return null;
  return (
    <View style={styles.backdrop}>
      <View style={[styles.sheet, { maxWidth: 420 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.headerIconWrap}>
            <MaterialIcons name="warning-amber" size={18} color="#fff" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '900', color: PALETTE.text900 }}>
            {title}
          </Text>
        </View>
        <Text style={{ color: PALETTE.text700, marginTop: 6 }}>{message}</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={onCancel} disabled={loading}>
            <Text style={[styles.btnGhostText]}> {cancelText} </Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnDanger, loading && { opacity: 0.6 }]}
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="delete" size={18} color="#fff" />
                <Text style={styles.btnText}>{confirmText}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [completeMeta, setCompleteMeta] = useState<TripCompletionMeta | null>(null);
  const [completeMetaLoading, setCompleteMetaLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTripById(params.id);
      setTrip(data);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load trip',
        text2: e?.message || 'Please try again.',
        position: 'top',
      });
      // @ts-ignore
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [params.id, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  // refresh whenever screen regains focus (after actions)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const statusColor = useMemo(() => {
    if (!trip) return PALETTE.text700;
    switch (trip.status) {
      case 'pending':
        return PALETTE.warn;
      case 'approved':
        return PALETTE.info;
      case 'active':
        return PALETTE.purple;
      case 'completed':
        return PALETTE.green600;
      case 'cancelled':
        return PALETTE.error;
      default:
        return PALETTE.text700;
    }
  }, [trip]);

  const isPending = trip?.status === 'pending';
  const isApproved = trip?.status === 'approved';
  const isActive = trip?.status === 'active';

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
      Toast.show({
        type: 'success',
        text1: 'Trip Started',
        text2: 'Status updated to Active.',
        position: 'top',
      });
      await reload();
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to start trip',
        text2: e?.message || 'Please try again.',
        position: 'top',
      });
    } finally {
      setActionLoading(false);
    }
  }, [trip, reload]);

  const handleCancel = useCallback(
    async (reason: string) => {
      if (!trip) return;
      try {
        setActionLoading(true);
        await cancelTrip(trip.id, { cancellation_reason: reason });
        Toast.show({
          type: 'success',
          text1: 'Trip Cancelled',
          text2: 'Status updated to Cancelled.',
          position: 'top',
        });
        setShowCancel(false);
        await reload();
      } catch (e: any) {
        Toast.show({
          type: 'error',
          text1: 'Failed to cancel trip',
          text2: e?.message || 'Please try again.',
          position: 'top',
        });
      } finally {
        setActionLoading(false);
      }
    },
    [trip, reload],
  );

  const openComplete = useCallback(async () => {
    if (!trip) return;
    try {
      setCompleteMetaLoading(true);
      const meta = await getTripCompletionData(trip.id);
      setCompleteMeta(meta);
      setShowComplete(true);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load completion data',
        text2: e?.message || 'Please try again.',
        position: 'top',
      });
    } finally {
      setCompleteMetaLoading(false);
    }
  }, [trip]);

  const confirmDelete = useCallback(() => {
    if (!trip) return;
    setShowDeleteConfirm(true);
  }, [trip]);

  const handleDelete = useCallback(async () => {
    if (!trip) return;
    try {
      setDeleting(true);
      await deleteTrip(trip.id);
      Toast.show({
        type: 'success',
        text1: 'Trip Deleted',
        position: 'top',
      });
      // @ts-ignore
      navigation.navigate('AllTrip', { refresh: true });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to delete trip',
        text2: e?.message || 'Please try again.',
        position: 'top',
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [trip, navigation]);

  const handleEditPress = useCallback(() => {
    if (!trip) return;
    if (!isPending) {
      Toast.show({
        type: 'info',
        text1: 'Only pending trips can be edited',
        position: 'top',
      });
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
        <View style={styles.actionRow}>
          {/* Cancel */}
          <Pressable
            style={[
              styles.halfBtn,
              { backgroundColor: DANGER },
              actionLoading && { opacity: 0.6 },
            ]}
            onPress={() => setShowCancel(true)}
            disabled={actionLoading}
          >
            <MaterialIcons name="cancel" size={18} color="#fff" />
            <Text style={styles.halfBtnText}>Cancel</Text>
          </Pressable>

          {/* Add Species / Activity */}
          {/* <Pressable
            style={[
              styles.halfBtn,
              { backgroundColor: PALETTE.info },
              actionLoading && { opacity: 0.6 },
            ]}
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Add Activity',
                text2: 'Hook this to your create activity flow.',
                position: 'top',
              });
            }}
            disabled={actionLoading}
          >
            <MaterialIcons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.halfBtnText}>Add Activity</Text>
          </Pressable> */}

          {/* Complete */}
          <Pressable
            style={[
              styles.halfBtn,
              { backgroundColor: PRIMARY },
              actionLoading && { opacity: 0.6 },
            ]}
            onPress={openComplete}
            disabled={actionLoading}
          >
            <MaterialIcons name="check-circle" size={18} color="#fff" />
            <Text style={styles.halfBtnText}>Complete</Text>
          </Pressable>
        </View>
      );
    }

    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>
            {trip.trip_name}
          </Text>

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
              onPress={confirmDelete}
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
          <Row icon="badge" label="Trip ID" value={trip.trip_name} />
          <Row icon="info" label="Status Label" value={trip.status_label ?? '—'} />
          <Row icon="category" label="Trip Type" value={trip.trip_type} />
          <Row icon="flag" label="Trip Purpose" value={trip.trip_purpose} />
        </Section>

        {/* Associations */}
        <Section title="Associations" icon="link">
          <Row icon="person" label="Fisherman" value={trip.fisherman?.name ?? '—'} />
          <Row icon="call" label="Fisherman Phone" value={trip.fisherman?.phone ?? '—'} />
          <Row icon="sailing" label="Boat Reg. No." value={trip.boat_registration_no} />
          <Row icon="directions-boat" label="Boat Name" value={trip.boat_name} />
        </Section>

        {/* Location & Schedule */}
        <Section title="Location & Schedule" icon="map">
          <Row icon="public" label="Fishing Zone" value={trip.fishing_zone} />
          <Row icon="place" label="Port Location" value={trip.port_location} />
          <Row icon="place" label="Departure Port" value={trip.departure_port} />
          <Row icon="schedule" label="Departure Time" value={trip.departure_time} />
          <Row icon="my-location" label="Departure Lat" value={n(trip.departure_lat)} />
          <Row icon="my-location" label="Departure Lng" value={n(trip.departure_lng)} />
          <Row icon="notes" label="Departure Notes" value={trip.departure_notes ?? '—'} />
          <Row icon="flag" label="Arrival Port" value={trip.arrival_port} />
          <Row icon="schedule" label="Arrival Time" value={trip.arrival_time} />
          <Row icon="my-location" label="Arrival Lat" value={n(trip.arrival_lat)} />
          <Row icon="my-location" label="Arrival Lng" value={n(trip.arrival_lng)} />
          <Row icon="notes" label="Arrival Notes" value={trip.arrival_notes ?? '—'} />
          <Row icon="anchor" label="Landing Site" value={trip.landing_site} />
          <Row icon="event" label="Landing Time" value={trip.landing_time} />
          <Row icon="location-on" label="Departure Location" value={trip.departure_location_formatted ?? '—'} />
          <Row icon="location-on" label="Arrival Location" value={trip.arrival_location_formatted ?? '—'} />
          <Row icon="location-on" label="Current Location" value={trip.current_location_formatted ?? '—'} />
        </Section>

        {/* Flags & Approval */}
        <Section title="Status & Approval" icon="verified">
          <Row icon="play-arrow" label="Trip Started" value={n(trip.trip_started)} />
          <Row icon="check-circle" label="Trip Completed" value={n(trip.trip_completed)} />
          <Row icon="wifi-off" label="Is Offline" value={n(trip.is_offline)} />
          <Row icon="schedule" label="Last Online At" value={trip.last_online_at ?? '—'} />
          <Row icon="schedule" label="Went Offline At" value={trip.went_offline_at ?? '—'} />
          <Row icon="person" label="Approved By" value={n(trip.approved_by)} />
          <Row icon="schedule" label="Approved At" value={trip.approved_at ?? '—'} />
          <Row icon="notes" label="Approval Notes" value={trip.approval_notes ?? '—'} />
        </Section>

        {/* Crew & Admin */}
        <Section title="Crew & Administration" icon="group">
          <Row icon="groups" label="Crew Count" value={n(trip.crew_count)} />
          <Row icon="badge" label="Captain Name" value={trip.captain_name} />
          <Row icon="call" label="Captain Mobile" value={trip.captain_mobile_no} />
          <Row icon="groups" label="Crew No." value={n(trip.crew_no)} />
          <Row icon="assignment-turned-in" label="Port Clearance No." value={trip.port_clearance_no} />
          <Row icon="local-gas-station" label="Fuel Quantity" value={n(trip.fuel_quantity)} />
          <Row icon="ac-unit" label="Ice Quantity" value={n(trip.ice_quantity)} />
        </Section>

        {/* Safety & Weather */}
        <Section title="Safety & Environment" icon="health-and-safety">
          <Row icon="medical-services" label="Safety Equipment" value={trip.safety_equipment} />
          <Row icon="contacts" label="Emergency Contact" value={trip.emergency_contact} />
          <Row icon="phone" label="Emergency Phone" value={trip.emergency_phone} />
          <Row icon="cloud" label="Weather" value={trip.weather} />
          <Row icon="waves" label="Sea Conditions" value={trip.sea_conditions} />
          <Row icon="air" label="Wind Speed" value={n(trip.wind_speed)} />
          <Row icon="opacity" label="Wave Height" value={n(trip.wave_height)} />
        </Section>

        {/* Catch & Economics */}
        <Section title="Catch & Economics" icon="attach-money">
          <Row icon="restaurant" label="Target Species" value={trip.target_species} />
          <Row icon="scale" label="Estimated Catch (kg)" value={n(trip.estimated_catch)} />
          <Row icon="notes" label="Catch Notes" value={trip.catch_notes ?? '—'} />
          <Row icon="local-gas-station" label="Fuel Cost" value={currency(trip.fuel_cost)} />
          <Row icon="build" label="Operational Cost" value={currency(trip.operational_cost)} />
          <Row icon="summarize" label="Total Cost" value={currency(trip.total_cost)} />
          <Row icon="payments" label="Revenue" value={currency(trip.revenue)} />
          <Row icon="savings" label="Profit" value={currency(trip.profit)} />
        </Section>

        {/* Telemetry */}
        <Section title="Live Telemetry" icon="my-location">
          <Row icon="schedule" label="Last GPS Update" value={trip.last_gps_update ?? '—'} />
          <Row icon="gps-fixed" label="Current Lat" value={n(trip.current_latitude)} />
          <Row icon="gps-fixed" label="Current Lng" value={n(trip.current_longitude)} />
          <Row icon="speed" label="Current Speed" value={n(trip.current_speed)} />
          <Row icon="explore" label="Current Heading" value={n(trip.current_heading)} />
          <Row icon="schedule" label="Auto Time" value={trip.auto_time ?? '—'} />
          <Row icon="gps-fixed" label="Auto Latitude" value={n(trip.auto_latitude)} />
          <Row icon="gps-fixed" label="Auto Longitude" value={n(trip.auto_longitude)} />
        </Section>

        {/* Metadata */}
        <Section title="Metadata" icon="info">
          <Row icon="update" label="Created At" value={trip.created_at ?? '—'} />
          <Row icon="update" label="Updated At" value={trip.updated_at ?? '—'} />
          <Row icon="av-timer" label="Duration" value={trip.duration ?? '—'} />
          <Row icon="route" label="Distance Traveled" value={trip.distance_traveled ?? '—'} />
        </Section>

        {/* Fishing Activities */}
        <Section title="Fishing Activities" icon="inventory">
          {trip.activities?.length ? (
            <View style={{ gap: 10 }}>
              {trip.activities.map(a => (
                <View key={String(a.id)} style={styles.lotRow}>
                  <MaterialIcons name="chevron-right" size={18} color={PALETTE.text700} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.lotText} numberOfLines={1}>
                      {a.activity_id} {a.number ? `(#${a.number})` : ''}
                    </Text>
                    <Text style={styles.muted} numberOfLines={1}>
                      {a.location_formatted ||
                        `${a.gps_latitude ?? '—'}, ${a.gps_longitude ?? '—'}`}
                    </Text>
                    <Text style={styles.muted} numberOfLines={1}>
                      Netting: {a.time_of_netting ?? '—'} | Hauling: {a.time_of_hauling ?? '—'}
                    </Text>
                    <Text style={styles.muted} numberOfLines={1}>
                      Gear: {a.gear_type_label ?? a.gear_type ?? '—'} | Mesh: {a.mesh_size_label ?? a.mesh_size ?? '—'}
                    </Text>
                    <Text style={styles.muted} numberOfLines={1}>
                      Size: {a.net_length ?? '—'} × {a.net_width ?? '—'} | Status:{' '}
                      {a.status_label ?? a.status ?? '—'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>—</Text>
          )}
        </Section>

        {/* Fish Lots (legacy / if present) */}
        <Section title="Fish Lots" icon="inventory-2">
          {trip.lots?.length ? (
            <View style={{ gap: 8 }}>
              {trip.lots.map(l => (
                <View key={String(l.id)} style={styles.lotRow}>
                  <MaterialIcons name="chevron-right" size={18} color={PALETTE.text700} />
                  <Text style={styles.lotText} numberOfLines={1}>
                    {l.lot_no ? l.lot_no : `Lot #${l.id}`} — {toTitle(l.status)}
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
        loading={actionLoading || completeMetaLoading}
        onClose={() => setShowComplete(false)}
        tripCode={trip?.trip_name}
        availableLots={completeMeta?.lots || []}
        middleMen={completeMeta?.middle_men || []}
        landingSites={completeMeta?.landing_sites || {}}
        tripInfo={completeMeta?.trip}
        onSubmit={async payload => {
          try {
            setActionLoading(true);
            await completedTrip(trip!.id, payload);
            Toast.show({
              type: 'success',
              text1: 'Trip Completed',
              text2: 'Status updated to Pending approval.',
              position: 'top',
            });
            setShowComplete(false);
            await reload();
          } catch (e: any) {
            Toast.show({
              type: 'error',
              text1: 'Could not complete trip',
              text2: e?.message || 'Please try again.',
              position: 'top',
            });
          } finally {
            setActionLoading(false);
          }
        }}
      />

      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete Trip"
        message={`Delete "${trip.trip_name}"? This cannot be undone.`}
        confirmText="Delete"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={deleting}
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
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {icon ? <MaterialIcons name={icon as any} size={16} color={PALETTE.text600} /> : null}
        {label ? <Text style={styles.label} numberOfLines={1}>{label}</Text> : null}
      </View>
      <Text style={styles.value} numberOfLines={2}>{value ?? '—'}</Text>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  /* overlays */
  backdrop: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(15,18,28,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    ...Platform.select({
      ios: {
        shadowColor: '#0b0f19',
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 10 },
    }),
    gap: 12,
  },
  headerIconWrap: {
    backgroundColor: DANGER,
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  iconBtn: { padding: 8, borderRadius: 999 },
  title: { color: '#fff', fontWeight: '800', fontSize: 16 },
  subtitle: { color: '#fff', opacity: 0.9, marginTop: 2, fontSize: 12 },

  /* big action */
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
      ios: {
        shadowColor: '#0B3A05',
        shadowOpacity: 0.22,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }),
  },
  bigBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.2,
  },

  /* status */
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
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  statusText: { fontWeight: '800', fontSize: 12 },

  /* header buttons */
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

  /* quick strip */
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

  /* cards */
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  cardTitle: { fontWeight: '800', color: PALETTE.text900, fontSize: 14, flexShrink: 1 },

  /* rows */
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

  /* listish */
  lotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    padding: 10,
  },
  lotText: { color: PALETTE.text900, fontWeight: '700' },
  muted: { color: PALETTE.text600, fontSize: 12 },

  /* action row */
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 10,
    flexWrap: 'wrap',
  },
  halfBtn: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
  },
  halfBtnText: { color: '#fff', fontWeight: '800' },

  /* confirm modal buttons */
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
  },
  btnText: { color: '#fff', fontWeight: '800' },
  btnGhost: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  btnGhostText: { color: PALETTE.text900, fontWeight: '800' },
  btnDanger: { backgroundColor: DANGER },
});
