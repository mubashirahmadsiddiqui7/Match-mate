import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  FlatList,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';

const statuses = [
  { label: 'All Statuses', value: 'All Statuses' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Active', value: 'Active' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
];
const fishingZones = [
  { label: 'All Zones', value: 'All Zones' },
  { label: 'Zone A - Coastal', value: 'Zone A - Coastal' },
  { label: 'Zone B - Offshore', value: 'Zone B - Offshore' },
  { label: 'Zone C - Deep Sea', value: 'Zone C - Deep Sea' },
  { label: 'Zone D - Protected', value: 'Zone D - Protected' },
  { label: 'Zone E - International', value: 'Zone E - International' },
];
const ports = [
  { label: 'All Ports', value: 'All Ports' },
  { label: 'Karachi Port', value: 'Karachi Port' },
  { label: 'Gwadar Port', value: 'Gwadar Port' },
  { label: 'Port Qasim', value: 'Port Qasim' },
  { label: 'Ormara Port', value: 'Ormara Port' },
  { label: 'Pasni Port', value: 'Pasni Port' },
  { label: 'Jiwani Port', value: 'Jiwani Port' },
];
const sort = [
  { label: 'Created Date', value: 'Created Date' },
  { label: 'Departure Time', value: 'Departure Time' },
  { label: 'Trip ID', value: 'Trip ID' },
  { label: 'Status', value: 'Status' },
];
const order = [
  { label: 'Ascending', value: 'Ascending' },
  { label: 'Descending', value: 'Descending' },
];

const trips = [
  {
    id: '1',
    tripId: 'TRIP-001',
    boat: 'Boat A',
    port: 'Karachi Port',
    status: 'Active',
    departureDate: '20 Aug 2025',
  },
  {
    id: '2',
    tripId: 'TRIP-002',
    boat: 'Boat B',
    port: 'Gwadar Port',
    status: 'Completed',
    departureDate: '17 Aug 2025',
  },
  {
    id: '3',
    tripId: 'TRIP-003',
    boat: 'Boat C',
    port: 'Pasni Port',
    status: 'Pending Approval',
    departureDate: '21 Aug 2025',
  },
];

export default function AllTrips() {
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);
  const [text, setText] = useState('Empty');

  const onChange = (event: any, selectedDate: Date) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);

    let tempDate = new Date(currentDate);
    let fDate =
      tempDate.getDate() +
      '/' +
      (tempDate.getMonth() + 1) +
      '/' +
      tempDate.getFullYear();
    setText(fDate);
  };
  const showMode = (currentMode: React.SetStateAction<string>) => {
    setShow(true);
    setMode(currentMode);
  };

  const [date1, setDate1] = useState(new Date());
  const [mode1, setMode1] = useState('date');
  const [show1, setShow1] = useState(false);
  const [text1, setText1] = useState('Empty');

  const onChange1 = (event1: any, selectedDate1: Date) => {
    const currentDate1 = selectedDate1 || date;
    setShow1(Platform.OS === 'ios');
    setDate1(currentDate1);

    let tempDate = new Date(currentDate1);
    let fDate =
      tempDate.getDate() +
      '/' +
      (tempDate.getMonth() + 1) +
      '/' +
      tempDate.getFullYear();
    setText1(fDate);
  };
  const showMode1 = (currentMode1: React.SetStateAction<string>) => {
    setShow1(true);
    setMode1(currentMode1);
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.cards}>
        <Text style={{ color: 'green', fontWeight: 'bold', fontSize: 22 }}>
          Trip Management
        </Text>
        <Text>Manage and monitor all fishing trips</Text>
      </View>
      <View style={styles.cards}>
        <View style={styles.boxes}>
          <Text>0</Text>
          <Text>Total Trips</Text>
        </View>
        <View style={styles.boxes}>
          <Text>0</Text>
          <Text>Pending Approval</Text>
        </View>
        <View style={styles.boxes}>
          <Text>0</Text>
          <Text>Active Trips</Text>
        </View>
        <View style={styles.boxes}>
          <Text>0</Text>
          <Text>Completed</Text>
        </View>
        <View style={styles.boxes}>
          <Text>0</Text>
          <Text>Cancelled</Text>
        </View>
      </View>

      <View style={styles.cards}>
        <Text style={{ color: 'green', fontWeight: 'bold', fontSize: 18 }}>
          Filter Trips
        </Text>
        <View style={styles.boxes}>
          <Text>Search</Text>
          <View style={{ backgroundColor: '#fafafaff', borderRadius: 12 }}>
            <TextInput
              placeholder="Trip ID, Boat, Port..."
              placeholderTextColor="#8f8f8fff"
            />
          </View>
        </View>

        <View style={styles.boxes}>
          <Text>Status</Text>
          <Dropdown
            style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={statuses}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? 'Select item' : '...'}
            value={value}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            onChange={item => {
              setValue(item.value);
              setIsFocus(false);
            }}
          />
        </View>
        <View style={styles.boxes}>
          <Text>Fishing Zone</Text>
          <Dropdown
            style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={fishingZones}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? 'Select item' : '...'}
            value={value}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            onChange={item => {
              setValue(item.value);
              setIsFocus(false);
            }}
          />
        </View>
        <View style={styles.boxes}>
          <Text>Port</Text>
          <Dropdown
            style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={ports}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? 'Select item' : '...'}
            value={value}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            onChange={item => {
              setValue(item.value);
              setIsFocus(false);
            }}
          />
        </View>
        <View style={styles.boxes}>
          <Text>Date From</Text>
          <TouchableOpacity
            onPress={() => showMode('date')}
            style={{ padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}
          >
            <Text>{text}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.boxes}>
          <Text>Date To</Text>
          <TouchableOpacity
            onPress={() => showMode1('date1')}
            style={{ padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}
          >
            <Text>{text1}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.boxes}>
          <Text>Sort By</Text>
          <Dropdown
            style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={sort}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? 'Select item' : '...'}
            value={value}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            onChange={item => {
              setValue(item.value);
              setIsFocus(false);
            }}
          />
        </View>
        <View style={styles.boxes}>
          <Text>Sort Order</Text>
          <Dropdown
            style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={order}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? 'Select item' : '...'}
            value={value}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            onChange={item => {
              setValue(item.value);
              setIsFocus(false);
            }}
          />
        </View>
      </View>

      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
      {show1 && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date1}
          mode={mode1}
          is24Hour={true}
          display="default"
          onChange={onChange1}
        />
      )}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          margin: 10,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: '#2196F3',
            padding: 10,
            borderRadius: 5,
            paddingHorizontal: 40,
          }}
        >
          <Text style={{ color: 'white' }}>Statistics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: '#4CAF50',
            padding: 10,
            borderRadius: 5,
            paddingHorizontal: 40,
          }}
        >
          <Text style={{ color: 'white' }}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cards}>
        <Text style={{ color: '#c7c427ff', fontWeight: 'bold', fontSize: 22 }}>
          Trip List
        </Text>
        <FlatList
          keyExtractor={item => item.id}
          data={trips}
          renderItem={({ item }) => {
            return (
              <View style={styles.listBox}>
                <View>
                  <Text style={styles.tripId}>{item.tripId}</Text>
                  <Text style={styles.text}>{item.boat}</Text>
                  <Text style={styles.text}>{item.port}</Text>
                  <Text style={[styles.text, styles.status(item.status)]}>
                    {item.status}
                  </Text>
                  <Text style={styles.text}>{item.departureDate}</Text>
                </View>

                <View style={{ justifyContent: 'center' }}>
                  <TouchableOpacity
                    style={{
                      marginBottom: 15,
                      backgroundColor: '#f6f6f6ff',
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ alignSelf: 'center' }}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      marginTop: 15,
                      backgroundColor: '#80f073ff',
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <Text>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  cards: {
    padding: 20,
    margin: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  boxes: {
    backgroundColor: '#dededeff',
    padding: 10,
    borderRadius: 14,
    marginVertical: 5,
    alignItems: 'center',
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    width: 250,
    backgroundColor: '#f0f0f0',
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  listBox: {
    padding: 16,
    margin: 10,
    backgroundColor: '#dededeff',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  tripId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0e6dbaff',
    marginBottom: 8,
  },

  text: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },

  status: status => ({
    color:
      status === 'Active'
        ? '#27ae60'
        : status === 'Completed'
        ? '#2980b9'
        : '#e67e22',
    fontWeight: '700',
  }),
});
