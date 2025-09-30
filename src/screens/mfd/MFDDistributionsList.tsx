/* eslint-disable react/no-unstable-nested-components */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import {
  fetchMFDDistributions,
  type FishLotDistribution,
  getStatusColor,
  getStatusText,
} from '../../services/mfd';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';
import Toast from 'react-native-toast-message';

type Nav = NativeStackNavigationProp<MFDStackParamList>;

export default function MFDDistributionsList() {
  const navigation = useNavigation<Nav>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [distributions, setDistributions] = useState<FishLotDistribution[]>([]);
  const [filter, setFilter] = useState<
    'All' | 'Pending' | 'Verified' | 'Rejected'
  >('All');

  const loadDistributions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMFDDistributions({ page: 1, per_page: 50 });
      setDistributions(data.items || []);
    } catch (error) {
      console.error('Error loading distributions:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load distributions',
        position: 'top',
      });
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
      distributionId: distribution.id,
    });
  };

  const filteredDistributions = distributions.filter(distribution => {
    if (filter === 'All') return true;
    return distribution.verification_status === filter.toLowerCase();
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const DistributionCard = ({
    distribution,
  }: {
    distribution: FishLotDistribution;
  }) => (
    <View style={styles.distributionCard}>
      {/* Header Section */}
      <View style={styles.cardHeader}>
        <Text style={styles.distributionId}>DIST-{distribution.id}</Text>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor:
                getStatusColor(distribution.verification_status) + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(distribution.verification_status) },
            ]}
          >
            {getStatusLabel(distribution.verification_status)}
          </Text>
        </View>
      </View>

      {/* Trip Details Section */}
      <View style={styles.tripDetailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Trip</Text>
          <Text style={styles.detailValue}>
            {distribution.trip?.trip_id || 'Unknown'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fisherman</Text>
          <Text style={styles.detailValue}>
            {distribution.trip?.captain_name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Middle Man</Text>
          <Text style={styles.detailValue}>
            {distribution.trip?.captain_name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Quantity</Text>
          <Text style={styles.detailValue}>
            {distribution.total_quantity_kg} KG
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created Date</Text>
          <Text style={styles.detailValue}>
            {new Date(distribution.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Verified By</Text>
          <Text style={styles.detailValue}>Fcs User</Text>
        </View>
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Distributed Lots Section */}
      <View style={styles.lotsSection}>
        <Text style={styles.lotsHeader}>Distributed Lots:</Text>
        {distribution.distributed_lots.map((lot, index) => (
          <View key={index} style={styles.lotRow}>
            <Text style={styles.lotText}>
              LOT-{lot.lot_id} - {lot.species_name || 'Unknown Species'}
            </Text>
            <View style={styles.quantityPill}>
              <Text style={styles.quantityText}>{lot.quantity_kg} KG</Text>
            </View>
          </View>
        ))}
      </View>

      {/* View Button */}
      <Pressable
        onPress={() => handleDistributionPress(distribution)}
        style={({ pressed }) => [
          styles.viewButton,
          pressed && { opacity: 0.8 },
        ]}
      >
        <Icon name="visibility" size={16} color="#fff" />
        <Text style={styles.viewButtonText}>View</Text>
      </Pressable>
    </View>
  );

  const FilterChip = ({
    label,
    isActive,
    onPress,
  }: {
    label: string;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, isActive && styles.filterChipActive]}
    >
      <Text
        style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
      >
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
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>MFD Distributions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filter by status</Text>
        <View style={styles.filtersRow}>
          {(['All', 'Pending', 'Verified', 'Rejected'] as const).map(status => (
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
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <DistributionCard distribution={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="inventory" size={64} color={PALETTE.text400} />
            <Text style={styles.emptyTitle}>No distributions found</Text>
            <Text style={styles.emptyMessage}>
              {filter === 'All'
                ? 'No distributions available at the moment.'
                : `No ${filter.toLowerCase()} distributions found.`}
            </Text>
          </View>
        )}
      />

      <Toast />
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
    paddingTop: 20,
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  distributionId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  tripDetailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  lotsSection: {
    marginBottom: 16,
  },
  lotsHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  lotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lotText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  quantityPill: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#1B5E20',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
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
