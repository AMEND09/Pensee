import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onCancel} style={[styles.button, styles.cancelBtn]}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={[styles.button, styles.confirmBtn]}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
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
    padding: Spacing.lg,
    alignItems: 'stretch',
  },
  title: {
    fontFamily: Font.serifBold,
    fontSize: 18,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },
  message: {
    fontFamily: Font.serif,
    fontSize: 14,
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  button: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  cancelBtn: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmBtn: {
    backgroundColor: Colors.accent,
  },
  cancelText: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  confirmText: {
    fontFamily: Font.serifBold,
    fontSize: 14,
    color: Colors.textOnAccent,
  },
});
