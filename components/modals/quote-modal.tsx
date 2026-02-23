import React from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';

type Props = {
  visible: boolean;
  quote: string;
  author?: string;
  onClose: () => void;
};

// A very simple modal for displaying the full quote/author.  We use our own
// UI rather than Alert so that the experience is consistent across platforms
// and we can style the typography.
export default function QuoteModal({ visible, quote, author, onClose }: Props) {
  const trimmedQuote = quote?.trim() ?? '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.body}>
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
              {trimmedQuote ? (
                <Text style={styles.quote}>{trimmedQuote}</Text>
              ) : (
                <Text style={styles.emptyQuote}>No quote is available yet. Try shuffling for a new prompt.</Text>
              )}
              {author ? <Text style={styles.author}>— {author}</Text> : null}
            </ScrollView>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
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
    maxWidth: 480,
    maxHeight: '75%',
    minHeight: 180,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  body: {
    flexShrink: 1,
  },
  content: {
    maxHeight: 420,
  },
  contentContainer: {
    paddingBottom: Spacing.md,
  },
  quote: {
    fontFamily: Font.serif,
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    // wrap and allow multiple lines
    flexShrink: 1,
  },
  author: {
    fontFamily: Font.serifItalic,
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  emptyQuote: {
    fontFamily: Font.serif,
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginTop: Spacing.md,
  },
  closeBtnText: {
    fontFamily: Font.serifBold,
    color: Colors.accent,
    fontSize: 14,
  },
});
