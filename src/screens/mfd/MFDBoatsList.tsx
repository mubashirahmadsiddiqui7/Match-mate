import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import { 
  fetchBoats, 
  type Boat, 
  getStatusColor, 
  getStatusText 
} from '../../services/boats';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';
import Toast from 'react-native-toast-message';

type Nav = NativeStackNavigationProp<MFDStackParamList>;

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'gill_netter': return 'directions_boat';
    case 'trawler': return 'sailing';
    default: return 'directions_boat';
  }
};

const BoatCard = ({ boat, onBoatPress }: { 
  boat: Boat; 
  onBoatPress: (boat: Boat) => void;
}) => (
  <View style={styles.boatCard}>
    {/* Header Section */}
    <View style={styles.cardHeader}>
      <View style={styles.registrationContainer}>
        <Icon name='sailing' size={20} color={PALETTE.green700} />
        <Text style={styles.registrationNumber}>{boat.registration_number}</Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: getStatusColor(boat.status) + '20' }]}>
        <Text style={[styles.statusText, { color: getStatusColor(boat.status) }]}>
          {getStatusText(boat.status)}
        </Text>
      </View>
    </View>

    {/* Boat Information */}
    <View style={styles.boatInfo}>
      <Text style={styles.boatName}>{boat.name}</Text>
      <Text style={styles.ownerName}>Owner: {boat.owner.name}</Text>
      <Text style={styles.boatType}>Type: {boat.type}</Text>
    </View>

    {/* Details Row */}
    <View style={styles.detailsRow}>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Length</Text>
        <Text style={styles.detailValue}>{boat.length_m}m</Text>
      </View>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Width</Text>
        <Text style={styles.detailValue}>{boat.width_m}m</Text>
      </View>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Crew</Text>
        <Text style={styles.detailValue}>{boat.capacity_crew}</Text>
      </View>
    </View>

    {/* Home Port and Created Date */}
    <View style={styles.footerRow}>
      <View style={styles.portContainer}>
        <Icon name="location-on" size={14} color={PALETTE.text400} />
        <Text style={styles.homePort}>
          {boat.home_port || 'No port specified'}
        </Text>
      </View>
      <Text style={styles.createdDate}>
        {new Date(boat.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })}
      </Text>
    </View>

    {/* Action Button */}
    <Pressable 
      onPress={() => onBoatPress(boat)} 
      style={({ pressed }) => [styles.viewButton, pressed && { opacity: 0.8 }]}
    >
      <Icon name="visibility" size={16} color="#fff" />
      <Text style={styles.viewButtonText}>View</Text>
    </Pressable>
  </View>
);

const FilterChip = ({ label, isActive, onPress }: { 
  label: string; 
  isActive: boolean; 
  onPress: () => void;
}) => (
  <Pressable 
    onPress={onPress}
    style={[styles.filterChip, isActive && styles.filterChipActive]}
  >
    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
      {label}
    </Text>
  </Pressable>
);

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Icon name="directions_boat" size={64} color={PALETTE.text400} />
    <Text style={styles.emptyTitle}>No boats found</Text>
    <Text style={styles.emptyMessage}>
      There are no boats available at the moment.
    </Text>
  </View>
);

export default function MFDBoatsList() {
  const navigation = useNavigation<Nav>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [filter, setFilter] = useState('All');
  const [meta, setMeta] = useState<any>(null);

  const loadBoats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchBoats({ 
        page: 1, 
        per_page: 20,
        status: filter === 'All' ? undefined : filter.toLowerCase()
      });
      setBoats(response.data);
      setMeta(response);
    } catch (error) {
      console.error('Error loading boats:', error);
      Toast.show({
        type: 'error',
        text1: 'Loading Failed',
        text2: 'Failed to load boats. Please try again.',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBoats();
    setRefreshing(false);
  }, [loadBoats]);

  useEffect(() => {
    loadBoats();
  }, [loadBoats]);

  const handleBoatPress = (boat: Boat) => {
    navigation.navigate('BoatDetails', { boatId: boat.id });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const filters = ['All', 'Active', 'Inactive', 'Pending'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PALETTE.green700} />
        <Text style={styles.loadingText}>Loading boats...</Text>
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
        <Text style={styles.headerTitle}>MFD Boats</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filter by status</Text>
        <View style={styles.filtersRow}>
          {filters.map((filterName) => (
            <FilterChip
              key={filterName}
              label={filterName}
              isActive={filter === filterName}
              onPress={() => setFilter(filterName)}
            />
          ))}
        </View>
      </View>

      {/* Boats List */}
      <FlatList
        data={boats}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <BoatCard 
            boat={item} 
            onBoatPress={handleBoatPress}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
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
  headerSpacer: {
    width: 40,
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
    color: PALETTE.text700,
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PALETTE.gray100,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  filterChipActive: {
    backgroundColor: PALETTE.green700,
    borderColor: PALETTE.green700,
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
  boatCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  registrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registrationNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PALETTE.text700,
    marginLeft: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  boatInfo: {
    marginBottom: 12,
  },
  boatName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text700,
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: PALETTE.text600,
    marginBottom: 2,
  },
  boatType: {
    fontSize: 14,
    color: PALETTE.text600,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: PALETTE.text400,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text700,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  portContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  homePort: {
    fontSize: 12,
    color: PALETTE.text500,
    marginLeft: 4,
  },
  createdDate: {
    fontSize: 12,
    color: PALETTE.text400,
  },
  viewButton: {
    backgroundColor: PALETTE.green700,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
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
    fontWeight: '600',
    color: PALETTE.text600,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: PALETTE.text400,
    textAlign: 'center',
    lineHeight: 20,
  },
});