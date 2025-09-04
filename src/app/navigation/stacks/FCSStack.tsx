// src/app/navigation/stacks/FCSStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import FCS screens
import FCSHome from '../../../screens/fcs/FCSHome';
import FCSTripsList from '../../../screens/fcs/FCSTripsList';
import FCSDistributionsList from '../../../screens/fcs/FCSDistributionsList';
import TripDetails from '../../../screens/common/TripDetails';
import DistributionDetails from '../../../screens/common/DistributionDetails';

export type FCSStackParamList = {
  FCSHome: undefined;
  FCSTripsList: undefined;
  FCSDistributionsList: undefined;
  TripDetails: { tripId: string; trip: any };
  DistributionDetails: { distributionId: string; distribution: any };
};

const Stack = createNativeStackNavigator<FCSStackParamList>();

export default function FCSStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f8f9fa' },
      }}
    >
      <Stack.Screen name="FCSHome" component={FCSHome} />
      <Stack.Screen name="FCSTripsList" component={FCSTripsList} />
      <Stack.Screen name="FCSDistributionsList" component={FCSDistributionsList} />
      <Stack.Screen name="TripDetails" component={TripDetails} />
      <Stack.Screen name="DistributionDetails" component={DistributionDetails} />
    </Stack.Navigator>
  );
}
