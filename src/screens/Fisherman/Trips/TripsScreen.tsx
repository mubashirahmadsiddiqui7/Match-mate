/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { listTripsPage, startTrip } from '../../../services/trips';
import PALETTE from '../../../theme/palette';

type TripRow = {
  id: string | number;
  trip_name: string;
  status: 'pending' | 'pending_approval' | 'approved' | 'active' | 'completed' | 'cancelled';
  departure_port?: string | null;
  destination_port?: string | null;
  departure_time?: string | null; // display string e.g. "2025-08-20 08:43 AM"
  fisherman_name?: string | null;
  boat_name?: string | null;
  boat_registration_number?: string | null;
  trip_type_label?: string | null;
  created_at?: string | null;
  fishing_activity_count?: number | null;
};

const STATUS_COLORS: Record<TripRow['status'], string> = {
  pending: PALETTE.warn,
  pending_approval: '#6B7280',
  approved: PALETTE.info,
  active: PALETTE.purple,
  completed: PALETTE.green600,
  cancelled: PALETTE.error,
};

export default function TripsScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TripRow['status']>(
    'all',
  );
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [actionBusyId, setActionBusyId] = useState<string | number | null>(null);
  const navigation = useNavigation();
  const handleBack = () => {
    // go back if possible, else fall back to FishermanHome
    // @ts-ignore

    navigation.navigate('FishermanHome');
  };

  // load dummy data (swap with API later)
  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      // grab one big page (tweak per_page if you expect many)
      const res = await listTripsPage({ page: 1, per_page: 100 });
      setTrips(res.rows as any); // rows already match TripRow shape
    } catch (e: any) {
      console.log('[TripsScreen] load failed:', e?.message || e);
      Alert.alert('Error', e?.message || 'Failed to load trips');
      setTrips([]); // or keep prior
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trips.filter(t => {
      const okStatus =
        statusFilter === 'all' ? true : t.status === statusFilter;
      if (!okStatus) return false;
      if (!q) return true;
      const hay = [
        t.trip_name,
        t.departure_port ?? '',
        // t.destination_port ?? '',
        t.status,
        t.departure_time ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [trips, search, statusFilter]);

  function toTitle(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  const renderItem = ({ item }: { item: TripRow }) => {
    const color = STATUS_COLORS[item.status];
    const isPending = item.status === 'pending';
    const isPendingApproval = item.status === 'pending_approval';
    // const isApproved = item.status === 'approved';
    const isActive = item.status === 'active';
    return (
      <Pressable
        onPress={() => (navigation as any).navigate('TripDetails', { id: item.id })}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.93 }]}
        accessibilityRole="button"
        accessibilityLabel={`Open trip ${item.trip_name}`}
      >
        {/* Top row: Trip ID + status pill */}
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.trip_name}
          </Text>

          <View
            style={[
              styles.badge,
              { borderColor: color, backgroundColor: '#fff' },
            ]}
          >
            <View style={[styles.badgeDot, { backgroundColor: color }]} />
            <Text style={[styles.badgeText, { color }]}>
              {toTitle(item.status)}
            </Text>
          </View>
        </View>

        {/* Info grid row (Fisherman • Boat • Type) */}
        <View style={styles.infoRow}>
          <Icon name="person" size={16} color={PALETTE.text600} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.fisherman_name || '—'}
          </Text>
          <View style={styles.dot} />
          <Icon name="directions-boat" size={16} color={PALETTE.text600} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.boat_name || item.boat_registration_number || '—'}
          </Text>
          <View style={styles.dot} />
          <Icon name="category" size={16} color={PALETTE.text600} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.trip_type_label || '—'}
          </Text>
        </View>

        {/* Route row */}
        <View style={styles.routeRow}>
          <Icon name="place" size={16} color={PALETTE.text600} />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.departure_port || 'Unknown'}
          </Text>
          
        </View>

        {/* Time row */}
        <View style={styles.timeRow}>
          <Icon name="schedule" size={16} color={PALETTE.text600} />
          <Text style={styles.cardTime} numberOfLines={1}>
            {item.departure_time || 'Time not set'}
          </Text>
        </View>

        {/* Footer actions: two neat rows */}
        <View style={styles.cardActions}>
          {/* row 1 */}
          <Pressable
            onPress={() => (navigation as any).navigate('TripDetails', { id: item.id })}
            style={[styles.actionBtn, styles.btnGhost]}
            accessibilityLabel="View"
          >
            <Icon name="visibility" size={18} color={PALETTE.text900} />
            <Text style={styles.btnGhostText}>View</Text>
          </Pressable>

          {isActive ? (
            <Pressable
              onPress={() =>
                (navigation as any).navigate('FishingActivity', {
                  tripId: String(item.trip_name),
                  meta: { id: item.id, trip_id: item.trip_name },
                  mode: 'create',
                  activityNo: (item.fishing_activity_count ?? 0) + 1,
                })
              }
              style={[styles.actionBtn, styles.btnInfo]}
              accessibilityLabel="Add Activity"
            >
              <Icon name="set-meal" size={18} color="#fff" />
              <Text style={styles.btnWhiteText}>Add Activity</Text>
            </Pressable>
          ) : null}

          {/* row break */}
          <View style={{ width: '100%' }} />

          {/* row 2 */}
          {isPending ? (
            <Pressable
              onPress={async () => {
                try {
                  setActionBusyId(item.id);
                  await startTrip(item.id);
                  Alert.alert('Trip Started', 'Status updated to Active.');
                  await loadTrips();
                } catch (e: any) {
                  Alert.alert('Failed', e?.message || 'Could not start trip');
                } finally {
                  setActionBusyId(null);
                }
              }}
              style={[styles.actionBtn, styles.btnPrimary, actionBusyId === item.id && { opacity: 0.7 }]}
              accessibilityLabel="Start Trip"
              disabled={actionBusyId === item.id}
            >
              {actionBusyId === item.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="play-circle-filled" size={18} color="#fff" />
                  <Text style={styles.btnWhiteText}>Start Trip</Text>
                </>
              )}
            </Pressable>
          ) : null}

          {isActive && (item.fishing_activity_count ?? 0) > 0 ? (
            <Pressable
              onPress={() => (navigation as any).navigate('TripDetails', { id: item.id })}
              style={[styles.actionBtn, styles.btnWarn]}
              accessibilityLabel="Complete Trip"
            >
              <Icon name="flag" size={18} color="#212121" />
              <Text style={styles.btnDarkText}>Complete Trip</Text>
            </Pressable>
          ) : null}

          {(isPending || isActive) && !isPendingApproval ? (
            <Pressable
              onPress={() => (navigation as any).navigate('Trip', { id: item.id, mode: 'edit' })}
              style={[styles.actionBtn, styles.btnGhost]}
              accessibilityLabel="Edit"
            >
              <Icon name="edit" size={18} color={PALETTE.text900} />
              <Text style={styles.btnGhostText}>Edit</Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.surface }}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />

      <View style={styles.screen}>
        {/* Header / search row */}
        <View style={styles.hero}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>

          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>All Trips</Text>
            <Text style={styles.heroSub}>
              {loading ? 'Loading…' : `Total: ${filtered.length}`}
            </Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by trip, port, status…"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>

        {/* Filter chips */}
        <View style={styles.chipsRow}>
          {(
            [
              'all',
              'pending',
              'pending_approval',
              'approved',
              'active',
              'completed',
              'cancelled',
            ] as const
          ).map(st => (
            <Pressable
              key={st}
              onPress={() => setStatusFilter(st)}
              style={({ pressed }) => [
                styles.chip,
                statusFilter === st && styles.chipActive,
                pressed && { opacity: 0.9 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filter ${st}`}
            >
              <Text
                style={[
                  styles.chipText,
                  statusFilter === st && styles.chipTextActive,
                ]}
              >
                {st[0].toUpperCase() + st.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={it => String(it.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              {loading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Text style={styles.emptyTitle}>No trips</Text>
                  <Text style={styles.emptySub}>
                    Try changing filters or search.
                  </Text>
                </>
              )}
            </View>
          }
          refreshing={loading}
          onRefresh={loadTrips}
          contentContainerStyle={{ paddingVertical: 12 }}
        />
      </View>
    </SafeAreaView>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 38,
    paddingBottom: 12,
    backgroundColor: PALETTE.surface,
  },

  hero: {
    backgroundColor: PALETTE.green700,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow(0.08, 8, 3),
  },
  backBtn: {
    padding: 6,
    borderRadius: 999,
    marginRight: 8,
  },
  heroBody: { flex: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },

  searchRow: { marginTop: 10 },
  searchInput: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: PALETTE.text900,
  },

  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: PALETTE.green50,
    borderColor: PALETTE.green600,
  },
  chipText: { color: PALETTE.text700, fontWeight: '700' },
  chipTextActive: { color: PALETTE.green700 },

  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    ...shadow(0.05, 8, 3),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.text900,
    flex: 1,
  },

  routeRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    marginLeft: 6,
    color: PALETTE.text700,
    fontWeight: '700',
    maxWidth: '44%',
  },

  timeRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTime: { color: PALETTE.text700, fontWeight: '600' },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: '800' },

  cardActions: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FFFFFF',
  },
  openBtnText: { color: PALETTE.text900, fontWeight: '800' },

  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnGhost: {
    borderColor: PALETTE.border,
    backgroundColor: '#FFFFFF',
  },
  btnGhostText: { color: PALETTE.text900, fontWeight: '800' },
  btnInfo: { backgroundColor: PALETTE.info, borderColor: PALETTE.info },
  btnWarn: { backgroundColor: '#FFE082', borderColor: '#FFC107' },
  btnPrimary: { backgroundColor: PALETTE.green700, borderColor: PALETTE.green700 },
  btnWhiteText: { color: '#fff', fontWeight: '800' },
  btnDarkText: { color: '#212121', fontWeight: '800' },

  infoRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoText: { color: PALETTE.text700, fontWeight: '700', maxWidth: '28%' },
  dot: { width: 4, height: 4, borderRadius: 99, backgroundColor: PALETTE.border },

  empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: PALETTE.text900 },
  emptySub: { marginTop: 6, color: PALETTE.text600, textAlign: 'center' },
});

/* ---- shadow helper ---- */
function shadow(opacity: number, radius: number, height: number) {
  if (Platform.OS === 'android') return { elevation: 2 };
  return {
    shadowColor: '#000',
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height },
  };
}
