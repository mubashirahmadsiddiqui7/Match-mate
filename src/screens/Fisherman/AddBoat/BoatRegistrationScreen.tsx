// src/screens/Boats/BoatRegisterScreen.tsx
/* eslint-disable react-native/no-inline-styles */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormProvider, useForm } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../../theme/palette';
import { api } from '../../../services/https';


type FormValues = {
  registration_number: string;
  name: string;
  owner_id: string;             // select
  type_of_boat: string;         // gillnetter/trawler/longliner
  license_authority: string;    // e.g., DG Fisheries Sindh
  license_no: string;
  mfd_approval_no: string;      // 1-year renewal, text for now
  holds_count: string;          // number of fish holds
  length_m: string;
  width_m: string;
  crew_capacity: string;
  weight_capacity_kg: string;   // “Boat Capacity” (client wants this)
  home_port: 'Karachi Fish Harbour' | 'Korangi Fish Harbour';
  status: 'Active' | 'Inactive';
};

const BOAT_TYPES = ['Gillnetter', 'Trawler', 'Longliner'] as const;
const PORTS = ['Karachi Fish Harbour', 'Korangi Fish Harbour'] as const;
const STATUS = ['Active', 'Inactive'] as const;

// ---- Minimal Input / Dropdowns (replace with your own shared components if you have them)
function Field({
  label,
  children,
  required,
}: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>
        {label} {required ? <Text style={{ color: PALETTE.error }}>*</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      style={styles.input}
      placeholderTextColor={PALETTE.text500 || '#6B7280'}
    />
  );
}

function Dropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value?: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find(o => o === value) || '',
    [options, value],
  );
  return (
    <View>
      <Pressable
        onPress={() => setOpen(o => !o)}
        style={[styles.input, { justifyContent: 'space-between', flexDirection: 'row' }]}
      >
        <Text style={{ color: value ? PALETTE.text900 : (PALETTE.text500 || '#6B7280') }}>
          {selected || placeholder || 'Select'}
        </Text>
        <Icon name={open ? 'expand-less' : 'expand-more'} size={20} color={PALETTE.text500 || '#6B7280'} />
      </Pressable>
      {open && (
        <View style={styles.dropdownSheet}>
          {options.map(opt => (
            <Pressable
              key={opt}
              onPress={() => { onChange(opt); setOpen(false); }}
              style={({ pressed }) => [
                styles.dropdownItem,
                pressed && { backgroundColor: '#F3F4F6' },
              ]}
            >
              <Text style={{ color: PALETTE.text900 }}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ---- Screen
export default function BoatRegisterScreen({ navigation }: any) {
  const methods = useForm<FormValues>({
    defaultValues: {
      registration_number: '',
      name: '',
      owner_id: '',
      type_of_boat: '',
      license_authority: '',
      license_no: '',
      mfd_approval_no: '',
      holds_count: '',
      length_m: '',
      width_m: '',
      crew_capacity: '',
      weight_capacity_kg: '',
      home_port: 'Karachi Fish Harbour',
      status: 'Active',
    },
    mode: 'onTouched',
  });

  const [saving, setSaving] = useState(false);

  const onSave = methods.handleSubmit(async v => {
    // basic validations that match client intent
    if (!v.registration_number?.trim() || !v.name?.trim() || !v.owner_id?.trim()) {
      Alert.alert('Missing info', 'Registration Number, Name and Owner are required.');
      return;
    }
    if (!v.type_of_boat) {
      Alert.alert('Missing info', 'Please select the Boat Type.');
      return;
    }
    if (!v.weight_capacity_kg || Number(v.weight_capacity_kg) <= 0) {
      Alert.alert('Invalid capacity', 'Weight Capacity (kg) must be greater than 0.');
      return;
    }

    try {
      setSaving(true);

      // map to API payload (server‑side “boat” master data)
      const body = {
        registration_number: v.registration_number.trim(),
        name: v.name.trim(),
        owner_id: Number(v.owner_id), // you can store as string if backend expects it
        type_of_boat: v.type_of_boat, // Gillnetter/Trawler/Longliner
        license_authority: v.license_authority?.trim() || null,
        license_no: v.license_no?.trim() || null,
        mfd_approval_no: v.mfd_approval_no?.trim() || null, // yearly renewal handled server‑side
        holds_count: v.holds_count ? Number(v.holds_count) : null,
        length_m: v.length_m ? Number(v.length_m) : null,
        width_m: v.width_m ? Number(v.width_m) : null,
        crew_capacity: v.crew_capacity ? Number(v.crew_capacity) : null,
        weight_capacity_kg: Number(v.weight_capacity_kg),
        home_port: v.home_port,
        status: v.status, // Active/Inactive
      };

      await api('/boats', { method: 'POST', body });
      Alert.alert('Saved', 'Boat registered successfully.', [
        { text: 'OK', onPress: () => navigation?.goBack?.() },
      ]);
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Could not register boat.');
    } finally {
      setSaving(false);
    }
  });

  // simple owner list placeholder (replace with real owners from API)
  const [owners] = useState<string[]>([
    // use "id – name" pattern so we can split id easily if you prefer
    '1 – Muhammad Ali',
    '2 – Imran Khan',
    '3 – Sana Ullah',
  ]);

  // convert "1 – Name" to id only for saving
  const ownerToId = (label: string) => (label.split('–')[0] || '').trim();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Register Boat</Text>
        <Text style={styles.headerSub}>Provide boat details to register in the system</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <FormProvider {...methods}>
          {/* Basic Boat Information */}
          <Section title="Basic Boat Information" icon="info">
            <Field label="Registration Number" required>
              <Input
                value={methods.watch('registration_number')}
                onChangeText={t => methods.setValue('registration_number', t)}
                placeholder="e.g., B-12345"
              />
            </Field>

            <Field label="Name" required>
              <Input
                value={methods.watch('name')}
                onChangeText={t => methods.setValue('name', t)}
                placeholder="Boat name"
              />
            </Field>

            <Field label="Owner" required>
              <Dropdown
                value={owners.find(o => ownerToId(o) === methods.watch('owner_id'))}
                onChange={lbl => methods.setValue('owner_id', ownerToId(lbl))}
                options={owners}
                placeholder="Select Owner"
              />
            </Field>

            <Field label="Type of Boat" required>
              <Dropdown
                value={methods.watch('type_of_boat')}
                onChange={v => methods.setValue('type_of_boat', v as any)}
                options={[...BOAT_TYPES]}
                placeholder="Gillnetter / Trawler / Longliner"
              />
            </Field>

            <Field label="Fishing License Authority">
              <Input
                value={methods.watch('license_authority')}
                onChangeText={t => methods.setValue('license_authority', t)}
                placeholder="e.g., DG Fisheries Sindh"
              />
            </Field>

            <Field label="Fishing License No.">
              <Input
                value={methods.watch('license_no')}
                onChangeText={t => methods.setValue('license_no', t)}
                placeholder="e.g., LIC-2025-00123"
              />
            </Field>

            <Field label="MFD Approval No. (annual)">
              <Input
                value={methods.watch('mfd_approval_no')}
                onChangeText={t => methods.setValue('mfd_approval_no', t)}
                placeholder="e.g., MFD-APP-2025-0001"
              />
            </Field>
          </Section>

          {/* Capacity & Dimensions */}
          <Section title="Capacity & Dimensions" icon="straighten">
            <Field label="Length (m)">
              <Input
                value={methods.watch('length_m')}
                onChangeText={t => methods.setValue('length_m', t.replace(/[^0-9.]/g, ''))}
                placeholder="e.g., 18.5"
                keyboardType="numeric"
              />
            </Field>

            <Field label="Width (m)">
              <Input
                value={methods.watch('width_m')}
                onChangeText={t => methods.setValue('width_m', t.replace(/[^0-9.]/g, ''))}
                placeholder="e.g., 5.2"
                keyboardType="numeric"
              />
            </Field>

            <Field label="Crew Capacity">
              <Input
                value={methods.watch('crew_capacity')}
                onChangeText={t => methods.setValue('crew_capacity', t.replace(/[^0-9]/g, ''))}
                placeholder="e.g., 12"
                keyboardType="numeric"
              />
            </Field>

            <Field label="Number of Fish Holds">
              <Input
                value={methods.watch('holds_count')}
                onChangeText={t => methods.setValue('holds_count', t.replace(/[^0-9]/g, ''))}
                placeholder="e.g., 4"
                keyboardType="numeric"
              />
            </Field>

            <Field label="Weight Capacity (kg)" required>
              <Input
                value={methods.watch('weight_capacity_kg')}
                onChangeText={t => methods.setValue('weight_capacity_kg', t.replace(/[^0-9]/g, ''))}
                placeholder="e.g., 12000"
                keyboardType="numeric"
              />
            </Field>
          </Section>

          {/* Port & Status */}
          <Section title="Port & Status" icon="place">
            <Field label="Home Port">
              <Dropdown
                value={methods.watch('home_port')}
                onChange={v => methods.setValue('home_port', v as any)}
                options={[...PORTS]}
                placeholder="Select Home Port"
              />
            </Field>

            <Field label="Status">
              <Dropdown
                value={methods.watch('status')}
                onChange={v => methods.setValue('status', v as any)}
                options={[...STATUS]}
                placeholder="Active / Inactive"
              />
            </Field>
          </Section>

          <View style={{ height: 8 }} />

          <Pressable
            disabled={saving}
            onPress={onSave}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.998 }] },
              saving && { opacity: 0.7 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="save" size={18} color="#fff" />
                <Text style={styles.saveText}>Save Boat</Text>
              </>
            )}
          </Pressable>

          <View style={{ height: 20 }} />
        </FormProvider>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon name={icon as any} size={18} color={PALETTE.green700 || '#1B5E20'} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.text900 || '#111827',
  },
  headerSub: {
    marginTop: 2,
    fontSize: 13,
    color: PALETTE.text500 || '#6B7280',
  },
  card: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: PALETTE.surface || '#FFFFFF',
    borderColor: PALETTE.border || '#E5E7EB',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: {
    marginLeft: 6,
    fontWeight: '700',
    fontSize: 15,
    color: PALETTE.text900 || '#111827',
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    color: PALETTE.text600 || '#4B5563',
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border || '#E5E7EB',
    backgroundColor: '#FFF',
    color: PALETTE.text900 || '#111827',
  },
  dropdownSheet: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: PALETTE.border || '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 12 },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: PALETTE.green700 || '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
  },
});
