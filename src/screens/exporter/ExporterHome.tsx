/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExporterStackParamList } from '../../app/navigation/stacks/ExporterStack';
import { getTripCounts, type TripCounts } from '../../services/trips';
import { fetchFishLots, type FishLot } from '../../services/lots';
import { fetchPurchases, type FishPurchase } from '../../services/middlemanDistribution';
import { getUser, type User } from '../../services/users';
import { fetchTraceabilityRecords } from '../../services/traceability';
import PALETTE from '../../theme/palette';

type Nav = NativeStackNavigationProp<ExporterStackParamList, 'ExporterHome'>;

const APPBAR_BG = '#1f720d';

export default function ExporterHome() {
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();
  // const auth = useSelector((s: any) => s.auth);

  const [online, setOnline] = useState<boolean>(true);
  const [counts, setCounts] = useState<TripCounts | null>(null);
  const [purchases, setPurchases] = useState<FishPurchase[]>([]);
  const [_lots, setLots] = useState<FishLot[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errText, setErrText] = useState<string | null>(null);

  // Connectivity banner
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => setOnline(!!state.isConnected));
    NetInfo.fetch().then(s => setOnline(!!s.isConnected)).catch(() => {});
    return () => { unsub && unsub(); };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrText(null);
    try {
      const [tripCountsRes, purchasesRes, lotsRes, recordsRes, userRes] = await Promise.allSettled([
        getTripCounts(),
        fetchPurchases({ page: 1, per_page: 10 }),
        fetchFishLots({ page: 1, per_page: 10 }),
        fetchTraceabilityRecords({}),
        getUser(),
      ]);

      if (tripCountsRes.status === 'fulfilled') {
        setCounts(tripCountsRes.value.totals);
      }
      if (purchasesRes.status === 'fulfilled') {
        setPurchases(purchasesRes.value.items);
      }
      if (lotsRes.status === 'fulfilled') {
        setLots(lotsRes.value.items);
      }
      if (recordsRes.status === 'fulfilled') {
        setRecords(recordsRes.value);
      }
      if (userRes.status === 'fulfilled') {
        setUser(userRes.value);
      }
    } catch (e: any) {
      setErrText(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const confirmLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch<any>(logout()) },
    ]);
  }, [dispatch]);

  const goAllTrips = useCallback(() => {
    navigation.navigate('AllTrips');
  }, [navigation]);

  const goPurchases = useCallback(() => {
    navigation.navigate('PurchasesList');
  }, [navigation]);

  const goCreatePurchase = useCallback(() => {
    navigation.navigate('CreatePurchase');
  }, [navigation]);

  const goRecords = useCallback(() => {
    navigation.navigate('viewFInalProducts');
  }, [navigation]);

  const goNewRecord = useCallback(() => {
    navigation.navigate('traceabilityForm');
  }, [navigation]);

  const activeTrips = useMemo(() => {
    return counts?.active || 0;
  }, [counts]);

  const totalTrips = useMemo(() => {
    return counts?.all || 0;
  }, [counts]);

  const totalPurchases = useMemo(() => {
    return purchases.length;
  }, [purchases]);

  const totalRecords = useMemo(() => {
    return records.length;
  }, [records]);

  const recordsByStatus = useMemo(() => {
    const statusCounts = {
      approved: 0,
      pending: 0,
      rejected: 0,
    };
    
    records.forEach(record => {
      const status = record.status?.toLowerCase();
      if (status === 'approved') statusCounts.approved++;
      else if (status === 'pending') statusCounts.pending++;
      else if (status === 'rejected') statusCounts.rejected++;
    });
    
    return statusCounts;
  }, [records]);

  const name = useMemo(() => {
    return user?.name || user?.first_name || 'Exporter';
  }, [user]);

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.green50 }}>
      <StatusBar backgroundColor={APPBAR_BG} barStyle="light-content" />

      {/* App Bar */}
      <View style={styles.appbar}>
        <View style={styles.appbarSide} />
        <Text style={styles.appbarTitle}>Exporter Dashboard</Text>
        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Icon name="logout" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Online/Offline Banner */}
              <View
        style={[
          styles.banner,
          {
            backgroundColor: online ? PALETTE.green50 : '#FFF7ED',
            borderColor: online ? '#C8E6C9' : '#FED7AA',
          },
        ]}
      >
        <Icon
          name={online ? 'wifi' : 'wifi-off'}
          size={18}
          color={online ? PALETTE.green700 : PALETTE.warn}
        />
        <Text
                style={{
            marginLeft: 8,
            color: online ? PALETTE.green700 : PALETTE.warn,
            flex: 1,
          }}
        >
          {online ? 'Online — live data enabled' : 'Offline — showing cached/limited data'}
        </Text>
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => [styles.refreshChip, pressed && { opacity: 0.85 }]}
        >
          <Icon name="refresh" size={16} color={PALETTE.text700} />
          <Text style={{ color: PALETTE.text700, marginLeft: 6 }}>Refresh</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome / Header Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.avatar}>
              <Icon name="business" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>Welcome back, {name}!</Text>
              <Text style={styles.subtle}>
                You're logged into the Marine Fisheries Department Portal as an Exporter.
              </Text>
            </View>
          </View>

          <View style={styles.quickRow}>
            <Chip icon="verified-user" label="Secure" tone="ok" />
            <Chip icon="speed" label="Fast access" tone="info" />
            <Chip icon="integration-instructions" label="API connected" tone={online ? 'ok' : 'warn'} />
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Profile</Text>

          <Row icon="person" label="Full Name" value={name} />
          <Row icon="mail" label="Email Address" value={user?.email || '—'} />
          <Row icon="phone" label="Phone Number" value={user?.phone || '—'} />

          <View style={[styles.row, { marginTop: 8 }]}>
            <Icon name="verified" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Account Status</Text>
            <View style={{ flex: 1 }} />
            <StatusPill text="Active" tone="ok" />
          </View>

          <View style={styles.divider} />

          <Row icon="business" label="Company Type" value="Exporter" />
          <Row icon="location-on" label="Location" value={user?.port_location || 'Not specified'} />
        </View>

        {/* Trips Overview */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trips Overview</Text>
            <Pressable onPress={goAllTrips} style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.85 }]}>
              <Icon name="list" size={18} color={PALETTE.info} />
              <Text style={{ color: PALETTE.info, marginLeft: 6, fontWeight: '600' }}>View all</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={PALETTE.green700} />
              <Text style={{ color: PALETTE.text600, marginTop: 8 }}>Loading stats…</Text>
            </View>
          ) : errText ? (
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ color: PALETTE.warn }}>{errText}</Text>
            </View>
          ) : (
            <View style={styles.statGrid}>
              <StatCard icon="inbox" label="All Trips" value={totalTrips} onPress={goAllTrips} />
              <StatCard icon="navigation" label="Active Trips" value={activeTrips} onPress={goAllTrips} tone="info" />
              </View>
          )}
        </View>

        {/* Purchases Overview */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Purchases</Text>
            <Pressable onPress={goPurchases} style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.85 }]}>
              <Icon name="list" size={18} color={PALETTE.info} />
              <Text style={{ color: PALETTE.info, marginLeft: 6, fontWeight: '600' }}>View all</Text>
            </Pressable>
          </View>

          <View style={styles.statGrid}>
            <StatCard icon="shopping-cart" label="All Purchases" value={totalPurchases} onPress={goPurchases} />
            <StatCard icon="add-shopping-cart" label="Create Purchase" value="+" onPress={goCreatePurchase} tone="ok" />
          </View>
        </View>

        {/* Records Overview */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Records</Text>
            <Pressable onPress={goRecords} style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.85 }]}>
              <Icon name="list" size={18} color={PALETTE.info} />
              <Text style={{ color: PALETTE.info, marginLeft: 6, fontWeight: '600' }}>View all</Text>
            </Pressable>
          </View>

          <View style={styles.statGrid}>
            <StatCard icon="description" label="All Records" value={totalRecords} onPress={goRecords} />
            <StatCard icon="check-circle" label="Approved" value={recordsByStatus.approved} onPress={goRecords} tone="ok" />
            <StatCard icon="schedule" label="Pending" value={recordsByStatus.pending} onPress={goRecords} tone="warn" />
            <StatCard icon="cancel" label="Rejected" value={recordsByStatus.rejected} onPress={goRecords} tone="error" />
            <StatCard icon="add" label="New Record" value="+" onPress={goNewRecord} tone="ok" />
          </View>
        </View>

        {/* Companies Section */}
        {/*   */}

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionGrid}>
            <ActionTile
              icon="shopping-cart"
              title="All Purchases"
              subtitle="View purchase history"
              onPress={goPurchases}
            />
            <ActionTile
              icon="add-shopping-cart"
              title="Create Purchase"
              subtitle="Add new purchase"
              onPress={goCreatePurchase}
            />
            <ActionTile
              icon="description"
              title="View Records"
              subtitle="Browse all records"
              onPress={goRecords}
            />
            <ActionTile
              icon="add"
              title="New Record"
              subtitle="Create traceability record"
              onPress={goNewRecord}
            />
          </View>
        </View>

        {/* Logout (secondary) */}
        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.9 }]}
        >
          <Icon name="logout" size={18} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '700' }}>Logout</Text>
        </Pressable>

        {/* Footer space */}
        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}
/* -------------------- tiny UI atoms -------------------- */
function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={18} color={PALETTE.text600} style={{ marginRight: 10 }} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function StatusPill({ text, tone = 'ok' }: { text: string; tone?: 'ok' | 'warn' | 'error' | 'info' }) {
  const colors = {
    ok: { bg: '#E8F5E9', fg: PALETTE.green700 },
    warn: { bg: '#FFF4E5', fg: PALETTE.warn },
    error: { bg: '#FFEBEE', fg: PALETTE.error },
    info: { bg: '#E3F2FD', fg: PALETTE.info },
  }[tone];
  return (
    <View style={{ backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      <Text style={{ color: colors.fg, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

function Chip({ icon, label, tone = 'default' }: { icon?: string; label: string; tone?: 'ok'|'warn'|'error'|'info'|'default' }) {
  const bg =
    tone === 'ok' ? '#E8F5E9' :
    tone === 'warn' ? '#FFF4E5' :
    tone === 'error' ? '#FFEBEE' :
    tone === 'info' ? '#E3F2FD' : '#F1F5F9';
  const color =
    tone === 'ok' ? PALETTE.green700 :
    tone === 'warn' ? PALETTE.warn :
    tone === 'error' ? PALETTE.error :
    tone === 'info' ? PALETTE.info : PALETTE.text700;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      {icon ? <Icon name={icon} size={14} color={color} style={{ marginRight: 6 }} /> : null}
      <Text style={{ color, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  onPress,
  tone = 'default',
}: {
  icon: string;
  label: string;
  value: number | string;
  onPress?: () => void;
  tone?: 'default' | 'ok' | 'warn' | 'error' | 'info';
}) {
  const toneBg = {
    default: PALETTE.surface,
    ok: '#F0FDF4',
    warn: '#FFF7ED',
    error: '#FEF2F2',
    info: '#EFF6FF',
  }[tone];
  const toneIcon = {
    default: PALETTE.text600,
    ok: PALETTE.green700,
    warn: PALETTE.warn,
    error: PALETTE.error,
    info: PALETTE.info,
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        { backgroundColor: toneBg, borderColor: PALETTE.border },
        pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
      ]}
    >
      <Icon name={icon} size={20} color={toneIcon} />
      <Text style={{ color: PALETTE.text700, marginTop: 6 }}>{label}</Text>
      <Text style={{ color: PALETTE.text900, fontWeight: '800', fontSize: 18, marginTop: 2 }}>
        {value}
      </Text>
    </Pressable>
  );
}

function ActionTile({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
    >
      <View style={styles.tileIcon}>
        <Icon name={icon} size={20} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: PALETTE.text900, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: PALETTE.text600, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <Icon name="chevron-right" size={22} color={PALETTE.text600} />
    </Pressable>
  );
}

/* -------------------- styles -------------------- */
const styles = StyleSheet.create({
  appbar: {
    backgroundColor: APPBAR_BG,
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
    height: 56 + (Platform.OS === 'ios' ? 10 : 0),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  appbarSide: { width: 40, height: 40 },
  appbarTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  refreshChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  card: {
    backgroundColor: PALETTE.surface,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  h1: { color: PALETTE.text900, fontSize: 20, fontWeight: '800' },
  subtle: { color: PALETTE.text600, marginTop: 4 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { color: PALETTE.text900, fontSize: 16, fontWeight: '800', flex: 1 },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rowLabel: { color: PALETTE.text600 },
  rowValue: { color: PALETTE.text900, fontWeight: '700', maxWidth: '60%' },
  divider: { height: 1, backgroundColor: PALETTE.border, marginVertical: 10 },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 10,
  },
  statCard: {
    width: '30%',
    minWidth: 110,
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
  actionGrid: { marginTop: 10 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    borderRadius: 12,
    marginBottom: 10,
  },
  tileIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: PALETTE.green700,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutBtn: {
    marginHorizontal: 14, marginTop: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PALETTE.error,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: PALETTE.green700,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
});
