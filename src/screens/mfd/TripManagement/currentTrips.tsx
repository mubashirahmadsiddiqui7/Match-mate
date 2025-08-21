import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { s } from '../../Fisherman/AddTrip/styles';

export default function CurrentTrip() {
  return (
    <ScrollView>
      <View style={styles.cards}>
        <Text style={{ color: 'green', fontWeight: 'bold', fontSize: 22 }}>
          Current Trip Details
        </Text>
        <Text>Details about the current trip will be displayed here.</Text>
      </View>
      <View>
        <Text style={{ fontSize: 22 }}>TRIP-20250819-004</Text>
        <View>
            
        </View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  cards: {
    padding: 20,
    margin: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
