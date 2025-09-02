/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, TextInput, Platform, FlatList, Modal, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import { fetchExporterCompanies, type ExporterCompany, createTraceabilityRecord } from '../../services/traceability';
import { getUser } from '../../services/users';

type LotRow = { lot_no: string; final_product_name: string; quantity: string };

export default function traceabilityForm() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [companyId, setCompanyId] = useState<string>('');
  const [companies, setCompanies] = useState<ExporterCompany[]>([]);
  const [companyModal, setCompanyModal] = useState(false);

  const [invoiceNo, setInvoiceNo] = useState('');
  const [exportCertNo, setExportCertNo] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeCountry, setConsigneeCountry] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [shipmentDate, setShipmentDate] = useState('');
  const [validatingAuthority, setValidatingAuthority] = useState('');
  const [exporterName, setExporterName] = useState('');
  const [plantAddress, setPlantAddress] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [lots, setLots] = useState<LotRow[]>([{ lot_no: '', final_product_name: '', quantity: '' }]);

  const [exporterId, setExporterId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [user, list] = await Promise.all([getUser(), fetchExporterCompanies()]);
        setExporterId(user?.id ?? null);
        setExporterName(user?.company_name || user?.name || '');
        setCompanies(list);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const addLot = () => setLots(prev => [...prev, { lot_no: '', final_product_name: '', quantity: '' }]);
  const updateLot = (i: number, key: keyof LotRow, value: string) => setLots(prev => prev.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)));
  const removeLot = (i: number) => setLots(prev => prev.filter((_, idx) => idx !== i));

  const totalQuantityKg = useMemo(() => {
    return lots.reduce((acc, l) => acc + (parseFloat(l.quantity || '0') || 0), 0);
  }, [lots]);

  const handleSubmit = useCallback(async () => {
    if (!exporterId) {
      Alert.alert('Error', 'Missing exporter account.');
      return;
    }
    if (!companyId) {
      Alert.alert('Missing Company', 'Please select a company.');
      return;
    }
    if (!invoiceNo || !consigneeName || !consigneeCountry || !shipmentDate) {
      Alert.alert('Missing Info', 'Please fill required fields.');
      return;
    }
    if (!lots.length || !lots[0].lot_no) {
      Alert.alert('Missing Lots', 'Please add at least one lot.');
      return;
    }
    try {
      setSubmitting(true);
      const body = {
        exporter_id: exporterId,
        company_id: Number(companyId),
        invoice_no: invoiceNo,
        consignee_name: consigneeName,
        consignee_country: consigneeCountry,
        document_date: documentDate || new Date().toISOString().slice(0, 10),
        date_of_shipment: shipmentDate,
        export_certificate_no: exportCertNo || undefined,
        selected_lots: lots.map(l => ({ lot_no: l.lot_no, quantity: l.quantity || '0', final_product_name: l.final_product_name })),
        total_quantity_kg: String(totalQuantityKg),
        total_value: totalValue || '0',
        validating_authority: validatingAuthority || 'Marine Fisheries Department',
        exporter_name: exporterName,
        plant_address: plantAddress,
      } as any;

      await createTraceabilityRecord(body);
      Alert.alert('Success', 'Traceability record created successfully.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create record');
    } finally {
      setSubmitting(false);
    }
  }, [exporterId, companyId, invoiceNo, consigneeName, consigneeCountry, documentDate, shipmentDate, exportCertNo, lots, totalQuantityKg, totalValue, validatingAuthority, exporterName, plantAddress, navigation]);

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

        {/* Company */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Purchase Selection</Text>
          <Text style={styles.label}>Exporter Company</Text>
          <Pressable onPress={() => setCompanyModal(true)} style={({ pressed }) => [styles.select, pressed && { opacity: 0.95 }]}>
            <Text style={{ color: companyId ? PALETTE.text900 : '#9CA3AF' }}>{companyId ? (companies.find(c => String(c.id) === companyId)?.company_name || 'Company') : 'Select Exporter Company'}</Text>
            <Icon name="arrow-drop-down" size={22} color={PALETTE.text700} />
          </Pressable>
        </View>

        {/* Document details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Document Details</Text>
          <Field label="Invoice No" value={invoiceNo} onChangeText={setInvoiceNo} placeholder="INV-0001" />
          <Field label="Export Certificate No" value={exportCertNo} onChangeText={setExportCertNo} placeholder="ECN-0001" />
          <Field label="Consignee Name" value={consigneeName} onChangeText={setConsigneeName} placeholder="Consignee full name" />
          <Field label="Consignee Country" value={consigneeCountry} onChangeText={setConsigneeCountry} placeholder="Country" />
          <Field label="Document Date (YYYY-MM-DD)" value={documentDate} onChangeText={setDocumentDate} placeholder="YYYY-MM-DD" />
          <Field label="Date of Shipment (YYYY-MM-DD)" value={shipmentDate} onChangeText={setShipmentDate} placeholder="YYYY-MM-DD" />
          <Field label="Validating Authority" value={validatingAuthority} onChangeText={setValidatingAuthority} placeholder="Marine Fisheries Department" />
          <Field label="Exporter Name" value={exporterName} onChangeText={setExporterName} placeholder="Company Exporter" />
          <Field label="Plant Address" value={plantAddress} onChangeText={setPlantAddress} placeholder="Business address" />
          <Field label="Total Value" value={totalValue} onChangeText={setTotalValue} keyboardType="numeric" placeholder="0.00" />
        </View>

        {/* Selected lots */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selected Lots</Text>
          {lots.map((row, idx) => (
            <View key={idx} style={{ marginBottom: 10 }}>
              <Field label="Lot No" value={row.lot_no} onChangeText={t => updateLot(idx, 'lot_no', t)} placeholder="LOT-2025-0001" />
              <Field label="Final Product Name" value={row.final_product_name} onChangeText={t => updateLot(idx, 'final_product_name', t)} placeholder="Tuna" />
              <Field label="Quantity (KG)" value={row.quantity} onChangeText={t => updateLot(idx, 'quantity', t)} keyboardType="numeric" placeholder="0" />
              {lots.length > 1 && (
                <Pressable onPress={() => removeLot(idx)} style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.9 }]}>
                  <Icon name="delete" size={16} color="#fff" />
                  <Text style={styles.removeBtnText}>Remove</Text>
                </Pressable>
              )}
            </View>
          ))}
          <Pressable onPress={addLot} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}>
            <Icon name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Lot</Text>
          </Pressable>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Quantity (KG)</Text>
            <Text style={styles.totalValue}>{totalQuantityKg.toFixed(2)}</Text>
          </View>
        </View>

        <Pressable onPress={handleSubmit} disabled={submitting} style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9 }, submitting && { opacity: 0.7 }]}>
          {submitting ? <ActivityIndicator color="#fff" /> : (<>
            <Icon name="send" size={18} color="#fff" />
            <Text style={styles.submitText}>Create Traceability Record</Text>
          </>)}
        </Pressable>
      </ScrollView>

      {/* Company picker */}
      <Modal visible={companyModal} animationType="fade" transparent onRequestClose={() => setCompanyModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCompanyModal(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select Company</Text>
          <FlatList
            data={companies}
            keyExtractor={it => String(it.id)}
            renderItem={({ item }) => (
              <Pressable onPress={() => { setCompanyId(String(item.id)); setCompanyModal(false); }} style={({ pressed }) => [styles.modalItem, pressed && { opacity: 0.9 }]}>
                <Text style={{ color: PALETTE.text900, fontWeight: '700' }}>{item.company_name}</Text>
                <Text style={{ color: PALETTE.text600 }}>{item.email || item.phone || '—'}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, keyboardType, placeholder }: any) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
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

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#145A1F' },
  headerTitle: { color: PALETTE.text900, fontWeight: '800', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, padding: 12, marginBottom: 12 },
  sectionTitle: { color: PALETTE.text900, fontWeight: '800', marginBottom: 8 },
  label: { color: PALETTE.text700, marginBottom: 6, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: PALETTE.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8, color: PALETTE.text900, backgroundColor: '#fff' },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: PALETTE.border, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8 },
  addBtn: { marginTop: 4, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PALETTE.green700, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '800' },
  removeBtn: { alignSelf: 'flex-start', marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#C62828', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  removeBtnText: { color: '#fff', fontWeight: '800' },
  totalRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: PALETTE.text700, fontWeight: '700' },
  totalValue: { color: PALETTE.text900, fontWeight: '800' },
  submitBtn: { marginTop: 4, backgroundColor: PALETTE.green700, paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  submitText: { color: '#fff', fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: { position: 'absolute', left: 20, right: 20, top: '50%', transform: [{ translateY: -220 }], borderRadius: 16, backgroundColor: '#fff', padding: 16, maxHeight: 440, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  modalTitle: { color: PALETTE.text900, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.border },
});
