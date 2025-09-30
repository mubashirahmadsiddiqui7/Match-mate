import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { PermissionsAndroid } from 'react-native';
import PALETTE from '../../../theme/palette';
import { getBoatById, updateBoat, Boat, UpdateBoatData } from '../../../services/boat';

const { width } = Dimensions.get('window');

interface FormValues {
  name: string;
  registration_number: string;
  type: string;
  boat_license_no: string;
  mfd_approved_no: string;
  boat_type: string;
  length_m: string;
  width_m: string;
  capacity_crew: string;
  capacity_weight_kg: string;
  number_of_fish_holds: string;
  boat_size: string;
  boat_capacity: string;
  engine_power: string;
  year_built: string;
  fishing_equipment: string;
  safety_equipment: string;
  insurance_info: string;
  license_info: string;
  notes: string;
  home_port: string;
  status: 'active' | 'maintenance' | 'retired';
}

const boatTypes = [
  'gill_netter',
  'trawler',
  'longliner',
  'purse_seiner',
  'pole_and_line',
  'handline',
  'other'
];

const statusOptions = ['active', 'maintenance', 'retired'];

export default function EditBoatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { boatId } = route.params as { boatId: number };
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [boat, setBoat] = useState<Boat | null>(null);
  const [selectedImages, setSelectedImages] = useState<Array<{ uri: string; name?: string; type?: string }>>([]);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: '',
      registration_number: '',
      type: '',
      boat_license_no: '',
      mfd_approved_no: '',
      boat_type: '',
      length_m: '',
      width_m: '',
      capacity_crew: '',
      capacity_weight_kg: '',
      number_of_fish_holds: '',
      boat_size: '',
      boat_capacity: '',
      engine_power: '',
      year_built: '',
      fishing_equipment: '',
      safety_equipment: '',
      insurance_info: '',
      license_info: '',
      notes: '',
      home_port: '',
      status: 'active',
    }
  });

  useEffect(() => {
    fetchBoatDetails();
  }, [boatId]);

  const fetchBoatDetails = async () => {
    try {
      setLoading(true);
      const boatData = await getBoatById(boatId);
      setBoat(boatData);
      
      // Pre-fill form with existing data
      setValue('name', boatData.name || '');
      setValue('registration_number', boatData.registration_number || '');
      setValue('type', boatData.type || '');
      setValue('boat_license_no', boatData.boat_license_no || '');
      setValue('mfd_approved_no', boatData.mfd_approved_no || '');
      setValue('boat_type', boatData.boat_type || '');
      setValue('length_m', boatData.length_m || '');
      setValue('width_m', boatData.width_m || '');
      setValue('capacity_crew', boatData.capacity_crew?.toString() || '');
      setValue('capacity_weight_kg', boatData.capacity_weight_kg?.toString() || '');
      setValue('number_of_fish_holds', boatData.number_of_fish_holds?.toString() || '');
      setValue('boat_size', boatData.boat_size || '');
      setValue('boat_capacity', boatData.boat_capacity || '');
      setValue('engine_power', boatData.engine_power || '');
      setValue('year_built', boatData.year_built?.toString() || '');
      setValue('fishing_equipment', boatData.fishing_equipment || '');
      setValue('safety_equipment', boatData.safety_equipment || '');
      setValue('insurance_info', boatData.insurance_info || '');
      setValue('license_info', boatData.license_info || '');
      setValue('notes', boatData.notes || '');
      setValue('home_port', boatData.home_port || '');
      setValue('status', boatData.status);
      
    } catch (error: any) {
      console.error('Error fetching boat details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch boat details',
      });
    } finally {
      setLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take boat photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleImagePicker = async (type: 'camera' | 'gallery') => {
    try {
      let result;
      
      if (type === 'camera') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          Toast.show({
            type: 'error',
            text1: 'Permission Denied',
            text2: 'Camera permission is required to take photos',
          });
          return;
        }
        
        result = await launchCamera({
          mediaType: 'photo',
          quality: 0.8,
          includeBase64: false,
        });
      } else {
        result = await launchImageLibrary({
          mediaType: 'photo',
          quality: 0.8,
          selectionLimit: 5,
          includeBase64: false,
        });
      }

      if (result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri!,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        }));
        
        setSelectedImages(prev => [...prev, ...newImages]);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `${newImages.length} image(s) added`,
        });
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to pick image',
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Image removed',
    });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!data.registration_number.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Registration number is required',
        });
        return;
      }

      if (!data.status) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Status is required',
        });
        return;
      }

      const updateData: UpdateBoatData = {
        id: boatId,
        ...data,
        photos: selectedImages,
      };

      console.log('Updating boat with data:', updateData);
      
      await updateBoat(updateData);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Boat updated successfully',
      });
      
      navigation.goBack();
      
    } catch (error: any) {
      console.error('Error updating boat:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update boat',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.green700} />
          <Text style={styles.loadingText}>Loading boat details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!boat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error" size={64} color={PALETTE.error} />
          <Text style={styles.errorTitle}>Boat Not Found</Text>
          <Text style={styles.errorSubtitle}>
            The boat you're trying to edit doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={PALETTE.text900} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Edit Boat</Text>
          <Text style={styles.headerSubtitle}>
            {boat.name || boat.registration_number}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Boat Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter boat name"
                  placeholderTextColor={PALETTE.text400}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="registration_number"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Registration Number *</Text>
                <TextInput
                  style={[styles.textInput, errors.registration_number && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter registration number"
                  placeholderTextColor={PALETTE.text400}
                />
                {errors.registration_number && (
                  <Text style={styles.errorText}>{errors.registration_number.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Boat Type</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter boat type"
                  placeholderTextColor={PALETTE.text400}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Status *</Text>
                <View style={styles.pickerContainer}>
                  {statusOptions.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        value === status && styles.statusOptionActive
                      ]}
                      onPress={() => onChange(status)}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        value === status && styles.statusOptionTextActive
                      ]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          />
        </View>

        {/* Licenses & Approvals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Licenses & Approvals</Text>
          
          <Controller
            control={control}
            name="boat_license_no"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Boat License Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter boat license number"
                  placeholderTextColor={PALETTE.text400}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="mfd_approved_no"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>MFD Approval Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter MFD approval number"
                  placeholderTextColor={PALETTE.text400}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="insurance_info"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Insurance Information</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter insurance details"
                  placeholderTextColor={PALETTE.text400}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="license_info"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>License Information</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter license details"
                  placeholderTextColor={PALETTE.text400}
                />
              </View>
            )}
          />
        </View>

        {/* Dimensions & Capacity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dimensions & Capacity</Text>
          
          <View style={styles.row}>
            <Controller
              control={control}
              name="length_m"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Length (m)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChange}
                    placeholder="0.00"
                    placeholderTextColor={PALETTE.text400}
                    keyboardType="numeric"
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="width_m"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Width (m)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChange}
                    placeholder="0.00"
                    placeholderTextColor={PALETTE.text400}
                    keyboardType="numeric"
                  />
                </View>
              )}
            />
          </View>

          <View style={styles.row}>
            <Controller
              control={control}
              name="capacity_crew"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Crew Capacity</Text>
                  <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChange}
                    placeholder="0"
                    placeholderTextColor={PALETTE.text400}
                    keyboardType="numeric"
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="capacity_weight_kg"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Weight Capacity (kg)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChange}
                    placeholder="0"
                    placeholderTextColor={PALETTE.text400}
                    keyboardType="numeric"
                  />
                </View>
              )}
            />
          </View>

          <View style={styles.row}>
            <Controller
              control={control}
              name="boat_size"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Boat Size (tons)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChange}
                    placeholder="0.00"
                    placeholderTextColor={PALETTE.text400}
                    keyboardType="numeric"
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="boat_capacity"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Boat Capacity (tons)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChange}
                    placeholder="0.00"
                    placeholderTextColor={PALETTE.text400}
                    keyboardType="numeric"
                  />
                </View>
              )}
            />
          </View>
        </View>

        {/* Technical Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Specifications</Text>
          
          <Controller
            control={control}
            name="engine_power"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Engine Power</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter engine power"
                  placeholderTextColor={PALETTE.text400}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="year_built"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Year Built</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="YYYY"
                  placeholderTextColor={PALETTE.text400}
                  keyboardType="numeric"
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="number_of_fish_holds"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Number of Fish Holds</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="0"
                  placeholderTextColor={PALETTE.text400}
                  keyboardType="numeric"
                />
              </View>
            )}
          />
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment</Text>
          
          <Controller
            control={control}
            name="fishing_equipment"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Fishing Equipment</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter fishing equipment details"
                  placeholderTextColor={PALETTE.text400}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="safety_equipment"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Safety Equipment</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter safety equipment details"
                  placeholderTextColor={PALETTE.text400}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          />
        </View>

        {/* Location & Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Notes</Text>
          
          <Controller
            control={control}
            name="home_port"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Home Port</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter home port"
                  placeholderTextColor={PALETTE.text400}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Additional Notes</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter any additional notes"
                  placeholderTextColor={PALETTE.text400}
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}
          />
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handleImagePicker('camera')}
            >
              <Icon name="camera-alt" size={20} color={PALETTE.green700} />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handleImagePicker('gallery')}
            >
              <Icon name="photo-library" size={20} color={PALETTE.green700} />
              <Text style={styles.photoButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>

          {selectedImages.length > 0 && (
            <View style={styles.photoGrid}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.photoItem}>
                  <View style={styles.photoPreview}>
                    <Icon name="image" size={40} color={PALETTE.text400} />
                  </View>
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removeImage(index)}
                  >
                    <Icon name="close" size={16} color={PALETTE.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="save" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.submitButtonText}>
              {saving ? 'Updating...' : 'Update Boat'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.text900,
  },
  headerSubtitle: {
    fontSize: 14,
    color: PALETTE.text500,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text900,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  halfWidth: {
    width: '48%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text700,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: PALETTE.text900,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: PALETTE.error,
  },
  errorText: {
    color: PALETTE.error,
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#fff',
  },
  statusOptionActive: {
    backgroundColor: PALETTE.green700,
    borderColor: PALETTE.green700,
  },
  statusOptionText: {
    color: PALETTE.text700,
    fontWeight: '600',
    fontSize: 14,
  },
  statusOptionTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.green700,
    backgroundColor: '#fff',
  },
  photoButtonText: {
    color: PALETTE.green700,
    fontWeight: '600',
    fontSize: 14,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: PALETTE.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  submitSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: PALETTE.green700,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: PALETTE.text500,
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.text900,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: PALETTE.text500,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: PALETTE.green700,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
