/**
 * Curated Prompt & Technique Database
 *
 * Provides:
 *  1. A hardcoded set of literary/philosophical quotes (sourced from QuoteSlate).
 *  2. An expanded rhetorical-device and vocabulary database.
 *  3. A deterministic algorithm that picks techniques relevant to a quote's
 *     themes and textual structure.
 *
 * To extend the quote list, add entries to CURATED_QUOTES below.
 * To add new devices, add to EXPANDED_DEVICE_META and update
 * TAG_DEVICE_MAP accordingly.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Quote database
// ─────────────────────────────────────────────────────────────────────────────

export type CuratedQuote = {
  id: number;
  quote: string;
  author: string;
  /** Tags from the original QuoteSlate dataset, filtered to literary themes. */
  tags: string[];
};

/** 136 curated quotes sourced from the QuoteSlate dataset. */
export const CURATED_QUOTES: CuratedQuote[] = [
  { id: 1364, quote: "If one is lucky, a solitary fantasy can totally transform one million realities.", author: "Maya Angelou", tags: ["change", "growth"] },
  { id: 1401, quote: "On every thorn, delightful wisdom grows, in every rill a sweet instruction flows.", author: "Edward Young", tags: ["change", "wisdom"] },
  { id: 1408, quote: "They say that time changes things, but you actually have to change them yourself.", author: "Andy Warhol", tags: ["change", "wisdom"] },
  { id: 1414, quote: "All children are artists. The problem is how to remain an artist once he grows up.", author: "Pablo Picasso", tags: ["change", "creativity"] },
  { id: 1469, quote: "If we could see the miracle of a single flower clearly, our whole life would change.", author: "Buddha", tags: ["change", "life", "mindfulness"] },
  { id: 1491, quote: "If you don't like something, change it. If you can't change it, change your attitude.", author: "Maya Angelou", tags: ["change"] },
  { id: 1546, quote: "Time changes everything except something within us which is always surprised by change.", author: "Thomas Hardy", tags: ["change"] },
  { id: 1570, quote: "Progress always involves risks. You can't steal second base and keep your foot on first.", author: "Frederick Wilcox", tags: ["change", "growth"] },
  { id: 1571, quote: "The art of progress is to preserve order amid change, and to preserve change amid order.", author: "Alfred North Whitehead", tags: ["change", "wisdom"] },
  { id: 1384, quote: "Each time we face a fear, we gain strength, courage, and confidence in the doing.", author: "Unknown", tags: ["courage", "hope"] },
  { id: 1404, quote: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi", tags: ["resilience", "courage"] },
  { id: 1431, quote: "The most common way people give up their power is by thinking they don't have any.", author: "Alice Walker", tags: ["wisdom", "courage"] },
  { id: 1479, quote: "There is nothing happens to any person but what was in his power to go through with.", author: "Marcus Aurelius", tags: ["courage", "resilience"] },
  { id: 1481, quote: "You can never cross the ocean until you have the courage to lose sight of the shore.", author: "Christopher Columbus", tags: ["courage"] },
  { id: 1486, quote: "Courage is the discovery that you may not win, and trying when you know you can lose.", author: "Unknown", tags: ["courage"] },
  { id: 1512, quote: "Success is not final; failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", tags: ["courage", "resilience"] },
  { id: 1589, quote: "More often than not, anger is actually an indication of weakness rather than of strength.", author: "Dalai Lama", tags: ["resilience", "courage"] },
  { id: 1607, quote: "He who controls others may be powerful, but he who has mastered himself is mightier still.", author: "Laozi", tags: ["wisdom", "courage"] },
  { id: 1365, quote: "It has become appallingly obvious that our technology has exceeded our humanity.", author: "Albert Einstein", tags: ["wisdom", "creativity"] },
  { id: 1410, quote: "We cannot solve our problems with the same thinking we used when we created them.", author: "Albert Einstein", tags: ["wisdom", "creativity"] },
  { id: 1563, quote: "Imagination will often carry us to worlds that never were. But without it we go nowhere.", author: "Carl Sagan", tags: ["creativity", "wisdom"] },
  { id: 1653, quote: "I never did anything worth doing by accident, nor did any of my inventions come by accident.", author: "Thomas Edison", tags: ["creativity"] },
  { id: 1738, quote: "Everyone is a genius at least once a year. A real genius has his original ideas closer together.", author: "Georg Lichtenberg", tags: ["creativity"] },
  { id: 2122, quote: "If you do not express your own original ideas, if you do not listen to your own being, you will have betrayed yourself.", author: "Rollo May", tags: ["creativity", "self-reflection"] },
  { id: 2328, quote: "Imagination allows us to escape the predictable. It enables us to reply to the common wisdom that we cannot soar by saying, 'Just watch!'.", author: "Bill Bradley", tags: ["creativity", "wisdom"] },
  { id: 2357, quote: "Without this playing with fantasy no creative work has ever yet come to birth. The debt we owe to the play of the imagination is incalculable.", author: "Carl Jung", tags: ["creativity", "wisdom"] },
  { id: 2493, quote: "Imagination is more important than knowledge. For while knowledge defines all we currently know and understand, imagination points to all we might yet discover and create.", author: "Albert Einstein", tags: ["creativity", "knowledge"] },
  { id: 1407, quote: "The meaning I picked, the one that changed my life: Overcome fear, behold wonder.", author: "Richard Bach", tags: ["fear", "purpose"] },
  { id: 1419, quote: "Fear of failure is one attitude that will keep you at the same point in your life.", author: "Byron Pulsifer", tags: ["fear", "life"] },
  { id: 1556, quote: "Courage is not the absence of fear, but simply moving on with dignity despite that fear.", author: "Pat Riley", tags: ["fear", "courage"] },
  { id: 1658, quote: "Our doubts are traitors and make us lose the good we often might win, by fearing to attempt.", author: "Jane Addams", tags: ["fear"] },
  { id: 2024, quote: "If you're in a bad situation, don't worry it'll change. If you're in a good situation, don't worry it'll change.", author: "John Simone", tags: ["fear", "change"] },
  { id: 1480, quote: "To act is not necessarily compassion. True compassion sometimes comes from inaction.", author: "Hinata Miyake", tags: ["love", "forgiveness"] },
  { id: 2251, quote: "Forgiveness is that subtle thread that binds both love and friendship. Without forgiveness, you may not even have a child one day.", author: "George Foreman", tags: ["love", "forgiveness"] },
  { id: 1422, quote: "Liberty, taking the word in its concrete sense, consists in the ability to choose.", author: "Simone Weil", tags: ["growth"] },
  { id: 1459, quote: "Be thankful when you don't know something for it gives you the opportunity to learn.", author: "Unknown", tags: ["growth", "wisdom"] },
  { id: 1609, quote: "I never teach my pupils. I only attempt to provide the conditions in which they can learn.", author: "Albert Einstein", tags: ["growth", "knowledge"] },
  { id: 1624, quote: "A wise man can learn more from a foolish question than a fool can learn from a wise answer.", author: "Bruce Lee", tags: ["growth", "wisdom"] },
  { id: 1659, quote: "Technological progress has merely provided us with more efficient means for going backwards.", author: "Aldous Huxley", tags: ["change", "growth", "irony"] },
  { id: 1682, quote: "Learn all you can from the mistakes of others. You won't have time to make them all yourself.", author: "Alfred Sheinwold", tags: ["growth", "knowledge"] },
  { id: 1751, quote: "To exist is to change, to change is to mature, to mature is to go on creating oneself endlessly.", author: "Henri Bergson", tags: ["growth", "change"] },
  { id: 1787, quote: "Your ability to learn faster than your competition is your only sustainable competitive advantage.", author: "Arie de Gues", tags: ["growth", "wisdom"] },
  { id: 1458, quote: "And the attitude of faith is the very opposite of clinging to belief, of holding on.", author: "Alan Watts", tags: ["hope", "mindfulness"] },
  { id: 1460, quote: "Dreams come true. Without that possibility, nature would not incite us to have them.", author: "John Updike", tags: ["hope"] },
  { id: 1485, quote: "Belief consists in accepting the affirmations of the soul; Unbelief, in denying them.", author: "Ralph Waldo Emerson", tags: ["hope", "self-reflection"] },
  { id: 1487, quote: "Creativity comes from trust. Trust your instincts. And never hope more than you work.", author: "Rita Mae Brown", tags: ["hope", "creativity"] },
  { id: 1536, quote: "Life is so constructed that an event does not, cannot, will not, match the expectation.", author: "Charlotte Brontë", tags: ["hope", "life"] },
  { id: 1548, quote: "Trust only movement. Life happens at the level of events, not of words. Trust movement.", author: "Alfred Adler", tags: ["hope", "life"] },
  { id: 1651, quote: "I find hope in the darkest of days, and focus in the brightest. I do not judge the universe.", author: "Dalai Lama", tags: ["hope", "mindfulness"] },
  { id: 1514, quote: "The greatest obstacle to discovery is not ignorance - it is the illusion of knowledge.", author: "Daniel J. Boorstin", tags: ["knowledge", "wisdom"] },
  { id: 1526, quote: "A little knowledge that acts is worth infinitely more than much knowledge that is idle.", author: "Kahlil Gibran", tags: ["knowledge", "wisdom"] },
  { id: 1588, quote: "In wisdom gathered over time I have found that every experience is a form of exploration.", author: "Ansel Adams", tags: ["knowledge", "wisdom"] },
  { id: 1602, quote: "Wisdom is knowing what to do next; Skill is knowing how to do it, and Virtue is doing it.", author: "David Jordan", tags: ["knowledge", "wisdom"] },
  { id: 1711, quote: "Kindness is more important than wisdom, and the recognition of this is the beginning of wisdom.", author: "Theodore Isaac Rubin", tags: ["knowledge", "wisdom"] },
  { id: 2347, quote: "Where is the Life we have lost in living? Where is the wisdom we have lost in knowledge? Where is the knowledge we have lost in information?", author: "T.S. Eliot", tags: ["knowledge", "wisdom", "self-reflection"] },
  { id: 1356, quote: "Allow the world to live as it chooses, and allow yourself to live as you choose.", author: "Richard Bach", tags: ["life"] },
  { id: 1360, quote: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau", tags: ["life", "purpose"] },
  { id: 1367, quote: "It is not uncommon for people to spend their whole life waiting to start living.", author: "Eckhart Tolle", tags: ["life"] },
  { id: 1369, quote: "Life's most persistent and urgent question is, 'What are you doing for others?'.", author: "Martin Luther King Jr.", tags: ["life", "purpose"] },
  { id: 1370, quote: "Living at risk is jumping off the cliff and building your wings on the way down.", author: "Ray Bradbury", tags: ["life", "courage"] },
  { id: 1386, quote: "Experience is not what happens to you; it's what you do with what happens to you.", author: "Aldous Huxley", tags: ["life", "wisdom"] },
  { id: 1394, quote: "If you want your life to be more rewarding, you have to change the way you think.", author: "Oprah Winfrey", tags: ["life", "change"] },
  { id: 1409, quote: "We are the leaves of one branch, the drops of one sea, the flowers of one garden.", author: "Jean Lacordaire", tags: ["life", "love"] },
  { id: 1437, quote: "We love life, not because we are used to living but because we are used to loving.", author: "Friedrich Nietzsche", tags: ["life", "love"] },
  { id: 1439, quote: "A garden is always a series of losses set against a few triumphs, like life itself.", author: "May Sarton", tags: ["life"] },
  { id: 1363, quote: "How many cares one loses when one decides not to be something but to be someone.", author: "Coco Chanel", tags: ["love", "self-reflection"] },
  { id: 1366, quote: "It is not a lack of love, but a lack of friendship that makes unhappy marriages.", author: "Friedrich Nietzsche", tags: ["love"] },
  { id: 1388, quote: "Genuine sincerity opens people's hearts, while manipulation causes them to close.", author: "Daisaku Ikeda", tags: ["love"] },
  { id: 1399, quote: "Let us always meet each other with smile, for the smile is the beginning of love.", author: "Mother Teresa", tags: ["love"] },
  { id: 1400, quote: "Lord, make me an instrument of thy peace. Where there is hatred, let me sow love.", author: "Francis of Assisi", tags: ["love", "mindfulness"] },
  { id: 1421, quote: "Friendship at first sight, like love at first sight, is said to be the only truth.", author: "Herman Melville", tags: ["love", "life"] },
  { id: 1359, quote: "Give whatever you are doing and whoever you are with the gift of your attention.", author: "Jim Rohn", tags: ["mindfulness"] },
  { id: 1433, quote: "The opportunity for brotherhood presents itself every time you meet a human being.", author: "Jane Wyman", tags: ["mindfulness", "life"] },
  { id: 1436, quote: "Until you make peace with who you are, you'll never be content with what you have.", author: "Doris Mortman", tags: ["mindfulness", "self-reflection"] },
  { id: 1441, quote: "As we are liberated from our own fear, our presence automatically liberates others.", author: "Nelson Mandela", tags: ["mindfulness", "courage"] },
  { id: 1569, quote: "Peace of mind is not the absence of conflict from life, but the ability to cope with it.", author: "Unknown", tags: ["mindfulness", "wisdom"] },
  { id: 1610, quote: "If we open a quarrel between past and present, we shall find that we have lost the future.", author: "Winston Churchill", tags: ["mindfulness", "wisdom"] },
  { id: 1676, quote: "Gratitude makes sense of our past, brings peace for today, and creates a vision for tomorrow.", author: "Melody Beattie", tags: ["mindfulness"] },
  { id: 1447, quote: "Obstacles are those frightful things you see when you take your eyes off your goal.", author: "Henry Ford", tags: ["purpose"] },
  { id: 1529, quote: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson", tags: ["purpose", "courage"] },
  { id: 1584, quote: "Government of the people, by the people, for the people, shall not perish from the Earth.", author: "Abraham Lincoln", tags: ["purpose", "wisdom"] },
  { id: 1616, quote: "No one saves us but ourselves. No one can and no one may. We ourselves must walk the path.", author: "Buddha", tags: ["purpose", "self-reflection"] },
  { id: 1665, quote: "We all live with the objective of being happy; our lives are all different and yet the same.", author: "Anne Frank", tags: ["purpose", "life"] },
  { id: 1728, quote: "We cannot change our memories, but we can change their meaning and the power they have over us.", author: "David Seamans", tags: ["purpose", "change"] },
  { id: 1792, quote: "I can't change the direction of the wind, but I can adjust my sails to always reach my destination.", author: "Jimmy Dean", tags: ["purpose", "resilience"] },
  { id: 1371, quote: "No one has a finer command of language than the person who keeps his mouth shut.", author: "Sam Rayburn", tags: ["wisdom", "resilience"] },
  { id: 1412, quote: "A bend in the road is not the end of the road... Unless you fail to make the turn.", author: "Unknown", tags: ["resilience"] },
  { id: 1443, quote: "Good timber does not grow with ease; the stronger the wind, the stronger the trees.", author: "J. Willard Marriott", tags: ["resilience"] },
  { id: 1488, quote: "Divide each difficulty into as many parts as is feasible and necessary to resolve it.", author: "René Descartes", tags: ["resilience", "wisdom"] },
  { id: 1521, quote: "There is nothing so useless as doing efficiently that which should not be done at all.", author: "Peter Drucker", tags: ["resilience", "wisdom"] },
  { id: 1528, quote: "Continuous effort, not strength or intelligence, is the key to unlocking our potential.", author: "Winston Churchill", tags: ["resilience", "growth"] },
  { id: 1533, quote: "If you want things to be different, perhaps the answer is to become different yourself.", author: "Norman Vincent Peale", tags: ["resilience", "change"] },
  { id: 1564, quote: "In the depth of winter, I finally learned that there was within me an invincible summer.", author: "Albert Camus", tags: ["resilience", "self-reflection"] },
  { id: 1398, quote: "Learning without reflection is a waste, reflection without learning is dangerous.", author: "Confucius", tags: ["self-reflection", "wisdom"] },
  { id: 1719, quote: "The key to growth is the introduction of higher dimensions of consciousness into our awareness.", author: "Laozi", tags: ["self-reflection", "mindfulness"] },
  { id: 1372, quote: "Positive thinking will let you do everything better than negative thinking will.", author: "Zig Ziglar", tags: ["wisdom"] },
  { id: 1377, quote: "The day of fortune is like a harvest day, we must be busy when the corn is ripe.", author: "Torquato Tasso", tags: ["wisdom"] },
  { id: 1381, quote: "There is no expedient to which a man will not go to avoid the labor of thinking.", author: "Thomas Edison", tags: ["wisdom"] },
  { id: 1391, quote: "I am always doing that which I cannot do, in order that I may learn how to do it.", author: "Pablo Picasso", tags: ["wisdom", "growth"] },
  { id: 1396, quote: "Just be patient. Let the game come to you. Don't rush. Be quick, but don't hurry.", author: "Earl Monroe", tags: ["wisdom", "mindfulness"] },
  { id: 1397, quote: "Knowledge is proud that it knows so much; wisdom is humble that it knows no more.", author: "William Cowper", tags: ["wisdom", "knowledge"] },
  { id: 1395, quote: "In the business world, the rearview mirror is always clearer than the windshield.", author: "Warren Buffett", tags: ["wisdom", "resilience"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Expanded device (rhetorical technique) database
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceDifficulty = 'foundational' | 'intermediate' | 'advanced';

export type ExpandedDeviceMeta = {
  difficulty: DeviceDifficulty;
  /** Themes/tags this device resonates with */
  affinityTags: string[];
  /** Textual cues that suggest this device (regexes on the quote) */
  textCues: RegExp[];
};

/** Full device catalogue — a superset of what curation.ts already tracks. */
export const EXPANDED_DEVICE_META: Record<string, ExpandedDeviceMeta> = {
  // ── Foundational ──────────────────────────────────────────────────────────
  simile:           { difficulty: 'foundational', affinityTags: ['life', 'love', 'creativity'],          textCues: [/\blike\b/i, /\bas [a-z]/i] },
  metaphor:         { difficulty: 'foundational', affinityTags: ['life', 'love', 'creativity', 'hope'],  textCues: [/\bis [a-z]/i, /\bare [a-z]/i] },
  alliteration:     { difficulty: 'foundational', affinityTags: ['creativity', 'mindfulness'],            textCues: [/\b([bcdfghjklmnpqrstvwxyz])\w+\s+\1\w+/i] },
  hyperbole:        { difficulty: 'foundational', affinityTags: ['courage', 'love', 'fear'],              textCues: [/\bnever\b|\balways\b|\bevery\b|\bmillion\b|\binfinite/i] },
  personification:  { difficulty: 'foundational', affinityTags: ['life', 'nature', 'mindfulness'],       textCues: [/\b(wind|time|death|life|fear|hope|nature)\s+(whisper|speak|smile|reach|hold|grasp|walk|run|steal)/i] },
  anaphora:         { difficulty: 'foundational', affinityTags: ['resilience', 'hope', 'purpose'],       textCues: [/(\b\w{2,}\b).{5,50}\1\b/i] },
  irony:            { difficulty: 'foundational', affinityTags: ['wisdom', 'change', 'fear'],             textCues: [/\bnot\b.{0,30}\bbut\b/i] },
  imagery:          { difficulty: 'foundational', affinityTags: ['mindfulness', 'creativity', 'life'],   textCues: [/\b(light|dark|shadow|color|sound|smell|taste|touch|warm|cold|bright|soft)/i] },
  rhetoricalQuestion: { difficulty: 'foundational', affinityTags: ['wisdom', 'self-reflection', 'purpose'], textCues: [/\?/] },
  repetition:       { difficulty: 'foundational', affinityTags: ['resilience', 'purpose', 'hope'],       textCues: [/(\b\w{3,}\b)(?:.{1,30}\1){2,}/i] },

  // ── Intermediate ──────────────────────────────────────────────────────────
  juxtaposition:    { difficulty: 'intermediate', affinityTags: ['wisdom', 'change'],                   textCues: [/\bbut\b|\byet\b|\bhowever\b/i] },
  antithesis:       { difficulty: 'intermediate', affinityTags: ['wisdom', 'courage', 'change'],        textCues: [/\bnot\b.{2,40}\bbut\b|\bwithout\b.{2,30}\bbut\b/i] },
  oxymoron:         { difficulty: 'intermediate', affinityTags: ['fear', 'love', 'mindfulness'],        textCues: [/(bitter.?sweet|deafen.?silence|living.?dead|cruel.?kind|dark.?light)/i] },
  euphemism:        { difficulty: 'intermediate', affinityTags: ['forgiveness', 'life'],                textCues: [/(pass(?:ed)? away|let go|moving on|transition)/i] },
  assonance:        { difficulty: 'intermediate', affinityTags: ['creativity', 'mindfulness'],          textCues: [] },
  climax:           { difficulty: 'intermediate', affinityTags: ['resilience', 'hope', 'purpose'],      textCues: [/,\s*[a-z].*,\s*[a-z].*,\s*[a-z]/i] },
  pathos:           { difficulty: 'intermediate', affinityTags: ['love', 'forgiveness', 'fear'],        textCues: [/(suffer|grief|pain|tears|heartbreak|lose|lost|mourn)/i] },
  ethos:            { difficulty: 'intermediate', affinityTags: ['knowledge', 'wisdom'],                textCues: [/(as a|in my|our)\s+\w+/i] },
  logos:            { difficulty: 'intermediate', affinityTags: ['knowledge', 'wisdom'],                textCues: [/(therefore|because|thus|evidence|fact|data|proves?|shows?)/i] },
  allusion:         { difficulty: 'intermediate', affinityTags: ['knowledge', 'wisdom', 'creativity'],  textCues: [] },
  symbolism:        { difficulty: 'intermediate', affinityTags: ['life', 'hope', 'creativity'],         textCues: [/(garden|river|ocean|mountain|fire|light|path|journey|bridge|seed)/i] },
  foreshadowing:    { difficulty: 'intermediate', affinityTags: ['fear', 'hope', 'change'],             textCues: [] },

  // ── Advanced ──────────────────────────────────────────────────────────────
  polysyndeton:     { difficulty: 'advanced', affinityTags: ['resilience', 'purpose'],                  textCues: [/(\w+)\s+and\s+(\w+)\s+and\s+(\w+)/i] },
  asyndeton:        { difficulty: 'advanced', affinityTags: ['courage', 'wisdom'],                      textCues: [/\w+, \w+, \w+[^and]/i] },
  chiasmus:         { difficulty: 'advanced', affinityTags: ['wisdom', 'self-reflection'],              textCues: [] },
  litotes:          { difficulty: 'advanced', affinityTags: ['self-reflection', 'wisdom'],              textCues: [/not\s+un\w+|not\s+(bad|wrong|ugly|small|little|weak)/i] },
  synecdoche:       { difficulty: 'advanced', affinityTags: ['knowledge', 'wisdom'],                    textCues: [] },
  apostrophe:       { difficulty: 'advanced', affinityTags: ['love', 'self-reflection', 'purpose'],     textCues: [/^(o|oh|dear|you)\b/i] },
  paradox:          { difficulty: 'advanced', affinityTags: ['wisdom', 'self-reflection', 'fear'],      textCues: [/(by\s+\w+ing.{2,30}can|in order to.{2,30}must|the more.{2,30}the less)/i] },
  allegory:         { difficulty: 'advanced', affinityTags: ['wisdom', 'creativity', 'purpose'],        textCues: [] },
  anadiplosis:      { difficulty: 'advanced', affinityTags: ['wisdom', 'growth', 'purpose'],            textCues: [/(\b\w{3,}\b)[^.]*\.\s*\1\b/i] },
  zeugma:           { difficulty: 'advanced', affinityTags: ['creativity', 'wisdom'],                   textCues: [] },
  epiphora:         { difficulty: 'advanced', affinityTags: ['resilience', 'hope'],                     textCues: [] },
};

// ─────────────────────────────────────────────────────────────────────────────
// Expanded vocabulary database
// ─────────────────────────────────────────────────────────────────────────────

export type VocabMeta = {
  definition: string;
  semanticThemes: string[];
  difficulty: DeviceDifficulty;
};

export const EXPANDED_VOCAB_META: Record<string, VocabMeta> = {
  // Foundational
  ephemeral:    { definition: 'Lasting for a very short time.', semanticThemes: ['change', 'life', 'mindfulness'], difficulty: 'foundational' },
  serendipity:  { definition: 'A happy, unexpected discovery.', semanticThemes: ['hope', 'life', 'creativity'], difficulty: 'foundational' },
  luminous:     { definition: 'Bright; radiant; emanating light or insight.', semanticThemes: ['hope', 'creativity', 'mindfulness'], difficulty: 'foundational' },
  reverie:      { definition: 'A state of pleasant, dreamy meditation.', semanticThemes: ['mindfulness', 'creativity', 'hope'], difficulty: 'foundational' },
  wistful:      { definition: 'Having a feeling of vague, melancholy longing.', semanticThemes: ['love', 'change', 'self-reflection'], difficulty: 'foundational' },
  zenith:       { definition: 'The highest point reached; the peak.', semanticThemes: ['purpose', 'growth', 'courage'], difficulty: 'foundational' },
  palpable:     { definition: 'So intense it seems touchable; easily perceived.', semanticThemes: ['fear', 'love', 'wisdom'], difficulty: 'foundational' },
  lucid:        { definition: 'Expressed clearly; easy to understand.', semanticThemes: ['knowledge', 'wisdom', 'creativity'], difficulty: 'foundational' },
  nascent:      { definition: 'Just beginning to exist or develop.', semanticThemes: ['growth', 'change', 'hope'], difficulty: 'foundational' },

  // Intermediate
  sanguine:     { definition: 'Optimistic, especially in a difficult situation.', semanticThemes: ['hope', 'courage', 'resilience'], difficulty: 'intermediate' },
  equanimity:   { definition: 'Mental calmness and composure in difficult situations.', semanticThemes: ['mindfulness', 'resilience', 'wisdom'], difficulty: 'intermediate' },
  mellifluous:  { definition: 'Sweet or musical; pleasant to hear.', semanticThemes: ['creativity', 'love', 'mindfulness'], difficulty: 'intermediate' },
  iridescent:   { definition: 'Showing many colours that change with the light; dazzling.', semanticThemes: ['creativity', 'change', 'hope'], difficulty: 'intermediate' },
  petrichor:    { definition: 'The pleasant smell of rain on dry earth.', semanticThemes: ['mindfulness', 'life', 'change'], difficulty: 'intermediate' },
  halcyon:      { definition: 'Denoting a period of time that was idyllically happy and peaceful.', semanticThemes: ['mindfulness', 'hope', 'self-reflection'], difficulty: 'intermediate' },
  reticent:     { definition: 'Not revealing one\'s thoughts or feelings; reserved.', semanticThemes: ['self-reflection', 'fear', 'wisdom'], difficulty: 'intermediate' },
  sublime:      { definition: 'Of such great beauty or excellence as to inspire awe.', semanticThemes: ['creativity', 'love', 'wisdom'], difficulty: 'intermediate' },
  tenuous:      { definition: 'Very weak or slight; thin and insubstantial.', semanticThemes: ['fear', 'change', 'mindfulness'], difficulty: 'intermediate' },
  vestige:      { definition: 'A trace of something vanished; a remnant.', semanticThemes: ['change', 'self-reflection', 'life'], difficulty: 'intermediate' },
  resonant:     { definition: 'Evoking a strong feeling or imagery; lasting.', semanticThemes: ['love', 'wisdom', 'creativity'], difficulty: 'intermediate' },
  somnolent:    { definition: 'Sleepy; inducing drowsiness.', semanticThemes: ['mindfulness', 'life'], difficulty: 'intermediate' },

  // Advanced
  quixotic:     { definition: 'Exceedingly idealistic; unrealistic and impractical.', semanticThemes: ['creativity', 'hope', 'courage'], difficulty: 'advanced' },
  labyrinth:    { definition: 'A complicated network of paths; an intricate maze.', semanticThemes: ['life', 'self-reflection', 'fear'], difficulty: 'advanced' },
  penumbra:     { definition: 'The partially shaded outer region of a shadow; an uncertain boundary.', semanticThemes: ['self-reflection', 'fear', 'wisdom'], difficulty: 'advanced' },
  ineffable:    { definition: 'Too great or extreme to be expressed in words.', semanticThemes: ['love', 'wisdom', 'creativity'], difficulty: 'advanced' },
  susurrus:     { definition: 'A whispering or rustling sound.', semanticThemes: ['mindfulness', 'creativity', 'life'], difficulty: 'advanced' },
  liminal:      { definition: 'Relating to a threshold; occupying a position at a boundary.', semanticThemes: ['change', 'self-reflection', 'life'], difficulty: 'advanced' },
  gossamer:     { definition: 'Very light, thin, and delicate.', semanticThemes: ['creativity', 'mindfulness', 'love'], difficulty: 'advanced' },
  soliloquy:    { definition: 'The act of speaking one\'s thoughts aloud when alone.', semanticThemes: ['self-reflection', 'creativity', 'wisdom'], difficulty: 'advanced' },
  lambent:      { definition: 'Glowing softly and brightly; flickering gently.', semanticThemes: ['creativity', 'hope', 'mindfulness'], difficulty: 'advanced' },
  numinous:     { definition: 'Having a strong spiritual or mysterious quality.', semanticThemes: ['wisdom', 'self-reflection', 'mindfulness'], difficulty: 'advanced' },
  oblivion:     { definition: 'The state of being forgotten; complete obliviousness.', semanticThemes: ['change', 'fear', 'life'], difficulty: 'advanced' },
  pellucid:     { definition: 'Translucently clear; easily understood.', semanticThemes: ['wisdom', 'knowledge', 'creativity'], difficulty: 'advanced' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tag → techniques mapping  (the pairing algorithm)
// ─────────────────────────────────────────────────────────────────────────────

/** Maps quote tags to rhetorical devices that complement them. */
const TAG_DEVICE_MAP: Record<string, string[]> = {
  change:          ['antithesis', 'oxymoron', 'metaphor', 'personification', 'paradox'],
  courage:         ['anaphora', 'antithesis', 'hyperbole', 'climax', 'personification'],
  creativity:      ['metaphor', 'simile', 'imagery', 'allegory', 'personification'],
  fear:            ['personification', 'oxymoron', 'paradox', 'litotes', 'imagery'],
  forgiveness:     ['allusion', 'euphemism', 'pathos', 'metaphor', 'symbolism'],
  growth:          ['anaphora', 'metaphor', 'climax', 'antithesis', 'symbolism'],
  hope:            ['anaphora', 'metaphor', 'personification', 'simile', 'climax'],
  knowledge:       ['allusion', 'logos', 'allegory', 'rhetoricalQuestion', 'antithesis'],
  life:            ['metaphor', 'simile', 'personification', 'irony', 'symbolism'],
  love:            ['metaphor', 'simile', 'apostrophe', 'hyperbole', 'pathos'],
  mindfulness:     ['personification', 'paradox', 'imagery', 'litotes', 'assonance'],
  purpose:         ['anaphora', 'climax', 'metaphor', 'rhetoricalQuestion', 'apostrophe'],
  resilience:      ['anaphora', 'antithesis', 'climax', 'polysyndeton', 'chiasmus'],
  'self-reflection': ['apostrophe', 'personification', 'paradox', 'chiasmus', 'allusion'],
  wisdom:          ['paradox', 'irony', 'antithesis', 'allusion', 'chiasmus'],
  irony:           ['irony', 'juxtaposition', 'antithesis', 'paradox'],
};

/** Maps quote tags to vocabulary words whose themes align. */
const TAG_VOCAB_MAP: Record<string, string[]> = {
  change:          ['ephemeral', 'iridescent', 'liminal', 'vestige', 'nascent'],
  courage:         ['zenith', 'sanguine', 'equanimity', 'palpable', 'quixotic'],
  creativity:      ['luminous', 'lambent', 'gossamer', 'mellifluous', 'ineffable'],
  fear:            ['reticent', 'tenuous', 'labyrinth', 'penumbra', 'oblivion'],
  forgiveness:     ['equanimity', 'reverie', 'wistful', 'halcyon', 'resonant'],
  growth:          ['nascent', 'zenith', 'reverie', 'lucid', 'vestige'],
  hope:            ['luminous', 'sanguine', 'serendipity', 'nascent', 'iridescent'],
  knowledge:       ['lucid', 'pellucid', 'soliloquy', 'numinous', 'ineffable'],
  life:            ['ephemeral', 'serendipity', 'petrichor', 'wistful', 'liminal'],
  love:            ['ineffable', 'resonant', 'gossamer', 'mellifluous', 'reverie'],
  mindfulness:     ['equanimity', 'petrichor', 'halcyon', 'luminous', 'susurrus'],
  purpose:         ['zenith', 'lucid', 'quixotic', 'soliloquy', 'numinous'],
  resilience:      ['equanimity', 'sanguine', 'palpable', 'tenuous', 'zenith'],
  'self-reflection': ['soliloquy', 'numinous', 'liminal', 'penumbra', 'reverie'],
  wisdom:          ['ineffable', 'lucid', 'numinous', 'pellucid', 'soliloquy'],
  irony:           ['wistful', 'ephemeral', 'reticent', 'oblivion'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Core algorithm
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scores each device by how well it fits the given quote.
 * Scoring rules:
 *   +2  for each matching tag in TAG_DEVICE_MAP
 *   +1  for each textCue regex that matches the quote
 */
function scoreDevices(
  quote: string,
  tags: string[],
  availableDifficulties: DeviceDifficulty[],
): Map<string, number> {
  const scores = new Map<string, number>();

  for (const [device, meta] of Object.entries(EXPANDED_DEVICE_META)) {
    if (!availableDifficulties.includes(meta.difficulty)) continue;
    let score = 0;

    // Tag affinity
    for (const tag of tags) {
      const mapped = TAG_DEVICE_MAP[tag] ?? [];
      if (mapped.includes(device)) score += 2;
    }

    // Textual cues
    for (const cue of meta.textCues) {
      if (cue.test(quote)) score += 1;
    }

    if (score > 0) scores.set(device, score);
  }

  return scores;
}

/**
 * Scores each vocab word by how well it aligns with the quote's tags.
 */
function scoreVocab(
  tags: string[],
  availableDifficulties: DeviceDifficulty[],
  seed: number,
): string {
  const candidates: Array<{ word: string; score: number }> = [];

  for (const [word, meta] of Object.entries(EXPANDED_VOCAB_META)) {
    if (!availableDifficulties.includes(meta.difficulty)) continue;
    let score = 0;
    for (const tag of tags) {
      const mapped = TAG_VOCAB_MAP[tag] ?? [];
      if (mapped.includes(word)) score += 2;
      if (meta.semanticThemes.includes(tag)) score += 1;
    }
    candidates.push({ word, score });
  }

  if (candidates.length === 0) return 'ephemeral';

  const maxScore = Math.max(...candidates.map(c => c.score));
  const best = candidates.filter(c => c.score === maxScore);
  return best[Math.abs(seed) % best.length].word;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pick the quote and its matched techniques for a given date + session history.
 *
 * @param date       The date for which to generate a selection.
 * @param sessionCount  Number of sessions the user has completed (unlocks harder devices).
 * @param seenDeviceIds Devices the user has already practised (to avoid repetition).
 * @returns { quote, devices (2 rhetorical ids), vocabWord (1 vocab id) }
 */
export function getCuratedPrompt(
  date: Date,
  sessionCount: number,
  seenDeviceIds: Set<string> = new Set(),
): { quote: CuratedQuote; devices: string[]; vocabWord: string } {
  const seed = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));

  // Resolve available difficulty tiers
  const availableDifficulties: DeviceDifficulty[] =
    sessionCount >= 25
      ? ['foundational', 'intermediate', 'advanced']
      : sessionCount >= 10
      ? ['foundational', 'intermediate']
      : ['foundational'];

  // Pick today's quote deterministically
  const quote = CURATED_QUOTES[Math.abs(seed) % CURATED_QUOTES.length];
  const tags = quote.tags;

  // Score all candidate devices
  const deviceScores = scoreDevices(quote.quote, tags, availableDifficulties);

  // Sort by score descending, with seed-based tie-breaking
  const ranked = Array.from(deviceScores.entries()).sort(([aId, aScore], [bId, bScore]) => {
    if (bScore !== aScore) return bScore - aScore;
    // deterministic tie-break: use seed
    return (aId.charCodeAt(0) + seed) % 7 - (bId.charCodeAt(0) + seed) % 7;
  });

  const selected: string[] = [];

  // Prefer devices the user hasn't seen recently to avoid boredom
  // 1st pick: highest-scoring device not in seenDeviceIds
  const fresh = ranked.find(([id]) => !seenDeviceIds.has(id));
  if (fresh) selected.push(fresh[0]);
  else if (ranked.length > 0) selected.push(ranked[0][0]);

  // 2nd pick: next-best device, different difficulty from 1st pick if possible
  const firstDifficulty = selected[0] ? EXPANDED_DEVICE_META[selected[0]]?.difficulty : null;
  const diverse = ranked.find(([id]) => {
    if (selected.includes(id)) return false;
    // Try a different difficulty tier for variety
    const diff = EXPANDED_DEVICE_META[id]?.difficulty;
    return firstDifficulty ? diff !== firstDifficulty : true;
  });
  if (diverse) {
    selected.push(diverse[0]);
  } else {
    // Fall back to the next highest score regardless of difficulty
    const next = ranked.find(([id]) => !selected.includes(id));
    if (next) selected.push(next[0]);
  }

  // Ensure we always have 2 devices
  if (selected.length < 2) {
    const allDevices = Object.keys(EXPANDED_DEVICE_META).filter(
      d => availableDifficulties.includes(EXPANDED_DEVICE_META[d].difficulty) && !selected.includes(d),
    );
    while (selected.length < 2 && allDevices.length > 0) {
      selected.push(allDevices[(seed + selected.length) % allDevices.length]);
    }
  }

  // Pick vocab word
  const vocabWord = scoreVocab(tags, availableDifficulties, seed);

  return { quote, devices: selected, vocabWord };
}
