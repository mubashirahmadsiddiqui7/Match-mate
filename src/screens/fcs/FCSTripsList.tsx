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
import { listTripsPage, type TripRowDTO } from '../../services/trips';

type Nav = NativeStackNavigationProp<FCSStackParamList>;

export default function FCSTripsList() {
  const navigation = useNavigation<Nav>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<TripRowDTO[]>([]);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed' | 'Pending'>('All');

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listTripsPage({ page: 1, per_page: 50 });
      setTrips(data.rows || []);
    } catch (error) {
      console.error('Error loading trips:', error);
      Alert.alert('Error', 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, [loadTrips]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleTripPress = (trip: TripRowDTO) => {
    navigation.navigate('TripDetails', { tripId: String(trip.id), trip: trip as any });
  };

  const handleApprove = async (trip: TripRowDTO) => {
    Alert.alert(
      'Approve Trip',
      `Are you sure you want to approve trip ${trip.trip_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          style: 'default',
          onPress: () => {
            // TODO: Implement approve trip API call
            Alert.alert('Success', 'Trip approved successfully');
            loadTrips();
          }
        }
      ]
    );
  };

  const handleReject = async (trip: TripRowDTO) => {
    Alert.alert(
      'Reject Trip',
      `Are you sure you want to reject trip ${trip.trip_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement reject trip API call
            Alert.alert('Success', 'Trip rejected successfully');
            loadTrips();
          }
        }
      ]
    );
  };

  const filteredTrips = trips.filter(trip => {
    switch (filter) {
      case 'Active': return trip.status === 'active';
      case 'Completed': return trip.status === 'completed';
      case 'Pending': return trip.status === 'pending' || trip.status === 'pending_approval';
      default: return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return PALETTE.blue700;
      case 'completed': return PALETTE.green700;
      case 'pending':
      case 'pending_approval': return PALETTE.orange700;
      default: return PALETTE.text600;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'pending':
      case 'pending_approval': return 'Pending';
      default: return status;
    }
  };

  const TripCard = ({ trip }: { trip: TripRowDTO }) => (
    <Pressable 
      onPress={() => handleTripPress(trip)} 
      style={({ pressed }) => [styles.tripCard, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripId}>{trip.trip_name}</Text>
          <Text style={styles.boatName}>{trip.boat_name || 'Unknown Boat'}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: getStatusColor(trip.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
            {getStatusLabel(trip.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.tripDetails}>
        <View style={styles.detailRow}>
          <Icon name="person" size={16} color={PALETTE.text600} />
          <Text style={styles.detailText}>{trip.fisherman_name || 'Unknown Captain'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="location-on" size={16} color={PALETTE.text600} />
          <Text style={styles.detailText}>{trip.departure_port || 'Unknown Port'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color={PALETTE.text600} />
          <Text style={styles.detailText}>
            {trip.departure_time || trip.created_at || 'Unknown Date'}
          </Text>
        </View>
      </View>

      {(trip.status === 'pending' || trip.status === 'pending_approval') && (
        <View style={styles.actionButtons}>
          <Pressable 
            onPress={() => handleApprove(trip)}
            style={[styles.actionButton, styles.approveButton]}
          >
            <Icon name="check" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </Pressable>
          <Pressable 
            onPress={() => handleReject(trip)}
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
        <Text style={styles.loadingText}>Loading trips...</Text>
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
        <Text style={styles.headerTitle}>FCS Trips Management</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filter by status</Text>
        <View style={styles.filtersRow}>
          {(['All', 'Active', 'Completed', 'Pending'] as const).map((status) => (
            <FilterChip
              key={status}
              label={status}
              isActive={filter === status}
              onPress={() => setFilter(status)}
            />
          ))}
        </View>
      </View>

      {/* Trips List */}
      <FlatList
        data={filteredTrips}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <TripCard trip={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="sailing" size={64} color={PALETTE.text400} />
            <Text style={styles.emptyTitle}>No trips found</Text>
            <Text style={styles.emptyMessage}>
              {filter === 'All' 
                ? "No trips available at the moment."
                : `No ${filter.toLowerCase()} trips found.`
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
  tripCard: {
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
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginBottom: 4,
  },
  boatName: {
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
  tripDetails: {
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
