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
  fetchMFDPurchases, 
  type FishPurchase, 
  getStatusColor,
  getStatusText 
} from '../../services/mfd';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';
import Toast from 'react-native-toast-message';

type Nav = NativeStackNavigationProp<MFDStackParamList>;

export default function MFDPurchasesList() {
  const navigation = useNavigation<Nav>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchases, setPurchases] = useState<FishPurchase[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'>('All');

  const loadPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMFDPurchases({ page: 1, per_page: 50 });
      setPurchases(data.items || []);
    } catch (error) {
      console.error('Error loading purchases:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load purchases',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPurchases();
    setRefreshing(false);
  }, [loadPurchases]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePurchasePress = (purchase: FishPurchase) => {
    navigation.navigate('PurchaseDetails', { purchaseId: purchase.id });
  };

  const filteredPurchases = purchases.filter(purchase => {
    if (filter === 'All') return true;
    return purchase.status === filter.toLowerCase();
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const PurchaseCard = ({ purchase }: { purchase: FishPurchase }) => (
    <Pressable 
      onPress={() => handlePurchasePress(purchase)} 
      style={({ pressed }) => [styles.purchaseCard, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.purchaseHeader}>
        <View style={styles.purchaseInfo}>
          <Text style={styles.purchaseId}>Purchase #{purchase.id}</Text>
          <Text style={styles.purchaseRef}>
            {purchase.purchase_reference || 'No Reference'}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: getStatusColor(purchase.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(purchase.status) }]}>
            {getStatusLabel(purchase.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.purchaseDetails}>
        <View style={styles.detailRow}>
          <Icon name="business" size={16} color={PALETTE.text600} />
          <Text style={styles.detailText}>
            Company: {purchase.company?.name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="inventory" size={16} color={PALETTE.text600} />
          <Text style={styles.detailText}>
            Distribution: #{purchase.distribution_id}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="scale" size={16} color={PALETTE.text600} />
          <Text style={styles.detailText}>
            Weight: {purchase.final_weight_quantity || 'Not specified'} kg
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color={PALETTE.text600} />
          <Text style={styles.detailText}>
            Created: {new Date(purchase.created_at).toLocaleDateString()}
          </Text>
        </View>
        {purchase.final_product_name && (
          <View style={styles.detailRow}>
            <Icon name="inventory-2" size={16} color={PALETTE.text600} />
            <Text style={styles.detailText}>
              Product: {purchase.final_product_name}
            </Text>
          </View>
        )}
      </View>
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
        <Text style={styles.loadingText}>Loading purchases...</Text>
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
        <Text style={styles.headerTitle}>MFD Purchases</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filter by status</Text>
        <View style={styles.filtersRow}>
          {(['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'] as const).map((status) => (
            <FilterChip
              key={status}
              label={status}
              isActive={filter === status}
              onPress={() => setFilter(status)}
            />
          ))}
        </View>
      </View>

      {/* Purchases List */}
      <FlatList
        data={filteredPurchases}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <PurchaseCard purchase={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="shopping-cart" size={64} color={PALETTE.text400} />
            <Text style={styles.emptyTitle}>No purchases found</Text>
            <Text style={styles.emptyMessage}>
              {filter === 'All' 
                ? "No purchases available at the moment."
                : `No ${filter.toLowerCase()} purchases found.`
              }
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
    gap: 12,
  },
  purchaseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginBottom: 4,
  },
  purchaseRef: {
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
  purchaseDetails: {
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
