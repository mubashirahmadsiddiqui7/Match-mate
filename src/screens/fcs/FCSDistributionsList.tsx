import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { fetchAllDistributions, type FishLotDistribution } from '../../services/middlemanDistribution';

type Nav = NativeStackNavigationProp<FCSStackParamList>;

export default function FCSDistributionsList() {
  const navigation = useNavigation<Nav>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [distributions, setDistributions] = useState<FishLotDistribution[]>([]);
  const [filter, setFilter] = useState<'All' | 'Verified' | 'Pending'>('All');

  const loadDistributions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllDistributions();
      setDistributions(data || []);
    } catch (error) {
      console.error('Error loading distributions:', error);
      Alert.alert('Error', 'Failed to load distributions');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDistributions();
    setRefreshing(false);
  }, [loadDistributions]);

  useEffect(() => {
    loadDistributions();
  }, [loadDistributions]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDistributionPress = (distribution: FishLotDistribution) => {
    navigation.navigate('DistributionDetails', { 
      distributionId: String(distribution.id), 
      distribution 
    });
  };

  const handleApprove = async (distribution: FishLotDistribution) => {
    Alert.alert(
      'Approve Distribution',
      `Are you sure you want to approve distribution #${distribution.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          style: 'default',
          onPress: () => {
            // TODO: Implement approve distribution API call
            Alert.alert('Success', 'Distribution approved successfully');
            loadDistributions();
          }
        }
      ]
    );
  };

  const handleReject = async (distribution: FishLotDistribution) => {
    Alert.alert(
      'Reject Distribution',
      `Are you sure you want to reject distribution #${distribution.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement reject distribution API call
            Alert.alert('Success', 'Distribution rejected successfully');
            loadDistributions();
          }
        }
      ]
    );
  };

  const filteredDistributions = distributions.filter(distribution => {
    switch (filter) {
      case 'Verified': return distribution.verification_status === 'verified';
      case 'Pending': return distribution.verification_status === 'pending';
      default: return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return PALETTE.green700;
      case 'pending': return PALETTE.orange700;
      default: return PALETTE.text600;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const DistributionCard = ({ distribution }: { distribution: FishLotDistribution }) => (
    <Pressable 
      onPress={() => handleDistributionPress(distribution)} 
      style={({ pressed }) => [styles.distributionCard, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.distributionHeader}>
        <View style={styles.distributionInfo}>
          <Text style={styles.distributionId}>Distribution #{distribution.id}</Text>
          <Text style={styles.tripId}>Trip: {distribution.trip?.trip_id || 'Unknown'}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: getStatusColor(distribution.verification_status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(distribution.verification_status) }]}>
            {getStatusLabel(distribution.verification_status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.distributionDetails}>
        <View style={styles.detailRow}>
          <Icon name="person" size={16} color={PALETTE.text600} />
          <Text style={styles.detailText}>
            Middleman: {distribution.middle_man?.name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="inventory" size={16} color={PALETTE.text600} />
          <Text style={styles.detailText}>
            Lots: {distribution.distributed_lots?.length || 0}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="scale" size={16} color={PALETTE.text600} />
          <Text style={styles.detailText}>
            Total Weight: {distribution.total_quantity_kg || '0'} kg
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color={PALETTE.text600} />
          <Text style={styles.detailText}>
            {new Date(distribution.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {distribution.verification_status === 'pending' && (
        <View style={styles.actionButtons}>
          <Pressable 
            onPress={() => handleApprove(distribution)}
            style={[styles.actionButton, styles.approveButton]}
          >
            <Icon name="check" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </Pressable>
          <Pressable 
            onPress={() => handleReject(distribution)}
            style={[styles.actionButton, styles.rejectButton]}
          >
            <Icon name="close" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );

  const FilterChip = ({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) => (
    <Pressable 
      onPress={onPress}
      style={[styles.filterChip, isActive && styles.filterChipActive]}
    >
      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PALETTE.green700} />
        <Text style={styles.loadingText}>Loading distributions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>FCS Distributions Management</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filter by status</Text>
        <View style={styles.filtersRow}>
          {(['All', 'Verified', 'Pending'] as const).map((status) => (
            <FilterChip
              key={status}
              label={status}
              isActive={filter === status}
              onPress={() => setFilter(status)}
            />
          ))}
        </View>
      </View>

      {/* Distributions List */}
      <FlatList
        data={filteredDistributions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <DistributionCard distribution={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="local-shipping" size={64} color={PALETTE.text400} />
            <Text style={styles.emptyTitle}>No distributions found</Text>
            <Text style={styles.emptyMessage}>
              {filter === 'All' 
                ? "No distributions available at the moment."
                : `No ${filter.toLowerCase()} distributions found.`
              }
            </Text>
          </View>
        )}
      />
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
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.text900,
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PALETTE.border,
  },
  filterChipActive: {
    backgroundColor: PALETTE.green700,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.text600,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  distributionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  distributionInfo: {
    flex: 1,
  },
  distributionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginBottom: 4,
  },
  tripId: {
    fontSize: 14,
    color: PALETTE.text600,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  distributionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: PALETTE.text600,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: PALETTE.green700,
  },
  rejectButton: {
    backgroundColor: PALETTE.error,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: PALETTE.text500,
    textAlign: 'center',
  },
});
