// src/navigation/stacks/MFDStaffStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MFDStaffHome from '../../../screens/mfd/MFDStaffHome';
import AllTrips from '../../../screens/mfd/TripManagement/allTrips';
import TripDetailsScreen from '../../../screens/mfd/TripManagement/TripDetailsScreen';

// Import MFD management screens
import MFDDistributionsList from '../../../screens/mfd/MFDDistributionsList';
import MFDDistributionDetails from '../../../screens/mfd/MFDDistributionDetails';
import MFDPurchasesList from '../../../screens/mfd/MFDPurchasesList';
import MFDPurchaseDetails from '../../../screens/mfd/MFDPurchaseDetails';
import MFDRecordsList from '../../../screens/mfd/MFDRecordsList';
import MFDRecordDetails from '../../../screens/mfd/MFDRecordDetails';
import MFDBoatsList from '../../../screens/mfd/MFDBoatsList';
import MFDBoatDetails from '../../../screens/mfd/MFDBoatDetails';
import MFDAssignmentsList from '../../../screens/mfd/MFDAssignmentsList';
import MFDAssignmentDetails from '../../../screens/mfd/MFDAssignmentDetails';
import MFDAssignmentCreate from '../../../screens/mfd/MFDAssignmentCreate';
import MFDAssignmentEdit from '../../../screens/mfd/MFDAssignmentEdit';

export type MFDStaffStackParamList = {
  MFDStaffHome: undefined;
  AllTrips: undefined;
  CurrentTrip: undefined;
  TripDetails: { id: number | string };
  // MFD Management screens
  DistributionsList: undefined;
  DistributionDetails: { distributionId: number };
  PurchasesList: undefined;
  PurchaseDetails: { purchaseId: number };
  RecordsList: undefined;
  RecordDetails: { recordId: number };
  BoatsList: undefined;
  BoatDetails: { boatId: number };
  AssignmentsList: undefined;
  AssignmentDetails: { assignmentId: number };
  AssignmentCreate: undefined;
  AssignmentEdit: { assignmentId: number };
};

const Stack = createNativeStackNavigator<MFDStaffStackParamList>();

export default function MFDStaffStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#f8f9fa' },
      }}
    >
      <Stack.Screen name="MFDStaffHome" component={MFDStaffHome} />
      <Stack.Screen name="AllTrips" component={AllTrips} />
      <Stack.Screen
        name="TripDetails"
        component={TripDetailsScreen}
        options={{ headerShown: false }}
      />
      
      {/* MFD Management Screens */}
      <Stack.Screen name="DistributionsList" component={MFDDistributionsList} />
      <Stack.Screen name="DistributionDetails" component={MFDDistributionDetails} />
      <Stack.Screen name="PurchasesList" component={MFDPurchasesList} />
      <Stack.Screen name="PurchaseDetails" component={MFDPurchaseDetails} />
      <Stack.Screen name="RecordsList" component={MFDRecordsList} />
      <Stack.Screen name="RecordDetails" component={MFDRecordDetails} />
      <Stack.Screen name="BoatsList" component={MFDBoatsList} />
      <Stack.Screen name="BoatDetails" component={MFDBoatDetails} />
      <Stack.Screen name="AssignmentsList" component={MFDAssignmentsList} />
      <Stack.Screen name="AssignmentDetails" component={MFDAssignmentDetails} />
      <Stack.Screen name="AssignmentCreate" component={MFDAssignmentCreate} />
      <Stack.Screen name="AssignmentEdit" component={MFDAssignmentEdit} />
    </Stack.Navigator>
  );
}
