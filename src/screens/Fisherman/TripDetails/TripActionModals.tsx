/* eslint-disable react-native/no-inline-styles */
// src/screens/Fisherman/TripDetails/TripActionModals.tsx
import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Dropdown } from 'react-native-element-dropdown';

/* ---- design tokens ---- */
const PRIMARY = '#1f720d';
const SURFACE = '#FFFFFF';
const BG_SOFT = '#F7F8FA';
const BORDER = '#E5E7EB';
const BORDER_SOFT = '#EEF2F7';
const TEXT = '#0B1220';
const MUTED = '#6B7280';
const INFO = '#1167d6';
const DANGER = '#DC2626';
const SUCCESS = '#059669';

/* =========================================================================
 * Cancel Trip
 * ========================================================================= */
export function CancelTripModal({
  visible,
  loading,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const { width } = useWindowDimensions();
  const stackButtons = width < 380;

  const reasonError =
    reason.trim().length > 0 && reason.trim().length < 5
      ? 'Please provide at least 5 characters.'
      : '';

  const canSubmit = reason.trim().length >= 5 && !loading;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { maxWidth: 720 }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerIconWrap}>
              <MaterialIcons name="report-problem" size={18} color="#fff" />
            </View>
            <Text style={[styles.title, styles.textWrap]} numberOfLines={1}>
              Cancel Trip
            </Text>
          </View>

          <Text style={[styles.sub, styles.textWrap]}>
            Please provide a short reason so we can keep accurate records.
          </Text>

          <View style={{ marginTop: 8 }}>
            <Text style={styles.label}>Reason *</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              style={[styles.input, styles.textarea]}
              placeholder="Write your reason…"
              placeholderTextColor={MUTED}
              multiline
            />
            {!!reasonError && (
              <Text style={styles.errorText}>{reasonError}</Text>
            )}
          </View>

          <View
            style={[styles.footerRow, stackButtons && styles.footerRowStack]}
          >
            <Pressable
              style={[
                styles.btn,
                styles.btnGhost,
                stackButtons && styles.btnFull,
              ]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.btnGhostText, styles.textWrap]}>Close</Text>
            </Pressable>
            <Pressable
              style={[
                styles.btn,
                styles.btnDanger,
                stackButtons && styles.btnFull,
                !canSubmit && { opacity: 0.5 },
              ]}
              onPress={() => onSubmit(reason.trim())}
              disabled={!canSubmit}
            >
              <MaterialIcons name="cancel" size={18} color="#fff" />
              <Text style={[styles.btnText, styles.textWrap]}>Cancel Trip</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* =========================================================================
 * Complete Trip (with Dropdowns)
 * ========================================================================= */

export type LotBrief = {
  id: number | string;
  lot_no: string;
  species_name?: string | null;
  quantity_kg?: number | string | null;
};

export type MiddleManBrief = { id: number | string; name: string };

export type DistributionRow = {
  lot_no: string; // stores lot_no string from dropdown value
  middleman_id: string | number | null; // stores id from dropdown value
  quantity_kg: string;
  notes?: string;
};

export type CompleteTripPayload = {
  landing_site: string; // stores the human-readable label (e.g., "Karachi Fish Harbor")
  landing_notes?: string;
  distributions: Array<{
    lot_no: string;
    middleman_id: string | number;
    quantity_kg: number;
    notes?: string;
  }>;
};

export type CompleteForm = {
  landing_site: string;
  landing_notes?: string;
  rows: DistributionRow[];
};

export function CompleteTripModal({
  visible,
  loading,
  onClose,
  onSubmit,
  tripCode,
  availableLots = [],
  middleMen = [],
  defaultLandingSite,
}: {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CompleteTripPayload) => void;
  tripCode?: string | null;
  availableLots?: LotBrief[];
  middleMen?: MiddleManBrief[];
  defaultLandingSite?: string;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 720;
  const stackButtons = width < 420;

  // Dropdown data
  const lotOptions = useMemo(
    () =>
      (availableLots || []).map(l => ({
        label: `${l.lot_no}${l.species_name ? ` · ${l.species_name}` : ''}${
          l.quantity_kg ? ` · ${l.quantity_kg} KG` : ''
        }`,
        value: l.lot_no,
      })),
    [availableLots],
  );

  const middleOptions = useMemo(
    () =>
      (middleMen || []).map(m => ({
        label: String(m.name ?? m.id),
        value: m.id,
      })),
    [middleMen],
  );

  const landingOptions = useMemo(
    () => [
      { label: 'Karachi Fish Harbor', value: 'Karachi Fish Harbor' },
      { label: 'Korangi Fish Harbor', value: 'Korangi Fish Harbor' },
    ],
    [],
  );

  const [form, setForm] = useState<CompleteForm>({
    landing_site:
      defaultLandingSite &&
      ['Karachi Fish Harbor', 'Korangi Fish Harbor'].includes(
        defaultLandingSite,
      )
        ? defaultLandingSite
        : '',
    landing_notes: '',
    rows: [
      {
        lot_no: availableLots[0]?.lot_no ?? '',
        middleman_id: null,
        quantity_kg: '',
        notes: '',
      },
    ],
  });

  function updateRow(i: number, patch: Partial<DistributionRow>) {
    setForm(prev => {
      const rows = [...prev.rows];
      rows[i] = { ...rows[i], ...patch };
      return { ...prev, rows };
    });
  }
  function addRow() {
    setForm(prev => ({
      ...prev,
      rows: [
        ...prev.rows,
        { lot_no: '', middleman_id: null, quantity_kg: '', notes: '' },
      ],
    }));
  }
  function removeRow(i: number) {
    setForm(prev => ({
      ...prev,
      rows: prev.rows.filter((_, idx) => idx !== i),
    }));
  }

  const totalAvailableKg = useMemo(
    () =>
      availableLots.reduce((sum, l) => {
        const v = l.quantity_kg;
        const n = typeof v === 'string' ? parseFloat(v) : Number(v);
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0),
    [availableLots],
  );

  const assignedKg = useMemo(
    () =>
      form.rows.reduce((sum, r) => {
        const n = Number(r.quantity_kg);
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0),
    [form.rows],
  );

  const overAssign = totalAvailableKg > 0 && assignedKg > totalAvailableKg;

  const validRows = useMemo(
    () =>
      form.rows.filter(
        r =>
          r.lot_no.trim() &&
          r.middleman_id != null &&
          r.quantity_kg.trim() &&
          !Number.isNaN(Number(r.quantity_kg)) &&
          Number(r.quantity_kg) > 0,
      ),
    [form.rows],
  );

  const canSubmit =
    form.landing_site.trim().length > 0 &&
    validRows.length > 0 &&
    !loading &&
    !overAssign;

  function handleSubmit() {
    if (!canSubmit) return;

    const payload: CompleteTripPayload = {
      landing_site: form.landing_site.trim(), // label text as requested
      landing_notes: form.landing_notes?.trim() || undefined,
      distributions: validRows.map(r => ({
        lot_no: r.lot_no.trim(),
        middleman_id:
          typeof r.middleman_id === 'string' && /^\d+$/.test(r.middleman_id)
            ? Number(r.middleman_id)
            : (r.middleman_id as any),
        quantity_kg: Number(r.quantity_kg),
        notes: r.notes?.trim() || undefined,
      })),
    };

    onSubmit(payload);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { maxHeight: '100%', width: '100%', maxWidth: 860 },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerIconWrap}>
              <MaterialIcons name="checklist" size={18} color="#fff" />
            </View>
            <Text
              style={[styles.title, styles.textWrap]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {tripCode ? `#${tripCode}` : 'Complete Trip'}
            </Text>
          </View>
          <Text style={[styles.sub, styles.textWrap]}>
            Distribute fish lots to middle men and confirm the landing site.
          </Text>

          {/* Summary bar */}
          <View
            style={[
              styles.summaryBar,
              overAssign && {
                borderColor: '#FEE2E2',
                backgroundColor: '#FEF2F2',
              },
            ]}
          >
            <MaterialIcons
              name={overAssign ? 'warning-amber' : 'info'}
              size={16}
              color={overAssign ? DANGER : INFO}
            />
            <Text
              style={[
                styles.summaryText,
                styles.textWrap,
                { color: overAssign ? DANGER : INFO },
              ]}
            >
              Assigned:{' '}
              <Text style={styles.bold}>{assignedKg.toFixed(2)} KG</Text>
              {totalAvailableKg > 0
                ? `  •  Available: ${totalAvailableKg.toFixed(2)} KG`
                : ''}
              {overAssign ? '  — Reduce assigned KG to proceed' : ''}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={{ gap: 14, paddingBottom: 6 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Distribution rows */}
            {form.rows.map((r, i) => {
              const qtyErr =
                r.quantity_kg.trim().length > 0 && Number(r.quantity_kg) <= 0
                  ? 'Quantity must be greater than 0.'
                  : '';

              return (
                <View key={i} style={styles.rowCard}>
                  <View style={[styles.grid, wide && { columnGap: 12 }]}>
                    {/* Lot Number (Dropdown) */}
                    <FormField label="Lot Number *" flex>
                      <Dropdown
                        data={lotOptions}
                        labelField="label"
                        valueField="value"
                        value={r.lot_no || null}
                        placeholder="Select Lot"
                        search
                        searchPlaceholder="Search lot..."
                        onChange={item =>
                          updateRow(i, { lot_no: String(item.value) })
                        }
                        style={styles.dd}
                        placeholderStyle={styles.ddPlaceholder}
                        selectedTextStyle={styles.ddSelected}
                        inputSearchStyle={styles.ddSearch}
                        itemTextStyle={styles.ddItemText}
                        itemContainerStyle={styles.ddItemContainer}
                      />
                    </FormField>

                    {/* Middle Man (Dropdown) */}
                    <FormField label="Middle Man *" flex>
                      <Dropdown
                        data={middleOptions}
                        labelField="label"
                        valueField="value"
                        value={r.middleman_id ?? null}
                        placeholder="Select Middle Man"
                        search
                        searchPlaceholder="Search middle man..."
                        onChange={item =>
                          updateRow(i, { middleman_id: item.value })
                        }
                        style={styles.dd}
                        placeholderStyle={styles.ddPlaceholder}
                        selectedTextStyle={styles.ddSelected}
                        inputSearchStyle={styles.ddSearch}
                        itemTextStyle={styles.ddItemText}
                        itemContainerStyle={styles.ddItemContainer}
                      />
                    </FormField>

                    {/* Quantity */}
                    <FormField label="Quantity (KG) *" flex>
                      <TextInput
                        placeholder="e.g., 365"
                        keyboardType="decimal-pad"
                        value={r.quantity_kg}
                        onChangeText={v => updateRow(i, { quantity_kg: v })}
                        style={styles.input}
                        placeholderTextColor={MUTED}
                      />
                      {!!qtyErr && (
                        <Text style={styles.errorText}>{qtyErr}</Text>
                      )}
                    </FormField>

                    {/* Notes */}
                    <FormField label="Notes" flex>
                      <TextInput
                        placeholder="Optional notes..."
                        value={r.notes}
                        onChangeText={v => updateRow(i, { notes: v })}
                        style={styles.input}
                        placeholderTextColor={MUTED}
                      />
                    </FormField>
                  </View>

                  {form.rows.length > 1 && (
                    <Pressable
                      onPress={() => removeRow(i)}
                      style={styles.trashBtn}
                    >
                      <MaterialIcons name="delete" size={18} color="#fff" />
                    </Pressable>
                  )}
                </View>
              );
            })}

            {/* Landing site (Dropdown) + notes */}
            <View style={[styles.grid, wide && { columnGap: 12 }]}>
              <FormField label="Landing Site *" flex>
                <Dropdown
                  data={landingOptions}
                  labelField="label"
                  valueField="value"
                  value={form.landing_site || null}
                  placeholder="Select landing site"
                  onChange={item =>
                    setForm(prev => ({
                      ...prev,
                      landing_site: String(item.value),
                    }))
                  }
                  style={styles.dd}
                  placeholderStyle={styles.ddPlaceholder}
                  selectedTextStyle={styles.ddSelected}
                  itemTextStyle={styles.ddItemText}
                  itemContainerStyle={styles.ddItemContainer}
                />
              </FormField>

              <FormField label="Landing Notes" flex>
                <TextInput
                  placeholder="e.g., Trip completed successfully"
                  value={form.landing_notes}
                  onChangeText={v =>
                    setForm(prev => ({ ...prev, landing_notes: v }))
                  }
                  style={styles.input}
                  placeholderTextColor={MUTED}
                />
              </FormField>
            </View>

            {/* Available lots helper */}
            {!!availableLots?.length && (
              <View style={styles.helperCard}>
                <Text style={{ color: SUCCESS, fontWeight: '900' }}>
                  Available Lots
                </Text>
                <View style={{ marginTop: 8, gap: 8 }}>
                  {availableLots.map(l => (
                    <Pressable
                      key={String(l.id)}
                      onPress={() => {
                        const idx = form.rows.findIndex(
                          row => !row.lot_no.trim(),
                        );
                        if (idx >= 0) updateRow(idx, { lot_no: l.lot_no });
                        else {
                          addRow();
                          updateRow(form.rows.length, { lot_no: l.lot_no });
                        }
                      }}
                      style={styles.lotPill}
                    >
                      <Text
                        style={[
                          { fontWeight: '800', color: TEXT },
                          styles.textWrap,
                        ]}
                      >
                        {l.lot_no}
                      </Text>
                      <Text
                        style={[
                          { color: MUTED, fontWeight: '700' },
                          styles.textWrap,
                        ]}
                      >
                        {l.species_name ? ` ${l.species_name} —` : ' '}
                        {l.quantity_kg ?? ''} KG
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Add distribution */}
            <View style={{ marginTop: 4 }}>
              <Text style={{ color: INFO, fontWeight: '800', marginBottom: 8 }}>
                Lot Distribution
              </Text>
              <Pressable onPress={addRow} style={styles.addBtn}>
                <MaterialIcons name="add" size={18} color={PRIMARY} />
                <Text style={{ color: 'black' }}>Add Distribution</Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.row}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={onClose}
            >
              <MaterialIcons name="cancel" size={20} color="#DC2626" />
              <Text style={[styles.btnText, { color: '#DC2626' }]}>Cancel</Text>
            </TouchableOpacity>

            {/* Complete Button */}
            <TouchableOpacity
              style={[styles.button, styles.completeBtn]}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
            >
              <MaterialIcons name="check-circle" size={20} color="#059669" />
              <Text style={[styles.btnText, { color: '#059669' }]}>
                Complete Trip
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer actions */}
          {/* <View style={[styles.footerRow, stackButtons && styles.footerRowStack]}>
            <Pressable
              style={[styles.btn, styles.btnGhost, stackButtons && styles.btnFull]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.btnGhostText, styles.textWrap]}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.btn,
                styles.btnPrimary,
                stackButtons && styles.btnFull,
                (!canSubmit || loading) && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
            >
              <MaterialIcons name="check-circle" size={18} color="#fff" />
              <Text style={[styles.btnText, styles.textWrap]}>
                Complete Trip
              </Text>
            </Pressable>
          </View> */}
        </View>
      </View>
    </Modal>
  );
}

/* =========================================================================
 * Helpers
 * ========================================================================= */
function FormField({
  label,
  children,
  flex,
}: React.PropsWithChildren<{ label: string; flex?: boolean }>) {
  return (
    <View style={[{ marginBottom: 10 }, flex && { flex: 1, minWidth: 160 }]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

/* =========================================================================
 * Styles
 * ========================================================================= */
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F7F8FA',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  completeBtn: {
    borderWidth: 1,
    borderColor: '#059669',
  },
  btnText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
  },
  /* layout */
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,18,28,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#0b0f19',
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 10 },
    }),
    gap: 12,
  },

  /* header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingBottom: 4,
  },
  headerIconWrap: {
    backgroundColor: PRIMARY,
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '900', color: TEXT, minWidth: 0 },
  sub: { color: MUTED, fontWeight: '600' },

  /* text utilities */
  textWrap: { marginBottom: 10 },

  /* form */
  label: { fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT,
    fontWeight: '700',
    minWidth: 0,
  },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  rowCard: {
    position: 'relative',
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: BG_SOFT,
    borderRadius: 14,
    padding: 12,
    marginTop: 2,
  },

  /* helper blocks */
  lotPill: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  helperCard: {
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
  },

  /* summary */
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#C7E2FF',
    backgroundColor: '#F1F7FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryText: { fontWeight: '700', minWidth: 0 },
  bold: { fontWeight: '900' },

  /* add row */
  addBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF7EF',
    borderWidth: 1,
    borderColor: '#DCF3DE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  /* footer */
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 6,
    flexWrap: 'wrap',
  },
  footerRowStack: { flexDirection: 'column' },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 999,
    minWidth: 0,
  },
  btnFull: { width: '100%' },
  btnText: { color: '#fff', fontWeight: '900' },
  btnGhost: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: BORDER,
  },
  btnGhostText: { color: TEXT, fontWeight: '900' },
  btnPrimary: { backgroundColor: PRIMARY },
  btnDanger: { backgroundColor: DANGER },

  /* errors */
  errorText: { color: DANGER, marginTop: 6, fontWeight: '800' },

  /* delete row */
  trashBtn: {
    position: 'absolute',
    right: 10,
    top: 1,
    backgroundColor: DANGER,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  /* dropdown styles */
  dd: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 44,
  },
  ddPlaceholder: {
    color: MUTED,
    fontWeight: '700',
  },
  ddSelected: {
    color: TEXT,
    fontWeight: '800',
  },
  ddSearch: {
    height: 40,
    borderRadius: 10,
    // borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    color: TEXT,
  },
  ddItemText: {
    color: TEXT,
    fontWeight: '700',
  },
  ddItemContainer: {
    borderBottomWidth: 0.5,
    borderColor: BORDER_SOFT,
  },
});
