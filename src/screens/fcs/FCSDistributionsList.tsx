import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FCSStackParamList } from '../../app/navigation/stacks/FCSStack';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import { 
  fetchFCSDistributions, 
  type FishLotDistribution, 
  verifyFCSDistribution, 
  rejectFCSDistribution,
  getStatusColor,
  getStatusText 
} from '../../services/fcs';
import Toast from 'react-native-toast-message';

type Nav = NativeStackNavigationProp<FCSStackParamList>;

export default function FCSDistributionsList() {
  const navigation = useNavigation<Nav>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [distributions, setDistributions] = useState<FishLotDistribution[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Verified' | 'Rejected'>('All');
  const [verifyLoading, setVerifyLoading] = useState<string | null>(null);
  const [rejectLoading, setRejectLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<FishLotDistribution | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadDistributions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchFCSDistributions({ page: 1, per_page: 50 });
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

  const handleVerify = useCallback(async (distribution: FishLotDistribution) => {
    try {
      setVerifyLoading(distribution.id.toString());
      await verifyFCSDistribution(distribution.id);
      Toast.show({
        type: 'success',
        text1: 'Distribution Verified',
        text2: `Distribution #${distribution.id} has been verified successfully`,
        position: 'top',
      });
      await loadDistributions(); // Refresh the list
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: error?.message || 'Failed to verify distribution',
        position: 'top',
      });
    } finally {
      setVerifyLoading(null);
    }
  }, [loadDistributions]);

  const handleReject = useCallback(async (distribution: FishLotDistribution) => {
    setSelectedDistribution(distribution);
    setRejectionReason('');
    setShowRejectModal(true);
  }, []);

  const confirmReject = useCallback(async () => {
    if (!selectedDistribution || !rejectionReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please provide a rejection reason',
        position: 'top',
      });
      return;
    }

    try {
      setRejectLoading(selectedDistribution.id.toString());
      await rejectFCSDistribution(selectedDistribution.id, { verification_notes: rejectionReason.trim() });
      Toast.show({
        type: 'success',
        text1: 'Distribution Rejected',
        text2: `Distribution #${selectedDistribution.id} has been rejected`,
        position: 'top',
      });
      setShowRejectModal(false);
      setSelectedDistribution(null);
      setRejectionReason('');
      await loadDistributions(); // Refresh the list
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Rejection Failed',
        text2: error?.message || 'Failed to reject distribution',
        position: 'top',
      });
    } finally {
      setRejectLoading(null);
    }
  }, [selectedDistribution, rejectionReason, loadDistributions]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDistributionPress = (distribution: FishLotDistribution) => {
    navigation.navigate('DistributionDetails', { distributionId: String(distribution.id) as any });
  };

  const filteredDistributions = distributions.filter(distribution => {
    if (filter === 'All') return true;
    return distribution.verification_status === filter.toLowerCase();
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'verified': return 'Verified';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const DistributionCard = ({ distribution }: { distribution: FishLotDistribution }) => (
    <Pressable
      onPress={() => handleDistributionPress(distribution)}
      style={({ pressed }) => [styles.distributionCard, pressed && { opacity: 0.95, transform: [{ scale: 0.998 }] }]}
    >
      <View style={[styles.statusBarTop, { backgroundColor: getStatusColor(distribution.verification_status) }]} />

      <View style={styles.cardHeaderRow}>
        <View style={styles.avatarCircle}>
          <Icon name="inventory" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.distributionId}>#{distribution.id} • {distribution.trip?.trip_id || 'Trip'}</Text>
          <Text style={styles.subtleText}>{new Date(distribution.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: getStatusColor(distribution.verification_status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(distribution.verification_status) }]}>
            {getStatusLabel(distribution.verification_status)}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Icon name="person" size={16} color={PALETTE.text600} />
        <Text style={styles.metaText}>{distribution.trip?.captain_name || 'Unknown Fisherman'}</Text>
      </View>
      <View style={styles.metaRow}>
        <Icon name="scale" size={16} color={PALETTE.text600} />
        <Text style={styles.metaText}>{distribution.total_quantity_kg} kg • {distribution.distributed_lots.length} lots</Text>
      </View>

      {/* Lot chips (first two) */}
      <View style={styles.chipsRow}>
        {distribution.distributed_lots.slice(0, 2).map((lot, idx) => (
          <View key={idx} style={styles.chip}>
            <Text style={styles.chipText}>{lot.species_name || 'Lot'} • {lot.quantity_kg}kg</Text>
          </View>
        ))}
        {distribution.distributed_lots.length > 2 && (
          <View style={[styles.chip, { backgroundColor: '#EEF2FF' }]}>
            <Text style={[styles.chipText, { color: PALETTE.text700 }]}>+{distribution.distributed_lots.length - 2} more</Text>
          </View>
        )}
      </View>

      {distribution.verification_status === 'pending' && (
        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => handleVerify(distribution)}
            style={[styles.actionButton, styles.verifyButton, verifyLoading === distribution.id.toString() && { opacity: 0.6 }]}
            disabled={verifyLoading === distribution.id.toString() || rejectLoading === distribution.id.toString()}
          >
            {verifyLoading === distribution.id.toString() ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="check" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Verify</Text>
              </>
            )}
          </Pressable>
          <Pressable
            onPress={() => handleReject(distribution)}
            style={[styles.actionButton, styles.rejectButton, rejectLoading === distribution.id.toString() && { opacity: 0.6 }]}
            disabled={verifyLoading === distribution.id.toString() || rejectLoading === distribution.id.toString()}
          >
            {rejectLoading === distribution.id.toString() ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="close" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </>
            )}
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
        <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
        <ActivityIndicator size="large" color={PALETTE.green700} />
        <Text style={styles.loadingText}>Loading distributions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
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
          {(['All', 'Pending', 'Verified', 'Rejected'] as const).map((status) => (
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
            <Icon name="inventory" size={64} color={PALETTE.text400} />
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

      {/* Rejection Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Icon name="warning" size={24} color={PALETTE.error} />
              <Text style={styles.modalTitle}>Reject Distribution</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Please provide a reason for rejecting this distribution:
            </Text>
            
            <Text style={styles.modalDistributionInfo}>
              Distribution #{selectedDistribution?.id}
            </Text>
            
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter rejection reason..."
              placeholderTextColor={PALETTE.text400}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[
                  styles.modalButton, 
                  styles.confirmButton,
                  (!rejectionReason.trim() || rejectLoading) && { opacity: 0.6 }
                ]}
                onPress={confirmReject}
                disabled={!rejectionReason.trim() || !!rejectLoading}
              >
                {rejectLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Reject Distribution</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
    paddingTop: 10,
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
    gap: 14,
  },
  distributionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  statusBarTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PALETTE.green700,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
  distributionId: { fontSize: 15, fontWeight: '700', color: PALETTE.text900 },
  subtleText: { fontSize: 12, color: PALETTE.text500, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  distributionDetails: { marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  metaText: { fontSize: 14, color: PALETTE.text700, marginLeft: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 6 },
  chip: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chipText: { fontSize: 12, color: PALETTE.green700, fontWeight: '600' },
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
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  verifyButton: {
    backgroundColor: PALETTE.green700,
  },
  rejectButton: {
    backgroundColor: PALETTE.error,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginLeft: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: PALETTE.text600,
    marginBottom: 12,
  },
  modalDistributionInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text900,
    marginBottom: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: PALETTE.text900,
    backgroundColor: '#f8f9fa',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: PALETTE.border,
  },
  confirmButton: {
    backgroundColor: PALETTE.error,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text600,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});