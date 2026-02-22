import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <ScrollView style={styles.content}>
            <Text
              style={styles.quote}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {quote}
            </Text>
            {author ? <Text style={styles.author}>— {author}</Text> : null}
          </ScrollView>
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
  content: {
    flex: 1,
  },
  quote: {
    fontFamily: Font.serifBold,
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
  closeBtn: {
    alignSelf: 'flex-end',
    marginTop: Spacing.lg,
  },
  closeBtnText: {
    fontFamily: Font.serifBold,
    color: Colors.accent,
    fontSize: 14,
  },
});
