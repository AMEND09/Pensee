import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDailyPrompt, Prompt, Term } from '../../utils/prompts';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';
import WritingSessionModal from '../../components/modals/writing-session-modal';
import ReflectionModal from '../../components/modals/reflection-modal';
import StatsModal from '../../components/modals/stats-modal';
import TermDetailModal from '../../components/modals/term-detail-modal';

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

// 
// Home Screen
// 

export default function HomeScreen() {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const today = new Date();

  // Modal visibility state
  const [showSession, setShowSession] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showTermDetail, setShowTermDetail] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  // Data passed between writing  reflection
  const [sessionWriting, setSessionWriting] = useState('');
  const [sessionWordCount, setSessionWordCount] = useState(0);

  useEffect(() => {
    setPrompt(getDailyPrompt(today));
  }, []);

  const openTermDetail = useCallback((term: Term) => {
    setSelectedTerm(term);
    setShowTermDetail(true);
  }, []);

  const handleSessionComplete = useCallback(
    (writing: string, wordCount: number) => {
      setSessionWriting(writing);
      setSessionWordCount(wordCount);
      setShowSession(false);
      // Brief delay before opening reflection for a smooth transition
      setTimeout(() => setShowReflection(true), 350);
    },
    [],
  );

  const handleReflectionSave = useCallback(() => {
    // Reflection saves internally; just close  stats are now updated
  }, []);

  if (!prompt) return null;

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
          <TouchableOpacity
            style={styles.statsBtn}
            onPress={() => setShowStats(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.statsBtnText}>Statistics</Text>
          </TouchableOpacity>
        </View>

        {/*  Prompt Card  */}
        <View style={styles.card}>
          {/* Card header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Creative Word</Text>
          </View>

          <View style={styles.cardDivider} />

          {/* Prompt word - tap to see definition like the device chips */}
          <TouchableOpacity
            style={styles.wordWrapper}
            onPress={() => openTermDetail({ id: prompt.text, label: prompt.text })}
            activeOpacity={0.7}
          >
            <Text style={styles.wordText}>{prompt.text}</Text>
            </TouchableOpacity>
        </View>

        {/*  Techniques Card  */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>TODAY'S TECHNIQUES</Text>
          </View>
          <View style={styles.cardDivider} />

          <View style={styles.techInstructions}>
            <Text style={styles.techInstructionsText}>
              Incorporate at least one of these devices or words in your writing session.
              Tap any to see its definition.
            </Text>
          </View>

          <View style={styles.termRow}>
            {prompt.terms.map((term) => (
              <TouchableOpacity
                key={term.id}
                style={styles.termChip}
                onPress={() => openTermDetail(term)}
                activeOpacity={0.7}
              >
                <Text style={styles.termChipI}>i</Text>
                <Text style={styles.termChipLabel}>{term.label}</Text>
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
          onPress={() => setShowSession(true)}
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
        prompt={prompt}
        onClose={() => setShowSession(false)}
        onComplete={handleSessionComplete}
      />

      <ReflectionModal
        visible={showReflection}
        wordCount={sessionWordCount}
        writing={sessionWriting}
        terms={prompt.terms}
        onClose={() => setShowReflection(false)}
        onSave={handleReflectionSave}
      />

      <StatsModal
        visible={showStats}
        onClose={() => setShowStats(false)}
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
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
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
  typePill: {
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  typePillText: {
    fontFamily: Font.serif,
    fontSize: 11,
    color: Colors.accent,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },

  //  Blockquote 
  blockquoteWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  blockquoteText: {
    fontFamily: Font.serifItalic,
    fontSize: 18,
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  attribution: {
    fontFamily: Font.serif,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    paddingLeft: Spacing.md + 3,
  },

  //  Word prompt 
  wordWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  wordText: {
    fontFamily: Font.serifBold,
    fontSize: 38,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },

  //  Techniques 
  techInstructions: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  techInstructionsText: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
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
    paddingVertical: 6,
    gap: 5,
  },
  termChipI: {
    fontFamily: Font.serifItalic,
    fontSize: 12,
    color: Colors.accent,
    fontStyle: 'italic',
  },
  termChipLabel: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.chipText,
  },

  //  Encouragement 
  encouragementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  encouragementLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
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
