// src/navigation/stacks/ExporterStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExporterHome from '../../../screens/exporter/ExporterHome';
import boughtLots from '../../../screens/exporter/boughtLots';
import addFinalProduct from '../../../screens/exporter/addFinalProduct';
import viewFInalProducts from '../../../screens/exporter/viewFInalProducts';
import traceabilityForm from '../../../screens/exporter/traceabilityForm';

export type ExporterStackParamList = {
  ExporterHome: undefined;
  boughtLots: undefined;
  addFinalProduct: undefined;
  viewFInalProducts: undefined;
  traceabilityForm: undefined;
};

const Stack = createNativeStackNavigator<ExporterStackParamList>();

export default function ExporterStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ExporterHome" component={ExporterHome} options={{ title: 'Exporter' }} />
      <Stack.Screen name="boughtLots" component={boughtLots} options={{ title: 'Bought Lots' }} />
      <Stack.Screen name="addFinalProduct" component={addFinalProduct} options={{ title: 'Add Final Product' }} />
      <Stack.Screen name="viewFInalProducts" component={viewFInalProducts} options={{ title: 'View Final Products' }} />
      <Stack.Screen name="traceabilityForm" component={traceabilityForm} options={{ title: 'Traceability Form' }} />
    </Stack.Navigator>
  );
}
