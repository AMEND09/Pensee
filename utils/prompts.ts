export type Term = {
  id: string;
  label: string;
};

export type Prompt = {
  /** single word for today's challenge */
  text: string;
  /** three rhetorical devices or vocab words for today */
  terms: Term[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Prompt source data
// ─────────────────────────────────────────────────────────────────────────────

const creativeWords: string[] = [
  'serendipity',
  'ephemeral',
  'quixotic',
  'labyrinth',
  'mellifluous',
  'luminous',
  'sanguine',
  'equanimity',
  'reverie',
  'penumbra',
  'ineffable',
  'halcyon',
  'susurrus',
  'liminal',
  'gossamer',
  'soliloquy',
  'sempiternal',
  'iridescent',
  'petrichor',
  'hiraeth',
];



const rhetoricalTerms: string[] = [
  'juxtaposition',
  'polysyndeton',
  'metaphor',
  'simile',
  'anaphora',
  'ethos',
  'pathos',
  'logos',
  'hyperbole',
  'alliteration',
  'assonance',
  'chiasmus',
  'asyndeton',
  'litotes',
  'oxymoron',
  'personification',
  'apostrophe',
  'antithesis',
  'climax',
  'euphemism',
  'synecdoche',
  'irony',
  'paradox',
  'allegory',
  'allusion',
];

const vocabTerms: string[] = [
  'ephemeral',
  'serendipity',
  'quixotic',
  'labyrinth',
  'mellifluous',
  'luminous',
  'sanguine',
  'equanimity',
  'reverie',
  'penumbra',
  'ineffable',
  'halcyon',
  'susurrus',
  'liminal',
  'gossamer',
  'soliloquy',
  'iridescent',
  'petrichor',
];

// ─────────────────────────────────────────────────────────────────────────────
// Seeded selection
// ─────────────────────────────────────────────────────────────────────────────

function seedPick<T>(arr: T[], seed: number, offset: number = 0): T {
  return arr[Math.abs(seed + offset) % arr.length];
}

/** Returns three unique terms (2 rhetorical + 1 vocab) seeded by date. */
function pickTerms(seed: number): Term[] {
  const used = new Set<string>();
  const terms: Term[] = [];

  for (let offset = 0; terms.length < 2; offset++) {
    const id = seedPick(rhetoricalTerms, seed, offset);
    if (!used.has(id)) {
      used.add(id);
      terms.push({ id, label: id });
    }
  }
  for (let offset = 7; terms.length < 3; offset++) {
    const id = seedPick(vocabTerms, seed, offset);
    if (!used.has(id)) {
      used.add(id);
      terms.push({ id, label: id });
    }
  }
  return terms;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** Returns today's prompt, universally consistent across all users on the same date. */
export function getDailyPrompt(date: Date): Prompt {
  const seed = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  const terms = pickTerms(seed);
  return { text: seedPick(creativeWords, seed), terms };
}

/** Returns a freshly randomised prompt (for the shuffle button). */
export function getRandomPrompt(): Prompt {
  const seed = Math.floor(Math.random() * 100_000);
  const text = creativeWords[Math.floor(Math.random() * creativeWords.length)];
  const terms = pickTerms(seed);
  return { text, terms };
}

/** All creative words — used for the slot-machine preview frames. */
export { creativeWords };

/** All term labels (rhetorical + vocab) — used for term reel preview frames. */
export const allTermLabels: string[] = [
  ...new Set([...rhetoricalTerms, ...vocabTerms]),
];
