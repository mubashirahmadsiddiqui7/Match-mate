import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';

export default function lotDetails() {
  return (
    <View style={styles.card}>
        <Text>We wil use the API here to call all the details of the specific Lot that was clicked on the home screen. </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: 20,
    backgroundColor: '#deeedbff',
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 10,
    justifyContent: 'space-between',
    flexDirection: 'row',
  }
});