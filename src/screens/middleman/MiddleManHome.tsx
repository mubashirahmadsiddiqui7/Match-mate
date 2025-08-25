/* eslint-disable react-native/no-inline-styles */
// src/screens/middleman/MiddleManHome.tsx
import React from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MiddleManStackParamList } from '../../app/navigation/stacks/MiddleManStack';
import { useNavigation } from '@react-navigation/native';

type Nav = NativeStackNavigationProp<MiddleManStackParamList, 'MiddleManHome'>;

const dummylots = [
  {
    id: '1',
    lotID: 'LOT1',
    FishermanName: 'john doe',
    Date: '12-12-2023',
    Time: '10:00 AM',
    Weight: '100kg',
    species: 'Tuna',
  },
  {
    id: '2',
    lotID: 'LOT2',
    FishermanName: 'jane doe',
    Date: '17-5-2025',
    Time: '04:00 PM',
    Weight: '230kg',
    species: 'Salmon',
  },
  {
    id: '3',
    lotID: 'LOT3',
    FishermanName: 'Ali',
    Date: '22-2-2025',
    Time: '11:40 AM',
    Weight: '478kg',
    species: 'Mackerel',
  },
  {
    id: '4',
    lotID: 'LOT4',
    FishermanName: 'Hamza',
    Date: '8-11-2024',
    Time: '12:43 PM',
    Weight: '126kg',
    species: 'Pamphret',
  },
];
const dummyexporters = [
  {
    id: '1',
    companyName: 'Seafood Exports Ltd.',
    location: 'West Wharf, Karachi',
  },
  {
    id: '2',
    companyName: 'Oceanic Traders',
    location: 'Korangi Wharf, Karachi',
  },
  {
    id: '3',
    companyName: 'BlueWave Exports',
    location: 'Clifton, Karachi',
  },
  {
    id: '4',
    companyName: 'Baloch Sea Exports',
    location: 'Gwadar Port, Gwadar',
  },
];

export default function MiddleManHome() {
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();
  return (
    <View>
      <View style={styles.headerCard}>
        <View>
          <TouchableOpacity>
            <Image
              source={require('../../assets/images/placeholderIMG.png')}
              style={{ width: 50, height: 50, borderRadius: 50 }}
            />
          </TouchableOpacity>

          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>
            Welcome, Middle Man!
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => dispatch(logout())}
          style={styles.logoutButton}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>
          Lots assigned
        </Text>
        <FlatList
          data={dummylots}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={()=>(navigation.navigate('lotDetails'))}>
              <View
                style={{
                  backgroundColor: '#fff',
                  padding: 10,
                  marginVertical: 5,
                  borderRadius: 5,
                }}
              >
                <Text>Lot ID: {item.lotID}</Text>
                <Text>Fisherman Name: {item.FishermanName}</Text>
                <Text>Date: {item.Date}</Text>
                <Text>Time: {item.Time}</Text>
                <Text>Weight: {item.Weight}</Text>
                <Text>Species: {item.species}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.card}>
        <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>
          Exporter/Company List
        </Text>
        <FlatList
          data={dummyexporters}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            //navigate to that specific exporter/company only by id
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('exporterDetails');
              }}
            >
              <View
                style={{
                  backgroundColor: '#fff',
                  padding: 10,
                  marginVertical: 5,
                  borderRadius: 5,
                }}
              >
                <Text>Company Name: {item.companyName}</Text>
                <Text>Location: {item.location}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  headerCard: {
    padding: 20,
    backgroundColor: '#24aa0cff',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 10,
  },
  logoutButton: {
    padding: 5,
    backgroundColor: '#ef2a07ff',
    borderRadius: 5,
    marginTop: 40,
  },
  card: {
    padding: 20,
    backgroundColor: '#deeedbff',
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 10,
    height: 317,
  },
});