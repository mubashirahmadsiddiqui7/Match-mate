// src/navigation/stacks/ExporterStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExporterHome from '../../../screens/exporter/ExporterHome';
import boughtLots from '../../../screens/exporter/boughtLots';
import addFinalProduct from '../../../screens/exporter/addFinalProduct';
import viewFInalProducts from '../../../screens/exporter/viewFInalProducts';
import traceabilityForm from '../../../screens/exporter/traceabilityForm';
import AllTrips from '../../../screens/exporter/AllTrips';
import PurchasesList from '../../../screens/exporter/PurchasesList';
import PurchaseDetails from '../../../screens/exporter/PurchaseDetails';
import CreatePurchase from '../../../screens/exporter/CreatePurchase';
import CompaniesList from '../../../screens/exporter/CompaniesList';
import ViewRecord from '../../../screens/exporter/ViewRecord';
import PDFViewer from '../../../screens/exporter/PDFViewer';
import { TraceabilityRecord } from '../../../services/traceability';

export type ExporterStackParamList = {
  ExporterHome: undefined;
  AllTrips: undefined;
  PurchasesList: undefined;
  PurchaseDetails: { purchaseId: string };
  CreatePurchase: { hideFinalFields?: boolean; editPurchaseId?: number } | undefined;
  CompaniesList: undefined;
  boughtLots: undefined;
  addFinalProduct: undefined;
  viewFInalProducts: undefined;
  traceabilityForm: { recordId?: number } | undefined;
  ViewRecord: { record: TraceabilityRecord };
  PDFViewer: { recordId: number };
};

const Stack = createNativeStackNavigator<ExporterStackParamList>();

export default function ExporterStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen
        name="ExporterHome"
        component={ExporterHome}
        options={{ title: 'Exporter' }}
      />
      <Stack.Screen
        name="AllTrips"
        component={AllTrips}
        options={{ title: 'All Trips' }}
      />
      <Stack.Screen
        name="PurchasesList"
        component={PurchasesList}
        options={{ title: 'All Purchases' }}
      />
      <Stack.Screen
        name="PurchaseDetails"
        component={PurchaseDetails}
        options={{ title: 'Purchase Details' }}
      />
      <Stack.Screen
        name="CreatePurchase"
        component={CreatePurchase}
        options={{ title: 'Create / Edit Purchase' }}
      />
      <Stack.Screen
        name="CompaniesList"
        component={CompaniesList}
        options={{ title: 'Companies' }}
      />
      <Stack.Screen
        name="boughtLots"
        component={boughtLots}
        options={{ title: 'Bought Lots' }}
      />
      <Stack.Screen
        name="addFinalProduct"
        component={addFinalProduct}
        options={{ title: 'Add Final Product' }}
      />
      <Stack.Screen
        name="viewFInalProducts"
        component={viewFInalProducts}
        options={{ title: 'View Final Products' }}
      />
      <Stack.Screen
        name="traceabilityForm"
        component={traceabilityForm}
        options={{ title: 'Traceability Form' }}
      />
      <Stack.Screen
        name="ViewRecord"
        component={ViewRecord}
        options={{ title: 'Record Details' }}
      />
      <Stack.Screen
        name="PDFViewer"
        component={PDFViewer}
        options={{ title: 'PDF Viewer' }}
      />
    </Stack.Navigator>
  );
}
