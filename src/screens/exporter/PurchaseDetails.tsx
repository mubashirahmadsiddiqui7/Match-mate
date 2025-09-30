import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Pressable,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import {
  fetchExporterPurchaseById,
  processExporterPurchase,
  completeExporterPurchase,
  type ExporterPurchase,
  getStatusColor,
  getStatusText,
  formatDate,
  formatDateTime,
} from '../../services/exporter';

type RouteParams = {
  purchaseId: string;
};

export default function PurchaseDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { purchaseId } = route.params as RouteParams;

  const [purchase, setPurchase] = useState<ExporterPurchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPurchase();
  }, [purchaseId]);

  const loadPurchase = async () => {
    try {
      setLoading(true);
      const data = await fetchExporterPurchaseById(purchaseId);
      setPurchase(data);
    } catch (error) {
      console.error('Error loading purchase:', error);
      Alert.alert('Error', 'Failed to load purchase details.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!purchase) return;

    const proceed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Mark as Processed',
        'Are you sure you want to mark this purchase as processed?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Process', style: 'default', onPress: () => resolve(true) },
        ],
        { cancelable: true },
      );
    });

    if (!proceed) return;

    try {
      setActionLoading(true);
      await processExporterPurchase(purchase.id);
      Alert.alert('Success', 'Purchase marked as processed successfully.');
      loadPurchase(); // Refresh data
    } catch (error) {
      console.error('Error processing purchase:', error);
      Alert.alert('Error', 'Failed to process purchase. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!purchase) return;

    const proceed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Mark as Complete',
        'Are you sure you want to mark this purchase as complete?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Complete', style: 'default', onPress: () => resolve(true) },
        ],
        { cancelable: true },
      );
    });

    if (!proceed) return;

    try {
      setActionLoading(true);
      await completeExporterPurchase(purchase.id);
      Alert.alert('Success', 'Purchase marked as complete successfully.');
      loadPurchase(); // Refresh data
    } catch (error) {
      console.error('Error completing purchase:', error);
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.green700} />
          <Text style={styles.loadingText}>Loading purchase details...</Text>
        </View>
      </View>
    );
  }

  if (!purchase) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Icon name="error" size={48} color={PALETTE.error} />
          <Text style={styles.errorText}>Purchase not found</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(purchase.status);
  const statusText = purchase.status_label || getStatusText(purchase.status);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Purchase Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Purchase Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Purchase #{purchase.id}</Text>
              <Text style={styles.cardSubtitle}>{purchase.final_product_name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>

          {/* Purchase Details */}
          <View style={styles.detailsSection}>
            <DetailRow label="Purchase Reference" value={purchase.purchase_reference} />
            <DetailRow label="Total Quantity" value={`${Number(purchase.total_quantity_kg).toFixed(2)} kg`} />
            <DetailRow label="Final Weight" value={`${Number(purchase.final_weight_quantity).toFixed(2)} kg`} />
            <DetailRow label="Total Value" value={`$${purchase.total_value}`} />
            <DetailRow label="Created" value={formatDateTime(purchase.created_at)} />
            <DetailRow label="Updated" value={formatDateTime(purchase.updated_at)} />
          </View>

          {/* Processing Notes */}
          {purchase.processing_notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Processing Notes</Text>
              <Text style={styles.notesText}>{purchase.processing_notes}</Text>
            </View>
          )}
        </View>

        {/* Company Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Company Information</Text>
          <DetailRow label="Company Name" value={purchase.company?.name || '—'} />
          <DetailRow label="Email" value={purchase.company?.email || '—'} />
          <DetailRow label="Phone" value={purchase.company?.phone || '—'} />
          <DetailRow label="Export License" value={purchase.company?.export_license_number || '—'} />
        </View>

        {/* Middleman Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Middleman Information</Text>
          <DetailRow label="Name" value={purchase.middle_man?.name || '—'} />
          <DetailRow label="Email" value={purchase.middle_man?.email || '—'} />
          <DetailRow label="Phone" value={purchase.middle_man?.phone || '—'} />
          <DetailRow label="Company" value={purchase.middle_man?.company_name || '—'} />
        </View>

        {/* Exporter Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Exporter Information</Text>
          <DetailRow label="Name" value={purchase.exporter?.name || '—'} />
          <DetailRow label="Email" value={purchase.exporter?.email || '—'} />
          <DetailRow label="Phone" value={purchase.exporter?.phone || '—'} />
          <DetailRow label="Export License" value={purchase.exporter?.export_license_number || '—'} />
        </View>

        {/* Purchased Lots Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Purchased Lots ({purchase.purchased_lots?.length || 0})</Text>
          {(purchase.enriched_purchased_lots || purchase.purchased_lots || []).map((lot, index) => {
            const enrichedLot = purchase.enriched_purchased_lots?.[index];
            return (
              <View key={index} style={styles.lotItem}>
                <View style={styles.lotHeader}>
                  <Text style={styles.lotNumber}>Lot #{lot.lot_no}</Text>
                  <Text style={styles.lotQuantity}>{Number(lot.quantity_kg).toFixed(2)} kg</Text>
                </View>
                {enrichedLot && (
                  <View style={styles.lotDetails}>
                    <View style={styles.lotDetailRow}>
                      <Text style={styles.lotDetailLabel}>Species:</Text>
                      <Text style={styles.lotDetailValue}>{enrichedLot.species_name}</Text>
                    </View>
                    <View style={styles.lotDetailRow}>
                      <Text style={styles.lotDetailLabel}>Grade:</Text>
                      <Text style={styles.lotDetailValue}>{enrichedLot.grade}</Text>
                    </View>
                    <View style={styles.lotDetailRow}>
                      <Text style={styles.lotDetailLabel}>Type:</Text>
                      <Text style={styles.lotDetailValue}>{enrichedLot.type}</Text>
                    </View>
                    {enrichedLot.notes && (
                      <View style={styles.lotDetailRow}>
                        <Text style={styles.lotDetailLabel}>Notes:</Text>
                        <Text style={styles.lotDetailValue}>{enrichedLot.notes}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {purchase.status === 'confirmed' && (
          <Pressable
            onPress={handleProcess}
            disabled={actionLoading}
            style={({ pressed }) => [
              styles.actionButton,
              styles.processButton,
              pressed && { opacity: 0.9 },
              actionLoading && { opacity: 0.6 }
            ]}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="build" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Mark as Processed</Text>
              </>
            )}
          </Pressable>
        )}

        {purchase.status === 'processed' && (
          <Pressable
            onPress={handleComplete}
            disabled={actionLoading}
            style={({ pressed }) => [
              styles.actionButton,
              styles.completeButton,
              pressed && { opacity: 0.9 },
              actionLoading && { opacity: 0.6 }
            ]}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="check-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Mark as Complete</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: PALETTE.error,
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.text900,
  },
  cardSubtitle: {
    fontSize: 14,
    color: PALETTE.text600,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.text900,
    marginBottom: 16,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: PALETTE.text600,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: PALETTE.text900,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text900,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: PALETTE.text700,
    lineHeight: 20,
  },
  lotItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  lotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lotNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text900,
  },
  lotQuantity: {
    fontSize: 14,
    color: PALETTE.text600,
  },
  lotDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  lotDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lotDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.text600,
    width: '30%',
  },
  lotDetailValue: {
    fontSize: 12,
    color: PALETTE.text900,
    flex: 1,
    textAlign: 'right',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  processButton: {
    backgroundColor: '#9c27b0',
  },
  completeButton: {
    backgroundColor: '#4caf50',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});
