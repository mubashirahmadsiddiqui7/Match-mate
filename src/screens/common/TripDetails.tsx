import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import { getTripById, type TripRowDTO } from '../../services/trips';

type TripDetailsRouteProp = RouteProp<{ params: { tripId: string; trip: TripRowDTO } }, 'params'>;

export default function TripDetails() {
  const route = useRoute<TripDetailsRouteProp>();
  const { tripId, trip: initialTrip } = route.params;
  
  const [trip, setTrip] = useState<TripRowDTO | null>(initialTrip);
  const [loading, setLoading] = useState(!initialTrip);

  useEffect(() => {
    if (!initialTrip) {
      loadTrip();
    }
  }, [tripId, initialTrip]);

  const loadTrip = async () => {
    try {
      setLoading(true);
      const tripData = await getTripById(tripId);
      setTrip(tripData);
    } catch (error) {
      console.error('Error loading trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // @ts-ignore
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PALETTE.green700} />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color={PALETTE.error} />
        <Text style={styles.errorTitle}>Trip not found</Text>
        <Text style={styles.errorMessage}>The requested trip could not be found.</Text>
      </View>
    );
  }

  const DetailRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.detailRow}>
      <Icon name={icon} size={20} color={PALETTE.text600} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Trip Info Card */}
        <View style={styles.card}>
                  <View style={styles.cardHeader}>
          <Text style={styles.tripId}>{trip.trip_name}</Text>
          <View style={[styles.statusPill, { backgroundColor: PALETTE.green700 + '20' }]}>
            <Text style={[styles.statusText, { color: PALETTE.green700 }]}>
              {trip.status}
            </Text>
          </View>
        </View>
        
        <Text style={styles.boatName}>{trip.boat_name || 'Unknown Boat'}</Text>
        </View>

        {/* Trip Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Information</Text>
          
          <DetailRow 
            icon="person" 
            label="Fisherman" 
            value={trip.fisherman_name || 'Unknown'} 
          />
          <DetailRow 
            icon="location-on" 
            label="Departure Port" 
            value={trip.departure_port || 'Not specified'} 
          />
          <DetailRow 
            icon="place" 
            label="Destination Port" 
            value={trip.destination_port || 'Not specified'} 
          />
          <DetailRow 
            icon="schedule" 
            label="Departure Time" 
            value={trip.departure_time || 'Not specified'} 
          />
          <DetailRow 
            icon="schedule" 
            label="Created At" 
            value={trip.created_at || 'Not specified'} 
          />
        </View>

        {/* Additional Information */}
        {trip.trip_type_label && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Trip Type</Text>
            <DetailRow 
              icon="sailing" 
              label="Type" 
              value={trip.trip_type_label} 
            />
          </View>
        )}
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: PALETTE.text600,
    textAlign: 'center',
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
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
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
    marginBottom: 8,
  },
  tripId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text900,
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
  boatName: {
    fontSize: 16,
    color: PALETTE.text600,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: PALETTE.text600,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: PALETTE.text900,
    fontWeight: '500',
  },
});
