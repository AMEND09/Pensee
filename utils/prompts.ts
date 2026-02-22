export type Term = {
  id: string;
  label: string;
};

export type Prompt = {
  /** short quote for today's challenge */
  text: string;
  /** attribution/source of the quote (may be empty) */
  author?: string;
  /** three rhetorical devices or vocab words for today */
  terms: Term[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Prompt source data
// ─────────────────────────────────────────────────────────────────────────────

// quotes are intentionally short (15–50 characters) so they fit nicely
// in the word‑reel UI.  Feel free to add or swap as you wish.
const creativeWords: string[] = [
  'To be or not to be',
  'I think, therefore I am',
  'The only constant is change',
  'Less is more',
  'Time heals all wounds',
  'Fortune favors the bold',
  'Knowledge is power',
  'All that glitters is not gold',
  'Act in haste, repent at leisure',
  'The pen is mightier than the sword',
  'A picture is worth a thousand words',
  'Birds of a feather flock together',
  'You reap what you sow',
  'The early bird catches the worm',
  'Where there’s smoke there’s fire',
  'Every cloud has a silver lining',
  'Out of sight, out of mind',
  'Curiosity killed the cat',
  'The apple doesn’t fall far',
  'When it rains it pours',
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

/** fetch a quote from the remote API */
async function fetchQuote(): Promise<{ quote: string; author: string }> {
  try {
    const res = await fetch(
      'https://quoteslate.vercel.app/api/quotes/random?minLength=50&maxLength=150',
    );
    const json = await res.json();
    return { quote: json.quote, author: json.author };
  } catch {
    // fallback to a random entry from the static list if network fails
    const fallback = creativeWords[Math.floor(Math.random() * creativeWords.length)];
    return { quote: fallback, author: '' };
  }
}

/** Returns today's prompt. */
export async function getDailyPrompt(date: Date): Promise<Prompt> {
  // simple cache so the quote stays the same during the day without
  // hammering the remote API repeatedly in a single session.
  const key = 'pensee.dailyPrompt';
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const obj = JSON.parse(stored) as { date: string; prompt: Prompt };
        if (obj.date === date.toISOString().slice(0, 10)) {
          return obj.prompt;
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  const seed = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  const terms = pickTerms(seed);
  const { quote, author } = await fetchQuote();
  const prompt: Prompt = { text: quote, terms, author };
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify({ date: date.toISOString().slice(0, 10), prompt }));
    } catch {}
  }
  return prompt;
}

/** Returns a freshly randomised prompt (for the shuffle button). */
export async function getRandomPrompt(): Promise<Prompt> {
  const seed = Math.floor(Math.random() * 100_000);
  const terms = pickTerms(seed);
  const { quote, author } = await fetchQuote();
  return { text: quote, terms, author };
}

/** All quote prompts — used for the preview frames. */
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

/**
 * Short glossary entries for the rhetorical devices. These are shown when a term
 * from the daily prompt is tapped instead of firing off a network request.  The
 * map is exported to avoid runtime errors when components attempt to use it as
 * an object in an `in` expression.
 */
export const rhetoricalDefinitions: Record<string, string> = {
  juxtaposition: 'The placement of two things close together for contrasting effect.',
  polysyndeton: 'The use of many conjunctions in close succession.',
  metaphor: 'A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable.',
  simile: 'A figure of speech comparing two unlike things using “like” or “as”.',
  anaphora: 'The repetition of a word or phrase at the beginning of successive clauses.',
  ethos: 'An appeal to credibility or character, often used in rhetoric to persuade.',
  pathos: 'An appeal to emotion in order to persuade an audience.',
  logos: 'An appeal to logic and reason.',
  hyperbole: 'Exaggerated statements or claims not meant to be taken literally.',
  alliteration: 'The occurrence of the same letter or sound at the beginning of adjacent words.',
  assonance: 'The repetition of vowel sounds in nearby words.',
  chiasmus: 'A rhetorical or literary figure in which words are repeated in reverse order.',
  asyndeton: 'The omission of conjunctions between parts of a sentence.',
  litotes: 'Ironical understatement in which an affirmative is expressed by the negative of its contrary.',
  oxymoron: 'A figure of speech in which apparently contradictory terms appear in conjunction.',
  personification: 'Attributing human characteristics to non-human entities.',
  apostrophe: 'Addressing a person who is absent or dead or an object as if it were alive.',
  antithesis: 'The direct opposite, a contrast or opposition between two things.',
  climax: 'A rhetorical figure in which words or phrases are arranged in order of increasing importance.',
  euphemism: 'A mild or indirect word substituted for one considered too harsh or blunt.',
  synecdoche: 'A figure of speech in which a part is made to represent the whole.',
  irony: 'The expression of one’s meaning by using language that normally signifies the opposite.',
  paradox: 'A statement that contradicts itself but may nonetheless be true.',
  allegory: 'A story, poem, or picture that can be interpreted to reveal a hidden meaning.',
  allusion: 'An indirect or passing reference to something.',
};
