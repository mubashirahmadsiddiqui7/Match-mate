import 'react-native-get-random-values';
import React from 'react';
import Login from './src/login';
import SignUp from './src/signup';
import FishermanHome from './src/screens/fishermanHome';
import AddLotScreen from './src/screens/Fisherman/AddLotScreen';
import AddTripScreen from './src/screens/Fisherman/AddTripScreen';
import Lot from './src/screens/Fisherman/LotScreen';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Image, StyleSheet } from 'react-native';
import { Provider as PaperProvidor } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createStackNavigator();

const LIGHT_PAK_GREEN = '#8BC34A';
const DARK_PAK_GREEN = '#1B5E20';
const GOLD_ACCENT = '#D4AF37';

function App() {
  return (
      <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: DARK_PAK_GREEN,
            shadowOpacity: 0,
            elevation: 0,
          },
          headerTintColor: GOLD_ACCENT,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 22,
            letterSpacing: 1,
            color: GOLD_ACCENT,
          },
          headerTitleAlign: 'center',

          // ✅ Add logo to the right
          headerRight: () => (
            <Image
              source={require('./src/assets/images/MFD.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          ),
        }}
      >
        <Stack.Screen name="Lot" component={Lot} options={{ title: 'Lot' }} />
        <Stack.Screen name="AddTripScreen" component={AddTripScreen} options={{ title: 'Trip' }} />
        <Stack.Screen name="AddLotScreen" component={AddLotScreen} options={{ title: 'Lot' }} />
        <Stack.Screen
          name="FishermanHome"
          component={FishermanHome}
          options={{
            title: 'Fisherman',
          }}
        />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerLogo: {
    width: 65,
    height: 65,
    marginRight: 19,
  },
});

export default App;
