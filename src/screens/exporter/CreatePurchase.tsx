/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, TextInput, ScrollView, StatusBar, Platform, Modal, FlatList, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import PALETTE from '../../theme/palette';
import { createExporterPurchase, fetchDistributions, fetchAssignments, updateExporterPurchase, fetchPurchaseById } from '../../services/middlemanDistribution';
import { type ExporterCompany } from '../../services/traceability';
import { loadTokenFromStorage } from '../../services/https';

type LotRow = { lot_no: string; max?: number | null; quantity_kg: string; selected?: boolean };

export default function CreatePurchase() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const hideFinalFields = !!(route as any)?.params?.hideFinalFields;
  const editPurchaseId: number | undefined = (route as any)?.params?.editPurchaseId;
  const [distributionId, setDistributionId] = useState<string>('');
  const [companyId, setCompanyId] = useState('');
  const [reference, setReference] = useState('');
  const [product, setProduct] = useState('');
  const [notes, setNotes] = useState('');
  const [finalWeight, setFinalWeight] = useState('');
  const [lots, setLots] = useState<LotRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [distModal, setDistModal] = useState(false);
  const [companyModal, setCompanyModal] = useState(false);
  const [distOptions, setDistOptions] = useState<Array<{ id: number; title: string; displayText: string; data: any }>>([]);
  const [companies, setCompanies] = useState<ExporterCompany[]>([]);
  const [loadingDistributions, setLoadingDistributions] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // preload dropdown data
  useEffect(() => {
    (async () => {
      try {
        setLoadingDistributions(true);
        const dRes = await fetchDistributions({ page: 1, per_page: 50 });
        setDistOptions(dRes.items.map(d => {
          const tripId = d.trip?.id || d.trip_id;
          const middlemanName = d.middle_man?.name || 'Unknown';
          const totalKg = d.total_quantity_kg;
          return { 
            id: d.id, 
            title: `Distribution #${d.id}`,
            displayText: `Trip#${tripId} - ${middlemanName} (${totalKg} kg)`,
            data: d // Store the full distribution data
          };
        }));
      } catch (error: any) {
        console.log('Error fetching distributions:', error?.message);
        // Don't show error to user on load, just log it
      } finally { setLoadingDistributions(false); }
      try {
        // Use middleman assignments as the source of allowed companies
        setLoadingCompanies(true);
        const assignments = await fetchAssignments({ page: 1, per_page: 100 });
        const unique: Record<string, ExporterCompany> = {} as any;
        assignments.items.forEach(a => {
          const c = a.company as any;
          if (c?.id && !unique[c.id]) {
            unique[c.id] = {
              id: c.id,
              name: c.name || c.company_name || '',
              company_name: c.company_name || c.name || '',
              phone: c.phone || c.business_phone || undefined,
              email: c.email || c.business_email || undefined,
            } as ExporterCompany;
          }
        });
        const companiesRes = Object.values(unique);
        setCompanies(companiesRes);
      } catch (error: any) {
        console.log('Error fetching companies:', error?.message);
        // Don't show error to user on load, just log it
      } finally { setLoadingCompanies(false); }
    })();
  }, []);

  // load existing purchase when editing
  useEffect(() => {
    if (!editPurchaseId) return;
    (async () => {
      try {
        setLoadingPurchase(true);
        const p: any = await fetchPurchaseById(editPurchaseId as any);
        setCompanyId(String(p?.company?.id || p?.company_id || ''));
        setReference(p?.purchase_reference || '');
        setProduct(p?.final_product_name || '');
        setNotes(p?.processing_notes || '');
        setFinalWeight(String(p?.final_weight_quantity || ''));
        const mappedLots: LotRow[] = (p?.purchased_lots || []).map((l: any) => ({
          lot_no: String(l.lot_no || l.lot_id),
          max: parseFloat(l.quantity_kg || '0') || null,
          quantity_kg: String(l.quantity_kg || ''),
          selected: true,
        }));
        setLots(mappedLots);
      } catch (e) {
        console.log('Failed to load purchase for edit', e);
      } finally { setLoadingPurchase(false); }
    })();
  }, [editPurchaseId]);

  const toggleLotSelection = (i: number) => {
    setLots(prev => prev.map((l, idx) => 
      idx === i ? { ...l, selected: !l.selected, quantity_kg: !l.selected ? l.quantity_kg : '' } : l
    ));
  };
  const updateLotQuantity = (i: number, value: string) => {
    setLots(prev => prev.map((l, idx) => (idx === i ? { ...l, quantity_kg: value } : l)));
  };

  const loadDistributions = async () => {
    if (distOptions.length > 0) return; // Already loaded
    
    setLoadingDistributions(true);
    try {
      // Ensure token is loaded
      await loadTokenFromStorage();
      
      const dRes = await fetchDistributions({ page: 1, per_page: 50 });
      setDistOptions(dRes.items.map(d => {
        const tripId = d.trip?.id || d.trip_id;
        const middlemanName = d.middle_man?.name || 'Unknown';
        const totalKg = d.total_quantity_kg;
        return { 
          id: d.id, 
          title: `Distribution #${d.id}`,
          displayText: `Trip#${tripId} - ${middlemanName} (${totalKg} kg)`,
          data: d // Store the full distribution data
        };
      }));
    } catch (error: any) {
      console.log('Error fetching distributions:', error?.message);
      console.log('Error status:', error?.status);
      
      if (error?.status === 401) {
        showToast('Your session has expired. Please log in again.', 'error');
        setTimeout(() => {
          // @ts-ignore
          navigation.navigate('Login');
        }, 2000);
      } else {
        showToast(`Failed to load distributions: ${error?.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setLoadingDistributions(false);
    }
  };

  // derive summary
  const totalSelectedKg = useMemo(() => {
    return lots.filter(l => l.selected).reduce((acc, l) => acc + (parseFloat(l.quantity_kg || '0') || 0), 0);
  }, [lots]);
  const finalWeightKg = useMemo(() => parseFloat(finalWeight || '0') || 0, [finalWeight]);
  const efficiencyPct = useMemo(() => {
    const base = totalSelectedKg;
    if (!base || !finalWeightKg) return 0;
    return Math.max(0, Math.min(100, (finalWeightKg / base) * 100));
  }, [finalWeightKg, totalSelectedKg]);

  const onPickDistribution = useCallback((id: number) => {
    setDistributionId(String(id));
    setDistModal(false);
    
    // Find the distribution data from our already loaded options
    const selectedDist = distOptions.find(d => d.id === id);
    if (!selectedDist) {
      showToast('Distribution data not found', 'error');
      return;
    }
    
    const enriched: LotRow[] = [];
    
    // Use the distributed_lots directly from the stored data
    for (const dl of selectedDist.data.distributed_lots || []) {
      enriched.push({ 
        lot_no: dl.lot_no || String(dl.lot_id), 
        max: parseFloat(dl.quantity_kg || '0') || null, 
        quantity_kg: '',
        selected: false
      });
    }
    setLots(enriched);
  }, [distOptions]);

  const submit = useCallback(async () => {
    const selectedLots = lots.filter(l => l.selected);
    if (!companyId || selectedLots.length === 0 || selectedLots.some(l => !l.quantity_kg) || (!hideFinalFields && !finalWeight)) {
      showToast('Please fill all required fields.' + (hideFinalFields ? '' : ' Include final weight.'), 'error');
      return;
    }
    try {
      setSubmitting(true);
      if (editPurchaseId) {
        await updateExporterPurchase(editPurchaseId as any, {
          company_id: companyId,
          purchase_reference: reference || undefined,
          final_product_name: hideFinalFields ? undefined : (product || undefined),
          processing_notes: notes || undefined,
          selected_lots: selectedLots.map(l => ({ lot_no: l.lot_no, quantity_kg: l.quantity_kg })),
          final_weight_quantity: hideFinalFields ? undefined : finalWeight,
        } as any);
        showToast('Purchase updated successfully!', 'success');
      } else {
        await createExporterPurchase({
          distribution_id: parseInt(distributionId, 10),
          company_id: companyId,
          purchase_reference: reference || undefined,
          final_product_name: hideFinalFields ? undefined : (product || undefined),
          processing_notes: notes || undefined,
          selected_lots: selectedLots.map(l => ({ lot_no: l.lot_no, quantity_kg: l.quantity_kg })),
          final_weight_quantity: hideFinalFields ? undefined : finalWeight,
        } as any);
        showToast('Purchase created successfully!', 'success');
      }
      setTimeout(() => {
        // @ts-ignore
        navigation.navigate('Purchases');
      }, 1200);
    } catch (e: any) {
      showToast(e?.message || 'Failed to submit purchase', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [editPurchaseId, distributionId, companyId, reference, product, notes, finalWeight, lots, navigation, hideFinalFields]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.surface }}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Pressable onPress={() => (navigation as any).goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>{editPurchaseId ? 'Edit Purchase' : 'Create New Purchase'}</Text>
            <Text style={styles.heroSub}>{editPurchaseId ? 'Update purchase details and lots' : 'Select distribution and fill purchase details'}</Text>
          </View>
          <View style={styles.heroIcon}>
            <Icon name="shopping-cart" size={28} color="#FFFFFF" />
          </View>
        </View>

        {/* Distribution - create vs edit */}
        {editPurchaseId ? (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Icon name="assignment" size={20} color={PALETTE.green700} />
              <Text style={styles.sectionTitle}>Distribution Information</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Current distribution (cannot be changed)</Text>
            {loadingPurchase ? (
              <View style={{ paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={PALETTE.green700} />
                <Text style={{ color: PALETTE.text600 }}>Loading purchase…</Text>
              </View>
            ) : null}
            <View style={[styles.select, { opacity: 0.7 }]}> 
              <Text style={{ color: PALETTE.text900 }}>Purchase #{String(editPurchaseId)}</Text>
              <Icon name="lock" size={18} color={PALETTE.text700} />
            </View>
            {/* Purchased Lots */}
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.label, { marginBottom: 6 }]}>Purchased Lots</Text>
              {lots.length === 0 ? (
                <Text style={{ color: PALETTE.text600 }}>No lots loaded.</Text>
              ) : (
                <View>
                  {lots.map((lot, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: PALETTE.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F8FAFC', marginBottom: 6 }}>
                      <Text style={{ color: PALETTE.text900, fontWeight: '800' }}>LOT: {lot.lot_no}</Text>
                      <Text style={{ color: PALETTE.text700 }}>{(parseFloat(lot.quantity_kg || '0') || 0).toFixed(2)} kg</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Icon name="assignment" size={20} color={PALETTE.green700} />
              <Text style={styles.sectionTitle}>Select Distribution</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Choose a distribution to purchase from</Text>
            {loadingDistributions ? (
              <View style={{ paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={PALETTE.green700} />
                <Text style={{ color: PALETTE.text600 }}>Loading distributions…</Text>
              </View>
            ) : null}
            <Pressable onPress={() => { loadDistributions(); setDistModal(true); }} style={({ pressed }) => [styles.select, pressed && { opacity: 0.95 }]}>
              <Text style={{ color: distributionId ? PALETTE.text900 : '#9CA3AF' }}>
                {distributionId ? distOptions.find(d => String(d.id) === distributionId)?.displayText || `Distribution #${distributionId}` : 'Select a distribution…'}
              </Text>
              <Icon name="arrow-drop-down" size={22} color={PALETTE.text700} />
            </Pressable>
          </View>
        )}

        {/* Purchase Details */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Icon name="business" size={20} color={PALETTE.green700} />
            <Text style={styles.sectionTitle}>Purchase Details</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Fill in the purchase information</Text>
          {loadingCompanies ? (
            <View style={{ paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={PALETTE.green700} />
              <Text style={{ color: PALETTE.text600 }}>Loading companies…</Text>
            </View>
          ) : null}
          <Pressable onPress={() => setCompanyModal(true)} style={({ pressed }) => [styles.select, pressed && { opacity: 0.95 }]}>
            <Text style={{ color: companyId ? PALETTE.text900 : '#9CA3AF' }}>
              {companyId ? companies.find(c => String(c.id) === companyId)?.company_name || `Company ID: ${companyId}` : 'Select company…'}
            </Text>
            <Icon name="arrow-drop-down" size={22} color={PALETTE.text700} />
          </Pressable>
          {hideFinalFields ? (
            <View style={{ marginTop: 6 }}>
              <Text style={{ color: PALETTE.text600, fontStyle: 'italic' }}>Final product and final weight will be provided by the exporter.</Text>
            </View>
          ) : (
            <>
              <Field label="Final Product Name" value={product} onChangeText={setProduct} />
              <Field label="Final Weight Quantity (kg)" value={finalWeight} onChangeText={setFinalWeight} keyboardType="decimal-pad" />
            </>
          )}
          <Field label="Purchase Reference" value={reference} onChangeText={setReference} />
          <Field label="Processing Notes" value={notes} onChangeText={setNotes} multiline />
        </View>

        {/* Lots & Quantities */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Icon name="pets" size={20} color={PALETTE.green700} />
            <Text style={styles.sectionTitle}>Select Lots & Quantities</Text>
          </View>
          {distributionId || editPurchaseId ? (
            <>
              {loadingPurchase && editPurchaseId ? (
                <View style={{ paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={PALETTE.green700} />
                  <Text style={{ color: PALETTE.text600 }}>Loading lots…</Text>
                </View>
              ) : lots.length === 0 ? (
                <Text style={{ color: PALETTE.text600 }}>No lots available for selected distribution.</Text>
              ) : (
                <View style={styles.lotsGrid}>
                  {lots.map((lot, i) => (
                    <View key={i} style={styles.lotCard}>
                      <View style={styles.lotCardHeader}>
                        <Pressable onPress={() => toggleLotSelection(i)} style={({ pressed }) => [styles.checkbox, pressed && { opacity: 0.8 }]}>
                          <Icon 
                            name={lot.selected ? "check-box" : "check-box-outline-blank"} 
                            size={20} 
                            color={lot.selected ? PALETTE.green700 : PALETTE.text600} 
                          />
                        </Pressable>
                        <Text style={styles.lotNumber}>Lot: {lot.lot_no}</Text>
                      </View>
                      <View style={styles.lotCardBody}>
                        <Text style={styles.quantityLabel}>Quantity (kg)</Text>
                        <TextInput 
                          value={lot.quantity_kg} 
                          onChangeText={(value) => updateLotQuantity(i, value)} 
                          placeholder="0.00"
                          placeholderTextColor="#9CA3AF"
                          style={styles.lotQuantityInput} 
                          keyboardType="decimal-pad"
                          editable={lot.selected}
                        />
                        <Text style={styles.availableText}>{editPurchaseId ? 'Current' : 'Available'}: {lot.max?.toFixed(2) || '0.00'} kg</Text>
                      </View>
                    </View>
                  ))}
                </View>
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
          {hideFinalFields ? null : (
            <>
              <SummaryRow label="Final Weight" value={`${finalWeightKg.toFixed(2)} kg`} />
              <SummaryRow label="Processing Efficiency" value={`${efficiencyPct.toFixed(0)}%`} />
            </>
          )}
        </View>

        <Pressable disabled={submitting} onPress={submit} style={({ pressed }) => [styles.submit, pressed && { opacity: 0.95 }, submitting && { opacity: 0.7 }]}>
          {submitting ? (
            <View style={styles.submitContent}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.submitText}>{editPurchaseId ? 'Updating Purchase...' : 'Creating Purchase...'}</Text>
            </View>
          ) : (
            <View style={styles.submitContent}>
              <Icon name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.submitText}>{editPurchaseId ? 'Update Purchase' : 'Create Purchase'}</Text>
            </View>
          )}
        </Pressable>
      </ScrollView>

      {/* Distribution picker */}
      <Modal visible={distModal} animationType="fade" transparent onRequestClose={() => setDistModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDistModal(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select Distribution</Text>
          {loadingDistributions ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: PALETTE.text600 }}>Loading distributions...</Text>
            </View>
          ) : distOptions.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: PALETTE.text600 }}>No distributions available</Text>
            </View>
          ) : (
            <FlatList data={distOptions} keyExtractor={it => String(it.id)} renderItem={({ item }) => (
              <Pressable onPress={() => onPickDistribution(item.id)} style={({ pressed }) => [styles.modalItem, pressed && { opacity: 0.9 }]}>
                <Text style={{ color: PALETTE.text900, fontWeight: '700' }}>{item.displayText}</Text>
              </Pressable>
            )} />
          )}
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

      {/* Toast Notification */}
      {toast && (
        <View style={[styles.toast, { backgroundColor: toast.type === 'success' ? '#4CAF50' : toast.type === 'error' ? '#F44336' : '#2196F3' }]}>
          <Icon 
            name={toast.type === 'success' ? 'check-circle' : toast.type === 'error' ? 'error' : 'info'} 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, keyboardType, multiline, placeholder }: any) {
  return (
    <View style={{ marginBottom: 10,marginTop:5 }}>
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
  hero: { 
    backgroundColor: PALETTE.green700, 
    borderRadius: 20, 
    paddingVertical: 16, 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8,
    ...shadow(0.1, 10, 4) 
  },
  backBtn: { 
    padding: 8, 
    borderRadius: 12, 
    marginRight: 12, 
    backgroundColor: 'rgba(255,255,255,0.15)' 
  },
  heroBody: { flex: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  heroIcon: { 
    padding: 8, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.15)' 
  },
  card: { 
    marginTop: 16, 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: PALETTE.border, 
    borderRadius: 16, 
    padding: 16,
    ...shadow(0.05, 6, 2)
  },
  label: { color: PALETTE.text700, marginBottom: 6, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: PALETTE.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8, color: PALETTE.text900, backgroundColor: '#FFFFFF' },
  blockTitle: { marginTop: 10, marginBottom: 6, color: PALETTE.text900, fontWeight: '800' },
  lotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  delBtn: { marginLeft: 8, backgroundColor: PALETTE.error, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10 },
  addLotBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: PALETTE.border, backgroundColor: '#F8FAFC' },
  submit: { 
    marginTop: 20, 
    backgroundColor: PALETTE.green700, 
    marginHorizontal: 16, 
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center',
    ...shadow(0.1, 8, 3)
  },
  submitContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { color: PALETTE.text900, fontWeight: '800', fontSize: 18, marginLeft: 8 },
  sectionSubtitle: { color: PALETTE.text600, fontSize: 14, marginBottom: 12, marginLeft: 28 },
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
  lotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  lotCard: { 
    flex: 1, 
    minWidth: '45%', 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: PALETTE.border, 
    borderRadius: 12, 
    padding: 12,
    ...shadow(0.05, 4, 2)
  },
  lotCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  checkbox: { marginRight: 8 },
  lotNumber: { color: PALETTE.text900, fontWeight: '800', fontSize: 14, flex: 1 },
  lotCardBody: { gap: 6 },
  quantityLabel: { color: PALETTE.text700, fontWeight: '600', fontSize: 12 },
  lotQuantityInput: { 
    borderWidth: 1, 
    borderColor: PALETTE.border, 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    paddingVertical: 8, 
    color: PALETTE.text900, 
    backgroundColor: '#fff',
    fontSize: 14
  },
  availableText: { color: PALETTE.text600, fontSize: 11, fontStyle: 'italic' },
  toast: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    ...shadow(0.15, 8, 4)
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
    flex: 1
  },
});

function shadow(opacity: number, radius: number, height: number) {
  if (Platform.OS === 'android') return { elevation: 2 } as any;
  return { shadowColor: '#000', shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height } } as any;
}


