import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import { 
  fetchMFDAssignments, 
  deactivateMFDAssignment,
  activateMFDAssignment,
  type Assignment, 
  getStatusColor
} from '../../services/mfd';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';
import Toast from 'react-native-toast-message';

type Nav = NativeStackNavigationProp<MFDStackParamList>;

const AssignmentCard = ({ assignment, onPress, onEdit, onDeactivate, onActivate }: { 
  assignment: Assignment; 
  onPress: (assignment: Assignment) => void;
  onEdit: (assignment: Assignment) => void;
  onDeactivate: (assignment: Assignment) => void;
  onActivate: (assignment: Assignment) => void;
}) => (
  <View style={styles.assignmentCard}>
    {/* Header Section */}
    <View style={styles.assignmentHeader}>
      <View style={styles.assignmentInfo}>
        <Text style={styles.assignmentId}>Assignment #{assignment.id}</Text>
        <View style={styles.relationshipPill}>
          <Text style={styles.relationshipText}>
            {assignment.middle_man?.name || 'Unknown'} → {assignment.company?.name || 'Unknown'}
          </Text>
        </View>
      </View>
      <View style={[styles.statusPill, { backgroundColor: getStatusColor(assignment.status) + '20' }]}>
        <Text style={[styles.statusText, { color: getStatusColor(assignment.status) }]}>
          {assignment.status_label}
        </Text>
      </View>
    </View>
    
    {/* Details Grid */}
    <View style={styles.detailsGrid}>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Middle Man</Text>
        <Text style={styles.detailValue}>{assignment.middle_man?.name || 'Unknown'}</Text>
      </View>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Email</Text>
        <Text style={styles.detailValue}>{assignment.middle_man?.email || 'N/A'}</Text>
      </View>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Phone</Text>
        <Text style={styles.detailValue}>{assignment.middle_man?.phone || 'N/A'}</Text>
      </View>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Company</Text>
        <Text style={styles.detailValue}>{assignment.company?.name || 'Unknown'}</Text>
      </View>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Registration</Text>
        <Text style={styles.detailValue}>{assignment.company?.export_license_number || 'N/A'}</Text>
      </View>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Assigned Date</Text>
        <Text style={styles.detailValue}>{new Date(assignment.assigned_date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Expiry Date</Text>
        <Text style={styles.detailValue}>{new Date(assignment.expiry_date).toLocaleDateString()}</Text>
      </View>
    </View>

    {/* Action Buttons */}
    <View style={styles.actionButtons}>
      <Pressable 
        onPress={() => onPress(assignment)} 
        style={({ pressed }) => [styles.actionButton, styles.viewButton, pressed && { opacity: 0.8 }]}
      >
        <Icon name="visibility" size={16} color="#1976d2" />
        <Text style={styles.actionButtonText}>View</Text>
      </Pressable>
      
      <Pressable 
        style={({ pressed }) => [styles.actionButton, styles.editButton, pressed && { opacity: 0.8 }]}
        onPress={() => onEdit(assignment)}
      >
        <Icon name="edit" size={16} color="#f57c00" />
        <Text style={styles.actionButtonText}>Edit</Text>
      </Pressable>
      
      {assignment.status === 'active' && (
        <Pressable 
          style={({ pressed }) => [styles.actionButton, styles.deactivateButton, pressed && { opacity: 0.8 }]}
          onPress={() => onDeactivate(assignment)}
        >
          <Icon name="pause" size={16} color="#d32f2f" />
          <Text style={styles.actionButtonText}>Deactivate</Text>
        </Pressable>
      )}
      
      {assignment.status === 'inactive' && (
        <Pressable 
          style={({ pressed }) => [styles.actionButton, styles.activateButton, pressed && { opacity: 0.8 }]}
          onPress={() => onActivate(assignment)}
        >
          <Icon name="play-arrow" size={16} color="#4CAF50" />
          <Text style={styles.actionButtonText}>Activate</Text>
        </Pressable>
      )}
    </View>
  </View>
);

const FilterChip = ({ label, isActive, onPress }: { 
  label: string; 
  isActive: boolean; 
  onPress: () => void;
}) => (
  <Pressable 
    onPress={onPress}
    style={[styles.filterChip, isActive && styles.filterChipActive]}
  >
    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
      {label}
    </Text>
  </Pressable>
);

const EmptyState = ({ filter, onCreateNew }: { 
  filter: string; 
  onCreateNew: () => void;
}) => (
  <View style={styles.emptyState}>
    <Icon name="assignment" size={64} color={PALETTE.text400} />
    <Text style={styles.emptyTitle}>No assignments found</Text>
    <Text style={styles.emptyMessage}>
      {filter === 'All' 
        ? "No assignments available at the moment."
        : `No ${filter.toLowerCase()} assignments found.`
      }
    </Text>
    <Pressable onPress={onCreateNew} style={styles.createNewButton}>
      <Icon name="add" size={20} color="#fff" />
      <Text style={styles.createNewButtonText}>Create New Assignment</Text>
    </Pressable>
  </View>
);

export default function MFDAssignmentsList() {
  const navigation = useNavigation<Nav>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive' | 'Pending'>('All');

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMFDAssignments({ page: 1, per_page: 50 });
      setAssignments(data.items || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load assignments',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAssignments();
    setRefreshing(false);
  }, [loadAssignments]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAssignmentPress = (assignment: Assignment) => {
    navigation.navigate('AssignmentDetails', { assignmentId: assignment.id });
  };

  const handleEditAssignment = (assignment: Assignment) => {
    navigation.navigate('AssignmentEdit', { assignmentId: assignment.id });
  };

  const handleDeactivateAssignment = async (assignment: Assignment) => {
    try {
      await deactivateMFDAssignment(assignment.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Assignment deactivated successfully',
        position: 'top',
      });
      loadAssignments(); // Refresh the list
    } catch (error: any) {
      console.error('Error deactivating assignment:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to deactivate assignment',
        position: 'top',
      });
    }
  };

  const handleActivateAssignment = async (assignment: Assignment) => {
    try {
      await activateMFDAssignment(assignment.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Assignment activated successfully',
        position: 'top',
      });
      loadAssignments(); // Refresh the list
    } catch (error: any) {
      console.error('Error activating assignment:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to activate assignment',
        position: 'top',
      });
    }
  };

  const handleCreateNew = () => {
    navigation.navigate('AssignmentCreate');
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'All') return true;
    return assignment.status === filter.toLowerCase();
  });


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PALETTE.green700} />
        <Text style={styles.loadingText}>Loading assignments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>MFD Assignments</Text>
        <Pressable onPress={handleCreateNew} style={({ pressed }) => [styles.createButton, pressed && { opacity: 0.8 }]}>
          <Icon name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filter by status</Text>
        <View style={styles.filtersRow}>
          {(['All', 'Active', 'Inactive', 'Pending'] as const).map((status) => (
            <FilterChip
              key={status}
              label={status}
              isActive={filter === status}
              onPress={() => setFilter(status)}
            />
          ))}
        </View>
      </View>

      {/* Assignments List */}
      <FlatList
        data={filteredAssignments}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <AssignmentCard assignment={item} onPress={handleAssignmentPress} onEdit={handleEditAssignment} onDeactivate={handleDeactivateAssignment} onActivate={handleActivateAssignment} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<EmptyState filter={filter} onCreateNew={handleCreateNew} />}
      />

      <Toast />
    </View>
  );
}

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
  header: {
    backgroundColor: PALETTE.green700,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.text900,
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PALETTE.border,
  },
  filterChipActive: {
    backgroundColor: PALETTE.green700,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.text600,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginBottom: 8,
  },
  relationshipPill: {
    backgroundColor: PALETTE.green700,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  relationshipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  detailItem: {
    width: '50%',
    marginBottom: 12,
    paddingRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: PALETTE.text500,
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: PALETTE.text900,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewButton: {
    backgroundColor: '#e3f2fd',
  },
  editButton: {
    backgroundColor: '#fff3e0',
  },
  deactivateButton: {
    backgroundColor: '#ffebee',
  },
  activateButton: {
    backgroundColor: '#e8f5e8',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: PALETTE.text500,
    textAlign: 'center',
    marginBottom: 20,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.green700,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createNewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
