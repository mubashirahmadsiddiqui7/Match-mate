// src/screens/fisherman/FishermanHome.tsx
import React, { useCallback, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  ImageBackground,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FishermanStackParamList } from '../../app/navigation/stacks/FishermanStack';
// 👇 type-only import to avoid circular runtime import

type Nav = NativeStackNavigationProp<FishermanStackParamList, 'FishermanHome'>;


const FishermanHome = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Logout',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  }, [dispatch]);

  // Put a Logout button in the header as well
  useLayoutEffect(() => {
    navigation.setOptions?.({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleLogout}
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text style={{ color: '#1B5E20', fontWeight: '700' }}>Logout</Text>
        </TouchableOpacity>
      ),
      title: 'Fisherman',
    });
  }, [navigation, handleLogout]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/fishermanImage.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Light green tint overlay */}
        <View style={styles.overlay} />

        {/* Welcome text */}
        <Text style={styles.welcome}>Welcome!</Text>

        {/* Profile button */}
        <TouchableOpacity style={styles.profileButton}>
          <Image
            source={require('../../assets/images/placeholderIMG.png')}
            style={styles.profileImage}
          />
          <Text style={styles.profileText}>Profile</Text>
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Trip')}>
            <Image
              source={require('../../assets/images/boatIcon.png')}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Trips</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Lots')}>
            <Image
              source={require('../../assets/images/fishIcon.png')}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Lots</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 17, 17, 0.15)',
  },
  welcome: {
    fontWeight: 'bold',
    fontSize: 36,
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  profileImage: { height: 50, width: 50, borderRadius: 25, marginRight: 10 },
  profileText: { fontSize: 18, color: '#1B5E20', fontWeight: '600' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 20 },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 20,
    paddingVertical: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  icon: { width: 40, height: 40, marginBottom: 10 },
  buttonText: { fontSize: 20, color: '#1B5E20', fontWeight: '700' },
});

export default FishermanHome;
