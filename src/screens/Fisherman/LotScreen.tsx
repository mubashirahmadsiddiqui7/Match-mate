import React, {useState} from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text
} from 'react-native';
import { DataTable, Searchbar } from 'react-native-paper';

const Lot = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ScrollView style={styles.container}>
      <Searchbar
        placeholder="Search"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={{ marginBottom: 10 }}
        icon={"magnify"}
      />

      <DataTable>
        <DataTable.Header style={styles.tableHeader}>
          <DataTable.Title>Lot ID</DataTable.Title>
          <DataTable.Title>Time</DataTable.Title>
          <DataTable.Title>Species</DataTable.Title>
          <DataTable.Title>Actions</DataTable.Title>
        </DataTable.Header>

        <DataTable.Row>
          <DataTable.Cell>1234</DataTable.Cell>
          <DataTable.Cell>12:43 PM</DataTable.Cell>
          <DataTable.Cell>Tuna</DataTable.Cell>
          <DataTable.Cell>
            <TouchableOpacity>
              <Text style={{ color: '#1B5E20' }}>View</Text>
            </TouchableOpacity>
          </DataTable.Cell>
        </DataTable.Row>

        <DataTable.Row>
          <DataTable.Cell>1345</DataTable.Cell>
          <DataTable.Cell>11:09 AM</DataTable.Cell>
          <DataTable.Cell>Pamfret</DataTable.Cell>
          <DataTable.Cell>
            <TouchableOpacity>
              <Text style={{ color: '#1B5E20' }}>View</Text>
            </TouchableOpacity>
          </DataTable.Cell>
        </DataTable.Row>
      </DataTable>

      <TouchableOpacity style={styles.actionCard}>
        <Text style={styles.buttonText}>Create Lot</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Lot;

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  tableHeader: {
    backgroundColor: '#DCDCDC',
  },
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
    marginHorizontal: 90,
  },
  buttonText: {
    fontSize: 20,
    color: '#1B5E20',
    fontWeight: '700',
  },
});