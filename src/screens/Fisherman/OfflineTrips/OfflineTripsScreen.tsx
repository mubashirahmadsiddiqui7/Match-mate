/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { getQueuedItems, getQueueLength, removeQueued, clearQueue, processQueue } from '../../../offline/TripQueues';
import { isOnline } from '../../../offline/net';
import PALETTE from '../../../theme/palette';

type QueueItem = {
  localId: string;
  type: 'createTrip' | 'startTrip' | 'createActivity' | 'createSpecies';
  body?: Record<string, any>;
  serverId?: number | null;
  dependsOnLocalId?: string;
  createdAt: number;
  attempts: number;
  nextRetryAt?: number | null;
  metadata?: {
    tripId?: string;
    activityId?: string;
    description?: string;
  };
};

export default function OfflineTripsScreen() {
  const navigation = useNavigation();
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnlineStatus, setIsOnlineStatus] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadQueueData = async () => {
    try {
      const items = await getQueuedItems();
      const queueLength = await getQueueLength();
      const online = await isOnline();
      
      setQueueItems(items);
      setIsOnlineStatus(online);
      
      if (online && queueLength > 0) {
        // Auto-process queue when online
        await processQueue();
        // Reload after processing
        const updatedItems = await getQueuedItems();
        setQueueItems(updatedItems);
      }
    } catch (error) {
      console.error('Error loading queue data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueueData();
    
    // Set up periodic refresh
    const interval = setInterval(loadQueueData, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueueData();
  };

  const handleManualSync = async () => {
    if (!isOnlineStatus) {
      Toast.show({
        type: 'error',
        text1: 'No Internet Connection',
        text2: 'Please check your connection and try again.',
        position: 'top',
      });
      return;
    }

    try {
      setProcessing(true);
      await processQueue();
      Toast.show({
        type: 'success',
        text1: 'Sync Complete',
        text2: 'All offline data has been processed.',
        position: 'top',
      });
      await loadQueueData();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: 'Some items may not have been processed.',
        position: 'top',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveItem = async (localId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from the queue? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeQueued(localId);
              await loadQueueData();
              Toast.show({
                type: 'success',
                text1: 'Item Removed',
                text2: 'Item has been removed from the queue.',
                position: 'top',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Failed',
                text2: 'Could not remove item from queue.',
                position: 'top',
              });
            }
          },
        },
      ]
    );
  };

  const handleClearQueue = async () => {
    if (queueItems.length === 0) return;

    Alert.alert(
      'Clear All Items',
      `Are you sure you want to remove all ${queueItems.length} items from the queue? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearQueue();
              setQueueItems([]);
              Toast.show({
                type: 'success',
                text1: 'Queue Cleared',
                text2: 'All items have been removed from the queue.',
                position: 'top',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Failed',
                text2: 'Could not clear queue.',
                position: 'top',
              });
            }
          },
        },
      ]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'createTrip':
        return 'add-location-alt';
      case 'startTrip':
        return 'play-circle-filled';
      case 'createActivity':
        return 'surfing';
      case 'createSpecies':
        return 'set-meal';
      default:
        return 'help';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'createTrip':
        return '#1f720d';
      case 'startTrip':
        return '#2563eb';
      case 'createActivity':
        return '#7c3aed';
      case 'createSpecies':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'createTrip':
        return 'Create Trip';
      case 'startTrip':
        return 'Start Trip';
      case 'createActivity':
        return 'Create Activity';
      case 'createSpecies':
        return 'Record Species';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderQueueItem = ({ item }: { item: QueueItem }) => (
    <View style={styles.queueItem}>
      <View style={styles.itemHeader}>
        <View style={styles.itemType}>
          <MaterialIcons
            name={getTypeIcon(item.type) as any}
            size={20}
            color={getTypeColor(item.type)}
          />
          <Text style={[styles.itemTypeText, { color: getTypeColor(item.type) }]}>
            {getTypeLabel(item.type)}
          </Text>
        </View>
        <View style={styles.itemStatus}>
          {item.serverId ? (
            <View style={styles.statusSuccess}>
              <MaterialIcons name="check-circle" size={16} color="#10b981" />
              <Text style={styles.statusText}>Ready</Text>
            </View>
          ) : item.dependsOnLocalId ? (
            <View style={styles.statusPending}>
              <MaterialIcons name="schedule" size={16} color="#f59e0b" />
              <Text style={styles.statusText}>Waiting</Text>
            </View>
          ) : (
            <View style={styles.statusReady}>
              <MaterialIcons name="cloud-upload" size={16} color="#3b82f6" />
              <Text style={styles.statusText}>Ready</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.itemDetails}>
        <Text style={styles.itemDescription}>
          {item.metadata?.description || 'No description available'}
        </Text>
        <Text style={styles.itemTime}>
          Created: {formatDate(item.createdAt)}
        </Text>
        {item.attempts > 0 && (
          <Text style={styles.itemAttempts}>
            Attempts: {item.attempts}
          </Text>
        )}
        {item.nextRetryAt && (
          <Text style={styles.itemRetry}>
            Next retry: {formatDate(item.nextRetryAt)}
          </Text>
        )}
      </View>

      <View style={styles.itemActions}>
        <Pressable
          onPress={() => handleRemoveItem(item.localId)}
          style={styles.removeButton}
        >
          <MaterialIcons name="delete" size={18} color="#ef4444" />
          <Text style={styles.removeButtonText}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" translucent={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.green700} />
          <Text style={styles.loadingText}>Loading offline data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Offline Queue</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <MaterialIcons
            name={isOnlineStatus ? 'wifi' : 'wifi-off'}
            size={20}
            color={isOnlineStatus ? '#10b981' : '#ef4444'}
          />
          <Text style={[styles.statusText, { color: isOnlineStatus ? '#10b981' : '#ef4444' }]}>
            {isOnlineStatus ? 'Online' : 'Offline'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <MaterialIcons name="queue" size={20} color="#6b7280" />
          <Text style={styles.statusText}>{queueItems.length} items</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleManualSync}
          disabled={!isOnlineStatus || processing || queueItems.length === 0}
          style={[
            styles.syncButton,
            (!isOnlineStatus || processing || queueItems.length === 0) && styles.syncButtonDisabled,
          ]}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="sync" size={20} color="#fff" />
          )}
          <Text style={styles.syncButtonText}>
            {processing ? 'Syncing...' : 'Sync Now'}
          </Text>
        </Pressable>

        {queueItems.length > 0 && (
          <Pressable
            onPress={handleClearQueue}
            style={styles.clearButton}
          >
            <MaterialIcons name="clear-all" size={20} color="#ef4444" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </Pressable>
        )}
      </View>

      {/* Queue Items */}
      {queueItems.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="cloud-done" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>
            No offline data waiting to be synced.
          </Text>
        </View>
      ) : (
        <FlatList
          data={queueItems}
          renderItem={renderQueueItem}
          keyExtractor={(item) => item.localId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    backgroundColor: PALETTE.green700,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statusBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  syncButton: {
    flex: 1,
    backgroundColor: PALETTE.green700,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#fff',
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    padding: 16,
  },
  queueItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemDetails: {
    marginBottom: 12,
  },
  itemDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  itemTime: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemAttempts: {
    fontSize: 12,
    color: '#f59e0b',
    marginBottom: 2,
  },
  itemRetry: {
    fontSize: 12,
    color: '#ef4444',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#fff',
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
});
