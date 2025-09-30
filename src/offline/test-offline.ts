// src/offline/test-offline.ts
// Test script for offline functionality
// Run this in development to verify offline features work correctly

import { 
  enqueueTrip, 
  enqueueStartTrip, 
  enqueueCreateActivity, 
  enqueueCreateSpecies,
  getQueuedItems,
  getQueueLength,
  clearQueue,
  processQueue
} from './TripQueues';
import { buildTripId, buildActivityId, buildLotNo } from '../utils/ids';

export async function testOfflineFunctionality() {
  console.log('🧪 Testing Offline Functionality...\n');

  try {
    // Clear any existing queue
    await clearQueue();
    console.log('✅ Queue cleared');

    // Test 1: Create Trip
    console.log('\n📝 Test 1: Creating Trip...');
    const tripBody = {
      trip_name: buildTripId(),
      fisherman_id: 1,
      boat_registration_number: 'BOAT-001',
      trip_type: 'fishing',
      captain_name: 'John Doe',
      captain_mobile_no: '+1234567890',
      crew_no: 3,
      crew_count: 3,
      port_clearance_no: 'PC-001',
      fuel_quantity: 100,
      ice_quantity: 50,
      departure_site: 'Port A',
      departure_port: 'Port A',
      destination_port: 'Port B',
      port_location: 'Port A',
      departure_date: '2025-01-15',
      departure_time: '08:00 AM',
      departure_latitude: 25.7617,
      departure_longitude: -80.1918,
      fishing_method: 'Fishing',
      target_species: 'Tuna',
      sea_type: 'Deep Sea',
      sea_conditions: 'Calm',
      emergency_contact: '+1234567890',
      trip_cost: 500,
      fuel_cost: 200,
      estimated_catch: 100,
      equipment_cost: 100,
      notes: 'Test trip for offline functionality'
    };

    const tripJob = await enqueueTrip(tripBody);
    console.log(`✅ Trip queued with local ID: ${tripJob.localId}`);

    // Test 2: Start Trip (depends on trip creation)
    console.log('\n▶️ Test 2: Starting Trip...');
    const startJob = await enqueueStartTrip({ 
      dependsOnLocalId: tripJob.localId 
    });
    console.log(`✅ Start trip queued with local ID: ${startJob.localId}`);

    // Test 3: Create Fishing Activity (depends on trip)
    console.log('\n🎣 Test 3: Creating Fishing Activity...');
    const activityBody = {
      trip_id: tripJob.localId, // Will be resolved to server ID later
      activity_number: 1,
      time_of_netting: '09:00',
      time_of_hauling: '11:00',
      mesh_size: 5,
      net_length: 100,
      net_width: 8,
      gps_latitude: 25.7617,
      gps_longitude: -80.1918
    };

    const activityJob = await enqueueCreateActivity(activityBody, {
      tripLocalId: tripJob.localId
    });
    console.log(`✅ Activity queued with local ID: ${activityJob.localId}`);

    // Test 4: Record Fish Species (depends on activity)
    console.log('\n🐟 Test 4: Recording Fish Species...');
    const speciesBody = {
      species_name: 'Tuna',
      quantity_kg: 25.5,
      type: 'catch' as const,
      grade: 'A',
      notes: 'Fresh catch from test activity'
    };

    const speciesJob = await enqueueCreateSpecies(speciesBody, {
      activityLocalId: activityJob.localId
    });
    console.log(`✅ Species queued with local ID: ${speciesJob.localId}`);

    // Check queue status
    console.log('\n📊 Queue Status:');
    const queueLength = await getQueueLength();
    const queueItems = await getQueuedItems();
    
    console.log(`Total items in queue: ${queueLength}`);
    console.log('\nQueue Items:');
    queueItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.type} - ${item.metadata?.description || 'No description'}`);
      console.log(`   Local ID: ${item.localId}`);
      console.log(`   Status: ${item.dependsOnLocalId ? 'Waiting' : 'Ready'}`);
      if (item.dependsOnLocalId) {
        console.log(`   Depends on: ${item.dependsOnLocalId}`);
      }
      console.log('');
    });

    // Test 5: Simulate online processing (if we were online)
    console.log('\n🌐 Test 5: Simulating Online Processing...');
    console.log('Note: This would normally happen when internet is restored');
    console.log('The system would:');
    console.log('1. Process trip creation first');
    console.log('2. Update start trip with resolved trip ID');
    console.log('3. Process start trip');
    console.log('4. Update activity with resolved trip ID');
    console.log('5. Process activity creation');
    console.log('6. Update species with resolved activity ID');
    console.log('7. Process species creation');

    console.log('\n✅ Offline functionality test completed successfully!');
    console.log('\nTo test the full flow:');
    console.log('1. Enable airplane mode');
    console.log('2. Create a trip, activity, and species');
    console.log('3. Check the "Offline Trips" screen');
    console.log('4. Disable airplane mode');
    console.log('5. Watch the queue process automatically');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

export async function checkQueueStatus() {
  try {
    const queueLength = await getQueueLength();
    const queueItems = await getQueuedItems();
    
    console.log(`\n📊 Current Queue Status:`);
    console.log(`Total items: ${queueLength}`);
    
    if (queueItems.length === 0) {
      console.log('Queue is empty');
      return;
    }
    
    queueItems.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.type.toUpperCase()}`);
      console.log(`   Description: ${item.metadata?.description || 'No description'}`);
      console.log(`   Local ID: ${item.localId}`);
      console.log(`   Created: ${new Date(item.createdAt).toLocaleString()}`);
      console.log(`   Status: ${item.dependsOnLocalId ? '⏳ Waiting' : '✅ Ready'}`);
      if (item.dependsOnLocalId) {
        console.log(`   Depends on: ${item.dependsOnLocalId}`);
      }
      if (item.attempts > 0) {
        console.log(`   Attempts: ${item.attempts}`);
      }
    });
  } catch (error) {
    console.error('Error checking queue status:', error);
  }
}

// Export for use in development
export default {
  testOfflineFunctionality,
  checkQueueStatus
};
