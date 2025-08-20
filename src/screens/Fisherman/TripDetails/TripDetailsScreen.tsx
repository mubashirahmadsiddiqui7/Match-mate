// src/screens/Fisherman/TripDetails/TripDetailsScreen.tsx
/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, Pressable, Alert, StatusBar, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { getTripById, deleteTrip, type TripDetails } from '../../../services/trips';
import { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';

const PALETTE = {
  green700: '#1B5E20', green600: '#2E7D32', green50: '#E8F5E9',
  text900: '#111827', text700: '#374151', text600: '#4B5563',
  border: '#E5E7EB', surface: '#FFFFFF', warn: '#EF6C00',
  info: '#1E88E5', purple: '#6A1B9A', error: '#C62828',
};

const STATUS_COLORS: Record<NonNullable<TripDetails['status']>, string> = {
  pending: PALETTE.warn, approved: PALETTE.info, active: PALETTE.purple,
  completed: PALETTE.green600, cancelled: PALETTE.error,
};

function shadow(opacity: number, radius: number, height: number) {
  if (Platform.OS === 'android') return { elevation: 2 };
  return { shadowColor: '#000', shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height } };
}

export default function TripDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<FishermanStackParamList, 'TripDetails'>>();
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTripById(params.id);
      setTrip(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load trip');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [params.id, navigation]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = useCallback(() => {
    if (!trip) return;
    Alert.alert('Delete Trip', `Delete "${trip.trip_name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            setDeleting(true);
            await deleteTrip(trip.id);
            // Optionally send a flag so list refreshes on focus
            // @ts-ignore
            navigation.navigate('AllTrip', { refresh: true });
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to delete trip');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }, [trip, navigation]);

  const handleEdit = useCallback(() => {
    if (!trip) return;
    // Navigate to your existing Add/Edit form with the id to prefill
    // @ts-ignore
    navigation.navigate('EditTrip', { id: trip.id });
  }, [trip, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  if (!trip) return null;

  const statusColor = STATUS_COLORS[trip.status];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: PALETTE.green700 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} accessibilityLabel="Back">
          <Icon name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{trip.trip_name}</Text>
          <Text style={[styles.status, { color: statusColor }]}>{trip.status.toUpperCase()}</Text>
        </View>
        <Pressable onPress={handleEdit} style={styles.iconBtn} accessibilityLabel="Edit trip">
          <Icon name="edit" size={20} color="#fff" />
        </Pressable>
        <Pressable disabled={deleting} onPress={handleDelete} style={styles.iconBtn} accessibilityLabel="Delete trip">
          <Icon name="delete" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {/* Basic Trip Information */}
        <Section title="Basic Trip Information">
          <Row label="Fisherman" value={trip.fisherman?.name} />
          <Row label="Trip Type" value={trip.trip_type} />
          <Row label="Boat Reg. No." value={trip.boat_registration_no} />
          <Row label="Boat Name" value={trip.boat_name} />
        </Section>

        {/* Location & Schedule */}
        <Section title="Location & Schedule">
          <Row label="Fishing Zone" value={trip.fishing_zone} />
          <Row label="Port Location" value={trip.port_location} />
          <Row label="Departure Port" value={trip.departure_port} />
          <Row label="Departure Time" value={trip.departure_time} />
          <Row label="Departure Lat" value={String(trip.departure_lat ?? '—')} />
          <Row label="Departure Lng" value={String(trip.departure_lng ?? '—')} />
        </Section>

        {/* Safety & Weather */}
        <Section title="Safety & Weather">
          <Row label="Crew Count" value={n(trip.crew_count)} />
          <Row label="Emergency Phone" value={trip.emergency_phone} />
          <Row label="Emergency Contact" value={trip.emergency_contact} />
          <Row label="Safety Equipment" value={trip.safety_equipment} />
          <Row label="Weather" value={trip.weather} />
          <Row label="Sea Conditions" value={trip.sea_conditions} />
          <Row label="Wind Speed" value={n(trip.wind_speed)} />
          <Row label="Wave Height" value={n(trip.wave_height)} />
        </Section>

        {/* Fishing & Costs */}
        <Section title="Fishing & Costs">
          <Row label="Target Species" value={trip.target_species} />
          <Row label="Estimated Catch (kg)" value={n(trip.estimated_catch)} />
          <Row label="Fuel Cost" value={currency(trip.fuel_cost)} />
          <Row label="Operational Cost" value={currency(trip.operational_cost)} />
          <Row label="Total Cost" value={currency(trip.total_cost)} />
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <Row value={trip.notes} />
        </Section>

        {/* Fish Lots */}
        <Section title="Fish Lots">
          {trip.lots?.length ? (
            <View style={{ gap: 8 }}>
              {trip.lots.map(l => (
                <View key={String(l.id)} style={styles.lotRow}>
                  <Icon name="chevron-right" size={18} color={PALETTE.text700} />
                  <Text style={styles.lotText}>{l.lot_no} — {l.status}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>—</Text>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- small presentational helpers ---------- */
function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <View style={[styles.card, shadow(0.05, 8, 3)]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={{ marginTop: 10, gap: 10 }}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label?: string; value?: string | number | null }) {
  return (
    <View style={styles.row}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Text style={styles.value}>{value ?? '—'}</Text>
    </View>
  );
}

function n(v?: number | string | null) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}
function currency(v?: number | null) {
  if (v === null || v === undefined) return '—';
  return Number(v).toFixed(2);
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8,
  },
  iconBtn: { padding: 8, borderRadius: 999 },
  title: { color: '#fff', fontWeight: '800', fontSize: 16 },
  status: { marginTop: 2, fontWeight: '700' },

  card: {
    backgroundColor: PALETTE.surface, borderRadius: 14, borderWidth: 1,
    borderColor: PALETTE.border, padding: 12,
  },
  cardTitle: { fontWeight: '800', color: PALETTE.text900, fontSize: 14 },
  row: {
    backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: PALETTE.border,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
  },
  label: { color: PALETTE.text600, fontSize: 12, marginBottom: 6 },
  value: { color: PALETTE.text900, fontWeight: '700' },

  lotRow: { flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: PALETTE.border,
    borderRadius: 10, padding: 10,
  },
  lotText: { color: PALETTE.text900, fontWeight: '700' },
  muted: { color: PALETTE.text600 },
});
