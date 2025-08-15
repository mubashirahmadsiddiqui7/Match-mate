// src/navigation/stacks/FishermanStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FishermanHome from '../../../screens/Fisherman/FishermanHome';
import AddTripScreen from '../../../screens/Fisherman/AddTripScreen';
import AddLotScreen from '../../../screens/Fisherman/AddLotScreen';

export type FishermanStackParamList = {
  FishermanHome: undefined;
  Trip: undefined;
  Lots:undefined;
};

const Stack = createNativeStackNavigator<FishermanStackParamList>();

export default function FishermanStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FishermanHome"
        component={FishermanHome}
        options={{ title: 'Fisherman' }}
      />
      <Stack.Screen
        name="Trip"
        component={AddTripScreen}
        options={{ title: 'Fisherman' }}
      />
      <Stack.Screen
        name="Lots"
        component={AddLotScreen}
        options={{ title: 'Fisherman' }}
      />
    </Stack.Navigator>
  );
}
