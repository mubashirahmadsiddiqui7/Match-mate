import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, ActivityIndicator, Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export  function StartTripCTA({
  onPress,
  disabled,
  loading,
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  // Pulsing halo loop
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  // Spinning icon when loading
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnim = (val: Animated.Value, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );

    const loops = [pulseAnim(pulse1, 0), pulseAnim(pulse2, 800)];
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop && (l as any).stop?.());
  }, [pulse1, pulse2]);

  useEffect(() => {
    if (loading) {
      const spinLoop = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
      );
      spinLoop.start();
      return () => spinLoop.stop();
    } else {
      spin.setValue(0);
    }
  }, [loading, spin]);

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 8, tension: 120 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 120 }).start();
  };

  const ringStyle = (val: Animated.Value) => ({
    position: 'absolute' as const,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1f720d',
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0] }),
    transform: [
      { scale: val.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.35] }) },
    ],
  });

  const spinStyle = {
    transform: [
      {
        rotate: spin.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 10 }}>
      {/* Pulsing rings (hidden on Android < 9 shadow-wise but still looks good) */}
      {!loading && !disabled && (
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: -24 }}>
          <Animated.View style={ringStyle(pulse1)} />
          <Animated.View style={ringStyle(pulse2)} />
        </View>
      )}

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled}
          style={({ pressed }) => [
            {
              height: 52,
              borderRadius: 14,
              backgroundColor: '#1f720d',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#1f720d',
              shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.35,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
              opacity: disabled ? 0.7 : pressed ? 0.9 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Start Trip"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {loading ? (
              // Rotating play icon + small spinner
              <>
                <Animated.View style={spinStyle}>
                  <MaterialIcons name="play-circle-fill" size={22} color="#FFFFFF" />
                </Animated.View>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Starting…</Text>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </>
            ) : (
              <>
                <MaterialIcons name="play-circle-fill" size={22} color="#FFFFFF" />
                <Text style={{ color: '#fff', fontWeight: '800' }}>Start Trip</Text>
              </>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
