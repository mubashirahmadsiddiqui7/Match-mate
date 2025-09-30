/* eslint-disable react-native/no-inline-styles */
// src/screens/fcs/FCSTripDetails.tsx
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
  Modal,
  TextInput,
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
  fetchFCSTripById,
  type TripDetails,
  approveFCSTrip,
  rejectFCSTrip,
} from '../../services/fcs';
import { FCSStackParamList } from '../../app/navigation/stacks/FCSStack';
import PALETTE from '../../theme/palette';

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

/* ---------- screen ---------- */
export default function FCSTripDetails() {
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<FCSStackParamList, 'TripDetails'>>();

  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchFCSTripById(params.tripId);
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
  }, [params.tripId, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  // refresh whenever screen regains focus (after actions)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleApprove = useCallback(async () => {
    if (!trip) return;
    try {
      setApproveLoading(true);
      await approveFCSTrip(trip.id);
      Toast.show({
        type: 'success',
        text1: 'Trip Approved',
        text2: `Trip ${trip.trip_name} has been approved successfully`,
        position: 'top',
      });
      await load(); // Refresh the trip data
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Approval Failed',
        text2: error?.message || 'Failed to approve trip',
        position: 'top',
      });
    } finally {
      setApproveLoading(false);
    }
  }, [trip, load]);

  const handleReject = useCallback(() => {
    if (!trip) return;
    setRejectionReason('');
    setShowRejectModal(true);
  }, [trip]);

  const confirmReject = useCallback(async () => {
    if (!trip || !rejectionReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please provide a rejection reason',
        position: 'top',
      });
      return;
    }

    try {
      setRejectLoading(true);
      await rejectFCSTrip(trip.id, { rejection_reason: rejectionReason.trim() });
      Toast.show({
        type: 'success',
        text1: 'Trip Rejected',
        text2: `Trip ${trip.trip_name} has been rejected`,
        position: 'top',
      });
      setShowRejectModal(false);
      setRejectionReason('');
      await load(); // Refresh the trip data
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Rejection Failed',
        text2: error?.message || 'Failed to reject trip',
        position: 'top',
      });
    } finally {
      setRejectLoading(false);
    }
  }, [trip, rejectionReason, load]);

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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  if (!trip) return null;

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

      {/* Action Buttons for Pending Trips */}
      {(trip.status === 'pending' || trip.status === 'pending_approval') && (
        <View style={styles.actionContainer}>
          <Pressable
            onPress={handleApprove}
            style={[
              styles.actionButton,
              styles.approveButton,
              approveLoading && { opacity: 0.6 }
            ]}
            disabled={approveLoading || rejectLoading}
          >
            {approveLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Approve Trip</Text>
              </>
            )}
          </Pressable>
          
          <Pressable
            onPress={handleReject}
            style={[
              styles.actionButton,
              styles.rejectButton,
              rejectLoading && { opacity: 0.6 }
            ]}
            disabled={approveLoading || rejectLoading}
          >
            {rejectLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="close" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Reject Trip</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {/* Basic Trip Information */}
        <Section title="Basic Trip Information" icon="assignment">
          <Row icon="badge" label="Trip ID" value={trip.trip_id} />
          <Row icon="info" label="Status Label" value={trip.status_label} />
          <Row icon="category" label="Trip Type" value={trip.trip_type_label} />
          <Row icon="flag" label="Trip Purpose" value={trip.trip_purpose} />
          <Row icon="public" label="Fishing Zone" value={trip.fishing_zone} />
        </Section>

        {/* Associations */}
        <Section title="Associations" icon="link">
          <Row icon="person" label="Fisherman" value={trip.fisherman?.name} />
          <Row icon="call" label="Fisherman Phone" value={trip.fisherman?.phone} />
          <Row icon="email" label="Fisherman Email" value={trip.fisherman?.email} />
          <Row icon="sailing" label="Boat Reg. No." value={trip.boat_registration_number} />
          <Row icon="directions-boat" label="Boat Name" value={trip.boat_name} />
        </Section>

        {/* Location & Schedule */}
        <Section title="Location & Schedule" icon="map">
          <Row icon="place" label="Port Location" value={trip.port_location} />
          <Row icon="place" label="Departure Port" value={trip.departure_port} />
          <Row icon="schedule" label="Departure Time" value={trip.departure_time} />
          <Row icon="my-location" label="Departure Lat" value={trip.departure_latitude} />
          <Row icon="my-location" label="Departure Lng" value={trip.departure_longitude} />
          <Row icon="notes" label="Departure Notes" value={trip.departure_notes} />
          <Row icon="flag" label="Arrival Port" value={trip.arrival_port} />
          <Row icon="schedule" label="Arrival Time" value={trip.arrival_time} />
          <Row icon="my-location" label="Arrival Lat" value={trip.arrival_latitude} />
          <Row icon="my-location" label="Arrival Lng" value={trip.arrival_longitude} />
          <Row icon="notes" label="Arrival Notes" value={trip.arrival_notes} />
          <Row icon="anchor" label="Landing Site" value={trip.landing_site} />
          <Row icon="event" label="Landing Time" value={trip.landing_time} />
          <Row icon="location-on" label="Departure Location" value={trip.departure_location_formatted} />
          <Row icon="location-on" label="Arrival Location" value={trip.arrival_location_formatted} />
          <Row icon="location-on" label="Current Location" value={trip.current_location_formatted} />
        </Section>

        {/* Flags & Approval */}
        <Section title="Status & Approval" icon="verified">
          <Row icon="play-arrow" label="Trip Started" value={n(trip.trip_started)} />
          <Row icon="check-circle" label="Trip Completed" value={n(trip.trip_completed)} />
          <Row icon="wifi-off" label="Is Offline" value={n(trip.is_offline)} />
          <Row icon="schedule" label="Last Online At" value={trip.last_online_at} />
          <Row icon="schedule" label="Went Offline At" value={trip.went_offline_at} />
          <Row icon="person" label="Approved By" value={trip.approver?.name || n(trip.approved_by)} />
          <Row icon="schedule" label="Approved At" value={trip.approved_at} />
          <Row icon="notes" label="Approval Notes" value={trip.approval_notes} />
        </Section>

        {/* Crew & Admin */}
        <Section title="Crew & Administration" icon="group">
          <Row icon="groups" label="Crew Count" value={n(trip.crew_count)} />
          <Row icon="badge" label="Captain Name" value={trip.captain_name} />
          <Row icon="call" label="Captain Mobile" value={trip.captain_mobile_no} />
          <Row icon="groups" label="Crew No." value={n(trip.crew_no)} />
          <Row icon="assignment-turned-in" label="Port Clearance No." value={trip.port_clearance_no} />
          <Row icon="local-gas-station" label="Fuel Quantity" value={trip.fuel_quantity} />
          <Row icon="ac-unit" label="Ice Quantity" value={trip.ice_quantity} />
        </Section>

        {/* Safety & Weather */}
        <Section title="Safety & Environment" icon="health-and-safety">
          <Row icon="medical-services" label="Safety Equipment" value={trip.safety_equipment} />
          <Row icon="contacts" label="Emergency Contact" value={trip.emergency_contact} />
          <Row icon="phone" label="Emergency Phone" value={trip.emergency_phone} />
          <Row icon="cloud" label="Weather Conditions" value={trip.weather_conditions} />
          <Row icon="waves" label="Sea Conditions" value={trip.sea_conditions} />
          <Row icon="air" label="Wind Speed" value={trip.wind_speed} />
          <Row icon="opacity" label="Wave Height" value={trip.wave_height} />
        </Section>

        {/* Catch & Economics */}
        <Section title="Catch & Economics" icon="attach-money">
          <Row icon="restaurant" label="Target Species" value={trip.target_species} />
          <Row icon="scale" label="Estimated Catch (kg)" value={trip.estimated_catch_weight} />
          <Row icon="notes" label="Catch Notes" value={trip.catch_notes} />
          <Row icon="local-gas-station" label="Fuel Cost" value={currency(trip.fuel_cost)} />
          <Row icon="build" label="Operational Cost" value={currency(trip.operational_cost)} />
          <Row icon="summarize" label="Total Cost" value={currency(trip.total_cost)} />
          <Row icon="payments" label="Revenue" value={currency(trip.revenue)} />
          <Row icon="savings" label="Profit" value={currency(trip.profit)} />
        </Section>

        {/* Telemetry */}
        <Section title="Live Telemetry" icon="my-location">
          <Row icon="schedule" label="Last GPS Update" value={trip.last_gps_update} />
          <Row icon="gps-fixed" label="Current Lat" value={trip.current_latitude} />
          <Row icon="gps-fixed" label="Current Lng" value={trip.current_longitude} />
          <Row icon="speed" label="Current Speed" value={trip.current_speed} />
          <Row icon="explore" label="Current Heading" value={trip.current_heading} />
          <Row icon="schedule" label="Auto Time" value={trip.auto_time} />
          <Row icon="gps-fixed" label="Auto Latitude" value={trip.auto_latitude} />
          <Row icon="gps-fixed" label="Auto Longitude" value={trip.auto_longitude} />
        </Section>

        {/* Metadata */}
        <Section title="Metadata" icon="info">
          <Row icon="update" label="Created At" value={trip.created_at} />
          <Row icon="update" label="Updated At" value={trip.updated_at} />
          <Row icon="av-timer" label="Duration" value={trip.duration} />
          <Row icon="route" label="Distance Traveled" value={trip.distance_traveled} />
          <Row icon="inventory" label="Fishing Activity Count" value={n(trip.fishing_activity_count)} />
        </Section>

        {/* Fishing Activities */}
        <Section title="Fishing Activities" icon="inventory">
          {trip.fishing_activities?.length ? (
            <View style={{ gap: 10 }}>
              {trip.fishing_activities.map(a => (
                <View key={String(a.id)} style={styles.activityCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialIcons name="list-alt" size={18} color={PALETTE.text700} />
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {a.activity_id} {a.activity_number ? `(#${a.activity_number})` : ''}
                    </Text>
                  </View>

                  <View style={{ marginTop: 6, gap: 4 }}>
                    <Text style={styles.muted} numberOfLines={1}>
                      {a.location_formatted || `${a.gps_latitude}, ${a.gps_longitude}`}
                    </Text>
                    <Text style={styles.muted} numberOfLines={1}>
                      Netting: {a.time_of_netting} | Hauling: {a.time_of_hauling}
                    </Text>
                    <Text style={styles.muted} numberOfLines={1}>
                      Gear: {a.gear_type_label || a.gear_type} | Mesh: {a.mesh_size_label || a.mesh_size}
                    </Text>
                    <Text style={styles.muted} numberOfLines={1}>
                      Size: {a.net_length} × {a.net_width} | Status: {a.status_label || a.status}
                    </Text>
                  </View>

                  {/* Species list (if any) */}
                  {a.fish_species && a.fish_species.length > 0 ? (
                    <View style={{ marginTop: 10, gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialIcons name="set-meal" size={16} color={PALETTE.text700} />
                        <Text style={{ fontWeight: '800', color: PALETTE.text900 }}>Species</Text>
                      </View>
                      {a.fish_species.map((s, idx) => (
                        <View key={String(s?.id ?? idx)} style={styles.speciesRow}>
                          <MaterialIcons name="chevron-right" size={18} color={PALETTE.text700} />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.lotText} numberOfLines={1}>
                              {s?.species_name}
                            </Text>
                            <Text style={styles.muted} numberOfLines={1}>
                              Qty: {s?.quantity_kg} kg | Type: {s?.type_label || s?.type}
                            </Text>
                            {s?.grade_label || s?.grade ? (
                              <Text style={styles.muted} numberOfLines={1}>
                                Grade: {s?.grade_label || s?.grade}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>No fishing activities recorded</Text>
          )}
        </Section>

        {/* Fish Species (if present) */}
        {trip.fish_species?.length ? (
          <Section title="Fish Species" icon="inventory-2">
            <View style={{ gap: 8 }}>
              {trip.fish_species.map(s => (
                <View key={String(s.id)} style={styles.lotRow}>
                  <MaterialIcons name="chevron-right" size={18} color={PALETTE.text700} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.lotText} numberOfLines={1}>
                      {s.lot_no} — {s.species_name}
                    </Text>
                    <Text style={styles.muted} numberOfLines={1}>
                      Qty: {s.quantity_kg} kg | Type: {s.type_label || s.type} | Grade: {s.grade_label || s.grade || 'Not graded'}
                    </Text>
                    {s.notes && (
                      <Text style={styles.muted} numberOfLines={1}>
                        Notes: {s.notes}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Section>
        ) : null}
      </ScrollView>

      {/* Rejection Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="warning" size={24} color={PALETTE.error} />
              <Text style={styles.modalTitle}>Reject Trip</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Please provide a reason for rejecting this trip:
            </Text>
            
            <Text style={styles.tripInfo}>
              Trip: {trip?.trip_name}
            </Text>
            
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter rejection reason..."
              placeholderTextColor={PALETTE.text400}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[
                  styles.modalButton, 
                  styles.confirmButton,
                  (!rejectionReason.trim() || rejectLoading) && { opacity: 0.6 }
                ]}
                onPress={confirmReject}
                disabled={!rejectionReason.trim() || rejectLoading}
              >
                {rejectLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Reject Trip</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
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
  activityCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    padding: 10,
  },
  activityTitle: { color: PALETTE.text900, fontWeight: '800', flexShrink: 1 },
  speciesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    padding: 8,
  },

  /* action buttons */
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: PALETTE.green700,
  },
  rejectButton: {
    backgroundColor: PALETTE.error,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  /* modal styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginLeft: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: PALETTE.text600,
    marginBottom: 12,
  },
  tripInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text900,
    marginBottom: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: PALETTE.text900,
    backgroundColor: '#f8f9fa',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: PALETTE.border,
  },
  confirmButton: {
    backgroundColor: PALETTE.error,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text600,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
