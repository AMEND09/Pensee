import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';
import { rhetoricalDefinitions } from '../../utils/prompts';
import type { Term } from '../../utils/prompts';

type Props = {
  visible: boolean;
  terms: Term[];
  onComplete: () => void;
};

export default function OnboardingModal({ visible, terms, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [revealedTerms, setRevealedTerms] = useState<Set<string>>(new Set());

  const handleTermTap = (termId: string) => {
    setRevealedTerms(prev => new Set(prev).add(termId));
  };

  const allTermsRevealed = terms.length > 0 && revealedTerms.size >= terms.length;

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setStep(0);
      setRevealedTerms(new Set());
      onComplete();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Step indicators */}
          <View style={styles.stepDots}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
            ))}
          </View>

          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ten minutes. One prompt. Three tools.</Text>
              <Text style={styles.stepBody}>
                Every day begins with someone else's words. Your job is to write past them.
              </Text>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Today's Techniques</Text>
              <Text style={styles.stepBody}>
                Three writing tools, waiting to be used. Tap each one — discover what it is before the clock starts.
              </Text>
              <View style={styles.termList}>
                {terms.map((term) => {
                  const isRevealed = revealedTerms.has(term.id);
                  const def = rhetoricalDefinitions[term.id] || 'A creative writing technique to explore in your session.';
                  return (
                    <TouchableOpacity
                      key={term.id}
                      style={[styles.termItem, isRevealed && styles.termItemRevealed]}
                      onPress={() => handleTermTap(term.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.termLabel}>{term.label}</Text>
                      {isRevealed && (
                        <Text style={styles.termDef}>{def}</Text>
                      )}
                      {!isRevealed && (
                        <Text style={styles.termHint}>tap to reveal</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[styles.nextBtn, !allTermsRevealed && styles.nextBtnMuted]}
                onPress={handleNext}
                disabled={!allTermsRevealed}
              >
                <Text style={[styles.nextBtnText, !allTermsRevealed && styles.nextBtnTextMuted]}>
                  {allTermsRevealed ? 'Continue' : 'Read all three first'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Freewriting</Text>
              <Text style={styles.stepBody}>
                The timer runs. The page fills. Nothing gets taken back.
              </Text>
              <Text style={styles.stepBody}>
                Resistance is normal. Write through it. The only rule: keep moving.
              </Text>
              <TouchableOpacity style={styles.beginBtn} onPress={handleNext}>
                <Text style={styles.beginBtnText}>Let's begin.</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Skip option */}
          {step < 2 && (
            <TouchableOpacity style={styles.skipBtn} onPress={onComplete}>
              <Text style={styles.skipText}>Skip introduction</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 12,
  },
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.accent,
  },
  stepContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  stepTitle: {
    fontFamily: Font.serifBold,
    fontSize: 24,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  stepBody: {
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  termList: {
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  termItem: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  termItemRevealed: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentMuted,
  },
  termLabel: {
    fontFamily: Font.serifBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  termDef: {
    fontFamily: Font.serif,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  termHint: {
    fontFamily: Font.serifItalic,
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  nextBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  nextBtnMuted: {
    backgroundColor: Colors.border,
  },
  nextBtnText: {
    fontFamily: Font.serifBold,
    fontSize: 16,
    color: Colors.textOnAccent,
  },
  nextBtnTextMuted: {
    color: Colors.textMuted,
  },
  beginBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  beginBtnText: {
    fontFamily: Font.serifBold,
    fontSize: 17,
    color: Colors.textOnAccent,
    letterSpacing: 0.3,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipText: {
    fontFamily: Font.serif,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
