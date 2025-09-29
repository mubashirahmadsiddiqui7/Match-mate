/* eslint-disable react-native/no-inline-styles */
// src/screens/middleman/MiddleManHome.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import type { MiddleManStackParamList } from '../../app/navigation/stacks/MiddleManStack';
import PALETTE from '../../theme/palette';
import {
  fetchDistributions,
  fetchAssignments,
  fetchPurchases,
  type FishLotDistribution,
  type MiddlemanAssignment,
  type MiddlemanPurchase,
  type PaginatedResponse,
} from '../../services/middlemanDistribution';
import { getUser, type User } from '../../services/users';

type Nav = NativeStackNavigationProp<MiddleManStackParamList, 'MiddleManHome'>;

const APPBAR_BG = '#1f720d';

export default function MiddleManHome() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  // list state
  const [, setDistributions] = useState<FishLotDistribution[]>([]);
  const [assignments, setAssignments] = useState<MiddlemanAssignment[]>([]);
  const [purchases, setPurchases] = useState<MiddlemanPurchase[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [meta, setMeta] = useState<PaginatedResponse<FishLotDistribution>['meta'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const loadingMoreRef = useRef(false);
  const [noCompanyModal, setNoCompanyModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const load = useCallback(
    async (replace = false) => {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      if (!replace) setLoading(true);
      try {
        // Load all data in parallel
        const [distributionsRes, assignmentsRes, purchasesRes, userRes] = await Promise.allSettled([
          fetchDistributions({
            page: 1,
            per_page: 15,
          }),
          fetchAssignments({
            page: 1,
            per_page: 15,
          }),
          fetchPurchases({
            page: 1,
            per_page: 15,
          }),
          getUser(),
        ]);

        if (distributionsRes.status === 'fulfilled') {
          setMeta(distributionsRes.value.meta);
          setDistributions(distributionsRes.value.items);
        }
        if (assignmentsRes.status === 'fulfilled') {
          setAssignments(assignmentsRes.value.items);
        }
        if (purchasesRes.status === 'fulfilled') {
          setPurchases(purchasesRes.value.items);
        }
        if (userRes.status === 'fulfilled') {
          setUser(userRes.value);
        }
      } catch (e) {
        // non-fatal; surface as needed (Toast, Sentry, etc.)
        console.log('[MiddleManHome] load error', e);
      } finally {
        setLoading(false);
        setRefreshing(false);
        loadingMoreRef.current = false;
      }
    },
    [],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  // initial load
  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingPurchases = useMemo(() => 
    purchases.filter(p => p.status === 'pending'), [purchases]
  );

  const totalDistributions = meta?.total ?? 0;
  const totalAssignments = assignments.length;
  const totalPendingPurchases = pendingPurchases.length;

  const confirmLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try {
          setIsLoggingOut(true);
          await dispatch<any>(logout());
        } finally {
          setIsLoggingOut(false);
        }
      } },
    ]);
  }, [dispatch]);

  const goDistributions = useCallback(() => {
    navigation.navigate('Distributions' as any);
  }, [navigation]);

  const goAssignments = useCallback(() => {
    navigation.navigate('Assignments' as any);
  }, [navigation]);

  const goPurchases = useCallback(() => {
    navigation.navigate('Purchases' as any);
  }, [navigation]);

  const goCreatePurchase = useCallback(() => {
    const hasActiveCompany = assignments?.some(a => (a?.status || '').toLowerCase() === 'active');
    if (!hasActiveCompany) {
      setNoCompanyModal(true);
      return;
    }
    navigation.navigate('CreatePurchase' as any);
  }, [navigation, assignments]);

  // Computed values from user data
  const name = useMemo(() => {
    return user?.name || user?.first_name || 'Middleman';
  }, [user]);

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.green50 }}>
      <StatusBar backgroundColor={APPBAR_BG} barStyle="light-content" />

      {/* App Bar */}
      <View style={styles.appbar}>
        <View style={styles.appbarSide} />
        <Text style={styles.appbarTitle}>Middleman Dashboard</Text>
        <Pressable
          onPress={confirmLogout}
          disabled={isLoggingOut}
          style={({ pressed }) => [styles.iconBtn, (pressed || isLoggingOut) && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          {isLoggingOut ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="logout" size={22} color="#fff" />}
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
                You're logged into the Marine Fisheries Department Portal as a Middleman.
              </Text>
            </View>
          </View>

          <View style={styles.quickRow}>
            <Chip icon="verified-user" label="Secure" tone="ok" />
            <Chip icon="speed" label="Fast access" tone="info" />
            <Chip icon="integration-instructions" label="API connected" tone="ok" />
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
            <StatusPill text={user?.is_active ? "Active" : "Inactive"} tone={user?.is_active ? "ok" : "error"} />
          </View>

          <View style={styles.divider} />

          <Row icon="business" label="License Number" value={user?.national_id || '—'} />
          <Row icon="location-on" label="Business Type" value="Fish Distribution" />
          <Row icon="verified" label="Verification Status" value={user?.is_verified ? "Verified" : "Pending"} />
          
          {user?.address && (
            <Row icon="home" label="Address" value={user.address} />
          )}
          {user?.city && (
            <Row icon="location-city" label="City" value={user.city} />
          )}
          {user?.province && (
            <Row icon="map" label="Province" value={user.province} />
          )}
        </View>

        {/* Distributions Overview */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Distributions Overview</Text>
            <Pressable onPress={goDistributions} style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.85 }]}>
              <Icon name="list" size={18} color={PALETTE.info} />
              <Text style={{ color: PALETTE.info, marginLeft: 6, fontWeight: '600' }}>View all</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={PALETTE.green700} />
              <Text style={{ color: PALETTE.text600, marginTop: 8 }}>Loading stats…</Text>
            </View>
          ) : (
            <View style={styles.statGrid}>
              <StatCard icon="inventory" label="All Distributions" value={totalDistributions} onPress={goDistributions} />
              <StatCard icon="assignment" label="Assignments" value={totalAssignments} onPress={goAssignments} tone="info" />
              <StatCard icon="shopping-cart" label="Pending Purchases" value={totalPendingPurchases} onPress={goPurchases} tone="warn" />
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionGrid}>
            <ActionTile
              icon="inventory"
              title="All Distributions"
              subtitle="View all distributions"
              onPress={goDistributions}
            />
            <ActionTile
              icon="assignment"
              title="All Assignments"
              subtitle="View assignments"
              onPress={goAssignments}
            />
            <ActionTile
              icon="shopping-cart"
              title="All Purchases"
              subtitle="Manage purchases"
              onPress={goPurchases}
            />
            <ActionTile
              icon="add-shopping-cart"
              title="Create Purchase"
              subtitle="Start a new purchase"
              onPress={goCreatePurchase}
            />
          </View>
        </View>

        {/* Logout (secondary) */}
        <Pressable
          onPress={confirmLogout}
          disabled={isLoggingOut}
          style={({ pressed }) => [styles.logoutBtn, (pressed || isLoggingOut) && { opacity: 0.9 }]}
        >
          {isLoggingOut ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="logout" size={18} color="#fff" />}
          <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '700' }}>{isLoggingOut ? 'Logging out…' : 'Logout'}</Text>
        </Pressable>

        {/* Footer space */}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* No Company Assigned Modal */}
      <Modal visible={noCompanyModal} animationType="fade" transparent onRequestClose={() => setNoCompanyModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Icon name="business" size={28} color={PALETTE.green700} />
            </View>
            <Text style={styles.modalTitle}>No Company Assigned</Text>
            <Text style={styles.modalText}>
              You cannot create a purchase because no company is assigned to your account.
            </Text>
            <Text style={[styles.modalText, { marginTop: 6 }]}>Please contact MFD staff to assign a company to you.</Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setNoCompanyModal(false);
                  navigation.navigate('Assignments' as any);
                }}
                style={({ pressed }) => [styles.modalSecondaryBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.modalSecondaryText}>View Assignments</Text>
              </Pressable>
              <Pressable
                onPress={() => setNoCompanyModal(false)}
                style={({ pressed }) => [styles.modalPrimaryBtn, pressed && { opacity: 0.95 }]}
              >
                <Text style={styles.modalPrimaryText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {isLoggingOut && (
        <View style={styles.overlay}> 
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={PALETTE.green700} />
            <Text style={{ marginTop: 10, color: PALETTE.text700, fontWeight: '600' }}>Signing you out…</Text>
          </View>
        </View>
      )}
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
    tone === 'ok' ? '#E8F5E9' : tone === 'warn' ? '#FFF4E5' : tone === 'error' ? '#FFEBEE' : tone === 'info' ? '#E3F2FD' : '#F1F5F9';
  const fg =
    tone === 'ok' ? PALETTE.green700 : tone === 'warn' ? PALETTE.warn : tone === 'error' ? PALETTE.error : tone === 'info' ? PALETTE.info : PALETTE.text600;
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, flexDirection: 'row', alignItems: 'center' }}>
      {icon && <Icon name={icon} size={14} color={fg} style={{ marginRight: 4 }} />}
      <Text style={{ color: fg, fontWeight: '600', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, onPress, tone = 'default' }: { icon: string; label: string; value: string | number; onPress: () => void; tone?: 'ok'|'warn'|'error'|'info'|'default' }) {
  const colors = {
    ok: { bg: '#E8F5E9', fg: PALETTE.green700, icon: PALETTE.green700 },
    warn: { bg: '#FFF4E5', fg: PALETTE.warn, icon: PALETTE.warn },
    error: { bg: '#FFEBEE', fg: PALETTE.error, icon: PALETTE.error },
    info: { bg: '#E3F2FD', fg: PALETTE.info, icon: PALETTE.info },
    default: { bg: '#F1F5F9', fg: PALETTE.text700, icon: PALETTE.text600 },
  }[tone];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { backgroundColor: colors.bg, padding: 16, borderRadius: 12, flex: 1, alignItems: 'center', marginHorizontal: 4 },
        pressed && { opacity: 0.85 }
      ]}
    >
      <Icon name={icon} size={24} color={colors.icon} style={{ marginBottom: 8 }} />
      <Text style={{ color: colors.fg, fontWeight: '700', fontSize: 20, marginBottom: 4 }}>{value}</Text>
      <Text style={{ color: colors.fg, fontSize: 12, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

function ActionTile({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { backgroundColor: '#fff', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
        pressed && { opacity: 0.85 }
      ]}
    >
      <View style={{ backgroundColor: PALETTE.green50, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Icon name={icon} size={20} color={PALETTE.green700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: PALETTE.text900, marginBottom: 2 }}>{title}</Text>
        <Text style={{ fontSize: 14, color: PALETTE.text600 }}>{subtitle}</Text>
      </View>
      <Icon name="chevron-right" size={20} color={PALETTE.text400} />
    </Pressable>
  );
}

/* -------------------------- styles -------------------------- */

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: APPBAR_BG,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appbarSide: { width: 40 },
  appbarTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  iconBtn: { padding: 8 },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PALETTE.green700,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  h1: { fontSize: 20, fontWeight: '700', color: PALETTE.text900, marginBottom: 4 },
  subtle: { fontSize: 14, color: PALETTE.text600, lineHeight: 20 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: PALETTE.text900, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  linkBtn: { flexDirection: 'row', alignItems: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rowLabel: { fontSize: 14, color: PALETTE.text600, flex: 1 },
  rowValue: { fontSize: 14, color: PALETTE.text900, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },

  statGrid: { flexDirection: 'row', gap: 8 },
  actionGrid: { gap: 8 },

  logoutBtn: {
    backgroundColor: '#ef2a07',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
    borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
  },

  // modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PALETTE.green50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text900,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: PALETTE.text600,
    textAlign: 'center',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  modalSecondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalSecondaryText: {
    color: PALETTE.text700,
    fontWeight: '700',
  },
  modalPrimaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: PALETTE.green700,
  },
  modalPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
});