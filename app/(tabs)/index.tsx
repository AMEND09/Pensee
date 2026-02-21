import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
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
import HistoryModal from '../../components/modals/history-modal';
import ReflectionModal from '../../components/modals/reflection-modal';
import StatsModal from '../../components/modals/stats-modal';
import TermDetailModal from '../../components/modals/term-detail-modal';
import WritingSessionModal from '../../components/modals/writing-session-modal';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';
import { allTermLabels, creativeWords, getDailyPrompt, getRandomPrompt, Prompt, Term } from '../../utils/prompts';

// 
// Constants
// 

const WORD_ROW_H = 54;   // height of a single frame in the main-word reel
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
// WordReel    vertical slot-machine strip
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
  }
>(({ rowHeight, containerStyle, textStyle, fades = false, fadeColor = '#ffffff' }, ref) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const [items, setItems] = useState<string[]>(['']);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useImperativeHandle(ref, () => ({
    spin(frames: string[], duration: number, onDone?: () => void) {
      if (animRef.current) animRef.current.stop();
      setItems(frames);
      translateY.setValue(0);
      if (duration === 0) {
        translateY.setValue(-(frames.length - 1) * rowHeight);
        onDone?.();
        return;
      }
      const anim = Animated.timing(translateY, {
        toValue: -(frames.length - 1) * rowHeight,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      animRef.current = anim;
      anim.start(({ finished }) => { if (finished) onDone?.(); });
    },
    show(value: string) {
      if (animRef.current) animRef.current.stop();
      setItems([value]);
      translateY.setValue(0);
    },
  }));

  const fadeH = Math.round(rowHeight * 0.38);

  return (
    <View style={[{ height: rowHeight, overflow: 'hidden' }, containerStyle]}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {items.map((word, i) => (
          <View
            key={i}
            style={{ height: rowHeight, justifyContent: 'center', alignItems: 'flex-start' }}
          >
            <Text style={textStyle} numberOfLines={1}>{word}</Text>
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
  // Initialise prompt synchronously so WordReels are mounted on first render
  const [prompt, setPrompt] = useState<Prompt>(() => getDailyPrompt(new Date()));
  const [isSpinning, setIsSpinning] = useState(false);
  const today = new Date();

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

  // Writing session data
  const [sessionWriting, setSessionWriting] = useState('');
  const [sessionWordCount, setSessionWordCount] = useState(0);

  // Show initial prompt in reels (no animation) after first mount
  useEffect(() => {
    wordReelRef.current?.show(prompt.text);
    prompt.terms.forEach((term, i) => {
      termReelRefs.current[i]?.show(term.label);
    });
  }, []);

  const handleShuffle = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);

    const newPrompt = getRandomPrompt();

    // Build word reel frames: 14 random words then the final word scrolling upward
    const wordFrames = [...shuffleArr(creativeWords).slice(0, 14), newPrompt.text];

    wordReelRef.current?.spin(wordFrames, 1700, () => {
      // Cascade the 3 term reels one after another
      let completed = 0;
      newPrompt.terms.forEach((term, i) => {
        const termFrames = [...shuffleArr(allTermLabels).slice(0, 10), term.label];
        setTimeout(() => {
          termReelRefs.current[i]?.spin(termFrames, 950, () => {
            completed++;
            if (completed === 3) {
              setPrompt(newPrompt);
              setIsSpinning(false);
            }
          });
        }, i * 300);
      });
    });
  }, [isSpinning]);

  const openTermDetail = useCallback((term: Term) => {
    setSelectedTerm(term);
    setShowTermDetail(true);
  }, []);

  const handleBeginSession = useCallback(() => {
    setSessionPrompt(prompt);
    setShowSession(true);
  }, [prompt]);

  const handleSessionComplete = useCallback(
    (writing: string, wordCount: number) => {
      setSessionWriting(writing);
      setSessionWordCount(wordCount);
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
              <Text style={styles.statsBtnText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statsBtn, styles.statsBtnMargin]}
              onPress={() => setShowStats(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.statsBtnText}>Statistics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/*  Prompt Card  */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Creative Word</Text>
            <TouchableOpacity
              style={[styles.shuffleBtn, isSpinning && styles.shuffleBtnDisabled]}
              onPress={handleShuffle}
              activeOpacity={0.7}
              disabled={isSpinning}
            >
              <Text style={styles.shuffleBtnText}>{isSpinning ? 'spinning' : '  shuffle'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          {/* Slot-machine word reel */}
          <TouchableOpacity
            style={styles.wordReelWrapper}
            onPress={() => !isSpinning && openTermDetail({ id: prompt.text, label: prompt.text })}
            activeOpacity={isSpinning ? 1 : 0.7}
          >
            <WordReel
              ref={wordReelRef}
              rowHeight={WORD_ROW_H}
              textStyle={styles.wordText}
            />
          </TouchableOpacity>
        </View>

        {/*  Techniques Card  */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>TODAY'S TECHNIQUES</Text>
          </View>
          <View style={styles.cardDivider} />


          <View style={styles.termRow}>
            {prompt.terms.map((term, i) => (
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
          A 10-minute timed writing session. The prompt stays visible throughout.
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
        prompt={sessionPrompt?.text ?? prompt.text}
        terms={sessionPrompt?.terms ?? prompt.terms}
        onClose={() => setShowReflection(false)}
        onSave={() => {}}
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
  },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
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
    fontSize: 38,
    color: Colors.textPrimary,
    letterSpacing: 1,
    lineHeight: WORD_ROW_H,
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
