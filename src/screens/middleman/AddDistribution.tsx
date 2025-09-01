import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import Toast from 'react-native-toast-message';
import {
  createDistribution,
  type CreateDistributionData,
  type CreateDistributionLot,
} from '../../services/middlemanDistribution';

const { width: screenWidth } = Dimensions.get('window');

// Mock data - replace with actual API calls
const TripOptions = [
  { label: 'Select Trip', value: '' },
  { label: 'TRIP-20250829-001', value: '1' },
  { label: 'TRIP-20250829-002', value: '2' },
  { label: 'TRIP-20250831-001', value: '3' },
];

const FishermanOptions = [
  { label: 'Select Fisherman', value: '' },
  { label: 'Ali Fisherman', value: '2' },
  { label: 'Ahmed Fisherman', value: '3' },
  { label: 'Sara Fisherman', value: '4' },
];

const MiddlemanOptions = [
  { label: 'Select Middleman', value: '' },
  { label: 'Hamza Middleman', value: '3' },
  { label: 'Ahmed Middleman', value: '4' },
  { label: 'Sara Middleman', value: '5' },
];

const LotOptions = [
  { label: 'Select Lot', value: '' },
  { label: 'LOT-1', value: 1 },
  { label: 'LOT-2', value: 2 },
  { label: 'LOT-3', value: 3 },
  { label: 'LOT-4', value: 4 },
  { label: 'LOT-5', value: 5 },
];

export default function AddDistribution() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  // Form state
  const [tripId, setTripId] = useState('');
  const [fishermanId, setFishermanId] = useState('');
  const [middlemanId, setMiddlemanId] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');

  // Distributed lots state
  const [distributedLots, setDistributedLots] = useState<CreateDistributionLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<number | ''>('');
  const [lotQuantity, setLotQuantity] = useState('');
  const [lotNotes, setLotNotes] = useState('');

  // Available lots state
  const [availableLots, setAvailableLots] = useState<Array<{ id: string; lot_no: string; name?: string }>>([]);
  const [lotOptions, setLotOptions] = useState(LotOptions);

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validation functions
  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!tripId) newErrors.tripId = 'Trip is required';
    if (!fishermanId) newErrors.fishermanId = 'Fisherman is required';
    if (!middlemanId) newErrors.middlemanId = 'Middleman is required';
    if (!totalQuantity) {
      newErrors.totalQuantity = 'Total quantity is required';
    } else if (isNaN(Number(totalQuantity)) || Number(totalQuantity) <= 0) {
      newErrors.totalQuantity = 'Total quantity must be a positive number';
    }
    if (totalValue && (isNaN(Number(totalValue)) || Number(totalValue) < 0)) {
      newErrors.totalValue = 'Total value must be a positive number';
    }
    if (distributedLots.length === 0) {
      newErrors.distributedLots = 'At least one lot must be added';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [tripId, fishermanId, middlemanId, totalQuantity, totalValue, distributedLots]);

  // Add lot to distribution
  const addLot = useCallback(() => {
    if (!selectedLot) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a lot',
      });
      return;
    }

    if (!lotQuantity || isNaN(Number(lotQuantity)) || Number(lotQuantity) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid quantity',
      });
      return;
    }

    const newLot: CreateDistributionLot = {
      lot_no: Number(selectedLot),
      quantity_kg: lotQuantity,
      notes: lotNotes || undefined,
    };

    setDistributedLots(prev => [...prev, newLot]);
    setSelectedLot('');
    setLotQuantity('');
    setLotNotes('');
  }, [selectedLot, lotQuantity, lotNotes]);

  // Remove lot from distribution
  const removeLot = useCallback((index: number) => {
    setDistributedLots(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Submit form
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors before submitting',
      });
      return;
    }

    setLoading(true);
    try {
      const distributionData: CreateDistributionData = {
        trip_id: Number(tripId),
        fisherman_id: Number(fishermanId),
        middle_man_id: Number(middlemanId),
        distributed_lots: distributedLots,
        total_quantity_kg: totalQuantity,
        total_value: totalValue ? Number(totalValue) : undefined,
        verification_notes: verificationNotes || undefined,
      };

      console.log('📤 Submitting distribution data:', distributionData);

      const response = await createDistribution(distributionData);
      
      console.log('✅ Distribution created successfully:', response);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Distribution created successfully!',
      });

      // Navigate back to distributions list
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error creating distribution:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create distribution. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [tripId, fishermanId, middlemanId, distributedLots, totalQuantity, totalValue, verificationNotes, validateForm, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create New Distribution</Text>
            <Text style={styles.headerSubtitle}>Add a new fish lot distribution</Text>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            {/* Trip Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trip *</Text>
              <Dropdown
                style={[styles.dropdown, errors.tripId && styles.inputError]}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownText}
                data={TripOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Trip"
                value={tripId}
                onChange={item => setTripId(item.value)}
              />
              {errors.tripId && <Text style={styles.errorText}>{errors.tripId}</Text>}
            </View>

            {/* Fisherman Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fisherman *</Text>
              <Dropdown
                style={[styles.dropdown, errors.fishermanId && styles.inputError]}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownText}
                data={FishermanOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Fisherman"
                value={fishermanId}
                onChange={item => setFishermanId(item.value)}
              />
              {errors.fishermanId && <Text style={styles.errorText}>{errors.fishermanId}</Text>}
            </View>

            {/* Middleman Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Middleman *</Text>
              <Dropdown
                style={[styles.dropdown, errors.middlemanId && styles.inputError]}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownText}
                data={MiddlemanOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Middleman"
                value={middlemanId}
                onChange={item => setMiddlemanId(item.value)}
              />
              {errors.middlemanId && <Text style={styles.errorText}>{errors.middlemanId}</Text>}
            </View>

            {/* Total Quantity */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Quantity (KG) *</Text>
              <TextInput
                style={[styles.textInput, errors.totalQuantity && styles.inputError]}
                value={totalQuantity}
                onChangeText={setTotalQuantity}
                placeholder="Enter total quantity"
                keyboardType="numeric"
              />
              {errors.totalQuantity && <Text style={styles.errorText}>{errors.totalQuantity}</Text>}
            </View>

            {/* Total Value */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Value ($)</Text>
              <TextInput
                style={[styles.textInput, errors.totalValue && styles.inputError]}
                value={totalValue}
                onChangeText={setTotalValue}
                placeholder="Enter total value (optional)"
                keyboardType="numeric"
              />
              {errors.totalValue && <Text style={styles.errorText}>{errors.totalValue}</Text>}
            </View>

            {/* Verification Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={verificationNotes}
                onChangeText={setVerificationNotes}
                placeholder="Enter verification notes (optional)"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Distributed Lots */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distributed Lots *</Text>
            {errors.distributedLots && <Text style={styles.errorText}>{errors.distributedLots}</Text>}

            {/* Add Lot Form */}
            <View style={styles.addLotForm}>
              <View style={styles.lotRow}>
                <View style={styles.lotInputGroup}>
                  <Text style={styles.label}>Lot</Text>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.dropdownPlaceholder}
                    selectedTextStyle={styles.dropdownText}
                    data={LotOptions}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Lot"
                    value={selectedLot}
                    onChange={item => setSelectedLot(item.value as number | '')}
                  />
                </View>

                <View style={styles.lotInputGroup}>
                  <Text style={styles.label}>Quantity (KG)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={lotQuantity}
                    onChangeText={setLotQuantity}
                    placeholder="Quantity"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={lotNotes}
                  onChangeText={setLotNotes}
                  placeholder="Enter notes (optional)"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <TouchableOpacity style={styles.addLotButton} onPress={addLot}>
                <Text style={styles.addLotButtonText}>➕ Add Lot</Text>
              </TouchableOpacity>
            </View>

            {/* Added Lots List */}
            {distributedLots.length > 0 && (
              <View style={styles.lotsList}>
                <Text style={styles.lotsListTitle}>Added Lots:</Text>
                {distributedLots.map((lot, index) => (
                  <View key={index} style={styles.lotItem}>
                    <View style={styles.lotInfo}>
                      <Text style={styles.lotText}>LOT-{lot.lot_no}</Text>
                      <Text style={styles.lotQuantity}>{lot.quantity_kg} KG</Text>
                      {lot.notes && <Text style={styles.lotNotes}>{lot.notes}</Text>}
                    </View>
                    <TouchableOpacity 
                      style={styles.removeLotButton}
                      onPress={() => removeLot(index)}
                    >
                      <Text style={styles.removeLotButtonText}>❌</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>📤 Create Distribution</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdown: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
    fontSize: 15,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  textInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    fontSize: 15,
    color: '#1f2937',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  addLotForm: {
    marginBottom: 20,
  },
  lotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  lotInputGroup: {
    flex: 1,
    marginRight: 8,
  },
  addLotButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addLotButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  lotsList: {
    marginTop: 16,
  },
  lotsListTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  lotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  lotInfo: {
    flex: 1,
  },
  lotText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  lotQuantity: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  lotNotes: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
  removeLotButton: {
    padding: 8,
  },
  removeLotButtonText: {
    fontSize: 16,
  },
  submitSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
