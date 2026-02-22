import { LogIn, LogOut, Mail, Trash2, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import { PRIVACY_POLICY_URL, TERMS_URL } from '../../constants/config';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';
import { useAuth } from '../../utils/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Screen = 'main' | 'sign-in' | 'sign-up' | 'edit-name';

// ─────────────────────────────────────────────────────────────────────────────
// Sign-In form
// ─────────────────────────────────────────────────────────────────────────────

function SignInForm({
  onBack,
  onSignUp,
}: {
  onBack: () => void;
  onSignUp: () => void;
}) {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleEmail = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await signInWithEmail(email.trim(), password);
      onBack();
    } catch {
      Alert.alert('Sign-in failed', 'Please check your email and password and try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      onBack();
    } catch (e: any) {
      Alert.alert('Sign-in failed', e?.message ?? 'Could not sign in with Google. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.formContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>Sign In</Text>
      </View>

      <TouchableOpacity
        style={[styles.oauthBtn, busy && styles.disabled]}
        onPress={handleGoogle}
        disabled={busy}
        activeOpacity={0.8}
      >
        <Text style={styles.oauthBtnText}>Continue with Google</Text>
      </TouchableOpacity>

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.orLine} />
      </View>

      <Text style={styles.inputLabel}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
      />

      <Text style={styles.inputLabel}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        placeholderTextColor={Colors.textMuted}
        secureTextEntry
        textContentType="password"
      />

      <TouchableOpacity
        style={[styles.primaryBtn, busy && styles.disabled]}
        onPress={handleEmail}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color={Colors.textOnAccent} />
        ) : (
          <Text style={styles.primaryBtnText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkRow} onPress={onSignUp}>
        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkAccent}>Create one</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign-Up form
// ─────────────────────────────────────────────────────────────────────────────

function SignUpForm({
  onBack,
  onSignIn,
}: {
  onBack: () => void;
  onSignIn: () => void;
}) {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Your password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      await signUpWithEmail(email.trim(), password, name.trim());
      onBack();
    } catch (e: any) {
      Alert.alert('Could not create account', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      onBack();
    } catch (e: any) {
      Alert.alert('Sign-in failed', e?.message ?? 'Could not sign in with Google. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.formContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>Create Account</Text>
      </View>

      <TouchableOpacity
        style={[styles.oauthBtn, busy && styles.disabled]}
        onPress={handleGoogle}
        disabled={busy}
        activeOpacity={0.8}
      >
        <Text style={styles.oauthBtnText}>Continue with Google</Text>
      </TouchableOpacity>

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.orLine} />
      </View>

      <Text style={styles.inputLabel}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={Colors.textMuted}
        textContentType="name"
      />

      <Text style={styles.inputLabel}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
      />

      <Text style={styles.inputLabel}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        placeholderTextColor={Colors.textMuted}
        secureTextEntry
        textContentType="newPassword"
      />

      <TouchableOpacity
        style={[styles.primaryBtn, busy && styles.disabled]}
        onPress={handleCreate}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color={Colors.textOnAccent} />
        ) : (
          <Text style={styles.primaryBtnText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkRow} onPress={onSignIn}>
        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkAccent}>Sign in</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Name form
// ─────────────────────────────────────────────────────────────────────────────

function EditNameForm({
  currentName,
  onBack,
}: {
  currentName: string;
  onBack: () => void;
}) {
  const { updateProfile } = useAuth();
  const [name, setName] = useState(currentName);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }
    setBusy(true);
    try {
      await updateProfile({ name: name.trim() });
      onBack();
    } catch {
      Alert.alert('Error', 'Could not update your name. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>Edit Name</Text>
      </View>

      <Text style={styles.inputLabel}>Display Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={Colors.textMuted}
        autoFocus
      />

      <TouchableOpacity
        style={[styles.primaryBtn, busy && styles.disabled]}
        onPress={handleSave}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color={Colors.textOnAccent} />
        ) : (
          <Text style={styles.primaryBtnText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen (signed in)
// ─────────────────────────────────────────────────────────────────────────────

function AccountMain({
  onSignOut,
  onEditName,
  onDeleteAccount,
  onClose,
}: {
  onSignOut: () => void;
  onEditName: () => void;
  onDeleteAccount: () => void;
  onClose: () => void;
}) {
  const { user } = useAuth();

  const openPrivacy = () => Linking.openURL(PRIVACY_POLICY_URL);
  const openTerms = () => Linking.openURL(TERMS_URL);

  return (
    <ScrollView
      contentContainerStyle={styles.mainContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar placeholder */}
      <View style={styles.avatarCircle}>
        <User size={32} color={Colors.accent} />
      </View>

      <Text style={styles.userName}>{user?.name || 'Your Account'}</Text>
      <Text style={styles.userEmail}>{user?.email}</Text>

      <View style={styles.divider} />

      {/* Settings rows */}
      <Text style={styles.sectionLabel}>ACCOUNT</Text>

      <TouchableOpacity style={styles.row} onPress={onEditName} activeOpacity={0.7}>
        <User size={18} color={Colors.textSecondary} />
        <Text style={styles.rowLabel}>Change Name</Text>
        <Text style={styles.rowChevron}>›</Text>
      </TouchableOpacity>

      <View style={styles.rowDivider} />

      <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => {}}>
        <Mail size={18} color={Colors.textSecondary} />
        <Text style={styles.rowLabel}>{user?.email}</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>LEGAL</Text>

      <TouchableOpacity style={styles.row} onPress={openPrivacy} activeOpacity={0.7}>
        <Text style={styles.rowLabel}>Privacy Policy</Text>
        <Text style={styles.rowChevron}>›</Text>
      </TouchableOpacity>

      <View style={styles.rowDivider} />

      <TouchableOpacity style={styles.row} onPress={openTerms} activeOpacity={0.7}>
        <Text style={styles.rowLabel}>Terms of Service</Text>
        <Text style={styles.rowChevron}>›</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.row} onPress={onSignOut} activeOpacity={0.7}>
        <LogOut size={18} color={Colors.accent} />
        <Text style={[styles.rowLabel, styles.accentText]}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.rowDivider} />

      <TouchableOpacity style={styles.row} onPress={onDeleteAccount} activeOpacity={0.7}>
        <Trash2 size={18} color="#c0392b" />
        <Text style={[styles.rowLabel, styles.dangerText]}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Not signed in screen
// ─────────────────────────────────────────────────────────────────────────────

function NotSignedIn({
  onSignIn,
  onSignUp,
}: {
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  const openPrivacy = () => Linking.openURL(PRIVACY_POLICY_URL);
  const openTerms = () => Linking.openURL(TERMS_URL);

  return (
    <View style={styles.notSignedInContainer}>
      <View style={styles.avatarCircle}>
        <User size={32} color={Colors.textMuted} />
      </View>
      <Text style={styles.notSignedInTitle}>Your Writing, Everywhere</Text>
      <Text style={styles.notSignedInBody}>
        Sign in to back up your writing sessions and access them from any device.
      </Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={onSignIn} activeOpacity={0.85}>
        <LogIn size={16} color={Colors.textOnAccent} />
        <Text style={styles.primaryBtnText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={onSignUp} activeOpacity={0.85}>
        <Text style={styles.secondaryBtnText}>Create Account</Text>
      </TouchableOpacity>

      <View style={styles.legalRow}>
        <TouchableOpacity onPress={openPrivacy}>
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.legalSep}>·</Text>
        <TouchableOpacity onPress={openTerms}>
          <Text style={styles.legalLink}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal shell
// ─────────────────────────────────────────────────────────────────────────────

export default function AccountModal({ visible, onClose }: Props) {
  const { user, signOut, deleteAccount } = useAuth();
  const [screen, setScreen] = useState<Screen>('main');

  const handleClose = () => {
    setScreen('main');
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    setScreen('main');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              setScreen('main');
            } catch {
              Alert.alert('Error', 'Could not delete your account. Please try again.');
            }
          },
        },
      ],
    );
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
              <Text style={styles.headerTitle}>Account</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.headerDivider} />

            {/* Content */}
            {screen === 'main' && !user && (
              <NotSignedIn
                onSignIn={() => setScreen('sign-in')}
                onSignUp={() => setScreen('sign-up')}
              />
            )}
            {screen === 'main' && user && (
              <AccountMain
                onSignOut={handleSignOut}
                onEditName={() => setScreen('edit-name')}
                onDeleteAccount={handleDeleteAccount}
                onClose={handleClose}
              />
            )}
            {screen === 'sign-in' && (
              <SignInForm
                onBack={() => setScreen('main')}
                onSignUp={() => setScreen('sign-up')}
              />
            )}
            {screen === 'sign-up' && (
              <SignUpForm
                onBack={() => setScreen('main')}
                onSignIn={() => setScreen('sign-in')}
              />
            )}
            {screen === 'edit-name' && user && (
              <EditNameForm
                currentName={user.name}
                onBack={() => setScreen('main')}
              />
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '88%',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontFamily: Font.serifBold,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  headerDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },

  // Not signed in
  notSignedInContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  notSignedInTitle: {
    fontFamily: Font.serifBold,
    fontSize: 20,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  notSignedInBody: {
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },

  // Signed in - main
  mainContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.chipBorder,
  },
  userName: {
    fontFamily: Font.serifBold,
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    width: '100%',
  },
  rowLabel: {
    fontFamily: Font.serif,
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  rowChevron: {
    fontFamily: Font.serif,
    fontSize: 20,
    color: Colors.textMuted,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    width: '100%',
    marginVertical: Spacing.sm,
  },
  accentText: { color: Colors.accent },
  dangerText: { color: '#c0392b' },

  // Forms
  formContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.md,
  },
  formHeader: {
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontFamily: Font.serifBold,
    fontSize: 22,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  backLink: {
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  inputLabel: {
    fontFamily: Font.serif,
    fontSize: 12,
    letterSpacing: 0.8,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontFamily: Font.serif,
    fontSize: 16,
    color: Colors.textPrimary,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.lg,
    width: '100%',
  },
  primaryBtnText: {
    fontFamily: Font.serifBold,
    fontSize: 16,
    color: Colors.textOnAccent,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    width: '100%',
    backgroundColor: Colors.cardBg,
  },
  secondaryBtnText: {
    fontFamily: Font.serif,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  oauthBtn: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  oauthBtnText: {
    fontFamily: Font.serifBold,
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  orText: {
    fontFamily: Font.serif,
    fontSize: 13,
    color: Colors.textMuted,
  },
  disabled: { opacity: 0.55 },
  linkRow: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  linkText: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  linkAccent: {
    color: Colors.accent,
  },

  // Legal
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  legalLink: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  legalSep: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
