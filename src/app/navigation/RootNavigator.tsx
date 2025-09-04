// src/navigation/RootNavigator.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import AuthStack from './stacks/AuthStack';
import FishermanStack from './stacks/FishermanStack';
import MiddleManStack from './stacks/MiddleManStack';
import ExporterStack from './stacks/ExporterStack';
import MFDStaffStack from './stacks/MFDStaffStack';
import FCSStack from './stacks/FCSStack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NotSupportedScreen from '../../screens/common/NotSupportedScreen';
import { RootState } from '../../redux/store';
import { loadSession } from '../../redux/actions/authActions';
// import WebViewScreen from '../../screens/WebViewScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const dispatch = useDispatch();
  useEffect(() => { dispatch<any>(loadSession()); }, [dispatch]);
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  if (!isAuthenticated || !user) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  const role = user.role;
  return (
    <NavigationContainer>
      {role === 'fisherman' && <FishermanStack />}
      {role === 'middle_man' && <MiddleManStack />}
      {role === 'exporter' && <ExporterStack />}
      {role === 'mfd_staff' && <MFDStaffStack />}
      {role === 'fcs' && <FCSStack />}
      {!(
        role === 'fisherman' ||
        role === 'middle_man' ||
        role === 'exporter' ||
        role === 'mfd_staff' ||
        role === 'fcs'
      ) && (
        <Stack.Navigator>
          <Stack.Screen
            name="NotSupported"
            component={NotSupportedScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      )}
      {/* <Stack.Navigator>
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator> */}
    </NavigationContainer>
  );
}
