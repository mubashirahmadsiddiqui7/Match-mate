import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import { ExporterStackParamList } from '../../app/navigation/stacks/ExporterStack';
import { TraceabilityRecord } from '../../services/traceability';

type ViewRecordRouteProp = RouteProp<ExporterStackParamList, 'ViewRecord'>;
type ViewRecordNavigationProp = NativeStackNavigationProp<ExporterStackParamList, 'ViewRecord'>;

export default function ViewRecord() {
  const navigation = useNavigation<ViewRecordNavigationProp>();
  const route = useRoute<ViewRecordRouteProp>();
  const { record } = route.params;
  
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleGenerateDocument = () => {
    navigation.navigate('traceabilityForm', { recordId: record.id });
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return '#757575';
    switch (status.toLowerCase()) {
      case 'approved': return '#2e7d32';
      case 'pending': return '#f57c00';
      case 'rejected': return '#d32f2f';
      default: return '#757575';
    }
  };

  const getStatusBgColor = (status: string | null | undefined) => {
    if (!status) return '#F5F5F5';
    switch (status.toLowerCase()) {
      case 'approved': return '#E8F5E9';
      case 'pending': return '#FFF3E0';
      case 'rejected': return '#FFEBEE';
      default: return '#F5F5F5';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
          <Icon name="arrow-back" size={24} color={PALETTE.text900} />
        </Pressable>
        <Text style={styles.headerTitle}>Record Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Document Header */}
        <View style={styles.card}>
          <View style={styles.documentHeader}>
            <View style={styles.documentInfo}>
              <Text style={styles.documentNumber}>{record.document_no}</Text>
              <Text style={styles.mfdId}>MFD ID: {record.mfd_manual_id || 'N/A'}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: getStatusBgColor(record.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                {record.status_label}
              </Text>
            </View>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.fieldGrid}>
            <Field label="Exporter" value={record.exporter_name} />
            <Field label="Company" value={record.company?.company_name || 'N/A'} />
            <Field label="Invoice No" value={record.invoice_no} />
            <Field label="Export Certificate No" value={record.export_certificate_no} />
            <Field label="Document Date" value={formatDate(record.document_date)} />
            <Field label="Shipment Date" value={formatDate(record.date_of_shipment)} />
          </View>
        </View>

        {/* Consignee Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Consignee Information</Text>
          <View style={styles.fieldGrid}>
            <Field label="Consignee Name" value={record.consignee_name} />
            <Field label="Consignee Country" value={record.consignee_country} />
          </View>
        </View>

        {/* Plant Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Plant Information</Text>
          <View style={styles.fieldGrid}>
            <Field label="Plant Address" value={record.plant_address} />
            <Field label="Validating Authority" value={record.validating_authority} />
          </View>
        </View>

        {/* Quantities & Values */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quantities & Values</Text>
          <View style={styles.fieldGrid}>
            <Field label="Total Quantity (KG)" value={`${record.total_quantity_kg} KG`} />
            <Field label="Total Value" value={`$${record.total_value}`} />
          </View>
        </View>

        {/* Selected Lots */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selected Lots</Text>
          {record.selected_lots && record.selected_lots.length > 0 ? (
            <View style={styles.lotsContainer}>
              {record.selected_lots.map((lot, index) => (
                <View key={index} style={styles.lotItem}>
                  <View style={styles.lotHeader}>
                    <Text style={styles.lotNumber}>{lot.lot_no}</Text>
                    <Text style={styles.lotQuantity}>{lot.quantity} KG</Text>
                  </View>
                  <Text style={styles.lotProduct}>{lot.final_product_name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noData}>No lots selected</Text>
          )}
        </View>

        {/* Approval Information */}
        {(record.status === 'approved' || record.status === 'rejected') && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Approval Information</Text>
            <View style={styles.fieldGrid}>
              <Field label="Approved By" value={record.approver?.name || 'N/A'} />
              <Field label="Approved At" value={record.approved_at ? formatDate(record.approved_at) : 'N/A'} />
              {record.approval_notes && (
                <Field label="Approval Notes" value={record.approval_notes} />
              )}
            </View>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Timestamps</Text>
          <View style={styles.fieldGrid}>
            <Field label="Created At" value={formatDate(record.created_at)} />
            <Field label="Updated At" value={formatDate(record.updated_at)} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable 
            onPress={handleGenerateDocument} 
            style={({ pressed }) => [styles.generateBtn, pressed && { opacity: 0.8 }]}
          >
            <Icon name="description" size={20} color="#fff" />
            <Text style={styles.generateBtnText}>Generate Document</Text>
          </Pressable>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text900,
  },
  headerRight: {
    width: 40,
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentInfo: {
    flex: 1,
  },
  documentNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.green700,
    marginBottom: 4,
  },
  mfdId: {
    fontSize: 14,
    color: PALETTE.text600,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.text900,
    marginBottom: 12,
  },
  fieldGrid: {
    gap: 12,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fieldLabel: {
    fontSize: 14,
    color: PALETTE.text600,
    fontWeight: '600',
    flex: 1,
  },
  fieldValue: {
    fontSize: 14,
    color: PALETTE.text900,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  lotsContainer: {
    gap: 8,
  },
  lotItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  lotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lotNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.green700,
  },
  lotQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text700,
  },
  lotProduct: {
    fontSize: 13,
    color: PALETTE.text600,
  },
  noData: {
    fontSize: 14,
    color: PALETTE.text500,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionsContainer: {
    marginTop: 8,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.green700,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 20,
  },
});
