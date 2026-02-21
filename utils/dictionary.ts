// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Entry = {
  type: string; // e.g. "rhetorical device", "noun", "adjective"
  definition: string;
  example: string;
  synonyms: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Master lexicon
// ─────────────────────────────────────────────────────────────────────────────

const entries: Record<string, Entry> = {
  // Rhetorical devices
  juxtaposition: {
    type: 'rhetorical device',
    definition:
      'The placement of two contrasting ideas, images, or characters side by side to highlight their differences and deepen meaning.',
    example: '"It was the best of times, it was the worst of times." — Charles Dickens',
    synonyms: ['contrast', 'opposition', 'comparison'],
  },
  polysyndeton: {
    type: 'rhetorical device',
    definition:
      'A stylistic device using several conjunctions in close succession, producing a sense of accumulation, weight, or relentless pace.',
    example:
      '"We shall fight on the beaches, and we shall fight on the landing grounds, and in the fields, and in the streets…" — Churchill',
    synonyms: ['accumulation', 'conjunction', 'listing'],
  },
  metaphor: {
    type: 'rhetorical device',
    definition:
      'A direct comparison between two unlike things — stating one is the other — without "like" or "as", creating vivid imagery.',
    example: '"All the world\'s a stage, and all the men and women merely players." — Shakespeare',
    synonyms: ['analogy', 'symbol', 'figure of speech'],
  },
  simile: {
    type: 'rhetorical device',
    definition:
      'A comparison between two unlike things using "like" or "as", making descriptions more vivid and relatable.',
    example: '"My heart is like a singing bird." — Christina Rossetti',
    synonyms: ['comparison', 'analogy', 'parallel'],
  },
  anaphora: {
    type: 'rhetorical device',
    definition:
      'The deliberate repetition of a word or phrase at the beginning of successive lines, clauses, or sentences for rhetorical effect.',
    example: '"I have a dream… I have a dream… I have a dream." — Martin Luther King Jr.',
    synonyms: ['repetition', 'refrain', 'iteration'],
  },
  ethos: {
    type: 'rhetorical device',
    definition:
      'An appeal to the speaker\'s credibility, authority, or ethical character to persuade an audience to trust them.',
    example: '"As a physician with thirty years of experience, I can tell you…"',
    synonyms: ['credibility', 'authority', 'character'],
  },
  pathos: {
    type: 'rhetorical device',
    definition:
      'An appeal to the emotions of the audience — sorrow, fear, or joy — to make an argument more persuasive.',
    example: '"Think of the children who go to sleep hungry every night."',
    synonyms: ['emotion', 'feeling', 'sentiment'],
  },
  logos: {
    type: 'rhetorical device',
    definition:
      'An appeal to logic and reason, using facts, evidence, and sound argument to convince an audience.',
    example: '"Studies show that 80% of participants improved significantly with this approach."',
    synonyms: ['logic', 'reason', 'evidence'],
  },
  hyperbole: {
    type: 'rhetorical device',
    definition:
      'Deliberate extreme exaggeration for emphasis, humor, or dramatic effect — never meant to be taken literally.',
    example: '"I\'ve told you a million times!"',
    synonyms: ['exaggeration', 'overstatement', 'amplification'],
  },
  alliteration: {
    type: 'rhetorical device',
    definition:
      'The repetition of the same initial consonant sound in closely connected words, creating a pleasing musical effect.',
    example: '"Peter Piper picked a peck of pickled peppers."',
    synonyms: ['consonance', 'sound repetition', 'rhyme'],
  },
  assonance: {
    type: 'rhetorical device',
    definition:
      'The repetition of vowel sounds in nearby words, creating internal rhyme and a sustained musical quality.',
    example: '"Hear the mellow wedding bells." — Edgar Allan Poe',
    synonyms: ['vowel rhyme', 'near rhyme', 'sound pattern'],
  },
  chiasmus: {
    type: 'rhetorical device',
    definition:
      'A rhetorical reversal in which the second clause mirrors the first in inverted grammatical order, balancing opposing ideas.',
    example:
      '"Ask not what your country can do for you — ask what you can do for your country." — JFK',
    synonyms: ['inversion', 'antimetabole', 'reversal'],
  },
  asyndeton: {
    type: 'rhetorical device',
    definition:
      'The deliberate omission of conjunctions between phrases, creating a rapid, clipped, or urgent effect.',
    example: '"I came, I saw, I conquered." — Julius Caesar',
    synonyms: ['ellipsis', 'omission', 'brevity'],
  },
  litotes: {
    type: 'rhetorical device',
    definition:
      'A form of understatement that affirms something by negating its opposite, often carrying irony or dry wit.',
    example: '"Not bad at all." (meaning excellent) "She\'s not exactly thrilled."',
    synonyms: ['understatement', 'irony', 'negation'],
  },
  oxymoron: {
    type: 'rhetorical device',
    definition:
      'A figure of speech pairing two contradictory terms together to produce a paradoxical but meaningful phrase.',
    example: '"Deafening silence." "Bittersweet." "Living death."',
    synonyms: ['paradox', 'contradiction', 'incongruity'],
  },
  personification: {
    type: 'rhetorical device',
    definition:
      'Attributing human characteristics, emotions, or actions to non-human things, animating them with vivid life.',
    example: '"The wind whispered secrets through the ancient trees."',
    synonyms: ['anthropomorphism', 'animation', 'humanization'],
  },
  apostrophe: {
    type: 'rhetorical device',
    definition:
      'Addressing an absent, imaginary, or abstract subject directly as if it were present and capable of responding.',
    example: '"O Death, where is thy sting?" — 1 Corinthians 15:55',
    synonyms: ['address', 'invocation', 'exclamation'],
  },
  antithesis: {
    type: 'rhetorical device',
    definition:
      'The juxtaposition of contrasting ideas in parallel grammatical structure, sharply emphasizing the contrast between them.',
    example: '"Give every man thy ear, but few thy voice." — Shakespeare',
    synonyms: ['contrast', 'opposition', 'paradox'],
  },
  climax: {
    type: 'rhetorical device',
    definition:
      'An arrangement of phrases or clauses in ascending order of importance, building toward the most powerful or dramatic point.',
    example: '"I came, I saw, I conquered." — Julius Caesar',
    synonyms: ['crescendo', 'escalation', 'gradation'],
  },
  euphemism: {
    type: 'rhetorical device',
    definition:
      'A mild or indirect expression substituted for one that might seem blunt, harsh, or offensive.',
    example: '"Passed away" instead of "died." "Let go" instead of "fired."',
    synonyms: ['softening', 'circumlocution', 'mitigation'],
  },
  synecdoche: {
    type: 'rhetorical device',
    definition:
      'A figure of speech in which a part is used to represent the whole, or vice versa, creating compact and resonant imagery.',
    example: '"All hands on deck." (hands represent sailors) "England won the match." (England represents its team)',
    synonyms: ['part for whole', 'metonymy', 'substitution'],
  },
  irony: {
    type: 'rhetorical device',
    definition:
      'The expression of meaning through language that normally denotes the opposite, often for humorous or emphatic effect.',
    example: '"Water, water, everywhere, nor any drop to drink." — Coleridge',
    synonyms: ['sarcasm', 'satire', 'incongruity'],
  },
  paradox: {
    type: 'rhetorical device',
    definition:
      'A statement that appears self-contradictory or absurd but on reflection reveals a deeper truth.',
    example: '"The more I know, the more I realize I know nothing." — Socrates',
    synonyms: ['contradiction', 'oxymoron', 'dilemma'],
  },
  allegory: {
    type: 'rhetorical device',
    definition:
      'A sustained narrative in which characters and events represent abstract ideas or moral qualities, conveying a deeper symbolic meaning.',
    example: '"Animal Farm" by George Orwell — a farm story that allegorizes political tyranny.',
    synonyms: ['parable', 'fable', 'symbol'],
  },
  allusion: {
    type: 'rhetorical device',
    definition:
      'A brief, indirect reference to a person, place, event, or work that the author assumes the reader will recognize.',
    example: '"He was a real Romeo with the ladies." (alluding to Shakespeare\'s Romeo)',
    synonyms: ['reference', 'citation', 'hint'],
  },

  // Vocabulary words
  ephemeral: {
    type: 'adjective',
    definition: 'Lasting for a very short time — fleeting and transient, passing before it can fully be grasped.',
    example: '"The beauty of cherry blossoms is entirely ephemeral — gone within a week."',
    synonyms: ['fleeting', 'transient', 'momentary', 'brief', 'fugitive'],
  },
  serendipity: {
    type: 'noun',
    definition:
      'The pleasant discovery of valuable or delightful things not actively sought — a fortunate, unplanned accident.',
    example: '"Pure serendipity led her to the book that would change her life."',
    synonyms: ['fortune', 'luck', 'chance', 'fluke', 'providence'],
  },
  quixotic: {
    type: 'adjective',
    definition:
      'Exceedingly idealistic, unrealistic, and impractical; inspired by noble but hopelessly improbable dreams.',
    example: '"His quixotic plan to reform city hall in a single summer was admirable but naive."',
    synonyms: ['idealistic', 'unrealistic', 'visionary', 'impractical', 'chivalrous'],
  },
  labyrinth: {
    type: 'noun',
    definition:
      'A complicated, winding network of paths in which it is difficult to find one\'s way; a bewildering tangle of complexity.',
    example: '"She navigated the labyrinth of bureaucratic forms with surprising patience."',
    synonyms: ['maze', 'tangle', 'complexity', 'web', 'puzzle'],
  },
  mellifluous: {
    type: 'adjective',
    definition: 'Sweet, smooth, and musical when heard — flowing as richly as honey.',
    example: '"Her mellifluous voice made even difficult poetry feel effortless."',
    synonyms: ['harmonious', 'dulcet', 'melodious', 'honeyed', 'lyrical'],
  },
  luminous: {
    type: 'adjective',
    definition:
      'Full of or shedding light; brilliantly shining — also, figuratively, radiant with intelligence or spirit.',
    example: '"Her luminous eyes reflected years of quiet wisdom."',
    synonyms: ['bright', 'radiant', 'glowing', 'brilliant', 'incandescent'],
  },
  sanguine: {
    type: 'adjective',
    definition:
      'Optimistic or positive, especially in the face of difficulty; confidently cheerful.',
    example: '"Despite the setbacks, he remained sanguine about the project\'s future."',
    synonyms: ['optimistic', 'hopeful', 'buoyant', 'confident', 'cheerful'],
  },
  equanimity: {
    type: 'noun',
    definition:
      'Mental calmness and composure, especially in the midst of difficulty; a steady, unruffled temperament.',
    example: '"She received the terrible news with remarkable equanimity."',
    synonyms: ['composure', 'serenity', 'poise', 'calmness', 'tranquility'],
  },
  reverie: {
    type: 'noun',
    definition:
      'A state of being pleasantly lost in one\'s thoughts; a waking daydream of absorbing fantasy.',
    example: '"He sat at the window, lost in a reverie about forests he had never visited."',
    synonyms: ['daydream', 'fantasy', 'musing', 'meditation', 'trance'],
  },
  penumbra: {
    type: 'noun',
    definition:
      'The partially shaded outer region of a shadow; figuratively, an indeterminate, liminal boundary zone.',
    example: '"The truth lay somewhere in the penumbra between fact and story."',
    synonyms: ['shadow', 'fringe', 'margin', 'periphery', 'border'],
  },
  ineffable: {
    type: 'adjective',
    definition: 'Too great or extreme to be expressed or described in words; utterly beyond language.',
    example: '"There was something ineffable about that sunset — no words could do it justice."',
    synonyms: ['indescribable', 'inexpressible', 'unspeakable', 'unutterable', 'sublime'],
  },
  halcyon: {
    type: 'adjective',
    definition:
      'Denoting a period in the past that was idyllically happy and peaceful; calm, golden, and carefree.',
    example: '"He looked back on those halcyon summers of childhood with a longing he could not name."',
    synonyms: ['peaceful', 'golden', 'idyllic', 'serene', 'tranquil'],
  },
  susurrus: {
    type: 'noun',
    definition: 'A soft, continuous murmuring or whispering sound — the low hum of rustling or flowing.',
    example: '"The susurrus of leaves in the night wind lulled her to sleep."',
    synonyms: ['murmur', 'whisper', 'rustle', 'hum', 'sigh'],
  },
  liminal: {
    type: 'adjective',
    definition:
      'Of or relating to a threshold — occupying a transitional position between two states, worlds, or periods of time.',
    example: '"Dawn is a liminal hour: neither night nor day, neither sleep nor waking."',
    synonyms: ['transitional', 'threshold', 'intermediary', 'marginal', 'in-between'],
  },
  gossamer: {
    type: 'adjective / noun',
    definition:
      'Extremely light, delicate, and insubstantial — as fine as a spider\'s web caught in morning light.',
    example: '"Her dress was made of something gossamer, nearly invisible in the pale morning air."',
    synonyms: ['delicate', 'filmy', 'translucent', 'sheer', 'diaphanous'],
  },
  soliloquy: {
    type: 'noun',
    definition:
      'An act of speaking one\'s thoughts aloud when alone or regardless of hearers; famously used in drama to reveal inner life.',
    example: '"Hamlet\'s \'To be or not to be\' is the most celebrated soliloquy in all of literature."',
    synonyms: ['monologue', 'aside', 'speech', 'address'],
  },
  iridescent: {
    type: 'adjective',
    definition:
      'Showing luminous colors that seem to change when seen from different angles, like the inside of an abalone shell.',
    example: '"The soap bubble drifted past, iridescent in the afternoon light."',
    synonyms: ['shimmering', 'lustrous', 'opalescent', 'prismatic', 'nacreous'],
  },
  petrichor: {
    type: 'noun',
    definition:
      'The pleasant, earthy smell that accompanies the first rain after a dry period — one of nature\'s most evocative scents.',
    example: '"After three weeks of drought, the petrichor that followed the storm was intoxicating."',
    synonyms: ['earthen scent', 'rain smell', 'after-rain fragrance'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function getEntry(term: string): Entry | null {
  return entries[term.toLowerCase()] ?? null;
}

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
export async function fetchOnlineDefinition(term: string): Promise<OnlineEntry | null> {
  try {
    const resp = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`
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
      synonyms: Array.from(allSynonyms).slice(0, 20),
      antonyms: Array.from(allAntonyms).slice(0, 10),
      meanings,
    };
  } catch {
    return null;
  }
}

export function getDefinition(term: string): string {
  return entries[term.toLowerCase()]?.definition ?? 'Definition not found.';
}

export function getSynonyms(term: string): string[] {
  return entries[term.toLowerCase()]?.synonyms ?? [];
}

/** Full-text search across the lexicon. */
export function searchEntries(query: string): Array<{ term: string; entry: Entry }> {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return Object.entries(entries)
    .filter(
      ([term, entry]) =>
        term.includes(q) ||
        entry.definition.toLowerCase().includes(q) ||
        entry.type.toLowerCase().includes(q) ||
        entry.synonyms.some((s) => s.toLowerCase().includes(q)),
    )
    .map(([term, entry]) => ({ term, entry }));
}

/** All available term keys (for autocomplete). */
export function getAllTerms(): string[] {
  return Object.keys(entries);
}
