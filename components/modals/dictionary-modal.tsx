import { ChevronDown, ChevronUp, Search, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
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
import { OnlineEntry, fetchOnlineDefinition } from '../../utils/dictionary';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialQuery?: string;
};


//  Online result card (dictionaryapi.dev) 
function OnlineResultCard({ term, entry }: { term: string; entry: OnlineEntry }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  return (
    <View style={styles.resultCard}>
      <View style={styles.onlineHeader}>
        <Text style={styles.onlineBadge}>online</Text>
        <Text style={styles.resultTerm}>{term}</Text>
      </View>

      {entry.meanings.map((meaning, mi) => {
        const isOpen = expandedIdx === mi;
        return (
          <TouchableOpacity
            key={mi}
            style={styles.meaningBlock}
            onPress={() => setExpandedIdx(isOpen ? null : mi)}
            activeOpacity={0.75}
          >
            <View style={styles.meaningHeader}>
              <Text style={styles.resultType}>{meaning.partOfSpeech}</Text>
              {isOpen
                ? <ChevronUp size={16} color={Colors.textMuted} />
                : <ChevronDown size={16} color={Colors.textMuted} />}
            </View>

            {meaning.definitions.slice(0, isOpen ? undefined : 1).map((d, di) => (
              <View key={di} style={di > 0 ? styles.defSeparator : undefined}>
                <Text style={styles.resultDef}>{`${di + 1}. ${d.definition}`}</Text>
                {isOpen && !!d.example && (
                  <View style={styles.exampleBlock}>
                    <Text style={styles.exampleText}>{d.example}</Text>
                  </View>
                )}
              </View>
            ))}

            {isOpen && (
              <>
                {/* Synonyms */}
                {(meaning.synonyms.length > 0 ||
                  meaning.definitions.some((d) => d.synonyms.length > 0)) && (
                  <>
                    <Text style={styles.thesaurusLabel}>Synonyms</Text>
                    <View style={styles.synonymRow}>
                      {[
                        ...meaning.synonyms,
                        ...meaning.definitions.flatMap((d) => d.synonyms),
                      ]
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .slice(0, 12)
                        .map((s) => (
                          <View key={s} style={styles.chip}>
                            <Text style={styles.chipText}>{s}</Text>
                          </View>
                        ))}
                    </View>
                  </>
                )}

                {/* Antonyms */}
                {(meaning.antonyms.length > 0 ||
                  meaning.definitions.some((d) => d.antonyms.length > 0)) && (
                  <>
                    <Text style={[styles.thesaurusLabel, styles.antonymLabel]}>Antonyms</Text>
                    <View style={styles.synonymRow}>
                      {[
                        ...meaning.antonyms,
                        ...meaning.definitions.flatMap((d) => d.antonyms),
                      ]
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .slice(0, 12)
                        .map((a) => (
                          <View key={a} style={[styles.chip, styles.antonymChip]}>
                            <Text style={[styles.chipText, styles.antonymChipText]}>{a}</Text>
                          </View>
                        ))}
                    </View>
                  </>
                )}
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

//  Main modal 
export default function DictionaryModal({ visible, onClose, initialQuery = '' }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [onlineResult, setOnlineResult] = useState<null | { term: string; entry: OnlineEntry }>(null);

  React.useEffect(() => {
    let active = true;
    const term = query.trim();
    if (term !== '') {
      setLoading(true);
      fetchOnlineDefinition(term).then((res) => {
        if (!active) return;
        setLoading(false);
        setOnlineResult(res ? { term, entry: res } : null);
      });
    } else {
      setLoading(false);
      setOnlineResult(null);
    }
    return () => { active = false; };
  }, [query]);

  React.useEffect(() => {
    if (visible) setQuery(initialQuery);
  }, [visible, initialQuery]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>

          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <Text style={styles.title}>Dictionary & Thesaurus</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search definitions, synonyms, antonyms..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {loading && <ActivityIndicator size="small" color={Colors.accent} />}
          </View>

          <ScrollView
            style={styles.results}
            contentContainerStyle={styles.resultsContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {query.trim() === '' ? (
              <View style={styles.hintView}>
                <Text style={styles.hintTitle}>Dictionary</Text>
                <Text style={styles.hintBody}>
                  Search any word or rhetorical term for its definition, examples, synonyms, and antonyms. Results appear instantly as you type.
                </Text>
              </View>
            ) : onlineResult ? (
              <OnlineResultCard term={onlineResult.term} entry={onlineResult.entry} />
            ) : loading ? null : (
              <Text style={styles.noResults}>No results found for "{query}".</Text>
            )}
          </ScrollView>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    // Use an explicit height (not just maxHeight) so that the inner
    // ScrollView's flex:1 has a defined parent size to work against on native.
    height: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: Font.serifBold,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.textPrimary,
    height: 44,
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  //  Cards 
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  resultMeta: {
    flex: 1,
  },
  resultType: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.accent,
    marginBottom: 2,
  },
  resultTerm: {
    fontFamily: Font.serifBold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  resultDef: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  exampleBlock: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.xs,
    marginVertical: Spacing.xs,
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.sm,
  },
  exampleText: {
    fontFamily: Font.serifItalic,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  //  Online-specific 
  onlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  onlineBadge: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: Colors.textOnAccent,
    backgroundColor: Colors.accent,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  meaningBlock: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: Spacing.xs,
  },
  meaningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  defSeparator: {
    marginTop: Spacing.sm,
  },

  //  Thesaurus chips 
  thesaurusLabel: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  antonymLabel: {
    color: '#8b4040',
  },
  synonymRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.chipText,
  },
  antonymChip: {
    backgroundColor: 'rgba(139, 64, 64, 0.07)',
    borderColor: 'rgba(139, 64, 64, 0.25)',
  },
  antonymChipText: {
    color: '#7a3535',
  },

  //  Hint / empty state 
  hintView: {
    paddingTop: Spacing.xs,
  },
  hintTitle: {
    fontFamily: Font.serifBold,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  hintBody: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  browseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  noResults: {
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});
