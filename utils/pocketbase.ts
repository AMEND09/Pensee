import AsyncStorage from '@react-native-async-storage/async-storage';
import PocketBase, { AsyncAuthStore } from 'pocketbase';

// ─────────────────────────────────────────────────────────────────────────────
// PocketBase client
// ─────────────────────────────────────────────────────────────────────────────

// Set EXPO_PUBLIC_POCKETBASE_URL in your .env file.
// e.g. EXPO_PUBLIC_POCKETBASE_URL=https://your-pocketbase-instance.com
const POCKETBASE_URL =
  process.env['EXPO_PUBLIC_POCKETBASE_URL'] ?? 'https://your-pocketbase-instance.com';

const AUTH_STORE_KEY = 'pb_auth_store';

// AsyncAuthStore automatically persists tokens via the save/clear hooks.
const store = new AsyncAuthStore({
  save: async (serialized) => {
    await AsyncStorage.setItem(AUTH_STORE_KEY, serialized);
  },
  initial: '',
  clear: async () => {
    await AsyncStorage.removeItem(AUTH_STORE_KEY);
  },
});

export const pb = new PocketBase(POCKETBASE_URL, store);

// Restore any previously saved token on startup.
// Reads the serialized { token, record } JSON from AsyncStorage and calls
// pb.authStore.save() to re-hydrate the in-memory auth state.
export const pbReady: Promise<void> = AsyncStorage.getItem(AUTH_STORE_KEY).then(
  (serialized) => {
    if (serialized) {
      try {
        const parsed = JSON.parse(serialized) as { token?: string; record?: unknown };
        pb.authStore.save(parsed.token ?? '', (parsed.record ?? null) as any);
      } catch {
        // Ignore malformed stored data — user starts unauthenticated
      }
    }
  },
  () => { /* Ignore read errors — user starts unauthenticated */ },
);

export default pb;
