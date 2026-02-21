import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getEntry, OnlineEntry, fetchOnlineDefinition } from '../../utils/dictionary';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';

type Props = {
  term: string | null;
  visible: boolean;
  onClose: () => void;
};

export default function TermDetailModal({ term, visible, onClose }: Props) {
  const entry = term ? getEntry(term) : null;
  const [onlineEntry, setOnlineEntry] = React.useState<OnlineEntry | null>(null);
  const [loadingOnline, setLoadingOnline] = React.useState(false);

  React.useEffect(() => {
    setOnlineEntry(null);
    setLoadingOnline(false);
    if (term && !entry) {
      setLoadingOnline(true);
      fetchOnlineDefinition(term).then((res) => {
        setOnlineEntry(res);
        setLoadingOnline(false);
      });
    }
  }, [term, entry]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {entry && <Text style={styles.typeLabel}>{entry.type}</Text>}
              {!entry && onlineEntry && (
                <Text style={styles.typeLabel}>{onlineEntry.type}</Text>
              )}
              <Text style={styles.term}>{term}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {entry ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Definition */}
              <Text style={styles.sectionLabel}>DEFINITION</Text>
              <Text style={styles.definitionText}>{entry.definition}</Text>

              {/* Example */}
              <View style={styles.exampleBlock}>
                <Text style={styles.exampleText}>{entry.example}</Text>
              </View>

              {/* Synonyms */}
              {entry.synonyms.length > 0 && (
                <View style={styles.synonymSection}>
                  <Text style={styles.sectionLabel}>ALSO SEE</Text>
                  <View style={styles.synonymRow}>
                    {entry.synonyms.map((s) => (
                      <View key={s} style={styles.synonymChip}>
                        <Text style={styles.synonymText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          ) : loadingOnline ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Colors.accent} />
            </View>
          ) : onlineEntry ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionLabel}>DEFINITION</Text>
              <Text style={styles.definitionText}>{onlineEntry.definition}</Text>

              {onlineEntry.example ? (
                <View style={styles.exampleBlock}>
                  <Text style={styles.exampleText}>{onlineEntry.example}</Text>
                </View>
              ) : null}

              {onlineEntry.synonyms.length > 0 && (
                <View style={styles.synonymSection}>
                  <Text style={styles.sectionLabel}>ALSO SEE</Text>
                  <View style={styles.synonymRow}>
                    {onlineEntry.synonyms.map((s) => (
                      <View key={s} style={styles.synonymChip}>
                        <Text style={styles.synonymText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {onlineEntry.antonyms.length > 0 && (
                <View style={styles.synonymSection}>
                  <Text style={[styles.sectionLabel, styles.antonymLabel]}>ANTONYMS</Text>
                  <View style={styles.synonymRow}>
                    {onlineEntry.antonyms.map((a) => (
                      <View key={a} style={[styles.synonymChip, styles.antonymChip]}>
                        <Text style={[styles.synonymText, styles.antonymChipText]}>{a}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          ) : (
            <Text style={styles.notFound}>No entry found for "{term}".</Text>
          )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  typeLabel: {
    fontFamily: Font.serif,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.accent,
    marginBottom: 4,
  },
  term: {
    fontFamily: Font.serifBold,
    fontSize: 26,
    color: Colors.textPrimary,
    lineHeight: 32,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  closeBtnText: {
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionLabel: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  definitionText: {
    fontFamily: Font.serif,
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
    marginBottom: Spacing.md,
  },
  exampleBlock: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.sm,
  },
  exampleText: {
    fontFamily: Font.serifItalic,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  synonymSection: {
    marginTop: Spacing.xs,
  },
  synonymRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  synonymChip: {
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  synonymText: {
    fontFamily: Font.serif,
    fontSize: 13,
    color: Colors.chipText,
  },
  antonymLabel: {
    color: '#8b4040',
  },
  antonymChip: {
    backgroundColor: 'rgba(139, 64, 64, 0.07)',
    borderColor: 'rgba(139, 64, 64, 0.25)',
  },
  antonymChipText: {
    color: '#7a3535',
  },
  loaderContainer: {
    padding: Spacing.lg,
  },
  notFound: {
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.textMuted,
    padding: Spacing.lg,
    textAlign: 'center',
  },
});
