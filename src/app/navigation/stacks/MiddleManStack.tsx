// src/navigation/stacks/MiddleManStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MiddleManHome from '../../../screens/middleman/MiddleManHome';
import LotDetails from '../../../screens/middleman/lotDetails';
import Distributions from '../../../screens/middleman/Distributions';
import distributionDetails from '../../../screens/middleman/distributionDetails';

export type MiddleManStackParamList = {
  MiddleManHome: undefined;
  lotDetails: { id: number | string };
  Distributions: { id: number | string };
  distributionDetails:undefined;
};

const Stack = createNativeStackNavigator<MiddleManStackParamList>();

export default function MiddleManStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MiddleManHome" component={MiddleManHome} />
      <Stack.Screen
        name="lotDetails"
        component={LotDetails}
        options={{ headerShown: true, title: 'Lot Details' }}
      />
      <Stack.Screen
        name="Distributions"
        component={Distributions}
        options={{ headerShown: true, title: 'Distributions' }}
      />
      <Stack.Screen 
      name="distributionDetails"
      component={distributionDetails}
      options={{headerShown:true, title: 'Distribution Details'}}
      />
    </Stack.Navigator>
  );
}
