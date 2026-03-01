/**
 * Intentional Prompt & Device Curation System
 * 
 * Replaces fully random prompt/device assignment with structured curation:
 * - Prompt categorization (type, emotional register, cognitive demand)
 * - Device categorization (type, difficulty, emotional affinity)
 * - Prompt-device pairing logic
 * - Per-user spaced repetition sequencing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPANDED_DEVICE_META, getCuratedPrompt } from './curatedPrompts';
import pb from './pocketbase';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type EmotionalRegister = 'reflective' | 'urgent' | 'melancholic' | 'celebratory' | 'intellectual' | 'provocative';
export type CognitiveDemand = 'low' | 'medium' | 'high';
export type DeviceDifficulty = 'foundational' | 'intermediate' | 'advanced';
export type DeviceType = 'rhetorical' | 'vocabulary';

export type DeviceMeta = {
  difficulty: DeviceDifficulty;
  emotionalAffinity: EmotionalRegister[];
  type: DeviceType;
};

export type PromptMeta = {
  text: string;
  author: string;
  emotionalRegister: EmotionalRegister;
  cognitiveDemand: CognitiveDemand;
};

export type DeviceQueueEntry = {
  id: string;
  lastSeen: string; // ISO date
  nextDue: string;  // ISO date
  rating: 'natural' | 'forced' | 'unseen';
  consecutiveNatural: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Device Metadata
// ─────────────────────────────────────────────────────────────────────────────

export const deviceMetadata: Record<string, DeviceMeta> = {
  // Foundational
  simile:          { difficulty: 'foundational', emotionalAffinity: ['reflective', 'celebratory'], type: 'rhetorical' },
  metaphor:        { difficulty: 'foundational', emotionalAffinity: ['reflective', 'melancholic', 'intellectual'], type: 'rhetorical' },
  alliteration:    { difficulty: 'foundational', emotionalAffinity: ['celebratory', 'provocative'], type: 'rhetorical' },
  hyperbole:       { difficulty: 'foundational', emotionalAffinity: ['urgent', 'celebratory', 'provocative'], type: 'rhetorical' },
  personification: { difficulty: 'foundational', emotionalAffinity: ['reflective', 'melancholic'], type: 'rhetorical' },
  anaphora:        { difficulty: 'foundational', emotionalAffinity: ['melancholic', 'urgent', 'celebratory'], type: 'rhetorical' },
  irony:           { difficulty: 'foundational', emotionalAffinity: ['provocative', 'intellectual'], type: 'rhetorical' },
  
  // Intermediate
  juxtaposition:   { difficulty: 'intermediate', emotionalAffinity: ['intellectual', 'provocative'], type: 'rhetorical' },
  antithesis:      { difficulty: 'intermediate', emotionalAffinity: ['intellectual', 'urgent'], type: 'rhetorical' },
  oxymoron:        { difficulty: 'intermediate', emotionalAffinity: ['melancholic', 'intellectual'], type: 'rhetorical' },
  euphemism:       { difficulty: 'intermediate', emotionalAffinity: ['reflective', 'melancholic'], type: 'rhetorical' },
  assonance:       { difficulty: 'intermediate', emotionalAffinity: ['reflective', 'celebratory'], type: 'rhetorical' },
  climax:          { difficulty: 'intermediate', emotionalAffinity: ['urgent', 'celebratory'], type: 'rhetorical' },
  pathos:          { difficulty: 'intermediate', emotionalAffinity: ['melancholic', 'urgent'], type: 'rhetorical' },
  ethos:           { difficulty: 'intermediate', emotionalAffinity: ['intellectual', 'reflective'], type: 'rhetorical' },
  logos:           { difficulty: 'intermediate', emotionalAffinity: ['intellectual'], type: 'rhetorical' },
  allusion:        { difficulty: 'intermediate', emotionalAffinity: ['intellectual', 'reflective'], type: 'rhetorical' },
  
  // Advanced
  polysyndeton:    { difficulty: 'advanced', emotionalAffinity: ['urgent', 'melancholic'], type: 'rhetorical' },
  asyndeton:       { difficulty: 'advanced', emotionalAffinity: ['urgent', 'provocative'], type: 'rhetorical' },
  chiasmus:        { difficulty: 'advanced', emotionalAffinity: ['intellectual', 'provocative'], type: 'rhetorical' },
  litotes:         { difficulty: 'advanced', emotionalAffinity: ['reflective', 'intellectual'], type: 'rhetorical' },
  synecdoche:      { difficulty: 'advanced', emotionalAffinity: ['intellectual'], type: 'rhetorical' },
  apostrophe:      { difficulty: 'advanced', emotionalAffinity: ['melancholic', 'urgent', 'celebratory'], type: 'rhetorical' },
  paradox:         { difficulty: 'advanced', emotionalAffinity: ['intellectual', 'provocative'], type: 'rhetorical' },
  allegory:        { difficulty: 'advanced', emotionalAffinity: ['reflective', 'intellectual'], type: 'rhetorical' },
};

// Vocabulary with semantic affinity
export const vocabMetadata: Record<string, { semanticThemes: string[]; difficulty: DeviceDifficulty }> = {
  ephemeral:    { semanticThemes: ['fragility', 'time', 'beauty'], difficulty: 'foundational' },
  serendipity:  { semanticThemes: ['chance', 'joy', 'discovery'], difficulty: 'foundational' },
  luminous:     { semanticThemes: ['light', 'beauty', 'clarity'], difficulty: 'foundational' },
  reverie:      { semanticThemes: ['dreams', 'reflection', 'escape'], difficulty: 'foundational' },
  sanguine:     { semanticThemes: ['hope', 'optimism', 'resilience'], difficulty: 'intermediate' },
  equanimity:   { semanticThemes: ['calm', 'balance', 'resilience'], difficulty: 'intermediate' },
  mellifluous:  { semanticThemes: ['beauty', 'sound', 'pleasure'], difficulty: 'intermediate' },
  iridescent:   { semanticThemes: ['light', 'beauty', 'change'], difficulty: 'intermediate' },
  petrichor:    { semanticThemes: ['nature', 'memory', 'senses'], difficulty: 'intermediate' },
  halcyon:      { semanticThemes: ['peace', 'nostalgia', 'time'], difficulty: 'intermediate' },
  quixotic:     { semanticThemes: ['idealism', 'futility', 'dreams'], difficulty: 'advanced' },
  labyrinth:    { semanticThemes: ['complexity', 'journey', 'mystery'], difficulty: 'advanced' },
  penumbra:     { semanticThemes: ['ambiguity', 'shadow', 'boundary'], difficulty: 'advanced' },
  ineffable:    { semanticThemes: ['mystery', 'beauty', 'limits'], difficulty: 'advanced' },
  susurrus:     { semanticThemes: ['sound', 'nature', 'quiet'], difficulty: 'advanced' },
  liminal:      { semanticThemes: ['boundary', 'change', 'ambiguity'], difficulty: 'advanced' },
  gossamer:     { semanticThemes: ['fragility', 'beauty', 'delicacy'], difficulty: 'advanced' },
  soliloquy:    { semanticThemes: ['self', 'expression', 'theater'], difficulty: 'advanced' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Prompt Metadata
// ─────────────────────────────────────────────────────────────────────────────

export const promptMetadata: PromptMeta[] = [
  { text: 'To be or not to be', author: 'William Shakespeare', emotionalRegister: 'melancholic', cognitiveDemand: 'high' },
  { text: 'I think, therefore I am', author: 'René Descartes', emotionalRegister: 'intellectual', cognitiveDemand: 'high' },
  { text: 'The only constant is change', author: 'Heraclitus', emotionalRegister: 'reflective', cognitiveDemand: 'medium' },
  { text: 'Less is more', author: 'Ludwig Mies van der Rohe', emotionalRegister: 'reflective', cognitiveDemand: 'low' },
  { text: 'Time heals all wounds', author: '', emotionalRegister: 'melancholic', cognitiveDemand: 'low' },
  { text: 'Fortune favors the bold', author: 'Virgil', emotionalRegister: 'urgent', cognitiveDemand: 'low' },
  { text: 'Knowledge is power', author: 'Francis Bacon', emotionalRegister: 'intellectual', cognitiveDemand: 'low' },
  { text: 'All that glitters is not gold', author: 'William Shakespeare', emotionalRegister: 'provocative', cognitiveDemand: 'medium' },
  { text: 'The pen is mightier than the sword', author: 'Edward Bulwer-Lytton', emotionalRegister: 'intellectual', cognitiveDemand: 'medium' },
  { text: 'Every cloud has a silver lining', author: '', emotionalRegister: 'celebratory', cognitiveDemand: 'low' },
  { text: 'Curiosity killed the cat', author: '', emotionalRegister: 'provocative', cognitiveDemand: 'low' },
  { text: 'You reap what you sow', author: '', emotionalRegister: 'reflective', cognitiveDemand: 'low' },
  { text: 'Where there\'s smoke there\'s fire', author: '', emotionalRegister: 'urgent', cognitiveDemand: 'low' },
  { text: 'Out of sight, out of mind', author: '', emotionalRegister: 'melancholic', cognitiveDemand: 'low' },
  { text: 'When it rains it pours', author: '', emotionalRegister: 'melancholic', cognitiveDemand: 'low' },
  { text: 'The early bird catches the worm', author: '', emotionalRegister: 'urgent', cognitiveDemand: 'low' },
  { text: 'A picture is worth a thousand words', author: '', emotionalRegister: 'reflective', cognitiveDemand: 'medium' },
  { text: 'Birds of a feather flock together', author: '', emotionalRegister: 'reflective', cognitiveDemand: 'low' },
  { text: 'Act in haste, repent at leisure', author: '', emotionalRegister: 'reflective', cognitiveDemand: 'medium' },
  { text: 'The apple doesn\'t fall far', author: '', emotionalRegister: 'reflective', cognitiveDemand: 'low' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Queue Management
// ─────────────────────────────────────────────────────────────────────────────

const QUEUE_KEY = 'pensee_device_queue';
const SESSION_COUNT_KEY = 'pensee_session_count';

// Spaced repetition intervals (days)
const NATURAL_INTERVAL = 14;       // Return after 14 days if rated natural once
const MAINTENANCE_INTERVAL = 30;   // Return after 30 days once mastered (2+ consecutive natural)
const FORCED_INTERVAL = 3;         // Return within 3 days if rated forced
const MASTERY_THRESHOLD = 2;       // Consecutive natural ratings to consider mastered

export async function getSessionCount(): Promise<number> {
  // Try PocketBase first if authenticated
  if (pb.authStore.isValid && pb.authStore.record?.id) {
    try {
      const record = await pb.collection('users').getOne(pb.authStore.record.id);
      if (record['sessionCount'] != null) {
        const count = Number(record['sessionCount']);
        // Sync local
        await AsyncStorage.setItem(SESSION_COUNT_KEY, String(count));
        return count;
      }
    } catch {}
  }
  try {
    const val = await AsyncStorage.getItem(SESSION_COUNT_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch { return 0; }
}

export async function incrementSessionCount(): Promise<number> {
  const count = await getSessionCount();
  const next = count + 1;
  await AsyncStorage.setItem(SESSION_COUNT_KEY, String(next));
  // Sync to PocketBase
  if (pb.authStore.isValid && pb.authStore.record?.id) {
    try {
      await pb.collection('users').update(pb.authStore.record.id, {
        sessionCount: next,
      });
    } catch {}
  }
  return next;
}

async function getDeviceQueue(): Promise<Record<string, DeviceQueueEntry>> {
  // Try PocketBase first if authenticated
  if (pb.authStore.isValid && pb.authStore.record?.id) {
    try {
      const record = await pb.collection('users').getOne(pb.authStore.record.id);
      if (record['deviceQueue']) {
        const queue = JSON.parse(record['deviceQueue'] as string);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        return queue;
      }
    } catch {}
  }
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function saveDeviceQueue(queue: Record<string, DeviceQueueEntry>): Promise<void> {
  const json = JSON.stringify(queue);
  await AsyncStorage.setItem(QUEUE_KEY, json);
  // Sync to PocketBase
  if (pb.authStore.isValid && pb.authStore.record?.id) {
    try {
      await pb.collection('users').update(pb.authStore.record.id, {
        deviceQueue: json,
      });
    } catch {}
  }
}

export async function updateDeviceRating(
  deviceId: string,
  rating: 'natural' | 'forced'
): Promise<void> {
  const queue = await getDeviceQueue();
  const today = new Date().toISOString().split('T')[0];
  const entry = queue[deviceId] || {
    id: deviceId,
    lastSeen: today,
    nextDue: today,
    rating: 'unseen',
    consecutiveNatural: 0,
  };

  entry.lastSeen = today;
  entry.rating = rating;

  if (rating === 'natural') {
    entry.consecutiveNatural += 1;
    const interval = entry.consecutiveNatural >= MASTERY_THRESHOLD ? MAINTENANCE_INTERVAL : NATURAL_INTERVAL;
    const next = new Date();
    next.setDate(next.getDate() + interval);
    entry.nextDue = next.toISOString().split('T')[0];
  } else {
    entry.consecutiveNatural = 0;
    const next = new Date();
    next.setDate(next.getDate() + FORCED_INTERVAL);
    entry.nextDue = next.toISOString().split('T')[0];
  }

  queue[deviceId] = entry;
  await saveDeviceQueue(queue);
}

// ─────────────────────────────────────────────────────────────────────────────
// Curated Selection
// ─────────────────────────────────────────────────────────────────────────────

function getAvailableDifficulties(sessionCount: number): DeviceDifficulty[] {
  if (sessionCount >= 25) return ['foundational', 'intermediate', 'advanced'];
  if (sessionCount >= 10) return ['foundational', 'intermediate'];
  return ['foundational'];
}

export async function getCuratedSelection(date: Date): Promise<{
  prompt: PromptMeta;
  devices: string[];
  vocabWord: string;
  isNewDevice: boolean;
}> {
  const sessionCount = await getSessionCount();
  const queue = await getDeviceQueue();
  const today = date.toISOString().split('T')[0];

  // Use the new curated prompt system for quote + initial device candidates
  const seenDeviceIds = new Set(
    Object.keys(queue).filter(id => queue[id]?.rating !== 'unseen'),
  );
  const curatedResult = getCuratedPrompt(date, sessionCount, seenDeviceIds);

  const availableDifficulties = getAvailableDifficulties(sessionCount);
  const seed = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));

  // Build candidate device pool from the expanded metadata
  const allDevices = Object.keys(EXPANDED_DEVICE_META);
  const availableDevices = allDevices.filter(d =>
    availableDifficulties.includes(EXPANDED_DEVICE_META[d].difficulty),
  );

  const selected: string[] = [...curatedResult.devices];
  let isNewDevice = false;

  // Override second slot with a "developing" device if one is due
  const dueDevices = availableDevices.filter(d => {
    const entry = queue[d];
    return entry && entry.rating === 'forced' && entry.nextDue <= today && !selected.includes(d);
  });
  if (dueDevices.length > 0) {
    // Replace the second device with the due one
    selected[1] = dueDevices[seed % dueDevices.length];
  }

  // Mark as new device if any selected device has never been seen
  isNewDevice = selected.some(d => !queue[d]);

  // Ensure exactly 2 devices
  while (selected.length < 2) {
    const remaining = availableDevices.filter(d => !selected.includes(d));
    if (remaining.length === 0) break;
    selected.push(remaining[(seed + selected.length) % remaining.length]);
  }

  // Build PromptMeta-compatible object from the curated quote
  const prompt: PromptMeta = {
    text: curatedResult.quote.quote,
    author: curatedResult.quote.author,
    emotionalRegister: 'reflective',
    cognitiveDemand: 'medium',
  };

  return {
    prompt,
    devices: selected.slice(0, 2),
    vocabWord: curatedResult.vocabWord,
    isNewDevice,
  };
}
