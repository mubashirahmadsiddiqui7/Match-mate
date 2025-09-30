/* eslint-disable react-native/no-inline-styles */
// src/screens/mfd/MFDAssignmentDetails.tsx
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
  fetchMFDAssignmentById,
  activateMFDAssignment,
  deactivateMFDAssignment,
  type Assignment,
  getStatusColor,
  getStatusText,
} from '../../services/mfd';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';
import PALETTE from '../../theme/palette';

/* ---------- constants ---------- */
const PRIMARY = PALETTE.green700;

/* ---------- main component ---------- */
export default function MFDAssignmentDetails() {
  const navigation = useNavigation();
  const { params } =
    useRoute<RouteProp<MFDStackParamList, 'AssignmentDetails'>>();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMFDAssignmentById(params.assignmentId);
      setAssignment(data);
    } catch (error) {
      console.error('Error loading assignment:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load assignment details',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, [params.assignmentId]);

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
    if (!assignment) return PALETTE.text700;
    return getStatusColor(assignment.status);
  }, [assignment]);

  const toTitle = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleEdit = () => {
    navigation.navigate('AssignmentEdit', { assignmentId: assignment!.id });
  };

  const handleActivate = async () => {
    try {
      setLoading(true);
      await activateMFDAssignment(assignment!.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Assignment activated successfully',
        position: 'top',
      });
      load(); // Refresh the assignment data
    } catch (error: any) {
      console.error('Error activating assignment:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to activate assignment',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setLoading(true);
      await deactivateMFDAssignment(assignment!.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Assignment deactivated successfully',
        position: 'top',
      });
      load(); // Refresh the assignment data
    } catch (error: any) {
      console.error('Error deactivating assignment:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to deactivate assignment',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  if (!assignment) return null;

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
            Assignment #{assignment.id}
          </Text>

          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {toTitle(assignment.status)}
            </Text>
          </View>

          <Text style={styles.subtitle}>
            {assignment.middle_man?.name || 'Unknown Middle Man'} → {assignment.company?.name || 'Unknown Company'}
          </Text>
        </View>

        <Pressable onPress={handleEdit} style={styles.editBtn}>
          <MaterialIcons name="edit" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Quick info strip */}
      <View style={[styles.quickStrip, shadow(0.05, 8, 3)]}>
        <View style={styles.quickItem}>
          <MaterialIcons name="schedule" size={16} color={PALETTE.text600} />
          <Text style={styles.quickText}>
            {new Date(assignment.assigned_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.quickDivider} />
        <View style={styles.quickItem}>
          <MaterialIcons name="person" size={16} color={PALETTE.text600} />
          <Text style={styles.quickText}>
            {assignment.middle_man?.name || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {/* Basic Assignment Information */}
        <Section title="Assignment Information" icon="assignment">
          <Row icon="badge" label="Assignment ID" value={`#${assignment.id}`} />
          <Row icon="info" label="Status" value={assignment.status_label} />
          <Row icon="schedule" label="Assigned Date" value={new Date(assignment.assigned_date).toLocaleDateString()} />
          <Row icon="event" label="Expiry Date" value={new Date(assignment.expiry_date).toLocaleDateString()} />
          <Row icon="note" label="Notes" value={assignment.notes || 'No notes provided'} />
        </Section>

        {/* Middle Man Information */}
        {assignment.middle_man && (
          <Section title="Middle Man Information" icon="person">
            <Row icon="person" label="Name" value={assignment.middle_man.name} />
            <Row icon="email" label="Email" value={assignment.middle_man.email} />
            <Row icon="phone" label="Phone" value={assignment.middle_man.phone} />
            <Row icon="business" label="Company" value={assignment.middle_man.company_name || 'N/A'} />
            <Row icon="place" label="Address" value={assignment.middle_man.business_address || 'N/A'} />
            <Row icon="verified" label="Status" value={assignment.middle_man.is_active ? 'Active' : 'Inactive'} />
          </Section>
        )}

        {/* Company Information */}
        {assignment.company && (
          <Section title="Company Information" icon="business">
            <Row icon="business" label="Company Name" value={assignment.company.name} />
            <Row icon="email" label="Email" value={assignment.company.email} />
            <Row icon="phone" label="Phone" value={assignment.company.phone} />
            <Row icon="receipt" label="Export License" value={assignment.company.export_license_number || 'N/A'} />
            <Row icon="place" label="Address" value={assignment.company.address || 'N/A'} />
            <Row icon="verified" label="Status" value={assignment.company.is_active ? 'Active' : 'Inactive'} />
          </Section>
        )}

        {/* Timestamps */}
        <Section title="Timestamps" icon="schedule">
          <Row 
            icon="add" 
            label="Created At" 
            value={new Date(assignment.created_at).toLocaleString()} 
          />
          <Row 
            icon="update" 
            label="Updated At" 
            value={new Date(assignment.updated_at).toLocaleString()} 
          />
        </Section>

        {/* Actions */}
        <Section title="Actions" icon="settings">
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}
            >
              <MaterialIcons name="edit" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Edit Assignment</Text>
            </Pressable>

            {assignment.status === 'inactive' ? (
              <Pressable
                style={[styles.actionButton, styles.activateButton]}
                onPress={handleActivate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="play-arrow" size={20} color="#fff" />
                )}
                <Text style={styles.actionButtonText}>Activate Assignment</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.actionButton, styles.deactivateButton]}
                onPress={handleDeactivate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="pause" size={20} color="#fff" />
                )}
                <Text style={styles.actionButtonText}>Deactivate Assignment</Text>
              </Pressable>
            )}
          </View>
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
  editBtn: {
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

  /* action buttons */
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: PALETTE.green700,
  },
  activateButton: {
    backgroundColor: '#4CAF50',
  },
  deactivateButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
