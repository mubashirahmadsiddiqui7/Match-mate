/* eslint-disable react-native/no-inline-styles */
// src/screens/Fisherman/TripDetails/TripActionModals.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const PRIMARY = '#1f720d';
const BORDER = '#E5E7EB';
const MUTED = '#6B7280';

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

  const canSubmit = reason.trim().length >= 5 && !loading;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Cancel Trip</Text>
          <Text style={styles.sub}>Please tell us why you want to cancel.</Text>

          <TextInput
            value={reason}
            onChangeText={setReason}
            style={styles.textarea}
            placeholder="Write your reason…"
            placeholderTextColor={MUTED}
            multiline
          />

          <View style={styles.row}>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.btnText, { color: MUTED }]}>Close</Text>
            </Pressable>
            <Pressable
              style={[
                styles.btn,
                styles.btnDanger,
                !canSubmit && { opacity: 0.5 },
              ]}
              onPress={() => onSubmit(reason.trim())}
              disabled={!canSubmit}
            >
              <MaterialIcons name="cancel" size={18} color="#fff" />
              <Text style={styles.btnText}>Cancel Trip</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export type CompleteForm = {
  arrival_port: string;
  arrival_notes?: string;
  estimated_catch_weight?: string;
  catch_notes?: string;
  revenue?: string;
  arrival_latitude?: string;
  arrival_longitude?: string;
};

export function CompleteTripModal({
  visible,
  loading,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (form: CompleteForm) => void;
}) {
  const [form, setForm] = useState<CompleteForm>({
    arrival_port: '',
    arrival_notes: '',
    estimated_catch_weight: '',
    catch_notes: '',
    revenue: '',
    arrival_latitude: '',
    arrival_longitude: '',
  });

  const update = (k: keyof CompleteForm, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const canSubmit = form.arrival_port.trim().length > 0 && !loading;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { maxHeight: '88%' }]}>
          <Text style={styles.title}>Complete Trip</Text>
          <ScrollView contentContainerStyle={{ gap: 10 }}>
            <Input
              label="Arrival Port *"
              value={form.arrival_port}
              onChangeText={(v: string) => update('arrival_port', v)}
            />
            <Input
              label="Arrival Notes"
              value={form.arrival_notes}
              onChangeText={(v: string) => update('arrival_notes', v)}
              multiline
            />
            <Row2>
              <Input
                label="Estimated Catch Weight (kg)"
                keyboardType="numeric"
                value={form.estimated_catch_weight}
                onChangeText={(v: string) => update('estimated_catch_weight', v)}
              />
              <Input
                label="Catch Notes"
                value={form.catch_notes}
                onChangeText={(v: string) => update('catch_notes', v)}
              />
            </Row2>
            <Row2>
              <Input
                label="Revenue"
                keyboardType="numeric"
                value={form.revenue}
                onChangeText={(v: string) => update('revenue', v)}
              />
              <Input
                label="Arrival Latitude"
                keyboardType="numeric"
                value={form.arrival_latitude}
                onChangeText={(v: string) => update('arrival_latitude', v)}
              />
            </Row2>
            <Input
              label="Arrival Longitude"
              keyboardType="numeric"
              value={form.arrival_longitude}
              onChangeText={(v: string) => update('arrival_longitude', v)}
            />
          </ScrollView>

          <View style={styles.row}>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.btnText, { color: MUTED }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.btn,
                styles.btnPrimary,
                !canSubmit && { opacity: 0.5 },
              ]}
              onPress={() => onSubmit(form)}
              disabled={!canSubmit}
            >
              <MaterialIcons name="check-circle" size={18} color="#fff" />
              <Text style={styles.btnText}>Complete Trip</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ---- tiny inputs ---- */
function Row2({ children }: React.PropsWithChildren<{}>) {
  return <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;
}
function Input({ label, multiline, ...rest }: any) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        style={[styles.input, multiline && styles.textarea]}
        multiline={!!multiline}
        placeholderTextColor={MUTED}
      />
    </View>
  );
}

/* ---- styles ---- */
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }),
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '800' },
  sub: { color: MUTED },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  label: { fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
  },
  btnText: { color: '#fff', fontWeight: '800' },
  btnGhost: { backgroundColor: '#F3F4F6' },
  btnPrimary: { backgroundColor: PRIMARY },
  btnDanger: { backgroundColor: '#C62828' },
});
