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
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import PALETTE from '../../../theme/palette';
import { createFishSpecies } from '../../../services/fishSpecies';
import { isOnline } from '../../../offline/net';
import { enqueueCreateSpecies } from '../../../offline/TripQueues';
import { buildLotNo, generateLocalId } from '../../../utils/ids';

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
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon as any} size={20} color={PRIMARY} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
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

    try {
      setSubmitting(true);
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
        // Offline mode - generate local IDs and enqueue
        const lotNumber = buildLotNo();
        const localSpeciesId = generateLocalId('SPECIES');
        
        // Determine if we have server IDs or local IDs
        const activityServerId = typeof activityId === 'number' ? activityId : undefined;
        const activityLocalId = typeof activityId === 'string' ? String(activityId) : undefined;

        // Enqueue the species creation
        await enqueueCreateSpecies(speciesBody as any, {
          activityServerId,
          activityLocalId,
        });

        Toast.show({
          type: 'success',
          text1: 'Saved Offline 🎉',
          text2: `Species recorded with lot ${lotNumber}. Will sync when online.`,
          position: 'top',
          visibilityTime: 3000,
        });

        // Go back to details (it will show pending list)
        // @ts-ignore
        navigation.replace('FishingActivityDetails', {
          activityId,
          tripId: tripCode,
        });
        return;
      }

      // Online mode
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
        visibilityTime: 2500,
      });

      // Go back to the details screen for this activity
      // @ts-ignore
      navigation.replace('FishingActivityDetails', { 
        activityId,
        tripId: tripCode 
      });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: e?.message || 'Unable to record fish species.',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Record Fish Species</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Context Info */}
        <View style={styles.contextCard}>
          <Text style={styles.contextTitle}>Activity Context</Text>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Trip:</Text>
            <Text style={styles.contextValue}>{tripCode || 'N/A'}</Text>
          </View>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Activity:</Text>
            <Text style={styles.contextValue}>
              {activityCode || `#${activityNumber || 'N/A'}`}
            </Text>
          </View>
          {date && (
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Date:</Text>
              <Text style={styles.contextValue}>{date}</Text>
            </View>
          )}
        </View>

        {/* Species Information */}
        <Section title="Species Details" icon="set-meal">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Species Name *</Text>
            <TextInput
              style={styles.input}
              value={species}
              onChangeText={setSpecies}
              placeholder="e.g., Tuna, Mackerel, Snapper"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity (kg) *</Text>
            <TextInput
              style={styles.input}
              value={qty}
              onChangeText={setQty}
              placeholder="0.0"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type *</Text>
            <View style={styles.typeButtons}>
              <Pressable
                onPress={() => setType('catch')}
                style={[
                  styles.typeButton,
                  type === 'catch' && styles.typeButtonActive,
                ]}
              >
                <MaterialIcons
                  name="sailing"
                  size={18}
                  color={type === 'catch' ? '#fff' : PRIMARY}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'catch' && styles.typeButtonTextActive,
                  ]}
                >
                  Catch
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setType('discard')}
                style={[
                  styles.typeButton,
                  type === 'discard' && styles.typeButtonActive,
                ]}
              >
                <MaterialIcons
                  name="delete"
                  size={18}
                  color={type === 'discard' ? '#fff' : PRIMARY}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'discard' && styles.typeButtonTextActive,
                  ]}
                >
                  Discard
                </Text>
              </Pressable>
            </View>
          </View>
        </Section>

        {/* Quality & Notes */}
        <Section title="Quality & Notes" icon="grade">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Grade (Optional)</Text>
            <TextInput
              style={styles.input}
              value={grade}
              onChangeText={setGrade}
              placeholder="e.g., A, B, Premium, Standard"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes about this species..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </Section>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          {/* Debug Validation Status */}
          {/* <View style={{ 
            backgroundColor: '#f3f4f6', 
            padding: 12, 
            borderRadius: 8, 
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#d1d5db'
          }}>
            <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
              Debug: Species="{species}" | Type="{type}" | Qty="{qty}" | Valid={isValid ? 'true' : 'false'}
            </Text>
          </View> */}
          
          <Pressable
            onPress={onSubmit}
            disabled={!isValid || submitting}
            style={[
              styles.submitButton,
              !isValid && styles.submitButtonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Record Fish Species</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  contextCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  contextValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#374151',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: PRIMARY,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: PRIMARY,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  submitContainer: {
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
