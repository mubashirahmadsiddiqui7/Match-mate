/* eslint-disable react-native/no-inline-styles */
import React, { JSX, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import PALETTE from '../../../theme/palette';
import { createFishSpecies } from '../../../services/fishSpecies';
import { isOnline } from '../../../offline/net';
import { enqueueCreateSpecies } from '../../../offline/TripQueues';

type Params = {
  activityId: number | string;
  activityCode?: string | null; // "ACT-..."
  tripCode?: string | null; // "TRIP-..."
  activityNumber?: number | null;
  date?: string | null;
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
      <View style={{ marginTop: 10, gap: 10 }}>{children}</View>
    </View>
  );
}

export default function RecordFishSpeciesScreen(): JSX.Element {
  const navigation = useNavigation();
  const { params } = useRoute<any>();
  const { activityId, activityCode, tripCode, activityNumber, date }: Params =
    params || {};

  const { width } = useWindowDimensions();
  const twoCol = width >= 720;

  const [species, setSpecies] = useState('');
  const [qty, setQty] = useState('');
  const [type, setType] = useState<'catch' | 'discard' | ''>('');
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = useMemo(() => {
    const q = Number(qty);
    return species.trim().length > 0 && !!type && !Number.isNaN(q) && q > 0;
  }, [species, qty, type]);

  async function onSubmit() {
    if (!isValid) {
      Toast.show({
        type: 'error',
        text1: 'Missing info',
        text2: 'Species, Type and Quantity (kg) are required.',
        position: 'top',
      });
      return;
    }
    const online = await isOnline();
    const speciesBody = {
      activity_code: activityCode ?? undefined,
      trip_code: tripCode ?? undefined,
      species_name: species.trim(),
      quantity_kg: Number(qty),
      type: type as 'catch' | 'discard',
      grade: grade.trim() ? grade.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
    };

    if (!online) {
      // activityId could be local (string) or server (number)
      const activityServerId =
        typeof activityId === 'number' ? activityId : undefined;
      const activityLocalId =
        typeof activityId === 'string' ? String(activityId) : undefined;

      await enqueueCreateSpecies(speciesBody as any, {
        activityServerId,
        activityLocalId,
      });
      Toast.show({
        type: 'success',
        text1: 'Saved Offline 🎉',
        text2: 'Species will sync later.',
        position: 'top',
      });
      // Go back to details (it will show pending list)
      // @ts-ignore
      navigation.replace('FishingActivityDetails', {
        activityId,
        tripId: tripCode,
      });
      return;
    }
    try {
      setSubmitting(true);
      await createFishSpecies(activityId, {
        activity_code: activityCode ?? undefined,
        trip_code: tripCode ?? undefined,
        species_name: species.trim(),
        quantity_kg: Number(qty),
        type: type as 'catch' | 'discard',
        grade: grade.trim() ? grade.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      });

      Toast.show({
        type: 'success',
        text1: 'Saved 🎉',
        text2: 'Fish species recorded successfully.',
        position: 'top',
      });

      // Go back to the details screen for this activity
      // @ts-ignore
      navigation.replace('FishingActivityDetails', { activityId });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: e?.message || 'Unable to record fish species.',
        position: 'top',
      });
    } finally {
      setSubmitting(false);
    }
  }

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
            Record Fish Species
          </Text>
          <Text style={styles.subtitle}>
            Add fish species details to your fishing activity
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {/* Selected Activity Info */}
        <View style={[styles.infoBanner]}>
          <MaterialIcons name="info" size={16} color={PALETTE.info} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.infoLine}>
              <Text style={styles.infoLabel}>Activity ID: </Text>
              {activityCode || '—'}
            </Text>
            <Text style={styles.infoLine}>
              <Text style={styles.infoLabel}>Trip ID: </Text>
              {tripCode || '—'}
            </Text>
            <Text style={styles.infoLine}>
              <Text style={styles.infoLabel}>Activity Number: </Text>
              {activityNumber ?? '—'}
            </Text>
            <Text style={styles.infoLine}>
              <Text style={styles.infoLabel}>Date: </Text>
              {date ?? '—'}
            </Text>
          </View>
        </View>

        {/* Activity Selection (locked) */}
        <Section title="Activity Selection" icon="link">
          <View style={[styles.inputRow, { opacity: 0.6 }]}>
            <TextInput
              editable={false}
              value={
                activityCode && tripCode
                  ? `${activityCode} - ${tripCode}`
                  : String(activityId)
              }
              style={[styles.input, { flex: 1 }]}
            />
            <MaterialIcons name="lock" size={16} color={PALETTE.text600} />
          </View>
          <Text style={styles.hint}>
            Activity is pre-selected and cannot be changed
          </Text>
        </Section>

        {/* Species Information */}
        <Section title="Species Information" icon="cruelty-free">
          <View style={[styles.grid, { gap: 10 }]}>
            <View style={[twoCol ? styles.colHalf : styles.colFull]}>
              <Text style={styles.label}>Species Name *</Text>
              <TextInput
                placeholder="e.g., Tuna, Mackerel, Shrimp"
                placeholderTextColor={PALETTE.text500}
                value={species}
                onChangeText={setSpecies}
                style={styles.input}
              />
              <Text style={styles.hint}>
                Enter the name of the fish species
              </Text>
            </View>

            <View style={[twoCol ? styles.colHalf : styles.colFull]}>
              <Text style={styles.label}>Quantity *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="e.g., 25.5"
                  placeholderTextColor={PALETTE.text500}
                  value={qty}
                  keyboardType="decimal-pad"
                  onChangeText={setQty}
                  style={[styles.input, { flex: 1 }]}
                />
                <Text style={styles.suffix}>KG</Text>
              </View>
            </View>
          </View>
        </Section>

        {/* Classification */}
        <Section title="Classification" icon="category">
          <View style={[styles.grid, { gap: 10 }]}>
            <View style={[twoCol ? styles.colHalf : styles.colFull]}>
              <Text style={styles.label}>Type *</Text>
              <View style={styles.pillRow}>
                <Pressable
                  onPress={() => setType('catch')}
                  style={[styles.pill, type === 'catch' && styles.pillActive]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      type === 'catch' && styles.pillTextActive,
                    ]}
                  >
                    Catch
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setType('discard')}
                  style={[styles.pill, type === 'discard' && styles.pillActive]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      type === 'discard' && styles.pillTextActive,
                    ]}
                  >
                    Discard
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.hint}>
                Whether this is catch fish or discard
              </Text>
            </View>

            <View style={[twoCol ? styles.colHalf : styles.colFull]}>
              <Text style={styles.label}>Grade</Text>
              <TextInput
                placeholder="Select Grade or type (optional)"
                placeholderTextColor={PALETTE.text500}
                value={grade}
                onChangeText={setGrade}
                style={styles.input}
              />
              <Text style={styles.hint}>
                Quality grade of the fish (optional)
              </Text>
            </View>
          </View>
        </Section>

        {/* Additional Information */}
        <Section title="Additional Information" icon="notes">
          <Text style={styles.label}>Notes</Text>
          <TextInput
            placeholder="Any additional notes about this fish species..."
            placeholderTextColor={PALETTE.text500}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.input, { minHeight: 120 }]}
          />
          <Text style={styles.hint}>
            Optional notes about the fish species, condition, or observations
          </Text>
        </Section>

        {/* Bottom actions */}
        <View style={styles.actionsWrap}>
          <Pressable
            disabled={submitting || !isValid}
            onPress={onSubmit}
            style={[
              styles.primaryBtn,
              { backgroundColor: PRIMARY },
              (submitting || !isValid) && { opacity: 0.7 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="save" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Record Fish Species</Text>
              </>
            )}
          </Pressable>

          <Pressable
            disabled={submitting}
            onPress={() => navigation.goBack()}
            style={[styles.hollowBtn]}
          >
            <Text style={styles.hollowBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* header */
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  iconBtn: { padding: 8, borderRadius: 999 },
  title: { color: '#fff', fontWeight: '800', fontSize: 16 },
  subtitle: { color: '#fff', opacity: 0.9, marginTop: 2, fontSize: 12 },

  /* banner */
  infoBanner: {
    borderWidth: 1,
    borderColor: '#B7DCF7',
    backgroundColor: '#E7F4FF',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoLine: { color: PALETTE.text900, fontWeight: '700' },
  infoLabel: { color: PALETTE.text600, fontWeight: '700' },

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

  /* grid & columns */
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  colFull: { width: '100%' },
  colHalf: { width: '48%' },

  /* inputs */
  label: {
    color: PALETTE.text600,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '700',
  },
  hint: { color: PALETTE.text600, fontSize: 11, marginTop: 6 },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: PALETTE.text900,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 8,
  },
  suffix: { color: PALETTE.text600, fontWeight: '800', marginLeft: 6 },

  /* pills */
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#fff',
  },
  pillActive: { backgroundColor: '#E7F4FF', borderColor: '#B7DCF7' },
  pillText: { color: PALETTE.text900, fontWeight: '800' },
  pillTextActive: { color: PALETTE.info },

  /* actions */
  actionsWrap: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexGrow: 1,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  hollowBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  hollowBtnText: { color: PALETTE.text900, fontWeight: '800' },
});
