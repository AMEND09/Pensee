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

function Field({
  label,
  value,
  onChange,
  placeholder,
  minLines,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minLines?: number;
}) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, { minHeight: (minLines ?? 3) * 28 }]}
        multiline
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        textAlignVertical="top"
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  input: {
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
  },
});

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
  const [vocab, setVocab] = useState('');
  const [devices, setDevices] = useState('');
  const [good, setGood] = useState('');
  const [bad, setBad] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [saving, setSaving] = useState(false);

  const [scanImage, setScanImage] = useState<string | undefined>(undefined);

  const reset = () => {
    setVocab('');
    setDevices('');
    setGood('');
    setBad('');
    setThoughts('');
    setScanImage(undefined);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await saveSession({
        date: today,
        wordCount,
        writing,
        vocab,
        devices,
        good,
        bad,
        thoughts,
        prompt,
        quoteAuthor,
        terms,
        image: scanImage,
      });
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

  const handleClose = () => {
    if (vocab || devices || good || bad || thoughts || scanImage) {
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

              <Field
                label="Vocabulary used"
                value={vocab}
                onChange={setVocab}
                placeholder="Which words from today's prompt did you incorporate?"
                minLines={2}
              />
              <Field
                label="Rhetorical devices used"
                value={devices}
                onChange={setDevices}
                placeholder="Which devices did you employ, and how?"
                minLines={2}
              />

              <View style={styles.sectionDivider}>
                <Text style={styles.sectionLabel}>REFLECTIONS</Text>
              </View>

              <Field
                label="What went well"
                value={good}
                onChange={setGood}
                placeholder="What felt natural, vivid, or effective in your writing?"
                minLines={3}
              />
              <Field
                label="What didn't"
                value={bad}
                onChange={setBad}
                placeholder="What felt forced, unclear, or underdeveloped?"
                minLines={3}
              />
              <Field
                label="Personal thoughts"
                value={thoughts}
                onChange={setThoughts}
                placeholder="Any other feelings, observations, or ideas to hold onto"
                minLines={3}
              />

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
  sectionDivider: {
    marginVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
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
