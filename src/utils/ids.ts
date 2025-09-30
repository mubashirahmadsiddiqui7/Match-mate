// src/utils/ids.ts
export function tsStamp(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}${m}${day}-${hh}${mm}${ss}`;
}

export function buildTripId(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${day}`;
  
  // Generate a sequential number (001, 002, etc.)
  const sequential = Math.floor(Math.random() * 999) + 1;
  const sequentialStr = String(sequential).padStart(3, '0');
  
  return `TRIP-${dateStr}-${sequentialStr}`;
}

export function buildActivityId(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${day}`;
  
  // Generate a sequential number (001, 002, etc.)
  const sequential = Math.floor(Math.random() * 999) + 1;
  const sequentialStr = String(sequential).padStart(3, '0');
  
  return `ACT-${dateStr}-${sequentialStr}`;
}

export function buildLotNo(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${day}`;
  
  // Generate a sequential number (001, 002, etc.)
  const sequential = Math.floor(Math.random() * 999) + 1;
  const sequentialStr = String(sequential).padStart(3, '0');
  
  return `LOT-${dateStr}-${sequentialStr}`;
}

// Generate a unique local ID for offline operations
export function generateLocalId(prefix: string = 'LOCAL') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
