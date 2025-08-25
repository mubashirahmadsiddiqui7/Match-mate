/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';

export default function exporterDetails() {
  const [lots, setLot] = useState([{ id: '', weight: '', price: '' }]);
  const addLot = () => {
    setLot([...lots, { id: '', weight: '', price: '' }]);
  };
  return (
    <ScrollView>
      <View style={styles.card}>
        <View>
          <Text style={{ fontWeight: 'bold' }}>Seafood Exports Ltd</Text>
          <Text>West Wharf, Karachi</Text>
        </View>
        <View>
          <Text>+92 300 1234567</Text>
          <Text>Abid Bashir</Text>
        </View>
      </View>

      <View style={styles.card2}>
        <Text style={{ fontWeight: 'bold' }}>Enter catch infos</Text>
        {lots.map((lot, index) => (
          <View style={styles.inputContainer}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <Text style={{ fontWeight: 'bold', fontSize: 15 }}>Lot</Text>
              <TouchableOpacity style={styles.deletelotbutton}>
                <Text
                  style={{ color: '#fff', fontWeight: 'bold' }}
                  onPress={() => {
                    setLot(lots.filter((_, i) => i != index));
                  }}
                >
                  Delete Lot
                </Text>
              </TouchableOpacity>
            </View>

            <Text>Enter Lot ID:</Text>
            <TextInput
              style={{
                backgroundColor: '#fff',
                padding: 10,
                marginVertical: 10,
                color: '#000',
              }}
              placeholder="Enter Lot ID"
              placeholderTextColor={'#999'}
              value={lot.id}
              onChangeText={text => {
                const updatedLots = [...lots];
                updatedLots[index].id = text;
                setLot(updatedLots);
              }}
            />
            <Text>Enter weight given:</Text>
            <TextInput
              style={{
                backgroundColor: '#fff',
                padding: 10,
                marginVertical: 10,
                color: '#000',
              }}
              placeholder="Enter weight in kilos"
              placeholderTextColor={'#999'}
              value={lot.weight}
              onChangeText={text => {
                const updatedLots = [...lots];
                updatedLots[index].weight = text;
                setLot(updatedLots);
              }}
            />
            <Text>Price per kilo:</Text>
            <TextInput
              style={{
                backgroundColor: '#fff',
                padding: 10,
                marginVertical: 10,
                color: '#000',
              }}
              placeholder="Enter price per kilo"
              placeholderTextColor={'#999'}
              value={lot.price}
              onChangeText={text => {
                const updatedLots = [...lots];
                updatedLots[index].price = text;
                setLot(updatedLots);
              }}
            />
          </View>
        ))}

        <TouchableOpacity
          style={styles.addLotbutton}
          onPress={() => {
            addLot();
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            Add more Lots
          </Text>
        </TouchableOpacity>

        <Text>Total Number of Lots given: LOT1, LOT3</Text>
        <Text>Total Weight: 1500 Kgs</Text>
        <Text>Total Price: PKR 300,000</Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#4caf50',
            padding: 15,
            borderRadius: 10,
            marginTop: 10,
          }}
        >
          <Text
            style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}
          >
            Submit for Approval
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  },
  card2: {
    padding: 20,
    backgroundColor: '#deeedbff',
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 10,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#9fbb9aff',
    borderRadius: 15,
    padding: 10,
    marginTop: 10,
  },
  addLotbutton: {
    backgroundColor: '#00c0f5ff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '45%',
    alignSelf: 'flex-end',
  },
  deletelotbutton: {
    backgroundColor: '#f54242ff',
    padding: 5,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
    width: '30%',
  },
});
