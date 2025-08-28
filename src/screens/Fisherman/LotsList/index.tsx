/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  fetchFishLots,
  type FishLot,
  type LotsPage,
} from '../../../services/lots';
import type { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';

/** -------- Types / Nav -------- */
type Nav = NativeStackNavigationProp<FishermanStackParamList>;
type SortMode = 'newest' | 'weight' | 'alpha';

const PER_PAGE = 15;

/** -------- Theme -------- */
const PRIMARY = '#1f720d';
const PRIMARY_DARK = '#185d0a';
const ACCENT = '#8fd393';
const SURFACE = '#FFFFFF';
const BORDER = '#E5E7EB';
const TEXT_MUTED = '#6B7280';
const TEXT_DARK = '#111827';

/** -------- Screen -------- */
export default function AllLotsScreen() {
  const navigation = useNavigation<Nav>();
  const listRef = useRef<FlatList<FishLot>>(null);

  /** remote */
  const [items, setItems] = useState<FishLot[]>([]);
  const [meta, setMeta] = useState<LotsPage['meta'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** local UX */
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortMode>('newest');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const total = meta?.total ?? items.length;

  /** load a page */
  const loadPage = useCallback(
    async (page: number, replace = false) => {
      setError(null);
      if (replace) setRefreshing(true);
      else setLoading(true);

      try {
        const { items: newItems, meta: newMeta } = await fetchFishLots({
          page,
          per_page: PER_PAGE,
        });

        setMeta(newMeta);

        setItems(prev => {
          if (replace) return newItems;
          const map = new Map<number, FishLot>();
          prev.forEach(i => map.set(i.id, i));
          newItems.forEach(i => map.set(i.id, i));
          return Array.from(map.values());
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to load lots.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPage(1, true);
  }, [loadPage]);

  /** list paging */
  const onRefresh = useCallback(() => {
    loadPage(1, true);
  }, [loadPage]);

  const onEndReached = useCallback(() => {
    if (loading || refreshing) return;
    if (!meta) return;
    if (meta.current_page >= meta.last_page) return;
    loadPage(meta.current_page + 1);
  }, [loading, refreshing, meta, loadPage]);

  /** derived: statuses present to build chips */
  const presentStatuses = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => i.status && set.add(String(i.status).toLowerCase()));
    const arr = Array.from(set.values()).sort();
    return ['all', ...arr]; // ensure All first
  }, [items]);

  /** filter + sort */
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let arr = items.filter(it => {
      const okStatus =
        statusFilter === 'all'
          ? true
          : (it.status || '').toLowerCase() === statusFilter;

      if (!okStatus) return false;
      if (!needle) return true;

      const hay = [
        it.lot_no,
        it.species,
        it.grade,
        it.port_location,
        it.trip?.trip_id ? String(it.trip.trip_id) : '',
        String(it.trip_id ?? ''),
        String(it.status ?? ''),
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(needle);
    });

    const safeNum = (n: number | string | null | undefined) => {
      if (n == null) return 0;
      const v = typeof n === 'string' ? parseFloat(n) : Number(n);
      return Number.isFinite(v) ? v : 0;
    };
    const ts = (it: FishLot) => {
      const s = (it.captured_at || it.created_at || '') as string;
      const d = new Date(s);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };

    if (sort === 'newest') {
      arr = [...arr].sort((a, b) => ts(b) - ts(a));
    } else if (sort === 'weight') {
      arr = [...arr].sort(
        (a, b) => safeNum(b.weight_kg) - safeNum(a.weight_kg),
      );
    } else if (sort === 'alpha') {
      arr = [...arr].sort((a, b) => (a.lot_no || '').localeCompare(b.lot_no || ''));
    }
    return arr;
  }, [items, q, statusFilter, sort]);

  /** counts per status for header chips */
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach(i => {
      const s = (i.status || 'unknown').toLowerCase();
      c[s] = (c[s] || 0) + 1;
    });
    return c;
  }, [items]);

  /** scroll listener toggles FAB */
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      setShowScrollTop(y > 400);
    },
    []
  );

  /** header **/
  const Header = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <StatusBar
          backgroundColor={PRIMARY}
          barStyle="light-content"
          translucent={false}
        />

        {/* Top bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => {
                  navigation.navigate('FishermanHome');

            }}
            accessibilityLabel="Go back"
            style={styles.iconBtn}
          >
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>All Species</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.tinyChip}>
              <MaterialIcons name="inventory" size={14} color="#fff" />
              <Text style={styles.tinyChipText}>{total}</Text>
            </View>
          </View>
        </View>

        {/* Decorative band */}
        <View style={styles.headerBand}>
          <View style={styles.bandAccent} />
          <View style={[styles.bandAccent, { right: -40, transform: [{ rotate: '-6deg' }] }]} />
        </View>

        {/* Search & controls card */}
        <View style={styles.controlsCard}>
          {/* Search */}
          <View style={styles.searchRow}>
            <MaterialIcons name="search" size={18} color={TEXT_MUTED} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search by species, port, status…"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              returnKeyType="search"
            />
            {q ? (
              <TouchableOpacity onPress={() => setQ('')} style={styles.clearBtn}>
                <MaterialIcons name="close" size={16} color={TEXT_MUTED} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filters row */}
          <View style={styles.filtersRow}>
            {/* Status chips */}
            <ScrollChips
              items={presentStatuses}
              active={statusFilter}
              onChipPress={setStatusFilter}
              counts={counts}
            />

            {/* Sort chip */}
            <TouchableOpacity
              onPress={() =>
                setSort(prev =>
                  prev === 'newest' ? 'weight' : prev === 'weight' ? 'alpha' : 'newest',
                )
              }
              style={styles.sortChip}
            >
              <MaterialIcons
                name={
                  sort === 'newest'
                    ? 'schedule'
                    : sort === 'weight'
                    ? 'scale'
                    : 'sort-by-alpha'
                }
                size={16}
                color={PRIMARY_DARK}
              />
              <Text style={styles.sortChipText}>
                {sort === 'newest' ? 'Newest' : sort === 'weight' ? 'Heaviest' : 'A–Z'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ),
    [navigation, presentStatuses, statusFilter, sort, q, total, counts]
  );

  /** list footer while paging */
  const listFooter = useMemo(() => {
    if (!loading || refreshing) return null;
    return (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator />
      </View>
    );
  }, [loading, refreshing]);

  /** item render */
  const renderItem = ({ item }: { item: FishLot }) => {
    const weight = toNumber(item.weight_kg);
    const captured = item.captured_at ? formatDateTime(item.captured_at) : '—';
    const port = item.port_location || item.trip?.port_location || '—';
    const tripTitle = item.trip?.trip_id || `#${item.trip_id}`;

    const onPress = () => navigation.navigate('LotDetails', { id: item.id });
    const onLongPress = () => {
      Alert.alert(
        item.lot_no || 'Lot',
        'Choose an action',
        [
          { text: 'Open Trip', onPress: () => navigation.navigate('TripDetails', { id: item.trip_id }) },
          { text: 'Open Lots (Add/Edit)', onPress: () => navigation.navigate('Lots', { tripId: String(item.trip_id) }) },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={250}
        activeOpacity={0.9}
        style={styles.card}
      >
        {/* Top row: lot no + status pill + chevron */}
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '70%' }}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="inventory-2" size={18} color={PRIMARY_DARK} />
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {item.lot_no}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StatusPill status={item.status} />
            <MaterialIcons name="chevron-right" size={22} color={TEXT_MUTED} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Species / Weight / Grade */}
        <Row icon="set-meal" text={`${item.species || '—'} • ${weight.toFixed(2)} kg • Grade ${item.grade || '—'}`} />

        {/* Trip + Port */}
        <Row icon="directions-boat" text={`Trip: ${tripTitle}`} />
        <Row icon="place" text={`Port: ${port}`} />

        {/* Captured */}
        <Row icon="schedule" text={`Captured: ${captured}`} />

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <ActionBtn
            icon="assignment"
            label="View Trip"
            onPress={() => navigation.navigate('TripDetails', { id: item.trip_id })}
          />
          <ActionBtn
            icon="inventory"
            label="View Lots"
            onPress={() => navigation.navigate('LotDetails', { id: item.id })}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.page}>
      {Header}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={{ color: '#B91C1C', fontWeight: '600' }}>{error}</Text>
          <TouchableOpacity onPress={() => loadPage(1, true)} style={styles.retryBtn}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(it: FishLot) => String(it.id)}
        contentContainerStyle={{ padding: 12, paddingBottom: 48 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.2}
        onEndReached={onEndReached}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          !loading && !refreshing ? <EmptyState /> : null
        }
        onScroll={onScroll}
        scrollEventThrottle={16}
      />

      {showScrollTop ? (
        <TouchableOpacity
          onPress={() => listRef.current?.scrollToOffset({ animated: true, offset: 0 })}
          style={styles.fab}
          accessibilityLabel="Scroll to top"
        >
          <MaterialIcons name="keyboard-arrow-up" size={26} color="#fff" />
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

/** ---------- Small UI helpers ---------- */
function Row({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.rowLine}>
      <MaterialIcons name={icon as any} size={16} color={TEXT_MUTED} />
      <Text style={styles.muted} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={{ padding: 24, alignItems: 'center', gap: 8 }}>
      <MaterialIcons name="inventory" size={36} color={TEXT_MUTED} />
      <Text style={{ color: TEXT_MUTED }}>No Species found.</Text>
      <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>
        Pull down to refresh or change filters.
      </Text>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
      <MaterialIcons name={icon as any} size={16} color={PRIMARY_DARK} />
      <Text style={styles.actionBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function ScrollChips({
  items,
  active,
  onChipPress,
  counts,
}: {
  items: string[];
  active: string;
  onChipPress: (v: string) => void;
  counts: Record<string, number>;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {items.map(v => {
        const isActive = active === v;
        const label = v.charAt(0).toUpperCase() + v.slice(1);
        const count = v === 'all' ? undefined : counts[v];
        return (
          <TouchableOpacity
            key={v}
            onPress={() => onChipPress(v)}
            style={[
              styles.chip,
              isActive && styles.chipActive,
            ]}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {label}
              {typeof count === 'number' ? ` · ${count}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** ---------- Data helpers ---------- */
function toNumber(n: number | string | null | undefined) {
  if (n == null) return 0;
  const v = typeof n === 'string' ? parseFloat(n) : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function formatDateTime(iso: string) {
  // ISO -> "YYYY-MM-DD HH:mm"
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

/** ---------- Styles ---------- */
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: SURFACE },

  /* Header */
  headerWrap: { backgroundColor: PRIMARY, paddingBottom: 14 },
  headerBar: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34, height: 34, alignItems: 'center', justifyContent: 'center',
    borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginLeft: 4,
  },
  headerBand: {
    height: 54,
    backgroundColor: PRIMARY,
    overflow: 'hidden',
    position: 'relative',
  },
  bandAccent: {
    position: 'absolute',
    left: -38,
    top: -30,
    width: 160,
    height: 120,
    backgroundColor: ACCENT,
    opacity: 0.18,
    borderRadius: 18,
    transform: [{ rotate: '8deg' }],
  },

  /* Controls card (floats on header band) */
  controlsCard: {
    marginHorizontal: 12,
    marginTop: -26,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    ...(Platform.OS === 'android'
      ? { elevation: 2 }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
        }),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: TEXT_DARK,
    paddingVertical: 6,
  },
  clearBtn: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  filtersRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E9F6EA',
    borderColor: '#D6EED8',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sortChipText: { color: PRIMARY_DARK, fontWeight: '800', fontSize: 12 },

  /* Chips */
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: {
    backgroundColor: '#E9F6EA',
    borderColor: '#CFEAD2',
  },
  chipText: { color: TEXT_MUTED, fontWeight: '800', fontSize: 12 },
  chipTextActive: { color: PRIMARY_DARK },

  tinyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tinyChipText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  /* Error */
  errorBox: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    margin: 12,
    borderRadius: 10,
    padding: 12,
  },
  retryBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  /* Card */
  card: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFF',
    ...(Platform.OS === 'android'
      ? { elevation: 1 }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }),
  },
  iconCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#E9F6EA',
    borderWidth: 1,
    borderColor: '#D6EED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 16, fontWeight: '900', color: TEXT_DARK, maxWidth: '85%' },
  divider: { height: 8 },
  rowLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  muted: { color: TEXT_MUTED, fontSize: 13 },

  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4FAF5',
    borderColor: '#E1F1E4',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: { color: PRIMARY_DARK, fontWeight: '800', fontSize: 12 },

  /* FAB */
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'android'
      ? { elevation: 3 }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 4 },
        }),
  },

  /* Status pill */
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  pillText: { fontSize: 12, fontWeight: '700' },
});

/** Status pill with colors */
function StatusPill({ status }: { status?: string | null }) {
  const label = (status || '').toLowerCase();
  const bg =
    label === 'verified' ? '#DCFCE7' :
    label === 'pending'  ? '#FEF9C3' :
    label === 'rejected' ? '#FEE2E2' :
    '#E5E7EB';
  const border =
    label === 'verified' ? '#BBF7D0' :
    label === 'pending'  ? '#FDE68A' :
    label === 'rejected' ? '#FCA5A5' :
    '#E5E7EB';
  const color =
    label === 'verified' ? '#166534' :
    label === 'pending'  ? '#92400E' :
    label === 'rejected' ? '#991B1B' :
    '#374151';
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.pillText, { color }]}>{label || 'unknown'}</Text>
    </View>
  );
}
