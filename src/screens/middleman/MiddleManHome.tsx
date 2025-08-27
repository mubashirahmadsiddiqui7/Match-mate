/* eslint-disable react-native/no-inline-styles */
// src/screens/middleman/MiddleManHome.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import type { MiddleManStackParamList } from '../../app/navigation/stacks/MiddleManStack';
import PALETTE from '../../theme/palette';
import {
  fetchFishLots,
  type FishLot,
  type LotsPage,
} from '../../services/lots';

type Nav = NativeStackNavigationProp<MiddleManStackParamList, 'MiddleManHome'>;

const AVATAR = require('../../assets/images/placeholderIMG.png');

export default function MiddleManHome() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  // list state
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [lots, setLots] = useState<FishLot[]>([]);
  const [meta, setMeta] = useState<LotsPage['meta'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const loadingMoreRef = useRef(false);

  const load = useCallback(
    async (p = 1, q = query, replace = false) => {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      if (p === 1 && !replace) setLoading(true);
      try {
        const res = await fetchFishLots({
          page: p,
          per_page: 15,
          search: q?.trim() || undefined,
        });
        setMeta(res.meta);
        setPage(res.meta.current_page);
        setLots(prev => (replace || p === 1 ? res.items : [...prev, ...res.items]));
      } catch (e) {
        // non-fatal; surface as needed (Toast, Sentry, etc.)
        console.log('[MiddleManHome] load error', e);
      } finally {
        setLoading(false);
        setRefreshing(false);
        loadingMoreRef.current = false;
      }
    },
    [query],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(1, query, true);
  }, [load, query]);

  const onEndReached = useCallback(() => {
    if (!meta || page >= meta.last_page || loadingMoreRef.current) return;
    load(page + 1);
  }, [meta, page, load]);

  // initial load
  React.useEffect(() => {
    load(1, query, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => lots, [lots]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={PALETTE.green700}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={AVATAR} style={styles.avatar} />
          <View style={{marginLeft:-20}}>
            <Text style={styles.welcome}>Welcome back, Middle!</Text>
            <Text style={styles.subtle}>Marine Fisheries Department Portal</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => dispatch(logout())}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {/* Quick metrics & actions */}
      <View style={styles.metricsRow}>
        <MetricPill label="Account" value="Active" tone="success" />
        <MetricPill label="Distributions" value={`${meta?.total ?? 0}`} />
        <MetricPill label="Pending" value={estimatePending(filtered)} tone="warn" />
      </View>

      <View style={styles.quickRow}>
        <QuickButton label="Purchases" onPress={() => navigation.navigate('lotDetails')} icon="$" />
        <QuickButton label="Distributions" onPress={() => navigation.navigate('Distributions')} icon="🐠" />
        <QuickButton label="Assignments" onPress={() => navigation.navigate('MiddleManHome')} icon="🏢" />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Search by Distribution no., lot no.."
          placeholderTextColor={PALETTE.text600}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => load(1, query, true)}
          style={styles.search}
          returnKeyType="search"
        />
        <Pressable onPress={() => { setQuery(''); load(1, '', true); }} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator />
          <Text style={styles.loaderText}>Loading your lots…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PALETTE.green700} />
          }
          onEndReachedThreshold={0.2}
          onEndReached={onEndReached}
          ListHeaderComponent={<SectionHeader title="Distributions Given" />}
          ListEmptyComponent={<EmptyState onRetry={() => load(1, query, true)} />}
          renderItem={({ item }) => (
            <LotRow
              lot={item}
              onPress={() => navigation.navigate('lotDetails', { id: item.id })}
            />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          style={{ flex: 1 }}
        />
      )}
    </SafeAreaView>
  );
}

/* -------------------------- UI bits -------------------------- */

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function MetricPill({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'success' | 'warn';
}) {
  const bg =
    tone === 'success' ? '#E8F5E9' : tone === 'warn' ? '#FFF7E6' : '#F1F5F9';
  const fg =
    tone === 'success' ? '#1B5E20' : tone === 'warn' ? '#8A4B00' : '#111827';
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillLabel, { color: PALETTE.text600 }]}>{label}</Text>
      <Text style={[styles.pillValue, { color: fg }]}>{value}</Text>
    </View>
  );
}

function QuickButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.quickBtn}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function LotRow({ lot, onPress }: { lot: FishLot; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{lot.lot_no}</Text>
        <Badge tone={lot.status === 'pending' ? 'warn' : 'success'} text={lot.status} />
      </View>

      <View style={styles.cardGrid}>
        <KV label="Species" value={lot.species ?? '—'} />
        <KV label="Weight (kg)" value={String(lot.weight_kg ?? '—')} />
        <KV label="Grade" value={lot.grade ?? '—'} />
        <KV label="Port" value={lot.port_location ?? '—'} />
        <KV label="Captured" value={formatDate(lot.captured_at)} />
        <KV label="Fisherman" value={lot.user?.name ?? '—'} />
      </View>
    </Pressable>
  );
}

function Badge({ text, tone }: { text: string; tone: 'success' | 'warn' | 'neutral' }) {
  const bg = tone === 'success' ? '#DCFCE7' : tone === 'warn' ? '#FFEFD5' : '#E5E7EB';
  const fg = tone === 'success' ? '#166534' : tone === 'warn' ? '#9A3412' : '#374151';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No Distributions to show</Text>
      <Text style={styles.emptySub}>Try adjusting search or pull to refresh.</Text>
      <Pressable onPress={onRetry} style={styles.retryBtn}>
        <Text style={styles.retryText}>Reload</Text>
      </Pressable>
    </View>
  );
}

/* -------------------------- helpers -------------------------- */

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function estimatePending(items: FishLot[]) {
  return items.reduce((n, x) => (String(x.status).toLowerCase() === 'pending' ? n + 1 : n), 0);
}

/* -------------------------- styles -------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    backgroundColor: PALETTE.green700,
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 11 },
  welcome: { color: '#fff', fontSize: 18, fontWeight: '700' },
  subtle: { color: '#E6F3E7', fontSize: 12 },

  logoutBtn: {
    backgroundColor: '#ef2a07',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontWeight: '700' },

  metricsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 12 },
  pill: { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  pillLabel: { fontSize: 12, marginBottom: 4 },
  pillValue: { fontSize: 16, fontWeight: '700' },

  quickRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickIcon: { fontSize: 18, marginBottom: 4 },
  quickLabel: { fontWeight: '700', color: PALETTE.text900 },

  searchWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  search: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    color: PALETTE.text900,
  },
  clearBtn: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { color: PALETTE.text600, fontWeight: '600' },

  sectionHeader: { paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: PALETTE.text900 },

  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '800', fontSize: 15, color: PALETTE.text900 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  cardGrid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kv: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  kvLabel: { fontSize: 11, color: PALETTE.text600, marginBottom: 2 },
  kvValue: { fontWeight: '700', color: PALETTE.text900 },

  loader: { paddingTop: 48, alignItems: 'center' },
  loaderText: { marginTop: 8, color: PALETTE.text600 },

  empty: { paddingTop: 40, alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontWeight: '800', fontSize: 16, color: PALETTE.text900 },
  emptySub: { color: PALETTE.text600, marginTop: 6, textAlign: 'center' },
  retryBtn: {
    marginTop: 14,
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
