import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';
import { calculateCTTR, calculateReadability, calculateSentenceVariety, getCTTRLabel } from '../../utils/analytics';
import { incrementSessionCount, updateDeviceRating } from '../../utils/curation';
import { todayLocalDate } from '../../utils/dates';
import { Term } from '../../utils/prompts';
import { saveSession } from '../../utils/storage';

type Props = {
  visible: boolean;
  onClose: () => void;
  wordCount: number;
  writing: string;
  /** quote prompt text for the session */
  prompt: string;
  /** optional author for the quote prompt */
  quoteAuthor?: string;
  terms: Term[];
  /** optional image URI/base64 captured during writing session */
  image?: string;
  /** Called after successfully saving the reflection. */
  onSave?: () => void;
  /** Called when the user taps "Share" to export their writing */
  onExport?: () => void;
};

export default function ReflectionModal({
  visible,
  onClose,
  wordCount,
  writing,
  prompt,
  quoteAuthor,
  terms,
  image,
  onSave,
  onExport,
}: Props) {
  const [deviceRatings, setDeviceRatings] = useState<Record<string, 'natural' | 'forced'>>({});
  const [sessionFeel, setSessionFeel] = useState<number>(0);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [scanImage, setScanImage] = useState<string | undefined>(undefined);

  const reset = () => {
    setDeviceRatings({});
    setSessionFeel(0);
    setNote('');
    setScanImage(undefined);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = todayLocalDate();
      await saveSession({
        date: today,
        wordCount,
        writing,
        vocab: JSON.stringify(deviceRatings),
        devices: sessionFeel > 0 ? String(sessionFeel) : '',
        good: '',
        bad: '',
        thoughts: note,
        prompt,
        quoteAuthor,
        terms,
        image: scanImage,
      });
      // Update curation system with device ratings
      for (const [deviceId, rating] of Object.entries(deviceRatings)) {
        await updateDeviceRating(deviceId, rating);
      }
      await incrementSessionCount();
      reset();
      onSave?.();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not save your reflection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setScanImage(image);
    }
  }, [visible, image]);

  const hasUnsavedData =
    Object.keys(deviceRatings).length > 0 || sessionFeel > 0 || note || scanImage;

  const handleClose = () => {
    if (hasUnsavedData) {
      Alert.alert(
        'Discard Reflection?',
        'Your unsaved reflection will be lost.',
        [
          { text: 'Keep writing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => { reset(); onClose(); },
          },
        ],
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>POST-SESSION REFLECTION</Text>
                <Text style={styles.title}>How did it go?</Text>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Text style={styles.closeBtn}>Dismiss</Text>
              </TouchableOpacity>
            </View>

            {/* Word count badge */}
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeValue}>{wordCount}</Text>
                <Text style={styles.badgeLabel}>words written</Text>
              </View>
              {terms.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeSubLabel}>Today's techniques</Text>
                  <Text style={styles.badgeTerms}>{terms.map((t) => t.label).join(', ')}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Writing Analysis */}
            {writing && writing.trim().length > 0 && (() => {
              const cttr = calculateCTTR(writing);
              const { label: cttrLabel } = getCTTRLabel(cttr);
              const readability = calculateReadability(writing);
              const variety = calculateSentenceVariety(writing);
              const hasMetrics = cttr > 0 || readability || variety;
              if (!hasMetrics) return null;
              return (
                <View style={styles.analysisSection}>
                  <Text style={styles.sectionEyebrow}>WRITING ANALYSIS</Text>
                  <View style={styles.analysisGrid}>
                    {cttr > 0 && (
                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisValue}>{cttr.toFixed(1)}</Text>
                        <Text style={styles.analysisLabel}>Vocabulary{"\n"}{cttrLabel}</Text>
                      </View>
                    )}
                    {readability && (
                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisValue}>{readability.fleschReadingEase}</Text>
                        <Text style={styles.analysisLabel}>Readability{"\n"}{readability.gradeLabel}</Text>
                      </View>
                    )}
                    {variety && (
                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisValue}>{variety.lengthVariation}</Text>
                        <Text style={styles.analysisLabel}>Sentence Variety{"\n"}{variety.label}</Text>
                      </View>
                    )}
                  </View>
                  {readability && (
                    <Text style={styles.analysisHint}>{readability.description}</Text>
                  )}
                  {variety && (
                    <Text style={styles.analysisHint}>{variety.description}</Text>
                  )}
                </View>
              );
            })()}

            <View style={styles.divider} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {scanImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: scanImage }} style={styles.imagePreview} resizeMode="contain" />
                  <Text style={styles.imagePreviewLabel}>Scanned image</Text>
                </View>
              ) : null}

              {/* Section 1 — Device ratings */}
              {terms.length > 0 && (
                <View style={styles.deviceSection}>
                  <Text style={styles.sectionEyebrow}>DEVICE RATINGS</Text>
                  {terms.map((term) => (
                    <View key={term.id} style={styles.deviceRatingRow}>
                      <Text style={styles.deviceName}>{term.label}</Text>
                      <View style={styles.ratingChips}>
                        <TouchableOpacity
                          style={[
                            styles.ratingChip,
                            styles.naturalChip,
                            deviceRatings[term.id] === 'natural' && styles.naturalChipActive,
                          ]}
                          onPress={() => setDeviceRatings(prev => ({...prev, [term.id]: 'natural'}))}
                        >
                          <Text style={[
                            styles.ratingChipText,
                            styles.naturalChipText,
                            deviceRatings[term.id] === 'natural' && styles.naturalChipTextActive,
                          ]}>felt natural</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.ratingChip,
                            styles.forcedChip,
                            deviceRatings[term.id] === 'forced' && styles.forcedChipActive,
                          ]}
                          onPress={() => setDeviceRatings(prev => ({...prev, [term.id]: 'forced'}))}
                        >
                          <Text style={[
                            styles.ratingChipText,
                            styles.forcedChipText,
                            deviceRatings[term.id] === 'forced' && styles.forcedChipTextActive,
                          ]}>felt forced</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Section 2 — Session feel */}
              <View style={styles.feelSection}>
                <Text style={styles.sectionEyebrow}>SESSION FEEL</Text>
                <View style={styles.feelRow}>
                  <Text style={styles.feelLabel}>struggled{'\n'}to start</Text>
                  <View style={styles.feelDots}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <TouchableOpacity
                        key={n}
                        style={[
                          styles.feelDot,
                          sessionFeel === n && styles.feelDotActive,
                        ]}
                        onPress={() => setSessionFeel(n)}
                      >
                        {sessionFeel === n && <View style={styles.feelDotInner} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.feelLabel}>couldn't{'\n'}stop</Text>
                </View>
              </View>

              {/* Section 3 — Optional note */}
              <View style={styles.noteSection}>
                <TextInput
                  style={styles.noteInput}
                  multiline
                  value={note}
                  onChangeText={setNote}
                  placeholder="Anything worth holding onto from today?"
                  placeholderTextColor={Colors.textMuted}
                  textAlignVertical="top"
                />
              </View>

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving' : 'Save Reflection'}
                </Text>
              </TouchableOpacity>

              {onExport && (
                <TouchableOpacity style={styles.exportButton} onPress={onExport}>
                  <Text style={styles.exportButtonText}>Share Writing</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.skipButton} onPress={() => { reset(); onClose(); }}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 24,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  eyebrow: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  title: {
    fontFamily: Font.serifBold,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  closeBtn: {
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.accent,
    paddingTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
  },
  badgeValue: {
    fontFamily: Font.serifBold,
    fontSize: 20,
    color: Colors.accent,
    lineHeight: 26,
  },
  badgeLabel: {
    fontFamily: Font.serif,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  badgeSubLabel: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  badgeTerms: {
    fontFamily: Font.serif,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
    backgroundColor: '#f0f0f0',
    marginBottom: Spacing.sm,
  },
  imagePreviewLabel: {
    fontFamily: Font.serif,
    fontSize: 10,
    color: Colors.textMuted,
  },

  /* Section 1 — Device ratings */
  deviceSection: {
    marginBottom: Spacing.lg,
  },
  sectionEyebrow: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  deviceRatingRow: {
    marginBottom: Spacing.sm,
  },
  deviceName: {
    fontFamily: Font.serifBold,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  ratingChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ratingChip: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
  },
  ratingChipText: {
    fontFamily: Font.serif,
    fontSize: 13,
  },
  naturalChip: {
    backgroundColor: '#e8f5e1',
    borderColor: '#c5debb',
  },
  naturalChipActive: {
    backgroundColor: '#d4ecc9',
    borderColor: '#4a7c3f',
  },
  naturalChipText: {
    color: '#4a7c3f',
  },
  naturalChipTextActive: {
    fontFamily: Font.serifBold,
    color: '#3a6331',
  },
  forcedChip: {
    backgroundColor: '#f0ece8',
    borderColor: '#d8d0c8',
  },
  forcedChipActive: {
    backgroundColor: '#e4ddd5',
    borderColor: '#7a6055',
  },
  forcedChipText: {
    color: '#7a6055',
  },
  forcedChipTextActive: {
    fontFamily: Font.serifBold,
    color: '#5c4539',
  },

  /* Section 2 — Session feel */
  feelSection: {
    marginBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  feelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  feelLabel: {
    fontFamily: Font.serif,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
    width: 64,
  },
  feelDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  feelDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feelDotActive: {
    borderColor: Colors.accent,
  },
  feelDotInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
  },

  /* Section 3 — Optional note */
  noteSection: {
    marginBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  noteInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 26,
    minHeight: 84,
  },

  /* Buttons */
  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: Font.serifBold,
    fontSize: 16,
    color: Colors.textOnAccent,
    letterSpacing: 0.3,
  },

  /* Writing Analysis */
  analysisSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  analysisGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  analysisItem: {
    alignItems: 'center',
    flex: 1,
  },
  analysisValue: {
    fontFamily: Font.serifBold,
    fontSize: 24,
    color: Colors.accent,
    lineHeight: 30,
  },
  analysisLabel: {
    fontFamily: Font.serif,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 15,
  },
  analysisHint: {
    fontFamily: Font.serifItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
  exportButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    backgroundColor: Colors.cardBg,
  },
  exportButtonText: {
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.accent,
    letterSpacing: 0.2,
  },
  skipButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
