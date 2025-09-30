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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import Toast from 'react-native-toast-message';
import { createMFDAssignment, fetchAllExporterCompanies, fetchAllMiddleMen, type Company, type MiddleMan } from '../../services/mfd';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';

type Nav = NativeStackNavigationProp<MFDStackParamList>;

export default function MFDAssignmentCreate() {
  const navigation = useNavigation<Nav>();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    middle_man_id: '',
    company_id: '',
    assigned_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'active',
    notes: '',
  });

  const [middleMen, setMiddleMen] = useState<MiddleMan[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showMiddleManDropdown, setShowMiddleManDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssignedDatePicker, setShowAssignedDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [assignedDate, setAssignedDate] = useState(new Date());
  const [expiryDate, setExpiryDate] = useState(new Date());

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ];

  const loadMiddleMen = useCallback(async () => {
    try {
      const data = await fetchAllMiddleMen();
      setMiddleMen(data);
    } catch (error) {
      console.error('Error loading middle men:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load middle men',
        position: 'top',
      });
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const data = await fetchAllExporterCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load companies',
        position: 'top',
      });
    }
  }, []);

  useEffect(() => {
    loadMiddleMen();
    loadCompanies();
  }, [loadMiddleMen, loadCompanies]);

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

  const handleCreate = async () => {
    if (!formData.middle_man_id || !formData.company_id || !formData.assigned_date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate expiry date if provided
    if (formData.expiry_date && new Date(formData.expiry_date) <= new Date(formData.assigned_date)) {
      Alert.alert('Error', 'Expiry date must be after assigned date');
      return;
    }

    try {
      setLoading(true);
      await createMFDAssignment({
        middle_man_id: parseInt(formData.middle_man_id),
        company_id: parseInt(formData.company_id),
        assigned_date: formData.assigned_date,
        expiry_date: formData.expiry_date || null,
        status: formData.status,
        notes: formData.notes || null,
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Assignment created successfully',
        position: 'top',
      });

      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      
      // Check if it's a validation error with specific message
      if (error.message && error.message.includes('Assignment already exists')) {
        Alert.alert(
          'Assignment Already Exists',
          'An assignment already exists for this middle man and company combination. Please select different middle man or company.',
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
          text2: error.message || 'Failed to create assignment',
          position: 'top',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedMiddleMan = middleMen.find(m => m.id.toString() === formData.middle_man_id);
  const selectedCompany = companies.find(c => c.id.toString() === formData.company_id);
  const selectedStatus = statusOptions.find(s => s.value === formData.status);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.green700} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Create Assignment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Assignment Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="info" size={20} color={PALETTE.green700} />
            <Text style={styles.cardTitle}>Assignment Details</Text>
          </View>

          <View style={styles.form}>
            {/* Middle Man */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Middle Man *</Text>
              <Pressable
                style={styles.dropdown}
                onPress={() => setShowMiddleManDropdown(!showMiddleManDropdown)}
              >
                <Text style={[styles.dropdownText, !selectedMiddleMan && styles.placeholder]}>
                  {selectedMiddleMan ? `${selectedMiddleMan.name} (${selectedMiddleMan.email})` : 'Select Middle Man'}
                </Text>
                <Icon name="keyboard-arrow-down" size={24} color={PALETTE.text600} />
              </Pressable>
              
              {showMiddleManDropdown && (
                <View style={styles.dropdownList}>
                  {middleMen.map((middleMan) => (
                    <Pressable
                      key={middleMan.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData({ ...formData, middle_man_id: middleMan.id.toString() });
                        setShowMiddleManDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>
                        {middleMan.name} ({middleMan.email})
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Company */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company *</Text>
              <Pressable
                style={styles.dropdown}
                onPress={() => setShowCompanyDropdown(!showCompanyDropdown)}
              >
                <Text style={[styles.dropdownText, !selectedCompany && styles.placeholder]}>
                  {selectedCompany ? selectedCompany.name : 'Select Company'}
                </Text>
                <Icon name="keyboard-arrow-down" size={24} color={PALETTE.text600} />
              </Pressable>
              
              {showCompanyDropdown && (
                <View style={styles.dropdownList}>
                  {companies.map((company) => (
                    <Pressable
                      key={company.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData({ ...formData, company_id: company.id.toString() });
                        setShowCompanyDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>
                        {company.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
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

        {/* Actions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="star" size={20} color={PALETTE.green700} />
            <Text style={styles.cardTitle}>Actions</Text>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, styles.createButton]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="lock" size={20} color="#fff" />
              )}
              <Text style={styles.actionButtonText}>Create Assignment</Text>
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
  placeholder: {
    color: PALETTE.text500,
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
  createButton: {
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
});