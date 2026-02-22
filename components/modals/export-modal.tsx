// @ts-nocheck
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import html2canvas from 'html2canvas';
import { Download, Share2, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { APP_URL } from '../../constants/config';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CardTemplate = 'text-focus' | 'quote-focus' | 'quote-only';

type Props = {
  visible: boolean;
  onClose: () => void;
  prompt: string;
  quoteAuthor?: string;
  terms?: { id: string; label: string }[];
  writing: string;
  wordCount: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Scale a prompt font size down based on its character length */
function promptFontSize(text: string, base: number): number {
  const len = text.length;
  if (len <= 40) return base;
  if (len <= 80) return Math.round(base * 0.82);
  if (len <= 130) return Math.round(base * 0.68);
  if (len <= 180) return Math.round(base * 0.56);
  return Math.round(base * 0.46);
}

/** Return a short excerpt of the writing for display on the card */
function excerpt(writing: string, maxChars = 220): string {
  const plain = stripHtml(writing).trim();
  if (!plain) return '';
  if (plain.length <= maxChars) return plain;
  return plain.slice(0, maxChars).replace(/\s+\S*$/, '') + '…';
}

// ─────────────────────────────────────────────────────────────────────────────
// ExportCard — the styled view that gets captured
// ─────────────────────────────────────────────────────────────────────────────

function CardFooter() {
  return (
    <View style={card.footer}>
      <View style={card.footerLine} />
      <Text style={card.footerUrl}>{APP_URL.replace('https://', '')}</Text>
      <View style={card.footerLine} />
    </View>
  );
}

function ChipRow({ terms, small }: { terms?: { id: string; label: string }[]; small?: boolean }) {
  if (!terms || terms.length === 0) return null;
  return (
    <View style={[card.chipsRow, small && card.chipsRowSmall]}>
      {terms.map((t) => (
        <View key={t.id} style={[card.chip, small && card.chipSmall]}>
          <Text style={[card.chipText, small && card.chipTextSmall]}>{t.label}</Text>
        </View>
      ))}
    </View>
  );
}

function ExportCard({
  prompt,
  quoteAuthor,
  terms,
  writing,
  wordCount,
  template,
}: {
  prompt: string;
  quoteAuthor?: string;
  terms?: { id: string; label: string }[];
  writing: string;
  wordCount: number;
  template: CardTemplate;
}) {
  // ── Text Focus ────────────────────────────────────────────────────────────
  if (template === 'text-focus') {
    const text = excerpt(writing, 320);
    const writingFontSize = text.length > 240 ? 12 : 14;
    const pfs = promptFontSize(prompt, 16); // smaller base size
    return (
      <View style={card.container} nativeID="export-card">
        {/* Compact header: prompt + chips (no accent line, smaller spacing) */}
        <View style={card.textFocusHeader}>
          <Text style={[card.promptWordSmall, { fontSize: pfs, lineHeight: pfs * 1.3, marginBottom: 4 }]}>
            {prompt}
          </Text>
          <ChipRow terms={terms} small />
        </View>

        {/* Divider */}
        <View style={card.divider} />

        {/* Writing — the star */}
        {text ? (
          <Text style={[card.writingTextLarge, { fontSize: writingFontSize }]}>{text}</Text>
        ) : null}

        {/* Word count */}
        <Text style={card.wordCount}>{wordCount} words</Text>

        <CardFooter />
      </View>
    );
  }

  // ── Quote Only ────────────────────────────────────────────────────────────
  if (template === 'quote-only') {
    const pfs = promptFontSize(prompt, 42);
    return (
      <View style={[card.container, card.containerCentered]} nativeID="export-card">
        <View style={card.accentLine} />
        <Text style={card.ornamentLarge}>✦</Text>

        <Text style={[card.promptWordLarge, { fontSize: pfs, lineHeight: pfs * 1.25 }]}>
          {prompt}
        </Text>

        <ChipRow terms={terms} />

        {quoteAuthor ? (
          <Text style={card.authorText}>— {quoteAuthor}</Text>
        ) : null}

        <CardFooter />
      </View>
    );
  }

  // ── Quote Focus (default) ─────────────────────────────────────────────────
  const text = excerpt(writing);
  const writingFontSize = text.length > 160 ? 12 : 14;
  const pfs = promptFontSize(prompt, 36);
  return (
    <View style={card.container} nativeID="export-card">
      <View style={card.accentLine} />
      <Text style={card.ornament}>✦</Text>

      <Text style={[card.promptWord, { fontSize: pfs, lineHeight: pfs * 1.22 }]}>
        {prompt}
      </Text>

      <ChipRow terms={terms} />

      <View style={card.divider} />

      {text ? (
        <Text style={[card.writingText, { fontSize: writingFontSize }]}>{text}</Text>
      ) : null}

      <Text style={card.wordCount}>{wordCount} words</Text>

      <CardFooter />
    </View>
  );
}

const card = StyleSheet.create({
  // ── Shared container ────────────────────────────────────────────────────
  container: {
    backgroundColor: '#fdf8f2',
    borderRadius: Radius.lg,
    padding: 22,
    flex: 1,             // fill the cardBackground box — fixes cut-off & 4:5
    justifyContent: 'space-between',
    shadowColor: 'rgba(61,43,31,0.18)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e4d0be',
  },
  containerCentered: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Accent lines ────────────────────────────────────────────────────────
  accentLine: {
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    marginBottom: 20,
    width: 40,
    alignSelf: 'center',
  },
  accentLineSmall: {
    height: 2,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    marginBottom: 10,
    width: 28,
    alignSelf: 'center',
  },

  // ── Ornaments ───────────────────────────────────────────────────────────
  ornament: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 14,
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 6,
  },
  ornamentLarge: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 20,
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 8,
  },

  // ── Prompt words ────────────────────────────────────────────────────────
  promptWord: {
    fontFamily: Platform.select({ ios: 'Georgia-Bold', default: 'serif' }),
    fontSize: 36,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 44,
    marginBottom: 12,
  },
  promptWordSmall: {
    fontFamily: Platform.select({ ios: 'Georgia-Bold', default: 'serif' }),
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 24,
    marginBottom: 8,
  },
  promptWordLarge: {
    fontFamily: Platform.select({ ios: 'Georgia-Bold', default: 'serif' }),
    fontSize: 42,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 52,
    marginBottom: 16,
  },

  // ── Chips ───────────────────────────────────────────────────────────────
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  chipsRowSmall: {
    gap: 4,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
  },
  chipSmall: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  chipText: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 11,
    color: Colors.accent,
  },
  chipTextSmall: {
    fontSize: 9,
  },

  // ── Text focus header ───────────────────────────────────────────────────
  textFocusHeader: {
    alignItems: 'center',
    paddingTop: 0,
  },

  // ── Divider ─────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 16,
  },

  // ── Writing text ────────────────────────────────────────────────────────
  writingText: {
    fontFamily: Platform.select({ ios: 'Georgia-Italic', default: 'serif' }),
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  writingTextLarge: {
    fontFamily: Platform.select({ ios: 'Georgia-Italic', default: 'serif' }),
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 26,
    textAlign: 'left',
    marginBottom: 12,
    fontStyle: 'italic',
    flex: 1,
  },

  // ── Author ──────────────────────────────────────────────────────────────
  authorText: {
    fontFamily: Platform.select({ ios: 'Georgia-Italic', default: 'serif' }),
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    marginTop: 4,
    marginBottom: 20,
  },

  // ── Word count ──────────────────────────────────────────────────────────
  wordCount: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 16,
  },

  // ── Footer ──────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  footerUrl: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ExportModal
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES: { key: CardTemplate; label: string }[] = [
  { key: 'quote-focus', label: 'Quote' },
  { key: 'text-focus', label: 'Writing' },
  { key: 'quote-only', label: 'Minimal' },
];

export default function ExportModal({
  visible,
  onClose,
  prompt,
  quoteAuthor,
  terms,
  writing,
  wordCount,
}: Props) {
  const viewShotRef = useRef<ViewShot | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [template, setTemplate] = useState<CardTemplate>('quote-focus');

  const captureImage = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      // view-shot is not supported on web; use html2canvas to render the
      // card element to a canvas and return a data URL.
      setCapturing(true);
      try {
        const el = document.getElementById('export-card');
        if (!el) return null;
        const canvas = await html2canvas(el as HTMLElement, { backgroundColor: null });
        return canvas.toDataURL('image/png');
      } catch (err) {
        console.error('html2canvas capture failed', err);
        return null;
      } finally {
        setCapturing(false);
      }
    }

    if (!viewShotRef.current?.capture) return null;
    setCapturing(true);
    try {
      const uri = await viewShotRef.current.capture();
      return uri;
    } finally {
      setCapturing(false);
    }
  };

  const handleShare = async () => {
    const uri = await captureImage();
    if (!uri) return;

    if (Platform.OS === 'web') {
      // Sanitize filename - remove chars that are invalid in filenames
      const safePrompt = prompt.replace(/[^a-zA-Z0-9\s-]/g, '').trim().slice(0, 50);
      const a = document.createElement('a');
      a.href = uri;
      a.download = `pensee-${safePrompt || 'writing'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('Sharing not available', 'Sharing is not supported on this device.');
      return;
    }
    await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
  };

  const handleSaveToPhotos = async () => {
    if (Platform.OS === 'web') {
      await handleShare();
      return;
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Pensée needs access to your photo library to save the image.',
      );
      return;
    }

    const uri = await captureImage();
    if (!uri) return;

    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('Saved!', 'Your writing card has been saved to your photo library.');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* use ScrollView so tall modals are scrollable; contentContainer
            padding gives extra breathing room top/bottom */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingVertical: Spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>SHARE YOUR WRITING</Text>
              <Text style={styles.title}>Export</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Template selector */}
          <View style={styles.templateRow}>
            {TEMPLATES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.templateBtn,
                  template === t.key && styles.templateBtnActive,
                ]}
                onPress={() => setTemplate(t.key)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.templateBtnText,
                    template === t.key && styles.templateBtnTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview */}
          <View style={styles.previewArea}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0 }}
              style={styles.viewShot}
            >
              {/* Warm parchment background wrapper */}
              <View style={styles.cardBackground}>
                <ExportCard
                  prompt={prompt}
                  quoteAuthor={quoteAuthor}
                  terms={terms}
                  writing={writing}
                  wordCount={wordCount}
                  template={template}
                />
              </View>
            </ViewShot>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary, capturing && styles.disabled]}
              onPress={handleShare}
              disabled={capturing}
              activeOpacity={0.85}
            >
              {capturing ? (
                <ActivityIndicator color={Colors.textOnAccent} />
              ) : (
                <>
                  <Share2 size={16} color={Colors.textOnAccent} />
                  <Text style={styles.actionBtnPrimaryText}>Share</Text>
                </>
              )}
            </TouchableOpacity>

            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary, capturing && styles.disabled]}
                onPress={handleSaveToPhotos}
                disabled={capturing}
                activeOpacity={0.85}
              >
                <Download size={16} color={Colors.textPrimary} />
                <Text style={styles.actionBtnSecondaryText}>Save to Photos</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 16,
    paddingVertical: Spacing.lg, // give breathing room top/bottom
    maxHeight: ('90vh' as unknown) as number, // cast to satisfy RN types
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
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
  closeBtn: { padding: 4 },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  previewArea: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  viewShot: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    width: '100%',       // fill previewArea width (respects modal padding)
    aspectRatio: 4 / 5, // enforces 4:5 on the captured area
  },
  cardBackground: {
    flex: 1,             // fill viewShot so card.container also fills it
    backgroundColor: '#f5ede0',
    padding: 14,
    borderRadius: Radius.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnPrimaryText: {
    fontFamily: Font.serifBold,
    fontSize: 16,
    color: Colors.textOnAccent,
    letterSpacing: 0.2,
  },
  actionBtnSecondary: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnSecondaryText: {
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  disabled: { opacity: 0.55 },

  // Template selector
  templateRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  templateBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBg,
  },
  templateBtnActive: {
    backgroundColor: Colors.accentMuted,
    borderColor: Colors.accent,
  },
  templateBtnText: {
    fontFamily: Font.serif,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
  templateBtnTextActive: {
    color: Colors.accent,
    fontFamily: Font.serifBold,
  },
});
