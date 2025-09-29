import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FCSStackParamList } from '../../app/navigation/stacks/FCSStack';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import PALETTE from '../../theme/palette';
import { getTripCounts } from '../../services/trips';
import { getFCSDistributionCounts, fetchFCSDistributions, type FishLotDistribution } from '../../services/fcs';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import type { AuthState } from '../../redux/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Nav = NativeStackNavigationProp<FCSStackParamList>;

export default function FCSHome() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const auth = useSelector((s: { auth: AuthState }) => s.auth);
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tripCounts, setTripCounts] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
  });
  const [distributionCounts, setDistributionCounts] = useState({
    total: 0,
    verified: 0,
    pending: 0,
  });
  const [recentDistributions, setRecentDistributions] = useState<FishLotDistribution[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userProfile: any = auth.user?.profile || auth.user || {};

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tripsData, distributionsData, recent] = await Promise.all([
        getTripCounts(),
        getFCSDistributionCounts(),
        fetchFCSDistributions({ page: 1, per_page: 5 }),
      ]);
      
      setTripCounts({
        total: tripsData.totals.all,
        active: tripsData.totals.active,
        completed: tripsData.totals.completed,
        pending: tripsData.totals.pending,
      });
      
      // Set distribution counts from FCS distribution counts
      setDistributionCounts({
        total: distributionsData.totals.all,
        verified: distributionsData.totals.verified,
        pending: distributionsData.totals.pending,
      });

      setRecentDistributions(recent.items || []);
    } catch (error) {
      console.error('Error loading FCS data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const confirmLogout = useCallback(() => {
    Alert.alert(t('fcs.logoutTitle'), t('fcs.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('fcs.logout'), style: 'destructive', onPress: async () => {
        try {
          setIsLoggingOut(true);
          await (dispatch as any)(logout() as any);
        } finally {
          setIsLoggingOut(false);
        }
      } },
    ]);
  }, [dispatch, t]);

  const ActionTile = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    count, 
    color = PALETTE.green700 
  }: {
    title: string;
    subtitle: string;
    icon: string;
    onPress: () => void;
    count?: number;
    color?: string;
  }) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionTile, pressed && { opacity: 0.9 }]}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
        {count !== undefined && (
          <Text style={[styles.actionCount, { color }]}>{count}</Text>
        )}
      </View>
      <Icon name="arrow-forward-ios" size={16} color={PALETTE.text400} />
    </Pressable>
  );

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    color = PALETTE.green700 
  }: {
    title: string;
    value: number;
    subtitle: string;
    color?: string;
  }) => (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
        <ActivityIndicator size="large" color={PALETTE.green700} />
        <Text style={styles.loadingText}>{t('fcs.loadingDashboard')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>{t('fcs.headerWelcome')}</Text>
            <Text style={styles.subtitleText}>{t('fcs.headerSubtitle')}</Text>
          </View>
          <Pressable
            onPress={confirmLogout}
            accessibilityRole="button"
            accessibilityLabel={t('fcs.logout')}
            disabled={isLoggingOut}
            style={({ pressed }) => [styles.headerIcon, (pressed || isLoggingOut) && { opacity: 0.85 }]}
          >
            {isLoggingOut ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="logout" size={20} color="#fff" />}
          </Pressable>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Section */}
        <View style={styles.cardLike}>
          <View style={styles.rowStart}>
            <View style={[styles.avatarSmall, { backgroundColor: PALETTE.green700 }]}>
              <Icon name="badge" size={22} color="#fff" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.cardTitle}>{t('fisherman.yourProfile')}</Text>
              <Text style={styles.cardSubtitle}>{t('fcs.portalDescription')}</Text>
            </View>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>{t('fisherman.fullName')}</Text>
            <Text style={styles.rowValue}>{userProfile?.name || `${userProfile?.first_name ?? ''} ${userProfile?.last_name ?? ''}` || '—'}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>{t('fisherman.emailAddress')}</Text>
            <Text style={styles.rowValue}>{userProfile?.email || '—'}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>{t('fisherman.phoneNumber')}</Text>
            <Text style={styles.rowValue}>{userProfile?.phone || '—'}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>FCS License</Text>
            <Text style={styles.rowValue}>{userProfile?.fcs_license_number || '—'}</Text>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{t('fcs.tripStatistics')}</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title={t('fcs.totalTrips')} 
              value={tripCounts.total} 
              subtitle={t('exporter.allTrips')} 
            />
            <StatCard 
              title={t('fcs.activeTrips')} 
              value={tripCounts.active} 
              subtitle={t('fisherman.active')} 
              color={PALETTE.blue700}
            />
            <StatCard 
              title={t('fcs.completed')} 
              value={tripCounts.completed} 
              subtitle={t('fisherman.completed')} 
              color={PALETTE.green700}
            />
            <StatCard 
              title={t('fcs.pendingApproval')} 
              value={tripCounts.pending} 
              subtitle={t('fcs.pendingReview')} 
              color={PALETTE.orange700}
            />
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{t('fcs.distributionStatistics')}</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title={t('fcs.totalDistributions')} 
              value={distributionCounts.total} 
              subtitle={t('fcs.allDistributions')} 
            />
            <StatCard 
              title={t('fcs.verified')} 
              value={distributionCounts.verified} 
              subtitle={t('fisherman.confirmed')} 
              color={PALETTE.green700}
            />
            <StatCard 
              title={t('fcs.pendingReview')} 
              value={distributionCounts.pending} 
              subtitle={t('fcs.pendingReview')} 
              color={PALETTE.orange700}
            />
          </View>
        </View>

        {/* Action Tiles */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>{t('fcs.quickActions')}</Text>
          
          <ActionTile
            title={t('fcs.allTrips')}
            subtitle={t('fcs.viewManageTrips')}
            icon="sailing"
            count={tripCounts.total}
            onPress={() => navigation.navigate('FCSTripsList')}
          />
          
          {/* <ActionTile
            title={t('fcs.pendingTrips')}
            subtitle={t('fcs.reviewPendingTrips')}
            icon="pending-actions"
            count={tripCounts.pending}
            color={PALETTE.orange700}
            onPress={() => navigation.navigate('FCSTripsList')}
          /> */}
          
          <ActionTile
            title={t('fcs.allDistributions')}
            subtitle={t('fcs.viewManageDistributions')}
            icon="local-shipping"
            count={distributionCounts.total}
            onPress={() => navigation.navigate('FCSDistributionsList')}
          />
          
          {/* <ActionTile
            title={t('fcs.pendingDistributions')}
            subtitle={t('fcs.reviewPendingDistributions')}
            icon="pending"
            count={distributionCounts.pending}
            color={PALETTE.orange700}
            onPress={() => navigation.navigate('FCSDistributionsList')}
          /> */}
        </View>

        {/* Recent Distributions */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{t('fcs.allDistributions')}</Text>
          {recentDistributions.length === 0 ? (
            <Text style={styles.emptyText}>{t('fisherman.noDistributionsFound')}</Text>
          ) : (
            recentDistributions.map((d) => (
              <View key={String(d.id)} style={styles.distItem}>
                <View style={[styles.actionIcon, { backgroundColor: PALETTE.green700 }]}>
                  <Icon name="inventory" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.distTitle}>{d.trip?.trip_id || `#${d.id}`}</Text>
                  <Text style={styles.distSubtitle}>
                    {d.middle_man?.name || '—'} • {d.total_quantity_kg} kg
                  </Text>
                </View>
                <Text style={[styles.badge, { backgroundColor: PALETTE.green50, color: PALETTE.green700 }]}>
                  {d.verification_status_label}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Footer spacer */}
      <View style={{ height: 8 }} />
      {isLoggingOut && (
        <View style={styles.overlay}> 
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={PALETTE.green700} />
            <Text style={{ marginTop: 10, color: PALETTE.text700, fontWeight: '600' }}>{t('fcs.loggingOut') || 'Signing you out…'}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PALETTE.text600,
  },
  header: {
    backgroundColor: PALETTE.green700,
    paddingTop: 0,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsSection: {
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    color: PALETTE.text600,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text900,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: PALETTE.text500,
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: 24,
  },
  rowStart: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex1: { flex: 1 },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTile: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.text900,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: PALETTE.text600,
    marginBottom: 4,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  distItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  distTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.text900,
  },
  distSubtitle: {
    fontSize: 12,
    color: PALETTE.text600,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
    borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
  },
  cardLike: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: { color: PALETTE.text600 },
  rowValue: { color: PALETTE.text900, fontWeight: '700' },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.text900,
  },
  cardSubtitle: {
    fontSize: 12,
    color: PALETTE.text600,
    marginTop: 2,
  },
});
