/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react-native/no-inline-styles */
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  Alert,
  StatusBar,
  StyleSheet,
  Pressable,
} from 'react-native';
// Use core RN ScrollView to avoid requiring RNGestureHandler on Android/iOS
import { ScrollView } from 'react-native';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { s } from './styles';
import { buildTripId } from '../../../utils/ids';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import BasicInfoSection, {
  formatYmd12h,
  parseYmd12h,
} from './components/sections/BasicInfoSection';
import DropdownsSection from './components/sections/DropdownsSection';
import ContactSpeciesCostSection from './components/sections/ContactSpeciesCostSection';
import LocationCard from './components/LocationCard';
import SaveBar from './components/SaveBar';

import type { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';
import SectionCard from './components/SectionCard';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  createTrip,
  getTripById,
  startTrip,
  updateTrip,
  type TripDetails,
} from '../../../services/trips';
import type { RouteProp } from '@react-navigation/native';
import { isOnline } from '../../../offline/net';
import { enqueueStartTrip, enqueueTrip, processQueue } from '../../../offline/TripQueues';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import CaptainInfo from './components/sections/CaptainInfo';
import FuelIceInformation from './components/sections/FuelIceInformation';
import LocationInformation from './components/sections/LocationInformation';
import FishingInformation from './components/sections/FishingInformaton';

/** ---------- local form type (includes new fields) ---------- */
export type FormValues = {
  fisherman: string;
  fisherman_id: string;
  departure_time: string;

  // Basic info (new required)
  captainNameId: string; // maps -> captain_name
  captainPhone: string; // maps -> captain_mobile_no
  crewNo: string; // maps -> crew_no and crew_count
  port_clearance_no: string;
  fuel_quantity?: string; // numeric, required by server
  ICE?: string; // maps -> ice_quantity (numeric, required)

  // Existing
  boatNameId: string; // maps -> boat_registration_number
  crewCount?: string; // we’ll also map to crew_count if present
  tripType: string; // label; maps to enum
  tripPurpose?: string;

  // Ports/sites
  departure_site?: string; // NEW field required by server
  departure_port?: string;
  destination_port?: string;
  port_location?: string; // convenience (server requires)

  // sea
  seaType?: string;
  seaConditions?: string;

  // contact/species/costs
  emergencyContact?: string;
  targetSpecies: string;
  tripCost?: string;
  fuelCost?: string;
  estimatedCatch?: string;
  equipmentCost?: string;
};

const HEADER_BG = '#1f720d';
type TripRoute = RouteProp<FishermanStackParamList, 'Trip'>;
type Nav = NativeStackNavigationProp<FishermanStackParamList, 'Trip'>;

import { Animated, Easing } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { StartTripCTA } from './components/StartTripButton';

function LockNotice({ visible }: { visible: boolean }) {
  const slide = useRef(new Animated.Value(-80)).current; // slide from top
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: -80,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slide, opacity]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slide }],
        opacity,
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#34D399', // emerald-400
        backgroundColor: '#ECFDF5', // emerald-50
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <MaterialIcons name="check-circle" size={22} color="#059669" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#065F46', fontWeight: '800' }}>Trip saved</Text>
        <Text style={{ color: '#065F46' }}>
          Details are locked. Review then press{' '}
          <Text style={{ fontWeight: '700' }}>Start Trip</Text>.
        </Text>
      </View>
      <MaterialIcons name="lock" size={20} color="#065F46" />
    </Animated.View>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
const formatYmd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const TRIP_TYPE_MAP: Record<string, string> = {
  'Fishing Trip': 'fishing',
  'Transport Trip': 'transport',
  'Inspection Trip': 'inspection',
  'Patrol Trip': 'patrol',
  'Research Trip': 'research',
};
const TRIP_TYPE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(TRIP_TYPE_MAP).map(([label, val]) => [val, label]),
);

export default function AddTripScreen() {
  const auth = useSelector((s: RootState) => (s as any).auth);
  const authUser = auth?.user;
  console.log('AuthUser in FishermanHome:', authUser);
  const profile = useMemo(
    () => authUser?.profile ?? authUser ?? {},
    [authUser],
  );
  console.log('Profile in AddTripScreen:', profile?.boat_registration_number);

  const [details, setDetails] = useState<any>(profile);

  const name =
    details?.name ||
    `${details?.first_name ?? ''} ${details?.last_name ?? ''}`.trim() ||
    'Fisherman';
  const [saving, setSaving] = useState(false);

  const navigation = useNavigation<Nav>();
  const { params } = useRoute<TripRoute>();

  const [createdTrip, setCreatedTrip] = useState<{
    id: number | string;
    trip_id?: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isEdit = !!params?.id || params?.mode === 'edit';
  const editingId = params?.id;

  const methods = useForm<FormValues>({
    defaultValues: {
      fisherman: name,
      fisherman_id: profile?.id ? String(profile.id) : '',
      departure_time: formatYmd12h(new Date()),

      captainNameId: '',
      captainPhone: '',
      crewNo: '',
      port_clearance_no: '',
      fuel_quantity: '',
      ICE: '',

      boatNameId: profile?.boat_registration_number ?? '',
      crewCount: '',
      tripType: 'Fishing Trip',
      tripPurpose: '',

      departure_site: '',
      departure_port: '',
      destination_port: '',

      seaType: '',
      seaConditions: '',

      emergencyContact: '',
      targetSpecies: '',
      tripCost: '',
      fuelCost: '',
      estimatedCatch: '',
      equipmentCost: '',
    },
    mode: 'onTouched',
  });

  const [initialValues, setInitialValues] = useState<FormValues | null>(null);
  const [tripId] = useState(buildTripId());
  const { gps, loading: gpsLoading, recapture } = useCurrentLocation();

  const [loading, setLoading] = useState<boolean>(isEdit);
  const [serverTrip, setServerTrip] = useState<TripDetails | null>(null);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('FishermanHome');
  };

  /** -------- load existing for EDIT -------- */
  const loadForEdit = useCallback(async () => {
    if (!isEdit || !editingId) return;
    try {
      setLoading(true);
      const t = await getTripById(editingId);
      setServerTrip(t);

      const formVals: FormValues = {
        fisherman: t.fisherman?.name || profile?.name || '',
        fisherman_id: t.fisherman?.id
          ? String(t.fisherman.id)
          : profile?.id
          ? String(profile.id)
          : '',
        departure_time: t.departure_time || formatYmd12h(new Date()),

        // server doesn’t return all the new fields yet; leave blank
        captainNameId: '',
        captainPhone: '',
        crewNo: t.crew_count != null ? String(t.crew_count) : '',
        port_clearance_no: '',
        fuel_quantity: '',
        ICE: '',

        boatNameId: t.boat_registration_no ?? '',
        crewCount: t.crew_count != null ? String(t.crew_count) : '',
        tripType:
          TRIP_TYPE_REVERSE[t.trip_type ?? ''] || t.trip_type || 'Fishing Trip',
        tripPurpose: t.trip_purpose ?? '',

        departure_site: t.port_location ?? '',
        departure_port: t.departure_port ?? '',
        destination_port: '',

        seaType: '',
        seaConditions: t.sea_conditions ?? '',

        emergencyContact: t.emergency_contact ?? '',
        targetSpecies: t.target_species ?? '',
        tripCost: '',
        fuelCost: t.fuel_cost != null ? String(t.fuel_cost) : '',
        estimatedCatch:
          t.estimated_catch != null ? String(t.estimated_catch) : '',
        equipmentCost:
          t.operational_cost != null ? String(t.operational_cost) : '',
      };

      methods.reset(formVals, { keepDefaultValues: false });
      setInitialValues(formVals);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load trip for edit.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [isEdit, editingId, profile?.name, profile.id, methods, navigation]);

  useEffect(() => {
    loadForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  /** -------- CREATE -------- */
  const onSaveCreate = methods.handleSubmit(async values => {
    if (!gps) {
      Alert.alert(
        'Location required',
        'Please capture location before saving.',
      );
      return;
    }
    // One canonical crew value from either field
    const crewCountNumber = Number(values.crewNo || values.crewCount || 0);
    if (!Number.isFinite(crewCountNumber) || crewCountNumber < 1) {
      Alert.alert('Missing info', 'Crew count is required and must be >= 1.');
      return;
    }

    // Basic required presence guard (mirrors your server errors)
    const requiredPairs: Array<[string, any, string]> = [
      ['fisherman_id', profile?.id, 'Fisherman is required'],
      ['boat_registration_number', values.boatNameId, 'Boat ID is required'],
      ['trip_type', values.tripType, 'Trip Type is required'],
      ['captain_name', values.captainNameId, 'Captain name is required'],
      [
        'captain_mobile_no',
        values.captainPhone,
        'Captain mobile no is required',
      ],
      ['crew_no', crewCountNumber, 'Crew no is required'],
      ['crew_count', crewCountNumber, 'Crew count is required'], // ← important
      [
        'port_clearance_no',
        values.port_clearance_no,
        'Port clearance no is required',
      ],
      ['fuel_quantity', values.fuel_quantity, 'Fuel quantity is required'],
      ['ice_quantity', values.ICE, 'ICE quantity is required'],
      [
        'port_location',
        values.departure_site || values.departure_port,
        'Port location is required',
      ],
      ['departure_time', values.departure_time, 'Departure time is required'],
      ['departure_site', values.departure_site, 'Departure site is required'],
      ['departure_port', values.departure_port, 'Departure port is required'],
    ];
    for (const [, v, msg] of requiredPairs) {
      if (
        v === undefined ||
        v === null ||
        String(v).trim?.() === '' ||
        v === 0
      ) {
        Alert.alert('Missing info', msg);
        return;
      }
    }

    try {
      const departureDisplay =
        values.departure_time?.trim() || formatYmd12h(new Date());
      const dt = parseYmd12h(departureDisplay);
      const departure_date = formatYmd(dt);

      const fishermanId = Number(values.fisherman_id || profile?.id);

      const tripTypeRaw = values.tripType?.trim() || 'Fishing Trip';
      const trip_type = TRIP_TYPE_MAP[tripTypeRaw] ?? 'fishing';

      // Port/location: server requires both port_location and departure_site & departure_port
      const port_location =
        values.departure_site?.trim() ||
        values.destination_port?.trim() ||
        values.departure_port?.trim() ||
        undefined;

      // Build payload for server
      const body = {
        trip_name: tripId,
        trip_id: tripId, // if server accepts, mirrors what it generates
        fisherman_id: fishermanId,

        // boat & type
        boat_registration_number: values.boatNameId?.trim(),
        trip_type,

        // captain & crew
        captain_name: values.captainNameId?.trim(),
        captain_mobile_no: values.captainPhone?.trim(),
        crew_no: Number(values.crewNo || 0),
        crew_count: crewCountNumber, // ← also required

        // admin
        port_clearance_no: values.port_clearance_no?.trim(),
        fuel_quantity: Number(values.fuel_quantity || 0),
        ice_quantity: Number(values.ICE || 0),

        // routing
        departure_site: values.departure_site || undefined,
        departure_port: values.departure_port || undefined,
        destination_port: values.destination_port || undefined,
        port_location,

        // timing & coords
        departure_date,
        departure_time: departureDisplay,
        departure_latitude: gps?.lat,
        departure_longitude: gps?.lng,

        // misc existing
        fishing_method: tripTypeRaw,
        target_species: values.targetSpecies?.trim() || undefined,

        sea_type: values.seaType || undefined,
        sea_conditions: values.seaConditions || undefined,
        emergency_contact: values.emergencyContact?.trim() || undefined,

        // legacy costs (optional)
        trip_cost: values.tripCost ? Number(values.tripCost) : undefined,
        fuel_cost: values.fuelCost ? Number(values.fuelCost) : undefined,
        estimated_catch: values.estimatedCatch
          ? Number(values.estimatedCatch)
          : undefined,
        equipment_cost: values.equipmentCost
          ? Number(values.equipmentCost)
          : undefined,

        notes: values.tripPurpose?.trim() || undefined,
      } as const;

      const online = await isOnline();

      // if (!online) {
      //   const job = await enqueueTrip(body as any); // now returns job with localId

      //   // await enqueueTrip(body as any);
      //   Toast.show({
      //     type: 'success',
      //     text1: 'Trip Saved Offline 🎉',
      //     text2: 'Trip moved to upload queue and will auto-submit when online.',
      //     position: 'bottom', // or 'top'
      //     visibilityTime: 3000,
      //   });
      //   navigation.navigate('OfflineTrips');
      //   return;
      // }
      // inside onSaveCreate(), offline branch:
      if (!online) {
        const job = await enqueueTrip(body as any); // now returns job with localId
        setCreatedTrip({ id: job.localId, trip_id: tripId }); // store local id so Start can depend on it
        Toast.show({
          type: 'success',
          text1: 'Trip Saved Offline 🎉',
          text2: 'Will auto-upload when online.',
        });
        // DON'T navigate away; let them press Start (and we’ll queue that too)
        return;
      }

      try {
        const created: any = await createTrip(body as any);
        // Returned shape can be { success, message, trip: {...} } or direct object
        const tripObj = created?.trip ?? created;
        setCreatedTrip({
          id: tripObj?.id,
          trip_id: tripObj?.trip_id ?? tripId,
        });
        Toast.show({
          type: 'success',
          text1: 'Trip created 🎉',
          text2: `Trip ${
            tripObj?.trip_id ?? tripId
          } was saved successfully. You can start it now.`,
          position: 'bottom', // or 'top'
          visibilityTime: 3000,
        });
      } catch (err: any) {
        await enqueueTrip(body as any);
        Toast.show({
          type: 'success',
          text1: 'Trip Saved Offline 🎉',
          text2: 'Trip moved to upload queue and will auto-submit when online.',
          position: 'bottom', // or 'top'
          visibilityTime: 3000,
        });
        navigation.navigate('FishermanHome');
        processQueue();
      }
    } catch (err: any) {
      Alert.alert(
        'Save failed',
        err?.message || 'Failed to prepare trip payload.',
      );
    }
  });

  /** -------- PATCH (EDIT) -------- */
  const buildPatch = (values: FormValues) => {
    const from = initialValues || values;
    const changed = <T extends keyof FormValues>(key: T) =>
      values[key] !== from[key];

    const tripTypeRaw = values.tripType?.trim() || 'Fishing Trip';
    const trip_type = TRIP_TYPE_MAP[tripTypeRaw] ?? 'fishing';

    const departureDisplay = values.departure_time?.trim();
    const dt = departureDisplay ? parseYmd12h(departureDisplay) : null;
    const departure_date = dt ? formatYmd(dt) : undefined;

    const patch: Record<string, any> = {};
    if (changed('fisherman'))
      patch.fisherman_id = values.fisherman
        ? Number(values.fisherman)
        : undefined;
    if (changed('tripType')) patch.trip_type = trip_type;
    if (changed('tripPurpose'))
      patch.trip_purpose = values.tripPurpose?.trim() || undefined;

    if (changed('captainNameId'))
      patch.captain_name = values.captainNameId?.trim() || undefined;
    if (changed('captainPhone'))
      patch.captain_mobile_no = values.captainPhone?.trim() || undefined;
    if (changed('crewNo')) {
      const n = values.crewNo === '' ? undefined : Number(values.crewNo);
      patch.crew_no = n;
      patch.crew_count = n;
    }
    if (changed('port_clearance_no'))
      patch.port_clearance_no = values.port_clearance_no?.trim() || undefined;
    if (changed('fuel_quantity'))
      patch.fuel_quantity =
        values.fuel_quantity === '' ? undefined : Number(values.fuel_quantity);
    if (changed('ICE'))
      patch.ice_quantity = values.ICE === '' ? undefined : Number(values.ICE);

    if (changed('departure_site'))
      patch.departure_site = values.departure_site || undefined;
    if (changed('departure_port'))
      patch.departure_port = values.departure_port || undefined;
    if (changed('destination_port'))
      patch.destination_port = values.destination_port || undefined;
    if (
      changed('departure_site') ||
      changed('departure_port') ||
      changed('destination_port')
    )
      patch.port_location =
        values.departure_site?.trim() ||
        values.destination_port?.trim() ||
        values.departure_port?.trim() ||
        undefined;

    if (changed('departure_time') && departureDisplay) {
      patch.departure_time = departureDisplay;
      patch.departure_date = departure_date;
    }

    if (changed('boatNameId'))
      patch.boat_registration_number = values.boatNameId?.trim() || undefined;

    if (changed('crewCount')) {
      const n = values.crewCount === '' ? undefined : Number(values.crewCount);
      patch.crew_count = n;
    }

    if (changed('targetSpecies'))
      patch.target_species = values.targetSpecies?.trim() || undefined;
    if (changed('seaType')) patch.sea_type = values.seaType || undefined;
    if (changed('seaConditions'))
      patch.sea_conditions = values.seaConditions || undefined;
    if (changed('emergencyContact'))
      patch.emergency_contact = values.emergencyContact?.trim() || undefined;

    if (changed('tripCost'))
      patch.trip_cost =
        values.tripCost !== '' ? Number(values.tripCost) : undefined;
    if (changed('fuelCost'))
      patch.fuel_cost =
        values.fuelCost !== '' ? Number(values.fuelCost) : undefined;
    if (changed('estimatedCatch'))
      patch.estimated_catch =
        values.estimatedCatch !== ''
          ? Number(values.estimatedCatch)
          : undefined;
    if (changed('equipmentCost')) {
      patch.operational_cost =
        values.equipmentCost !== '' ? Number(values.equipmentCost) : undefined;
      patch.equipment_cost =
        values.equipmentCost !== '' ? Number(values.equipmentCost) : undefined;
    }

    return patch;
  };

  const onSaveEdit = methods.handleSubmit(async values => {
    if (!isEdit || !editingId) return;

    if (values.crewNo !== '') {
      const n = Number(values.crewNo);
      if (Number.isNaN(n) || n < 1 || n > 50) {
        Alert.alert('Invalid crew', 'Crew count must be between 1 and 50.');
        return;
      }
    }

    try {
      const patch = buildPatch(values);
      if (Object.keys(patch).length === 0) {
        Alert.alert('No changes', 'You have not changed anything.');
        return;
      }
      await updateTrip(editingId, patch);
      Alert.alert('Updated', 'Trip changes have been saved.', [
        { text: 'OK', onPress: () => navigation.navigate('FishermanHome') },
      ]);
    } catch (err: any) {
      Alert.alert('Update failed', err?.message || 'Could not update trip.');
    }
  });

  const onSave = isEdit ? onSaveEdit : onSaveCreate;
  const handleSavePress = async () => {
    try {
      setSaving(true);
      await onSave(); // your existing handler returns a Promise
    } finally {
      setSaving(false);
    }
  };

  /** ---- header ---- */
  const headerTitle = isEdit ? 'Edit Trip / ٹرپ ترمیم' : 'Add Trip / ٹرپ بنائیں';
  const chipTripId = isEdit
    ? serverTrip?.trip_name ?? serverTrip?.id ?? ''
    : tripId;

// handleStart (replace your current impl)
const handleStart = useCallback(async () => {
  const online = await isOnline();

  // pk can be a server id (number) or a localId string (when saved offline)
  const pk = createdTrip?.id ?? serverTrip?.id;
  const tripCode =
    createdTrip?.trip_id ??
    serverTrip?.trip_name ??
    (pk != null ? String(pk) : undefined);

  try {
    setActionLoading(true);

    if (online) {
      // server id must be a number to call API directly
      if (typeof pk === 'number') {
        await startTrip(pk);
      } else {
        // created offline but now online: just queue start bound to the create localId
        await enqueueStartTrip({ dependsOnLocalId: String(pk) });
        processQueue();
      }
    } else {
      // offline: enqueue start; it depends on create if pk is local
      if (typeof pk === 'number') {
        await enqueueStartTrip({ serverId: pk });
      } else {
        await enqueueStartTrip({ dependsOnLocalId: String(pk) });
      }
      Toast.show({
        type: 'info',
        text1: 'Starting offline',
        text2: 'Trip will be marked Active when back online.',
      });
    }

    // local-first: go ahead to FishingActivity
    const captain =
      (createdTrip as any)?.captain_name ??
      (serverTrip as any)?.captain_name ??
      methods.getValues('captainNameId') ??
      null;

    const boat =
      serverTrip?.boat_registration_no ??
      (createdTrip as any)?.boat_registration_number ??
      methods.getValues('boatNameId') ??
      null;

    navigation.navigate('FishingActivity', {
      tripId: tripCode ?? pk,
      activityNo: 1,
      meta: { id: pk, trip_id: tripCode ?? pk, captain, boat },
    });
  } catch (e: any) {
    Alert.alert('Error', e?.message || 'Failed to start trip');
  } finally {
    setActionLoading(false);
  }
}, [createdTrip, serverTrip, methods, navigation]);

  const isLocked = !isEdit && !!createdTrip?.id;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: HEADER_BG }}
    >
      <StatusBar
        backgroundColor={HEADER_BG}
        barStyle="light-content"
        translucent={false}
      />

      <View style={[s.page, { flex: 1 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusChip, !isEdit && !gps ? styles.statusWarn : styles.statusOk]}>
                  <Icon 
                    name={!isEdit && !gps ? "location-off" : "location-on"} 
                    size={14} 
                    color={!isEdit && !gps ? "#F59E0B" : "#22C55E"} 
                  />
                  <Text style={[styles.statusText, !isEdit && !gps ? styles.statusWarnText : styles.statusOkText]}>
                    {isEdit
                      ? gps
                        ? 'GPS Ready'
                        : 'GPS Optional'
                      : gps
                      ? 'GPS Ready'
                      : 'GPS Pending'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.tripIdContainer}>
              <View style={styles.tripIdChip}>
                <Icon name="confirmation-number" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.tripIdLabel}>Trip ID:</Text>
                <Text style={styles.tripIdValue}>
                  {String(chipTripId)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* {isLocked && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 12,
              padding: 10,
              borderRadius: 10,
              backgroundColor: '#d43f12ff',
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <Text style={{ color: '#0B1220', fontWeight: '700' }}>
              Trip saved successfully
            </Text>
            <Text style={{ color: '#4B5563' }}>
              Details are locked. You can start the trip now by clicking on start trip button.
            </Text>
          </View>
        )} */}
        {isLocked && <LockNotice visible={isLocked} />}

        {/* Body */}
        {loading ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
            }}
          >
            <Text>Loading trip…</Text>
          </View>
        ) : (
          <ScrollView
            style={s.container}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <FormProvider {...methods}>
              {/* --- Optional lock banner when created --- */}

              {/* --- Lock all sections when created (but keep Start button active) --- */}
              <View
                pointerEvents={isLocked ? 'none' : 'auto'}
                style={{ opacity: isLocked ? 0.6 : 1 }}
              >
                <SectionCard
                  title="Starting Location / ابتدائی مقام"
                  subtitle={
                    isEdit
                      ? 'Optional for edits / ترمیم کے لیے اختیاری'
                      : 'Capture your current coordinates / اپنی موجودہ لوکیشن کیپچر کریں'
                  }
                >
                  <LocationCard
                    gps={gps}
                    loading={gpsLoading}
                    onRecapture={recapture}
                  />
                </SectionCard>

                <SectionCard
                  title="Basic Info / بنیادی معلومات"
                  subtitle="Captain & vessel details / کپتان اور جہاز کی تفصیلات"
                >
                  <BasicInfoSection />
                </SectionCard>

                <SectionCard
                  title="Captain & Crew Info / کپتان اور عملہ کی معلومات"
                  subtitle="Captain & vessel details / کپتان اور جہاز کی تفصیلات"
                >
                  <CaptainInfo />
                </SectionCard>

                <SectionCard title="Fuel & Ice Info / فیول اور آئس معلومات">
                  <FuelIceInformation />
                </SectionCard>

                <SectionCard title="Location Information / مقام کی معلومات">
                  <LocationInformation />
                </SectionCard>

                <SectionCard
                  title="Departure Information / روانگی کی معلومات"
                  subtitle="Port and sea conditions / بندرگاہ اور سمندر کی صورتحال"
                >
                  <DropdownsSection />
                </SectionCard>

                <SectionCard
                  title="Safety & Crew Information / محفوظی اور عملہ کی معلومات"
                  subtitle="Emergency contact and species / ہنگامی رابطہ اور انواع"
                >
                  <ContactSpeciesCostSection />
                </SectionCard>

                <SectionCard
                  title=" Fishing Information / ماہی گیری کی معلومات"
                  subtitle="Target species / ہدف انواع"
                >
                  <FishingInformation />
                </SectionCard>

                {/* Hide SaveBar once created */}
                {!isEdit && !createdTrip?.id ? (
                  <SaveBar
                    gpsAvailable={!!gps}
                    onSave={handleSavePress}
                    loading={saving}
                  />
                ) : null}
              </View>

              {/* Start button stays interactive even when locked */}
            </FormProvider>
          </ScrollView>
        )}
        {/* {!isEdit && createdTrip?.id ? (
          <View style={{ paddingHorizontal: 16, marginTop: 12,marginBottom:10, }}>
            <Pressable
              onPress={handleStart}
              disabled={actionLoading}
              style={({ pressed }) => [
                {
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#1f720d',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: actionLoading ? 0.7 : pressed ? 0.9 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Start Trip"
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {actionLoading ? 'Starting…' : 'Start Trip'}
              </Text>
            </Pressable>
          </View>
        ) : null} */}
        {!isEdit && createdTrip?.id ? (
          <StartTripCTA
            onPress={handleStart}
            disabled={actionLoading}
            loading={actionLoading}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 80,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: HEADER_BG,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  statusContainer: {
    marginLeft: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusOk: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  statusWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusOkText: {
    color: '#22C55E',
  },
  statusWarnText: {
    color: '#F59E0B',
  },
  tripIdContainer: {
    marginTop: 4,
  },
  tripIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
  },
  tripIdLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 6,
    fontWeight: '500',
  },
  tripIdValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 4,
    flexShrink: 1,
  },
});
