import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, Easing, Dimensions, ScrollView } from 'react-native';
import Backdrop from '../components/Backdrop';
import Puppet from '../components/Puppet';
import FeltButton from '../components/FeltButton';
import { fx, duckMusic } from '../sound';
import { useLang } from '../i18n';
import { colors, radius, levelStyles } from '../theme';

const { height: H } = Dimensions.get('window');

function Star({ filled, delay }) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 16 }),
    ]).start();
  }, [pop, delay]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const rotate = pop.interpolate({ inputRange: [0, 1], outputRange: ['-120deg', '0deg'] });
  return (
    <Animated.Text style={[styles.star, { opacity: filled ? 1 : 0.25, transform: [{ scale }, { rotate }] }]}>
      ⭐
    </Animated.Text>
  );
}

function Confetti({ index }) {
  const fall = useRef(new Animated.Value(0)).current;
  const palette = [colors.sun, colors.tomato, colors.grass, colors.grape, colors.ocean, colors.white];
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(index * 110),
        Animated.timing(fall, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fall, index]);
  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-40, H + 40] });
  const rotate = fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(index % 2 ? 1 : -1) * 900}deg`] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${(index * 6.7) % 95}%`,
        width: 10,
        height: 15,
        borderRadius: 3,
        backgroundColor: palette[index % palette.length],
        transform: [{ translateY }, { rotate }],
      }}
    />
  );
}

export default function ResultScreen({ result, category, onReplay, onHome, isBest }) {
  const { t, isRTL, lang } = useLang();
  const { teams, isTeamMode, totalQ, didReset, history = [] } = result;

  // وضع الفريقين: نحدّد الفائز. وضع اللاعب الواحد: نجوم حسب الدقة.
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const draw = isTeamMode && sorted[0].score === sorted[1].score;
  const champion = isTeamMode && !draw ? sorted[0] : null;

  const solo = teams[0];
  const answered = solo.asked || totalQ; // العدد الفعلي الذي واجهه اللاعب
  const ratio = answered ? solo.correct / answered : 0;
  const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0;

  const celebrate = isTeamMode ? true : stars >= 2;

  useEffect(() => {
    duckMusic(2400); // نخفض الموسيقى حتى يُسمع الفانفير بوضوح
    fx(celebrate ? 'finish' : 'go', celebrate ? 'success' : 'light');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headline = isTeamMode
    ? draw
      ? t.itsADraw
      : t.winnerIs(champion.name)
    : t.rankName[3 - stars];

  return (
    <Backdrop tint={celebrate ? colors.grass : colors.sky} scene="strip">
      {celebrate && Array.from({ length: 16 }).map((_, i) => <Confetti key={i} index={i} />)}

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.plateSmall}>
            <Text style={styles.plateSmallText}>{t.matchOver}</Text>
          </View>

          <View
            style={[
              styles.plate,
              {
                backgroundColor: champion ? champion.color : celebrate ? colors.tomato : colors.grape,
                borderBottomColor: champion ? champion.deep : celebrate ? colors.tomatoDeep : colors.grapeDeep,
              },
            ]}
          >
            <Text style={styles.title}>{headline}</Text>
          </View>

          {!isTeamMode && (
            <View style={styles.starRow}>
              {[0, 1, 2].map((i) => (
                <Star key={i} filled={i < stars} delay={200 * i} />
              ))}
            </View>
          )}

          <Puppet
            type={champion ? champion.puppet : category.puppet}
            size={112}
            color={champion ? champion.color : category.color}
            deep={champion ? champion.deep : category.deep}
            mood={celebrate ? 'happy' : stars === 0 ? 'sad' : 'idle'}
          />

          {/* بطاقة النتائج */}
          <View style={styles.card}>
            {isBest && !isTeamMode && (
              <View style={styles.bestTag}>
                <Text style={styles.bestTagText}>{t.newRecord}</Text>
              </View>
            )}

            {isTeamMode ? (
              <>
                <Text style={styles.cardHeading}>{t.finalResult}</Text>
                {sorted.map((tm, i) => (
                  <View
                    key={i}
                    style={[
                      styles.teamRow,
                      { borderBottomColor: tm.deep, flexDirection: t.row },
                      i === 0 && !draw && styles.teamRowWin,
                    ]}
                  >
                    <View style={[styles.medal, { backgroundColor: tm.color }]}>
                      <Text style={styles.medalText}>{i === 0 && !draw ? '🏆' : tm.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.teamName, { textAlign: t.align }]} numberOfLines={1}>
                        {tm.name}
                      </Text>
                      <Text style={[styles.teamMeta, { textAlign: t.align }]}>
                        ✓ {tm.correct}/{tm.asked} · 🔥 {tm.bestStreak}
                      </Text>
                    </View>
                    <Text style={styles.teamScore}>{tm.score}</Text>
                  </View>
                ))}
              </>
            ) : (
              <>
                <Text style={styles.score}>{solo.score}</Text>
                <Text style={styles.scoreLabel}>{t.points}</Text>
                <View style={styles.divider} />
                <View style={[styles.stats, { flexDirection: t.row }]}>
                  <Stat value={`${solo.correct}/${answered}`} label={t.correctAnswers} />
                  <Stat value={`${Math.round(ratio * 100)}%`} label={t.accuracy} />
                  <Stat value={solo.bestStreak} label={t.bestStreak} accent />
                </View>
                <Text style={[styles.cheer, { writingDirection: t.dir }]}>
                  {stars >= 2 ? t.cheerHigh : t.cheerLow}
                </Text>
              </>
            )}

            {didReset && <Text style={styles.resetNote}>{t.poolReset}</Text>}
          </View>

          {/* سجلّ الجولات: أي باب ومستوى لُعب في كل جولة */}
          {history.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardHeading}>🎲 {t.roundsDone(history.length, history.length)}</Text>
              {history.map((h, i) => {
                const lvl = levelStyles[h.level] || levelStyles.mixed;
                const lvlName =
                  { easy: t.levelEasy, medium: t.levelMedium, hard: t.levelHard }[h.level] ||
                  t.mixedLevels;
                return (
                  <View key={i} style={[styles.historyRow, { flexDirection: t.row }]}>
                    <View style={[styles.historyNum, { backgroundColor: h.category.color }]}>
                      <Text style={styles.historyNumText}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.historyText, { textAlign: t.align }]} numberOfLines={1}>
                      {h.category.emoji} {h.category[lang]}
                    </Text>
                    <View style={[styles.historyLvl, { backgroundColor: lvl.color }]}>
                      <Text style={styles.historyLvlText}>
                        {lvl.emoji} {lvlName}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={[styles.actions, { flexDirection: t.row }]}>
            <FeltButton
              label={t.playAgain}
              isRTL={isRTL}
              color={colors.sun}
              deep={colors.sunDeep}
              onPress={onReplay}
              style={{ flex: 1 }}
            />
            <FeltButton
              label={t.home}
              isRTL={isRTL}
              color={colors.white}
              deep={colors.stoneDeep}
              onPress={onHome}
              style={{ flex: 1 }}
            />
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </Backdrop>
  );
}

function Stat({ value, label, accent }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent && { color: colors.tomato }]}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 11 },

  plateSmall: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 6 },
  plateSmallText: { color: colors.white, fontWeight: '900', fontSize: 13 },

  plate: { borderBottomWidth: 7, borderRadius: radius.lg, paddingHorizontal: 24, paddingVertical: 13 },
  title: { fontSize: 24, fontWeight: '900', color: colors.white, textAlign: 'center' },
  starRow: { flexDirection: 'row', gap: 5 },
  star: { fontSize: 38 },

  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderBottomWidth: 8,
    borderBottomColor: colors.stoneDeep,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  cardHeading: { fontSize: 17, fontWeight: '900', color: colors.ink },
  bestTag: {
    backgroundColor: colors.grape,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderBottomWidth: 3,
    borderBottomColor: colors.grapeDeep,
  },
  bestTagText: { color: colors.white, fontWeight: '900', fontSize: 13 },

  score: { fontSize: 46, fontWeight: '900', color: colors.ink, lineHeight: 54 },
  scoreLabel: { fontSize: 14, fontWeight: '800', color: colors.cocoaSoft, marginTop: -6 },
  divider: { height: 3, width: '60%', backgroundColor: colors.stoneDeep, borderRadius: 2 },
  stats: { width: '100%', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.ink },
  statLabel: { fontSize: 11, fontWeight: '700', color: colors.cocoaSoft, textAlign: 'center', marginTop: 2 },
  cheer: { fontSize: 13, fontWeight: '700', color: colors.cocoaSoft, textAlign: 'center', lineHeight: 20 },

  teamRow: {
    width: '100%',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 11,
    borderBottomWidth: 5,
  },
  teamRowWin: { borderWidth: 3, borderColor: colors.sun },
  medal: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  medalText: { fontSize: 18 },
  teamName: { fontSize: 16, fontWeight: '900', color: colors.ink },
  teamMeta: { fontSize: 12, fontWeight: '700', color: colors.cocoaSoft, marginTop: 1 },
  teamScore: { fontSize: 23, fontWeight: '900', color: colors.ink },

  resetNote: { fontSize: 12, fontWeight: '900', color: colors.grassDeep, textAlign: 'center' },

  historyRow: {
    width: '100%',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  historyNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  historyNumText: { fontSize: 12, fontWeight: '900', color: colors.white },
  historyText: { flex: 1, fontSize: 13, fontWeight: '800', color: colors.ink },
  historyLvl: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  historyLvlText: { fontSize: 10, fontWeight: '900', color: colors.ink },
  actions: { gap: 11, width: '100%', marginTop: 4 },
});
