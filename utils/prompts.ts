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

// Writing-focused prompts: evocative fragments, craft observations, and
// provocations designed to spark creative writing. Intentionally short so
// they fit in the word-reel UI.
const creativeWords: string[] = [
  // Craft & process
  'Write toward what frightens you',
  'Begin in the middle of things',
  'A sentence can hold a world',
  'Delete the first paragraph',
  'Every revision is a new draft',
  'What does silence sound like?',
  'Write the scene you keep avoiding',
  'The first draft is just the door',
  'Find the tension, then stay there',
  'Let the sentence surprise you',
  'Write what you don\'t understand yet',
  'Describe what you can\'t see',
  'Follow the strange detail',
  'Make the familiar unfamiliar',
  'End where you least expect to',
  'Trust the fragment',
  'Notice what you notice',
  'Say less than you know',
  'The rough draft owes nothing',
  'Turn an abstraction into a body',

  // Sensory & observational
  'The light at four in the afternoon',
  'A room no one has entered in years',
  'What does memory taste like?',
  'The last thing you heard before sleep',
  'An object that outlived its owner',
  'A color you have no name for',
  'The weight of an unopened letter',
  'Rain on a surface you rarely consider',
  'Describe a sound from childhood',
  'The texture of waiting',
  'Shadows at the edge of a doorway',
  'A city seen from above, in fog',
  'The smell of a place you left',
  'The space between two heartbeats',
  'Dust on something once treasured',

  // Provocations & paradox
  'What if forgetting were a gift?',
  'The kindness in saying no',
  'A lie that told the truth',
  'Strength in the smallest gesture',
  'The gentleness of an ending',
  'What does courage look like at rest?',
  'Something beautiful and ruined',
  'The distance between almost and enough',
  'A question with no right answer',
  'What you carry without knowing',

  // Voice & perspective
  'Write a letter you\'ll never send',
  'Speak as someone who just arrived',
  'Tell a story in only questions',
  'Describe yourself to a stranger',
  'The confession of an inanimate thing',
  'Write from inside a photograph',
  'Give a voice to the witness',
  'The monologue of a locked door',
  'Argue the opposite of what you believe',
  'Narrate a moment from its ending',

  // Rhythm & language
  'Build a sentence with no adjectives',
  'Write a paragraph of one-word sentences',
  'Let punctuation carry the meaning',
  'Find music in a list of plain things',
  'Write without the word I',
  'A sentence that takes a full breath',
  'Stack three metaphors, then choose one',
  'Replace every abstract noun with a concrete one',
  'Write a sentence that turns a corner',
  'Let the rhythm do the work',

  // Time & memory
  'A day that changed nothing and everything',
  'The moment before you understood',
  'Something you learned too late',
  'The future someone promised you',
  'What yesterday looked like from here',
  'A minute that lasted an hour',
  'The version of you from ten years ago',
  'What remains after the flood recedes',
  'Write today as if it were already history',
  'The thing you almost forgot',

  // Image & metaphor starters
  'The architecture of a conversation',
  'Roots beneath pavement, still growing',
  'A bridge between two silences',
  'The gravity of small decisions',
  'Embers after the argument',
  'An atlas of places that no longer exist',
  'The cartography of a scar',
  'Ice forming on still water',
  'A compass that points inward',
  'The archaeology of a drawer',
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
  // Expanded set
  'imagery',
  'rhetoricalQuestion',
  'repetition',
  'symbolism',
  'foreshadowing',
  'anadiplosis',
  'zeugma',
  'epiphora',
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
  // Expanded set
  'wistful',
  'zenith',
  'palpable',
  'lucid',
  'nascent',
  'reticent',
  'sublime',
  'tenuous',
  'vestige',
  'resonant',
  'lambent',
  'numinous',
  'oblivion',
  'pellucid',
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

/** Returns today's prompt. */
import { getCuratedSelection } from './curation';
import { localDateString, todayLocalDate } from './dates';

export async function getDailyPrompt(date: Date): Promise<Prompt> {
  const key = 'pensee.dailyPrompt';
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const obj = JSON.parse(stored) as { date: string; prompt: Prompt };
        if (obj.date === localDateString(date)) {
          return obj.prompt;
        }
      }
    } catch {}
  }

  try {
    const curated = await getCuratedSelection(date);

    // Build terms from curated selection (devices + vocab word)
    const terms: Term[] = [
      ...curated.devices.map(d => ({ id: d, label: d })),
      { id: curated.vocabWord, label: curated.vocabWord },
    ];

    // Use the curated quote directly — no external API call
    const text = curated.prompt.text;
    const author = curated.prompt.author;

    const prompt: Prompt = { text, terms, author };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify({ date: todayLocalDate(), prompt }));
      } catch {}
    }
    return prompt;
  } catch {
    // Fallback to seeded logic if curation fails
    const seed = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
    const terms = pickTerms(seed);
    // Use a local creative prompt instead of the network
    const text = creativeWords[Math.abs(seed) % creativeWords.length];
    const prompt: Prompt = { text, terms, author: '' };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify({ date: todayLocalDate(), prompt }));
      } catch {}
    }
    return prompt;
  }
}

/** Returns a freshly randomised prompt (for the shuffle button). */
export async function getRandomPrompt(): Promise<Prompt> {
  const seed = Math.floor(Math.random() * 100_000);
  const terms = pickTerms(seed);
  const text = creativeWords[Math.abs(seed) % creativeWords.length];
  return { text, terms, author: '' };
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
  // Expanded devices
  imagery: [
    'The old house smelled of cedar and moth-balls and spent summers.',
    'Her hands, cracked and cold, moved like winter branches in the wind.',
  ],
  rhetoricalQuestion: [
    'If not now, when?',
    'Does justice sleep while the world burns?',
  ],
  repetition: [
    'We must love one another. We must.',
    'Tomorrow, and tomorrow, and tomorrow — still we hope.',
  ],
  symbolism: [
    'The white dove landed on the battlefield, and the soldiers stopped firing.',
    'She planted a seed in the ruins of the old house.',
  ],
  foreshadowing: [
    'Little did she know that the door she had just locked would never open again.',
    'The sky that morning was the color of rust.',
  ],
  anadiplosis: [
    'Fear leads to anger. Anger leads to hate. Hate leads to suffering.',
    'Words lead to deeds; deeds shape habits; habits form character.',
  ],
  zeugma: [
    'She lost her keys and her patience in the same afternoon.',
    'He caught a cold and the last train home.',
  ],
  epiphora: [
    'Government of the people, by the people, for the people.',
    'And I knew it was lost, and I knew it was gone, and I knew it was mine.',
  ],
};

/**
 * Literary examples for rhetorical devices — drawn from recognizable published works.
 * Each entry has: passage, author, and a one-line craft note.
 */
export const rhetoricalLiteraryExamples: Record<string, { passage: string; author: string; note: string }> = {
  juxtaposition: {
    passage: 'It was the best of times, it was the worst of times.',
    author: 'Charles Dickens, A Tale of Two Cities',
    note: 'Dickens opens with extreme contrasts to capture the paradox of a revolutionary era.',
  },
  polysyndeton: {
    passage: 'And the rain descended, and the floods came, and the winds blew, and beat upon that house.',
    author: 'Matthew 7:25, King James Bible',
    note: 'The repeated "and" creates a sense of relentless accumulation.',
  },
  metaphor: {
    passage: 'All the world\'s a stage, and all the men and women merely players.',
    author: 'William Shakespeare, As You Like It',
    note: 'Shakespeare collapses the boundary between life and theater in a single declaration.',
  },
  simile: {
    passage: 'My love is like a red, red rose that\'s newly sprung in June.',
    author: 'Robert Burns, "A Red, Red Rose"',
    note: 'The doubled adjective intensifies the comparison beyond convention.',
  },
  anaphora: {
    passage: 'I have a dream that one day… I have a dream that one day…',
    author: 'Martin Luther King Jr., "I Have a Dream"',
    note: 'The repetition builds emotional momentum until the vision feels inevitable.',
  },
  ethos: {
    passage: 'In the councils of government, we must guard against the acquisition of unwarranted influence.',
    author: 'Dwight D. Eisenhower, Farewell Address',
    note: 'A departing president leverages decades of military and political authority.',
  },
  pathos: {
    passage: 'If you prick us, do we not bleed? If you tickle us, do we not laugh?',
    author: 'William Shakespeare, The Merchant of Venice',
    note: 'Shylock appeals to shared humanity through visceral physical experience.',
  },
  logos: {
    passage: 'We hold these truths to be self-evident, that all men are created equal.',
    author: 'Thomas Jefferson, Declaration of Independence',
    note: 'The argument is framed as logical inevitability — not opinion, but axiom.',
  },
  hyperbole: {
    passage: 'I had to wait in the station for ten days — an eternity.',
    author: 'Joseph Conrad, Heart of Darkness',
    note: 'The exaggeration conveys psychological time rather than clock time.',
  },
  alliteration: {
    passage: 'From forth the fatal loins of these two foes.',
    author: 'William Shakespeare, Romeo and Juliet',
    note: 'The repeated "f" sound creates a foreboding musicality.',
  },
  assonance: {
    passage: 'Hear the mellow wedding bells.',
    author: 'Edgar Allan Poe, "The Bells"',
    note: 'The repeated "e" sound mimics the gentle resonance of the bells themselves.',
  },
  chiasmus: {
    passage: 'Ask not what your country can do for you — ask what you can do for your country.',
    author: 'John F. Kennedy, Inaugural Address',
    note: 'The inversion of structure turns passive citizenship into active responsibility.',
  },
  asyndeton: {
    passage: 'He was a bag of bones, a floppy doll, a broken stick, a maniac.',
    author: 'Jack Kerouac, On the Road',
    note: 'The missing conjunctions create breathless velocity.',
  },
  litotes: {
    passage: 'He was not unmindful of the survey of English literature.',
    author: 'Jane Austen, Northanger Abbey',
    note: 'The double negative softens the statement into characteristic Austen understatement.',
  },
  oxymoron: {
    passage: 'Parting is such sweet sorrow.',
    author: 'William Shakespeare, Romeo and Juliet',
    note: 'The contradiction captures the simultaneous pain and tenderness of farewell.',
  },
  personification: {
    passage: 'Because I could not stop for Death — He kindly stopped for me.',
    author: 'Emily Dickinson, "Because I could not stop for Death"',
    note: 'Death as a courteous gentleman transforms terror into strange intimacy.',
  },
  apostrophe: {
    passage: 'O Death, where is thy sting? O grave, where is thy victory?',
    author: '1 Corinthians 15:55, King James Bible',
    note: 'Addressing death directly turns fear into defiant triumph.',
  },
  antithesis: {
    passage: 'That\'s one small step for man, one giant leap for mankind.',
    author: 'Neil Armstrong',
    note: 'The contrast between "small" and "giant" elevates a physical act into historic meaning.',
  },
  climax: {
    passage: 'Friends, Romans, countrymen, lend me your ears.',
    author: 'William Shakespeare, Julius Caesar',
    note: 'The ascending intimacy — from political ally to fellow citizen — draws the crowd closer.',
  },
  euphemism: {
    passage: 'He has gone to his long home, and the mourners go about the streets.',
    author: 'Ecclesiastes 12:5, King James Bible',
    note: 'Death becomes a homecoming — gentler, but no less final.',
  },
  synecdoche: {
    passage: 'Now is the winter of our discontent made glorious summer by this sun of York.',
    author: 'William Shakespeare, Richard III',
    note: '"Winter" and "summer" stand for entire emotional and political eras.',
  },
  irony: {
    passage: 'Water, water, every where, nor any drop to drink.',
    author: 'Samuel Taylor Coleridge, "The Rime of the Ancient Mariner"',
    note: 'Surrounded by ocean yet dying of thirst — the cruelest possible abundance.',
  },
  paradox: {
    passage: 'I must be cruel only to be kind.',
    author: 'William Shakespeare, Hamlet',
    note: 'Hamlet justifies harsh action through compassionate intention.',
  },
  allegory: {
    passage: 'All animals are equal, but some animals are more equal than others.',
    author: 'George Orwell, Animal Farm',
    note: 'The corruption of language mirrors the corruption of the revolution itself.',
  },
  allusion: {
    passage: 'Call me Ishmael.',
    author: 'Herman Melville, Moby-Dick',
    note: 'The biblical name signals exile and wandering before the story even begins.',
  },
  // Expanded literary examples
  imagery: {
    passage: 'The fog comes on little cat feet.',
    author: 'Carl Sandburg, "Fog"',
    note: 'The silent arrival of fog is made physical through the image of a prowling cat.',
  },
  rhetoricalQuestion: {
    passage: 'If you prick us, do we not bleed? If you tickle us, do we not laugh?',
    author: 'William Shakespeare, The Merchant of Venice',
    note: 'Shylock\'s questions demand a human answer — they argue by refusing to argue.',
  },
  repetition: {
    passage: 'Tomorrow, and tomorrow, and tomorrow, creeps in this petty pace from day to day.',
    author: 'William Shakespeare, Macbeth',
    note: 'The triple repetition of "tomorrow" makes time feel endless and crushing.',
  },
  symbolism: {
    passage: 'The green light at the end of Daisy\'s dock beckoned him.',
    author: 'F. Scott Fitzgerald, The Great Gatsby',
    note: 'The green light condenses Gatsby\'s entire dream into a single, visible point.',
  },
  foreshadowing: {
    passage: 'It was a bright cold day in April, and the clocks were striking thirteen.',
    author: 'George Orwell, Nineteen Eighty-Four',
    note: 'The impossible thirteen signals immediately that the normal world no longer applies.',
  },
  anadiplosis: {
    passage: 'Fear leads to anger; anger leads to hate; hate leads to suffering.',
    author: 'Yoda, Star Wars (George Lucas)',
    note: 'Each clause hands its final word to the next, creating a chain of consequence.',
  },
  zeugma: {
    passage: 'She broke his car and, afterward, his heart.',
    author: 'Traditional example',
    note: 'One verb governs two objects in entirely different senses, creating dark comedy.',
  },
  epiphora: {
    passage: 'Government of the people, by the people, for the people.',
    author: 'Abraham Lincoln, Gettysburg Address',
    note: 'The hammered repetition of "people" builds the democratic argument through sound alone.',
  },
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
  // Expanded definitions
  imagery: 'The use of vivid, descriptive language that appeals to the senses.',
  rhetoricalQuestion: 'A question asked for effect or to make a point, not to get an answer.',
  repetition: 'The deliberate use of the same word or phrase more than once for emphasis.',
  symbolism: 'The use of one thing to represent or stand for something else, often abstract.',
  foreshadowing: 'A hint or warning of what is to come later in the narrative.',
  anadiplosis: 'The repetition of the last word of one clause at the beginning of the next.',
  zeugma: 'A figure of speech in which a word applies to two others in different ways.',
  epiphora: 'The repetition of the same word or phrase at the end of successive clauses.',
  // Expanded vocabulary words — included here so they display offline
  wistful: 'Having a feeling of vague, melancholy longing for something past or beyond reach.',
  zenith: 'The highest point reached by a celestial body; the peak of success or achievement.',
  palpable: 'So intense as to seem almost tangible; able to be felt or sensed strongly.',
  lucid: 'Expressed clearly and easily understood; mentally clear and perceptive.',
  nascent: 'Just coming into existence; beginning to develop.',
  reticent: 'Not revealing one\'s thoughts or feelings readily; reserved.',
  sublime: 'Of such great beauty or excellence as to inspire awe; inspiring reverence.',
  tenuous: 'Very weak or slight; lacking substance or solidity.',
  vestige: 'A trace, mark, or visible sign left by something lost or vanished.',
  resonant: 'Evoking a deep emotional or imaginative response; lasting in effect.',
  lambent: 'Glowing softly and brightly; playing lightly over a surface.',
  numinous: 'Having a strong spiritual or mysterious quality; evoking a sense of the divine.',
  oblivion: 'The state of being unaware or forgotten; utter disregard.',
  pellucid: 'Translucently clear; easily understood.',
};
