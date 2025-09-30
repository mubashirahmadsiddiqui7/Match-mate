import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MiddleManStackParamList } from '../../app/navigation/stacks/MiddleManStack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import {
  fetchAssignmentById,
  type MiddlemanAssignment,
  getStatusColor,
  getStatusText,
  formatDate,
  formatDateTime,
} from '../../services/middlemanDistribution';

// --- Types ---
type Nav = NativeStackNavigationProp<MiddleManStackParamList, 'MiddleManHome'>;
type Route = {
  params: {
    assignmentId: number;
  };
};

export default function AssignmentDetails() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { assignmentId } = route.params;

  const [assignment, setAssignment] = useState<MiddlemanAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Fetch Assignment Details ---
  const loadAssignmentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetchAssignmentById(assignmentId);
      setAssignment(response);
    } catch (error) {
      console.error('Error loading assignment details:', error);
      Alert.alert('Error', 'Failed to load assignment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignmentDetails();
  }, [assignmentId]);

  // --- Loader ---
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.green700} />
          <Text style={styles.loadingText}>Loading assignment details...</Text>
        </View>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Assignment not found</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(assignment.status);
  const statusText = assignment.status_label || getStatusText(assignment.status);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Assignment Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Assignment Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="info" size={20} color={PALETTE.blue600} />
            <Text style={styles.cardTitle}>Assignment Information</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Row label="Status" value={statusText} valueColor={statusColor} />
            <Row label="Assignment ID" value={`#${assignment.id}`} />
            <Row label="Assigned Date" value={formatDate(assignment.assigned_date)} />
            <Row label="Expiry Date" value={formatDate(assignment.expiry_date)} />
            <Row label="Created" value={formatDateTime(assignment.created_at)} />
            <Row label="Updated" value={formatDateTime(assignment.updated_at)} />
            {assignment.notes && (
              <Row label="Notes" value={assignment.notes} />
            )}
          </View>
        </View>

        {/* Middle Man Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="person" size={20} color={PALETTE.blue600} />
            <Text style={styles.cardTitle}>Middle Man Information</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Row label="Name" value={assignment.middle_man?.name || '—'} />
            <Row label="Email" value={assignment.middle_man?.email || '—'} />
            <Row label="Phone" value={assignment.middle_man?.phone || '—'} />
            <Row label="User Type" value={assignment.middle_man?.user_type || '—'} />
            <Row label="Company Name" value={assignment.middle_man?.company_name || '—'} />
            <Row label="Business Address" value={assignment.middle_man?.business_address || '—'} />
            <Row label="Business Phone" value={assignment.middle_man?.business_phone || '—'} />
            <Row label="Business Email" value={assignment.middle_man?.business_email || '—'} />
            <Row label="Verification Status" value={assignment.middle_man?.verification_status || '—'} />
            <Row label="Is Active" value={assignment.middle_man?.is_active ? 'Yes' : 'No'} />
          </View>
        </View>

        {/* Company Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="business" size={20} color={PALETTE.blue600} />
            <Text style={styles.cardTitle}>Company Information</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Row label="Name" value={assignment.company?.name || '—'} />
            <Row label="Email" value={assignment.company?.email || '—'} />
            <Row label="Phone" value={assignment.company?.phone || '—'} />
            <Row label="User Type" value={assignment.company?.user_type || '—'} />
            <Row label="Export License" value={assignment.company?.export_license_number || '—'} />
            <Row label="Verification Status" value={assignment.company?.verification_status || '—'} />
            <Row label="Is Active" value={assignment.company?.is_active ? 'Yes' : 'No'} />
          </View>
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="settings" size={20} color={PALETTE.blue600} />
            <Text style={styles.cardTitle}>Actions</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.actionsText}>No actions available at this time</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// --- Components ---

const Row = ({ 
  label, 
  value, 
  valueColor 
}: { 
  label: string; 
  value: string; 
  valueColor?: string; 
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}:</Text>
    <Text style={[styles.rowValue, valueColor && { color: valueColor }]} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PALETTE.text600,
  },
  errorText: {
    fontSize: 16,
    color: PALETTE.text600,
  },
  header: {
    backgroundColor: PALETTE.green700,
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginLeft: 8,
  },
  cardContent: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text600,
    width: '40%',
  },
  rowValue: {
    fontSize: 14,
    color: PALETTE.text900,
    flex: 1,
    textAlign: 'right',
  },
  actionsText: {
    fontSize: 14,
    color: PALETTE.text600,
    fontStyle: 'italic',
  },
});
