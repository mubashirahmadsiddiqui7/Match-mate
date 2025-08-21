// src/navigation/stacks/MFDStaffStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MFDStaffHome from '../../../screens/mfd/MFDStaffHome';
import AllTrips from '../../../screens/mfd/TripManagement/allTrips';
import TripDetailsScreen from '../../../screens/mfd/TripManagement/TripDetailsScreen';

export type MFDStaffStackParamList = {
  MFDStaffHome: undefined;
  AllTrips: undefined;
  CurrentTrip: undefined;
    TripDetails: { id: number | string };

};

const Stack = createNativeStackNavigator<MFDStaffStackParamList>();

export default function MFDStaffStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MFDStaffHome" component={MFDStaffHome} />
      <Stack.Screen name="AllTrips" component={AllTrips} />
      <Stack.Screen
              name="TripDetails"
              component={TripDetailsScreen}
              options={{ headerShown: false }}
            />
    </Stack.Navigator>
  );
}
