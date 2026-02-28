import React, { useEffect, useState } from 'react';
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
import { getSessions, Stats } from '../../utils/storage';
import { rhetoricalDefinitions } from '../../utils/prompts';

type Props = {
  visible: boolean;
  onClose: () => void;
  stats: Stats | null;
  loading: boolean;
};

function StatBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

export default function StatsModal({ visible, onClose, stats: propStats, loading: propLoading }: Props) {
  // stats and loading are supplied by parent
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [practicedDevices, setPracticedDevices] = useState<string[]>([]);
  const [showDeviceLibrary, setShowDeviceLibrary] = useState(false);
  const [deviceMastery, setDeviceMastery] = useState<Record<string, 'natural' | 'developing' | 'untouched'>>({});

  // sync local copies with props to allow layout logic below unchanged
  useEffect(() => {
    setStats(propStats);
  }, [propStats]);
  useEffect(() => {
    setLoading(propLoading);
  }, [propLoading]);

  useEffect(() => {
    if (!visible) return;
    getSessions().then(sessions => {
      const allDeviceNames = Object.keys(rhetoricalDefinitions);
      const practiced = new Set<string>();
      const ratings: Record<string, string[]> = {};

      sessions.forEach(s => {
        // terms from session
        s.terms?.forEach(t => practiced.add(t.id));
        // try to parse device ratings from vocab field (new format)
        try {
          const parsed = JSON.parse(s.vocab);
          if (typeof parsed === 'object' && parsed !== null) {
            Object.entries(parsed).forEach(([key, val]) => {
              if (!ratings[key]) ratings[key] = [];
              ratings[key].push(val as string);
            });
          }
        } catch {}
      });

      const MASTERY_THRESHOLD = 2;
      const mastery: Record<string, 'natural' | 'developing' | 'untouched'> = {};
      allDeviceNames.forEach(name => {
        if (!practiced.has(name)) {
          mastery[name] = 'untouched';
        } else if (ratings[name] && ratings[name].filter(r => r === 'natural').length >= MASTERY_THRESHOLD) {
          mastery[name] = 'natural';
        } else {
          mastery[name] = 'developing';
        }
      });

      setPracticedDevices(Array.from(practiced));
      setDeviceMastery(mastery);
    });
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>WRITING STATISTICS</Text>
              <Text style={styles.title}>Your Progress</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.doneBtn}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {loading ? (
            <View style={styles.loadingView}>
              <ActivityIndicator color={Colors.accent} />
            </View>
          ) : stats && stats.totalSessions === 0 ? (
            <View style={styles.emptyView}>
              <Text style={styles.emptyTitle}>No sessions yet.</Text>
              <Text style={styles.emptyBody}>
                Complete your first writing session today to begin tracking your progress.
              </Text>
            </View>
          ) : (
            stats && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
              <View style={styles.body}>
                {/* Top two stats */}
                <View style={styles.statsRow}>
                  <StatBlock
                    label="Current Streak"
                    value={`${stats.streak}`}
                    sub={stats.streak === 1 ? 'day' : 'days'}
                  />
                  <View style={styles.statDivider} />
                  <StatBlock
                    label="Longest Streak"
                    value={`${stats.longestStreak}`}
                    sub={stats.longestStreak === 1 ? 'day' : 'days'}
                  />
                </View>

                <View style={styles.divider} />

                {/* Bottom two stats */}
                <View style={styles.statsRow}>
                  <StatBlock
                    label="Sessions Completed"
                    value={stats.totalSessions}
                  />
                  <View style={styles.statDivider} />
                  <StatBlock
                    label="Avg. Word Count"
                    value={stats.averageWordCount}
                    sub="words per session"
                  />
                </View>

                <View style={styles.divider} />

                {/* Total words */}
                <View style={styles.totalWordsRow}>
                  <Text style={styles.totalWordsLabel}>Total words written</Text>
                  <Text style={styles.totalWordsValue}>
                    {stats.totalWords.toLocaleString()}
                  </Text>
                </View>

                {/* Encouragement */}
                <View style={styles.quoteBlock}>
                  <Text style={styles.quoteText}>
                    "A word after a word after a word is power."
                  </Text>
                  <Text style={styles.quoteAttrib}> Margaret Atwood</Text>
                </View>

                {/* Device Coverage */}
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.deviceCoverageRow}
                  onPress={() => setShowDeviceLibrary(!showDeviceLibrary)}
                  activeOpacity={0.7}
                >
                  <View style={styles.deviceCoverageLeft}>
                    <Text style={styles.deviceCoverageTitle}>Devices Practiced</Text>
                    <Text style={styles.deviceCoverageCount}>
                      {practicedDevices.length} of {Object.keys(rhetoricalDefinitions).length}
                    </Text>
                  </View>
                  {/* Simple progress ring using a View */}
                  <View style={styles.progressRing}>
                    <Text style={styles.progressRingText}>
                      {Math.round((practicedDevices.length / Object.keys(rhetoricalDefinitions).length) * 100)}%
                    </Text>
                  </View>
                </TouchableOpacity>

                {showDeviceLibrary && (
                  <View style={styles.deviceLibrary}>
                    <View style={styles.deviceLegend}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#6b9e5f' }]} />
                        <Text style={styles.legendText}>Natural</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#d4a054' }]} />
                        <Text style={styles.legendText}>Developing</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: Colors.border }]} />
                        <Text style={styles.legendText}>Untouched</Text>
                      </View>
                    </View>
                    <View style={styles.deviceGrid}>
                      {Object.keys(rhetoricalDefinitions).map((name) => {
                        const status = deviceMastery[name] || 'untouched';
                        return (
                          <View
                            key={name}
                            style={[
                              styles.deviceChip,
                              status === 'natural' && styles.deviceChipNatural,
                              status === 'developing' && styles.deviceChipDeveloping,
                              status === 'untouched' && styles.deviceChipUntouched,
                            ]}
                          >
                            <Text style={[
                              styles.deviceChipText,
                              status === 'natural' && styles.deviceChipTextNatural,
                              status === 'developing' && styles.deviceChipTextDeveloping,
                            ]}>{name}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
              </ScrollView>
            )
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
    maxWidth: 460,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 12,
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
  doneBtn: {
    fontFamily: Font.serif,
    fontSize: 16,
    color: Colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
  },
  loadingView: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyView: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: Font.serifBold,
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  body: {
    paddingBottom: Spacing.lg,
  },
  scrollBody: {
    maxHeight: 500,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.sm,
  },
  statValue: {
    fontFamily: Font.serifBold,
    fontSize: 36,
    color: Colors.accent,
    lineHeight: 44,
  },
  statLabel: {
    fontFamily: Font.serif,
    fontSize: 12,
    letterSpacing: 0.5,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 2,
  },
  statSub: {
    fontFamily: Font.serif,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  totalWordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  totalWordsLabel: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalWordsValue: {
    fontFamily: Font.serifBold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  quoteBlock: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.sm,
  },
  quoteText: {
    fontFamily: Font.serifItalic,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  quoteAttrib: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.textMuted,
  },
  deviceCoverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  deviceCoverageLeft: {
    flex: 1,
  },
  deviceCoverageTitle: {
    fontFamily: Font.serif,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  deviceCoverageCount: {
    fontFamily: Font.serif,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  progressRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: Colors.accent,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingText: {
    fontFamily: Font.serifBold,
    fontSize: 13,
    color: Colors.accent,
  },
  deviceLibrary: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  deviceLegend: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: Font.serif,
    fontSize: 11,
    color: Colors.textMuted,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  deviceChip: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderWidth: 1,
  },
  deviceChipNatural: {
    backgroundColor: '#e8f5e1',
    borderColor: '#b8d4a8',
  },
  deviceChipDeveloping: {
    backgroundColor: '#fdf3e3',
    borderColor: '#e4c98a',
  },
  deviceChipUntouched: {
    backgroundColor: Colors.bg,
    borderColor: Colors.border,
  },
  deviceChipText: {
    fontFamily: Font.serif,
    fontSize: 11,
    color: Colors.textMuted,
  },
  deviceChipTextNatural: {
    color: '#4a7c3f',
  },
  deviceChipTextDeveloping: {
    color: '#a0762a',
  },
});
