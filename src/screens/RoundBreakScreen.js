import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Modal } from 'react-native';
import Backdrop from '../components/Backdrop';
import Puppet from '../components/Puppet';
import FeltButton from '../components/FeltButton';
import { useLang } from '../i18n';
import { colors, radius, levelStyles } from '../theme';

const levelLabel = (t, level) =>
  ({ easy: t.levelEasy, medium: t.levelMedium, hard: t.levelHard }[level] || t.mixedLevels);

/**
 * تظهر بعد كل جولة: ملخّص الجولة + المجموع التراكمي،
 * ثم زر ينتقل لاختيار باب ومستوى الجولة التالية.
 */
export default function RoundBreakScreen({
  teams,
  roundIndex,
  rounds,
  category,
  level,
  endedEarly,
  answered,
  roundSize,
  isLast,
  onNext,
  onEndMatch,
}) {
  const { t, isRTL, lang } = useLang();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const isTeamMode = teams.length > 1;
  const lvl = levelStyles[level] || levelStyles.mixed;

  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const lead = isTeamMode && sorted[0].score !== sorted[1].score ? sorted[0] : null;

  return (
    <Backdrop tint={colors.grape} scene="strip">
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.plateSmall}>
            <Text style={styles.plateSmallText}>
              {t.roundOver} · {t.roundsDone(roundIndex + 1, rounds)}
            </Text>
          </View>

          {/* الباب والمستوى الذي انتهى */}
          <View style={[styles.topicPill, { backgroundColor: category.deep }]}>
            <Text style={styles.topicText}>
              {category.emoji} {category[lang]} · {lvl.emoji} {levelLabel(t, level)}
            </Text>
          </View>

          {endedEarly && (
            <Text style={styles.earlyNote}>
              🏁 {answered}/{roundSize}
            </Text>
          )}

          <Puppet
            type={category.puppet}
            size={96}
            color={colors.cream}
            deep={colors.stoneDeep}
            mood="happy"
          />

          <View style={styles.card}>
            <Text style={styles.cardHeading}>{t.roundSummary}</Text>

            {teams.map((tm, i) => (
              <View key={i} style={[styles.row, { borderBottomColor: tm.deep, flexDirection: t.row }]}>
                <View style={[styles.dot, { backgroundColor: tm.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { textAlign: t.align }]} numberOfLines={1}>
                    {isTeamMode ? `${tm.emoji} ${tm.name}` : t.totalScore}
                  </Text>
                  <Text style={[styles.meta, { textAlign: t.align }]}>
                    ✓ {tm.correct}/{tm.asked} · 🔥 {tm.bestStreak}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.roundScore}>+{tm.roundScore}</Text>
                  <Text style={styles.roundLabel}>{t.thisRound}</Text>
                </View>
                <View style={styles.totalBox}>
                  <Text style={styles.total}>{tm.score}</Text>
                  <Text style={styles.roundLabel}>{t.matchTotal}</Text>
                </View>
              </View>
            ))}

            {isTeamMode && (
              <Text style={styles.leadNote}>
                {lead ? `${lead.emoji} ${lead.name} ${t.leading}` : `🤝 ${t.tied}`}
              </Text>
            )}
          </View>

          {!isLast && <Text style={styles.hint}>🎲 {t.variedRoundsHint}</Text>}

          <FeltButton
            label={isLast ? t.seeResult : t.setupNextRound}
            size="lg"
            isRTL={isRTL}
            color={colors.sun}
            deep={colors.sunDeep}
            onPress={onNext}
            style={{ minWidth: 240, marginTop: 6 }}
          />

          {/* إنهاء المباراة مبكراً — يعرض النتيجة النهائية لما لُعب */}
          {!isLast && (
            <FeltButton
              isRTL={isRTL}
              color={colors.white}
              deep={colors.stoneDeep}
              onPress={() => setConfirmEnd(true)}
              style={{ minWidth: 240 }}
            >
              <View>
                <Text style={styles.endText}>🏁  {t.endMatch}</Text>
                <Text style={styles.endHint}>{t.endMatchHint}</Text>
              </View>
            </FeltButton>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>

      <Modal visible={confirmEnd} transparent animationType="fade" onRequestClose={() => setConfirmEnd(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Puppet type="grouch" size={72} color={colors.grape} deep={colors.grapeDeep} mood="sad" />
            <Text style={styles.modalTitle}>{t.endMatchConfirm}</Text>
            <Text style={styles.modalBody}>{t.endMatchBody}</Text>
            <View style={[styles.modalRow, { flexDirection: t.row }]}>
              <FeltButton
                label={t.setupNextRound}
                isRTL={isRTL}
                color={colors.grass}
                deep={colors.grassDeep}
                textColor={colors.white}
                onPress={() => setConfirmEnd(false)}
                style={{ flex: 1 }}
              />
              <FeltButton
                label={t.confirm}
                isRTL={isRTL}
                color={colors.white}
                deep={colors.stoneDeep}
                onPress={() => {
                  setConfirmEnd(false);
                  onEndMatch();
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 11 },

  plateSmall: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 7 },
  plateSmallText: { color: colors.white, fontWeight: '900', fontSize: 14 },

  topicPill: { borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 7 },
  topicText: { color: colors.white, fontWeight: '900', fontSize: 14 },
  earlyNote: { color: colors.cream, fontWeight: '800', fontSize: 13 },

  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderBottomWidth: 8,
    borderBottomColor: colors.stoneDeep,
    padding: 15,
    width: '100%',
    gap: 10,
  },
  cardHeading: { fontSize: 18, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  row: {
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 10,
    borderBottomWidth: 5,
  },
  dot: { width: 22, height: 22, borderRadius: 11 },
  name: { fontSize: 15, fontWeight: '900', color: colors.ink },
  meta: { fontSize: 11, fontWeight: '700', color: colors.cocoaSoft, marginTop: 1 },
  roundScore: { fontSize: 17, fontWeight: '900', color: colors.grassDeep },
  totalBox: { alignItems: 'center', minWidth: 58 },
  total: { fontSize: 21, fontWeight: '900', color: colors.ink },
  roundLabel: { fontSize: 9, fontWeight: '700', color: colors.cocoaSoft },
  leadNote: { fontSize: 14, fontWeight: '900', color: colors.grapeDeep, textAlign: 'center' },

  hint: { fontSize: 13, fontWeight: '800', color: colors.white, textAlign: 'center', opacity: 0.95 },

  endText: { fontSize: 16, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  endHint: { fontSize: 11, fontWeight: '700', color: colors.cocoaSoft, textAlign: 'center', marginTop: 2 },

  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(51,36,29,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  modalCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderBottomWidth: 8,
    borderBottomColor: colors.stoneDeep,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 21, fontWeight: '900', color: colors.ink, marginTop: 8, textAlign: 'center' },
  modalBody: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.cocoaSoft,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 21,
  },
  modalRow: { gap: 10, marginTop: 16, width: '100%' },
});
