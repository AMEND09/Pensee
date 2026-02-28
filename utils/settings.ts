import AsyncStorage from '@react-native-async-storage/async-storage';
import pb from './pocketbase';

export type Settings = {
  sessionDurationMinutes: number;
  weeklyGoalSessions: number;
  showComplexityScore: boolean;
};

const SETTINGS_KEY = 'pensee_settings';

export const MIN_SESSION_DURATION = 1;
export const MAX_SESSION_DURATION = 60;
export const MIN_WEEKLY_GOAL = 1;
export const MAX_WEEKLY_GOAL = 7;

export const DEFAULT_SETTINGS: Settings = {
  sessionDurationMinutes: 10,
  weeklyGoalSessions: 5,
  showComplexityScore: true,
};

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = { ...current, ...partial };
  
  // Clamp values
  next.sessionDurationMinutes = Math.max(MIN_SESSION_DURATION, Math.min(MAX_SESSION_DURATION, next.sessionDurationMinutes));
  next.weeklyGoalSessions = Math.max(MIN_WEEKLY_GOAL, Math.min(MAX_WEEKLY_GOAL, next.weeklyGoalSessions));
  
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  
  // Sync to PocketBase if authenticated
  if (pb.authStore.isValid && pb.authStore.record?.id) {
    try {
      await pb.collection('users').update(pb.authStore.record.id, {
        settings: JSON.stringify(next),
      });
    } catch {
      // Silently fail — local settings are authoritative
    }
  }
  
  return next;
}

export async function syncSettingsFromCloud(): Promise<Settings> {
  if (pb.authStore.isValid && pb.authStore.record?.id) {
    try {
      const record = await pb.collection('users').getOne(pb.authStore.record.id);
      if (record['settings']) {
        const cloud = JSON.parse(record['settings'] as string);
        const merged = { ...DEFAULT_SETTINGS, ...cloud };
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
        return merged;
      }
    } catch {}
  }
  return getSettings();
}
