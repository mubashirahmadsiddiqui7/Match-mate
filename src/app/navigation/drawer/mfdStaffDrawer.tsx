// // src/navigation/drawer/mfdStaffDrawer.tsx
// import React from 'react';
// import { View, Text } from 'react-native';
// import { createDrawerNavigator } from '@react-navigation/drawer';
// import MFDStaffHome from '../../../screens/mfd/MFDStaffHome';

// export type MFDStaffStackParamList = {
//   MFDStaffHome: undefined;
// };

// const Drawer = createDrawerNavigator();

// export default function MFDStaffDrawer() {
//   return (
//     <Drawer.Navigator
//       initialRouteName="MFDStaffHome"
//       drawerContent={() => (
//         <View>
//           <Text>Hello</Text>
//         </View>
//       )}
//     >
//       <Drawer.Screen
//         name="MFDStaffHome"
//         component={MFDStaffHome}
//         options={{ title: 'MFD Staff' }}
//       />
//     </Drawer.Navigator>
//   );
// }
