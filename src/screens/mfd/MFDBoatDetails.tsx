import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import { fetchBoatById, type Boat, getStatusColor, getStatusText } from '../../services/boats';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';

type Nav = NativeStackNavigationProp<MFDStackParamList>;
type Route = RouteProp<MFDStackParamList, 'BoatDetails'>;


const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={20} color={PALETTE.green700} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

export default function MFDBoatDetails() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { boatId } = route.params;

  const [loading, setLoading] = useState(true);
  const [boat, setBoat] = useState<Boat | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading boat with ID:', boatId);
      const boatData = await fetchBoatById(boatId);
      console.log('Boat data loaded:', boatData);
      console.log('Registration number:', boatData?.registration_number);
      console.log('Owner name:', boatData?.owner?.name);
      console.log('Boat name:', boatData?.name);
      setBoat(boatData);
    } catch (error) {
      console.error('Error loading boat:', error);
    } finally {
      setLoading(false);
    }
  }, [boatId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={PALETTE.green700} />
        <Text style={{ marginTop: 16, fontSize: 16, color: PALETTE.text600 }}>
          Loading boat details...
        </Text>
      </SafeAreaView>
    );
  }

  if (!boat) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: PALETTE.text600 }}>Boat not found</Text>
        <Text style={{ fontSize: 14, color: PALETTE.text400, marginTop: 8 }}>
          Boat ID: {boatId}
        </Text>
      </SafeAreaView>
    );
  }

  console.log('Rendering boat details for:', boat.registration_number);
  console.log('Boat owner:', boat.owner?.name);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}>
          <Icon name="arrow-back" size={20} color="white" />
          <Text style={styles.backButtonText}>Back to Boats</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Boat Header */}
        <View style={styles.boatHeader}>
          <Text style={styles.boatName}>Boat {boat.registration_number}</Text>
          <View style={[styles.statusPill, { backgroundColor: getStatusColor(boat.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(boat.status) }]}>
              {getStatusText(boat.status)}
          </Text>
        </View>
      </View>

        {/* Basic Boat Information */}
        <Section title="Basic Boat Information" icon="info">
          <View style={styles.row}>
            <Icon name="confirmation-number" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Registration Number</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.registration_number}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="directions_boat" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Name</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.name}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="person" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Owner</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.owner.name}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="category" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Type</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.type}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="straighten" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Length (m)</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.length_m}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="straighten" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Width (m)</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.width_m}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="group" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Crew Capacity</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.capacity_crew}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="scale" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Weight Capacity (kg)</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.capacity_weight_kg || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="calendar-today" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Year Built</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.year_built}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="location-on" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Home Port</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.home_port || '—'}</Text>
          </View>
        </Section>

        {/* Technical Specifications */}
        <Section title="Technical Specifications" icon="settings">
          <View style={styles.row}>
            <Icon name="speed" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Engine Power</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.engine_power}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="straighten" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Boat Size</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.boat_size}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="scale" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Boat Capacity</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.boat_capacity}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="inventory" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Fish Holds</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.number_of_fish_holds || '—'}</Text>
          </View>
        </Section>

        {/* Equipment & Safety */}
        <Section title="Equipment & Safety" icon="build">
          <View style={styles.row}>
            <Icon name="fishing" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Fishing Equipment</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.fishing_equipment || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="security" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Safety Equipment</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.safety_equipment || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="verified" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Insurance Info</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.insurance_info || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="description" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>License Info</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.license_info || '—'}</Text>
          </View>
        </Section>

        {/* Owner Information */}
          <Section title="Owner Information" icon="person">
          <View style={styles.row}>
            <Icon name="person" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Full Name</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.owner.name}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="email" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Email</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.owner.email}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="phone" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Phone</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.owner.phone || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="location-on" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Fishing Zone</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.owner.fishing_zone || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="location-city" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Port Location</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.owner.port_location || '—'}</Text>
          </View>
          </Section>

        {/* Additional Information */}
        <Section title="Additional Information" icon="notes">
          <View style={styles.row}>
            <Icon name="description" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Notes</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{boat.notes || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="calendar-today" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Created</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{new Date(boat.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="update" size={18} color={PALETTE.green700} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Last Updated</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{new Date(boat.updated_at).toLocaleDateString()}</Text>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: PALETTE.green700,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    color: 'white',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  boatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  boatName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PALETTE.text700,
  },
  statusPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text700,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  rowLabel: {
    fontSize: 14,
    color: PALETTE.text600,
    minWidth: 120,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text700,
    textAlign: 'right',
    flex: 1,
  },
});