import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MiddleManStackParamList } from '../../app/navigation/stacks/MiddleManStack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import {
  fetchAssignments,
  type MiddlemanAssignment,
  type PaginatedResponse,
  getStatusColor,
  getStatusText,
  formatDate,
} from '../../services/middlemanDistribution';

// --- Types ---
type Nav = NativeStackNavigationProp<MiddleManStackParamList, 'MiddleManHome'>;

export default function Assignments() {
  const navigation = useNavigation<Nav>();

  const [assignments, setAssignments] = useState<MiddlemanAssignment[]>([]);
  const [, setMeta] = useState<PaginatedResponse<MiddlemanAssignment>['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setPage] = useState(1);

  const [status, setStatus] = useState<string | null>('All Status');

  // --- Fetch API ---
  const loadAssignments = useCallback(async (p = 1, replace = false) => {
    if (p === 1 && !replace) setLoading(true);
    try {
      const params: any = {
        page: p,
        per_page: 15,
      };
      
      if (status && status !== 'All Status') {
        params.status = status;
      }

      console.log('Loading assignments with params:', params);
      const response = await fetchAssignments(params);
      console.log('Assignments response:', response);
      
      setMeta(response.meta);
      setPage(response.meta.current_page);
      setAssignments(prev => (replace || p === 1 ? response.items : [...prev, ...response.items]));
    } catch (error) {
      console.error('Error loading assignments:', error);
      Alert.alert('Error', 'Failed to load assignments. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  useEffect(() => {
    loadAssignments(1, true);
  }, [loadAssignments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAssignments(1, true);
  }, [loadAssignments]);

  // --- Render List Item ---
  const renderItem = ({ item }: { item: MiddlemanAssignment }) => {
    const statusColor = getStatusColor(item.status);
    const statusText = item.status_label || getStatusText(item.status);

    return (
      <AssignmentCard
        assignment={item}
        onPress={() => navigation.navigate('assignmentDetails', { assignmentId: item.id })}
        statusColor={statusColor}
        statusText={statusText}
      />
    );
  };

  // --- Loader ---
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.green700} />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Assignments</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filter by status</Text>
        <View style={styles.filtersRow}>
          {(['All Status', 'Active', 'Inactive', 'Pending'] as const).map((statusOption) => (
            <FilterChip
              key={statusOption}
              label={statusOption}
              isActive={status === statusOption}
              onPress={() => {
                console.log('Filter changed to:', statusOption);
                setStatus(statusOption);
              }}
            />
          ))}
        </View>
      </View>

      {/* Assignments List */}
      <FlatList
        data={assignments}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={EmptyState}
      />
    </View>
  );
}

// --- Components ---

const AssignmentCard = ({
  assignment,
  onPress,
  statusColor,
  statusText
}: {
  assignment: MiddlemanAssignment;
  onPress: () => void;
  statusColor: string;
  statusText: string;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.card, pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] }]}
    accessibilityRole="button"
    accessibilityLabel={`Open assignment ${assignment.id}`}
  >
    {/* Header with Assignment ID and Status */}
    <View style={styles.cardHeader}>
      <View style={styles.cardTitleContainer}>
        <Text style={styles.cardTitle}>Assignment #{assignment.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>
    </View>

    {/* Company and Middleman Info */}
    <View style={styles.cardInfo}>
      <View style={styles.infoItem}>
        <View style={styles.infoIconContainer}>
          <Icon name="business" size={18} color={PALETTE.blue700} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Company</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {assignment.company?.name || '—'}
          </Text>
        </View>
      </View>

      <View style={styles.infoItem}>
        <View style={styles.infoIconContainer}>
          <Icon name="person" size={18} color={PALETTE.green700} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Middleman</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {assignment.middle_man?.name || '—'}
          </Text>
        </View>
      </View>
    </View>

    {/* Date Range */}
    <View style={styles.dateContainer}>
      <Icon name="schedule" size={16} color={PALETTE.text500} />
      <Text style={styles.dateText}>
        {formatDate(assignment.assigned_date)} - {formatDate(assignment.expiry_date)}
      </Text>
    </View>

    {/* Action Button */}
    <View style={styles.cardFooter}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.viewButton,
          pressed && { opacity: 0.8 }
        ]}
        accessibilityLabel="View Details"
      >
        <Icon name="arrow-forward-ios" size={16} color={PALETTE.green700} />
        <Text style={styles.viewButtonText}>View Details</Text>
      </Pressable>
    </View>
  </Pressable>
);

const FilterChip = ({
  label,
  isActive,
  onPress
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.filterChip,
      isActive && styles.filterChipActive
    ]}
  >
    <Text style={[
      styles.filterChipText,
      isActive && styles.filterChipTextActive
    ]}>
      {label}
    </Text>
  </Pressable>
);

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Icon name="assignment" size={48} color={PALETTE.text400} />
    <Text style={styles.emptyText}>No assignments found</Text>
    <Text style={styles.emptySubText}>Try adjusting your filters</Text>
  </View>
);

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
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
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: PALETTE.green700,
    borderColor: PALETTE.green700,
    shadowColor: PALETTE.green700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text600,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text900,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cardInfo: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.text500,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.text900,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  dateText: {
    fontSize: 14,
    color: PALETTE.text600,
    marginLeft: 8,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: PALETTE.green50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.green600,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.green700,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: PALETTE.text900,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: PALETTE.text600,
  },
});