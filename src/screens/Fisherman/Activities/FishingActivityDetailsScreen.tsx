/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
  Pressable,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  completeFishingActivity,
  getFishingActivityById,
  type FishingActivityDetails,
} from '../../../services/fishingActivity';
import PALETTE from '../../../theme/palette';
import Toast from 'react-native-toast-message';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FishermanStackParamList } from '../../../app/navigation/stacks/FishermanStack';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';

type Nav = NativeStackNavigationProp<
  FishermanStackParamList,
  'FishingActivityDetails'
>;

type Params = {
  activityId: number | string;
  tripId?: string | number; // legacy fallback
  fallback?: any;
};

const PRIMARY = PALETTE.green700;

function Section({
  title,
  icon,
  children,
}: React.PropsWithChildren<{ title: string; icon: string }>) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name={icon as any} size={16} color={PALETTE.text700} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.grid}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value?: any }) {
  const { width } = useWindowDimensions();
  const twoCol = width >= 720;
  return (
    <View style={[styles.row, twoCol ? styles.rowHalf : styles.rowFull]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? '—'}</Text>
    </View>
  );
}

function n(v?: any) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

export default function FishingActivityDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<any>();
  const { activityId, fallback, tripId }: Params = params || {};
  const [completing, setCompleting] = useState(false);
   const auth = useSelector((s: RootState) => (s as any).auth);
  const authUser = auth?.user;
  console.log('AuthUser in FishermanHome:', authUser);
  const profile = useMemo(
    () => authUser?.profile ?? authUser ?? {},
    [authUser],
  );

  const [data, setData] = useState<FishingActivityDetails | null>(
    fallback ?? null,
  );
  // consider both 'completed' and 'complete', and also label text
  const isCompleted =
    (data?.status && String(data.status).toLowerCase() === 'completed') ||
    (data?.status && String(data.status).toLowerCase() === 'complete') ||
    (data?.status_label &&
      String(data.status_label).toLowerCase() === 'completed');

  const handleComplete = useCallback(async () => {
    if (!data?.id) return;
    try {
      setCompleting(true);
      await completeFishingActivity(data.id);
      Toast.show({
        type: 'success',
        text1: 'Completed ✅',
        text2: 'Activity marked as completed.',
        position: 'top',
      });
      await load(); // refresh UI with updated status
      navigation.replace('AllTrip');
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: e?.message || 'Unable to complete activity.',
        position: 'top',
      });
    } finally {
      setCompleting(false);
    }
  }, [data?.id, load]);
  const [loading, setLoading] = useState(!fallback);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getFishingActivityById(activityId);
      setData(res);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load activity');
      // @ts-ignore
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [activityId, navigation]);

  useEffect(() => {
    if (!fallback) load();
  }, [fallback, load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {data?.activity_id || `Activity #${activityId}`}
          </Text>
          <View style={styles.statusPill}>
            <View
              style={[styles.statusDot, { backgroundColor: PALETTE.info }]}
            />
            <Text style={styles.subtitle}>
              {data?.status_label || data?.status || '—'}
            </Text>
          </View>
        </View>

        {(data?.trip_pk ?? tripId) && (
          <Pressable
            onPress={() =>
              // pass numeric PK back to TripDetails
              // @ts-ignore
              navigation.navigate('TripDetails', {
                id: data?.trip_pk ?? tripId,
              })
            }
            style={styles.headerBtn}
          >
            <MaterialIcons name="directions-boat" size={16} color={PRIMARY} />
            <Text style={styles.headerBtnText}>Back to Trip</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
          {/* Activity Information */}
          <Section title="Activity Information" icon="info">
            <Row label="Activity Number" value={n(data?.activity_number)} />
            <Row label="Date" value={n(data?.activity_date)} />
            <Row label="Netting Time" value={n(data?.time_of_netting)} />
            <Row label="Hauling Time" value={n(data?.time_of_hauling)} />
            <Row label="Activity Time" value={n(data?.activity_time)} />
          </Section>

          {/* Equipment Details */}
          <Section title="Equipment Details" icon="construction">
            {/* <Row
              label="Gear Type"
              value={n(data?.gear_type_label || data?.gear_type)}
            /> */}
            <Row
              label="Mesh Size"
              value={n(data?.mesh_size_label || data?.mesh_size)}
            />
            <Row label="Net Length" value={n(data?.net_length)} />
            <Row label="Net Width" value={n(data?.net_width)} />
            <Row
              label="Location"
              value={
                data?.location_formatted ||
                `${n(data?.gps_latitude)}, ${n(data?.gps_longitude)}`
              }
            />
          </Section>

          {/* Trip Information */}
          <Section title="Trip Information" icon="directions-boat">
            {/* Pretty code from nested trip */}
            <Row label="Trip ID" value={n(data?.trip_id)} />
            {/* <Row label="Boat Name" value={n(data?.boat_name)} />
            <Row
              label="Boat Registration"
              value={n(data?.boat_registration_number)}
            /> */}

            <Row
              label="Fisherman ID"
              value={n(data?.trip_fisherman_id ?? data?.fisherman_id ?? profile.fisherman_id)}
            />
          </Section>

          <Section
            title={`Fish Species (${data?.fish_species?.length || 0})`}
            icon="cruelty-free"
          >
            {data?.fish_species?.length ? (
              <View style={styles.speciesWrap}>
                {data.fish_species.map(s => (
                  <View key={String(s.id)} style={styles.speciesRow}>
                    <MaterialIcons
                      name="directions-boat"
                      size={18}
                      color={PALETTE.text700}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.value]}>
                        {/* LOT-... */}
                        {s.lot_no || `Lot #${s.id}`}
                      </Text>
                      <Text
                        style={{ color: PALETTE.text700, fontWeight: '700' }}
                      >
                        {/* Species — Type — Qty */}
                        {s.species_name ?? '—'} ·{' '}
                        {s.type_label ||
                          (s.type
                            ? s.type.charAt(0).toUpperCase() + s.type.slice(1)
                            : '—')}{' '}
                        · {s.quantity_kg != null ? `${s.quantity_kg} kg` : '—'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: PALETTE.text600, textAlign: 'center' }}>
                No fish species recorded for this activity yet.
              </Text>
            )}
          </Section>

                    {/* Bottom actions (each button on separate row) */}
          <View style={styles.actionsWrap}>
            {/* Hide these when completed */}
            {!isCompleted && (
              <>
                {/* Add Fish Species - First Row */}
                <Pressable
                  style={[
                    styles.primaryBtn,
                    styles.actionBtn,
                    { backgroundColor: PALETTE.info },
                  ]}
                  onPress={() =>
                    // @ts-ignore
                    navigation.navigate('RecordFishSpecies', {
                      activityId: data?.id,
                      activityCode: data?.activity_id,
                      tripCode: data?.trip_id,
                      activityNumber: data?.activity_number ?? null,
                      date: data?.activity_time ?? data?.activity_date ?? null,
                    })
                  }
                >
                  <MaterialIcons
                    name="add-circle-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.primaryBtnText}>Add Fish Species</Text>
                </Pressable>

                {/* Complete Activity - Second Row (only when fish species exist) */}
                {data?.fish_species && data.fish_species.length > 0 && (
                  <Pressable
                    disabled={completing}
                    onPress={handleComplete}
                    style={[
                      styles.primaryBtn,
                      styles.actionBtn,
                      { backgroundColor: PRIMARY },
                      completing && { opacity: 0.7 },
                    ]}
                  >
                    {completing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons
                          name="check-circle"
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.primaryBtnText}>
                          Complete Activity
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}
              </>
            )}

            {/* Back to List - Last Row (always visible) */}
            <Pressable
              style={[styles.hollowBtn, styles.actionBtn]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.hollowBtnText}>Back to List</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* header */
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  iconBtn: { padding: 8, borderRadius: 999 },
  title: { color: '#fff', fontWeight: '800', fontSize: 16 },
  subtitle: { color: '#fff', fontWeight: '800', fontSize: 12 },
  statusPill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  headerBtnText: { color: PRIMARY, fontWeight: '800', fontSize: 12 },

  /* cards */
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontWeight: '800', color: PALETTE.text900, fontSize: 14 },

  /* grid rows */
  grid: { marginTop: 10, gap: 10, flexDirection: 'row', flexWrap: 'wrap' },
  row: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowFull: { width: '100%' },
  rowHalf: { width: '48%' },
  label: {
    color: PALETTE.text600,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '700',
  },
  value: { color: PALETTE.text900, fontWeight: '800' },

  speciesWrap: { gap: 8, width: '100%' },
  speciesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    padding: 10,
    width: '100%',
  },

  /* actions */
  actionsWrap: {
    flexDirection: 'column',
    gap: 16,
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  actionBtn: {
    width: '100%',
    minHeight: 56,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: { 
    color: '#fff', 
    fontWeight: '800',
    fontSize: 16,
  },
  hollowBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PALETTE.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  hollowBtnText: { 
    color: PALETTE.text900, 
    fontWeight: '800',
    fontSize: 16,
  },
});
