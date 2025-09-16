// src/screens/Fisherman/AddBoat/BoatRegistrationScreen.tsx
/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormProvider, useForm } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';
import { PermissionsAndroid, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import PALETTE from '../../../theme/palette';
import { api } from '../../../services/https';

type FormValues = {
  registration_number: string;
  name: string;
  owner_id?: string;
  user_id?: string;
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
};

const BOAT_TYPES = ['gill_netter', 'trawler'] as const;

const YEARS = Array.from(
  { length: 125 },
  (_, i) => new Date().getFullYear() + 1 - i,
);

// Enhanced Field Component
function Field({
  label,
  children,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} {required ? <Text style={styles.required}>*</Text> : null}
      </Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// Enhanced Input Component
function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
  multiline,
  numberOfLines,
}: {
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  error?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      style={[
        styles.input,
        error && styles.inputError,
        multiline && styles.textArea,
      ]}
      placeholderTextColor={PALETTE.text500}
      multiline={multiline}
      numberOfLines={numberOfLines}
    />
  );
}

// Enhanced Dropdown Component
function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  value?: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(option => option === value);

  return (
    <View style={styles.dropdownContainer}>
      <Pressable
        onPress={() => setOpen(o => !o)}
        style={[
          styles.dropdownButton,
          open && styles.dropdownButtonActive,
          error && styles.dropdownError,
        ]}
      >
        <Text
          style={[
            styles.dropdownText,
            !selectedOption && styles.dropdownPlaceholder,
          ]}
        >
          {selectedOption || placeholder || 'Select option'}
        </Text>
        <Icon
          name={open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color={PALETTE.text500}
        />
      </Pressable>

      {open && (
        <View style={styles.dropdownSheet}>
          {options.map((opt, index) => (
            <Pressable
              key={opt}
              onPress={() => {
                onChange(opt);
                setOpen(false);
              }}
              style={({ pressed }) =>
                [
                  styles.dropdownItem,
                  pressed && styles.dropdownItemPressed,
                  index === options.length - 1 && styles.dropdownItemLast,
                  opt === value && styles.dropdownItemSelected,
                ] as any
              }
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  opt === value && styles.dropdownItemTextSelected,
                ]}
              >
                {opt}
              </Text>
              {opt === value && (
                <Icon name="check" size={18} color={PALETTE.green700} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// Image Upload Component
function ImageUpload({
  images,
  onImagesChange,
}: {
  images: string[];
  onImagesChange: (images: string[]) => void;
}) {
  const pickImage = async () => {
    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 5 - images.length,
        quality: 0.8,
        includeBase64: false,
      });

      if (result.didCancel) {
        console.log('User cancelled gallery picker');
        return;
      }

      if (result.errorCode) {
        console.log('Gallery error:', result.errorCode, result.errorMessage);
        Toast.show({
          type: 'error',
          text1: 'Gallery Error',
          text2: result.errorMessage || 'Failed to open gallery',
        });
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newImages = result.assets.map((asset: Asset) => asset.uri || '');
        onImagesChange([...images, ...newImages]);
        
        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Images Added',
          text2: `${newImages.length} image${newImages.length > 1 ? 's' : ''} added successfully`,
        });
      }
    } catch (error) {
      console.log('Gallery error:', error);
      Toast.show({
        type: 'error',
        text1: 'Gallery Error',
        text2: 'Failed to pick image from gallery',
      });
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message:
              'This app needs access to your camera to take boat photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  };

  const takePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Camera permission is required to take photos',
        });
        return;
      }

      const result: ImagePickerResponse = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        saveToPhotos: true,
      });

      if (result.didCancel) {
        console.log('User cancelled camera');
        return;
      }

      if (result.errorCode) {
        console.log('Camera error:', result.errorCode, result.errorMessage);
        Toast.show({
          type: 'error',
          text1: 'Camera Error',
          text2: result.errorMessage || 'Failed to open camera',
        });
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newImage = result.assets[0].uri || '';
        if (newImage && images.length < 5) {
          onImagesChange([...images, newImage]);
          
          // Show success toast
          Toast.show({
            type: 'success',
            text1: 'Photo Taken',
            text2: 'Photo added successfully',
          });
        }
      }
    } catch (error) {
      console.log('Camera error:', error);
      Toast.show({
        type: 'error',
        text1: 'Camera Error',
        text2: 'Failed to open camera. Please check camera permissions.',
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    // Show success toast
    Toast.show({
      type: 'success',
      text1: 'Image Removed',
      text2: 'Image removed successfully',
    });
  };

  return (
    <View style={styles.imageUploadContainer}>
      <Text style={styles.imageUploadLabel}>Boat Photos (Optional)</Text>
      <Text style={styles.imageUploadSubtext}>
        Add multiple photos of your boat ({images.length}/5)
      </Text>

      <View style={styles.imageGrid}>
        {images.map((image, index) => (
          <View key={index} style={styles.imageItem}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(index)}
            >
              <Icon name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {images.length < 5 && (
          <View style={styles.addImageButtons}>
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Icon name="photo-library" size={24} color={PALETTE.text500} />
              <Text style={styles.addImageText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addImageButton} onPress={takePhoto}>
              <Icon name="camera-alt" size={24} color={PALETTE.text500} />
              <Text style={styles.addImageText}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// Main Screen Component
export default function BoatRegistrationScreen({ navigation }: any) {
  const methods = useForm<FormValues>({
    defaultValues: {
      registration_number: '',
      name: '',
      owner_id: '',
      user_id: '',
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
    },
    mode: 'onChange',
  });

  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);

// inside BoatRegistrationScreen component
const onSave = methods.handleSubmit(async data => {
  // Validator-required fields
  const errs: string[] = [];
  if (!data.registration_number?.trim()) errs.push('Registration Number is required');
  if (!data.status) errs.push('Status is required (active / maintenance / retired)');
  if (errs.length) {
    Toast.show({
      type: 'error',
      text1: 'Validation Error',
      text2: errs.join('\n'),
    });
    return;
  }

  // helpers
  const isBlank = (v: any) => v === undefined || v === null || String(v).trim() === '';
  const toInt = (v: any) => (isBlank(v) ? undefined : parseInt(String(v), 10));
  const toFloat = (v: any) => (isBlank(v) ? undefined : parseFloat(String(v)));

  const yearNow = new Date().getFullYear();
  const year_built = toInt(data.year_built);
  if (year_built && (year_built < 1900 || year_built > yearNow)) {
    Toast.show({
      type: 'error',
      text1: 'Validation Error',
      text2: `Year Built must be between 1900 and ${yearNow}`,
    });
    return;
  }

  try {
    setSaving(true);
    const formData = new FormData();

    // required
    formData.append('registration_number', String(data.registration_number).trim());
    formData.append('status', data.status);

    // nullable strings
    const strMap: Record<string, string | undefined> = {
      name: isBlank(data.name) ? undefined : String(data.name),
      type: isBlank(data.type) ? undefined : String(data.type),
      boat_license_no: isBlank(data.boat_license_no) ? undefined : String(data.boat_license_no),
      mfd_approved_no: isBlank(data.mfd_approved_no) ? undefined : String(data.mfd_approved_no),
      boat_type: isBlank(data.boat_type) ? undefined : String(data.boat_type),
      engine_power: isBlank(data.engine_power) ? undefined : String(data.engine_power),
      fishing_equipment: isBlank(data.fishing_equipment) ? undefined : String(data.fishing_equipment),
      safety_equipment: isBlank(data.safety_equipment) ? undefined : String(data.safety_equipment),
      insurance_info: isBlank(data.insurance_info) ? undefined : String(data.insurance_info),
      license_info: isBlank(data.license_info) ? undefined : String(data.license_info),
      notes: isBlank(data.notes) ? undefined : String(data.notes),
      home_port: isBlank(data.home_port) ? undefined : String(data.home_port),
    };
    Object.entries(strMap).forEach(([k, v]) => v !== undefined && formData.append(k, v));

    // nullable FKs
    const owner_id = toInt(data.owner_id);
    const user_id = toInt(data.user_id);
    if (owner_id !== undefined) formData.append('owner_id', String(owner_id));
    if (user_id !== undefined) formData.append('user_id', String(user_id));

    // nullable numerics
    const numericMap: Record<string, number | undefined> = {
      length_m: toFloat(data.length_m),
      width_m: toFloat(data.width_m),
      capacity_crew: toInt(data.capacity_crew),
      capacity_weight_kg: toInt(data.capacity_weight_kg),
      number_of_fish_holds: toInt(data.number_of_fish_holds),
      boat_size: toFloat(data.boat_size),
      boat_capacity: toFloat(data.boat_capacity),
      year_built,
    };
    Object.entries(numericMap).forEach(([k, v]) => v !== undefined && !Number.isNaN(v) && formData.append(k, String(v)));

    // photos[]
    const pickExt = (uri: string) => uri.match(/\.(jpe?g|png|gif)$/i)?.[0]?.toLowerCase() ?? '.jpg';
    const pickMime = (ext: string) => (ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg');
    images.forEach((uri, idx) => {
      const ext = pickExt(uri);
      formData.append('photos[]', { uri, name: `photo_${idx}${ext}`, type: pickMime(ext) } as any);
    });

    await api('/boats', { method: 'POST', body: formData, isUpload: true }); // isUpload tells HTTP wrapper to handle FormData properly
    Toast.show({
      type: 'success',
      text1: 'Success!',
      text2: 'Boat registered successfully.',
    });
    // Navigate back after a short delay to let user see the toast
    setTimeout(() => {
      navigation?.goBack?.();
    }, 1500);
  } catch (error: any) {
    Toast.show({
      type: 'error',
      text1: 'Registration Failed',
      text2: error?.message || 'Could not register boat. Please try again.',
    });
  } finally {
    setSaving(false);
  }
});


  const formErrors = methods.formState.errors;

  return (
    <>
      <StatusBar backgroundColor={PALETTE.green700 || '#1B5E20'} barStyle="light-content" translucent={false} />
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">Register New Boat / نئی کشتی رجسٹر کریں</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
            Provide complete boat details for registration / رجسٹریشن کے لیے مکمل تفصیلات دیں
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FormProvider {...methods}>
          {/* Debug: Check if form is connected */}
          {(() => {
            console.log('FormProvider mounted, methods:', methods);
            console.log('Form state in render:', methods.getValues());
            return null;
          })()}
          {/* Basic Boat Information */}
          <Section title="Basic Information / بنیادی معلومات" icon="info">
            <Field label="Boat Name / کشتی کا نام" required error={formErrors.name?.message}>
              <Input
                value={methods.watch('name')}
                onChangeText={text => {
                  console.log('Setting name to:', text);
                  methods.setValue('name', text);
                  // Test: Check if form state is updated
                  setTimeout(() => {
                    const currentState = methods.getValues();
                    console.log('Form state after name change:', currentState);
                    console.log(
                      'Name field value in state:',
                      currentState.name,
                    );
                  }, 100);
                }}
                placeholder="Enter boat name / کشتی کا نام درج کریں"
              />
            </Field>

            <Field
              label="Registration Number / رجسٹریشن نمبر"
              required
              error={formErrors.registration_number?.message}
            >
              <Input
                value={methods.watch('registration_number')}
                onChangeText={text =>
                  methods.setValue('registration_number', text)
                }
                placeholder="e.g., B-12345 / مثال: B-12345"
              />
            </Field>

            {/* Boat Type */}
            <Field
              label="Boat Type / کشتی کی قسم"
              required
              error={formErrors.type?.message}
            >
              <Dropdown
                value={methods.watch('type')}
                onChange={value => {
                  methods.setValue('type', value);
                }}
                options={[...BOAT_TYPES]}
                placeholder="Select boat type / کشتی کی قسم منتخب کریں"
                error={!!formErrors.type}
              />
            </Field>
          </Section>

          {/* Dimensions */}
          <Section title="Dimensions / جہتیں" icon="straighten">
            <Field
              label="Length (m) / لمبائی (m)"
              required
              error={formErrors.length_m?.message}
            >
              <Input
                value={methods.watch('length_m')}
                onChangeText={text =>
                  methods.setValue('length_m', text.replace(/[^0-9.]/g, ''))
                }
                placeholder="e.g., 18.5 / مثال: 18.5"
                keyboardType="numeric"
                error={!!formErrors.length_m}
              />
            </Field>

            <Field
              label="Width (m) / چوڑائی (m)"
              required
              error={formErrors.width_m?.message}
            >
              <Input
                value={methods.watch('width_m')}
                onChangeText={text =>
                  methods.setValue('width_m', text.replace(/[^0-9.]/g, ''))
                }
                placeholder="e.g., 5.2 / مثال: 5.2"
                keyboardType="numeric"
                error={!!formErrors.width_m}
              />
            </Field>

            <Field
              label="Crew Capacity / عملے کی گنجائش"
              required
              error={formErrors.capacity_crew?.message}
            >
              <Input
                value={methods.watch('capacity_crew')}
                onChangeText={text =>
                  methods.setValue('capacity_crew', text.replace(/[^0-9]/g, ''))
                }
                placeholder="e.g., 5 / مثال: 5"
                keyboardType="numeric"
                error={!!formErrors.capacity_crew}
              />
            </Field>
          </Section>

          {/* Technical Specifications */}
          <Section title="Technical Specifications / تکنیکی خصوصیات" icon="engineering">
            <Field
              label="Boat Size (tons) / کشتی کا سائز (ٹن)"
              required
              error={formErrors.boat_size?.message}
            >
              <Input
                value={methods.watch('boat_size')}
                onChangeText={text =>
                  methods.setValue('boat_size', text.replace(/[^0-9.]/g, ''))
                }
                placeholder="e.g., 25.5 / مثال: 25.5"
                keyboardType="numeric"
                error={!!formErrors.boat_size}
              />
            </Field>

            <Field
              label="Engine Power / انجن کی طاقت"
              required
              error={formErrors.engine_power?.message}
            >
              <Input
                value={methods.watch('engine_power')}
                onChangeText={text => methods.setValue('engine_power', text)}
                placeholder="e.g., 500 HP / مثال: 500 HP"
                error={!!formErrors.engine_power}
              />
            </Field>

            <Field
              label="Year Built / تیاری کا سال"
              required
              error={formErrors.year_built?.message}
            >
              <Dropdown
                value={methods.watch('year_built')}
                onChange={value => methods.setValue('year_built', value)}
                options={YEARS.map(String)}
                placeholder="Select year / سال منتخب کریں"
                error={!!formErrors.year_built}
              />
            </Field>

            <Field
              label="Boat Capacity (tons) / کشتی کی گنجائش (ٹن)"
              required
              error={formErrors.boat_capacity?.message}
            >
              <Input
                value={methods.watch('boat_capacity')}
                onChangeText={text =>
                  methods.setValue(
                    'boat_capacity',
                    text.replace(/[^0-9.]/g, ''),
                  )
                }
                placeholder="e.g., 30.0 / مثال: 30.0"
                keyboardType="numeric"
                error={!!formErrors.boat_capacity}
              />
            </Field>
          </Section>

          {/* Additional Specifications */}
          <Section title="Additional Specifications / اضافی خصوصیات" icon="settings">
            <Field label="Boat License No">
              <Input
                value={methods.watch('boat_license_no')}
                onChangeText={text => methods.setValue('boat_license_no', text)}
                placeholder="Boat license number / کشتی لائسنس نمبر"
              />
            </Field>

            <Field label="MFD Approved No / ایم ایف ڈی منظوری نمبر">
              <Input
                value={methods.watch('mfd_approved_no')}
                onChangeText={text => methods.setValue('mfd_approved_no', text)}
                placeholder="MFD approval number / ایم ایف ڈی منظوری نمبر"
              />
            </Field>

            <Field label="Capacity Weight (kg) / وزن کی گنجائش (کلو)">
              <Input
                value={methods.watch('capacity_weight_kg')}
                onChangeText={text =>
                  methods.setValue(
                    'capacity_weight_kg',
                    text.replace(/[^0-9]/g, ''),
                  )
                }
                placeholder="e.g., 5000 / مثال: 5000"
                keyboardType="numeric"
              />
            </Field>

            <Field label="Number of Fish Holds / مچھلی رکھنے کی جگہوں کی تعداد">
              <Input
                value={methods.watch('number_of_fish_holds')}
                onChangeText={text =>
                  methods.setValue(
                    'number_of_fish_holds',
                    text.replace(/[^0-9]/g, ''),
                  )
                }
                placeholder="e.g., 2 / مثال: 2"
                keyboardType="numeric"
              />
            </Field>

            <Field label="Home Port / ہوم پورٹ">
              <Input
                value={methods.watch('home_port')}
                onChangeText={text => methods.setValue('home_port', text)}
                placeholder="Home port location / ہوم پورٹ مقام"
              />
            </Field>

            <Field label="Status / حیثیت" required>
              <Dropdown
                value={methods.watch('status')}
                onChange={value =>
                  methods.setValue(
                    'status',
                    value as 'active' | 'maintenance' | 'retired',
                  )
                }
                options={['active', 'maintenance', 'retired']}
                placeholder="Select status / حیثیت منتخب کریں"
                error={!!formErrors.status}
              />
            </Field>
          </Section>

          {/* Equipment & Information */}
          <Section title="Equipment & Information / آلات اور معلومات" icon="build">
            <Field label="Fishing Equipment">
              <Input
                value={methods.watch('fishing_equipment')}
                onChangeText={text =>
                  methods.setValue('fishing_equipment', text)
                }
                placeholder="Describe fishing equipment / ماہی گیری کا سامان بیان کریں"
                multiline
                numberOfLines={3}
              />
            </Field>

            <Field label="Safety Equipment / حفاظتی سامان">
              <Input
                value={methods.watch('safety_equipment')}
                onChangeText={text =>
                  methods.setValue('safety_equipment', text)
                }
                placeholder="Describe safety equipment / حفاظتی سامان بیان کریں"
                multiline
                numberOfLines={3}
              />
            </Field>

            <Field label="Insurance Information / انشورنس کی معلومات">
              <Input
                value={methods.watch('insurance_info')}
                onChangeText={text => methods.setValue('insurance_info', text)}
                placeholder="Insurance details / انشورنس کی تفصیلات"
                multiline
                numberOfLines={2}
              />
            </Field>

            <Field label="License Information / لائسنس کی معلومات">
              <Input
                value={methods.watch('license_info')}
                onChangeText={text => methods.setValue('license_info', text)}
                placeholder="License details / لائسنس کی تفصیلات"
                multiline
                numberOfLines={2}
              />
            </Field>

            <Field label="Additional Notes / اضافی نوٹس">
              <Input
                value={methods.watch('notes')}
                onChangeText={text => methods.setValue('notes', text)}
                placeholder="Any additional information / اضافی معلومات"
                multiline
                numberOfLines={3}
              />
            </Field>
          </Section>

          {/* Image Upload */}
          <Section title="Boat Photos / کشتی کی تصاویر" icon="photo-camera">
            <ImageUpload images={images} onImagesChange={setImages} />
          </Section>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <Pressable
              disabled={saving}
              onPress={onSave}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
                saving && styles.saveButtonDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="save" size={20} color="#fff" />
                  <Text style={styles.saveButtonText} numberOfLines={1} ellipsizeMode="tail">Register Boat / کشتی رجسٹر کریں</Text>
                </>
              )}
            </Pressable>
          </View>
        </FormProvider>
      </ScrollView>
      </SafeAreaView>
    </>
  );
}

// Enhanced Section Component
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Icon name={icon as any} size={20} color={PALETTE.green700} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
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
    justifyContent: 'flex-start',
    height: 56,
    paddingHorizontal: 12,
    backgroundColor: PALETTE.green700 || '#1B5E20',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0, // allow text to shrink/ellipsize inside header
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    flexShrink: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    color: PALETTE.text600 || '#4B5563',
  },
  required: {
    color: PALETTE.error,
  },
  errorText: {
    color: PALETTE.error,
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border || '#E5E7EB',
    backgroundColor: '#FFF',
    color: PALETTE.text900 || '#111827',
  },
  inputError: {
    borderColor: PALETTE.error,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
  },
  dropdownContainer: {
    marginBottom: 14,
  },
  dropdownButton: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border || '#E5E7EB',
    backgroundColor: '#FFF',
    color: PALETTE.text900 || '#111827',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonActive: {
    borderColor: PALETTE.green700 || '#1B5E20',
    borderWidth: 2,
  },
  dropdownError: {
    borderColor: PALETTE.error,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.text900 || '#111827',
  },
  dropdownPlaceholder: {
    color: PALETTE.text500 || '#6B7280',
  },
  dropdownSheet: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: PALETTE.border || '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemPressed: {
    backgroundColor: '#F3F4F6',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemSelected: {
    color: PALETTE.green700 || '#1B5E20',
  },
  dropdownItemText: {
    fontSize: 14,
    color: PALETTE.text900 || '#111827',
  },
  dropdownItemTextSelected: {
    fontWeight: '700',
  },
  imageUploadContainer: {
    marginBottom: 14,
  },
  imageUploadLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.text900 || '#111827',
    marginBottom: 8,
  },
  imageUploadSubtext: {
    fontSize: 12,
    color: PALETTE.text500 || '#6B7280',
    marginBottom: 14,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageItem: {
    width: (Dimensions.get('window').width - 20 - 10) / 2, // 2 columns, 10px gap
    height: 100,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: PALETTE.error,
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  addImageButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  addImageButton: {
    flex: 1,
    height: 100,
    borderRadius: 8,
    backgroundColor: PALETTE.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 10,
  },
  addImageText: {
    marginTop: 8,
    fontSize: 12,
    color: PALETTE.text500 || '#6B7280',
  },
  buttonContainer: {
    marginTop: 20,
  },
  saveButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: PALETTE.green700 || '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.998 }],
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
  },
  section: {
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: PALETTE.surface || '#FFFFFF',
    borderColor: PALETTE.border || '#E5E7EB',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: PALETTE.text900 || '#111827',
  },
  sectionContent: {
    padding: 14,
  },
});
