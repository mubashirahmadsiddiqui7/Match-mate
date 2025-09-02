/* eslint-disable react-native/no-inline-styles */
// src/screens/middleman/MiddleManHome.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
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
  type FishPurchase,
  type PaginatedResponse,
  confirmPurchase,
  getStatusColor,
  getStatusText,
  formatDate,
  formatDateTime,
} from '../../services/middlemanDistribution';

const { width: screenWidth } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<MiddleManStackParamList, 'MiddleManHome'>;

const AVATAR = require('../../assets/images/placeholderIMG.png');

export default function MiddleManHome() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  // list state
  const [distributions, setDistributions] = useState<FishLotDistribution[]>([]);
  const [assignments, setAssignments] = useState<MiddlemanAssignment[]>([]);
  const [purchases, setPurchases] = useState<FishPurchase[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<FishLotDistribution>['meta'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const loadingMoreRef = useRef(false);

  const load = useCallback(
    async (replace = false) => {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      if (!replace) setLoading(true);
      try {
        // Load distributions
        const distributionsRes = await fetchDistributions({
          page: 1,
          per_page: 15,
        });
        
        // Load assignments
        const assignmentsRes = await fetchAssignments({
          page: 1,
          per_page: 15,
        });
        
        // Load purchases
        const purchasesRes = await fetchPurchases({
          page: 1,
          per_page: 15,
        });

        setMeta(distributionsRes.meta);
        setDistributions(distributionsRes.items);
        setAssignments(assignmentsRes.items);
        setPurchases(purchasesRes.items);
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

  // Mock middleman data - replace with actual user data
  const middlemanInfo = {
    name: "Hamza Middleman",
    email: "middle.man@gmail.com",
    phone: "03216598562",
    license: "Lic-1212",
    status: "Active",
    joinDate: "August 28, 2025",
    totalDistributions: totalDistributions,
    totalAssignments: totalAssignments,
    pendingPurchases: totalPendingPurchases,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={PALETTE.green700}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PALETTE.green700} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Image source={AVATAR} style={styles.avatar} />
              <View style={styles.statusIndicator} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.welcome}>Welcome back, {middlemanInfo.name}!</Text>
              <Text style={styles.subtle}>Marine Fisheries Department Portal</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{middlemanInfo.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Middleman Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>📋 Middleman Information</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>📧 Email</Text>
              <Text style={styles.infoValue}>{middlemanInfo.email}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>📞 Phone</Text>
              <Text style={styles.infoValue}>{middlemanInfo.phone}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>🪪 License</Text>
              <Text style={styles.infoValue}>{middlemanInfo.license}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>📅 Join Date</Text>
              <Text style={styles.infoValue}>{middlemanInfo.joinDate}</Text>
            </View>
          </View>
        </View>

        {/* Quick metrics & actions */}
        <View style={styles.metricsRow}>
          <MetricPill label="Distributions" value={`${totalDistributions}`} />
          <MetricPill label="Assignments" value={`${totalAssignments}`} />
          <MetricPill label="Pending Purchases" value={totalPendingPurchases} tone="warn" />
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>🚀 Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            <QuickButton 
              label="All Distributions" 
              onPress={() => navigation.navigate('Distributions')} 
              icon="🐠" 
              description="View all distributions"
            />
            {/* <QuickButton 
              label="Add New Distribution" 
              onPress={() => navigation.navigate('AddDistribution')} 
              icon="➕" 
              description="Create new distribution"
            /> */}
            <QuickButton 
              label="All Assignments" 
              onPress={() => navigation.navigate('Assignments')} 
              icon="🏢" 
              description="View assignments"
            />
            <QuickButton 
              label="All Purchases" 
              onPress={() => navigation.navigate('Purchases')} 
              icon="💰" 
              description="Manage purchases"
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.recentActivityTitle}>📊 Recent Activity</Text>
          
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={PALETTE.green700} />
              <Text style={styles.loaderText}>Loading recent activity...</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {distributions.slice(0, 3).map((distribution, index) => (
                <View key={distribution.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Text style={styles.activityIconText}>🐠</Text>
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Distribution #{distribution.id}</Text>
                    <Text style={styles.activitySubtitle}>
                      {distribution.total_quantity_kg} KG • {formatDate(distribution.created_at)}
                    </Text>
                  </View>
                  <View style={[styles.activityStatus, { backgroundColor: getStatusColor(distribution.verification_status) }]}>
                    <Text style={styles.activityStatusText}>
                      {distribution.verification_status_label || getStatusText(distribution.verification_status)}
                    </Text>
                  </View>
                </View>
              ))}
              
              {distributions.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>📋</Text>
                  <Text style={styles.emptyStateTitle}>No Recent Activity</Text>
                  <Text style={styles.emptyStateSubtitle}>Your recent distributions will appear here</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Logout Button */}
      <Pressable
        accessibilityRole="button"
        onPress={() => dispatch(logout())}
        style={styles.floatingLogoutBtn}
      >
        <Text style={styles.floatingLogoutText}>Logout</Text>
      </Pressable>
    </SafeAreaView>
  );
}

/* -------------------------- UI bits -------------------------- */

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
  description,
  onPress,
}: {
  label: string;
  icon: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.quickBtn}>
      <View style={styles.quickBtnIcon}>
        <Text style={styles.quickIcon}>{icon}</Text>
      </View>
      <View style={styles.quickBtnContent}>
        <Text style={styles.quickLabel}>{label}</Text>
        <Text style={styles.quickDescription}>{description}</Text>
      </View>
      <View style={styles.quickBtnArrow}>
        <Text style={styles.arrowIcon}>→</Text>
      </View>
    </Pressable>
  );
}

/* -------------------------- styles -------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },

  header: {
    backgroundColor: PALETTE.green700,
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#fff',
  },
  headerInfo: {
    flex: 1,
  },
  welcome: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtle: { color: '#E6F3E7', fontSize: 16, marginBottom: 12 },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#1B5E20',
    fontSize: 13,
    fontWeight: '700',
  },

  floatingLogoutBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#ef2a07',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 1000,
  },
  floatingLogoutText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 14,
    textAlign: 'center',
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    marginHorizontal: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  infoCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.text900,
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  infoItem: {
    width: screenWidth < 400 ? '100%' : '48%', // Responsive: full width on small screens
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 14,
    color: PALETTE.text600,
    marginBottom: 8,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.text900,
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  pill: { 
    flex: 1, 
    borderRadius: 16, 
    paddingVertical: 16, 
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pillLabel: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
  pillValue: { fontSize: 20, fontWeight: '800' },

  quickActionsContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.text900,
    marginBottom: 20,
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickIcon: { 
    fontSize: 22,
  },
  quickBtnContent: {
    flex: 1,
  },
  quickLabel: {
    fontWeight: '700',
    color: PALETTE.text900,
    fontSize: 15,
    marginBottom: 4,
  },
  quickDescription: {
    fontSize: 13,
    color: PALETTE.text600,
    lineHeight: 18,
  },
  quickBtnArrow: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 20,
    color: PALETTE.text600,
    fontWeight: '600',
  },

  recentActivityContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  recentActivityTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.text900,
    marginBottom: 20,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityIconText: {
    fontSize: 22,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: PALETTE.text900,
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 13,
    color: PALETTE.text600,
    lineHeight: 18,
  },
  activityStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  activityStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateIcon: {
    fontSize: 56,
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: PALETTE.text900,
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    color: PALETTE.text600,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },

  loader: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: PALETTE.text600,
    fontWeight: '500',
  },
});

