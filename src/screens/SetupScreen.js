import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import Backdrop from '../components/Backdrop';
import Puppet from '../components/Puppet';
import FeltButton from '../components/FeltButton';
import { useLang } from '../i18n';
import { fx } from '../sound';
import {
  colors,
  radius,
  ROUND_OPTIONS,
  PER_ROUND_OPTIONS,
  TIME_OPTIONS,
  DEFAULT_SETUP,
} from '../theme';

/** صف خيارات: عنوان + أزرار قيم */
function OptionRow({ label, options, value, onChange, suffix, row, align, accent, deep }) {
  return (
    <View style={styles.optionBlock}>
      <Text style={[styles.optionLabel, { textAlign: align }]}>{label}</Text>
      <View style={[styles.optionRow, { flexDirection: row }]}>
        {options.map((o) => {
          const active = o === value;
          return (
            <Pressable
              key={o}
              onPressIn={() => fx('tap', 'light')}
              onPress={() => onChange(o)}
              style={({ pressed }) => [
                styles.pill,
                {
                  backgroundColor: active ? accent : colors.white,
                  borderBottomColor: active ? deep : colors.stoneDeep,
                  borderBottomWidth: pressed ? 2 : 5,
                  transform: [{ translateY: pressed ? 3 : 0 }],
                },
              ]}
            >
              <Text style={[styles.pillText, active && { color: colors.white }]}>
                {o}
                {suffix || ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * إعدادات المباراة العامة فقط.
 * الباب والمستوى يُختاران قبل كل جولة على حدة.
 */
export default function SetupScreen({ teams, onStart, onBack }) {
  const { t, isRTL } = useLang();
  const [rounds, setRounds] = useState(DEFAULT_SETUP.rounds);
  const [perRound, setPerRound] = useState(DEFAULT_SETUP.perRound);
  const [seconds, setSeconds] = useState(DEFAULT_SETUP.seconds);

  const total = rounds * perRound;

  return (
    <Backdrop tint={colors.grape} scene="strip">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { flexDirection: t.row }]}>
          <Pressable onPress={onBack} onPressIn={() => fx('tap', 'light')} style={styles.back} hitSlop={12}>
            <Text style={styles.backText}>{t.back}</Text>
          </Pressable>
          <View style={styles.plate}>
            <Text style={styles.plateText}>{t.matchSetup}</Text>
          </View>
          <View style={{ width: 78 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={[styles.summary, { flexDirection: t.row }]}>
            <Puppet type="bird" size={52} color={colors.sun} deep={colors.sunDeep} mood="happy" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryTitle, { textAlign: t.align }]}>
                {teams ? `👥 ${teams[0]} · ${teams[1]}` : `👤 ${t.soloMode}`}
              </Text>
              <Text style={[styles.summarySub, { textAlign: t.align }]}>🎲 {t.variedRoundsHint}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <OptionRow
              label={`🎯 ${t.roundsLabel}`}
              options={ROUND_OPTIONS}
              value={rounds}
              onChange={setRounds}
              row={t.row}
              align={t.align}
              accent={colors.grape}
              deep={colors.grapeDeep}
            />
            <OptionRow
              label={`❓ ${t.perRoundLabel}`}
              options={PER_ROUND_OPTIONS}
              value={perRound}
              onChange={setPerRound}
              row={t.row}
              align={t.align}
              accent={colors.ocean}
              deep={colors.oceanDeep}
            />
            <OptionRow
              label={`⏱️ ${t.timeLabel}`}
              options={TIME_OPTIONS}
              value={seconds}
              onChange={setSeconds}
              suffix={t.secondsUnit}
              row={t.row}
              align={t.align}
              accent={colors.tomato}
              deep={colors.tomatoDeep}
            />
          </View>

          <View style={styles.totalPill}>
            <Text style={styles.totalText}>📚 {t.totalQuestionsLabel(total)}</Text>
          </View>

          <FeltButton
            label={t.startMatch}
            size="lg"
            isRTL={isRTL}
            color={colors.sun}
            deep={colors.sunDeep}
            onPress={() => onStart({ rounds, perRound, seconds })}
            style={{ marginTop: 14, alignSelf: 'center', minWidth: 230 }}
          />
          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 },
  back: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 4,
    borderBottomColor: colors.stoneDeep,
    width: 78,
    alignItems: 'center',
  },
  backText: { fontWeight: '900', color: colors.ink, fontSize: 14 },
  plate: {
    backgroundColor: colors.white,
    borderBottomWidth: 6,
    borderBottomColor: colors.stoneDeep,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  plateText: { fontSize: 21, fontWeight: '900', color: colors.ink },

  body: { paddingHorizontal: 18, paddingTop: 14, gap: 13 },

  summary: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: 11, alignItems: 'center', gap: 10 },
  summaryTitle: { fontSize: 16, fontWeight: '900', color: colors.white },
  summarySub: { fontSize: 12, fontWeight: '700', color: colors.sand, marginTop: 3, lineHeight: 17 },

  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderBottomWidth: 8,
    borderBottomColor: colors.stoneDeep,
    padding: 16,
    gap: 15,
  },
  optionBlock: { gap: 8 },
  optionLabel: { fontSize: 16, fontWeight: '900', color: colors.ink },
  optionRow: { gap: 9 },
  pill: { flex: 1, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  pillText: { fontSize: 18, fontWeight: '900', color: colors.ink },

  totalPill: {
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderBottomWidth: 4,
    borderBottomColor: colors.stoneDeep,
  },
  totalText: { fontSize: 14, fontWeight: '900', color: colors.ink },
});
