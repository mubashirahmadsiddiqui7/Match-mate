/* eslint-disable react-native/no-inline-styles */
// src/screens/Fisherman/AddTrip/FishingActivity.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Alert,
  StatusBar,
  StyleSheet,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import Slider from '@react-native-community/slider';

import { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import {
  createFishingActivity,
  updateFishingActivity,
  getFishingActivityById,
  type CreateFishingActivityBody,
} from '../../../services/fishingActivity';
import { isOnline } from '../../../offline/net';
import { enqueueCreateActivity } from '../../../offline/TripQueues';
import { buildActivityId } from '../../../utils/ids';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import PALETTE from '../../../theme/palette';
// import BiText from '../../../components/BiText';

type Nav = NativeStackNavigationProp<
  FishermanStackParamList,
  'FishingActivity'
>;
type R = RouteProp<FishermanStackParamList, 'FishingActivity'>;

type FormValues = {
  activityNo: number;
  mesh: number | null;
  netLen: string;
  netWid: string;
  netting: Date | null;
  hauling: Date | null;
};

// Time formatting function for API
function formatTimeForAPI(date: Date | null): string | null {
  if (!date) return null;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Format time for display
function formatTimeForDisplay(date: Date | null): string {
  if (!date) return 'Select time';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function FishingActivity() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const auth = useSelector((s: RootState) => (s as any).auth);
  const authUser = auth?.user;
  const profile = React.useMemo(() => authUser?.profile ?? authUser ?? {}, [authUser]);

  const {
    mode = 'create',
    activityId,
    tripId: tripIdParam,
    activityNo: activityNoParam,
    meta,
    prefill,
  } = route.params ?? {};

  const displayTripCode = String(meta?.trip_id ?? tripIdParam ?? '');
  const tripPkForApi = meta?.id;
  const initialActivity = activityNoParam ?? 1;

  const { gps, loading: gpsLoading } = useCurrentLocation();

  const { watch, setValue, getValues } = useForm<FormValues>({
    mode: 'onTouched',
    defaultValues: {
      activityNo: initialActivity,
      mesh: null,
      netLen: '',
      netWid: '',
      netting: null,
      hauling: null,
    },
  });

  const existingGpsRef = useRef<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showNettingPicker, setShowNettingPicker] = useState(false);
  const [showHaulingPicker, setShowHaulingPicker] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLevelError, setFormLevelError] = useState<string | null>(null);

  // ---- Prefill for EDIT ----
  useEffect(() => {
    let cancelled = false;

    async function loadExisting() {
      try {
        // show instantaneous prefill if caller passed it
        if (prefill && typeof prefill === 'object') {
          safeApplyPrefill(prefill);
        }

        if (activityId != null) {
          const a = await getFishingActivityById(activityId);
          if (!cancelled) safeApplyPrefill(a);
        }
      } catch (e: any) {
        if (!cancelled)
          Alert.alert('Failed', e?.message || 'Unable to load activity.');
      }
    }

    if (mode === 'edit') loadExisting();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activityId]);

  function safeApplyPrefill(a: any) {
    // These keys should exist on your adapted DTO (adjust if your adapter names differ)
    if (a?.activity_number) setValue('activityNo', a.activity_number);
    if (a?.mesh_size) setValue('mesh', Number(a.mesh_size));
    if (a?.net_length) setValue('netLen', String(a.net_length));
    if (a?.net_width) setValue('netWid', String(a.net_width));
    
    // Parse time strings to Date objects
    if (a?.time_of_netting) {
      const nettingTime = parseTimeString(a.time_of_netting);
      if (nettingTime) setValue('netting', nettingTime);
    }
    if (a?.time_of_hauling) {
      const haulingTime = parseTimeString(a.time_of_hauling);
      if (haulingTime) setValue('hauling', haulingTime);
    }
    
    if (a?.gps_latitude) existingGpsRef.current.lat = Number(a.gps_latitude);
    if (a?.gps_longitude) existingGpsRef.current.lng = Number(a.gps_longitude);
  }

  // Parse time string (HH:MM) to Date object
  function parseTimeString(timeStr: string): Date | null {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Validation function
  const validateForm = useCallback(() => {
    const values = getValues();
    const errors: Record<string, string> = {};

    // GPS validation
    if (!gps?.lat || !gps?.lng) {
      setFormLevelError('GPS location is required. Please wait for GPS or recapture location.');
      return false;
    }

    // Time validation
    if (!values.netting) {
      errors.netting = 'Netting time is required';
    }
    if (!values.hauling) {
      errors.hauling = 'Hauling time is required';
    }

    // Validate netting time is before hauling time
    if (values.netting && values.hauling) {
      if (values.netting >= values.hauling) {
        errors.hauling = 'Hauling time must be after netting time';
      }
    }

    // Net dimensions validation (optional but if provided, should be valid)
    if (values.netLen && (isNaN(Number(values.netLen)) || Number(values.netLen) < 0)) {
      errors.netLen = 'Net length must be a valid positive number';
    }
    if (values.netWid && (isNaN(Number(values.netWid)) || Number(values.netWid) < 0)) {
      errors.netWid = 'Net width must be a valid positive number';
    }

    // Mesh size validation (optional but if provided, must be within range)
    if (values.mesh != null) {
      const meshVal = Number(values.mesh);
      if (isNaN(meshVal) || meshVal < 1 || meshVal > 50) {
        errors.mesh = 'Mesh size must be between 1 and 50';
      }
    }

    setFormErrors(errors);
    setFormLevelError(null);
    return Object.keys(errors).length === 0;
  }, [getValues, gps]);

  // Clear errors when user starts typing
  const clearFieldError = useCallback((field: string) => {
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]);

  // Handle time picker changes
  function handleTimeChange(
    event: DateTimePickerEvent,
    selectedDate: Date | undefined,
    field: 'netting' | 'hauling'
  ) {
    if (Platform.OS === 'android') {
      setShowNettingPicker(false);
      setShowHaulingPicker(false);
    }

    if (event.type === 'dismissed') return;

    if (selectedDate) {
      setValue(field, selectedDate);
    }
  }

  async function onSubmit() {
    // Clear previous errors
    setFormErrors({});
    setFormLevelError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    const values = getValues();
    const online = await isOnline();

    try {
      setSubmitting(true);

      // Build the activity body with properly formatted times
      const body: CreateFishingActivityBody = {
        trip_id: tripPkForApi || 0,
        activity_number: values.activityNo,
        time_of_netting: formatTimeForAPI(values.netting),
        time_of_hauling: formatTimeForAPI(values.hauling),
        mesh_size: (values.mesh != null ? Number(values.mesh) : null) as any,
        net_length: values.netLen ? Number(values.netLen) : null,
        net_width: values.netWid ? Number(values.netWid) : null,
        gps_latitude: gps!.lat,
        gps_longitude: gps!.lng,
      };

      if (online) {
        if (mode === 'edit' && activityId != null) {
          const updated = await updateFishingActivity(activityId, body);
          Toast.show({
            type: 'success',
            text1: 'Updated ✅',
            text2: 'Fishing activity updated successfully.',
            position: 'top',
            visibilityTime: 2500,
          });
          navigation.replace('FishingActivityDetails', {
            activityId,
            fallback: updated?.data ?? updated,
            tripId: displayTripCode,
          });
        } else {
          const created = await createFishingActivity(body);
          Toast.show({
            type: 'success',
            text1: 'Saved 🎉',
            text2: 'Fishing activity recorded successfully.',
            position: 'top',
            visibilityTime: 2500,
          });
          const newId = created?.data?.id ?? created?.id ?? created?.activity?.id;
          navigation.replace('FishingActivityDetails', {
            activityId: newId,
            fallback: created?.data ?? created,
            tripId: displayTripCode,
          });
        }
      } else {
        // Offline mode
        const activityCode = buildActivityId();
        
        // Enqueue the activity creation
        const job = await enqueueCreateActivity(body, {
          tripLocalId: typeof tripPkForApi === 'string' ? tripPkForApi : undefined,
          tripServerId: typeof tripPkForApi === 'number' ? tripPkForApi : undefined,
        });

        Toast.show({
          type: 'success',
          text1: 'Saved Offline 🎉',
          text2: 'Activity will sync when online.',
          position: 'top',
          visibilityTime: 2500,
        });

                 // Navigate to details with local ID
         // derive simple date/time for offline details view
         const today = new Date();
         const yyyy = today.getFullYear();
         const mm = String(today.getMonth() + 1).padStart(2, '0');
         const dd = String(today.getDate()).padStart(2, '0');
         const activity_date = `${yyyy}-${mm}-${dd}`; // yyyy-mm-dd
         const activity_time = body.time_of_netting ?? body.time_of_hauling ?? null; // HH:mm
         const fisherId = profile?.fisherman_id ?? profile?.id ?? null;

         navigation.replace('FishingActivityDetails', {
           activityId: job.localId,
           fallback: {
             id: job.localId,
             activity_id: activityCode,
             fisherman_id: fisherId,
             trip_fisherman_id: fisherId,
             activity_date,
             activity_time,
             ...body,
             status: 'pending_upload'
           },
           tripId: displayTripCode,
         });
      }
    } catch (e: any) {
      console.error('Fishing activity error:', e);
      
      // Parse server errors if available
      let errorMessage = e?.message || 'An unexpected error occurred';
      
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.response?.data?.errors) {
        // Handle validation errors from server
        const serverErrors = e.response.data.errors;
        const firstError = Object.values(serverErrors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }

      setFormLevelError(errorMessage);
      
      Toast.show({
        type: 'error',
        text1: mode === 'edit' ? 'Update Failed' : 'Creation Failed',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------ UI ------------ */

  const netting = watch('netting');
  const hauling = watch('hauling');
  const mesh = watch('mesh');

  return (
    <>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" translucent={false} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {mode === 'edit' ? 'Edit Fishing Activity / ماہی گیری کی سرگرمی ترمیم' : 'Create Fishing Activity / ماہی گیری کی سرگرمی بنائیں'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Trip: {displayTripCode} • Activity #{initialActivity}
            </Text>
          </View>
        </View>

        {/* Form Level Error Alert */}
        {formLevelError && (
          <View style={styles.errorAlert}>
            <MaterialIcons name="error" size={20} color="#fff" />
            <Text style={styles.errorAlertText}>{formLevelError}</Text>
            <Pressable onPress={() => setFormLevelError(null)}>
              <MaterialIcons name="close" size={20} color="#fff" />
            </Pressable>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* GPS Status Section */}
          <SectionCard
            title="Location Status / مقام کی حالت"
            icon="location-on"
            status={gps ? 'ready' : 'pending'}
          >
            <View style={styles.gpsContainer}>
              <View style={styles.gpsStatus}>
                <MaterialIcons
                  name={gps ? 'location-on' : 'location-off'}
                  size={24}
                  color={gps ? PALETTE.green700 : PALETTE.error}
                />
                <Text style={[styles.gpsStatusText, { color: gps ? PALETTE.green700 : PALETTE.error }]}> 
                  {gps ? 'GPS Ready / جی پی ایس تیار' : 'Waiting for GPS... / جی پی ایس کا انتظار'}
                </Text>
                {gpsLoading && <ActivityIndicator size="small" color={PALETTE.text500} />}
              </View>
              {gps && (
                <View style={styles.gpsCoordinates}>
                  <Text style={styles.gpsCoordinatesText}>
                    {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
                  </Text>
                </View>
              )}
            </View>
          </SectionCard>

          {/* Activity Information */}
          <SectionCard
            title="Activity Information / سرگرمی کی معلومات"
            icon="assignment"
          >
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Activity Number * / سرگرمی نمبر *</Text>
              <TextInput
                style={[styles.input, formErrors.activityNo && styles.inputError]}
                value={String(watch('activityNo'))}
                onChangeText={(text) => {
                  setValue('activityNo', Number(text) || 1);
                  clearFieldError('activityNo');
                }}
                keyboardType="numeric"
                placeholder="1 / ۱"
                placeholderTextColor={PALETTE.text400}
              />
              {formErrors.activityNo && (
                <Text style={styles.errorText}>{formErrors.activityNo}</Text>
              )}
            </View>
          </SectionCard>

          {/* Mesh Size */}
          <SectionCard
            title="Mesh Size / جالی کا سائز"
            icon="grid-on"
          >
            <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Select Mesh Size (1–50) / جالی کا سائز منتخب کریں</Text>
            <View style={{ gap: 12 }}>
              <Text style={{ fontWeight: '700', color: PALETTE.text900 }}>
                {mesh != null ? `Selected: ${mesh}` : 'Not selected'}
              </Text>

              {/* Thicker, more visible slider with progress fill */}
              <View
                style={styles.sliderContainer}
                onLayout={(e) => {
                  const w = e.nativeEvent.layout.width;
                  // cache width in a ref via setValue to avoid extra state; store in form as _sliderWidth
                  // We won't submit it; just for layout math
                  // @ts-ignore - store transient
                  setValue('_sliderWidth' as any, w, { shouldValidate: false, shouldDirty: false });
                }}
              >
                <View style={styles.sliderTrack} />
                {/* Progress fill based on current mesh */}
                <View
                  style={[
                    styles.sliderProgress,
                    {
                      // compute width from stored width if available
                      width: (() => {
                        // @ts-ignore read transient width
                        const w = (getValues() as any)._sliderWidth || 0;
                        const v = Math.max(1, Math.min(50, mesh ?? 1));
                        const ratio = (v - 1) / 49; // 1..50
                        return w * ratio;
                      })(),
                    },
                  ]}
                />
                  {/* Triangle thumb indicator overlay */}
                <View
                  pointerEvents="none"
                  style={[
                    styles.sliderThumbTriangle,
                    {
                      left: (() => {
                        // @ts-ignore read transient width
                        const w = (getValues() as any)._sliderWidth || 0;
                        const v = Math.max(1, Math.min(50, mesh ?? 1));
                        const ratio = (v - 1) / 49; // 1..50
                        // Center the triangle horizontally (triangle half-width ~8)
                        const x = w * ratio - 8;
                        return Math.max(0, x);
                      })(),
                    },
                  ]}
                />
                <Slider
                  minimumValue={1}
                  maximumValue={50}
                  step={1}
                  value={mesh ?? 1}
                  minimumTrackTintColor={'transparent'}
                  maximumTrackTintColor={'transparent'}
                  thumbTintColor={'transparent'}
                  onValueChange={(v: number) => setValue('mesh', Math.round(v))}
                  accessibilityLabel="Mesh size slider"
                />
              </View>
              <View style={styles.sliderLabelsRow}>
                <Text style={styles.sliderLabelText}>1</Text>
                <Text style={styles.sliderLabelText}>50</Text>
              </View>

              {formErrors.mesh && (
                <Text style={styles.errorText}>{formErrors.mesh}</Text>
              )}
              <Text style={styles.fieldDescription}>
                Drag the triangle left or right to choose mesh size / مثلث کو بائیں یا دائیں کھینچیں
              </Text>
            </View>
            </View>
          </SectionCard>

          {/* Net Dimensions */}
          <SectionCard
            title="Net Dimensions / جال کے ابعاد"
            icon="straighten"
          >
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Net Measurements (Optional) / جال کی پیمائش (اختیاری)</Text>
              <View style={styles.dimensionsRow}>
                <View style={styles.dimensionField}>
                  <Text style={styles.dimensionLabel}>Length (m) / لمبائی (m)</Text>
                  <TextInput
                    style={[styles.input, formErrors.netLen && styles.inputError]}
                    value={watch('netLen')}
                    onChangeText={(text) => {
                      setValue('netLen', text);
                      clearFieldError('netLen');
                    }}
                    keyboardType="numeric"
                    placeholder="0 / ۰"
                    placeholderTextColor={PALETTE.text400}
                  />
                  {formErrors.netLen && (
                    <Text style={styles.errorText}>{formErrors.netLen}</Text>
                  )}
                </View>
                <View style={styles.dimensionField}>
                  <Text style={styles.dimensionLabel}>Width (m) / چوڑائی (m)</Text>
                  <TextInput
                    style={[styles.input, formErrors.netWid && styles.inputError]}
                    value={watch('netWid')}
                    onChangeText={(text) => {
                      setValue('netWid', text);
                      clearFieldError('netWid');
                    }}
                    keyboardType="numeric"
                    placeholder="0 / ۰"
                    placeholderTextColor={PALETTE.text400}
                  />
                  {formErrors.netWid && (
                    <Text style={styles.errorText}>{formErrors.netWid}</Text>
                  )}
                </View>
              </View>
            </View>
          </SectionCard>

          {/* Time Fields */}
          <SectionCard
            title="Fishing Times / ماہی گیری کے اوقات"
            icon="schedule"
          >
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Select Start and End Times * / آغاز اور اختتامی اوقات منتخب کریں *</Text>
              <Text style={styles.fieldDescription}>
                Choose when you started and finished fishing / وہ وقت منتخب کریں جب ماہی گیری شروع اور ختم کی
              </Text>
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={styles.timeLabel}>Netting Time * / جال ڈالنے کا وقت *</Text>
                  <Pressable
                    onPress={() => setShowNettingPicker(true)}
                    style={[
                      styles.timeButton,
                      netting && styles.timeButtonSelected,
                      formErrors.netting && styles.timeButtonError
                    ]}
                  >
                    <Text style={[
                      styles.timeButtonText,
                      netting && styles.timeButtonTextSelected
                    ]}>
                      {formatTimeForDisplay(netting)}
                    </Text>
                    <MaterialIcons 
                      name="access-time" 
                      size={20} 
                      color={netting ? PALETTE.green700 : PALETTE.text400} 
                    />
                  </Pressable>
                  {formErrors.netting && (
                    <Text style={styles.errorText}>{formErrors.netting}</Text>
                  )}
                  {showNettingPicker && (
                    <DateTimePicker
                      value={netting || new Date()}
                      mode="time"
                      is24Hour={true}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, date) => handleTimeChange(event, date, 'netting')}
                    />
                  )}
                </View>
                <View style={styles.timeField}>
                  <Text style={styles.timeLabel}>Hauling Time * / جال کھینچنے کا وقت *</Text>
                  <Pressable
                    onPress={() => setShowHaulingPicker(true)}
                    style={[
                      styles.timeButton,
                      hauling && styles.timeButtonSelected,
                      formErrors.hauling && styles.timeButtonError
                    ]}
                  >
                    <Text style={[
                      styles.timeButtonText,
                      hauling && styles.timeButtonTextSelected
                    ]}>
                      {formatTimeForDisplay(hauling)}
                    </Text>
                    <MaterialIcons 
                      name="access-time" 
                      size={20} 
                      color={hauling ? PALETTE.green700 : PALETTE.text400} 
                    />
                  </Pressable>
                  {formErrors.hauling && (
                    <Text style={styles.errorText}>{formErrors.hauling}</Text>
                  )}
                  {showHaulingPicker && (
                    <DateTimePicker
                      value={hauling || new Date()}
                      mode="time"
                      is24Hour={true}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, date) => handleTimeChange(event, date, 'hauling')}
                    />
                  )}
                </View>
              </View>
            </View>
          </SectionCard>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Pressable
            disabled={submitting || gpsLoading}
            onPress={onSubmit}
            style={[
              styles.submitButton,
              (submitting || gpsLoading) && styles.submitButtonDisabled
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons
                  name={mode === 'edit' ? 'save' : 'add-circle'}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.submitButtonText} numberOfLines={1} ellipsizeMode="tail">
                  {mode === 'edit'
                    ? 'Update Activity / سرگرمی اپڈیٹ'
                    : 'Create Activity / سرگرمی بنائیں'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
        </View>
      </SafeAreaView>
    </>
  );
}
/* ---- Components ---- */
function SectionCard({ 
  title, 
  icon, 
  status, 
  children 
}: { 
  title: string; 
  icon: string; 
  status?: 'ready' | 'pending' | 'error';
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <MaterialIcons 
            name={icon as any} 
            size={20} 
            color={PALETTE.green700} 
          />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {status && (
          <View style={[
            styles.statusIndicator,
            status === 'ready' && styles.statusReady,
            status === 'pending' && styles.statusPending,
            status === 'error' && styles.statusError,
          ]}>
            <MaterialIcons 
              name={status === 'ready' ? 'check' : status === 'error' ? 'error' : 'schedule'} 
              size={16} 
              color="#fff" 
            />
          </View>
        )}
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

/* ---- Styles ---- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.green700,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: PALETTE.green700,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.green800,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.error,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  errorAlertText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text900,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusReady: {
    backgroundColor: PALETTE.green700,
  },
  statusPending: {
    backgroundColor: PALETTE.warn,
  },
  statusError: {
    backgroundColor: PALETTE.error,
  },
  sectionContent: {
    padding: 20,
  },
  sliderContainer: {
    position: 'relative',
    paddingVertical: 12,
  },
  sliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 8,
    backgroundColor: PALETTE.border,
    borderRadius: 8,
    transform: [{ translateY: -4 }],
  },
  sliderProgress: {
    position: 'absolute',
    left: 0,
    top: '50%',
    height: 8,
    backgroundColor: PALETTE.green700,
    borderRadius: 8,
    transform: [{ translateY: -4 }],
  },
  sliderThumbTriangle: {
    position: 'absolute',
    top: '50%',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: PALETTE.green700,
    transform: [{ translateY: 8 }],
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelText: {
    fontSize: 12,
    color: PALETTE.text500,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.text900,
    marginBottom: 8,
  },
  fieldDescription: {
    fontSize: 14,
    color: PALETTE.text500,
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: PALETTE.surface,
    color: PALETTE.text900,
    fontWeight: '500',
  },
  inputError: {
    borderColor: PALETTE.error,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: PALETTE.error,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  gpsContainer: {
    gap: 12,
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsStatusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  gpsCoordinates: {
    backgroundColor: PALETTE.surface,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  gpsCoordinatesText: {
    fontSize: 14,
    color: PALETTE.text600,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  meshGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  meshButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    minWidth: 48,
    alignItems: 'center',
  },
  meshButtonSelected: {
    backgroundColor: PALETTE.green700,
    borderColor: PALETTE.green700,
  },
  meshButtonText: {
    color: PALETTE.text700,
    fontWeight: '600',
    fontSize: 16,
  },
  meshButtonTextSelected: {
    color: '#fff',
  },
  dimensionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dimensionField: {
    flex: 1,
  },
  dimensionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text700,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text700,
    marginBottom: 8,
  },
  timeButton: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: PALETTE.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeButtonSelected: {
    borderColor: PALETTE.green700,
    backgroundColor: '#F0FDF4',
  },
  timeButtonError: {
    borderColor: PALETTE.error,
    backgroundColor: '#FEF2F2',
  },
  timeButtonText: {
    fontSize: 16,
    color: PALETTE.text400,
    fontWeight: '500',
  },
  timeButtonTextSelected: {
    color: PALETTE.text900,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButton: {
    backgroundColor: PALETTE.green700,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: PALETTE.green700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

