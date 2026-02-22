import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';
import { OnlineEntry, fetchOnlineDefinition } from '../../utils/dictionary';
import { rhetoricalDefinitions, rhetoricalExamples } from '../../utils/prompts';

type Props = {
  term: string | null;
  visible: boolean;
  onClose: () => void;
};

export default function TermDetailModal({ term, visible, onClose }: Props) {
  const [onlineEntry, setOnlineEntry] = React.useState<OnlineEntry | null>(null);
  const [loadingOnline, setLoadingOnline] = React.useState(false);

  React.useEffect(() => {
    setOnlineEntry(null);
    if (term) {
      // if we have manual examples for this rhetorical device, the
      // dictionary helper will return a fabricated entry without hitting
      // the network, but we still show the loading spinner briefly to
      // keep the UX consistent.
      setLoadingOnline(true);
      fetchOnlineDefinition(term).then((res) => {
        setOnlineEntry(res);
        setLoadingOnline(false);
      });
    } else {
      setLoadingOnline(false);
    }
  }, [term]);

  // determine offline label when we don't have an onlineEntry
  const offlineType: string | null = term
    ? term in rhetoricalDefinitions
      ? 'rhetorical device'
      : 'vocabulary'
    : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {onlineEntry ? (
                <Text style={styles.typeLabel}>{onlineEntry.type}</Text>
              ) : (
                offlineType && <Text style={styles.typeLabel}>{offlineType}</Text>
              )}
              <Text style={styles.term}>{term}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {(() => {
            if (loadingOnline) {
              return (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={Colors.accent} />
                </View>
              );
            }

            // if this term has predefined rhetorical examples or definitions,
            // render a simple list rather than the full dictionary layout.  we
            // guard again against the possibility that either map is missing (it
            // shouldn't be now that both are exported as objects) so the RHS of
            // `in` is always an object.
            if (
              term &&
              ((rhetoricalExamples && term in rhetoricalExamples) ||
                (rhetoricalDefinitions && term in rhetoricalDefinitions))
            ) {
              const examples = (rhetoricalExamples && rhetoricalExamples[term]) || [];
              const definition = (rhetoricalDefinitions && rhetoricalDefinitions[term]) || '';
              // render definition in dictionary style
              return (
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {definition && (
                    <View style={styles.meaningBlock}>
                      <Text style={styles.meaningHeader}>definition</Text>
                      <Text style={styles.definitionText}>{`1. ${definition}`}</Text>
                    </View>
                  )}
                  {examples.length > 0 && (
                    <>
                      <Text style={styles.meaningHeader}>Examples</Text>
                      {examples.map((ex, idx) => (
                        <View key={idx} style={styles.exampleBlock}>
                          <Text style={styles.exampleText}>{ex}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </ScrollView>
              );
            }

            if (onlineEntry) {
              return (
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* iterate over every meaning/definition pair */}
                  {onlineEntry.meanings.map((meaning, mi) => (
                    <View key={mi} style={styles.meaningBlock}>
                      <Text style={styles.meaningHeader}>
                        {meaning.partOfSpeech || 'definition'}
                      </Text>
                      {meaning.definitions.map((d, di) => (
                        <View key={di} style={di > 0 ? styles.defSeparator : undefined}>
                          <Text style={styles.definitionText}>{`${di + 1}. ${d.definition}`}</Text>
                          {d.example ? (
                            <View style={styles.exampleBlock}>
                              <Text style={styles.exampleLabel}>Example</Text>
                              <Text style={styles.exampleText}>{d.example}</Text>
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ))}

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
              );
            }
            return <Text style={styles.notFound}>No entry found for "{term}".</Text>;
          })()}
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
    marginBottom: Spacing.md, // tighter spacing between examples
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.sm,
  },
  exampleText: {
    fontFamily: Font.serifItalic,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },  definitionBlock: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
  definitionText: {
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
  },  exampleLabel: {
    fontFamily: Font.serifBold,
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  synonymSection: {
    marginTop: Spacing.xs,
  },
  meaningBlock: {
    marginTop: Spacing.md,
  },
  meaningHeader: {
    fontFamily: Font.serifBold,
    fontSize: 14,
    marginBottom: Spacing.xs,
    color: Colors.textPrimary,
  },
  defSeparator: {
    marginTop: Spacing.sm,
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
