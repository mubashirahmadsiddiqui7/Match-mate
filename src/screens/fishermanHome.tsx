import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TextInput,
  Button,
  Image,
  Alert,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';

type loginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;
const FishermanHome = () => {
  return (
    <View>
      <Text style={styles.welcome}>Welcome!</Text>
      <TouchableOpacity style={styles.profileButton}>
        <Image
          source={require('./../assets/images/placeholderIMG.png')}
          style={{ height: 50, width: 50 }}
        />
        <Text>Profile</Text>
      </TouchableOpacity>

      <View style={styles.upperButtons}>
        <TouchableOpacity style={styles.tripButton}>
          <Text>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.lotButton}>
          <Text>Lots</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity>
        <Text>Vessals</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  welcome: {
    fontWeight: 'bold',
    fontSize: 34,
    marginBottom: 16,
    textAlign: 'center',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#16790dff',
    borderRadius: 5,
    marginBottom: 10,
    width: 200,
    marginLeft: 200,
  },
  tripButton: {
    backgroundColor: '#16790dff',
  },
  lotButton: {
    backgroundColor: '#16790dff',
  },
  upperButtons: {
    flexDirection: 'row',
  }

});

export default FishermanHome;
