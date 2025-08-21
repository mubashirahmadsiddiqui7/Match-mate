// src/navigation/stacks/MFDStaffStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MFDStaffHome from '../../../screens/mfd/MFDStaffHome';
import AllTrips from '../../../screens/mfd/TripManagement/allTrips';
import CurrentTrip from '../../../screens/mfd/TripManagement/currentTrips'

export type MFDStaffStackParamList = {
  MFDStaffHome: undefined;
  AllTrips: undefined;
  CurrentTrip: undefined;
};

const Stack = createNativeStackNavigator<MFDStaffStackParamList>();

export default function MFDStaffStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MFDStaffHome"
        component={MFDStaffHome}
        options={{ title: 'MFD Staff' }}
      />
      <Stack.Screen
        name="AllTrips"
        component={AllTrips}
        options={{ title: 'All Trips' }}
      />
      <Stack.Screen
        name="CurrentTrip"
        component={CurrentTrip}
        options={{ title: 'CurrentTrip' }}
      />
    </Stack.Navigator>
  );
}