// src/services/http.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://smartaisoft.com/MFD-Trace-Fish/api';
// const BASE_URL = 'http://192.168.18.44:8000/api';
// const BASE_URL = 'http://72.167.79.161/MFD-Trace-Fish/api';
const DEBUG = __DEV__;

let authToken: string | null = null;

export async function loadTokenFromStorage() {
  const t = await AsyncStorage.getItem('auth_token');
  authToken = t;
  return t;
}
export async function setAuthToken(token: string | null) {
  authToken = token;
  if (token) await AsyncStorage.setItem('auth_token', token);
  else await AsyncStorage.removeItem('auth_token');
}

type ReqOpts = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  isUpload?: boolean;
  query?: Record<string, any>;
};

function toQuery(q?: Record<string, any>) {
  if (!q) return '';
  const s = Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join('&');
  return s ? `?${s}` : '';
}

function join(base: string, path: string) {
  const b = base.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  return `${b}/${p}`;
}

export async function api(path: string, opts: ReqOpts = {}) {
  const isAbs = /^https?:\/\//i.test(path);
  const url = (isAbs ? path : join(BASE_URL, path)) + toQuery(opts.query || {});
  const method = (opts.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(opts.isUpload ? {} : { 'Content-Type': 'application/json' }),
    ...(opts.headers || {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  if (DEBUG) {
    const tokenPreview = authToken
      ? `${authToken.slice(0, 8)}…${authToken.slice(-4)}`
      : null;
    console.groupCollapsed(`[HTTP] ${method} ${url}`);
    console.log('headers:', {
      ...headers,
      Authorization: tokenPreview ? `Bearer ${tokenPreview}` : undefined,
    });
    if (opts.body && !opts.isUpload) console.log('body:', opts.body);
    console.groupEnd();
  }

  const res = await fetch(url, {
    method,
    headers,
    body: opts.isUpload
      ? (opts.body as any)
      : opts.body
      ? JSON.stringify(opts.body)
      : undefined,
    signal: opts.signal,
  });

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const text = await res.text();

  if (DEBUG) {
    console.groupCollapsed(`[HTTP] ${method} ${url} ← ${res.status}`);
    console.log('content-type:', contentType);
    console.log('raw:', text.slice(0, 400));
    console.groupEnd();
  }

  let json: any = null;
  if (contentType.includes('application/json')) {
    try {
      json = text ? JSON.parse(text) : {};
    } catch {}
  }

  if (!res.ok) {
    const msg =
      json?.message || (text ? text.slice(0, 200) : `HTTP ${res.status}`);
    const err: any = new Error(msg);
    err.status = res.status;
    err.response = json ?? text;
    throw err;
  }

  if (!json) throw new Error('Invalid server response (expected JSON).');

  if (json.success === false) {
    const msg =
      json.message ||
      (json.errors
        ? Object.values(json.errors).flat()?.join('\n')
        : 'Request failed');
    throw new Error(msg);
  }

  return json; // { success, message?, data? }
}

export async function upload(path: string, form: FormData) {
  return api(path, { method: 'POST', isUpload: true, body: form });
}
