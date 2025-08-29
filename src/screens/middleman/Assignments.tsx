import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MiddleManStackParamList } from '../../app/navigation/stacks/MiddleManStack';

// --- Types ---
type Nav = NativeStackNavigationProp<MiddleManStackParamList, 'MiddleManHome'>;

// --- Dropdown Data ---
const Status = [
  { label: 'All Status', value: 'All Status' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

const Company = [
  { label: 'All Companies', value: 'All Companies' },
  { label: 'Ali & sons', value: 'Ali & sons' },
  { label: 'Bashir co.', value: 'Bashir co.' },
];

const MiddleMen = [
  { label: 'All Middle Men', value: 'All Middle Men' },
  { label: 'Middle Man 1', value: 'Middle Man 1' },
];

export default function Assignments() {
  const navigation = useNavigation<Nav>();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [middleMan, setMiddleMan] = useState<string | null>(null);

  // --- Fetch API ---
  const getProducts = useCallback(() => {
    const URL = 'https://fakestoreapi.com/products';
    setLoading(true);
    fetch(URL)
      .then(res => res.json())
      .then(data => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getProducts();
  }, [getProducts]);

  // --- Render List Item ---
  const renderItem = ({ item }: { item: any }) => {
    const statusColor =
      item.status === 'Active'
        ? '#35d300ff'
        : item.status === 'Inactive'
        ? '#e31305ff'
        : '#ff9800';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('distributionDetails')}
        activeOpacity={0.8}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>{item.price}</Text>
            </View>
          </View>

          {/* Info Rows */}
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Company:</Text>
            <Text style={styles.cardValue}>{item.category}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Address:</Text>
            <Text style={styles.cardValue} numberOfLines={2}>
              {item.description}
            </Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Phone:</Text>
            <Text style={styles.cardValue}>{item.weight}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Status:</Text>
            <Text style={styles.cardValue}>{item.date}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // --- Loader ---
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#07890bff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Filters */}
      <View style={styles.filterCard}>
        <Text style={styles.filterHeader}>Filter Assignments</Text>

        {/* Status */}
        <FilterDropdown label="Status" data={Status} value={status} onChange={setStatus} />

        {/* Company */}
        <FilterDropdown label="Company" data={Company} value={company} onChange={setCompany} />

        {/* Middle Man */}
        <FilterDropdown label="Middle Man" data={MiddleMen} value={middleMan} onChange={setMiddleMan} />

        {/* Buttons */}
        <View style={styles.filterButtons}>
          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.btnText}>🔍 Apply Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearBtn}>
            <Text style={styles.btnText}>✖️ Clear Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <View style={styles.listCard}>
        <Text style={styles.listHeader}>All Assigned Companies</Text>
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </View>
    </ScrollView>
  );
}

// --- Reusable Dropdown Component ---
const FilterDropdown = ({ label, data, value, onChange }: any) => (
  <View style={styles.dropdownRow}>
    <Text style={styles.dropdownLabel}>{label}</Text>
    <Dropdown
      style={styles.dropdown}
      placeholderStyle={styles.dropdownPlaceholder}
      selectedTextStyle={styles.dropdownText}
      data={data}
      search
      maxHeight={200}
      labelField="label"
      valueField="value"
      placeholder={`Select ${label}`}
      searchPlaceholder="Search..."
      value={value}
      onChange={item => onChange(item.value)}
    />
  </View>
);

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Filter Section ---
  filterCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  filterHeader: {
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
    color: '#2a2a2a',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dropdownLabel: {
    width: '28%',
    fontSize: 15,
    fontWeight: '500',
    color: '#444',
  },
  dropdown: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dropdownPlaceholder: {
    color: '#aaa',
    fontSize: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: '#222',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  applyBtn: {
    backgroundColor: '#368a33ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  clearBtn: {
    backgroundColor: '#828282ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // --- List Section ---
  listCard: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    color: '#222',
  },

  // --- Card ---
  card: {
    backgroundColor: '#f4f8f4',
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    width: '35%',
  },
  cardValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
});
