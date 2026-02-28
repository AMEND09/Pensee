/**
 * Writing Growth Analytics
 * 
 * Science-based metrics for tracking writing development:
 * - Type-Token Ratio (TTR) for vocabulary diversity
 * - Weekly session tracking against goals
 * - Milestone detection for growth feedback
 */

import type { Session } from './storage';

/**
 * Calculate Type-Token Ratio (vocabulary diversity score).
 * TTR = unique words / total words. Higher = more diverse vocabulary.
 * Research: Templin (1957), Malvern et al. (2004) — TTR correlates with
 * writing maturity and lexical sophistication.
 */
export function calculateTTR(text: string): number {
  const cleaned = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .toLowerCase()
    .trim();
  
  if (!cleaned) return 0;
  
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;
  
  const uniqueWords = new Set(words);
  return uniqueWords.size / words.length;
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
