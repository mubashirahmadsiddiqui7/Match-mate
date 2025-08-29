// offline/TripIdMap.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'trip-id-map'; // { [localId]: serverId }

export async function saveTripIdMap(localId: string, serverId: number) {
  const raw = (await AsyncStorage.getItem(KEY)) || '{}';
  const map = JSON.parse(raw);
  map[localId] = serverId;
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

export async function getServerIdFor(localId: string): Promise<number | undefined> {
  const raw = (await AsyncStorage.getItem(KEY)) || '{}';
  const map = JSON.parse(raw);
  return map[localId];
}
