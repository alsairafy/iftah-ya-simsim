import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Animated,
  Easing,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import Backdrop from '../components/Backdrop';
import Puppet from '../components/Puppet';
import Shape from '../components/Shape';
import FeltButton from '../components/FeltButton';
import { buildRound } from '../data';
import { fx, play } from '../sound';
import { useLang } from '../i18n';
import { colors, radius, answerStyles, levelStyles, TEAM_STYLES, MAX_POINTS } from '../theme';

const { height: H } = Dimensions.get('window');

const levelLabel = (t, level) =>
  ({ easy: t.levelEasy, medium: t.levelMedium, hard: t.levelHard }[level] || t.mixedLevels);

// نقاط حسب السرعة: من ٥٠٠ (آخر لحظة) إلى ١٠٠٠ (إجابة فورية)
function pointsFor(msLeft, totalMs) {
  const ratio = Math.max(0, Math.min(1, msLeft / totalMs));
  return Math.round((0.5 + ratio * 0.5) * MAX_POINTS);
}

export default function MatchScreen({ category, level, setup, teamNames, seen, onFinish, onQuit }) {
  const { t, lang, isRTL } = useLang();
  const { rounds, perRound, seconds } = setup;
  const totalQ = rounds * perRound;
  const totalMs = seconds * 1000;

  const built = useMemo(
    () => buildRound(category.id, level, seen, totalQ),
    [category.id, level, seen, totalQ]
  );
  const questions = built.round;

  // قد يكون بنك الفئة/المستوى أصغر مما طلبه اللاعب، فنعتمد العدد الفعلي
  // حتى تكون أرقام «الجولة س من ص» و«سؤال س من ص» صادقة دائماً.
  const realTotal = questions.length;
  const realRounds = Math.max(1, Math.ceil(realTotal / perRound));

  // الفريقان (أو لاعب واحد)
  const [teams, setTeams] = useState(() =>
    (teamNames || [null]).map((name, i) => ({
      name: name || t.soloMode,
      score: 0,
      correct: 0,
      asked: 0, // كم سؤالاً واجه هذا الفريق فعلاً (قد يختلف عند العدد الفردي)
      streak: 0,
      bestStreak: 0,
      ...TEAM_STYLES[i],
    }))
  );
  const isTeamMode = teams.length > 1;

  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | question | reveal | roundbreak
  const [countdown, setCountdown] = useState(3);
  const [picked, setPicked] = useState(null);
  const [gained, setGained] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);

  const round = Math.floor(qIndex / perRound); // 0-based
  const inRound = qIndex % perRound; // 0-based
  // عدد أسئلة هذه الجولة تحديداً (الجولة الأخيرة قد تكون أقصر)
  const roundSize = Math.min(perRound, realTotal - round * perRound);
  const activeIdx = isTeamMode ? qIndex % 2 : 0;
  const active = teams[activeIdx];

  const q = questions[qIndex];
  const text = q ? q[lang] : null;
  const isCorrect = picked === q?.answer;
  const lastOfRound = inRound + 1 >= roundSize;
  const lastOfMatch = qIndex + 1 >= realTotal;

  /* ---------- المؤقّت ---------- */
  const timer = useRef(new Animated.Value(1)).current;
  const deadline = useRef(0);
  const [tick, setTick] = useState(seconds);

  useEffect(() => {
    if (phase !== 'ready') return undefined;
    if (countdown <= 0) {
      fx('go', 'medium');
      setPhase('question');
      return undefined;
    }
    play('count');
    const id = setTimeout(() => setCountdown((c) => c - 1), 800);
    return () => clearTimeout(id);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'question') return undefined;
    deadline.current = Date.now() + totalMs;
    timer.setValue(1);
    const anim = Animated.timing(timer, {
      toValue: 0,
      duration: totalMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start();

    let lastSec = seconds;
    const id = setInterval(() => {
      const left = Math.max(0, deadline.current - Date.now());
      const sec = Math.ceil(left / 1000);
      setTick(sec);
      if (sec !== lastSec && sec <= 5 && sec > 0) play('tick');
      lastSec = sec;
      if (left <= 0) {
        clearInterval(id);
        answer('timeout');
      }
    }, 100);

    return () => {
      anim.stop();
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex]);

  const shake = useRef(new Animated.Value(0)).current;
  const pointsPop = useRef(new Animated.Value(0)).current;

  function answer(choice) {
    if (phase !== 'question') return;
    const msLeft = Math.max(0, deadline.current - Date.now());
    const right = choice === q.answer;

    // تُحسب قبل التحديث حتى تُعرض النقاط المكتسبة فوراً
    const nextStreak = active.streak + 1;
    const earned = right
      ? pointsFor(msLeft, totalMs) + (nextStreak >= 3 ? 200 : nextStreak === 2 ? 100 : 0)
      : 0;

    setTeams((prev) =>
      prev.map((tm, i) => {
        if (i !== activeIdx) return tm;
        if (!right) return { ...tm, asked: tm.asked + 1, streak: 0 };
        return {
          ...tm,
          score: tm.score + earned,
          correct: tm.correct + 1,
          asked: tm.asked + 1,
          streak: nextStreak,
          bestStreak: Math.max(tm.bestStreak, nextStreak),
        };
      })
    );

    if (right) {
      fx('correct', 'success');
      if (nextStreak >= 3) setTimeout(() => play('streak'), 420);
    } else {
      fx(choice === 'timeout' ? 'timeup' : 'wrong', 'error');
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    }

    setGained(earned);
    setPicked(choice);
    setPhase('reveal');
    pointsPop.setValue(0);
    Animated.spring(pointsPop, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 14 }).start();
  }

  function advance() {
    if (lastOfMatch) {
      onFinish({ teams, isTeamMode, totalQ: questions.length, keys: built.keys, didReset: built.didReset });
      return;
    }
    if (lastOfRound) {
      setPhase('roundbreak');
      return;
    }
    nextQuestion();
  }

  function nextQuestion() {
    setQIndex((i) => i + 1);
    setPicked(null);
    setGained(0);
    setCountdown(isTeamMode ? 3 : 2);
    setPhase('ready');
  }

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const timerWidth = timer.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const lvl = levelStyles[q?.level] || levelStyles.mixed;
  const tint = isTeamMode ? active.color : category.color;

  /* ---------- استعد ---------- */
  if (phase === 'ready') {
    return (
      <Backdrop tint={tint} scene="strip">
        <SafeAreaView style={styles.centerWrap}>
          <View style={styles.plateSmall}>
            <Text style={styles.plateSmallText}>{t.roundOf(round + 1, realRounds)}</Text>
          </View>

          {isTeamMode && (
            <View style={[styles.turnBanner, { backgroundColor: active.deep }]}>
              <Text style={styles.turnText}>{active.emoji} {t.turnOf(active.name)}</Text>
            </View>
          )}

          <Puppet
            type={isTeamMode ? active.puppet : category.puppet}
            size={126}
            color={colors.cream}
            deep={colors.stoneDeep}
            mood="happy"
          />
          <Text style={styles.bigWhite}>{t.getReady}</Text>
          <CountBubble value={countdown} />
          <Text style={styles.subWhite}>{t.questionOf(inRound + 1, roundSize)}</Text>
        </SafeAreaView>
      </Backdrop>
    );
  }

  /* ---------- نهاية الجولة ---------- */
  if (phase === 'roundbreak') {
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    const lead = isTeamMode && sorted[0].score !== sorted[1].score ? sorted[0] : null;

    return (
      <Backdrop tint={colors.grape} scene="strip">
        <SafeAreaView style={styles.centerWrap}>
          <View style={styles.plateSmall}>
            <Text style={styles.plateSmallText}>
              {t.roundOver} · {t.roundOf(round + 1, realRounds)}
            </Text>
          </View>

          <View style={styles.boardCard}>
            <Text style={styles.boardHeading}>{t.standings}</Text>
            {teams.map((tm, i) => (
              <TeamRow key={i} team={tm} row={t.row} align={t.align} isTeamMode={isTeamMode} t={t} />
            ))}
            {isTeamMode && (
              <Text style={styles.leadNote}>
                {lead ? `${lead.emoji} ${lead.name} ${t.leading}` : `🤝 ${t.tied}`}
              </Text>
            )}
          </View>

          <FeltButton
            label={t.nextRound}
            size="lg"
            isRTL={isRTL}
            color={colors.sun}
            deep={colors.sunDeep}
            onPress={nextQuestion}
            style={{ minWidth: 230 }}
          />
        </SafeAreaView>
      </Backdrop>
    );
  }

  /* ---------- السؤال والكشف ---------- */
  const revealing = phase === 'reveal';

  return (
    <Backdrop tint={tint} scene="strip">
      <SafeAreaView style={{ flex: 1 }}>
        {/* الشريط العلوي */}
        <View style={[styles.hud, { flexDirection: t.row }]}>
          <Pressable onPress={() => setConfirmQuit(true)} style={styles.quit} hitSlop={12}>
            <Text style={styles.quitText}>✕</Text>
          </Pressable>
          <View style={styles.hudChip}>
            <Text style={styles.hudText}>
              {t.roundOf(round + 1, realRounds)} · {inRound + 1}/{roundSize}
            </Text>
          </View>
          <View style={[styles.hudChip, { backgroundColor: colors.ink }]}>
            <Text style={[styles.hudText, { color: colors.white }]}>{lvl.emoji} {levelLabel(t, q.level)}</Text>
          </View>
        </View>

        {/* نقاط الفريقين */}
        <View style={[styles.scoreStrip, { flexDirection: t.row }]}>
          {teams.map((tm, i) => (
            <View
              key={i}
              style={[
                styles.scoreBox,
                { backgroundColor: tm.color, borderBottomColor: tm.deep },
                isTeamMode && i === activeIdx && styles.scoreBoxActive,
                isTeamMode && i !== activeIdx && { opacity: 0.55 },
              ]}
            >
              <Text style={styles.scoreName} numberOfLines={1}>
                {isTeamMode ? `${tm.emoji} ${tm.name}` : `⭐ ${t.totalScore}`}
              </Text>
              <Text style={styles.scoreValue}>{tm.score}</Text>
              {isTeamMode && i === activeIdx && (
                <View style={styles.turnDot}>
                  <Text style={styles.turnDotText}>{t.yourTurn}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* شريط الوقت */}
        <View style={styles.timerTrack}>
          <Animated.View
            style={[
              styles.timerFill,
              { width: timerWidth, backgroundColor: tick > seconds * 0.4 ? colors.grass : tick > seconds * 0.18 ? colors.sun : colors.tomato },
            ]}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: revealing ? 170 : 24 }}>
          <Animated.View style={[styles.qCard, { transform: [{ translateX }] }]}>
            <Text style={[styles.qText, { writingDirection: t.dir }]} numberOfLines={5} adjustsFontSizeToFit>
              {text.q}
            </Text>
          </Animated.View>

          <View style={[styles.midRow, { flexDirection: t.row }]}>
            <View style={styles.clock}>
              <Text style={styles.clockText}>{revealing ? '—' : tick}</Text>
            </View>
            <Puppet
              type={isTeamMode ? active.puppet : category.puppet}
              size={68}
              color={colors.cream}
              deep={colors.stoneDeep}
              mood={revealing ? (isCorrect ? 'happy' : 'sad') : 'idle'}
            />
            {active.streak >= 2 ? (
              <View style={styles.streakPill}>
                <Text style={styles.streakText}>🔥 {active.streak}</Text>
              </View>
            ) : (
              <View style={{ width: 54 }} />
            )}
          </View>

          <View style={styles.grid}>
            {text.o.map((opt, i) => {
              const st = answerStyles[i];
              const dim = revealing && i !== q.answer && i !== picked;
              const isRight = revealing && i === q.answer;
              const isWrongPick = revealing && i === picked && picked !== q.answer;

              return (
                <Pressable
                  key={i}
                  disabled={revealing}
                  onPressIn={() => !revealing && fx('tap', 'medium')}
                  onPress={() => answer(i)}
                  style={({ pressed }) => [
                    styles.tile,
                    {
                      backgroundColor: st.color,
                      borderBottomColor: st.deep,
                      borderBottomWidth: pressed ? 3 : 7,
                      transform: [{ translateY: pressed ? 4 : 0 }],
                      opacity: dim ? 0.32 : 1,
                    },
                    isRight && styles.tileRight,
                    isWrongPick && styles.tileWrong,
                  ]}
                >
                  <View style={[styles.tileRow, { flexDirection: t.row }]}>
                    <Shape kind={st.shape} size={20} />
                    <Text style={styles.tileText} numberOfLines={3} adjustsFontSizeToFit>
                      {opt}
                    </Text>
                  </View>
                  {isRight && <Text style={styles.mark}>✓</Text>}
                  {isWrongPick && <Text style={styles.mark}>✕</Text>}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {revealing && (
          <Animated.View
            style={[
              styles.reveal,
              {
                backgroundColor: isCorrect ? colors.grass : colors.tomato,
                borderBottomColor: isCorrect ? colors.grassDeep : colors.tomatoDeep,
                transform: [{ scale: pointsPop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
              },
            ]}
          >
            <View style={[styles.revealTop, { flexDirection: t.row }]}>
              <Text style={styles.revealTitle} numberOfLines={1}>
                {isCorrect ? `🎉 ${t.correct}` : picked === 'timeout' ? `⏰ ${t.timeUp}` : `💡 ${t.wrong}`}
              </Text>
              {isCorrect && <Text style={styles.revealPoints}>+{gained}</Text>}
            </View>
            <Text style={[styles.revealFact, { writingDirection: t.dir }]} numberOfLines={3}>
              {isCorrect ? text.f : `${t.theAnswerIs}: ${text.o[q.answer]}`}
            </Text>
            <FeltButton
              label={lastOfMatch ? t.seeResult : lastOfRound ? t.roundOver : t.next}
              isRTL={isRTL}
              size="sm"
              color={colors.white}
              deep={colors.stoneDeep}
              onPress={advance}
              style={{ marginTop: 10, alignSelf: 'center', minWidth: 160 }}
            />
          </Animated.View>
        )}
      </SafeAreaView>

      <Modal visible={confirmQuit} transparent animationType="fade" onRequestClose={() => setConfirmQuit(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Puppet type="grouch" size={76} color={colors.grass} deep={colors.grassDeep} mood="sad" />
            <Text style={styles.modalTitle}>{t.quitTitle}</Text>
            <Text style={styles.modalBody}>{t.quitBody}</Text>
            <View style={[styles.modalRow, { flexDirection: t.row }]}>
              <FeltButton
                label={t.quitNo}
                isRTL={isRTL}
                color={colors.grass}
                deep={colors.grassDeep}
                textColor={colors.white}
                onPress={() => setConfirmQuit(false)}
                style={{ flex: 1 }}
              />
              <FeltButton
                label={t.quitYes}
                isRTL={isRTL}
                color={colors.white}
                deep={colors.stoneDeep}
                onPress={onQuit}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Backdrop>
  );
}

/* ---------- عناصر مساعدة ---------- */

function CountBubble({ value }) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 18 }).start();
  }, [value, pop]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return (
    <Animated.View style={[styles.countBubble, { transform: [{ scale }] }]}>
      <Text style={styles.countText}>{value > 0 ? value : '👏'}</Text>
    </Animated.View>
  );
}

function TeamRow({ team, row, align, isTeamMode, t }) {
  return (
    <View style={[styles.teamRow, { flexDirection: row, borderBottomColor: team.deep }]}>
      <View style={[styles.teamDot, { backgroundColor: team.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.teamName, { textAlign: align }]} numberOfLines={1}>
          {isTeamMode ? `${team.emoji} ${team.name}` : t.totalScore}
        </Text>
        <Text style={[styles.teamMeta, { textAlign: align }]}>
          ✓ {team.correct} · 🔥 {team.bestStreak}
        </Text>
      </View>
      <Text style={styles.teamScore}>{team.score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 13, paddingHorizontal: 20 },
  bigWhite: { fontSize: 28, fontWeight: '900', color: colors.white },
  subWhite: { fontSize: 14, fontWeight: '800', color: colors.cream, opacity: 0.92 },

  plateSmall: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 7 },
  plateSmallText: { color: colors.white, fontWeight: '900', fontSize: 14 },

  turnBanner: { borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 9 },
  turnText: { color: colors.white, fontWeight: '900', fontSize: 18 },

  countBubble: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 8,
    borderBottomColor: colors.stoneDeep,
  },
  countText: { fontSize: 48, fontWeight: '900', color: colors.ink },

  boardCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderBottomWidth: 8,
    borderBottomColor: colors.stoneDeep,
    padding: 16,
    width: '100%',
    gap: 10,
  },
  boardHeading: { fontSize: 19, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  teamRow: {
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 11,
    borderBottomWidth: 5,
  },
  teamDot: { width: 24, height: 24, borderRadius: 12 },
  teamName: { fontSize: 16, fontWeight: '900', color: colors.ink },
  teamMeta: { fontSize: 12, fontWeight: '700', color: colors.cocoaSoft, marginTop: 1 },
  teamScore: { fontSize: 24, fontWeight: '900', color: colors.ink },
  leadNote: { fontSize: 14, fontWeight: '900', color: colors.grapeDeep, textAlign: 'center' },

  hud: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 8 },
  quit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.stoneDeep,
  },
  quitText: { fontSize: 16, fontWeight: '900', color: colors.ink },
  hudChip: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 4,
    borderBottomColor: colors.stoneDeep,
  },
  hudText: { fontWeight: '900', color: colors.ink, fontSize: 12 },

  scoreStrip: { paddingHorizontal: 14, gap: 9, marginTop: 9 },
  scoreBox: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderBottomWidth: 5,
    alignItems: 'center',
  },
  scoreBoxActive: { borderWidth: 3, borderColor: colors.white, borderBottomColor: colors.white },
  scoreName: { fontSize: 12, fontWeight: '900', color: colors.white, opacity: 0.95 },
  scoreValue: { fontSize: 21, fontWeight: '900', color: colors.white },
  turnDot: {
    position: 'absolute',
    top: -9,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  turnDotText: { fontSize: 10, fontWeight: '900', color: colors.white },

  timerTrack: {
    height: 13,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: radius.pill },

  qCard: {
    backgroundColor: colors.cream,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radius.lg,
    borderBottomWidth: 7,
    borderBottomColor: colors.stoneDeep,
    paddingHorizontal: 18,
    paddingVertical: 18,
    minHeight: H * 0.14,
    justifyContent: 'center',
  },
  qText: { fontSize: 20, lineHeight: 30, fontWeight: '900', color: colors.ink, textAlign: 'center' },

  midRow: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 26, marginTop: 4 },
  clock: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 5,
    borderBottomColor: colors.stoneDeep,
  },
  clockText: { fontSize: 21, fontWeight: '900', color: colors.ink },
  streakPill: {
    width: 54,
    alignItems: 'center',
    backgroundColor: colors.tomato,
    borderRadius: radius.pill,
    paddingVertical: 7,
    borderBottomWidth: 4,
    borderBottomColor: colors.tomatoDeep,
  },
  streakText: { color: colors.white, fontWeight: '900', fontSize: 14 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 9, gap: 10, justifyContent: 'center' },
  tile: {
    width: '47%',
    minHeight: 82,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  tileRight: { borderWidth: 4, borderColor: colors.white, borderBottomColor: colors.white },
  tileWrong: { borderWidth: 4, borderColor: colors.ink, borderBottomColor: colors.ink },
  tileRow: { alignItems: 'center', gap: 8 },
  tileText: { flex: 1, color: colors.white, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  mark: { position: 'absolute', top: 4, right: 8, fontSize: 16, fontWeight: '900', color: colors.white },

  reveal: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    borderRadius: radius.lg,
    borderBottomWidth: 7,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  revealTop: { alignItems: 'center', justifyContent: 'space-between' },
  revealTitle: { color: colors.white, fontWeight: '900', fontSize: 17, flex: 1 },
  revealPoints: { color: colors.white, fontWeight: '900', fontSize: 21 },
  revealFact: { color: colors.cream, fontWeight: '700', fontSize: 14, lineHeight: 21, marginTop: 4 },

  modalWrap: { flex: 1, backgroundColor: 'rgba(51,36,29,0.65)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  modalCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderBottomWidth: 8,
    borderBottomColor: colors.stoneDeep,
    padding: 22,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 21, fontWeight: '900', color: colors.ink, marginTop: 8 },
  modalBody: { fontSize: 14, fontWeight: '700', color: colors.cocoaSoft, marginTop: 6, textAlign: 'center' },
  modalRow: { gap: 10, marginTop: 16, width: '100%' },
});
