/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, TextInput, Platform, FlatList, Modal, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import PALETTE from '../../theme/palette';
import { fetchPurchasePrefill, type PurchasePrefillData, createTraceabilityRecord } from '../../services/traceability';
import { fetchPurchasesForTraceability, type ExporterPurchase } from '../../services/exporter';
import { getUser } from '../../services/users';


function Field({ label, value, onChangeText, keyboardType, placeholder, required = false }: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>
        {label} {required && <Text style={{ color: '#DC2626' }}>*</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder || label}
        placeholderTextColor="#9CA3AF"
        style={styles.input}
      />
    </View>
  );
}

const ItemSeparator = () => <View style={{ height: 6 }} />;

export default function TraceabilityForm() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [purchases, setPurchases] = useState<ExporterPurchase[]>([]);
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<number[]>([]);
  const [selectedPrefills, setSelectedPrefills] = useState<PurchasePrefillData[]>([]);

  const [invoiceNo, setInvoiceNo] = useState('');
  const [exportCertNo, setExportCertNo] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeCountry, setConsigneeCountry] = useState('');
  const [shipmentDate, setShipmentDate] = useState(new Date());
  const [showShipmentDatePicker, setShowShipmentDatePicker] = useState(false);
  const [finalWeight, setFinalWeight] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [exporterId, setExporterId] = useState<number | null>(null);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const handleShipmentDateChange = (event: any, selectedDate?: Date) => {
    setShowShipmentDatePicker(false);
    if (selectedDate) {
      setShipmentDate(selectedDate);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [user, purchasesList] = await Promise.all([getUser(), fetchPurchasesForTraceability()]);
        setExporterId(user?.id ?? null);
        setPurchases(purchasesList);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const togglePurchasePick = (purchaseId: number) => {
    setSelectedPurchaseIds(prev => prev.includes(purchaseId) ? prev.filter(id => id !== purchaseId) : [...prev, purchaseId]);
  };

  const applySelectedPurchases = async () => {
    if (selectedPurchaseIds.length === 0) {
      Alert.alert('Select Purchases', 'Please select at least one purchase.');
      return;
    }
    try {
      setLoading(true);
      const prefills = await Promise.all(selectedPurchaseIds.map(id => fetchPurchasePrefill(id)));
      setSelectedPrefills(prefills);
      // Pre-fill final weight with sum of selected purchases final weights
      const sumFinal = prefills.reduce((acc, p) => acc + (Number(p.final_weight_quantity) || 0), 0);
      setFinalWeight(String(sumFinal || ''));
      setPurchaseModal(false);
    } catch (error) {
      console.error('Error loading purchases prefill:', error);
      Alert.alert('Error', 'Failed to load purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPurchase = useMemo(() => {
    if (selectedPurchaseIds.length === 1) return purchases.find(p => p.id === selectedPurchaseIds[0]);
    return null;
  }, [purchases, selectedPurchaseIds]);

  const lots = useMemo(() => {
    if (!selectedPrefills || selectedPrefills.length === 0) return [];
    const rows: Array<{ lot_no: string; final_product_name: string; quantity_kg: string; purchase_id: number; company_name?: string }>=[];
    selectedPrefills.forEach(p => {
      p.lots.forEach(l => {
        rows.push({ lot_no: l.lot_no, final_product_name: p.final_product_name, quantity_kg: String(l.quantity_kg), purchase_id: p.purchase_id, company_name: p.exporter?.company_name || p.exporter?.name });
      });
    });
    return rows;
  }, [selectedPrefills]);

  const totalQuantityKg = useMemo(() => {
    return lots.reduce((acc, l) => acc + (parseFloat(l.quantity_kg || '0') || 0), 0);
  }, [lots]);

  const handleSubmit = useCallback(async () => {
    if (!exporterId) {
      Alert.alert('Error', 'Missing exporter account.');
      return;
    }
    if (selectedPrefills.length === 0) {
      Alert.alert('Missing Purchase', 'Please select at least one purchase.');
      return;
    }
    if (!invoiceNo || !consigneeName || !consigneeCountry) {
      Alert.alert('Missing Info', 'Please fill required fields.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const body = {
        exporter_id: exporterId,
        company_id: selectedPrefills[0]?.company_id ?? null,
        exporter_purchase_ids: selectedPurchaseIds,
        invoice_no: invoiceNo,
        consignee_name: consigneeName,
        consignee_country: consigneeCountry,
        date_of_shipment: formatDate(shipmentDate),
        export_certificate_no: exportCertNo || undefined,
        selected_lots: lots.map(l => ({
          lot_no: l.lot_no,
          final_product_name: l.final_product_name,
          quantity: l.quantity_kg || '0',
          purchase_id: l.purchase_id,
        })),
        total_quantity_kg: String(totalQuantityKg),
        final_weight_quantity: finalWeight,
        notes: additionalInfo || undefined,
      } as any;

      await createTraceabilityRecord(body);
      Alert.alert('Success', 'Traceability record created successfully.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create record');
    } finally {
      setSubmitting(false);
    }
  }, [exporterId, selectedPrefills, selectedPurchaseIds, invoiceNo, consigneeName, consigneeCountry, shipmentDate, exportCertNo, lots, totalQuantityKg, finalWeight, additionalInfo, navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.green50 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => (navigation as any).goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
            <Icon name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Traceability Record</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Purchase Selection */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Icon name="shopping-cart" size={20} color={PALETTE.green700} />
            <Text style={styles.sectionTitle}>Purchase Selection</Text>
          </View>
          <Text style={styles.label}>
            Exporter Purchase <Text style={{ color: '#DC2626' }}>*</Text>
          </Text>
          <Pressable onPress={() => setPurchaseModal(true)} style={({ pressed }) => [styles.select, pressed && { opacity: 0.95 }]}>
            <View style={styles.selectedPurchase}>
              {selectedPurchaseIds.length > 0 ? (
                <Text style={styles.selectedPurchaseText}>
                  {selectedPurchaseIds.length === 1 && selectedPurchase ? (
                    `${selectedPurchase.id} - ${selectedPurchase.exporter?.name} (${selectedPurchase.total_quantity_kg} kg)`
                  ) : (
                    `${selectedPurchaseIds.length} purchases selected`
                  )}
                </Text>
              ) : (
                <Text style={styles.placeholderText}>Select Exporter Purchases</Text>
              )}
            </View>
            <Icon name="arrow-drop-down" size={22} color={PALETTE.text700} />
          </Pressable>
        </View>

        {/* Document Details */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Icon name="description" size={20} color={PALETTE.green700} />
            <Text style={styles.sectionTitle}>Document Details</Text>
          </View>
          <Field label="Invoice No" value={invoiceNo} onChangeText={setInvoiceNo} placeholder="INV-0001" required />
          <Field label="Export Certificate Number" value={exportCertNo} onChangeText={setExportCertNo} placeholder="ECN-0001" />
          <Field label="Consignee Name" value={consigneeName} onChangeText={setConsigneeName} placeholder="Consignee full name" required />
          <Field label="Consignee Country" value={consigneeCountry} onChangeText={setConsigneeCountry} placeholder="Country" required />
          
          {/* Shipment Date Picker */}
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.label}>Date of Shipment</Text>
            <Pressable onPress={() => setShowShipmentDatePicker(true)} style={({ pressed }) => [styles.datePicker, pressed && { opacity: 0.95 }]}>
              <Text style={{ color: PALETTE.text900, fontSize: 16 }}>{formatDate(shipmentDate)}</Text>
              <Icon name="calendar-today" size={20} color={PALETTE.green700} />
            </Pressable>
          </View>
          
          <Field 
            label="Final Weight (KG)" 
            value={finalWeight} 
            onChangeText={setFinalWeight} 
            keyboardType="numeric" 
            placeholder="0.00" 
            required 
          />
        </View>

        {/* Selected Lots */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Icon name="set-meal" size={20} color={PALETTE.green700} />
            <Text style={styles.sectionTitle}>Selected Lots</Text>
          </View>
          {lots.map((row, idx) => (
            <View key={idx} style={styles.lotRow}>
              <View style={styles.lotInfo}>
                <Text style={styles.lotLabel}>Lot No <Text style={{ color: '#DC2626' }}>*</Text></Text>
                <Text style={styles.lotValue}>{row.lot_no}</Text>
              </View>
              <View style={styles.lotInfo}>
                <Text style={styles.lotLabel}>Final Product Name <Text style={{ color: '#DC2626' }}>*</Text></Text>
                <Text style={styles.lotValue}>{row.final_product_name}</Text>
              </View>
              <View style={styles.lotInfo}>
                <Text style={styles.lotLabel}>Quantity (KG) <Text style={{ color: '#DC2626' }}>*</Text></Text>
                <Text style={styles.lotValue}>{row.quantity_kg}</Text>
              </View>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Quantity (KG)</Text>
            <Text style={styles.totalValue}>{totalQuantityKg.toFixed(2)}</Text>
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Icon name="info" size={20} color={PALETTE.green700} />
            <Text style={styles.sectionTitle}>Additional Information</Text>
          </View>
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.label}>Additional Information</Text>
            <TextInput
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              placeholder="Enter any additional information..."
              placeholderTextColor="#9CA3AF"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <Pressable onPress={handleSubmit} disabled={submitting} style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9 }, submitting && { opacity: 0.7 }]}>
          {submitting ? <ActivityIndicator color="#fff" /> : (<>
            <Icon name="send" size={18} color="#fff" />
            <Text style={styles.submitText}>Create Traceability Record</Text>
          </>)}
        </Pressable>
      </ScrollView>

      {/* Purchase picker */}
      <Modal visible={purchaseModal} animationType="fade" transparent onRequestClose={() => setPurchaseModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPurchaseModal(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select Purchases</Text>
          <FlatList
            data={purchases}
            keyExtractor={it => String(it.id)}
            renderItem={({ item }) => (
              <Pressable onPress={() => togglePurchasePick(item.id)} style={({ pressed }) => [styles.modalItem, pressed && { opacity: 0.9 }]}>
                <View style={styles.purchaseItem}>
                  <Text style={styles.purchaseTitle}>
                    {item.id} - {item.exporter?.name} ({item.total_quantity_kg} kg)
                  </Text>
                  <Text style={styles.purchaseProduct}>{item.final_product_name}</Text>
                  <Text style={styles.purchaseRef}>Ref: {item.purchase_reference}</Text>
                  {selectedPurchaseIds.includes(item.id) && (
                    <Text style={{ color: PALETTE.green700, fontWeight: '800', marginTop: 4 }}>Selected</Text>
                  )}
                </View>
              </Pressable>
            )}
            ItemSeparatorComponent={ItemSeparator}
          />
          <Pressable onPress={applySelectedPurchases} style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.9 }]}>
            <Icon name="check" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800' }}>Apply</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Shipment Date Picker Modal */}
      {showShipmentDatePicker && (
        <DateTimePicker
          value={shipmentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleShipmentDateChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#145A1F' },
  headerTitle: { color: PALETTE.text900, fontWeight: '800', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: PALETTE.text900, fontWeight: '800', marginLeft: 8, fontSize: 16 },
  label: { color: PALETTE.text700, marginBottom: 6, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: PALETTE.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8, color: PALETTE.text900, backgroundColor: '#fff' },
  textArea: { height: 80, textAlignVertical: 'top' },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: PALETTE.border, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8 },
  selectedPurchase: { flex: 1 },
  selectedPurchaseText: { color: PALETTE.text900, fontWeight: '600', fontSize: 16 },
  placeholderText: { color: '#9CA3AF', fontSize: 16 },
  lotRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 8, 
    marginBottom: 8 
  },
  lotInfo: { flex: 1, marginRight: 8 },
  lotLabel: { color: PALETTE.text600, fontSize: 12, fontWeight: '500' },
  lotValue: { color: PALETTE.text900, fontSize: 14, fontWeight: '600', marginTop: 2 },
  totalRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: PALETTE.text700, fontWeight: '700' },
  totalValue: { color: PALETTE.text900, fontWeight: '800' },
  submitBtn: { marginTop: 4, backgroundColor: PALETTE.green700, paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  submitText: { color: '#fff', fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: { position: 'absolute', left: 20, right: 20, top: '50%', transform: [{ translateY: -220 }], borderRadius: 16, backgroundColor: '#fff', padding: 16, maxHeight: 480, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  modalTitle: { color: PALETTE.text900, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.border },
  purchaseItem: { flex: 1 },
  purchaseTitle: { color: PALETTE.text900, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  purchaseProduct: { color: PALETTE.text700, fontSize: 14, marginBottom: 2 },
  purchaseRef: { color: PALETTE.text600, fontSize: 12 },
  applyBtn: { marginTop: 12, alignSelf: 'flex-end', backgroundColor: PALETTE.green700, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
});