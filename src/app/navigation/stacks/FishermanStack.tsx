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
import FishingActivitiesListScreen from '../../../screens/Fisherman/Activities/FishingActivitiesList';
import FishingActivityDetailsScreen from '../../../screens/Fisherman/Activities/FishingActivityDetailsScreen';
import RecordFishSpeciesScreen from '../../../screens/Fisherman/Activities/RecordFishSpeciesScreen';

export type FishermanStackParamList = {
  FishermanHome: undefined;

  // Trip create/edit
  Trip: { id?: number | string; mode?: 'create' | 'edit' } | undefined;

  OfflineTrips: undefined;
  Boat: undefined;
  AllTrip: undefined;

  // Trip details
  TripDetails: { id: number | string };

  // Lots list & details
  LotsList: undefined;
  LotDetails: { id: number | string };

  // FishingActivity:
  //   | {
  //       tripId: number | string; // UI trip code OR numeric; we’ll choose numeric later
  //       activityNo?: number;
  //       meta?: {
  //         id: number | string; // DB PK (8) -> for API
  //         captain?: string | null;
  //         boat?: string | null;
  //         trip_id?: string | number; // display code
  //       };
  //     }
  //   | { mode: 'edit'; lotId: number | string };
    FishingActivity: {
    mode?: 'create' | 'edit';
    activityId?: number | string;
    tripId: string | number;      // pretty trip code for display
    activityNo?: number;
    meta?: {
      id: number | string;        // trip DB id
      captain?: string | null;
      boat?: string | null;
      trip_id?: string | number;  // pretty code for display
    };
    prefill?: any; // optional fast prefill if caller passes known activity fields
  };
  FishingActivities: undefined; // NEW list screen
  FishingActivityEdit: { id: number | string };
  FishingActivityDetails: {
    activityId: number | string;
    tripId?: string | number;
    fallback?: any;
  };
  RecordFishSpecies: {
    activityId: number | string;
    activityCode?: string | null;
    tripCode?: string | null;
    activityNumber?: number | null;
    date?: string | null;
  };

  Lots: { tripId: number | string } | { mode: 'edit'; lotId: number | string };
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
        name="FishingActivities"
        component={FishingActivitiesListScreen}
      />
      <Stack.Screen
        name="FishingActivityDetails"
        component={FishingActivityDetailsScreen}
      />
      <Stack.Screen
        name="RecordFishSpecies"
        component={RecordFishSpeciesScreen}
      />

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
