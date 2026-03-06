import { Share2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';
import { fullDate, niceDate } from '../../utils/dates';
import { getSessions, Session } from '../../utils/storage';
// ExportModal will be required dynamically inside the component to avoid
// potential bundler order issues on web.  See runtime check below.

// 
// Types
// 

type FlatItem = {
  session: Session;
  isFirstOfDay: boolean;
  isLastOfDay: boolean;
  sessionIndexInDay: number;   // 0-based
  totalInDay: number;
  isFirstOverall: boolean;
  isLastOverall: boolean;
};

// 
// Helpers
// 


function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseVocabRatings(vocabRaw?: unknown): Array<{ term: string; rating: string }> {
  if (!vocabRaw) return [];
  let parsed: unknown = vocabRaw;
  if (typeof vocabRaw === 'string') {
    try {
      parsed = JSON.parse(vocabRaw);
    } catch {
      return [];
    }
  }
  if (!parsed || typeof parsed !== 'object') return [];
  return Object.entries(parsed as Record<string, unknown>)
    .filter(([term, rating]) => term.trim().length > 0 && typeof rating === 'string')
    .map(([term, rating]) => ({ term, rating: rating as string }));
}

function getVocabRatingStatus(rating: string): 'natural' | 'developing' | 'untouched' {
  const normalized = rating.trim().toLowerCase();
  if (normalized === 'natural') return 'natural';
  if (normalized === 'forced' || normalized === 'developing') return 'developing';
  return 'untouched';
}

/** Flatten a sorted (newest-first) session list into FlatItems with day-grouping metadata */
function flatten(sessions: Session[]): FlatItem[] {
  if (sessions.length === 0) return [];

  // Group by date preserving order
  const groups: Session[][] = [];
  let currentDate = '';
  let currentGroup: Session[] = [];

  for (const s of sessions) {
    if (s.date !== currentDate) {
      if (currentGroup.length) groups.push(currentGroup);
      currentGroup = [s];
      currentDate = s.date;
    } else {
      currentGroup.push(s);
    }
  }
  if (currentGroup.length) groups.push(currentGroup);

  const items: FlatItem[] = [];
  const allSessions = groups.flat();
  const total = allSessions.length;
  let overallIndex = 0;

  for (const group of groups) {
    const totalInDay = group.length;
    group.forEach((session, idx) => {
      items.push({
        session,
        isFirstOfDay: idx === 0,
        isLastOfDay: idx === totalInDay - 1,
        sessionIndexInDay: idx,
        totalInDay,
        isFirstOverall: overallIndex === 0,
        isLastOverall: overallIndex === total - 1,
      });
      overallIndex++;
    });
  }
  return items;
}

// 
// Constants
// 

const NODE_D = 26;
const NODE_D_SUB = 18;   // smaller node for 2nd+ session same day
const SPINE_W = 2;
const SPINE_COL_W = 44;

// 
// TimelineRow
// 

function TimelineRow({ item, onPress, onShare }: { item: FlatItem; onPress: () => void; onShare: () => void }) {
  const { session, isFirstOfDay, isLastOfDay, sessionIndexInDay, totalInDay, isFirstOverall, isLastOverall } = item;
  const { weekday, monthDay } = niceDate(session.date);
  const isSub = sessionIndexInDay > 0;             // 2nd+ session on same day
  const isSameGroupBelow = !isLastOfDay;           // next row is same day

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.72}>

      {/*  LEFT: date (only for first session of the day)  */}
      <View style={styles.dateCol}>
        {isFirstOfDay ? (
          <>
            <Text style={styles.dateWeekday}>{weekday}</Text>
            <Text style={styles.dateMonthDay}>{monthDay}</Text>
          </>
        ) : (
          <View style={styles.subBadgeWrapper}>
            <View style={styles.subBadge}>
              <Text style={styles.subBadgeText}>#{sessionIndexInDay + 1}</Text>
            </View>
          </View>
        )}
      </View>

      {/*  CENTER: spine + node  */}
      <View style={styles.spineCol}>
        {/* Top line: invisible for very first item */}
        <View style={[
          styles.spineTop,
          isFirstOverall && styles.spineInvisible,
          // Same-day connection line is slightly more prominent
          !isFirstOfDay && styles.spineIntraDay,
        ]} />

        {/* Node  smaller for sub-sessions */}
        <View style={isSub ? styles.nodeSmall : styles.node}>
          <View style={isSub ? styles.nodeInnerSmall : styles.nodeInner} />
        </View>

        {/* Bottom line: invisible for very last item */}
        <View style={[
          styles.spineBot,
          isLastOverall && styles.spineInvisible,
          // Intra-day connector is slightly different
          isSameGroupBelow && styles.spineIntraDay,
        ]} />
      </View>

      {/*  RIGHT: prompt + chips  */}
      <View style={[styles.promptCol, isSub && styles.promptColSub]}>
        {session.prompt ? (
          <Text style={isSub ? styles.promptWordSub : styles.promptWord} numberOfLines={2}>
            {session.prompt}
          </Text>
        ) : (
          <Text style={styles.promptMuted}></Text>
        )}
        <Text style={styles.wordCount}>{session.wordCount} words</Text>
      </View>

      {/* share button on far right */}
      <TouchableOpacity
        style={styles.rowShareBtn}
        onPress={(e) => {
          e.stopPropagation();
          onShare();
        }}
        activeOpacity={0.6}
      >
        <Share2 size={18} color={Colors.accent} />
      </TouchableOpacity>

    </TouchableOpacity>
  );
}

// 
// DetailSection
// 

function DetailSection({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  const plain = stripHtml(value);
  if (!plain) return null;
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{plain}</Text>
    </View>
  );
}

function VocabularySection({ vocab }: { vocab?: string }) {
  const ratings = parseVocabRatings(vocab);
  if (ratings.length === 0) return null;

  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailLabel}>VOCABULARY</Text>
      <View style={styles.detailChips}>
        {ratings.map(({ term, rating }) => (
          (() => {
            const status = getVocabRatingStatus(rating);
            return (
              <View
                key={term}
                style={[
                  styles.chip,
                  status === 'natural' && styles.vocabChipNatural,
                  status === 'developing' && styles.vocabChipDeveloping,
                  status === 'untouched' && styles.vocabChipUntouched,
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    status === 'natural' && styles.vocabChipTextNatural,
                    status === 'developing' && styles.vocabChipTextDeveloping,
                  ]}
                >
                  {term}
                </Text>
                <Text
                  style={[
                    styles.vocabRatingText,
                    status === 'natural' && styles.vocabChipTextNatural,
                    status === 'developing' && styles.vocabChipTextDeveloping,
                  ]}
                >
                  {' '}· {rating}
                </Text>
              </View>
            );
          })()
        ))}
      </View>
    </View>
  );
}

// 
// Session Detail Screen
// 

function SessionDetail({ session, onBack }: { session: Session; onBack: () => void }) {
  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>{''}</Text>
          <Text style={styles.backText}>Timeline</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.detailContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.detailDate}>{fullDate(session.date)}</Text>
        {session.prompt ? (
          <>
            <Text style={styles.detailHero}>{session.prompt}</Text>
            {session.quoteAuthor ? (
              <Text style={styles.detailAuthor}>— {session.quoteAuthor}</Text>
            ) : null}
          </>
        ) : (
          <Text style={[styles.detailHero, { color: Colors.textMuted, fontStyle: 'italic' }]}> 
            No prompt recorded
          </Text>
        )}

        {session.terms && session.terms.length > 0 && (
          <View style={styles.detailChips}>
            {session.terms.map((t) => (
              <View key={t.id} style={styles.chip}>
                <Text style={styles.chipLabel}>{t.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.detailDivider} />

        <DetailSection label="WRITING" value={session.writing} />
        <VocabularySection vocab={session.vocab} />
        <DetailSection label="LITERARY DEVICES" value={session.devices} />
        <DetailSection label="WHAT WENT WELL" value={session.good} />
        <DetailSection label="WHAT COULD IMPROVE" value={session.bad} />
        <DetailSection label="PERSONAL THOUGHTS" value={session.thoughts} />
      </ScrollView>
    </View>
  );
}

// 
// Main Modal
// 

export default function HistoryModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  // require inside component
  const ExportModal = require('./export-modal').default;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Session | null>(null);
  const [shareSession, setShareSession] = useState<Session | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const allTechniques = useMemo(() => {
    const techSet = new Set<string>();
    sessions.forEach(s => {
      s.terms?.forEach(t => techSet.add(t.label));
    });
    return Array.from(techSet).sort();
  }, [sessions]);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      getSessions()
        .then((s) => {
          // Sort descending by date, then by id (insertion time) within same day
          const sorted = [...s].sort((a, b) => {
            if (a.date !== b.date) return a.date < b.date ? 1 : -1;
            return a.id < b.id ? 1 : -1;
          });
          setSessions(sorted);
        })
        .finally(() => setLoading(false));
    } else {
      setSelected(null);
      setSearch('');
      setActiveFilters([]);
    }
  }, [visible]);

  const filtered = useMemo(() => {
    let result = sessions;

    // Apply text search
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (s) =>
          (s.prompt?.toLowerCase().includes(q) ?? false) ||
          stripHtml(s.writing).toLowerCase().includes(q) ||
          s.date.includes(q) ||
          (s.terms?.some((t) => t.label.toLowerCase().includes(q)) ?? false),
      );
    }

    // Apply technique filters
    if (activeFilters.length > 0) {
      result = result.filter(s =>
        s.terms?.some(t => activeFilters.includes(t.label)) ?? false
      );
    }

    return result;
  }, [search, sessions, activeFilters]);

  const flatItems = useMemo(() => flatten(filtered), [filtered]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={selected ? () => setSelected(null) : onClose}
    >
      <SafeAreaView style={styles.root}>
        {selected ? (
          <SessionDetail session={selected} onBack={() => setSelected(null)} />
        ) : (
          <View style={styles.flex}>

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>WRITING HISTORY</Text>
                <Text style={styles.title}>Past Sessions</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Text style={styles.doneBtn}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />

            {/* Search */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by prompt, technique, or date"
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            {/* Technique filter chips */}
            {allTechniques.length > 0 && (
              <View style={styles.filterRow}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterChipsContent}
                >
                  {allTechniques.map((tech) => {
                    const isActive = activeFilters.includes(tech);
                    return (
                      <TouchableOpacity
                        key={tech}
                        style={[
                          styles.filterChip,
                          isActive && styles.filterChipActive,
                        ]}
                        onPress={() => {
                          setActiveFilters(prev =>
                            isActive
                              ? prev.filter(f => f !== tech)
                              : [...prev, tech]
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.filterChipText,
                          isActive && styles.filterChipTextActive,
                        ]}>{tech}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {activeFilters.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearFiltersBtn}
                      onPress={() => setActiveFilters([])}
                    >
                      <Text style={styles.clearFiltersText}>Clear filters</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            )}

            {/* Column headers */}
            {!loading && flatItems.length > 0 && (
              <View style={styles.colHeaders}>
                <Text style={styles.colHeaderLeft}>DATE</Text>
                <View style={{ width: SPINE_COL_W }} />
                <Text style={styles.colHeaderRight}>PROMPT</Text>
              </View>
            )}

            {/* Body */}
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator color={Colors.accent} size="large" />
              </View>
            ) : flatItems.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>
                  {sessions.length === 0 ? 'No sessions yet.' : 'No results.'}
                </Text>
                <Text style={styles.emptyBody}>
                  {sessions.length === 0
                    ? 'Complete a writing session to start your history.'
                    : 'Try a different search term.'}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.timelineContent}
                showsVerticalScrollIndicator={false}
              >
                {flatItems.map((item) => (
                  <TimelineRow
                    key={item.session.id}
                    item={item}
                    onPress={() => setSelected(item.session)}
                    onShare={() => setShareSession(item.session)}
                  />
                ))}
              </ScrollView>
            )}

          </View>
        )}
      {/* share export modal for timeline items */}
      <ExportModal
        visible={!!shareSession}
        onClose={() => setShareSession(null)}
        prompt={shareSession?.prompt ?? ''}
        quoteAuthor={shareSession?.quoteAuthor}
        terms={shareSession?.terms}
        writing={shareSession?.writing ?? ''}
        wordCount={shareSession?.wordCount ?? 0}
      />
      {/* quoteAuthor is now stored on Session and passed along */}
      </SafeAreaView>
    </Modal>
  );
}

// 
// Styles
// 

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  eyebrow: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  title: {
    fontFamily: Font.serifBold,
    fontSize: 30,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  doneBtn: {
    fontFamily: Font.serif,
    fontSize: 17,
    color: Colors.accent,
    paddingBottom: 3,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
  },

  // Back
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { fontSize: 22, color: Colors.accent, lineHeight: 26 },
  backText: { fontFamily: Font.serif, fontSize: 17, color: Colors.accent },

  // Search
  searchRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontFamily: Font.serif,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  // Filter chips
  filterRow: {
    paddingLeft: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  filterChipsContent: {
    gap: 6,
    paddingRight: Spacing.lg,
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterChipText: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  filterChipTextActive: {
    color: Colors.textOnAccent,
  },
  clearFiltersBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  clearFiltersText: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.accent,
  },

  // Column headers
  colHeaders: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
    alignItems: 'center',
  },
  colHeaderLeft: {
    flex: 1,
    fontFamily: Font.serif,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    textAlign: 'right',
  },
  colHeaderRight: {
    flex: 1,
    fontFamily: Font.serif,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    paddingLeft: Spacing.md,
  },

  // Empty / loading
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  emptyTitle: {
    fontFamily: Font.serifBold,
    fontSize: 19,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyBody: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Timeline
  timelineContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    minHeight: 92,
    paddingHorizontal: Spacing.lg,
  },

  // Date column
  dateCol: {
    flex: 1,
    paddingRight: 10,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dateWeekday: {
    fontFamily: Font.serifBold,
    fontSize: 18,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  dateMonthDay: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Sub-session badge (for #2, #3 same day)
  subBadgeWrapper: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  subBadge: {
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  subBadgeText: {
    fontFamily: Font.serif,
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: 0.3,
  },

  // Spine
  spineCol: {
    width: SPINE_COL_W,
    alignItems: 'center',
  },
  spineTop: {
    flex: 1,
    width: SPINE_W,
    backgroundColor: Colors.divider,
    minHeight: 18,
  },
  spineBot: {
    flex: 1,
    width: SPINE_W,
    backgroundColor: Colors.divider,
    minHeight: 18,
  },
  spineInvisible: { backgroundColor: 'transparent' },
  // Intra-day segments: same accent-muted color to visually group them
  spineIntraDay: { backgroundColor: Colors.accentMuted },

  // Primary node
  node: {
    width: NODE_D,
    height: NODE_D,
    borderRadius: NODE_D / 2,
    backgroundColor: Colors.accentMuted,
    borderWidth: 2.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeInner: {
    width: NODE_D * 0.38,
    height: NODE_D * 0.38,
    borderRadius: (NODE_D * 0.38) / 2,
    backgroundColor: Colors.accent,
  },

  // Sub-session node (smaller, lighter)
  nodeSmall: {
    width: NODE_D_SUB,
    height: NODE_D_SUB,
    borderRadius: NODE_D_SUB / 2,
    backgroundColor: Colors.bg,
    borderWidth: 2,
    borderColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeInnerSmall: {
    width: NODE_D_SUB * 0.38,
    height: NODE_D_SUB * 0.38,
    borderRadius: (NODE_D_SUB * 0.38) / 2,
    backgroundColor: Colors.accentLight,
  },

  // Prompt column
  promptCol: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 14,
    paddingRight: 0,
  },
  promptColSub: {
    paddingTop: 2,
    paddingBottom: 10,
  },
  promptWord: {
    fontFamily: Font.serifBold,
    fontSize: 24,
    color: Colors.textPrimary,
    letterSpacing: 0.4,
    lineHeight: 30,
  },
  promptWordSub: {
    fontFamily: Font.serifBold,
    fontSize: 20,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    lineHeight: 26,
  },
  promptMuted: {
    fontFamily: Font.serifBold,
    fontSize: 22,
    color: Colors.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  chip: {
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipLabel: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.chipText,
  },
  wordCount: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
  },  rowShareBtn: {
    padding: Spacing.sm,
  },
  // Detail
  detailContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  detailDate: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailHero: {
    fontFamily: Font.serifBold,
    fontSize: 40,
    color: Colors.textPrimary,
    letterSpacing: 1,
    lineHeight: 48,
    marginBottom: Spacing.md,
  },
  detailAuthor: {
    fontFamily: Font.serif,
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  detailImage: {
    width: '100%',
    height: 200,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: '#f0f0f0',
  },
  detailChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.lg,
  },
  detailSection: { marginBottom: Spacing.lg },
  detailLabel: {
    fontFamily: Font.serif,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  detailValue: {
    fontFamily: Font.serif,
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 27,
  },
  vocabRatingText: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.textMuted,
  },
  vocabChipNatural: {
    backgroundColor: '#e8f5e1',
    borderColor: '#b8d4a8',
  },
  vocabChipDeveloping: {
    backgroundColor: '#fdf3e3',
    borderColor: '#e4c98a',
  },
  vocabChipUntouched: {
    backgroundColor: Colors.bg,
    borderColor: Colors.border,
  },
  vocabChipTextNatural: {
    color: '#4a7c3f',
  },
  vocabChipTextDeveloping: {
    color: '#a0762a',
  },
});
