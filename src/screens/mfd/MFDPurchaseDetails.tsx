/* eslint-disable react-native/no-inline-styles */
// src/screens/mfd/MFDPurchaseDetails.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Pressable,
  StatusBar,
  Platform,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

import {
  fetchMFDPurchaseById,
  type FishPurchase,
  getStatusColor,
  getStatusText,
} from '../../services/mfd';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';
import PALETTE from '../../theme/palette';

/* ---------- constants ---------- */
const PRIMARY = PALETTE.green700;

/* ---------- main component ---------- */
export default function MFDPurchaseDetails() {
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<MFDStackParamList, 'PurchaseDetails'>>();

  const [purchase, setPurchase] = useState<FishPurchase | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMFDPurchaseById(params.purchaseId);
      setPurchase(data);
    } catch (error) {
      console.error('Error loading purchase:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load purchase details',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, [params.purchaseId]);

  useEffect(() => {
    load();
  }, [load]);

  // refresh whenever screen regains focus (after actions)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const statusColor = useMemo(() => {
    if (!purchase) return PALETTE.text700;
    return getStatusColor(purchase.status);
  }, [purchase]);

  const toTitle = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  if (!purchase) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>
            Purchase #{purchase.id}
          </Text>

          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {toTitle(purchase.status)}
            </Text>
          </View>

          <Text style={styles.subtitle}>
            {purchase.purchase_reference || 'No Reference'} • {purchase.final_weight_quantity || 'N/A'} kg
          </Text>
        </View>
      </View>

      {/* Quick info strip */}
      <View style={[styles.quickStrip, shadow(0.05, 8, 3)]}>
        <View style={styles.quickItem}>
          <MaterialIcons name="schedule" size={16} color={PALETTE.text600} />
          <Text style={styles.quickText}>
            {new Date(purchase.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.quickDivider} />
        <View style={styles.quickItem}>
          <MaterialIcons name="business" size={16} color={PALETTE.text600} />
          <Text style={styles.quickText}>
            {purchase.company?.name || 'Unknown Company'}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {/* Basic Purchase Information */}
        <Section title="Basic Purchase Information" icon="shopping-cart">
          <Row icon="badge" label="Purchase ID" value={`#${purchase.id}`} />
          <Row icon="info" label="Status" value={toTitle(purchase.status)} />
          <Row icon="receipt" label="Reference" value={purchase.purchase_reference || 'Not specified'} />
          <Row icon="scale" label="Final Weight" value={purchase.final_weight_quantity ? `${purchase.final_weight_quantity} kg` : 'Not specified'} />
          <Row icon="inventory-2" label="Final Product" value={purchase.final_product_name || 'Not specified'} />
        </Section>

        {/* Distribution Information */}
        {purchase.distribution && (
          <Section title="Distribution Information" icon="inventory">
            <Row icon="badge" label="Distribution ID" value={`#${purchase.distribution_id}`} />
            <Row icon="scale" label="Total Weight" value={`${purchase.distribution.total_quantity_kg} kg`} />
            <Row icon="verified" label="Verification Status" value={purchase.distribution.verification_status} />
          </Section>
        )}

        {/* Company Information */}
        {purchase.company && (
          <Section title="Company Information" icon="business">
            <Row icon="business" label="Company Name" value={purchase.company.name} />
            <Row icon="email" label="Email" value={purchase.company.email} />
            <Row icon="phone" label="Phone" value={purchase.company.phone} />
          </Section>
        )}

        {/* Processing Information */}
        <Section title="Processing Information" icon="build">
          <Row 
            icon="note" 
            label="Processing Notes" 
            value={purchase.processing_notes || 'No notes provided'} 
          />
        </Section>

        {/* Timestamps */}
        <Section title="Timestamps" icon="schedule">
          <Row 
            icon="add" 
            label="Created At" 
            value={new Date(purchase.created_at).toLocaleString()} 
          />
          <Row 
            icon="update" 
            label="Updated At" 
            value={new Date(purchase.updated_at).toLocaleString()} 
          />
        </Section>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
}

/* ---------- presentational pieces ---------- */
function Section({
  title,
  icon = 'info',
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon as any} size={20} color={PALETTE.text700} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <MaterialIcons name={icon as any} size={16} color={PALETTE.text600} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

/* ---------- styles ---------- */
const shadow = (opacity: number, radius: number, offset: number) => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: offset },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: radius,
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff', flexShrink: 1 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  subtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 },

  quickStrip: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  quickItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  quickDivider: { width: 1, height: 20, backgroundColor: PALETTE.border, marginHorizontal: 12 },
  quickText: { fontSize: 14, color: PALETTE.text600, fontWeight: '500' },

  /* sections */
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  sectionTitle: { fontWeight: '800', color: PALETTE.text900, fontSize: 14, flexShrink: 1 },
  sectionContent: { marginTop: 8, gap: 8 },

  /* rows */
  row: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { color: PALETTE.text600, fontSize: 12, fontWeight: '700' },
  value: { color: PALETTE.text900, fontWeight: '800' },
});
