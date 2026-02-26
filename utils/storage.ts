import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateString, normalizeDateString } from './dates';
import pb from './pocketbase';

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
  /** URI or base64 of any scanned image captured during the session */
  image?: string;
  /** the creative prompt word used during the session */
  prompt?: string;
  /** author of the quote prompt, if applicable */
  quoteAuthor?: string;
  /** technique words chosen for the prompt */
  terms?: { id: string; label: string }[];
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

const SESSIONS_KEY = 'pensee_sessions_v2';

// Map a PocketBase record to a Session
function pbRecordToSession(record: Record<string, any>): Session {
  return {
    id: record['id'] as string,
    // ensure we treat the incoming value as a local calendar day regardless of
    // the server's timezone
    date: normalizeDateString(record['date'] as string),
    wordCount: (record['wordCount'] as number) ?? 0,
    writing: (record['writing'] as string) ?? '',
    vocab: (record['vocab'] as string) ?? '',
    devices: (record['devices'] as string) ?? '',
    good: (record['good'] as string) ?? '',
    bad: (record['bad'] as string) ?? '',
    thoughts: (record['thoughts'] as string) ?? '',
    image: record['image'] as string | undefined,
    prompt: record['prompt'] as string | undefined,
    quoteAuthor: record['quoteAuthor'] as string | undefined,
    terms: (() => {
      if (!record['terms']) return undefined;
      try { return JSON.parse(record['terms'] as string); } catch { return undefined; }
    })(),
  };
}

function toDateString(d: Date): string {
  // previously we used toISOString() which returns the UTC day; that could
  // push the value forward/back depending on the user's offset.  keep things
  // in the local timezone instead.
  return localDateString(d);
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

/** Read from PocketBase if authenticated, otherwise fall back to AsyncStorage */
export async function getSessions(): Promise<Session[]> {
  if (pb.authStore.isValid) {
    try {
      const records = await pb.collection('sessions').getFullList({
        sort: '-date,-created',
        filter: pb.filter('user = {:userId}', { userId: pb.authStore.record?.id ?? '' }),
      });
      return records.map(pbRecordToSession);
    } catch {
      // Fall through to local storage if network fails
    }
  }

  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as Session[]) : [];
  } catch {
    return [];
  }
}

/** Save to PocketBase if authenticated, otherwise save locally */
export async function saveSession(session: Omit<Session, 'id'>): Promise<Session> {
  // make sure the date is in normalized `YYYY-MM-DD` form before storing
  const normalizedDate = normalizeDateString(session.date);

  if (pb.authStore.isValid) {
    try {
      const record = await pb.collection('sessions').create({
        user: pb.authStore.record?.id,
        date: normalizedDate,
        wordCount: session.wordCount,
        writing: session.writing,
        vocab: session.vocab,
        devices: session.devices,
        good: session.good,
        bad: session.bad,
        thoughts: session.thoughts,
        image: session.image,
        prompt: session.prompt,
        quoteAuthor: session.quoteAuthor ?? null,
        terms: session.terms ? JSON.stringify(session.terms) : null,
      });
      return pbRecordToSession(record);
    } catch {
      // Fall through to local storage if network fails
    }
  }

  const sessions = await getLocalSessions();
  const newSession: Session = {
    ...session,
    date: normalizedDate,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify([...sessions, newSession]));
  return newSession;
}

async function getLocalSessions(): Promise<Session[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as Session[]) : [];
  } catch {
    return [];
  }
}

export async function getSessionByDate(dateStr: string): Promise<Session | null> {
  const sessions = await getSessions();
  const norm = normalizeDateString(dateStr);
  return sessions.find((s) => s.date === norm) ?? null;
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
