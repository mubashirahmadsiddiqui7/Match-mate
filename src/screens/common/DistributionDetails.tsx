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
import { fetchDistributionById, type FishLotDistribution } from '../../services/middlemanDistribution';

type DistributionDetailsRouteProp = RouteProp<{ params: { distributionId: string; distribution: FishLotDistribution } }, 'params'>;

export default function DistributionDetails() {
  const route = useRoute<DistributionDetailsRouteProp>();
  const { distributionId, distribution: initialDistribution } = route.params;
  
  const [distribution, setDistribution] = useState<FishLotDistribution | null>(initialDistribution);
  const [loading, setLoading] = useState(!initialDistribution);

  useEffect(() => {
    if (!initialDistribution) {
      loadDistribution();
    }
  }, [distributionId, initialDistribution]);

  const loadDistribution = async () => {
    try {
      setLoading(true);
      const distributionData = await fetchDistributionById(parseInt(distributionId, 10));
      setDistribution(distributionData);
    } catch (error) {
      console.error('Error loading distribution:', error);
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
        <Text style={styles.loadingText}>Loading distribution details...</Text>
      </View>
    );
  }

  if (!distribution) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color={PALETTE.error} />
        <Text style={styles.errorTitle}>Distribution not found</Text>
        <Text style={styles.errorMessage}>The requested distribution could not be found.</Text>
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Distribution Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Distribution Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.distributionId}>Distribution #{distribution.id}</Text>
            <View style={[styles.statusPill, { backgroundColor: getStatusColor(distribution.verification_status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(distribution.verification_status) }]}>
                {getStatusLabel(distribution.verification_status)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.tripId}>Trip: {distribution.trip?.trip_id || 'Unknown'}</Text>
        </View>

        {/* Distribution Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Distribution Information</Text>
          
          <DetailRow 
            icon="person" 
            label="Middleman" 
            value={distribution.middle_man?.name || 'Unknown'} 
          />
          <DetailRow 
            icon="scale" 
            label="Total Weight" 
            value={`${distribution.total_quantity_kg || 0} kg`} 
          />
          <DetailRow 
            icon="inventory" 
            label="Number of Lots" 
            value={String(distribution.distributed_lots?.length || 0)} 
          />
          <DetailRow 
            icon="schedule" 
            label="Created Date" 
            value={new Date(distribution.created_at).toLocaleString()} 
          />
          {distribution.verified_at && (
            <DetailRow 
              icon="verified" 
              label="Verified Date" 
              value={new Date(distribution.verified_at).toLocaleString()} 
            />
          )}
        </View>

        {/* Trip Information */}
        {distribution.trip && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Trip Information</Text>
            
            <DetailRow 
              icon="sailing" 
              label="Boat Name" 
              value={distribution.trip.boat_name || 'Unknown'} 
            />
            <DetailRow 
              icon="person" 
              label="Captain" 
              value={distribution.trip.captain_name || 'Unknown'} 
            />
            <DetailRow 
              icon="location-on" 
              label="Fishing Zone" 
              value={distribution.trip.fishing_zone || 'Not specified'} 
            />
            <DetailRow 
              icon="place" 
              label="Port Location" 
              value={distribution.trip.port_location || 'Not specified'} 
            />
          </View>
        )}

        {/* Middleman Information */}
        {distribution.middle_man && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Middleman Information</Text>
            
            <DetailRow 
              icon="person" 
              label="Name" 
              value={distribution.middle_man.name} 
            />
            <DetailRow 
              icon="email" 
              label="Email" 
              value={distribution.middle_man.email || 'Not provided'} 
            />
            <DetailRow 
              icon="phone" 
              label="Phone" 
              value={distribution.middle_man.phone || 'Not provided'} 
            />
          </View>
        )}

        {/* Distributed Lots */}
        {distribution.distributed_lots && distribution.distributed_lots.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Distributed Lots</Text>
            
            {distribution.distributed_lots.map((lot, index) => (
              <View key={index} style={styles.lotItem}>
                <View style={styles.lotHeader}>
                  <Text style={styles.lotNumber}>Lot #{lot.lot_no || lot.lot_id}</Text>
                  <Text style={styles.lotQuantity}>{lot.quantity_kg} kg</Text>
                </View>
                {lot.notes && (
                  <Text style={styles.lotNotes}>{lot.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Verification Information */}
        {distribution.verification_notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verification Notes</Text>
            <Text style={styles.verificationNotes}>{distribution.verification_notes}</Text>
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
  distributionId: {
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
  tripId: {
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
  lotItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  lotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lotNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text900,
  },
  lotQuantity: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.green700,
  },
  lotNotes: {
    fontSize: 12,
    color: PALETTE.text600,
    fontStyle: 'italic',
  },
  verificationNotes: {
    fontSize: 14,
    color: PALETTE.text900,
    lineHeight: 20,
  },
});
