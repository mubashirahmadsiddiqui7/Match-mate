import React, { useState, useEffect } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MiddleManStackParamList } from '../../app/navigation/stacks/MiddleManStack';

type Nav = NativeStackNavigationProp<MiddleManStackParamList, 'MiddleManHome'>;

const Trip = [
  { label: 'All Trips', value: 'All Trips' },
  { label: 'Dummy Trip 1', value: 'Dummy Trip 1' },
];

const Status = [
  { label: 'All Status', value: 'All Status' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Verified', value: 'Verified' },
  { label: 'Rejected', value: 'Rejected' },
];

const MiddleMen = [
  { label: 'All Middle Men', value: 'All Middle Men' },
  { label: 'Middle Man 1', value: 'Middle Man 1' },
];

export default function Distributions() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<Nav>();

  const [trip, setTrip] = useState(null);
  const [status, setStatus] = useState(null);
  const [middleMan, setMiddleMan] = useState(null);

  const [date, setDate] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());

  const [showPicker, setShowPicker] = useState(false);
  const [showPickerTo, setShowPickerTo] = useState(false);

  useEffect(() => {
    const URL = 'https://fakestoreapi.com/products';
    fetch(URL)
      .then(res => res.json())
      .then(data => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  const onChangeDate = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };
  const onChangeDateTo = (eventTo, selectedDateTo) => {
    setShowPickerTo(false);
    if (selectedDateTo) setDateTo(selectedDateTo);
  };

  const renderItem = ({ item }) => {
    const statusColor =
      item.status === 'Verified'
        ? '#35d300ff'
        : item.status === 'Pending'
        ? '#ff9800'
        : '#e31305ff';

    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={() => navigation.navigate('distributionDetails')}
        activeOpacity={0.85}
      >
        <View style={styles.itemContainer}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusBadgeText}>{item.price}</Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Trip:</Text>
            <Text style={styles.itemValue}>{item.category}</Text>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Fisherman:</Text>
            <Text style={styles.itemValue} numberOfLines={2}>{item.description}</Text>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Weight:</Text>
            <Text style={styles.itemValue}>{item.weight} kg</Text>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Date:</Text>
            <Text style={styles.itemValue}>{item.date}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.activityContainer}>
        <ActivityIndicator size="large" color="#07890bff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Filters */}
      <View style={styles.cardFilter}>
        <Text style={styles.headerText}>Filter Distributions</Text>

        {/* Trip */}
        <FilterDropdown label="Trip" data={Trip} value={trip} onChange={setTrip} />

        {/* Status */}
        <FilterDropdown label="Status" data={Status} value={status} onChange={setStatus} />

        {/* Middle Man */}
        <FilterDropdown label="Middle Man" data={MiddleMen} value={middleMan} onChange={setMiddleMan} />

        {/* Date From */}
        <View style={styles.dropdownRow}>
          <Text style={styles.label}>Date From</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
            <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />
          )}
        </View>

        {/* Date To */}
        <View style={styles.dropdownRow}>
          <Text style={styles.label}>Date To</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowPickerTo(true)}>
            <Text style={styles.dateText}>{dateTo.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showPickerTo && (
            <DateTimePicker value={dateTo} mode="date" display="default" onChange={onChangeDateTo} />
          )}
        </View>

        {/* Buttons */}
        <View style={styles.filterButtons}>
          <TouchableOpacity style={styles.applyFilterButton}>
            <Text style={styles.filterBtnText}>🔍 Apply Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearFilterButton}>
            <Text style={styles.filterBtnText}>✖️ Clear Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Distributions List */}
      <View style={styles.flatlistContainer}>
        <Text style={styles.listHeader}>All Distributions</Text>
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

// --- Reusable Dropdown ---
const FilterDropdown = ({ label, data, value, onChange }) => (
  <View style={styles.dropdownRow}>
    <Text style={styles.label}>{label}</Text>
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
  cardFilter: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    width: '25%',
    fontSize: 16,
    color: '#444',
  },
  dropdown: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dropdownPlaceholder: {
    color: '#999',
    fontSize: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  dateButton: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  applyFilterButton: {
    backgroundColor: '#368a33ff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  clearFilterButton: {
    backgroundColor: '#828282ff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  filterBtnText:{
    fontWeight:'bold',
    color:'#fff'
  },
  flatlistContainer: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#222',
  },
  itemContainer: {
    backgroundColor: '#f4f8f4',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemTitle: {
    flex: 1,
    marginRight: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    maxWidth: '40%',
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    width: 90,
  },
  itemValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  activityContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
