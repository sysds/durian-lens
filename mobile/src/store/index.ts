// ============================================================
// mobile/src/store/index.ts
// Redux Toolkit store with auth + scan slices
// ============================================================

import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, scanAPI, historyAPI, varietyAPI } from '../services/api';

// ── Types ─────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: string;
}

// ── Auth Slice ────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

export const initAuth = createAsyncThunk('auth/init', async () => {
  const [token, refresh, userStr] = await Promise.all([
    AsyncStorage.getItem('accessToken'),
    AsyncStorage.getItem('refreshToken'),
    AsyncStorage.getItem('user'),
  ]);
  if (token && refresh && userStr) {
    return { accessToken: token, refreshToken: refresh, user: JSON.parse(userStr) };
  }
  return null;
});

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (params: Parameters<typeof authAPI.register>[0], { rejectWithValue }) => {
    try { return await authAPI.register(params); }
    catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Registration failed'); }
  }
);

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await authAPI.login(email, password);
      await AsyncStorage.multiSet([
        ['accessToken', data.data.accessToken],
        ['refreshToken', data.data.refreshToken],
        ['user', JSON.stringify(data.data.user)],
      ]);
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const googleLoginThunk = createAsyncThunk(
  'auth/googleLogin',
  async (googleAccessToken: string, { rejectWithValue }) => {
    try {
      const data = await authAPI.googleLogin(googleAccessToken);
      await AsyncStorage.multiSet([
        ['accessToken', data.data.accessToken],
        ['refreshToken', data.data.refreshToken],
        ['user', JSON.stringify(data.data.user)],
      ]);
      return data.data;
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Google sign-in failed';
      return rejectWithValue(status ? `${message} (${status})` : message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, accessToken: null, refreshToken: null, loading: false, error: null } as AuthState,
  reducers: {
    setAuth(state, action: PayloadAction<{ user: any; accessToken: string; refreshToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
        }
      })
      .addCase(registerThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerThunk.fulfilled, (state, action) => { state.loading = false; /* Handled by login logic if auto-login */ })
      .addCase(registerThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(loginThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(googleLoginThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(googleLoginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(googleLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ── Scan Slice ────────────────────────────────────────────────
interface ScanState {
  currentScan: any | null;
  scanning: boolean;
  error: string | null;
}

export const performScanThunk = createAsyncThunk(
  'scan/perform',
  async ({ imageUri, source, coords }: { imageUri: string; source: 'camera' | 'gallery'; coords?: any }, { rejectWithValue }) => {
    try {
      return await scanAPI.scan(imageUri, source, coords);
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Scan failed. Please try again.');
    }
  }
);

export const submitFeedbackThunk = createAsyncThunk(
  'scan/feedback',
  async ({ id, feedback, variety, notes }: { id: string, feedback: 'correct' | 'incorrect' | 'unsure', variety?: string, notes?: string }) => {
    const res = await scanAPI.submitFeedback(id, feedback, variety, notes);
    return res.data ?? res;
  }
);

export const deleteScanThunk = createAsyncThunk(
  'scan/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await scanAPI.delete(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Delete failed');
    }
  }
);

const scanSlice = createSlice({
  name: 'scan',
  initialState: { currentScan: null, scanning: false, error: null } as ScanState,
  reducers: {
    clearScan(state) { state.currentScan = null; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(performScanThunk.pending, (state) => { state.scanning = true; state.error = null; })
      .addCase(performScanThunk.fulfilled, (state, action) => { state.scanning = false; state.currentScan = action.payload; })
      .addCase(performScanThunk.rejected, (state, action) => { state.scanning = false; state.error = action.payload as string; });
  },
});

// ── History Slice ─────────────────────────────────────────────
interface HistoryState {
  items: any[];
  stats: any | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
}

export const fetchHistoryThunk = createAsyncThunk(
  'history/fetch',
  async (params: { cursor?: string; variety?: string } = {}) => {
    return historyAPI.getHistory({ limit: 20, ...params });
  }
);

export const fetchStatsThunk = createAsyncThunk('history/fetchStats', async () => {
  const data = await historyAPI.getStats();
  return data.data;
});

const historySlice = createSlice({
  name: 'history',
  initialState: { items: [], stats: null, loading: false, error: null, hasMore: true, nextCursor: null } as HistoryState,
  reducers: {
    clearHistory(state) { state.items = []; state.nextCursor = null; state.hasMore = true; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistoryThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHistoryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Replace on initial fetch (no cursor), append on pagination
        const isInitial = !action.meta.arg.cursor;
        const incoming = action.payload.data || [];
        if (isInitial) {
          state.items = incoming;
        } else {
          const existingIds = new Set(state.items.map((i: any) => i.id));
          const newItems = incoming.filter((i: any) => !existingIds.has(i.id));
          state.items = [...state.items, ...newItems];
        }
        state.hasMore = action.payload.meta?.hasMore ?? false;
        state.nextCursor = action.payload.meta?.nextCursor ?? null;
      })
      .addCase(fetchHistoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load history';
      })
      .addCase(fetchStatsThunk.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchStatsThunk.rejected, (state) => {
        state.stats = null;
      })
      .addCase(deleteScanThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((item: any) => item.id !== action.payload);
      });
  },
});

// ── Varieties Slice ───────────────────────────────────────────
export const fetchVarietiesThunk = createAsyncThunk('varieties/fetch', varietyAPI.getAll);

const varietiesSlice = createSlice({
  name: 'varieties',
  initialState: { items: [], loading: false } as { items: any[]; loading: boolean },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVarietiesThunk.pending, (state) => { state.loading = true; })
      .addCase(fetchVarietiesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
      });
  },
});

// ── Store ─────────────────────────────────────────────────────
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    scan: scanSlice.reducer,
    history: historySlice.reducer,
    varieties: varietiesSlice.reducer,
  },
});

export const { setAuth, updateUser, logout } = authSlice.actions;
export const { clearScan } = scanSlice.actions;
export const { clearHistory } = historySlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
