import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Session = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  wordCount: number;
  writing: string;
  vocab: string;
  devices: string;
  good: string;
  bad: string;
  thoughts: string;
};

export type Stats = {
  totalSessions: number;
  averageWordCount: number;
  streak: number;
  longestStreak: number;
  totalWords: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const SESSIONS_KEY = 'embellish_sessions_v2';

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<Session[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as Session[]) : [];
  } catch {
    return [];
  }
}

export async function saveSession(session: Omit<Session, 'id'>): Promise<Session> {
  const sessions = await getSessions();
  const newSession: Session = { ...session, id: Date.now().toString() };

  // Replace any existing session for the same day so today's entry is always fresh
  const without = sessions.filter((s) => s.date !== session.date);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify([...without, newSession]));
  return newSession;
}

export async function getSessionByDate(dateStr: string): Promise<Session | null> {
  const sessions = await getSessions();
  return sessions.find((s) => s.date === dateStr) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

function calcStreaks(sessions: Session[]): { streak: number; longestStreak: number } {
  if (sessions.length === 0) return { streak: 0, longestStreak: 0 };

  const dateSet = new Set(sessions.map((s) => s.date));

  // Current streak: walk backward from today
  let streak = 0;
  const today = new Date();
  const d = new Date(today);

  // If today has no session yet, allow streak to start from yesterday
  if (!dateSet.has(toDateString(d))) {
    d.setDate(d.getDate() - 1);
  }

  while (dateSet.has(toDateString(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  // Longest streak: scan sorted dates
  const sorted = Array.from(dateSet).sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return { streak, longestStreak: longest };
}

export async function getStats(): Promise<Stats> {
  const sessions = await getSessions();

  if (sessions.length === 0) {
    return { totalSessions: 0, averageWordCount: 0, streak: 0, longestStreak: 0, totalWords: 0 };
  }

  const totalSessions = sessions.length;
  const totalWords = sessions.reduce((sum, s) => sum + s.wordCount, 0);
  const averageWordCount = Math.round(totalWords / totalSessions);
  const { streak, longestStreak } = calcStreaks(sessions);

  return { totalSessions, averageWordCount, streak, longestStreak, totalWords };
}
