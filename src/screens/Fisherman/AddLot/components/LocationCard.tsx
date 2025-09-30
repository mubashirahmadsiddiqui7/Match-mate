import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { s, theme } from '../styles';

export default function LocationCard({
  gps, loading, onRecapture,
}: {
  gps: { lat: number; lng: number; accuracy?: number } | null;
  loading: boolean;
  onRecapture: () => void;
}) {
  return (
    <View>
      {gps ? (
        <Text style={s.locText}>
          Lat {gps.lat.toFixed(5)}, Lng {gps.lng.toFixed(5)}
          {gps.accuracy ? ` (±${Math.round(gps.accuracy)}m)` : ''}
        </Text>
      ) : (
        <Text style={s.locText}>No location yet</Text>
      )}

      <TouchableOpacity style={s.btnGhost} onPress={onRecapture} disabled={loading}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.blue} />
          ) : (
            <MaterialIcons name="my-location" size={18} color={theme.blue} />
          )}
          <Text style={s.btnGhostText}>{loading ? 'Getting location…' : 'Capture / Refresh Location'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
