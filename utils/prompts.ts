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

/** All creative words — used for the preview frames. */
export { creativeWords };

/** All term labels (rhetorical + vocab) — used for term reel preview frames. */
export const allTermLabels: string[] = [
  ...new Set([...rhetoricalTerms, ...vocabTerms]),
];

/**
 *  Predefined examples for rhetorical devices. These are shown when a term
 *  from the daily prompt is tapped instead of firing off a network request.
 *  Each device should have two illustrative sentences.
 */
export const rhetoricalExamples: Record<string, string[]> = {
  juxtaposition: [
    'The serene countryside lay in juxtaposition to the bustling city.',
    'His shy demeanor was a stark juxtaposition to his loud laughter.',
  ],
  polysyndeton: [
    'We lived and laughed and loved and left.',
    'She packed her bag with books and clothes and snacks and maps.',
  ],
  metaphor: [
    'Time is a thief that steals our moments.',
    'He sailed through life a ship on an endless sea.',
  ],
  simile: [
    'She was as brave as a lion.',
    'He slept like a log.',
  ],
  anaphora: [
    'We shall fight on the beaches. We shall fight on the landing grounds.',
    'Every day, every night, in every way, I am getting better.',
  ],
  ethos: [
    'As a doctor, I recommend this treatment.',
    'Given my years of experience, you can trust my advice.',
  ],
  pathos: [
    'Her tears drew pathos from the audience.',
    'The wounded puppy evoked pathos in everyone.',
  ],
  logos: [
    'Data shows that this method works.',
    'Statistics demonstrate the trend.',
  ],
  hyperbole: [
    'I\'ve told you a million times.',
    'This bag weighs a ton.',
  ],
  alliteration: [
    'Peter Piper picked a peck of pickled peppers.',
    'Sally sells seashells by the seashore.',
  ],
  assonance: [
    'The rain in Spain stays mainly in the plain.',
    'I made my way to the lake.',
  ],
  chiasmus: [
    'Never let a Fool Kiss You or a Kiss Fool You.',
    'She has all my love; my heart belongs to her.',
  ],
  asyndeton: [
    'I came, I saw, I conquered.',
    'He ran, jumped, laughed.',
  ],
  litotes: [
    'It\'s not bad.',
    'She\'s not unfamiliar with the subject.',
  ],
  oxymoron: [
    'a deafening silence',
    'bittersweet memories.',
  ],
  personification: [
    'The wind whispered through the trees.',
    'The sun smiled down on us.',
  ],
  apostrophe: [
    'Oh, Death, where is thy sting?',
    'O Romeo, Romeo! wherefore art thou Romeo?',
  ],
  antithesis: [
    'It was the best of times, it was the worst of times.',
    'To err is human; to forgive, divine.',
  ],
  climax: [
    'He came, he saw, he conquered.',
    'The speech built from whisper to roar.',
  ],
  euphemism: [
    'He passed away.',
    'She\'s between jobs.',
  ],
  synecdoche: [
    'All hands on deck.',
    'The White House issued a statement.',
  ],
  irony: [
    'A fire station burned down.',
    'The marriage counselor filed for divorce.',
  ],
  paradox: [
    'This statement is false.',
    'Less is more.',
  ],
  allegory: [
    'The Tortoise and the Hare teaches that slow steady wins.',
    'Animal Farm criticizes totalitarian regimes.',
  ],
  allusion: [
    'He was a real Romeo with the ladies.',
    'Don\'t act like a Scrooge.',
  ],
};
