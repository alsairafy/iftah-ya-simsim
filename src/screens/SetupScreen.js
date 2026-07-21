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
  const [source, setSource] = useState('local'); // 'local' | 'api'

  const total = rounds * perRound;

  const SOURCES = [
    { id: 'local', icon: '📚', title: t.sourceLocal, hint: t.sourceLocalHint, color: colors.grass, deep: colors.grassDeep },
    { id: 'api', icon: '📡', title: t.sourceApi, hint: t.sourceApiHint, color: colors.ocean, deep: colors.oceanDeep },
  ];

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

          {/* مصدر الأسئلة */}
          <View style={styles.card}>
            <Text style={[styles.optionLabel, { textAlign: t.align }]}>📖 {t.questionSource}</Text>
            {SOURCES.map((s) => {
              const on = source === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPressIn={() => fx('tap', 'light')}
                  onPress={() => setSource(s.id)}
                  style={({ pressed }) => [
                    styles.sourceRow,
                    {
                      backgroundColor: on ? s.color : colors.white,
                      borderBottomColor: on ? s.deep : colors.stoneDeep,
                      borderBottomWidth: pressed ? 2 : 5,
                      transform: [{ translateY: pressed ? 3 : 0 }],
                      flexDirection: t.row,
                    },
                  ]}
                >
                  <Text style={styles.sourceIcon}>{s.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sourceTitle, { textAlign: t.align }]}>{s.title}</Text>
                    <Text
                      style={[styles.sourceHint, { textAlign: t.align, color: on ? colors.cream : colors.cocoaSoft }]}
                    >
                      {s.hint}
                    </Text>
                  </View>
                  {on && <Text style={styles.sourceCheck}>✓</Text>}
                </Pressable>
              );
            })}
            {source === 'api' && <Text style={styles.apiNote}>{t.apiEnglishNote}</Text>}
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
            onPress={() => onStart({ rounds, perRound, seconds, source })}
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

  sourceRow: { borderRadius: radius.md, padding: 11, alignItems: 'center', gap: 10 },
  sourceIcon: { fontSize: 22 },
  sourceTitle: { fontSize: 15, fontWeight: '900', color: colors.ink },
  sourceHint: { fontSize: 11, fontWeight: '700', marginTop: 2, lineHeight: 16 },
  sourceCheck: { fontSize: 19, fontWeight: '900', color: colors.white },
  apiNote: { fontSize: 11, fontWeight: '800', color: colors.tomatoDeep, textAlign: 'center' },
});
