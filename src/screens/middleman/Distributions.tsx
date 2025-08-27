import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
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

const dummyDistribution = [
  {
    id: '1',
    name: 'DIST-1',
    status: 'Pending',
    trip: 'Trip11',
    fisherman: 'Ali',
    weight: 50,
    date: '20/August/2025',
  },
  {
    id: '2',
    name: 'DIST-2',
    status: 'Verified',
    trip: 'Trip12',
    fisherman: 'Faraz',
    weight: 150,
    date: '22/August/2025',
  },
  {
    id: '3',
    name: 'DIST-3',
    status: 'Rejected',
    trip: 'Trip13',
    fisherman: 'John',
    weight: 30,
    date: '19/August/2025',
  },
  {
    id: '4',
    name: 'DIST-4',
    status: 'Verified',
    trip: 'Trip14',
    fisherman: 'Doe',
    weight: 25,
    date: '01/August/2025',
  },
  {
    id: '5',
    name: 'DIST-5',
    status: 'Verified',
    trip: 'Trip15',
    fisherman: 'Behroz',
    weight: 76,
    date: '21/August/2025',
  },
  {
    id: '6',
    name: 'DIST-6',
    status: 'Pending',
    trip: 'Trip16',
    fisherman: 'Khan',
    weight: 265,
    date: '29/August/2025',
  },
  {
    id: '7',
    name: 'DIST-7',
    status: 'Rejected',
    trip: 'Trip17',
    fisherman: 'Niazi',
    weight: 65,
    date: '18/August/2025',
  },
  {
    id: '8',
    name: 'DIST-8',
    status: 'Verified',
    trip: 'Trip18',
    fisherman: 'Sher',
    weight: 29,
    date: '11/August/2025',
  },
];

export default function Distributions() {
  const navigation = useNavigation<Nav>();

  const [trip, setTrip] = useState(null);
  const [status, setStatus] = useState(null);
  const [middleMan, setMiddleMan] = useState(null);

  const [date, setDate] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());

  const [showPicker, setShowPicker] = useState(false);
  const [showPickerTo, setShowPickerTo] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  const onChangeDateTo = (eventTo, selectedDateTo) => {
    setShowPickerTo(false);
    if (selectedDateTo) {
      setDateTo(selectedDateTo);
    }
  };

  const renderItem = ({ item }) => {
    const statusColor =
      item.status === 'Verified'
        ? '#d3be00ff'
        : item.status === 'Pending'
        ? '#ff9800'
        : '#e31305ff';

    return (
      <TouchableOpacity onPress={()=>{navigation.navigate("distributionDetails")}}>
        <View style={styles.itemContainer}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusBadgeText}>{item.status}</Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Trip:</Text>
            <Text style={styles.itemValue}>{item.trip}</Text>
          </View>
          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Fisherman:</Text>
            <Text style={styles.itemValue}>{item.fisherman}</Text>
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

  return (
    <ScrollView style={styles.container}>
      {/* Filters */}
      <View style={styles.cardFilter}>
        <Text style={styles.headerText}>Filter Distributions</Text>
        {/* Trip */}
        <View style={styles.dropdownRow}>
          <Text style={styles.label}>Trip</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownText}
            data={Trip}
            search
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Select Trip"
            searchPlaceholder="Search..."
            value={trip}
            onChange={item => setTrip(item.value)}
          />
        </View>

        {/* Status */}
        <View style={styles.dropdownRow}>
          <Text style={styles.label}>Status</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownText}
            data={Status}
            search
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Select Status"
            searchPlaceholder="Search..."
            value={status}
            onChange={item => setStatus(item.value)}
          />
        </View>

        {/* Middle Man */}
        <View style={styles.dropdownRow}>
          <Text style={styles.label}>Middle Man</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownText}
            data={MiddleMen}
            search
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Select Middle Man"
            searchPlaceholder="Search..."
            value={middleMan}
            onChange={item => setMiddleMan(item.value)}
          />
        </View>

        {/* Date From */}
        <View style={styles.dropdownRow}>
          <Text style={styles.label}>Date From</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}
        </View>

        {/* Date To */}
        <View style={styles.dropdownRow}>
          <Text style={styles.label}>Date To</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowPickerTo(true)}
          >
            <Text style={styles.dateText}>{dateTo.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showPickerTo && (
            <DateTimePicker
              value={dateTo}
              mode="date"
              display="default"
              onChange={onChangeDateTo}
            />
          )}
        </View>
        <View style={styles.filterButtons}>
          <TouchableOpacity style={styles.applyFilterButton}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              🔍 Apply Filters
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearFilterButton}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              ✖️ Clear Filters
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Distributions List */}
      <View style={styles.flatlistContainer}>
        <Text style={styles.listHeader}>All Distributions</Text>
        <FlatList
          data={dummyDistribution}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  cardFilter: {
    backgroundColor: '#e5ede4ff',
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
    padding: 10,
    borderRadius: 20,
  },
  clearFilterButton: {
    backgroundColor: '#828282ff',
    padding: 10,
    borderRadius: 20,
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
    backgroundColor: '#e5ede4ff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  itemValue: {
    fontSize: 14,
    color: '#333',
  },
});
