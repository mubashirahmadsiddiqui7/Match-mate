import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MiddleManStackParamList } from '../../app/navigation/stacks/MiddleManStack';
import {
  fetchDistributions,
  type FishLotDistribution,
  type PaginatedResponse,
  getStatusColor,
  getStatusText,
  formatDate,
} from '../../services/middlemanDistribution';

const { width: screenWidth } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<MiddleManStackParamList, 'MiddleManHome'>;

const Status = [
  { label: 'All Status', value: 'All Status' },
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
];

const MiddleMen = [
  { label: 'All Middle Men', value: 'All Middle Men' },
  { label: 'Hamza Middleman', value: 'Hamza Middleman' },
];

export default function Distributions() {
  const [allDistributions, setAllDistributions] = useState<FishLotDistribution[]>([]);
  const [distributions, setDistributions] = useState<FishLotDistribution[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<FishLotDistribution>['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const navigation = useNavigation<Nav>();

  // Filter states
  const [status, setStatus] = useState('All Status');
  const [middleMan, setMiddleMan] = useState('All Middle Men');

  // Dynamic dropdown data
  const [middlemanOptions, setMiddlemanOptions] = useState(MiddleMen);

  // Function to apply filters locally
  const applyFilters = useCallback(() => {
    let filteredData = [...allDistributions];

    // Apply status filter
    if (status && status !== 'All Status') {
      filteredData = filteredData.filter(dist => dist.verification_status === status);
    }

    // Apply middleman filter
    if (middleMan && middleMan !== 'All Middle Men') {
      filteredData = filteredData.filter(dist => dist.middle_man?.name === middleMan);
    }

    console.log('🔍 Filtering results:', {
      total: allDistributions.length,
      filtered: filteredData.length,
      status,
      middleMan
    });

    setDistributions(filteredData);
  }, [allDistributions, status, middleMan]);

  // Function to populate dropdown options from API data
  const populateDropdownOptions = useCallback((distributions: FishLotDistribution[]) => {
    // Extract unique middlemen
    const uniqueMiddlemen = new Set<string>();
    
    distributions.forEach(dist => {
      // Add middleman name
      if (dist.middle_man?.name) {
        uniqueMiddlemen.add(dist.middle_man.name);
      }
    });

    // Update middleman options
    const middlemanOptionsData = [
      { label: 'All Middle Men', value: 'All Middle Men' },
      ...Array.from(uniqueMiddlemen).map(name => ({ label: name, value: name }))
    ];
    setMiddlemanOptions(middlemanOptionsData);
  }, []);

  const loadDistributions = useCallback(async (p = 1, replace = false) => {
    if (p === 1 && !replace) setLoading(true);
    try {
      const params: any = {
        page: p,
        per_page: 15,
      };

      console.log('📡 Loading distributions...');

      const response = await fetchDistributions(params);
      console.log('📦 API Response items count:', response.items.length);
      
      setMeta(response.meta);
      setPage(response.meta.current_page);
      
      // Store all distributions for filtering
      if (p === 1) {
        setAllDistributions(response.items);
        setDistributions(response.items);
        // Populate dropdown options on first load
        populateDropdownOptions(response.items);
      } else {
        setAllDistributions(prev => [...prev, ...response.items]);
        setDistributions(prev => [...prev, ...response.items]);
      }
    } catch (error) {
      console.error('❌ Error loading distributions:', error);
      Alert.alert('Error', 'Failed to load distributions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [populateDropdownOptions]);

  // Apply filters whenever filter states change
  useEffect(() => {
    if (allDistributions.length > 0) {
      applyFilters();
    }
  }, [applyFilters]);

  useEffect(() => {
    loadDistributions(1, true);
  }, [loadDistributions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDistributions(1, true);
  }, [loadDistributions]);

  const onEndReached = useCallback(() => {
    if (!meta || page >= meta.last_page) return;
    loadDistributions(page + 1);
  }, [meta, page, loadDistributions]);



  // --- Render List Item ---
  const renderItem = ({ item }: { item: FishLotDistribution }) => {
    const statusColor = getStatusColor(item.verification_status);
    const statusText = item.verification_status_label || getStatusText(item.verification_status);

    return (
      <View style={styles.distributionCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>DIST-{item.id}</Text>
          <View style={[styles.statusTag, { backgroundColor: statusColor }]}>
            <Text style={styles.statusTagText}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trip:</Text>
              <Text style={styles.infoValue}>TRIP-{String(item.trip_id).padStart(8, '0')}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fisherman:</Text>
              <Text style={styles.infoValue}>Ali Fisherman</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Middle Man:</Text>
              <Text style={styles.infoValue}>{item.middle_man?.name || '—'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Quantity:</Text>
              <View style={styles.quantityTag}>
                <Text style={styles.quantityTagText}>{item.total_quantity_kg} KG</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created Date:</Text>
              <Text style={styles.infoValue}>{formatDate(item.created_at)}</Text>
            </View>

            {item.verifier && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Verified By:</Text>
                <Text style={styles.infoValue}>{item.verifier.name}</Text>
              </View>
            )}
          </View>

          {/* Show distributed lots summary */}
          {item.distributed_lots && item.distributed_lots.length > 0 && (
            <View style={styles.lotsSection}>
              <Text style={styles.lotsHeader}>Distributed Lots:</Text>
              {item.distributed_lots.map((lot, index) => (
                <View key={index} style={styles.lotRow}>
                  <Text style={styles.lotText}>
                    LOT-{String(lot.lot_id).padStart(8, '0')} - Tuna
                  </Text>
                  <View style={styles.quantityTag}>
                    <Text style={styles.quantityTagText}>{lot.quantity_kg} KG</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>👁️ View Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // --- Render Header (Filters) ---
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Main Header */}
      <View style={styles.mainHeader}>
        <Text style={styles.mainTitle}>Middle Man Distributions</Text>
        <TouchableOpacity style={styles.newButton}>
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>Filter Distributions</Text>

        <View style={styles.filterSection}>
                      {/* Status */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Status</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownText}
                data={Status}
                labelField="label"
                valueField="value"
                placeholder="All Status"
                value={status}
                onChange={item => {
                  setStatus(item.value);
                  // Auto-apply filter when selection changes
                  setTimeout(() => applyFilters(), 100);
                }}
              />
            </View>

            {/* Middle Man */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Middle Man</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownText}
                data={middlemanOptions}
                labelField="label"
                valueField="value"
                placeholder="All Middle Men"
                value={middleMan}
                onChange={item => {
                  setMiddleMan(item.value);
                  // Auto-apply filter when selection changes
                  setTimeout(() => applyFilters(), 100);
                }}
              />
            </View>
        </View>



                {/* Filter Buttons */}
        <View style={styles.filterButtons}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => applyFilters()}
          >
            <Text style={styles.applyButtonText}>🔍 Apply Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => {
              setStatus('All Status');
              setMiddleMan('All Middle Men');
              // Reset dropdown options to initial state
              setMiddlemanOptions(MiddleMen);
              // Reset to show all distributions
              setDistributions(allDistributions);
            }}
          >
            <Text style={styles.clearButtonText}>✖️ Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // --- Loader ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#07890bff" />
          <Text style={styles.loaderText}>Loading distributions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={distributions}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No distributions found</Text>
            <Text style={styles.emptySubText}>Try adjusting your filters</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  // Header Container
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Main Header
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  newButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Filter Card
  filterCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterItem: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdown: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
    fontSize: 15,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  dateInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  calendarIcon: {
    fontSize: 18,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  applyButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  clearButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    shadowColor: '#6b7280',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Distribution Card
  distributionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  statusTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTagText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  cardContent: {
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  quantityTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  quantityTagText: {
    color: '#065f46',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  lotsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  lotsHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  lotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  lotText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  viewButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },

  // Empty State
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

