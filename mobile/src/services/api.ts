import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { getInfoAsync, uploadAsync } from 'expo-file-system/legacy';

async function ensureFileUri(uri: string): Promise<string> {
  if (!uri.startsWith('content://')) return uri; 

  const filename = `scan_${Date.now()}.jpg`;
  const dest = FileSystem.cacheDirectory + filename;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.147:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ── Request interceptor: inject access token ─────────────────
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: auto-refresh token ─────────────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        await AsyncStorage.setItem('accessToken', data.data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      }
    }
    return Promise.reject(error);
  },
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { email: string; password: string; displayName?: string; role?: string }) =>
    api.post('/auth/register', data).then(r => r.data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),

  googleLogin: (accessToken: string) =>
    api.post('/auth/google', { accessToken }).then(r => r.data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then(r => r.data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me').then(r => r.data),
  
  healthCheck: () => api.get('/health').then(r => r.data),
};

// ── Scan ──────────────────────────────────────────────────────
async function scanUpload(
  imageUri: string,
  source: 'camera' | 'gallery',
  coords?: { lat: number; lng: number },
  retry = true,
): Promise<any> {
  imageUri = await ensureFileUri(imageUri);

  // Verify file exists
  const fileInfo = await getInfoAsync(imageUri);
  if (!fileInfo.exists) {
    throw new Error('Image file not found. Please retake the photo.');
  }

  const token = await AsyncStorage.getItem('accessToken');
  const url = `${API_BASE}/scan`;

  const params: Record<string, string> = { source };
  if (coords) {
    params.latitude = String(coords.lat);
    params.longitude = String(coords.lng);
  }

  let uploadRes: any;
  try {
    uploadRes = await uploadAsync(url, imageUri, {
      uploadType: 1, // MULTIPART
      fieldName: 'image',
      parameters: params,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    } as any);
  } catch (upErr: any) {
    throw upErr;
  }

  const status = uploadRes.status;

  if (status === 401 && retry) {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          await AsyncStorage.setItem('accessToken', refreshData.data.accessToken);
          await AsyncStorage.setItem('refreshToken', refreshData.data.refreshToken);
          return scanUpload(imageUri, source, coords, false);
        }
      }
    } catch {
      // fall through to error
    }
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  }

  if (status < 200 || status >= 300) {
    let errBody: any = {};
    try { errBody = JSON.parse(uploadRes.body); } catch { /* ignore */ }
    throw new Error(errBody.message || `Scan failed (${status})`);
  }

  const json = JSON.parse(uploadRes.body);

  // Cleanup temp file if we created one
  if (imageUri.includes('scan_') && imageUri.includes(FileSystem.cacheDirectory!)) {
    FileSystem.deleteAsync(imageUri, { idempotent: true }).catch(() => {});
  }

  return json.data;
}

export const scanAPI = {
  scan: async (
    imageUri: string,
    source: 'camera' | 'gallery' = 'camera',
    coords?: { lat: number; lng: number },
  ) => {
    try {
      return await scanUpload(imageUri, source, coords);
    } catch (err: any) {
      console.error('Scan upload error:', err?.message || err);
      throw err;
    }
  },

  getById: (id: string) => api.get(`/scan/${id}`).then(r => r.data),

  delete: (id: string) => api.delete(`/scan/${id}`).then(r => r.data),

  submitFeedback: (
    id: string,
    feedback: 'correct' | 'incorrect' | 'unsure',
    actualVariety?: string,
  ) => api.post(`/scan/${id}/feedback`, { feedback, actualVariety }),
};

// ── History ───────────────────────────────────────────────────
export const historyAPI = {
  getHistory: (params?: { limit?: number; cursor?: string; variety?: string }) =>
    api.get('/history', { params }).then(r => r.data),

  getStats: () => api.get('/history/stats').then(r => r.data),
};

// ── Varieties ─────────────────────────────────────────────────
export const varietyAPI = {
  getAll: () => api.get('/varieties').then(r => r.data),
  getBySlug: (slug: string) => api.get(`/varieties/${slug}`).then(r => r.data),
};

// ── Users ────────────────────────────────────────────────────
export const userAPI = {
  me: () => api.get('/users/me').then(r => r.data),
  updateMe: (data: { displayName?: string; avatarUrl?: string }) => api.patch('/users/me', data).then(r => r.data),
  submitSupportTicket: (data: { subject: string; message: string }) =>
    api.post('/users/support-tickets', data).then(r => r.data),
};

export default api;
