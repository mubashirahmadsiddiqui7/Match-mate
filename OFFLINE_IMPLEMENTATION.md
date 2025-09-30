# Offline-First Implementation for MFDTraceFish

This document explains the comprehensive offline-first solution implemented for the fishing application, allowing fishermen to record their trips, activities, and fish species even when offline at sea.

## Overview

The application now supports a complete offline workflow where fishermen can:
1. Create trips with proper ID generation (TRIP-20250829-007 format)
2. Start trips and change status to active
3. Create fishing activities with GPS coordinates
4. Record fish species with lot numbers
5. Automatically sync all data when internet connection is restored

## Architecture

### Core Components

#### 1. Queue System (`src/offline/TripQueues.ts`)
- **Purpose**: Manages offline operations in a queue with dependency resolution
- **Features**:
  - Sequential processing of operations
  - Dependency management between trips, activities, and species
  - Automatic retry with exponential backoff
  - Persistent storage using AsyncStorage

#### 2. ID Generation (`src/utils/ids.ts`)
- **Trip IDs**: `TRIP-YYYYMMDD-XXX` (e.g., TRIP-20250829-007)
- **Activity IDs**: `ACT-YYYYMMDD-XXX` (e.g., ACT-20250829-003)
- **Lot Numbers**: `LOT-YYYYMMDD-XXX` (e.g., LOT-20250829-001)
- **Local IDs**: `LOCAL-TIMESTAMP-RANDOM` for offline operations

#### 3. Queue Provider (`src/offline/QueueProvider.tsx`)
- **Purpose**: Automatically processes offline queue when internet is available
- **Features**:
  - Network change detection
  - Periodic queue processing (every 30 seconds)
  - Safe processing with error handling

## Workflow

### 1. Trip Creation (Offline)
```typescript
// When offline, trip is queued
if (!online) {
  const job = await enqueueTrip(body);
  setCreatedTrip({ id: job.localId, trip_id: tripId });
  // Trip is saved locally and queued for upload
}
```

### 2. Start Trip (Offline)
```typescript
// Start trip can be queued if trip creation is pending
if (!online) {
  await enqueueStartTrip({ dependsOnLocalId: tripLocalId });
  // Will execute when trip is created online
}
```

### 3. Create Fishing Activity (Offline)
```typescript
// Activity creation with proper ID generation
const activityLocalId = generateLocalId('ACT');
const activityCode = buildActivityId();

const job = await enqueueCreateActivity(body, {
  tripLocalId: typeof tripPkForApi === 'string' ? tripPkForApi : undefined,
  tripServerId: typeof tripPkForApi === 'number' ? tripPkForApi : undefined,
});
```

### 4. Record Fish Species (Offline)
```typescript
// Species recording with lot number generation
const lotNumber = buildLotNo();
const localSpeciesId = generateLocalId('SPECIES');

await enqueueCreateSpecies(speciesBody, {
  activityServerId,
  activityLocalId,
});
```

## Queue Processing

### Dependency Resolution
The system automatically resolves dependencies:
1. **Trip Creation** → **Start Trip** → **Create Activity** → **Record Species**
2. Each operation waits for the previous one to complete
3. Server IDs are propagated down the chain

### Processing Order
```typescript
// Items are processed in chronological order
q.items.sort((a, b) => a.createdAt - b.createdAt);

// Dependencies are resolved before processing
if (job.dependsOnLocalId) {
  const resolvedId = idmap[job.dependsOnLocalId];
  if (resolvedId) {
    job.serverId = resolvedId;
    job.dependsOnLocalId = undefined;
  }
}
```

### Error Handling
- **Permanent Errors** (400-499): Item is removed from queue
- **Temporary Errors** (500+): Item is retried with exponential backoff
- **Network Errors**: Item remains in queue for later processing

## User Interface

### Offline Trips Screen
- **Location**: `src/screens/Fisherman/OfflineTrips/OfflineTripsScreen.tsx`
- **Features**:
  - View all queued operations
  - Manual sync button
  - Remove individual items
  - Clear entire queue
  - Real-time status updates

### Status Indicators
- 🟢 **Ready**: Item is ready to be processed
- 🟡 **Waiting**: Item is waiting for dependency
- 🔴 **Error**: Item failed and will retry

## Data Persistence

### Storage Keys
- `trip_queue_v3`: Main queue data
- `trip_queue_idmap_v2`: Mapping of local IDs to server IDs

### Data Structure
```typescript
type QueueJob = {
  localId: string;
  type: JobType;
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
```

## API Integration

### Service Functions
All offline operations use the same service functions:
- `createTrip()` - Creates trip on server
- `startTrip()` - Starts trip on server
- `createFishingActivity()` - Creates activity on server
- `createFishSpecies()` - Records species on server

### Offline Detection
```typescript
import { isOnline } from '../offline/net';

const online = await isOnline();
if (!online) {
  // Use offline queue
  await enqueueTrip(body);
} else {
  // Direct API call
  await createTrip(body);
}
```

## Testing Offline Functionality

### 1. Enable Airplane Mode
- Turn on airplane mode on your device
- Create a trip, activity, and species
- Verify data is saved locally

### 2. Check Queue
- Navigate to "Offline Trips" screen
- Verify items are in the queue
- Check status indicators

### 3. Restore Internet
- Turn off airplane mode
- Wait for automatic sync (or use manual sync)
- Verify data appears on server

### 4. Monitor Queue
- Watch queue items disappear as they're processed
- Check for any error states
- Verify final data on server

## Troubleshooting

### Common Issues

#### 1. Queue Not Processing
- Check network connectivity
- Verify QueueProvider is mounted
- Check console for errors
- Try manual sync

#### 2. Items Stuck in "Waiting" State
- Check dependency chain
- Verify parent items were processed
- Check server ID mapping

#### 3. Data Loss
- Never clear queue without backup
- Check AsyncStorage for data
- Verify queue processing logs

### Debug Information
```typescript
// Enable debug logging
const DEBUG = __DEV__;

// Check queue status
const items = await getQueuedItems();
const length = await getQueueLength();

// Check ID mapping
const map = await readMap();
```

## Best Practices

### 1. Always Check Network Status
```typescript
const online = await isOnline();
if (!online) {
  // Provide offline feedback
  Toast.show({
    type: 'info',
    text1: 'Offline Mode',
    text2: 'Data will sync when online',
  });
}
```

### 2. Generate Proper IDs
```typescript
// Use utility functions for consistent ID generation
const tripId = buildTripId();
const activityId = buildActivityId();
const lotNumber = buildLotNo();
```

### 3. Handle Dependencies
```typescript
// Always pass proper dependency information
await enqueueCreateActivity(body, {
  tripServerId: serverId, // If available
  tripLocalId: localId,   // If server ID not available
});
```

### 4. User Feedback
```typescript
// Provide clear feedback for offline operations
Toast.show({
  type: 'success',
  text1: 'Saved Offline 🎉',
  text2: 'Will sync when online',
});
```

## Future Enhancements

### 1. Conflict Resolution
- Handle data conflicts when multiple devices sync
- Implement merge strategies for conflicting data

### 2. Data Compression
- Compress offline data to save storage
- Implement efficient serialization

### 3. Sync Status
- Real-time sync progress indicators
- Background sync notifications

### 4. Data Validation
- Client-side validation before queuing
- Server-side validation on sync

## Conclusion

This offline-first implementation provides a robust solution for fishermen working in areas with poor internet connectivity. The system ensures data integrity, provides clear user feedback, and automatically handles synchronization when connectivity is restored.

The architecture is designed to be scalable and maintainable, with clear separation of concerns and comprehensive error handling. Users can confidently record their fishing activities offline, knowing that their data will be safely synchronized when they return to port.
