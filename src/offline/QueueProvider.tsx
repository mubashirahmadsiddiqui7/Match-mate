// src/offline/QueueProvider.tsx
import React, { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processQueue } from './TripQueues';

type Props = { children: React.ReactNode };

export default function QueueProvider({ children }: Props) {
  useEffect(() => {
    processQueue(); // app start
    const sub = NetInfo.addEventListener(s => {
      if (s.isConnected) processQueue();
    });
    const t = setInterval(() => processQueue(), 60_000);
    return () => { sub && sub(); clearInterval(t); };
  }, []);
  return <>{children}</>;
}
