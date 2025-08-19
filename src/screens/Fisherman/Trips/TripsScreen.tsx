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
import { listTripsPage } from '../../../services/trips';

// import { listTrips } from '../../../services/trips'; // ← wire this later

const PALETTE = {
  green700: '#1B5E20',
  green600: '#2E7D32',
  green50: '#E8F5E9',
  text900: '#111827',
  text700: '#374151',
  text600: '#4B5563',
  border: '#E5E7EB',
  surface: '#FFFFFF',
  warn: '#EF6C00',
  info: '#1E88E5',
  purple: '#6A1B9A',
  error: '#C62828',
};

type TripRow = {
  id: string | number;
  trip_name: string;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled';
  departure_port?: string | null;
  destination_port?: string | null;
  departure_time?: string | null; // display string e.g. "2025-08-20 08:43 AM"
};

const STATUS_COLORS: Record<TripRow['status'], string> = {
  pending: PALETTE.warn,
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
  const navigation = useNavigation();
  const handleBack = () => {
    // go back if possible, else fall back to FishermanHome
    // @ts-ignore
    if (navigation.canGoBack()) navigation.goBack();
    // @ts-ignore
    else navigation.navigate('FishermanHome');
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

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trips.filter(t => {
      const okStatus = statusFilter === 'all' ? true : t.status === statusFilter;
      if (!okStatus) return false;
      if (!q) return true;
      const hay = [
        t.trip_name,
        t.departure_port ?? '',
        t.destination_port ?? '',
        t.status,
        t.departure_time ?? '',
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [trips, search, statusFilter]);

  const renderItem = ({ item }: { item: TripRow }) => {
    const color = STATUS_COLORS[item.status];
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.trip_name}
            </Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              {(item.departure_port || '—') +
                ' → ' +
                (item.destination_port || '—')}
            </Text>
            <Text style={styles.cardTime} numberOfLines={1}>
              {item.departure_time || '—'}
            </Text>
          </View>
          <View style={[styles.badge, { borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <Pressable
            onPress={() => Alert.alert('Trip', item.trip_name)}
            style={({ pressed }) => [
              styles.btn,
              styles.btnGhost,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.btnGhostText}>Open</Text>
          </Pressable>
        </View>
      </View>
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
    padding: 12,
    ...shadow(0.05, 8, 3),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.text900 },
  cardSub: { marginTop: 2, fontSize: 12, color: PALETTE.text600 },
  cardTime: { marginTop: 2, fontSize: 12, color: PALETTE.text700 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  badgeText: { fontSize: 12, fontWeight: '800' },

  cardActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnGhost: {
    borderColor: PALETTE.border,
    backgroundColor: '#FFFFFF',
  },
  btnGhostText: { color: PALETTE.text900, fontWeight: '800' },

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
