import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MiddleManStackParamList } from '../../app/navigation/stacks/MiddleManStack';
import {
  fetchPurchases,
  confirmPurchase,
  type FishPurchase,
  type PaginatedResponse,
  getStatusColor,
  getStatusText,
  formatDate,
} from '../../services/middlemanDistribution';

// --- Types ---
type Nav = NativeStackNavigationProp<MiddleManStackParamList, 'MiddleManHome'>;

// --- Dropdown Data ---
const Status = [
  { label: 'All Status', value: 'All Status' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function Purchases() {
  const navigation = useNavigation<Nav>();

  const [purchases, setPurchases] = useState<FishPurchase[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<FishPurchase>['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const [status, setStatus] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // --- Fetch API ---
  const loadPurchases = useCallback(async (p = 1, replace = false) => {
    if (p === 1 && !replace) setLoading(true);
    try {
      const params: any = {
        page: p,
        per_page: 15,
      };
      
      if (status && status !== 'All Status') {
        params.status = status;
      }
      
      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await fetchPurchases(params);
      setMeta(response.meta);
      setPage(response.meta.current_page);
      setPurchases(prev => (replace || p === 1 ? response.items : [...prev, ...response.items]));
    } catch (error) {
      console.error('Error loading purchases:', error);
      Alert.alert('Error', 'Failed to load purchases. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status, search]);

  useEffect(() => {
    loadPurchases(1, true);
  }, [loadPurchases]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPurchases(1, true);
  }, [loadPurchases]);

  const onEndReached = useCallback(() => {
    if (!meta || page >= meta.last_page) return;
    loadPurchases(page + 1);
  }, [meta, page, loadPurchases]);

  // --- Handle Confirm Purchase ---
  const handleConfirmPurchase = useCallback(async (purchaseId: number) => {
    Alert.alert(
      'Confirm Purchase',
      'Are you sure you want to confirm this purchase?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            try {
              await confirmPurchase(purchaseId);
              // Refresh the data
              loadPurchases(1, true);
              Alert.alert('Success', 'Purchase confirmed successfully!');
            } catch (error) {
              console.error('Error confirming purchase:', error);
              Alert.alert('Error', 'Failed to confirm purchase. Please try again.');
            }
          },
        },
      ]
    );
  }, [loadPurchases]);

  // --- Render List Item ---
  const renderItem = ({ item }: { item: FishPurchase }) => {
    const statusColor = getStatusColor(item.status);
    const isPending = item.status === 'pending';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('distributionDetails')}
        activeOpacity={0.8}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Purchase #{item.id}
            </Text>
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
            </View>
          </View>

          {/* Info Rows */}
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Lot No:</Text>
            <Text style={styles.cardValue}>{item.distribution?.lot_no || '—'}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Species:</Text>
            <Text style={styles.cardValue}>{item.distribution?.species || '—'}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Quantity:</Text>
            <Text style={styles.cardValue}>{item.quantity_kg} kg</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Price:</Text>
            <Text style={styles.cardValue}>${item.purchase_price}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Date:</Text>
            <Text style={styles.cardValue}>{formatDate(item.purchase_date)}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Payment:</Text>
            <Text style={styles.cardValue}>{item.payment_status}</Text>
          </View>

          {/* Confirm Button for Pending Purchases */}
          {isPending && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => handleConfirmPurchase(item.id)}
            >
              <Text style={styles.confirmButtonText}>Confirm Purchase</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // --- Render Header (Filters) ---
  const renderHeader = () => (
    <View>
      {/* Filters */}
      <View style={styles.filterCard}>
        <Text style={styles.filterHeader}>Filter Purchases</Text>

        {/* Status */}
        <FilterDropdown label="Status" data={Status} value={status} onChange={setStatus} />

        {/* Search */}
        <View style={styles.searchRow}>
          <Text style={styles.searchLabel}>Search:</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by lot no, species..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => loadPurchases(1, true)}
          />
        </View>

        {/* Buttons */}
        <View style={styles.filterButtons}>
          <TouchableOpacity 
            style={styles.applyBtn}
            onPress={() => loadPurchases(1, true)}
          >
            <Text style={styles.btnText}>🔍 Apply Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.clearBtn}
            onPress={() => {
              setStatus(null);
              setSearch('');
              loadPurchases(1, true);
            }}
          >
            <Text style={styles.btnText}>✖️ Clear Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List Header */}
      <View style={styles.listCard}>
        <Text style={styles.listHeader}>
          All Purchases ({meta?.total || 0})
        </Text>
      </View>
    </View>
  );

  // --- Loader ---
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#07890bff" />
        <Text style={styles.loaderText}>Loading purchases...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={purchases}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <View style={{ height: 12, marginHorizontal: 12 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No purchases found</Text>
            <Text style={styles.emptySubText}>Try adjusting your filters</Text>
          </View>
        }
      />
    </View>
  );
}

// --- Reusable Dropdown Component ---
const FilterDropdown = ({ label, data, value, onChange }: any) => (
  <View style={styles.dropdownRow}>
    <Text style={styles.dropdownLabel}>{label}</Text>
    <Dropdown
      style={styles.dropdown}
      placeholderStyle={styles.dropdownPlaceholder}
      selectedTextStyle={styles.dropdownText}
      data={data}
      search
      maxHeight={200}
      labelField="label"
      valueField="value"
      placeholder={`Select ${label}`}
      searchPlaceholder="Search..."
      value={value}
      onChange={item => onChange(item.value)}
    />
  </View>
);

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  // --- Filter Section ---
  filterCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  filterHeader: {
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
    color: '#2a2a2a',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dropdownLabel: {
    width: '28%',
    fontSize: 15,
    fontWeight: '500',
    color: '#444',
  },
  dropdown: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dropdownPlaceholder: {
    color: '#aaa',
    fontSize: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: '#222',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  searchLabel: {
    width: '28%',
    fontSize: 15,
    fontWeight: '500',
    color: '#444',
  },
  searchInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#222',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  applyBtn: {
    backgroundColor: '#368a33ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  clearBtn: {
    backgroundColor: '#828282ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // --- List Section ---
  listCard: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    color: '#222',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },

  // --- Card ---
  card: {
    backgroundColor: '#f4f8f4',
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    width: '35%',
  },
  cardValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  confirmButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
