import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Download, Share2, X } from 'lucide-react-native';
import html2canvas from 'html2canvas';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
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

type Props = {
  visible: boolean;
  onClose: () => void;
  prompt: string;
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

function ExportCard({
  prompt,
  terms,
  writing,
  wordCount,
}: {
  prompt: string;
  terms?: { id: string; label: string }[];
  writing: string;
  wordCount: number;
}) {
  const text = excerpt(writing);

  return (
    <View style={card.container} nativeID="export-card">
      {/* Decorative top accent line */}
      <View style={card.accentLine} />

      {/* Ornament */}
      <Text style={card.ornament}>✦</Text>

      {/* Prompt word */}
      <Text style={card.promptWord}>{prompt}</Text>

      {/* Technique chips */}
      {terms && terms.length > 0 && (
        <View style={card.chipsRow}>
          {terms.map((t) => (
            <View key={t.id} style={card.chip}>
              <Text style={card.chipText}>{t.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Divider */}
      <View style={card.divider} />

      {/* Writing excerpt */}
      {text ? (
        <Text style={card.writingText}>{text}</Text>
      ) : null}

      {/* Word count */}
      <Text style={card.wordCount}>{wordCount} words</Text>

      {/* Bottom ornament + URL */}
      <View style={card.footer}>
        <View style={card.footerLine} />
        <Text style={card.footerUrl}>{APP_URL.replace('https://', '')}</Text>
        <View style={card.footerLine} />
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  container: {
    backgroundColor: '#fdf8f2',
    borderRadius: Radius.lg,
    padding: 28,
    width: 340,
    shadowColor: 'rgba(61,43,31,0.18)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e4d0be',
  },
  accentLine: {
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    marginBottom: 20,
    width: 40,
    alignSelf: 'center',
  },
  ornament: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 14,
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 6,
  },
  promptWord: {
    fontFamily: Platform.select({ ios: 'Georgia-Bold', default: 'serif' }),
    fontSize: 36,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 44,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
  },
  chipText: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 11,
    color: Colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 16,
  },
  writingText: {
    fontFamily: Platform.select({ ios: 'Georgia-Italic', default: 'serif' }),
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  wordCount: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
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

export default function ExportModal({
  visible,
  onClose,
  prompt,
  terms,
  writing,
  wordCount,
}: Props) {
  const viewShotRef = useRef<ViewShot | null>(null);
  const [capturing, setCapturing] = useState(false);

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
        <Pressable style={styles.container} onPress={() => {}}>
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
                  terms={terms}
                  writing={writing}
                  wordCount={wordCount}
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
        </Pressable>
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
  },
  cardBackground: {
    backgroundColor: '#f5ede0',
    padding: 20,
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
});
