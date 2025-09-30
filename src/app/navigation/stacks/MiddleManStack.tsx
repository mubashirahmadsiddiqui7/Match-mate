// src/navigation/stacks/MiddleManStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MiddleManHome from '../../../screens/middleman/MiddleManHome';
import LotDetails from '../../../screens/middleman/lotDetails';
import Distributions from '../../../screens/middleman/Distributions';
import DistributionDetails from '../../../screens/middleman/distributionDetails';
import Assignments from '../../../screens/middleman/Assignments';
import AssignmentDetails from '../../../screens/middleman/AssignmentDetails';
import Purchases from '../../../screens/middleman/Purchases';
import PurchaseDetails from '../../../screens/middleman/PurchaseDetails';
import CreatePurchase from '../../../screens/exporter/CreatePurchase';
import AddDistribution from '../../../screens/middleman/AddDistribution';

export type MiddleManStackParamList = {
  MiddleManHome: undefined;
  lotDetails: { id: number | string };
  Distributions: { id: number | string };
  distributionDetails: { distributionId: number };
  Assignments: undefined;
  assignmentDetails: { assignmentId: number };
  Purchases: undefined;
  purchaseDetails: { purchaseId: number; editable?: boolean };
  CreatePurchase: { hideFinalFields?: boolean; editPurchaseId?: number } | undefined;
  AddDistribution: undefined;
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
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="distributionDetails"
        component={DistributionDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Assignments"
        component={Assignments}
        options={{headerShown: false}}
      />
      <Stack.Screen 
        name="assignmentDetails"
        component={AssignmentDetails}
        options={{headerShown: false}}
      />
      <Stack.Screen 
        name="Purchases"
        component={Purchases}
        options={{headerShown: false}}
      />
      <Stack.Screen 
        name="CreatePurchase"
        component={CreatePurchase}
        options={{headerShown: false}}
        initialParams={{ hideFinalFields: true }}
      />
      <Stack.Screen 
        name="purchaseDetails"
        component={PurchaseDetails}
        options={{headerShown: false}}
      />
      <Stack.Screen 
        name="AddDistribution"
        component={AddDistribution}
        options={{headerShown:true, title: 'Add Distribution'}}
      />
    </Stack.Navigator>
  );
}
