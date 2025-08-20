// src/screens/mfd/MFDStaffHome.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MFDStaffStackParamList } from '../../app/navigation/stacks/MFDStaffStack';

type Nav = NativeStackNavigationProp<MFDStaffStackParamList, 'MFDStaffHome'>;

export default function MFDStaffHome() {
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();
  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.cards}>
        <Text style={{ color: 'green', fontWeight: 'bold', fontSize: 22 }}>
          Welcome back, MFD!
        </Text>
        <Text>
          You're logged into the Marine Fisheries Department Portal. Here's your
          dashboard overview.
        </Text>
        <TouchableOpacity style={styles.mfdstaff}>
          <Text>MFD Staff</Text>
        </TouchableOpacity>
        
          <TouchableOpacity
            onPress={() => dispatch(logout())}
            style={styles.logoutButton}
          >
            <Text style={{ color: 'white' }}>Logout</Text>
          </TouchableOpacity>
      </View>

      <View style={styles.cards}>
        <Text style={{ color: 'green', fontWeight: 'bold', fontSize: 22 }}>
          Your Profile Information
        </Text>

        <View style={styles.boxes}>
          <Text style={{ color: '#726f6fff' }}>Full Name</Text>
          <Text>MFD Staff</Text>
        </View>
        <View style={styles.boxes}>
          <Text style={{ color: '#726f6fff' }}>Email Address</Text>
          <Text>mfd.staff@gmail.com</Text>
        </View>

        <View style={styles.boxes}>
          <Text style={{ color: '#726f6fff' }}>Phone Number</Text>
          <Text>03095237230</Text>
        </View>
        <View style={styles.boxes}>
          <Text style={{ color: '#726f6fff' }}>Account Status</Text>
          <Text
            style={{
              backgroundColor: '#30c219ff',
              padding: 5,
              borderRadius: 20,
              color: '#ece5e5ff',
            }}
          >
            Active
          </Text>
        </View>

        <Text style={{ color: '#1344e8ff', fontWeight: 'bold', fontSize: 18 }}>
          MFD Staff Details
        </Text>
        <View style={styles.boxes}>
          <Text style={{ color: '#726f6fff' }}>Employee ID</Text>
          <Text>ID-1515</Text>
        </View>
        <View style={styles.boxes}>
          <Text style={{ color: '#726f6fff' }}>Department/Position</Text>
          <Text>Not specified</Text>
        </View>
      </View>

      <View style={styles.cards}>
        <Text style={{ color: '#c7c427ff', fontWeight: 'bold', fontSize: 22 }}>
          Quick Actions
        </Text>
        <TouchableOpacity style={styles.mfdstaff}>
          <Text>View Reports</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('AllTrips')} style={styles.mfdstaff}>
        <Text>All Trips</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  cards: {
    padding: 20,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 60,
    backgroundColor: '#efeaeaff',
    color: '#2b2929ff',
    paddingHorizontal: 20,
    margin: 13,
  },
  mfdstaff: {
    backgroundColor: '#dededeff',
    padding: 10,
    borderRadius: 40,
    marginVertical: 10,
    marginHorizontal: 100,
    alignItems: 'center',
    borderColor: 'black',
    borderWidth: 1,
  },
  logoutButton: {
    backgroundColor: '#eb3434ff',
    padding: 10,
    borderRadius: 40,
    marginVertical: 10,
    marginHorizontal: 100,
    alignItems: 'center',
  },
  boxes: {
    backgroundColor: '#dededeff',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    borderColor: 'black',
    borderWidth: 1,
    marginHorizontal: 50,
    marginVertical: 10,
  },
});
