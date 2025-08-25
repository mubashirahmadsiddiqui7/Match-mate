// src/screens/exporter/ExporterHome.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExporterStackParamList } from '../../app/navigation/stacks/ExporterStack';
import { useNavigation } from '@react-navigation/native';

type Nav = NativeStackNavigationProp<ExporterStackParamList, 'ExporterHome'>;

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

export default function ExporterHome() {
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();
  return (
    <ScrollView>
      <View style={styles.headerCard}>
        <View>
          <TouchableOpacity>
            <Image
              source={require('../../assets/images/placeholderIMG.png')}
              style={{ width: 50, height: 50, borderRadius: 50 }}
            />
          </TouchableOpacity>

          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>
            Welcome, Exporter!
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
          Lots bought
        </Text>
        <FlatList
          data={dummylots}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('boughtLots')}>
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
      <TouchableOpacity style={styles.productButton} onPress={()=>(navigation.navigate('addFinalProduct'))}>
        <Text>Create Final Product</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.viewProductsButton} onPress={()=>(navigation.navigate('viewFInalProducts'))}>
        <Text style={{color:'#fff'}}>View Final Products</Text>
      </TouchableOpacity>
    </ScrollView>
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
  productButton: {
    backgroundColor: '#00c0f5ff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '90%',
    alignSelf: 'center',
  },
    viewProductsButton: {
    backgroundColor: '#24aa0cff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '90%',
    alignSelf: 'center',
  },
});
