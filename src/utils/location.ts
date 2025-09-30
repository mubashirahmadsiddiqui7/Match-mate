// src/utils/location.ts
import { Platform } from 'react-native';
import Geolocation, { GeoPosition, GeoError } from 'react-native-geolocation-service';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

export async function ensureLocationPermission(): Promise<boolean> {
  const perms = Platform.select({
    ios: [PERMISSIONS.IOS.LOCATION_WHEN_IN_USE],
    android: [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION],
  });
  if (!perms || perms.length === 0) return false;

  // Check and request each as needed
  for (const p of perms) {
    try {
      let status = await check(p);
      if (status === RESULTS.DENIED || status === RESULTS.LIMITED) {
        status = await request(p);
      }
      if (status !== RESULTS.GRANTED) return false;
    } catch {
      // ignore and continue to request next
      const status = await request(p as any);
      if (status !== RESULTS.GRANTED) return false;
    }
  }
  return true;
}

function getPositionOnce(options: Parameters<typeof Geolocation.getCurrentPosition>[2]): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, (err: GeoError) => reject(err), options);
  });
}

export async function getRobustCurrentPosition(): Promise<GeoPosition> {
  // Attempt 1: High-accuracy GPS (works without internet if Location is ON)
  try {
    return await getPositionOnce({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
      forceRequestLocation: true,
      showLocationDialog: true,
    });
  } catch {}

  // Attempt 2: Balanced/low-power (may work faster if GPS cold start)
  try {
    return await getPositionOnce({
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 0,
      forceRequestLocation: true,
      showLocationDialog: true,
    });
  } catch {}

  // Attempt 3: Allow cached/last known within last 10 minutes
  try {
    return await getPositionOnce({
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
      forceRequestLocation: false,
      showLocationDialog: false,
    });
  } catch (e) {
    throw e;
  }
}


