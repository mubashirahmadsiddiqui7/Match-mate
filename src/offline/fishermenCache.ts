import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'fishermen_cache_v1';

export type CachedFisherman = { id: number; name: string };

export async function readFishermenCache(): Promise<CachedFisherman[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
    return [];
  } catch {
    return [];
  }
}

export async function writeFishermenCache(list: CachedFisherman[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export async function clearFishermenCache(): Promise<void> {
  try { await AsyncStorage.removeItem(KEY); } catch {}
}
