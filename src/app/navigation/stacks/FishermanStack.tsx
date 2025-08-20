// src/navigation/stacks/FishermanStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FishermanHome from '../../../screens/Fisherman/FishermanHome';
// import AddLotScreen from '../../../screens/Fisherman/AddLotScreen';
import AddTripScreen from '../../../screens/Fisherman/AddTrip';
import AddLotScreen from '../../../screens/Fisherman/AddLot';
import OfflineTripsScreen from '../../../screens/Fisherman/OfflineQueue/OfflineTripsScreen';
import TripsScreen from '../../../screens/Fisherman/Trips/TripsScreen';
import AllLotsScreen from '../../../screens/Fisherman/LotsList';
import TripDetailsScreen from '../../../screens/Fisherman/TripDetails/TripDetailsScreen';
import LotDetailsScreen from '../../../screens/Fisherman/LotsDetails/LotDetailsScreen';

export type FishermanStackParamList = {
  FishermanHome: undefined;
  Trip: { id?: number | string; mode?: 'create' | 'edit' } | undefined; // ⬅️ update
  OfflineTrips: undefined;
  AllTrip: undefined;
  TripDetails: { id: number | string };
  LotsList: undefined;
  // Lots: { tripId?: string } | undefined; // 👈 optional + allow undefined
    LotDetails: { id: number | string };   
  // ⬇️ expand Lots route to support edit mode
  Lots:
    | { tripId?: string | number } // create mode (existing)
    | { mode: 'edit'; lotId: number | string }; // edit mode
};

const Stack = createNativeStackNavigator<FishermanStackParamList>();

export default function FishermanStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // 👈 hide the native header
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="FishermanHome" component={FishermanHome} />
      <Stack.Screen name="AllTrip" component={TripsScreen} />

      <Stack.Screen name="Trip" component={AddTripScreen} />
      <Stack.Screen
        name="TripDetails"
        component={TripDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Lots" component={AddLotScreen} />
      <Stack.Screen name="LotsList" component={AllLotsScreen} />

      <Stack.Screen
        name="OfflineTrips"
        component={OfflineTripsScreen}
        options={{ title: 'Offline Trips' }}
      />
      <Stack.Screen name="LotDetails" component={LotDetailsScreen} />

    </Stack.Navigator>
  );
}
