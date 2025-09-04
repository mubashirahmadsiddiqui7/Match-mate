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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FCSStackParamList } from '../../app/navigation/stacks/FCSStack';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import { listTripsPage, getTripCounts } from '../../services/trips';
import { fetchAllDistributions } from '../../services/middlemanDistribution';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';

type Nav = NativeStackNavigationProp<FCSStackParamList>;

export default function FCSHome() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tripsData, distributionsData] = await Promise.all([
        getTripCounts(),
        fetchAllDistributions(),
      ]);
      
      setTripCounts({
        total: tripsData.totals.all,
        active: tripsData.totals.active,
        completed: tripsData.totals.completed,
        pending: tripsData.totals.pending,
      });
      
      // Calculate distribution counts
      const distributions = distributionsData || [];
      const verified = distributions.filter(d => d.verification_status === 'verified').length;
      const pending = distributions.filter(d => d.verification_status === 'pending').length;
      
      setDistributionCounts({
        total: distributions.length,
        verified,
        pending,
      });
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
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => (dispatch as any)(logout() as any) },
    ]);
  }, [dispatch]);

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
        <ActivityIndicator size="large" color={PALETTE.green700} />
        <Text style={styles.loadingText}>Loading FCS Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome to FCS Portal</Text>
            <Text style={styles.subtitleText}>Fisheries Control System</Text>
          </View>
          <View style={styles.logo}>
            <Icon name="account-balance" size={32} color="#fff" />
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Trip Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Total Trips" 
              value={tripCounts.total} 
              subtitle="All trips" 
            />
            <StatCard 
              title="Active Trips" 
              value={tripCounts.active} 
              subtitle="Currently active" 
              color={PALETTE.blue700}
            />
            <StatCard 
              title="Completed" 
              value={tripCounts.completed} 
              subtitle="Successfully completed" 
              color={PALETTE.green700}
            />
            <StatCard 
              title="Pending Approval" 
              value={tripCounts.pending} 
              subtitle="Awaiting review" 
              color={PALETTE.orange700}
            />
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Distribution Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Total Distributions" 
              value={distributionCounts.total} 
              subtitle="All distributions" 
            />
            <StatCard 
              title="Verified" 
              value={distributionCounts.verified} 
              subtitle="Approved distributions" 
              color={PALETTE.green700}
            />
            <StatCard 
              title="Pending Review" 
              value={distributionCounts.pending} 
              subtitle="Awaiting verification" 
              color={PALETTE.orange700}
            />
          </View>
        </View>

        {/* Action Tiles */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <ActionTile
            title="All Trips"
            subtitle="View and manage all fishing trips"
            icon="sailing"
            count={tripCounts.total}
            onPress={() => navigation.navigate('FCSTripsList')}
          />
          
          <ActionTile
            title="Pending Trips"
            subtitle="Review trips awaiting approval"
            icon="pending-actions"
            count={tripCounts.pending}
            color={PALETTE.orange700}
            onPress={() => navigation.navigate('FCSTripsList')}
          />
          
          <ActionTile
            title="All Distributions"
            subtitle="View and manage all distributions"
            icon="local-shipping"
            count={distributionCounts.total}
            onPress={() => navigation.navigate('FCSDistributionsList')}
          />
          
          <ActionTile
            title="Pending Distributions"
            subtitle="Review distributions awaiting verification"
            icon="pending"
            count={distributionCounts.pending}
            color={PALETTE.orange700}
            onPress={() => navigation.navigate('FCSDistributionsList')}
          />
        </View>
      </ScrollView>

      {/* Logout (secondary) */}
      <Pressable
        onPress={confirmLogout}
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.9 }]}
      >
        <Icon name="logout" size={18} color="#fff" />
        <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '700' }}>Logout</Text>
      </Pressable>
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
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsSection: {
    marginBottom: 24,
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
  logoutBtn: {
    marginHorizontal: 14,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d32f2f',
    paddingVertical: 12,
    borderRadius: 10,
  },
});
