// src/offline/QueueProvider.tsx
import React, { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processQueue } from './TripQueues';

type Props = { children: React.ReactNode };

export default function QueueProvider({ children }: Props) {
  const processingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const processQueueSafely = async () => {
    if (processingRef.current) return;
    
    try {
      processingRef.current = true;
      await processQueue();
    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      processingRef.current = false;
    }
  };

  useEffect(() => {
    // Process queue on app start
    processQueueSafely();

    // Listen for network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && !processingRef.current) {
        // Small delay to ensure network is stable
        setTimeout(() => {
          processQueueSafely();
        }, 1000);
      }
    });

    // Set up periodic processing (every 30 seconds)
    intervalRef.current = setInterval(() => {
      processQueueSafely();
    }, 30000);

    return () => {
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <>
      {React.Children.map(children, child => {
        if (typeof child === 'string' || typeof child === 'number') {
          // React Native cannot render raw text at the root – ignore any stray text nodes
          return null;
        }
        return child as React.ReactElement | null;
      })}
    </>
  );
}
