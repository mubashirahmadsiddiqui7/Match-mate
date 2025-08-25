// src/navigation/stacks/MiddleManStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MiddleManHome from '../../../screens/middleman/MiddleManHome';
import lotDetails from '../../../screens/middleman/lotDetails';
import exporterDetails from '../../../screens/middleman/exporterDetails';

export type MiddleManStackParamList = {
  MiddleManHome: undefined;
  exporterDetails:undefined;
  lotDetails:undefined;
};

const Stack = createNativeStackNavigator<MiddleManStackParamList>();

export default function MiddleManStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MiddleManHome" component={MiddleManHome} options={{ title: 'Middle Man' }} />
      <Stack.Screen name="exporterDetails" component={exporterDetails} options={{ title: 'Exporter Details' }} />
      <Stack.Screen name="lotDetails" component={lotDetails} options={{ title: 'Lot Details' }} />
    </Stack.Navigator>
  );
}