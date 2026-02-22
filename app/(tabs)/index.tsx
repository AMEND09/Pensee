import { BarChart, History, User as UserIcon } from 'lucide-react-native';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccountModal from '../../components/modals/account-modal';
import ExportModal from '../../components/modals/export-modal';
import HistoryModal from '../../components/modals/history-modal';
import QuoteModal from '../../components/modals/quote-modal';
import ReflectionModal from '../../components/modals/reflection-modal';
import StatsModal from '../../components/modals/stats-modal';
import TermDetailModal from '../../components/modals/term-detail-modal';
import WritingSessionModal from '../../components/modals/writing-session-modal';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';
import { useAuth } from '../../utils/auth';
import { allTermLabels, creativeWords, getDailyPrompt, getRandomPrompt, Prompt, Term } from '../../utils/prompts';

// 
// Constants
// 

// height of one line in the main-word reel.  We allow two lines on the
// home screen, so the row height is double this value (108px) and we pass
// maxLines=2 when rendering the reel.
const WORD_ROW_H = 108;
const TERM_ROW_H = 32;   // height of a single frame in a technique-term reel (increased for larger chips)

// 
// Helpers
// 

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// small helper that looks up a definition in the local lexicon or, failing that,
// falls back to the online dictionary.  Used on the prompt card so users
// immediately see what the word actually means instead of staring at a blank
// mystery term.


// 
// WordReel    vertical scrolling strip
// 

type ReelRef = {
  spin: (frames: string[], duration: number, onDone?: () => void) => void;
  show: (value: string) => void;
};

const WordReel = forwardRef<
  ReelRef,
  {
    rowHeight: number;
    containerStyle?: object;
    textStyle: object;
    fades?: boolean;
    fadeColor?: string;
    /**
     * Maximum number of text lines per frame (used for wrapping/ellipsis).
     * Defaults to 1.
     */
    maxLines?: number;
    /**
     * When true the reel will scroll downward instead of upward.  This
     * reverses the animation and also flips the frames so the final value
     * still ends up in view.
     */
    reverse?: boolean;
  }
>(({ rowHeight, containerStyle, textStyle, fades = false, fadeColor = '#ffffff', maxLines = 1, reverse = false }, ref) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const [items, setItems] = useState<string[]>(['']);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useImperativeHandle(ref, () => ({
    spin(frames: string[], duration: number, onDone?: () => void) {
      if (animRef.current) animRef.current.stop();

      // if reversing direction we need to render the frames in reverse order
      // and animate from the "bottom" back to the top so the final value
      // ends up visible at the end of the animation.
      let working = frames;
      let startVal = 0;
      let endVal = -(frames.length - 1) * rowHeight;
      if (reverse) {
        working = [...frames].reverse();
        startVal = -(working.length - 1) * rowHeight;
        endVal = 0;
      }

      setItems(working);
      translateY.setValue(startVal);
      if (duration === 0) {
        translateY.setValue(endVal);
        onDone?.();
        return;
      }

      // snapping logic: most of the travel happens at a constant (linear)
      // speed, and the last frame is covered quickly with an easing curve to
      // avoid the perception of the reel slowing down for too long.  We split
      // the animation into two segments if there's enough time.
      const SNAP_MS = 150;
      if (duration > SNAP_MS * 2) {
        const mainDur = duration - SNAP_MS;
        // choose offset direction based on which way we're moving
        const offset = rowHeight * (endVal < startVal ? 1 : -1);
        const nearEnd = endVal + offset;
        const seq = Animated.sequence([
          Animated.timing(translateY, {
            toValue: nearEnd,
            duration: mainDur,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: endVal,
            duration: SNAP_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]);
        animRef.current = seq;
        seq.start(({ finished }) => { if (finished) onDone?.(); });
      } else {
        const anim = Animated.timing(translateY, {
          toValue: endVal,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });
        animRef.current = anim;
        anim.start(({ finished }) => { if (finished) onDone?.(); });
      }
    },
    show(value: string) {
      if (animRef.current) animRef.current.stop();
      setItems([value]);
      // keeping translateY at zero is fine in both directions because
      // there is only one item.
      translateY.setValue(0);
    },
  }));

  const fadeH = Math.round(rowHeight * 0.38);

  return (
    <View style={[{ height: rowHeight, overflow: 'hidden', width: '100%' }, containerStyle]}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {items.map((word, i) => (
          <View
            key={i}
            style={{ height: rowHeight, justifyContent: 'center', alignItems: 'flex-start', width: '100%' }}
          >
            <Text style={textStyle} numberOfLines={maxLines} ellipsizeMode="tail">
              {word}
            </Text>
          </View>
        ))}
      </Animated.View>

      {fades && (
        <>
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: fadeH, backgroundColor: `${fadeColor}cc` }}
          />
          <View
            pointerEvents="none"
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: fadeH, backgroundColor: `${fadeColor}cc` }}
          />
        </>
      )}
    </View>
  );
});

// 
// HomeScreen
// 

export default function HomeScreen() {
  // prompt may be fetched asynchronously; start null while loading
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(true);

  // grab initial quote on mount
  useEffect(() => {
    getDailyPrompt(new Date()).then((p) => {
      setPrompt(p);
      setLoadingPrompt(false);
    });
  }, []);

  const [isSpinning, setIsSpinning] = useState(false);
  const today = new Date();
  const { user } = useAuth();

  // Reel refs
  const wordReelRef = useRef<ReelRef>(null);
  const termReelRefs = useRef<(ReelRef | null)[]>([null, null, null]);

  // Snapshot of the prompt that was active when the writing session was opened
  const [sessionPrompt, setSessionPrompt] = useState<Prompt | null>(null);

  // Modal visibility
  const [showSession, setShowSession] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTermDetail, setShowTermDetail] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [showQuote, setShowQuote] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Writing session data
  const [sessionWriting, setSessionWriting] = useState('');
  const [sessionWordCount, setSessionWordCount] = useState(0);
  const [sessionImage, setSessionImage] = useState<string | undefined>(undefined);

  // Show initial prompt in reels once it's loaded from the API
  useEffect(() => {
    if (!prompt) return;
    wordReelRef.current?.show(prompt.text);
    prompt.terms.forEach((term, i) => {
      termReelRefs.current[i]?.show(term.label);
    });
  }, [prompt]);

  const handleShuffle = useCallback(async () => {
    // re-check every value at call time; {
    if (isSpinning || loadingPrompt || !prompt) return;
    setIsSpinning(true);

    const newPrompt = await getRandomPrompt();

    // Build word reel frames: 14 random quotes then the final quote
    // (quotes can be long; we simply show them truncated by Text numberOfLines)
    const wordFrames = [...shuffleArr(creativeWords).slice(0, 14), newPrompt.text];

    // All reels (word + terms) will spin at the same time, but we stagger
    // their stop times by giving each a progressively longer duration.
    // once every reel has finished we update the prompt and clear the flag.
    let completed = 0;
    const onDone = () => {
      completed++;
      if (completed === 4) {
        setPrompt(newPrompt);
        setIsSpinning(false);
      }
    };

    // start all reels spinning at once, but stagger their stop times so they finish
    // sequentially.  Use a base duration for the word reel and add a small offset for
    // each term reel (250ms apart) so the slot‑machine effect reads “one by one”.
    // word reel duration stays the same.  term reels maintain the same
    // durations as before, but we give them more frames to travel so their
    // **velocity** (distance / time) is higher.  This creates the perception of
    // a faster spin while keeping the overall sequence length unchanged.
    const WORD_BASE = 1700;
    const TERM_BASE = 1200;
    const TERM_STAGGER = 200; // ms between each term stopping
    const TERM_VELOCITY = 2; // multiplier for number of random frames
    const TERM_FRAME_COUNT = 10; // base number of random frames produced

    wordReelRef.current?.spin(wordFrames, WORD_BASE, onDone);

    newPrompt.terms.forEach((term, i) => {
      // generate more frames for higher velocity; leave the final label at the end
      const termFrames = [
        ...shuffleArr(allTermLabels).slice(0, TERM_FRAME_COUNT * TERM_VELOCITY),
        term.label,
      ];
      const duration = TERM_BASE + i * TERM_STAGGER;
      termReelRefs.current[i]?.spin(termFrames, duration, onDone);
    });
  }, [isSpinning, loadingPrompt, prompt]);

  const openTermDetail = useCallback((term: Term) => {
    setSelectedTerm(term);
    setShowTermDetail(true);
  }, []);

  const handleBeginSession = useCallback(() => {
    setSessionPrompt(prompt);
    setShowSession(true);
  }, [prompt]);

  const handleSessionComplete = useCallback(
    (writing: string, wordCount: number, scanImage?: string) => {
      setSessionWriting(writing);
      setSessionWordCount(wordCount);
      setSessionImage(scanImage);
      setShowSession(false);
      setTimeout(() => setShowReflection(true), 350);
    },
    [],
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/*  App Header  */}
        <View style={styles.appHeader}>
          <View>
            <Text style={styles.appName}>Pensée</Text>
            <Text style={styles.appDate}>{formatDate(today)}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.statsBtn}
              onPress={() => setShowHistory(true)}
              activeOpacity={0.75}
            >
              <History size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statsBtn, styles.statsBtnMargin]}
              onPress={() => setShowStats(true)}
              activeOpacity={0.75}
            >
              <BarChart size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statsBtn, styles.statsBtnMargin]}
              onPress={() => setShowAccount(true)}
              activeOpacity={0.75}
            >
              <UserIcon size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/*  Prompt Card  */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Quote Prompt</Text>
            <TouchableOpacity
              style={[styles.shuffleBtn, (isSpinning || loadingPrompt) && styles.shuffleBtnDisabled]}
              onPress={handleShuffle}
              activeOpacity={0.7}
              disabled={isSpinning || loadingPrompt}
            >
              <Text style={styles.shuffleBtnText}>{isSpinning ? 'spinning' : '  shuffle'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          {/* Word reel display */}
          {loadingPrompt ? (
            <View style={{ height: WORD_ROW_H, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.wordReelWrapper}
              onPress={() => {
                if (isSpinning || !prompt) return;
                setShowQuote(true);
              }}
              activeOpacity={isSpinning ? 1 : 0.7}
            >
              <WordReel
                ref={wordReelRef}
                rowHeight={WORD_ROW_H}
                textStyle={styles.wordText}
                maxLines={2}
                reverse
              />
            </TouchableOpacity>
          )}
        </View>

        {/*  Techniques Card  */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>TODAY'S TECHNIQUES</Text>
          </View>
          <View style={styles.cardDivider} />


          <View style={styles.termRow}>
            {prompt?.terms?.map((term, i) => (
              <TouchableOpacity
                key={i}
                style={styles.termChip}
                onPress={() => !isSpinning && openTermDetail(term)}
                activeOpacity={isSpinning ? 1 : 0.7}
              >
                <Text style={styles.termChipI}>i</Text>
                <WordReel
                  ref={(r) => { termReelRefs.current[i] = r; }}
                  rowHeight={TERM_ROW_H}
                  containerStyle={styles.termReelContainer}
                  textStyle={styles.termChipLabel}
                  reverse
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/*  Encouragement  */}
        <View style={styles.encouragementRow}>
          <View style={styles.encouragementLine} />
          <Text style={styles.encouragementText}>Ten minutes. Pen to paper.</Text>
          <View style={styles.encouragementLine} />
        </View>

        {/*  CTA  */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleBeginSession}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>Begin Today's Challenge</Text>
        </TouchableOpacity>

        <Text style={styles.sessionHint}>
          Write freely for ten minutes using today's creative prompt.
        </Text>
      </ScrollView>

      {/*  Modals  */}
      <WritingSessionModal
        visible={showSession}
        prompt={sessionPrompt}
        onClose={() => setShowSession(false)}
        onComplete={handleSessionComplete}
      />

      <ReflectionModal
        visible={showReflection}
        wordCount={sessionWordCount}
        writing={sessionWriting}
        prompt={sessionPrompt?.text ?? prompt?.text ?? ''}
        terms={sessionPrompt?.terms ?? prompt?.terms ?? []}
        image={sessionImage}
        onClose={() => setShowReflection(false)}
        onSave={() => {}}
        onExport={() => setShowExport(true)}
      />

      <StatsModal
        visible={showStats}
        onClose={() => setShowStats(false)}
      />

      <HistoryModal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <TermDetailModal
        visible={showTermDetail}
        term={selectedTerm?.id ?? null}
        onClose={() => setShowTermDetail(false)}
      />
      <QuoteModal
        visible={showQuote}
        quote={prompt?.text ?? ''}
        author={prompt?.author}
        onClose={() => setShowQuote(false)}
      />

      <AccountModal
        visible={showAccount}
        onClose={() => setShowAccount(false)}
      />

      <ExportModal
        visible={showExport}
        onClose={() => setShowExport(false)}
        prompt={sessionPrompt?.text ?? prompt?.text ?? ''}
        terms={sessionPrompt?.terms ?? prompt?.terms ?? []}
        writing={sessionWriting}
        wordCount={sessionWordCount}
      />
    </SafeAreaView>
  );
}

// 
// Styles
// 

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  //  App Header
  appHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerButtons: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  statsBtnMargin: { marginLeft: Spacing.md },
  appName: {
    fontFamily: Font.serifBold,
    fontSize: 26,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  appDate: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  statsBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardBg,
    marginTop: 4,
  },
  statsBtnText: {
    fontFamily: Font.serif,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  //  Card
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  cardLabel: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },

  //  Shuffle
  shuffleBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    backgroundColor: Colors.accentMuted,
  },
  shuffleBtnDisabled: { opacity: 0.5 },
  shuffleBtnText: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.accent,
    letterSpacing: 0.3,
  },

  //  Word reel
  wordReelWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  wordText: {
    fontFamily: Font.serifBold,
    fontSize: 32,        // reduced size for better fit on small screens
    color: Colors.textPrimary,
    letterSpacing: 1,
    // allow two lines but keep line height roughly original
    lineHeight: WORD_ROW_H / 2,
  },

  //  Techniques
  termRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  termChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    gap: 5,
    height: TERM_ROW_H + 12,
    overflow: 'hidden',
  },
  termChipI: {
    fontFamily: Font.serifItalic,
    fontSize: 12,
    color: Colors.accent,
    fontStyle: 'italic',
    lineHeight: TERM_ROW_H,
  },
  termChipLabel: {
    fontFamily: Font.serif,
    fontSize: 16,
    color: Colors.chipText,
    lineHeight: TERM_ROW_H,
  },
  termReelContainer: {
    minWidth: 80,
  },

  //  Encouragement
  encouragementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  encouragementLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
  encouragementText: {
    fontFamily: Font.serifItalic,
    fontSize: 13,
    color: Colors.textMuted,
  },

  //  CTA
  ctaButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    fontFamily: Font.serifBold,
    fontSize: 17,
    color: Colors.textOnAccent,
    letterSpacing: 0.3,
  },
  sessionHint: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
