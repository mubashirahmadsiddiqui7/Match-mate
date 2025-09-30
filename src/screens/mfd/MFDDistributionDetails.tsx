/* eslint-disable react-native/no-inline-styles */
// src/screens/mfd/MFDDistributionDetails.tsx
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
  fetchMFDDistributionById,
  type FishLotDistribution,
  getStatusColor,
  getStatusText,
} from '../../services/mfd';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';
import PALETTE from '../../theme/palette';

/* ---------- constants ---------- */
const PRIMARY = PALETTE.green700;

/* ---------- main component ---------- */
export default function MFDDistributionDetails() {
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<MFDStackParamList, 'DistributionDetails'>>();

  const [distribution, setDistribution] = useState<FishLotDistribution | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMFDDistributionById(params.distributionId);
      setDistribution(data);
    } catch (error) {
      console.error('Error loading distribution:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load distribution details',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, [params.distributionId]);

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
    if (!distribution) return PALETTE.text700;
    return getStatusColor(distribution.verification_status);
  }, [distribution]);

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
  if (!distribution) return null;

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
            Distribution #{distribution.id}
          </Text>

          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {toTitle(distribution.verification_status)}
            </Text>
          </View>

          <Text style={styles.subtitle}>
            {distribution.total_quantity_kg} kg • {distribution.distributed_lots.length} lots
          </Text>
        </View>
      </View>

      {/* Quick info strip */}
      <View style={[styles.quickStrip, shadow(0.05, 8, 3)]}>
        <View style={styles.quickItem}>
          <MaterialIcons name="schedule" size={16} color={PALETTE.text600} />
          <Text style={styles.quickText}>
            {new Date(distribution.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.quickDivider} />
        <View style={styles.quickItem}>
          <MaterialIcons name="person" size={16} color={PALETTE.text600} />
          <Text style={styles.quickText}>
            {distribution.trip?.captain_name || 'Unknown Captain'}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {/* Basic Distribution Information */}
        <Section title="Basic Distribution Information" icon="assignment">
          <Row icon="badge" label="Distribution ID" value={`#${distribution.id}`} />
          <Row icon="info" label="Status" value={toTitle(distribution.verification_status)} />
          <Row icon="scale" label="Total Weight" value={`${distribution.total_quantity_kg} kg`} />
          <Row icon="attach-money" label="Total Value" value={distribution.total_value ? `$${distribution.total_value}` : 'Not specified'} />
          <Row icon="inventory" label="Number of Lots" value={distribution.distributed_lots.length.toString()} />
        </Section>

        {/* Trip Information */}
        {distribution.trip && (
          <Section title="Trip Information" icon="sailing">
            <Row icon="badge" label="Trip ID" value={distribution.trip.trip_id} />
            <Row icon="person" label="Captain" value={distribution.trip.captain_name} />
            <Row icon="phone" label="Captain Phone" value={distribution.trip.captain_mobile_no} />
            <Row icon="place" label="Departure Port" value={distribution.trip.departure_port} />
            <Row icon="schedule" label="Departure Time" value={distribution.trip.departure_time} />
            <Row icon="flag" label="Status" value={distribution.trip.status_label} />
          </Section>
        )}

        {/* Middleman Information */}
        {distribution.middle_man && (
          <Section title="Middleman Information" icon="business">
            <Row icon="person" label="Name" value={distribution.middle_man.name} />
            <Row icon="business" label="Company" value={distribution.middle_man.company_name} />
            <Row icon="phone" label="Phone" value={distribution.middle_man.business_phone} />
            <Row icon="email" label="Email" value={distribution.middle_man.business_email} />
          </Section>
        )}

        {/* Distributed Lots */}
        <Section title="Distributed Lots" icon="inventory">
          {distribution.distributed_lots.map((lot, index) => (
            <View key={index} style={styles.lotRow}>
              <MaterialIcons name="inventory" size={16} color={PALETTE.text600} />
              <View style={{ flex: 1 }}>
                <Text style={styles.lotText}>Lot #{lot.lot_no}</Text>
                <Text style={styles.muted}>Weight: {lot.quantity_kg} kg</Text>
                {lot.species_name && <Text style={styles.muted}>Species: {lot.species_name}</Text>}
                {lot.notes && <Text style={styles.muted}>Notes: {lot.notes}</Text>}
              </View>
            </View>
          ))}
        </Section>

        {/* Verification Information */}
        {(distribution.verification_status === 'verified' || distribution.verification_status === 'rejected') && (
          <Section title="Verification Information" icon="verified">
            <Row 
              icon="person" 
              label="Verified By" 
              value={distribution.verified_by ? `User #${distribution.verified_by}` : 'Unknown'} 
            />
            <Row 
              icon="schedule" 
              label="Verified At" 
              value={distribution.verified_at ? new Date(distribution.verified_at).toLocaleString() : 'Unknown'} 
            />
            {distribution.verification_notes && (
              <Row 
                icon="note" 
                label="Verification Notes" 
                value={distribution.verification_notes} 
              />
            )}
          </Section>
        )}

        {/* Timestamps */}
        <Section title="Timestamps" icon="schedule">
          <Row 
            icon="add" 
            label="Created At" 
            value={new Date(distribution.created_at).toLocaleString()} 
          />
          <Row 
            icon="update" 
            label="Updated At" 
            value={new Date(distribution.updated_at).toLocaleString()} 
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

  /* listish */
  lotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    padding: 10,
  },
  lotText: { color: PALETTE.text900, fontWeight: '700' },
  muted: { color: PALETTE.text600, fontSize: 12 },
});
