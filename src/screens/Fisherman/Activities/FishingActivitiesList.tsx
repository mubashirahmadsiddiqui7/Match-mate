// src/screens/Fisherman/Activities/FishingActivitiesList.tsx
/* eslint-disable react-native/no-inline-styles */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';
import {
  listFishingActivities,
  completeFishingActivity,
  type FishingActivity,
} from '../../../services/fishingActivity';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Nav = NativeStackNavigationProp<
  FishermanStackParamList,
  'FishingActivities'
>;

const PAGE_SIZE = 15;
const STATUS_TABS = ['all', 'active', 'completed', 'pending'] as const;
type StatusKey = (typeof STATUS_TABS)[number];

export default function FishingActivitiesListScreen() {
  const navigation = useNavigation<Nav>();

  // filters
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusKey>('all');

  // data
  const [items, setItems] = useState<FishingActivity[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (p = 1, append = false) => {
      try {
        if (p === 1) setLoading(true);
        const { items: rows, meta } = await listFishingActivities({
          page: p,
          per_page: PAGE_SIZE,
          q: query.trim() || undefined,
          status: status === 'all' ? undefined : status,
        });
        setPage(meta.current_page);
        setLastPage(meta.last_page);
        setItems(prev => (append ? [...prev, ...rows] : rows));
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to load activities');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [query, status],
  );

  useEffect(() => {
    // debounce search
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, false), 250);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, status, load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(1, false);
  }, [load]);

  const onEndReached = useCallback(() => {
    if (loadingMore || loading || page >= lastPage) return;
    setLoadingMore(true);
    load(page + 1, true);
  }, [loadingMore, loading, page, lastPage, load]);

  const headerTitle = useMemo(() => 'Fishing Activities', []);

  const onPressView = (a: FishingActivity) => {
    navigation.navigate('FishingActivityDetails', { id: a.id });
  };

  const onPressEdit = (a: FishingActivity) => {
    navigation.navigate('FishingActivityEdit', { id: a.id });
  };

  const onPressComplete = async (a: FishingActivity) => {
    Alert.alert('Complete Activity', 'Mark this activity as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        style: 'destructive',
        onPress: async () => {
          try {
            await completeFishingActivity(a.id);
            // refresh list
            load(1, false);
          } catch (e: any) {
            Alert.alert('Failed', e?.message || 'Could not complete activity');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: FishingActivity }) => (
    <ActivityCard
      item={item}
      onView={onPressView}
      onEdit={onPressEdit}
      onComplete={onPressComplete}
    />
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#1B5E20' }}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" translucent={false} />
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color="#64748B" />
          <TextInput
            placeholder="Search by trip code or #"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Icon name="close" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        <View style={styles.tabs}>
          {STATUS_TABS.map(s => {
            const active = status === s;
            return (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {s[0].toUpperCase() + s.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: '#475569' }}>
            Loading activities…
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={it => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 16,
            paddingTop: 4,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={onEndReached}
          ListEmptyComponent={
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: '#64748B' }}>No activities found.</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}
      </View>
    </SafeAreaView>
  );
}

function ActivityCard({
  item,
  onView,
  onEdit,
  onComplete,
}: {
  item: FishingActivity;
  onView: (a: FishingActivity) => void;
  onEdit: (a: FishingActivity) => void;
  onComplete: (a: FishingActivity) => void;
}) {
  const tripLabel = String(item.trip_code ?? item.trip_id);
  const subtitle = `Activity #${item.activity_number} • ${humanTime(
    item.activity_time,
  )}`;
  const gps = toGps(item.gps_latitude, item.gps_longitude);

  return (
    <View style={styles.card}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <Text style={styles.cardTitle} numberOfLines={1}>
          {tripLabel}
        </Text>
        <StatusPill status={(item.status as any) ?? 'active'} />
      </View>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      <View style={{ height: 6 }} />
      <RowKV label="Netting" value={humanTime(item.time_of_netting)} />
      <RowKV label="Hauling" value={humanTime(item.time_of_hauling)} />
      <RowKV label="GPS" value={gps} />
      <RowKV
        label="Mesh / Net"
        value={`${safeNum(item.mesh_size)}" • ${safeNum(
          item.net_length,
        )}m × ${safeNum(item.net_width)}m`}
      />

      {/* <View style={styles.cardActions}>
        <ActionBtn
          label="View"
          icon="visibility"
          onPress={() => onView(item)}
        />
      </View> */}
    </View>
  );
}

function ActionBtn({
  label,
  icon,
  onPress,
  danger,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, danger && styles.btnDanger]}
    >
      <Icon name={icon} size={18} color={danger ? '#fff' : '#0F172A'} />
      <Text style={[styles.btnText, danger && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; text: string }> = {
    active: { bg: '#E0F2FE', fg: '#075985', text: 'Active' },
    completed: { bg: '#DCFCE7', fg: '#166534', text: 'Completed' },
    pending: { bg: '#FEF9C3', fg: '#854D0E', text: 'Pending' },
    cancelled: { bg: '#FEE2E2', fg: '#991B1B', text: 'Cancelled' },
  };
  const c = map[status] ?? map['active'];
  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text style={{ color: c.fg, fontWeight: '700', fontSize: 12 }}>
        {c.text}
      </Text>
    </View>
  );
}

function RowKV({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 2,
      }}
    >
      <Text style={{ color: '#64748B', fontSize: 12 }}>{label}</Text>
      <Text
        style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function humanTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
function toGps(lat?: string | number | null, lng?: string | number | null) {
  if (lat == null || lng == null || lat === '' || lng === '') return '—';
  const a = Number(lat),
    b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return '—';
  return `${a.toFixed(5)}, ${b.toFixed(5)}`;
}
function safeNum(n: any) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  return Number.isFinite(v) ? String(v) : String(n);
}

/* ---- styles ---- */
const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1B5E20',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  iconBtn: { padding: 8, borderRadius: 999 },

  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },

  filters: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  searchBox: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: { flex: 1, color: '#0F172A' },

  tabs: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tab: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  tabActive: { backgroundColor: '#14532D', borderColor: '#14532D' },
  tabText: { color: '#0F172A', fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#fff' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { fontWeight: '800', color: '#0F172A', maxWidth: '60%' },
  cardSubtitle: { color: '#475569', fontSize: 12 },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: {
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  btnText: { color: '#0F172A', fontWeight: '700', fontSize: 12 },
  btnDanger: { backgroundColor: '#B91C1C', borderColor: '#B91C1C' },
});
