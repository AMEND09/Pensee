/**
 * Writing Growth Analytics
 * 
 * Science-based metrics for tracking writing development:
 * - Type-Token Ratio (TTR) for vocabulary diversity, with corrected TTR (CTTR)
 *   for length-independent comparison
 * - Flesch-Kincaid readability scoring
 * - Sentence variety analysis
 * - Weekly session tracking against goals
 * - Milestone detection for growth feedback
 */

import type { Session } from './storage';

// ─────────────────────────────────────────────────────────────────────────────
// Text tokenisation helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Strip HTML/markup and non-alpha characters, returning lowercase tokens. */
function tokenize(text: string): string[] {
  const cleaned = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .toLowerCase()
    .trim();
  if (!cleaned) return [];
  return cleaned.split(/\s+/).filter(w => w.length > 0);
}

/** Count syllables in a single English word (heuristic). */
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 2) return 1;

  // trailing silent-e
  let adjusted = w.replace(/e$/, '');
  // count vowel groups
  const matches = adjusted.match(/[aeiouy]+/g);
  const count = matches ? matches.length : 1;
  return Math.max(1, count);
}

/** Split text into sentences using common delimiters. */
function splitSentences(text: string): string[] {
  // Strip HTML first
  const plain = text.replace(/<[^>]*>/g, ' ');
  // Split on sentence-ending punctuation followed by space or end-of-string
  const sentences = plain
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  return sentences.length > 0 ? sentences : [plain.trim()].filter(s => s.length > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Vocabulary diversity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate Type-Token Ratio (vocabulary diversity score).
 * TTR = unique words / total words. Higher = more diverse vocabulary.
 * Research: Templin (1957), Malvern et al. (2004) — TTR correlates with
 * writing maturity and lexical sophistication.
 *
 * NOTE: Raw TTR is length-dependent (shorter texts score higher). For
 * cross-session comparison prefer `calculateCTTR()`.
 */
export function calculateTTR(text: string): number {
  const words = tokenize(text);
  if (words.length === 0) return 0;
  const uniqueWords = new Set(words);
  return uniqueWords.size / words.length;
}

/**
 * Corrected Type-Token Ratio (CTTR) — Carroll (1964).
 * CTTR = unique_types / sqrt(2 * total_tokens)
 *
 * Unlike raw TTR, CTTR is far less sensitive to text length, making
 * session-over-session comparison meaningful even when word counts differ.
 * Returns a value typically between 0 and ~10; higher = more diverse.
 */
export function calculateCTTR(text: string): number {
  const words = tokenize(text);
  if (words.length === 0) return 0;
  const uniqueWords = new Set(words);
  return uniqueWords.size / Math.sqrt(2 * words.length);
}

/**
 * Get a human-readable label for a TTR score.
 */
export function getTTRLabel(ttr: number): { label: string; description: string } {
  if (ttr >= 0.75) return { label: 'Exceptional', description: 'Your vocabulary range is outstanding.' };
  if (ttr >= 0.60) return { label: 'Rich', description: 'Strong vocabulary diversity.' };
  if (ttr >= 0.45) return { label: 'Developing', description: 'Good variety — keep exploring new words.' };
  if (ttr >= 0.30) return { label: 'Emerging', description: 'Try incorporating more varied language.' };
  return { label: 'Focused', description: 'Repetition can be powerful — or a habit to break.' };
}

/**
 * Get a human-readable label for a CTTR score.
 * Thresholds calibrated for timed freewriting sessions (100–600 words).
 */
export function getCTTRLabel(cttr: number): { label: string; description: string } {
  if (cttr >= 7.0) return { label: 'Exceptional', description: 'Remarkably varied vocabulary for this length.' };
  if (cttr >= 5.5) return { label: 'Rich', description: 'Strong vocabulary diversity across your writing.' };
  if (cttr >= 4.0) return { label: 'Developing', description: 'Good variety — keep exploring new words.' };
  if (cttr >= 2.5) return { label: 'Emerging', description: 'Try incorporating more varied language.' };
  return { label: 'Focused', description: 'Repetition can be powerful — or a habit to break.' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Readability
// ─────────────────────────────────────────────────────────────────────────────

export type ReadabilityResult = {
  /** Flesch Reading Ease score (0–100, higher = easier to read). */
  fleschReadingEase: number;
  /** Human-readable grade label. */
  gradeLabel: string;
  /** Brief description of the readability level. */
  description: string;
  /** Average words per sentence. */
  avgWordsPerSentence: number;
  /** Average syllables per word. */
  avgSyllablesPerWord: number;
  /** Total sentence count in the text. */
  sentenceCount: number;
  /** Total word count used in the calculation. */
  wordCount: number;
};

/**
 * Calculate Flesch Reading Ease score.
 *
 * Formula: 206.835 − 1.015 × (words/sentences) − 84.6 × (syllables/words)
 * Reference: Flesch (1948), "A New Readability Yardstick"
 *
 * Score ranges:
 *   90–100  Very easy (5th grade)
 *   80–89   Easy (6th grade)
 *   70–79   Fairly easy (7th grade)
 *   60–69   Standard (8th–9th grade)
 *   50–59   Fairly difficult (10th–12th grade)
 *   30–49   Difficult (college)
 *   0–29    Very difficult (graduate / professional)
 */
export function calculateReadability(text: string): ReadabilityResult | null {
  const words = tokenize(text);
  const sentences = splitSentences(text);

  if (words.length < 10 || sentences.length === 0) return null; // too short for meaningful score

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  const fre = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  const clamped = Math.max(0, Math.min(100, Math.round(fre * 10) / 10));

  let gradeLabel: string;
  let description: string;

  if (clamped >= 90) {
    gradeLabel = 'Very Easy';
    description = 'Conversational and accessible — anyone can follow this.';
  } else if (clamped >= 80) {
    gradeLabel = 'Easy';
    description = 'Clear and straightforward prose.';
  } else if (clamped >= 70) {
    gradeLabel = 'Fairly Easy';
    description = 'Readable for most audiences.';
  } else if (clamped >= 60) {
    gradeLabel = 'Standard';
    description = 'Typical of quality journalism and essays.';
  } else if (clamped >= 50) {
    gradeLabel = 'Fairly Difficult';
    description = 'Sophisticated sentence structure and vocabulary.';
  } else if (clamped >= 30) {
    gradeLabel = 'Difficult';
    description = 'Dense, complex prose — academic or literary in style.';
  } else {
    gradeLabel = 'Very Difficult';
    description = 'Highly complex — consider varying sentence length.';
  }

  return {
    fleschReadingEase: clamped,
    gradeLabel,
    description,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    sentenceCount: sentences.length,
    wordCount: words.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sentence variety
// ─────────────────────────────────────────────────────────────────────────────

export type SentenceVarietyResult = {
  /** Standard deviation of sentence lengths (in words). Higher = more varied. */
  lengthVariation: number;
  /** Human label for the variation level. */
  label: string;
  /** Brief guidance. */
  description: string;
  /** Array of individual sentence word-counts, for potential charting. */
  sentenceLengths: number[];
};

/**
 * Measure how much sentence length varies in the text.
 * Uniform sentence length (low SD) can make writing monotonous; high
 * variation signals rhythmic variety — a marker of mature prose.
 */
export function calculateSentenceVariety(text: string): SentenceVarietyResult | null {
  const sentences = splitSentences(text);
  if (sentences.length < 3) return null; // need at least 3 sentences

  const lengths = sentences.map(s => {
    const words = s.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length > 0);
    return words.length;
  });

  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  const sd = Math.round(Math.sqrt(variance) * 10) / 10;

  let label: string;
  let description: string;

  if (sd >= 10) {
    label = 'Highly Varied';
    description = 'Excellent rhythmic range — your sentences breathe.';
  } else if (sd >= 6) {
    label = 'Good Variety';
    description = 'Nice mix of short punches and longer phrases.';
  } else if (sd >= 3) {
    label = 'Moderate';
    description = 'Try mixing short and long sentences for more rhythm.';
  } else {
    label = 'Uniform';
    description = 'Your sentences are similar in length — vary the cadence.';
  }

  return { lengthVariation: sd, label, description, sentenceLengths: lengths };
}

/**
 * Count sessions completed in the current week (Monday–Sunday).
 */
export function getWeeklySessionCount(sessions: Session[]): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  
  return sessions.filter(s => {
    const sessionDate = new Date(s.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate >= monday;
  }).length;
}

/**
 * Get the day indices (0=Mon, 6=Sun) that have sessions this week.
 */
export function getWeeklySessionDays(sessions: Session[]): boolean[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  
  const days = [false, false, false, false, false, false, false];
  
  sessions.forEach(s => {
    const sessionDate = new Date(s.date);
    sessionDate.setHours(0, 0, 0, 0);
    if (sessionDate >= monday) {
      const idx = sessionDate.getDay();
      // Convert Sun=0 to index 6, Mon=1 to index 0, etc.
      const mondayIdx = idx === 0 ? 6 : idx - 1;
      days[mondayIdx] = true;
    }
  });
  
  return days;
}

/**
 * Detect growth milestones and return an appropriate message.
 * Based on deliberate practice theory (Ericsson, 1993) — consistent
 * practice with feedback leads to skill development.
 */
export function getGrowthInsight(totalSessions: number, streak: number, avgWords: number): string | null {
  // Milestone messages
  if (totalSessions === 1) return 'The hardest part is starting. You did that today.';
  if (totalSessions === 5) return 'Five sessions in. The habit is forming — research shows it takes about 66 days of repetition.';
  if (totalSessions === 10) return 'Double digits. Your brain is building new neural pathways for creative expression.';
  if (totalSessions === 25) return 'Twenty-five sessions. Studies show this level of practice begins to produce measurable skill gains.';
  if (totalSessions === 50) return 'Fifty sessions of freewriting. You\'ve now spent over 8 hours in deliberate creative practice.';
  if (totalSessions === 100) return 'One hundred sessions. You\'re in the top tier of consistent writers. This is where mastery begins.';
  
  // Streak milestones
  if (streak === 7) return 'A full week of daily writing. Consistency is the strongest predictor of writing improvement.';
  if (streak === 14) return 'Two weeks straight. Your writing brain is now warmed up every day — that\'s when breakthroughs happen.';
  if (streak === 30) return 'Thirty days of consecutive writing. You\'ve built what psychologists call an "implementation intention."';
  
  // Average word count milestones
  if (avgWords > 500 && totalSessions >= 5) return 'Averaging over 500 words per session — your fluency is accelerating.';
  if (avgWords > 300 && totalSessions >= 10) return 'Consistently writing 300+ words. Your inner editor is learning to step back.';
  
  return null;
}

/**
 * Calculate average TTR across recent sessions.
 * Assumes sessions are ordered with most recent first (date descending).
 */
export function getAverageTTR(sessions: Session[], count: number = 5): number {
  const recent = sessions.slice(0, count);
  if (recent.length === 0) return 0;
  
  const ttrs = recent.map(s => calculateTTR(s.writing));
  return ttrs.reduce((sum, t) => sum + t, 0) / ttrs.length;
}

/**
 * Calculate average CTTR across recent sessions.
 * Length-corrected so values are comparable even when session word counts differ.
 */
export function getAverageCTTR(sessions: Session[], count: number = 5): number {
  const recent = sessions.slice(0, count);
  if (recent.length === 0) return 0;

  const cttrs = recent.map(s => calculateCTTR(s.writing));
  return cttrs.reduce((sum, t) => sum + t, 0) / cttrs.length;
}
