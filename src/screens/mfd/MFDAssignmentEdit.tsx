import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import Toast from 'react-native-toast-message';
import { fetchMFDAssignmentById, updateMFDAssignment } from '../../services/mfd';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';

type Nav = NativeStackNavigationProp<MFDStackParamList>;
type Route = RouteProp<MFDStackParamList, 'AssignmentEdit'>;

export default function MFDAssignmentEdit() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [formData, setFormData] = useState({
    assigned_date: '',
    expiry_date: '',
    status: 'active',
    notes: '',
  });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssignedDatePicker, setShowAssignedDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [assignedDate, setAssignedDate] = useState(new Date());
  const [expiryDate, setExpiryDate] = useState(new Date());

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const loadAssignment = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMFDAssignmentById(params.assignmentId);
      setAssignment(data);
      const assignedDate = new Date(data.assigned_date);
      const expiryDate = data.expiry_date ? new Date(data.expiry_date) : new Date();
      setAssignedDate(assignedDate);
      setExpiryDate(expiryDate);
      setFormData({
        assigned_date: data.assigned_date.split('T')[0],
        expiry_date: data.expiry_date ? data.expiry_date.split('T')[0] : '',
        status: data.status,
        notes: data.notes || '',
      });
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
    loadAssignment();
  }, [loadAssignment]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAssignedDateChange = (event: any, selectedDate?: Date) => {
    setShowAssignedDatePicker(false);
    if (selectedDate) {
      setAssignedDate(selectedDate);
      setFormData({ ...formData, assigned_date: selectedDate.toISOString().split('T')[0] });
    }
  };

  const handleExpiryDateChange = (event: any, selectedDate?: Date) => {
    setShowExpiryDatePicker(false);
    if (selectedDate) {
      setExpiryDate(selectedDate);
      setFormData({ ...formData, expiry_date: selectedDate.toISOString().split('T')[0] });
    }
  };

  const handleUpdate = async () => {
    if (!formData.assigned_date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await updateMFDAssignment(params.assignmentId, {
        assigned_date: formData.assigned_date,
        expiry_date: formData.expiry_date || null,
        status: formData.status,
        notes: formData.notes || null,
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Assignment updated successfully',
        position: 'top',
      });

      navigation.goBack();
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      
      // Check if it's a validation error with specific message
      if (error.message && error.message.includes('Assignment already exists')) {
        Alert.alert(
          'Assignment Already Exists',
          'An assignment already exists for this middle man and company combination.',
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to update assignment',
          position: 'top',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedStatus = statusOptions.find(s => s.value === formData.status);

  if (loading && !assignment) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PALETTE.green700} />
        <Text style={styles.loadingText}>Loading assignment...</Text>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color={PALETTE.text400} />
        <Text style={styles.errorTitle}>Assignment not found</Text>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.green700} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Assignment #{assignment.id}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainContent}>
          {/* Assignment Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="info" size={20} color={PALETTE.green700} />
              <Text style={styles.cardTitle}>Assignment Details</Text>
            </View>

            <View style={styles.form}>
              {/* Middle Man (Read-only) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Middle Man</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>
                    {assignment.middle_man?.name || 'Unknown'}
                  </Text>
                </View>
                <Text style={styles.hintText}>Middle man cannot be changed</Text>
              </View>

              {/* Company (Read-only) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>
                    {assignment.company?.name || 'Unknown'}
                  </Text>
                </View>
                <Text style={styles.hintText}>Company cannot be changed</Text>
              </View>

              {/* Assigned Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Assigned Date *</Text>
                <Pressable
                  style={styles.dateInput}
                  onPress={() => setShowAssignedDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {assignedDate.toLocaleDateString()}
                  </Text>
                  <Icon name="calendar-today" size={20} color={PALETTE.text600} />
                </Pressable>
                {showAssignedDatePicker && (
                  <DateTimePicker
                    value={assignedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleAssignedDateChange}
                  />
                )}
              </View>

              {/* Expiry Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expiry Date</Text>
                <Pressable
                  style={styles.dateInput}
                  onPress={() => setShowExpiryDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {formData.expiry_date ? expiryDate.toLocaleDateString() : 'Select Date'}
                  </Text>
                  <Icon name="calendar-today" size={20} color={PALETTE.text600} />
                </Pressable>
                {showExpiryDatePicker && (
                  <DateTimePicker
                    value={expiryDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleExpiryDateChange}
                  />
                )}
              </View>

              {/* Status */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Status *</Text>
                <Pressable
                  style={styles.dropdown}
                  onPress={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {selectedStatus?.label || 'Select Status'}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={24} color={PALETTE.text600} />
                </Pressable>
                
                {showStatusDropdown && (
                  <View style={styles.dropdownList}>
                    {statusOptions.map((status) => (
                      <Pressable
                        key={status.value}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData({ ...formData, status: status.value });
                          setShowStatusDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{status.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={styles.textArea}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Optional notes about this assignment..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Sidebar */}
        <View style={styles.sidebar}>
          {/* Actions Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="settings" size={20} color={PALETTE.green700} />
              <Text style={styles.cardTitle}>Actions</Text>
            </View>

            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.actionButton, styles.updateButton]}
                onPress={handleUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="save" size={20} color="#fff" />
                )}
                <Text style={styles.actionButtonText}>Update Assignment</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleBack}
              >
                <Icon name="close" size={20} color={PALETTE.text600} />
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
              </Pressable>
            </View>
          </View>

          {/* Current Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="info" size={20} color={PALETTE.green700} />
              <Text style={styles.cardTitle}>Current Info</Text>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {new Date(assignment.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Updated</Text>
                <Text style={styles.infoValue}>
                  {new Date(assignment.updated_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Days Active</Text>
                <Text style={styles.infoValue}>
                  {Math.floor((new Date().getTime() - new Date(assignment.assigned_date).getTime()) / (1000 * 60 * 60 * 24)).toFixed(2)} days
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text700,
    marginTop: 16,
    marginBottom: 20,
  },
  header: {
    backgroundColor: PALETTE.green700,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainContent: {
    flex: 2,
  },
  sidebar: {
    flex: 1,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
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
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginLeft: 8,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text900,
    marginBottom: 8,
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  readOnlyText: {
    fontSize: 14,
    color: PALETTE.text600,
  },
  hintText: {
    fontSize: 12,
    color: PALETTE.text500,
    marginTop: 4,
    fontStyle: 'italic',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: PALETTE.text900,
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: PALETTE.text900,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 14,
    color: PALETTE.text900,
    flex: 1,
  },
  textArea: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: PALETTE.text900,
    backgroundColor: '#fff',
    minHeight: 80,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  updateButton: {
    backgroundColor: PALETTE.green700,
  },
  cancelButton: {
    backgroundColor: PALETTE.border,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButtonText: {
    color: PALETTE.text600,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  infoLabel: {
    fontSize: 14,
    color: PALETTE.text600,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: PALETTE.text900,
    fontWeight: '600',
  },
});