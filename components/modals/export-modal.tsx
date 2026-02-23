// @ts-nocheck
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import html2canvas from 'html2canvas';
import { Download, Share2, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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

// fixed dimensions for the export card. we render at a known width so
// the layout doesn’t collapse on narrow phones, and we can request a
// higher-resolution capture regardless of on-screen size.
const CARD_BASE_WIDTH = 360;
const CARD_BASE_HEIGHT = CARD_BASE_WIDTH * (5 / 4);

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
      <Text allowFontScaling={false} style={card.footerUrl}>{APP_URL.replace('https://', '')}</Text>
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
          <Text allowFontScaling={false} style={[card.chipText, small && card.chipTextSmall]}>{t.label}</Text>
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
  promptFontOverride,
  onPromptWrapperLayout,
  onPromptTextLayout,
}: {
  prompt: string;
  quoteAuthor?: string;
  terms?: { id: string; label: string }[];
  writing: string;
  wordCount: number;
  template: CardTemplate;
  // optional override and layout callbacks supplied by parent
  promptFontOverride?: number;
  onPromptWrapperLayout?: (e: any) => void;
  onPromptTextLayout?: (e: any) => void;
}) {
  // ── Text Focus ────────────────────────────────────────────────────────────
  if (template === 'text-focus') {
    const text = stripHtml(writing).trim();
    const writingFontSize =
      text.length > 1200 ? 10 : text.length > 900 ? 11 : text.length > 650 ? 12 : 13;
    const dynamicFont = promptFontOverride ?? promptFontSize(prompt, 16);
    return (
      <View style={card.container} nativeID="export-card">
        {/* Compact header: prompt + chips (no accent line, smaller spacing) */}
        <View style={card.textFocusHeader}>
          <View
            style={card.textFocusPromptWrapper}
            onLayout={onPromptWrapperLayout}
          >
            <Text
              allowFontScaling={false}
              style={[
                card.promptWordSmall,
                { fontSize: dynamicFont, lineHeight: dynamicFont * 1.3, marginBottom: 4 },
              ]}
              onLayout={onPromptTextLayout}
            >
              {prompt}
            </Text>
          </View>
          <ChipRow terms={terms} small />
        </View>

        {/* Divider */}
        <View style={card.divider} />

        {/* Writing — the star */}
        {text ? (
          <Text
            allowFontScaling={false}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            numberOfLines={12}
            style={[
              card.writingTextLarge,
              { fontSize: writingFontSize, lineHeight: Math.round(writingFontSize * 1.65) },
            ]}
          >
            {text}
          </Text>
        ) : null}

        {/* Word count */}
        <Text allowFontScaling={false} style={card.wordCount}>{wordCount} words</Text>

        <CardFooter />
      </View>
    );
  }

  // ── Quote Only ────────────────────────────────────────────────────────────
  if (template === 'quote-only') {
    // note: parent component may pass an override font and layout callbacks
    // via props when it needs to measure and adjust dynamically.
    const dynamicFont = promptFontOverride ?? promptFontSize(prompt, 42);
    return (
      <View style={card.container} nativeID="export-card">
        <View style={card.minimalTop}>
          <View style={card.accentLine} />
          <Text allowFontScaling={false} style={card.ornamentLarge}>✦</Text>
        </View>

        <View style={card.promptWrapper} onLayout={onPromptWrapperLayout}>
          <Text
            allowFontScaling={false}
            style={[
              card.promptWordLarge,
              { fontSize: dynamicFont, lineHeight: dynamicFont * 1.2, marginBottom: 0 },
            ]}
            onLayout={onPromptTextLayout}
          >
            {prompt}
          </Text>
        </View>

        <View style={card.minimalBottom}>
          <ChipRow terms={terms} />

          {quoteAuthor ? (
            <Text allowFontScaling={false} style={card.authorText}>— {quoteAuthor}</Text>
          ) : null}

          <CardFooter />
        </View>
      </View>
    );
  }

  // ── Quote Focus (default) ─────────────────────────────────────────────────
  const text = excerpt(writing);
  const writingFontSize = text.length > 160 ? 12 : 14;
  const dynamicFont = promptFontOverride ?? promptFontSize(prompt, 34);
  return (
    <View style={card.container} nativeID="export-card">
      <View style={card.accentLine} />
      <Text allowFontScaling={false} style={card.ornament}>✦</Text>

      <View
        style={card.quotePromptWrapper}
        onLayout={onPromptWrapperLayout}
      >
        <Text
          allowFontScaling={false}
          style={[
            card.promptWord,
            { fontSize: dynamicFont, lineHeight: dynamicFont * 1.22 },
          ]}
          onLayout={onPromptTextLayout}
        >
          {prompt}
        </Text>
      </View>

      <ChipRow terms={terms} />

      <View style={card.divider} />

      {text ? (
        <Text allowFontScaling={false} style={[card.writingText, { fontSize: writingFontSize }]}>{text}</Text>
      ) : null}

      <Text allowFontScaling={false} style={card.wordCount}>{wordCount} words</Text>

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
    alignSelf: 'center',
    marginBottom: 8,
    letterSpacing: 6,
  },
  ornamentLarge: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 20,
    color: Colors.accent,
    textAlign: 'center',
    alignSelf: 'center',
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
  promptWrapper: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
  },
  quotePromptWrapper: {
    width: '100%',
    minHeight: 88,
    maxHeight: 210,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textFocusPromptWrapper: {
    width: '100%',
    minHeight: 32,
    maxHeight: 96,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalTop: {
    alignItems: 'center',
  },
  minimalBottom: {
    alignItems: 'center',
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
  const [previewWidth, setPreviewWidth] = useState(CARD_BASE_WIDTH);

  // dynamic font size used by the quote-only (minimal) template. we start
  // with the heuristic base size and then shrink further if the rendered text
  // does not fit the available vertical space.
  const initialBase = template === 'text-focus' ? 16 : template === 'quote-focus' ? 34 : 40;
  const [promptFont, setPromptFont] = useState(() => promptFontSize(prompt, initialBase));
  const [wrapperHeight, setWrapperHeight] = useState(0);
  const [textHeight, setTextHeight] = useState(0);
  const previewCardWidth = Math.min(
    CARD_BASE_WIDTH,
    Math.max(220, previewWidth - Spacing.md * 2),
  );

  // reset font whenever the prompt or template changes
  useEffect(() => {
    const base = template === 'text-focus' ? 16 : template === 'quote-focus' ? 34 : 40;
    setPromptFont(promptFontSize(prompt, base));
    setWrapperHeight(0);
    setTextHeight(0);
  }, [prompt, template]);

  // if the text overflows the wrapper, shrink the font incrementally.
  useEffect(() => {
    const overflowBuffer = template === 'quote-focus' ? 18 : template === 'quote-only' ? 10 : 2;
    const minFont = template === 'quote-focus' ? 9 : template === 'quote-only' ? 10 : 8;
    if (
      wrapperHeight > 0 &&
      textHeight > 0 &&
      textHeight > Math.max(0, wrapperHeight - overflowBuffer) &&
      promptFont > minFont
    ) {
      setPromptFont((f) => f - 1);
    }
  }, [wrapperHeight, textHeight, promptFont, template]);

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
      // request a fixed-resolution capture rather than relying on whatever
      // size the view happened to be on screen. this stops the card from
      // shrinking on narrow phones and keeps text proportionate.
      const uri = await viewShotRef.current.capture({
        width: CARD_BASE_WIDTH * 3,   // 3× for a reasonably high-res image
        height: CARD_BASE_HEIGHT * 3,
        quality: 1,
      });
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
          <View
            style={styles.previewArea}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0) setPreviewWidth(w);
            }}
          >
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0 }}
              style={[styles.viewShot, { width: previewCardWidth }]}
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
                  promptFontOverride={promptFont}
                  onPromptWrapperLayout={(e) => setWrapperHeight(e.nativeEvent.layout.height)}
                  onPromptTextLayout={(e) => setTextHeight(e.nativeEvent.layout.height)}
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
    paddingHorizontal: Spacing.md,      // reduce side padding so card can stretch closer to screen edges
    paddingBottom: Spacing.lg,
    width: '100%',
  },
  viewShot: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    width: '100%',
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
