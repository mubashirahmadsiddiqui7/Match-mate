// src/screens/Fisherman/AddTrip/hooks/useCurrentLocation.ts
import { useCallback, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { ensureLocationPermission, getRobustCurrentPosition } from '../../../../utils/location';

export function useCurrentLocation() {
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const capture = useCallback(async () => {
    setLoading(true);
    try {
      const ok = await ensureLocationPermission();
      if (!ok) return;
      const pos = await getRobustCurrentPosition();
      setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Location error', text2: 'Could not get GPS location. Try moving to open sky and ensure Location is ON.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { capture(); }, [capture]);

  return { gps, loading, recapture: capture };
}
