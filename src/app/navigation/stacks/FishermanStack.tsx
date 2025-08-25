import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FishermanHome from '../../../screens/Fisherman/FishermanHome';
import AddTripScreen from '../../../screens/Fisherman/AddTrip';
import AddLotScreen from '../../../screens/Fisherman/AddLot';
import TripsScreen from '../../../screens/Fisherman/Trips/TripsScreen';
import AllLotsScreen from '../../../screens/Fisherman/LotsList';
import TripDetailsScreen from '../../../screens/Fisherman/TripDetails/TripDetailsScreen';
import LotDetailsScreen from '../../../screens/Fisherman/LotsDetails/LotDetailsScreen';
import OfflineQueueScreen from '../../../screens/Fisherman/OfflineQueue/OfflineQueueScreen';
import BoatRegisterScreen from '../../../screens/Fisherman/AddBoat/BoatRegistrationScreen';
import FishingActivity from '../../../screens/Fisherman/AddTrip/FishingActivity';

export type FishermanStackParamList = {
  FishermanHome: undefined;

  // Trip create/edit
  Trip:
    | { id?: number | string; mode?: 'create' | 'edit' }
    | undefined;

  OfflineTrips: undefined;
  Boat: undefined;
  AllTrip: undefined;

  // Trip details
  TripDetails: { id: number | string };

  // Lots list & details
  LotsList: undefined;
  LotDetails: { id: number | string };

  // Fishing Activity:
  // - create flow: needs tripId, optional activityNo (1..20)
  // - edit flow: allow editing by lotId (if you reuse the same screen)
  FishingActivity:
    | { tripId: number | string; activityNo?: number }
    | { mode: 'edit'; lotId: number | string };

  // Add/Edit Lot:
  // - create flow: needs tripId
  // - edit flow: by lotId
  Lots:
    | { tripId: number | string }
    | { mode: 'edit'; lotId: number | string };
};

const Stack = createNativeStackNavigator<FishermanStackParamList>();

export default function FishermanStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="FishermanHome" component={FishermanHome} />
      <Stack.Screen name="AllTrip" component={TripsScreen} />

      <Stack.Screen name="Trip" component={AddTripScreen} />
      <Stack.Screen name="FishingActivity" component={FishingActivity} />

      <Stack.Screen
        name="TripDetails"
        component={TripDetailsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen name="Boat" component={BoatRegisterScreen} />
      <Stack.Screen name="Lots" component={AddLotScreen} />
      <Stack.Screen name="LotsList" component={AllLotsScreen} />

      <Stack.Screen
        name="OfflineTrips"
        component={OfflineQueueScreen}
        options={{ title: 'Offline Forms' }}
      />

      <Stack.Screen name="LotDetails" component={LotDetailsScreen} />
    </Stack.Navigator>
  );
}
