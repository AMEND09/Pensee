
import { Flame, History, User as UserIcon } from 'lucide-react-native';
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
  useWindowDimensions,
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
import { allTermLabels, creativeWords, getDailyPrompt, getRandomPrompt, Prompt, rhetoricalDefinitions, Term } from '../../utils/prompts';
import { getStats, Stats } from '../../utils/storage';

// 
// Constants
// 

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
    fullWidth?: boolean;
    /**
     * When true the reel will scroll downward instead of upward.  This
     * reverses the animation and also flips the frames so the final value
     * still ends up in view.
     */
    reverse?: boolean;
  }
>(({ rowHeight, containerStyle, textStyle, fades = false, fadeColor = '#ffffff', maxLines = 1, fullWidth = true, reverse = false }, ref) => {
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
    <View style={[{ height: rowHeight, overflow: 'hidden', width: fullWidth ? '100%' : undefined }, containerStyle]}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {items.map((word, i) => (
          <View
            key={i}
            style={{ height: rowHeight, justifyContent: 'center', alignItems: 'flex-start', width: fullWidth ? '100%' : undefined }}
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
  const [displayText, setDisplayText] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [reelDone, setReelDone] = useState(false);
  const [quoteFitReady, setQuoteFitReady] = useState(true);
  const revealOpacity = useRef(new Animated.Value(1)).current;
  const isRevealingRef = useRef(false);

  // grab initial quote on mount
  useEffect(() => {
    getDailyPrompt(new Date()).then((p) => {
      setPrompt(p);
      setDisplayText(p.text);
      setLoadingPrompt(false);
    });
  }, []);

  const [isSpinning, setIsSpinning] = useState(false);
  const today = new Date();
  const { user } = useAuth();

  const { width, height } = useWindowDimensions();
  const mobile = width < 600;
  const horizontalPadding = mobile ? Spacing.md : Spacing.lg;
  const bottomPadding = mobile ? Spacing.xs : Spacing.lg * 5;

  // fixed viewport for quote area (same size whether spinning or static),
  // tuned by device size.
  const quoteBoxHeight = React.useMemo(() => {
    const ratio = mobile ? 0.26 : 0.2;
    const candidate = Math.round(height * ratio);
    const min = mobile ? 130 : 120;
    const max = mobile ? 240 : 240;
    return Math.max(min, Math.min(max, candidate));
  }, [height, mobile]);

  // Reel refs
  const wordReelRef = useRef<ReelRef>(null);
  const termReelRefs = useRef<(ReelRef | null)[]>([null, null, null]);

  // Snapshot of the prompt that was active when the writing session was opened
  const [sessionPrompt, setSessionPrompt] = useState<Prompt | null>(null);

  // Modal visibility
  const [showSession, setShowSession] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTermDetail, setShowTermDetail] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [showQuote, setShowQuote] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [streak, setStreak] = useState(0);

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

  // load streak & stats when app starts and whenever stats modal opens
  const refreshStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await getStats();
      setStats(s);
      setStreak(s.streak);
    } catch {}
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    if (showStats) refreshStats();
  }, [showStats, refreshStats]);

  const handleShuffle = useCallback(async () => {
    if (isSpinning || loadingPrompt || !prompt) return;
    let newPrompt: Prompt;
    try {
      newPrompt = await getRandomPrompt();
    } catch {
      setIsSpinning(false);
      return;
    }

    revealOpacity.setValue(0);
    isRevealingRef.current = false;
    setReelDone(false);
    setIsSpinning(true);

    // Update displayText early so the hidden measuring layer can fit during spin.
    setDisplayText(newPrompt.text);

    // End the reel on the real quote so there is no random-word snap.
    const wordFrames = [...shuffleArr(creativeWords).slice(0, 14), newPrompt.text];

    // count expected reel completions: one word plus one per technique term
    const totalReels = 1 + (newPrompt.terms?.length ?? 0);
    let completed = 0;
    const onDone = () => {
      completed++;
      if (completed >= totalReels) {
        setPrompt(newPrompt);
        setReelDone(true);
      }
    };

    // same stagger/velocity constants as before
    const WORD_BASE = 1200;
    const TERM_BASE = 2000;
    const TERM_STAGGER = 200;
    const TERM_VELOCITY = 2;
    const TERM_FRAME_COUNT = 10;

    if (wordReelRef.current) {
      wordReelRef.current.spin(wordFrames, WORD_BASE, onDone);
    } else {
      onDone();
    }

    newPrompt.terms.forEach((term, i) => {
      const termFrames = [
        ...shuffleArr(allTermLabels).slice(0, TERM_FRAME_COUNT * TERM_VELOCITY),
        term.label,
      ];
      const duration = TERM_BASE + i * TERM_STAGGER;
      const ref = termReelRefs.current[i];
      if (ref) {
        ref.spin(termFrames, duration, onDone);
      } else {
        onDone();
      }
    });
  }, [isSpinning, loadingPrompt, prompt, revealOpacity]);

  const openTermDetail = useCallback((term: Term) => {
    setSelectedTerm(term);
    setShowTermDetail(true);
  }, []);

  const handleBeginSession = useCallback(() => {
    setSessionPrompt(prompt);
    setShowSession(true);
  }, [prompt]);

  // Width of the text area inside the quote card, used by the off-screen measuring node.
  // scrollContent paddingHorizontal + quoteTouchable paddingHorizontal on both sides.
  const quoteTextWidth = React.useMemo(() => {
    const outerPad = mobile ? Spacing.md : Spacing.lg;  // scrollContent horizontal pad
    const innerPad = Spacing.lg;                         // quoteTouchable horizontal pad
    return Math.max(100, width - 2 * outerPad - 2 * innerPad);
  }, [width, mobile]);

  // Start at a reasonable ceiling; the measuring node will shrink it down if needed.
  const quoteBaseFontSize = React.useMemo(() => {
    const len = displayText.length;
    const widthScale = mobile ? Math.min(1.0, Math.max(0.75, width / 390)) : Math.min(1.2, Math.max(0.85, width / 1200));
    const heightScale = quoteBoxHeight / (mobile ? 160 : 180);
    let base = 30 * widthScale * heightScale;
    if (len > 220) base *= 0.55;
    else if (len > 180) base *= 0.62;
    else if (len > 140) base *= 0.70;
    else if (len > 100) base *= 0.80;
    else if (len > 60) base *= 0.90;
    const cap = mobile ? 34 : 38;
    return Math.round(Math.max(14, Math.min(cap, base)));
  }, [displayText, mobile, width, quoteBoxHeight]);

  const quoteMinFontSize = mobile ? 9 : 11;
  const [quoteFontSize, setQuoteFontSize] = useState(quoteBaseFontSize);

  // Reset to base whenever quote text or viewport changes.
  useEffect(() => {
    setQuoteFontSize(quoteBaseFontSize);
    setQuoteFitReady(false);
  }, [quoteBaseFontSize]);

  // Called by the off-screen measuring <Text> which has no height constraint.
  // Its onLayout reports the TRUE natural text height, so we can detect overflow
  // and shrink proportionally before the text is ever visible.
  const onMeasureQuoteLayout = useCallback((e: any) => {
    const h = e?.nativeEvent?.layout?.height ?? 0;
    if (!h) return;
    if (h > quoteBoxHeight && quoteFontSize > quoteMinFontSize) {
      setQuoteFitReady(false);
      const ratio = quoteBoxHeight / h;
      const next = Math.max(quoteMinFontSize, Math.floor(quoteFontSize * ratio) - 1);
      if (next < quoteFontSize) setQuoteFontSize(next);
      return;
    }
    setQuoteFitReady(true);
  }, [quoteFontSize, quoteBoxHeight, quoteMinFontSize]);

  // Only reveal the static quote when both the reel and font-fit are done.
  useEffect(() => {
    if (!isSpinning || !reelDone || !quoteFitReady || isRevealingRef.current) return;
    isRevealingRef.current = true;
    Animated.timing(revealOpacity, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      setReelDone(false);
      isRevealingRef.current = false;
    });
  }, [isSpinning, reelDone, quoteFitReady, revealOpacity]);

  // adjust line height relative to font size
  const quoteLineHeight = React.useMemo(() => {
    return Math.round(quoteFontSize * 1.3);
  }, [quoteFontSize]);

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

      {/* Off-screen measuring node — unconstrained height, exact text width.
          onLayout here reports the TRUE natural text height so we can fit
          the font before the text becomes visible. Must live outside any
          overflow:hidden or height-constrained ancestor. */}
      <View
        style={{ position: 'absolute', top: -9999, left: 0, width: quoteTextWidth, opacity: 0 }}
        pointerEvents="none"
      >
        <Text
          onLayout={onMeasureQuoteLayout}
          style={[styles.quoteText, { fontSize: quoteFontSize, lineHeight: quoteLineHeight }]}
        >
          {displayText}
        </Text>
      </View>

      <View style={styles.content}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding, paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
        >
        {/*  App Header  */}
        <View style={styles.appHeader}>
          <View>
            <Text style={styles.appName}>Pensée</Text>
            <Text style={styles.appDate}>{formatDate(today)}</Text>
          </View>
          <View style={styles.headerButtons}>
            {/* streak counter button, opens stats */}
            <TouchableOpacity
              style={styles.statsBtn}
              onPress={() => setShowStats(true)}
              activeOpacity={0.75}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Flame size={16} color={Colors.textSecondary} />
                <Text style={[styles.statsBtnText, { fontSize: 12 }]}>{streak}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statsBtn, styles.statsBtnMargin]}
              onPress={() => setShowHistory(true)}
              activeOpacity={0.75}
            >
              <History size={16} color={Colors.textSecondary} />
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
            <View style={{ height: quoteBoxHeight, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator />
            </View>
          ) : (
            // Both layers are always rendered so onLayout can pre-size the
            // quote text while the reel is spinning.  We swap visibility with
            // opacity so the text is measured (and font is fitted) before it
            // becomes visible, eliminating the snap.
            <View style={{ height: quoteBoxHeight }}>
              {/* Static quote — crossfades in when spin + fitting are complete */}
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  { opacity: isSpinning ? revealOpacity : 1 },
                ]}
              >
                <TouchableOpacity
                  style={[styles.quoteTouchable, StyleSheet.absoluteFillObject]}
                  onPress={() => {
                    if (!prompt || isSpinning) return;
                    setShowQuote(true);
                  }}
                  activeOpacity={0.7}
                  disabled={isSpinning}
                >
                  <View style={[styles.quoteWrapper, { height: quoteBoxHeight }]}>
                    <Text
                      style={[styles.quoteText, { fontSize: quoteFontSize, lineHeight: quoteLineHeight }]}
                    >
                      {displayText}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* Reel — visible while spinning, hidden after */}
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    opacity: isSpinning
                      ? revealOpacity.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
                      : 0,
                  },
                ]}
                pointerEvents="none"
              >
                <View
                  style={[styles.quoteTouchable, StyleSheet.absoluteFillObject]}
                >
                  <View style={[styles.quoteWrapper, { height: quoteBoxHeight }]}>
                    <WordReel
                      ref={wordReelRef}
                      rowHeight={quoteBoxHeight}
                      textStyle={[styles.wordText, { fontSize: quoteFontSize, lineHeight: quoteLineHeight }]}
                      maxLines={6}
                      reverse
                    />
                  </View>
                </View>
              </Animated.View>
            </View>
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
                <Text
              style={[
                styles.termChipI,
                { color: Object.prototype.hasOwnProperty.call(rhetoricalDefinitions, term.id) ? Colors.accent : Colors.textSecondary },
              ]}
            >
              {Object.prototype.hasOwnProperty.call(rhetoricalDefinitions, term.id) ? 'R' : 'V'}
            </Text>
                <WordReel
                  ref={(r) => { termReelRefs.current[i] = r; }}
                  rowHeight={TERM_ROW_H}
                  containerStyle={styles.termReelContainer}
                  textStyle={styles.termChipLabel}
                  fullWidth={false}
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

      </ScrollView>

        {/*  fixed footer with CTA so quote can grow without pushing it off screen */}
        <View style={styles.footer}>
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
        </View>
      </View>

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
        quoteAuthor={sessionPrompt?.author ?? prompt?.author}
        terms={sessionPrompt?.terms ?? prompt?.terms ?? []}
        image={sessionImage}
        onClose={() => setShowReflection(false)}
        onSave={() => {}}
        onExport={() => setShowExport(true)}
      />

      <StatsModal
        visible={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
        loading={statsLoading}
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
        quote={displayText || prompt?.text || ''}
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
        quoteAuthor={sessionPrompt?.author ?? prompt?.author}
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    paddingHorizontal: 0,
  },
  headerButtons: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  statsBtnMargin: { marginLeft: Spacing.md },
  appName: {
    fontFamily: Font.serifBold,
    fontSize: 26,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  appDate: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  statsBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
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
    paddingBottom: Spacing.xs,
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

  // layout helpers for new structure
  content: { flex: 1 },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.bg,
  },

  //  Word reel
  wordReelWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  // when spinning we still use the reel; otherwise the static quote below
  quoteTouchable: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  quoteWrapper: {
    width: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  quoteText: {
    fontFamily: Font.serif,
    fontSize: 32,
    color: Colors.textPrimary,
    letterSpacing: 1,
    // lineHeight now calculated per-font-size
  },
  wordText: {
    fontFamily: Font.serif,
    fontSize: 32,        // reduced size for better fit on small screens
    color: Colors.textPrimary,
    letterSpacing: 1,
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
    // color is set inline depending on type (rhetorical/vocab)
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
    minWidth: 28,
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
