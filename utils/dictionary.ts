// dictionary.ts
// Provides a thin wrapper around dictionaryapi.dev.  All local lexicon
// content has been removed; definitions are always fetched online.

export type OnlineEntry = {
  type: string;
  definition: string;
  example: string;
  synonyms: string[];
  antonyms: string[];
  /** All meanings from the API, each with its own definitions + thesaurus data */
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{ definition: string; example?: string; synonyms: string[]; antonyms: string[] }>;
    synonyms: string[];
    antonyms: string[];
  }>;
};

/**
 * Fetch definition + full thesaurus data from dictionaryapi.dev.
 * Collects synonyms and antonyms across ALL meanings/definitions for richer results.
 * Returns null if the word is not found or if an error occurs.
 */
import { rhetoricalDefinitions, rhetoricalExamples } from './prompts';

export function normalizeTermKey(term: string): string {
  return term.trim().toLowerCase();
}

export async function fetchOnlineDefinition(term: string): Promise<OnlineEntry | null> {
  const normalizedTerm = normalizeTermKey(term);

  // if the term is one of the predefined rhetorical devices, return a
  // fabricated entry containing only the supplied examples/definitions and
  // avoid any network request.  previously logic only checked the examples map
  // but we now also maintain definitions locally, so include that as well.
  if (
    Object.prototype.hasOwnProperty.call(rhetoricalExamples, normalizedTerm) ||
    Object.prototype.hasOwnProperty.call(rhetoricalDefinitions, normalizedTerm)
  ) {
    const examples = rhetoricalExamples[normalizedTerm] || [];
    const def = rhetoricalDefinitions[normalizedTerm] || '';
    const meanings = [
      {
        partOfSpeech: 'rhetorical device',
        definitions: examples.map((ex) => ({ definition: '', example: ex, synonyms: [], antonyms: [] })),
        synonyms: [],
        antonyms: [],
      },
    ];
    return {
      type: 'rhetorical device',
      definition: def,
      example: '',
      synonyms: [],
      antonyms: [],
      meanings,
    };
  }

  try {
    const resp = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedTerm)}`
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];
    if (!entry.meanings || entry.meanings.length === 0) return null;

    // Collect ALL synonyms and antonyms across all meanings and definitions
    const allSynonyms = new Set<string>();
    const allAntonyms = new Set<string>();

    const meanings = entry.meanings.map((m: any) => {
      // Meaning-level synonyms/antonyms
      (m.synonyms || []).forEach((s: string) => allSynonyms.add(s));
      (m.antonyms || []).forEach((a: string) => allAntonyms.add(a));

      const definitions = (m.definitions || []).map((d: any) => {
        (d.synonyms || []).forEach((s: string) => allSynonyms.add(s));
        (d.antonyms || []).forEach((a: string) => allAntonyms.add(a));
        return {
          definition: d.definition || '',
          example: d.example || '',
          synonyms: d.synonyms || [],
          antonyms: d.antonyms || [],
        };
      });

      return {
        partOfSpeech: m.partOfSpeech || '',
        definitions,
        synonyms: m.synonyms || [],
        antonyms: m.antonyms || [],
      };
    });

    // Primary info from first meaning
    const firstMeaning = meanings[0];
    const firstDef = firstMeaning.definitions[0];

    return {
      type: firstMeaning.partOfSpeech,
      definition: firstDef?.definition ?? '',
      example: firstDef?.example ?? '',
      synonyms: [...allSynonyms],
      antonyms: [...allAntonyms],
      meanings,
    };
  } catch (_) {
    return null;
  }
}
