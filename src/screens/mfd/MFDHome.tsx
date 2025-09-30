import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PALETTE from '../../theme/palette';
import { MFDStackParamList } from '../../app/navigation/stacks/MFDStack';

type Nav = NativeStackNavigationProp<MFDStackParamList>;

const PRIMARY = PALETTE.green700;

export default function MFDHome() {
  const navigation = useNavigation<Nav>();

  const menuItems = [
    {
      title: 'Distributions',
      subtitle: 'View all fish distributions',
      icon: 'inventory',
      color: '#2196f3',
      onPress: () => navigation.navigate('DistributionsList'),
      actions: [
        { label: 'View All', onPress: () => navigation.navigate('DistributionsList') },
        { label: 'Pending', onPress: () => navigation.navigate('DistributionsList', { filter: 'pending' }) },
        { label: 'Verified', onPress: () => navigation.navigate('DistributionsList', { filter: 'verified' }) },
      ],
    },
    {
      title: 'Purchases',
      subtitle: 'View all fish purchases',
      icon: 'shopping-cart',
      color: '#4caf50',
      onPress: () => navigation.navigate('PurchasesList'),
      actions: [
        { label: 'View All', onPress: () => navigation.navigate('PurchasesList') },
        { label: 'Pending', onPress: () => navigation.navigate('PurchasesList', { filter: 'pending' }) },
        { label: 'Confirmed', onPress: () => navigation.navigate('PurchasesList', { filter: 'confirmed' }) },
      ],
    },
    {
      title: 'Records',
      subtitle: 'View all system records',
      icon: 'description',
      color: '#ff9800',
      onPress: () => navigation.navigate('RecordsList'),
      actions: [
        { label: 'View All', onPress: () => navigation.navigate('RecordsList') },
        { label: 'Trips', onPress: () => navigation.navigate('RecordsList', { filter: 'trip' }) },
        { label: 'Distributions', onPress: () => navigation.navigate('RecordsList', { filter: 'distribution' }) },
      ],
    },
    {
      title: 'Boats',
      subtitle: 'Manage boat information',
      icon: 'directions-boat',
      color: '#9c27b0',
      onPress: () => navigation.navigate('BoatsList'),
      actions: [
        { label: 'View All', onPress: () => navigation.navigate('BoatsList') },
        { label: 'Active', onPress: () => navigation.navigate('BoatsList', { filter: 'active' }) },
        { label: 'Inactive', onPress: () => navigation.navigate('BoatsList', { filter: 'inactive' }) },
      ],
    },
    {
      title: 'Assignments',
      subtitle: 'Manage fisherman assignments',
      icon: 'assignment',
      color: '#f44336',
      onPress: () => navigation.navigate('AssignmentsList'),
      actions: [
        { label: 'View All', onPress: () => navigation.navigate('AssignmentsList') },
        { label: 'Create New', onPress: () => navigation.navigate('AssignmentCreate') },
        { label: 'Active', onPress: () => navigation.navigate('AssignmentsList', { filter: 'active' }) },
      ],
    },
  ];

  const MenuCard = ({ item }: { item: typeof menuItems[0] }) => (
    <View style={[styles.menuCard, { borderLeftColor: item.color }]}>
      <Pressable
        style={styles.menuCardHeader}
        onPress={item.onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Icon name={item.icon} size={32} color={item.color} />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>{item.title}</Text>
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        </View>
        <Icon name="chevron-right" size={24} color={PALETTE.text400} />
      </Pressable>
      
      <View style={styles.actionsContainer}>
        {item.actions.map((action, index) => (
          <Pressable
            key={index}
            style={[styles.actionButton, { borderColor: item.color }]}
            onPress={action.onPress}
          >
            <Text style={[styles.actionButtonText, { color: item.color }]}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY }]}>
        <Text style={styles.headerTitle}>MFD Management</Text>
        <Text style={styles.headerSubtitle}>Marine Fisheries Department</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management Modules</Text>
          <Text style={styles.sectionSubtitle}>
            Access all MFD management functions
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="inventory" size={24} color="#2196f3" />
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Distributions</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="shopping-cart" size={24} color="#4caf50" />
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Purchases</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="directions-boat" size={24} color="#9c27b0" />
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Boats</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="assignment" size={24} color="#f44336" />
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Assignments</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <MenuCard key={index} item={item} />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            MFD Trace Fish Management System
          </Text>
          <Text style={styles.footerSubtext}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: PALETTE.text600,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: PALETTE.text600,
    textAlign: 'center',
  },
  menuContainer: {
    // gap handled by marginBottom in menuCard
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  menuCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALETTE.text900,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: PALETTE.text600,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: PALETTE.text500,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: PALETTE.text400,
  },
});
