import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExporterStackParamList } from '../../app/navigation/stacks/ExporterStack';
import { useNavigation } from '@react-navigation/native';

type Nav = NativeStackNavigationProp<ExporterStackParamList, 'ExporterHome'>;

const finalProducts = [
  {
    id: '1',
    FinalProductID:'FP1',
    lots: 'LOT1, LOT3',
    Weight: '530kg',
  },
  {
    id: '2',
    FinalProductID:'FP2',
    lots: 'LOT2, LOT4',
    Weight: '910kg',
  },
  {
    id: '3',
    FinalProductID:'FP3',
    lots: 'LOT1, LOT4',
    Weight: '450kg',
  },
  {
    id: '4',
    FinalProductID:'FP4',
    lots: 'LOT3, LOT4',
    Weight: '280kg',
  },
];

export default function ViewFinalProduct() {

    const navigation = useNavigation<Nav>();
  return (
    <View>
      <View style={styles.card}>
        <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>
          Final Products List
        </Text>
        <FlatList
          data={finalProducts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: '#fff',
                padding: 10,
                marginVertical: 5,
                borderRadius: 5,
                flexDirection:'row',
                justifyContent:'space-between',
              }}
            >
              <View>
                <Text style={{fontSize:10}}>FinalProductID: {item.FinalProductID}</Text>
                <Text style={{fontSize:10}}>Lot ID: {item.lots}</Text>
                <Text style={{fontSize:10}}>Weight: {item.Weight}</Text>
              </View>
              <View style={{justifyContent:'center', backgroundColor:'#345bceff', borderRadius:15, padding:5}}>
                <TouchableOpacity onPress={()=>(navigation.navigate('traceabilityForm'))}>
                    <Text style={{color:'#fff'}}>Apply for traceability</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
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
  },
});
