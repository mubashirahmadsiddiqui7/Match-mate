/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import {
  fetchFishLotById,
  type FishLotById,
  deleteLot,
} from '../../../services/lots'; // <-- add deleteLot import
import type { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';

/** ---- theme shortcuts ---- */
const PRIMARY = '#1f720d';
const BORDER = '#E5E7EB';
const MUTED = '#6B7280';
const TEXT = '#111827';
const DANGER = '#C62828';

/** ---- utils ---- */
function fxDateTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${dd} ${hh}:${mi}`;
}
function shadow(opacity: number, radius: number, height: number) {
  if (Platform.OS === 'android') return { elevation: 2 };
  return {
    shadowColor: '#000',
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height },
  };
}
function StatusPill({ status }: { status?: string | null }) {
  const s = (status || '').toLowerCase();
  const bg =
    s === 'verified'
      ? '#DCFCE7'
      : s === 'pending'
      ? '#FEF9C3'
      : s === 'rejected'
      ? '#FEE2E2'
      : '#E5E7EB';
  const border =
    s === 'verified'
      ? '#BBF7D0'
      : s === 'pending'
      ? '#FDE68A'
      : s === 'rejected'
      ? '#FCA5A5'
      : '#E5E7EB';
  const color =
    s === 'verified'
      ? '#166534'
      : s === 'pending'
      ? '#92400E'
      : s === 'rejected'
      ? '#991B1B'
      : '#374151';
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.pillText, { color }]}>{s || 'unknown'}</Text>
    </View>
  );
}

/** ---- screen ---- */
export default function LotDetailsScreen() {
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<FishermanStackParamList, 'LotDetails'>>();

  const [lot, setLot] = useState<FishLotById | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false); // <-- NEW

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchFishLotById(params.id);
      setLot(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load lot');
      // @ts-ignore
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [params.id, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  // ---- Delete Flow ----
  const confirmDelete = useCallback(() => {
    if (!lot) return;
    Alert.alert(
      'Delete Lot',
      `Are you sure you want to delete ${
        lot.lot_no || `Lot #${lot.id}`
      }?\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDelete,
        },
      ],
      { cancelable: true },
    );
  }, [lot]);

  const handleDelete = useCallback(async () => {
    if (!lot) return;
    try {
      setDeleting(true);
      await deleteLot(lot.id); // DELETE /fish-lots/:id
      Alert.alert('Deleted', 'Lot has been removed successfully.');
      // After delete, go back to Lots list (scoped to the same trip)
      // @ts-ignore
      navigation.navigate('LotDetails', { refresh: true });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to delete lot');
    } finally {
      setDeleting(false);
    }
  }, [lot, navigation]);

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  if (!lot) return null;
  const isPending = lot.status?.toLowerCase() === 'pending';
  const isVerified = lot.status?.toLowerCase() === 'verified';

  const title = lot.lot_no || `Lot #${lot.id}`;

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

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 4,
            }}
          >
            <StatusPill status={lot.status} />
            <Text style={styles.subtle}>
              {lot.species ? `${lot.species}` : '—'} • {lot.weight_kg ?? '—'} kg
            </Text>
          </View>
        </View>

        {/* Edit button */}
        <Pressable
          onPress={() =>
            // @ts-ignore
            navigation.navigate('Lots', { mode: 'edit', lotId: lot.id })
          }
          style={[
            styles.headerBtn,
            (!isPending || deleting) && { opacity: 0.5 }, // dim when disabled
          ]}
          accessibilityLabel="Open Lots (Add/Edit)"
          disabled={!isPending || deleting} // only enabled if pending
        >
          <MaterialIcons name="edit" size={16} color={PRIMARY} />
          <Text style={[styles.headerBtnText]}>Edit</Text>
        </Pressable>

        {/* Delete button (icon-only) */}
        <Pressable
          onPress={confirmDelete}
          style={[
            styles.iconBtn,
            { marginLeft: 4, backgroundColor: '#fff', borderRadius: 999 },
            (isVerified || deleting) && { opacity: 0.5 }, // dim when disabled
          ]}
          accessibilityLabel="Delete Lot"
          disabled={isVerified || deleting} // disable when verified
        >
          {deleting ? (
            <ActivityIndicator size="small" />
          ) : (
            <MaterialIcons name="delete" size={20} color={DANGER} />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {/* Basic Lot Information */}
        <Section title="Basic Lot Information" icon="inventory-2">
          <Row label="Species" value={lot.species} />
          <Row label="Weight (kg)" value={lot.weight_kg} />
          <Row label="Grade" value={lot.grade} />
          <Row label="Port Location" value={lot.port_location ?? '—'} />
          <Row label="Captured At" value={fxDateTime(lot.captured_at)} />
          <Row label="GPS Latitude" value={lot.gps_latitude ?? '—'} />
          <Row label="GPS Longitude" value={lot.gps_longitude ?? '—'} />
        </Section>

        {/* Related Trip */}
        <Section title="Related Trip" icon="directions-boat">
          <Pressable
            style={styles.linkRow}
            onPress={() =>
              // @ts-ignore
              navigation.navigate('TripDetails', { id: lot.trip_id })
            }
          >
            <MaterialIcons name="link" size={16} color={PRIMARY} />
            <Text style={styles.linkText}>
              Trip #{lot.trip?.trip_id || lot.trip_id}
            </Text>
            <MaterialIcons name="chevron-right" size={18} color={MUTED} />
          </Pressable>
        </Section>

        {/* Fisherman / User */}
        <Section title="Fisherman" icon="person">
          <View style={styles.linedRow}>
            <MaterialIcons name="account-circle" size={18} color={MUTED} />
            <Text style={styles.value}>{lot.user?.name || '—'}</Text>
          </View>
          {lot.user?.phone ? (
            <View style={styles.linedRow}>
              <MaterialIcons name="call" size={18} color={MUTED} />
              <Text style={styles.value}>{lot.user.phone}</Text>
            </View>
          ) : null}
        </Section>

        {/* Photos */}
        <Section title="Photos" icon="photo-library">
          <Text style={styles.muted}>No photos uploaded.</Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

/** ---- small presentational bits ---- */
function Section({
  title,
  icon = 'info',
  children,
}: React.PropsWithChildren<{ title: string; icon?: string }>) {
  return (
    <View style={[styles.card, shadow(0.05, 8, 3)]}>
      <View style={styles.cardHeader}>
        <MaterialIcons name={icon as any} size={16} color={MUTED} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={{ marginTop: 10, gap: 10 }}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? '—'}</Text>
    </View>
  );
}

/** ---- styles ---- */
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  iconBtn: { padding: 8, borderRadius: 999 },
  title: { color: '#fff', fontWeight: '900', fontSize: 18 },
  subtle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' },

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

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontWeight: '800', color: TEXT, fontSize: 14 },

  row: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  label: { color: MUTED, fontSize: 12, marginBottom: 6, fontWeight: '700' },
  value: { color: TEXT, fontWeight: '800' },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  linkText: { color: PRIMARY, fontWeight: '800', flex: 1 },

  linedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  muted: { color: MUTED },

  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  pillText: { fontSize: 12, fontWeight: '700' },
});
