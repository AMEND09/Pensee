import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';
import { useAuth } from '../../utils/auth';
import { FeedbackKind, submitFeedbackRequest } from '../../utils/feedback';

type Props = {
  visible: boolean;
  onClose: () => void;
  source: 'account-modal' | 'landing-page';
};

export default function FeedbackModal({ visible, onClose, source }: Props) {
  const { user } = useAuth();
  const [kind, setKind] = useState<FeedbackKind>('bug');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const helperText = useMemo(
    () =>
      kind === 'bug'
        ? 'Share what happened and steps to reproduce it.'
        : 'Describe the feature and why it would help your writing flow.',
    [kind],
  );

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await submitFeedbackRequest({
        kind,
        title,
        details,
        source,
        email,
      });
      Alert.alert('Thanks', 'Your feedback was submitted.');
      setKind('bug');
      setTitle('');
      setDetails('');
      setEmail('');
      onClose();
    } catch (e: any) {
      Alert.alert('Could not submit', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Bug Report / Feature Request</Text>
            <TouchableOpacity onPress={handleClose} disabled={busy}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.kindRow}>
              <TouchableOpacity
                style={[styles.kindBtn, kind === 'bug' && styles.kindBtnActive]}
                onPress={() => setKind('bug')}
                disabled={busy}
              >
                <Text style={[styles.kindText, kind === 'bug' && styles.kindTextActive]}>Bug</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.kindBtn, kind === 'feature' && styles.kindBtnActive]}
                onPress={() => setKind('feature')}
                disabled={busy}
              >
                <Text style={[styles.kindText, kind === 'feature' && styles.kindTextActive]}>Feature</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helper}>{helperText}</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder={kind === 'bug' ? 'Crash when opening history' : 'Add weekly writing goals'}
              placeholderTextColor={Colors.textMuted}
              editable={!busy}
            />

            <Text style={styles.label}>Details</Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              style={[styles.input, styles.textarea]}
              placeholder={kind === 'bug' ? 'What happened, what you expected, and steps to reproduce.' : 'What should happen, where it should appear, and why it is useful.'}
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
              editable={!busy}
            />

            {!user && (
              <>
                <Text style={styles.label}>Email (optional)</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!busy}
                />
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitBtn, busy && styles.disabled]}
            onPress={handleSubmit}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? <ActivityIndicator color={Colors.textOnAccent} /> : <Text style={styles.submitText}>Submit</Text>}
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
    maxWidth: 520,
    maxHeight: '84%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Font.serifBold,
    fontSize: 18,
    color: Colors.textPrimary,
    flex: 1,
    paddingRight: Spacing.md,
  },
  close: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.accent,
  },
  content: {
    paddingBottom: Spacing.md,
  },
  kindRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  kindBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardBg,
  },
  kindBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentMuted,
  },
  kindText: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  kindTextActive: {
    color: Colors.accent,
  },
  helper: {
    fontFamily: Font.serif,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Font.serif,
    fontSize: 12,
    letterSpacing: 0.8,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  textarea: {
    minHeight: 120,
  },
  submitBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  submitText: {
    fontFamily: Font.serifBold,
    fontSize: 16,
    color: Colors.textOnAccent,
  },
  disabled: {
    opacity: 0.6,
  },
});
