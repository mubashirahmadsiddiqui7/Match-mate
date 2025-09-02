/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, TextInput, Alert, ScrollView, StatusBar, Platform, Modal, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import PALETTE from '../../theme/palette';
import { createExporterPurchase, fetchDistributions, fetchDistributionById } from '../../services/middlemanDistribution';
import { fetchFishLotById } from '../../services/lots';
import { fetchExporterCompanies, type ExporterCompany } from '../../services/traceability';

type LotRow = { lot_no: string; max?: number | null; quantity_kg: string };

export default function CreatePurchase() {
  const navigation = useNavigation();
  const [distributionId, setDistributionId] = useState<string>('');
  const [companyId, setCompanyId] = useState('');
  const [reference, setReference] = useState('');
  const [product, setProduct] = useState('');
  const [notes, setNotes] = useState('');
  const [lots, setLots] = useState<LotRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [distModal, setDistModal] = useState(false);
  const [companyModal, setCompanyModal] = useState(false);
  const [distOptions, setDistOptions] = useState<Array<{ id: number; title: string }>>([]);
  const [companies, setCompanies] = useState<ExporterCompany[]>([]);

  // preload dropdown data
  useEffect(() => {
    (async () => {
      try {
        const dRes = await fetchDistributions({ page: 1, per_page: 50 });
        setDistOptions(dRes.items.map(d => ({ id: d.id, title: `Distribution #${d.id}` })));
      } catch {}
      try {
        const companiesRes = await fetchExporterCompanies();
        setCompanies(companiesRes);
      } catch {}
    })();
  }, []);

  const addLot = () => setLots(prev => [...prev, { lot_no: '', quantity_kg: '' }]);
  const updateLot = (i: number, key: 'lot_no' | 'quantity_kg', value: string) => {
    setLots(prev => prev.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)));
  };
  const removeLot = (i: number) => setLots(prev => prev.filter((_, idx) => idx !== i));

  // derive summary
  const totalSelectedKg = useMemo(() => {
    return lots.reduce((acc, l) => acc + (parseFloat(l.quantity_kg || '0') || 0), 0);
  }, [lots]);
  const finalWeightKg = useMemo(() => parseFloat(String(totalSelectedKg ? totalSelectedKg : 0)) || 0, [totalSelectedKg]);
  const efficiencyPct = useMemo(() => {
    const f = parseFloat(product ? '0' : '0');
    const base = finalWeightKg;
    if (!base) return 0;
    return Math.max(0, Math.min(100, (finalWeightKg / base) * 100));
  }, [finalWeightKg, product]);

  const onPickDistribution = useCallback(async (id: number) => {
    setDistributionId(String(id));
    setDistModal(false);
    // load available lots for this distribution
    try {
      const dist = await fetchDistributionById(id);
      const enriched: LotRow[] = [];
      for (const dl of dist.distributed_lots || []) {
        try {
          const lot = await fetchFishLotById(dl.lot_id);
          enriched.push({ lot_no: lot.lot_no, max: parseFloat(dl.quantity_kg || '0') || null, quantity_kg: '' });
        } catch {
          enriched.push({ lot_no: String(dl.lot_id), max: parseFloat(dl.quantity_kg || '0') || null, quantity_kg: '' });
        }
      }
      setLots(enriched);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load distribution');
      setLots([]);
    }
  }, []);

  const submit = useCallback(async () => {
    if (!distributionId || !companyId || lots.length === 0 || lots.some(l => !l.lot_no || !l.quantity_kg)) {
      Alert.alert('Missing fields', 'Please select distribution, company and at least one lot with quantity.');
      return;
    }
    try {
      setSubmitting(true);
      await createExporterPurchase({
        middle_man_id: 0 as any, // server infers from distribution
        company_id: companyId,
        purchase_reference: reference || undefined,
        final_product_name: product || undefined,
        processing_notes: notes || undefined,
        purchased_lots: lots.map(l => ({ lot_no: l.lot_no, quantity_kg: l.quantity_kg })),
      });
      Alert.alert('Success', 'Purchase created.');
      // @ts-ignore
      navigation.navigate('PurchasesList');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create purchase');
    } finally {
      setSubmitting(false);
    }
  }, [distributionId, companyId, reference, product, notes, lots, navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.surface }}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Pressable onPress={() => (navigation as any).goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>New Purchase</Text>
            <Text style={styles.heroSub}>Fill details and submit</Text>
          </View>
        </View>

        {/* Select Distribution */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Distribution</Text>
          <Pressable onPress={() => setDistModal(true)} style={({ pressed }) => [styles.select, pressed && { opacity: 0.95 }]}>
            <Text style={{ color: distributionId ? PALETTE.text900 : '#9CA3AF' }}>{distributionId ? `Distribution #${distributionId}` : 'Select a distribution…'}</Text>
            <Icon name="arrow-drop-down" size={22} color={PALETTE.text700} />
          </Pressable>
        </View>

        {/* Purchase Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Purchase Details</Text>
          <Pressable onPress={() => setCompanyModal(true)} style={({ pressed }) => [styles.select, pressed && { opacity: 0.95 }]}>
            <Text style={{ color: companyId ? PALETTE.text900 : '#9CA3AF' }}>
              {companyId ? companies.find(c => String(c.id) === companyId)?.company_name || `Company ID: ${companyId}` : 'Select company…'}
            </Text>
            <Icon name="arrow-drop-down" size={22} color={PALETTE.text700} />
          </Pressable>
          <Field label="Final Product Name" value={product} onChangeText={setProduct} />
          <Field label="Final Weight Quantity (kg)" value={String(finalWeightKg || '')} onChangeText={() => {}} editable={false} />
          <Field label="Purchase Reference" value={reference} onChangeText={setReference} />
          <Field label="Processing Notes" value={notes} onChangeText={setNotes} multiline />
        </View>

        {/* Lots & Quantities */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Lots & Quantities</Text>
          {distributionId ? (
            <>
              {lots.length === 0 ? (
                <Text style={{ color: PALETTE.text600 }}>No lots available for selected distribution.</Text>
              ) : (
                lots.map((lot, i) => (
                  <View key={i} style={styles.lotRow}>
                    <Text style={{ color: PALETTE.text900, fontWeight: '800', flex: 1 }}>{lot.lot_no}</Text>
                    <TextInput value={lot.quantity_kg} onChangeText={(t) => updateLot(i, 'quantity_kg', t)} placeholder={`Qty (kg)${lot.max ? ` max ${lot.max}` : ''}`} style={[styles.input, { width: 140 }]} placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
                    <Pressable onPress={() => removeLot(i)} style={({ pressed }) => [styles.delBtn, pressed && { opacity: 0.9 }]}>
                      <Icon name="delete" size={18} color="#fff" />
                    </Pressable>
                  </View>
                ))
              )}
            </>
          ) : (
            <Text style={{ color: PALETTE.text600, textAlign: 'center', marginTop: 10 }}>Select a distribution first to see available lots.</Text>
          )}
        </View>

        {/* Purchase Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Purchase Summary</Text>
          <SummaryRow label="Total Selected Quantity" value={`${totalSelectedKg.toFixed(2)} kg`} />
          <SummaryRow label="Final Weight" value={`${finalWeightKg.toFixed(2)} kg`} />
          <SummaryRow label="Processing Efficiency" value={`${efficiencyPct.toFixed(0)}%`} />
        </View>

        <Pressable disabled={submitting} onPress={submit} style={({ pressed }) => [styles.submit, pressed && { opacity: 0.95 }, submitting && { opacity: 0.7 }]}>
          <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Create Purchase'}</Text>
        </Pressable>
      </ScrollView>

      {/* Distribution picker */}
      <Modal visible={distModal} animationType="fade" transparent onRequestClose={() => setDistModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDistModal(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select Distribution</Text>
          <FlatList data={distOptions} keyExtractor={it => String(it.id)} renderItem={({ item }) => (
            <Pressable onPress={() => onPickDistribution(item.id)} style={({ pressed }) => [styles.modalItem, pressed && { opacity: 0.9 }]}>
              <Text style={{ color: PALETTE.text900, fontWeight: '700' }}>{item.title}</Text>
            </Pressable>
          )} />
        </View>
      </Modal>

      {/* Company picker */}
      <Modal visible={companyModal} animationType="fade" transparent onRequestClose={() => setCompanyModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCompanyModal(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select Company</Text>
          <FlatList data={companies} keyExtractor={it => String(it.id)} renderItem={({ item }) => (
            <Pressable onPress={() => { setCompanyId(String(item.id)); setCompanyModal(false); }} style={({ pressed }) => [styles.modalItem, pressed && { opacity: 0.9 }]}>
              <Text style={{ color: PALETTE.text900, fontWeight: '700' }}>{item.company_name || item.name}</Text>
              <Text style={{ color: PALETTE.text600 }}>{item.phone || item.email}</Text>
            </Pressable>
          )} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, keyboardType, multiline, placeholder }: any) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder || label}
        placeholderTextColor="#9CA3AF"
        style={[styles.input, multiline && { height: 90, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={{ color: PALETTE.text600 }}>{label}</Text>
      <Text style={{ color: PALETTE.text900, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 16, paddingTop: 38, paddingBottom: 20 },
  hero: { backgroundColor: PALETTE.green700, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', ...shadow(0.08, 8, 3) },
  backBtn: { padding: 6, borderRadius: 999, marginRight: 8 },
  heroBody: { flex: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  card: { marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: PALETTE.border, borderRadius: 12, padding: 12 },
  label: { color: PALETTE.text700, marginBottom: 6, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: PALETTE.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8, color: PALETTE.text900, backgroundColor: '#FFFFFF' },
  blockTitle: { marginTop: 10, marginBottom: 6, color: PALETTE.text900, fontWeight: '800' },
  lotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  delBtn: { marginLeft: 8, backgroundColor: PALETTE.error, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10 },
  addLotBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: PALETTE.border, backgroundColor: '#F8FAFC' },
  submit: { marginTop: 14, backgroundColor: PALETTE.green700, marginHorizontal: 16, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800' },
  sectionTitle: { color: PALETTE.text900, fontWeight: '800', marginBottom: 10, fontSize: 16 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: PALETTE.border, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: { 
    position: 'absolute', 
    left: 20, 
    right: 20, 
    top: '50%', 
    transform: [{ translateY: -200 }], // Half of approximate modal height
    borderRadius: 16, 
    backgroundColor: '#fff', 
    padding: 16,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: { color: PALETTE.text900, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.border },
});

function shadow(opacity: number, radius: number, height: number) {
  if (Platform.OS === 'android') return { elevation: 2 } as any;
  return { shadowColor: '#000', shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height } } as any;
}


