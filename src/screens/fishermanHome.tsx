import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  ImageBackground,
} from 'react-native';

const FishermanHome = () => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('./../assets/images/fishermanImage.png')}
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
            source={require('./../assets/images/placeholderIMG.png')}
            style={styles.profileImage}
          />
          <Text style={styles.profileText}>Profile</Text>
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionCard}>
            <Image
              source={require('./../assets/images/boatIcon.png')}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Trips</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Image
              source={require('./../assets/images/fishIcon.png')}
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
  container: {
    flex: 1,
    backgroundColor: '#fff', // fallback
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 17, 17, 0.15)', // soft green tint
  },
  welcome: {
    fontWeight: 'bold',
    fontSize: 36,
    color: "#1B5E20",
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
    backgroundColor: 'rgba(255,255,255,0.75)', // glassy white
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
  profileImage: {
    height: 50,
    width: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  profileText: {
    fontSize: 18,
    color: "#1B5E20",
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.75)', // glassy look
    borderRadius: 20,
    paddingVertical: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 20,
    color: "#1B5E20",
    fontWeight: '700',
  },
});

export default FishermanHome;
