import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MiddleManStackParamList } from '../../app/navigation/stacks/MiddleManStack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import {
  fetchDistributionById,
  type FishLotDistribution,
  getStatusColor,
  getStatusText,
  formatDate,
  formatDateTime,
} from '../../services/middlemanDistribution';

// --- Types ---
type Nav = NativeStackNavigationProp<MiddleManStackParamList, 'MiddleManHome'>;
type Route = RouteProp<MiddleManStackParamList, 'distributionDetails'>;

export default function DistributionDetails() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { distributionId } = route.params || { distributionId: 0 };

  const [distribution, setDistribution] = useState<FishLotDistribution | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Fetch Distribution Details ---
  const loadDistributionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetchDistributionById(distributionId);
      setDistribution(response);
    } catch (error) {
      console.error('Error loading distribution details:', error);
      Alert.alert('Error', 'Failed to load distribution details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDistributionDetails();
  }, [distributionId]);

  // --- Loader ---
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.green700} />
          <Text style={styles.loadingText}>Loading distribution details...</Text>
        </View>
      </View>
    );
  }

  if (!distribution) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Distribution not found</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(distribution.verification_status);
  const statusText = distribution.verification_status_label || getStatusText(distribution.verification_status);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Distribution Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Distribution Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="info" size={20} color={PALETTE.blue700} />
            <Text style={styles.cardTitle}>Distribution Information</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Row label="Status" value={statusText} valueColor={statusColor} />
            <Row label="Total Quantity" value={`${distribution.total_quantity_kg} KG`} />
            <Row label="Total Value" value={distribution.total_value ? `$${distribution.total_value}` : 'N/A'} />
            <Row label="Created Date" value={formatDateTime(distribution.created_at)} />
            <Row label="Updated Date" value={formatDateTime(distribution.updated_at)} />
            {distribution.verification_notes && (
              <Row label="Verification Notes" value={distribution.verification_notes} />
            )}
          </View>
        </View>

        {/* Trip Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="directions-boat" size={20} color={PALETTE.blue700} />
            <Text style={styles.cardTitle}>Trip Information</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Row label="Trip ID" value={distribution.trip?.trip_id || '—'} />
            <Row label="Boat Name" value={distribution.trip?.boat_name || 'N/A'} />
            <Row label="Departure Site" value={distribution.trip?.departure_site || '—'} />
            <Row label="Landing Site" value={distribution.trip?.landing_site || '—'} />
            <Row label="Trip Status" value={distribution.trip?.status_label || '—'} />
            <Row label="Trip Completed" value={distribution.trip?.trip_completed ? 'Yes' : 'No'} />
          </View>
        </View>

        {/* Distributed Lots Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="inventory" size={20} color={PALETTE.blue700} />
            <Text style={styles.cardTitle}>Distributed Lots ({distribution.distributed_lots.length})</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>LOT NUMBER</Text>
              <Text style={styles.tableHeaderText}>SPECIES</Text>
              <Text style={styles.tableHeaderText}>QUANTITY</Text>
              <Text style={styles.tableHeaderText}>NOTES</Text>
            </View>
            
            {distribution.processed_lots.map((lot, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.lotNumber}>{lot.lot_no}</Text>
                <Text style={styles.speciesText}>{lot.species_name || 'Unknown'}</Text>
                <Text style={styles.quantityText}>{lot.quantity_kg} KG</Text>
                <Text style={styles.notesText}>{lot.notes || 'No notes'}</Text>
              </View>
            ))}
            
            <View style={styles.tableFooter}>
              <Text style={styles.footerLabel}>TOTAL LOTS:</Text>
              <Text style={styles.footerValue}>{distribution.processed_lots.length}</Text>
              <Text style={styles.footerLabel}>TOTAL QUANTITY:</Text>
              <Text style={styles.footerValue}>{distribution.total_quantity_kg} KG</Text>
            </View>
          </View>
        </View>

        {/* Verification Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="verified" size={20} color={PALETTE.blue700} />
            <Text style={styles.cardTitle}>Verification Details</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Row label="Verified By" value={distribution.verifier?.name || '—'} />
            <Row label="Verified At" value={distribution.verified_at ? formatDateTime(distribution.verified_at) : '—'} />
          </View>
        </View>

        {/* Fisherman Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="person" size={20} color={PALETTE.green700} />
            <Text style={styles.cardTitle}>Fisherman</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.contactCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {distribution.trip?.fisherman?.name?.charAt(0) || 'F'}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{distribution.trip?.fisherman?.name || '—'}</Text>
                <Text style={styles.contactRole}>{distribution.trip?.fisherman?.user_type || '—'}</Text>
                <Text style={styles.contactEmail}>{distribution.trip?.fisherman?.email || '—'}</Text>
                <Text style={styles.contactPhone}>{distribution.trip?.fisherman?.phone || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Middle Man Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="person" size={20} color={PALETTE.green700} />
            <Text style={styles.cardTitle}>Middle Man</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.contactCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {distribution.middle_man?.name?.charAt(0) || 'M'}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{distribution.middle_man?.name || '—'}</Text>
                <Text style={styles.contactRole}>{distribution.middle_man?.user_type || '—'}</Text>
                <Text style={styles.contactEmail}>{distribution.middle_man?.email || '—'}</Text>
                <Text style={styles.contactPhone}>{distribution.middle_man?.phone || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="settings" size={20} color={PALETTE.blue700} />
            <Text style={styles.cardTitle}>Actions</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.actionsText}>No actions available at this time</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// --- Components ---

const Row = ({ 
  label, 
  value, 
  valueColor 
}: { 
  label: string; 
  value: string; 
  valueColor?: string; 
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}:</Text>
    <Text style={[styles.rowValue, valueColor && { color: valueColor }]} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PALETTE.text600,
  },
  errorText: {
    fontSize: 16,
    color: PALETTE.text600,
  },
  header: {
    backgroundColor: PALETTE.green700,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginLeft: 8,
  },
  cardContent: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text600,
    width: '40%',
  },
  rowValue: {
    fontSize: 14,
    color: PALETTE.text900,
    flex: 1,
    textAlign: 'right',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.text600,
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lotNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.green700,
    flex: 1,
    textAlign: 'center',
  },
  speciesText: {
    fontSize: 12,
    color: PALETTE.text900,
    flex: 1,
    textAlign: 'center',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.text900,
    flex: 1,
    textAlign: 'center',
  },
  notesText: {
    fontSize: 12,
    color: PALETTE.text600,
    flex: 1,
    textAlign: 'center',
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.text600,
  },
  footerValue: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.text900,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PALETTE.green700,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginBottom: 4,
  },
  contactRole: {
    fontSize: 12,
    color: PALETTE.text600,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 12,
    color: PALETTE.text600,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 12,
    color: PALETTE.text600,
  },
  actionsText: {
    fontSize: 14,
    color: PALETTE.text600,
    fontStyle: 'italic',
  },
});