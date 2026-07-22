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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Backdrop from '../components/Backdrop';
import Puppet from '../components/Puppet';
import Shape from '../components/Shape';
import FeltButton from '../components/FeltButton';
import { buildRound } from '../data';
import { fetchApiQuestions } from '../api';
import { fx, play } from '../sound';
import { useLang } from '../i18n';
import { colors, radius, answerStyles, levelStyles, MAX_POINTS } from '../theme';

const { height: H } = Dimensions.get('window');

const levelLabel = (t, level) =>
  ({ easy: t.levelEasy, medium: t.levelMedium, hard: t.levelHard }[level] || t.mixedLevels);

// نقاط حسب السرعة: من ٥٠٠ (آخر لحظة) إلى ١٠٠٠ (إجابة فورية)
function pointsFor(msLeft, totalMs) {
  const ratio = Math.max(0, Math.min(1, msLeft / totalMs));
  return Math.round((0.5 + ratio * 0.5) * MAX_POINTS);
}

/**
 * تلعب جولة واحدة فقط (باب ومستوى محدّدان)، ثم تُعيد النتيجة إلى App
 * الذي يتولّى الانتقال لإعداد الجولة التالية.
 *
 * onFinish({ teams, keys, didReset, endedEarly })
 */
export default function RoundScreen({
  category,
  level,
  setup,
  roundIndex,
  teams: incomingTeams,
  seen,
  onFinish,
  onQuit,
}) {
  const { t, lang, isRTL } = useLang();
  const { rounds, perRound, seconds } = setup;
  const totalMs = seconds * 1000;

  // البنك المحلي جاهز فوراً — نستخدمه كمصدر أساسي أو كبديل عند فشل الشبكة
  const built = useMemo(
    () => buildRound(category.id, level, seen, perRound),
    [category.id, level, seen, perRound]
  );

  const wantsApi = setup.source === 'api';
  // 'loading' | 'ready' | 'error' — البنك المحلي لا يحتاج تحميلاً
  const [load, setLoad] = useState(wantsApi ? 'loading' : 'ready');
  const [apiError, setApiError] = useState(null);
  const [apiQuestions, setApiQuestions] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const usingApi = wantsApi && !!apiQuestions;
  const questions = usingApi ? apiQuestions : built.round;
  const roundSize = questions.length;

  // جلب الأسئلة من الخدمة عند اختيار المصدر الحيّ
  useEffect(() => {
    if (!wantsApi) return undefined;
    let alive = true;
    setLoad('loading');
    setApiError(null);

    fetchApiQuestions({ categoryId: category.id, level, amount: perRound })
      .then((qs) => {
        if (!alive) return;
        setApiQuestions(qs);
        setLoad('ready');
      })
      .catch((e) => {
        if (!alive) return;
        setApiError(e);
        setLoad('error');
      });

    return () => {
      alive = false;
    };
  }, [wantsApi, category.id, level, perRound, attempt]);

  // نقاط الفرق تراكمية عبر المباراة — تصلنا من App وتعود إليه
  const [teams, setTeams] = useState(incomingTeams);
  const isTeamMode = teams.length > 1;

  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | question | reveal
  const [countdown, setCountdown] = useState(3);
  const [picked, setPicked] = useState(null);
  const [gained, setGained] = useState(0);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(null); // null | 'end' | 'home'

  // يتناوب الفريق البادئ كل جولة حتى لا يبدأ فريق واحد دائماً
  const activeIdx = isTeamMode ? (roundIndex + qIndex) % 2 : 0;
  const active = teams[activeIdx];

  const q = questions[qIndex];
  const text = q ? q[lang] : null;
  const isCorrect = picked === q?.answer;
  const lastOfRound = qIndex + 1 >= roundSize;

  /* ---------- المؤقّت ---------- */
  const timer = useRef(new Animated.Value(1)).current;
  const deadline = useRef(0);
  const [tick, setTick] = useState(seconds);

  useEffect(() => {
    // لا يبدأ العدّ التنازلي قبل أن تجهز الأسئلة
    if (load !== 'ready' || phase !== 'ready') return undefined;
    if (countdown <= 0) {
      fx('go', 'medium');
      setPhase('question');
      return undefined;
    }
    play('count');
    const id = setTimeout(() => setCountdown((c) => c - 1), 800);
    return () => clearTimeout(id);
  }, [load, phase, countdown]);

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
          roundScore: tm.roundScore + earned,
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

  // تنتهي الجولة: إمّا بإكمال الأسئلة أو بإنهائها مبكراً من القائمة
  function endRound(endedEarly) {
    onFinish({
      teams,
      // أسئلة الخدمة ليست من البنك المحلي، فلا نسجّلها في قائمة «المطروحة»
      keys: usingApi
        ? []
        : built.keys.slice(0, endedEarly ? qIndex + (phase === 'reveal' ? 1 : 0) : roundSize),
      didReset: built.didReset,
      endedEarly: !!endedEarly,
      answered: endedEarly ? qIndex + (phase === 'reveal' ? 1 : 0) : roundSize,
      roundSize,
    });
  }

  function advance() {
    if (lastOfRound) {
      endRound(false);
      return;
    }
    setQIndex((i) => i + 1);
    setPicked(null);
    setGained(0);
    setCountdown(isTeamMode ? 3 : 2);
    setPhase('ready');
  }

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const timerWidth = timer.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const lvl = levelStyles[level] || levelStyles.mixed;
  const tint = isTeamMode ? active.color : category.color;

  /* ---------- حالة الانتظار: الأسئلة في الطريق ---------- */
  if (load === 'loading') {
    return (
      <Backdrop tint={category.color} scene="strip">
        <SafeAreaView style={styles.centerWrap}>
          <View style={styles.plateSmall}>
            <Text style={styles.plateSmallText}>{t.roundSetupTitle(roundIndex + 1, rounds)}</Text>
          </View>
          <Puppet
            type={category.puppet}
            size={110}
            color={colors.cream}
            deep={colors.stoneDeep}
            mood="think"
          />
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.bigWhite}>{t.loadingQuestions}</Text>
          <Text style={styles.subWhite}>{t.loadingFrom}</Text>
        </SafeAreaView>
      </Backdrop>
    );
  }

  /* ---------- حالة الخطأ: نشرح السبب ونعطي مخرجين ---------- */
  if (load === 'error') {
    const kind = apiError?.kind || 'server';
    const title = { network: t.errNetwork, rate: t.errRate, empty: t.errEmpty, server: t.errServer, bad: t.errBad }[kind];
    const hint = { network: t.errNetworkHint, rate: t.errRateHint, empty: t.errEmptyHint, server: t.errServerHint, bad: t.errBadHint }[kind];

    return (
      <Backdrop tint={colors.tomato} scene="strip">
        <SafeAreaView style={styles.centerWrap}>
          <Puppet type="grouch" size={104} color={colors.grass} deep={colors.grassDeep} mood="sad" />
          <View style={styles.errCard}>
            <Text style={styles.errTitle}>{title}</Text>
            <Text style={styles.errHint}>{hint}</Text>
          </View>

          <FeltButton
            label={t.retry}
            size="lg"
            isRTL={isRTL}
            color={colors.sun}
            deep={colors.sunDeep}
            onPress={() => setAttempt((a) => a + 1)}
            style={{ minWidth: 230 }}
          />
          {/* مخرج مضمون: البنك المحلي جاهز دائماً */}
          <FeltButton
            label={`📚 ${t.useLocalInstead}`}
            isRTL={isRTL}
            color={colors.white}
            deep={colors.stoneDeep}
            onPress={() => {
              setApiQuestions(null);
              setApiError(null);
              setLoad('ready');
            }}
            style={{ minWidth: 230 }}
          />
          <FeltButton
            label={t.goHome}
            isRTL={isRTL}
            size="sm"
            color={colors.grape}
            deep={colors.grapeDeep}
            textColor={colors.white}
            onPress={onQuit}
            style={{ minWidth: 150 }}
          />
        </SafeAreaView>
      </Backdrop>
    );
  }

  /* ---------- شاشة استعد ---------- */
  if (phase === 'ready') {
    return (
      <Backdrop tint={tint} scene="strip">
        <SafeAreaView style={styles.centerWrap}>
          <View style={styles.plateSmall}>
            <Text style={styles.plateSmallText}>{t.roundSetupTitle(roundIndex + 1, rounds)}</Text>
          </View>

          <View style={[styles.topicPill, { backgroundColor: category.deep }]}>
            <Text style={styles.topicText}>
              {category.emoji} {category[lang]} · {lvl.emoji} {levelLabel(t, level)}
            </Text>
          </View>

          {/* نوضّح أن أسئلة هذه الجولة جاءت من الإنترنت */}
          {usingApi && (
            <View style={styles.apiPill}>
              <Text style={styles.apiPillText}>{t.apiBadge}</Text>
            </View>
          )}

          {isTeamMode && (
            <View style={[styles.turnBanner, { backgroundColor: active.deep }]}>
              <Text style={styles.turnText}>{active.emoji} {t.turnOf(active.name)}</Text>
            </View>
          )}

          <Puppet
            type={isTeamMode ? active.puppet : category.puppet}
            size={120}
            color={colors.cream}
            deep={colors.stoneDeep}
            mood="happy"
          />
          <Text style={styles.bigWhite}>{t.getReady}</Text>
          <CountBubble value={countdown} />
          <Text style={styles.subWhite}>{t.questionOf(qIndex + 1, roundSize)}</Text>
        </SafeAreaView>
      </Backdrop>
    );
  }

  /* ---------- السؤال والكشف ---------- */
  const revealing = phase === 'reveal';

  return (
    <Backdrop tint={tint} scene="strip">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.hud, { flexDirection: t.row }]}>
          <Pressable onPress={() => setMenu(true)} style={styles.quit} hitSlop={12}>
            <Text style={styles.quitText}>☰</Text>
          </Pressable>
          <View style={styles.hudChip}>
            <Text style={styles.hudText}>
              {t.roundSetupTitle(roundIndex + 1, rounds)} · {qIndex + 1}/{roundSize}
            </Text>
          </View>
          <View style={[styles.hudChip, { backgroundColor: usingApi ? colors.ocean : category.deep }]}>
            <Text style={[styles.hudText, { color: colors.white }]}>
              {usingApi ? '📡 ' : ''}
              {category.emoji} {lvl.emoji}
            </Text>
          </View>
        </View>

        {/* نقاط الفرق */}
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

        <View style={styles.timerTrack}>
          <Animated.View
            style={[
              styles.timerFill,
              {
                width: timerWidth,
                backgroundColor:
                  tick > seconds * 0.4 ? colors.grass : tick > seconds * 0.18 ? colors.sun : colors.tomato,
              },
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
              label={lastOfRound ? t.roundOver : t.next}
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

      {/* ---------- قائمة الإيقاف ---------- */}
      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.pauseTitle}</Text>

            <FeltButton
              isRTL={isRTL}
              color={colors.sun}
              deep={colors.sunDeep}
              onPress={() => setMenu(false)}
              style={{ width: '100%', marginTop: 14 }}
            >
              <Text style={styles.menuBtnText}>▶️  {t.continuePlaying}</Text>
            </FeltButton>

            <FeltButton
              isRTL={isRTL}
              color={colors.grape}
              deep={colors.grapeDeep}
              onPress={() => {
                setMenu(false);
                setConfirm('end');
              }}
              style={{ width: '100%', marginTop: 10 }}
            >
              <View>
                <Text style={[styles.menuBtnText, { color: colors.white }]}>🏁  {t.endRound}</Text>
                <Text style={styles.menuBtnHint}>{t.endRoundHint}</Text>
              </View>
            </FeltButton>

            <FeltButton
              isRTL={isRTL}
              color={colors.white}
              deep={colors.stoneDeep}
              onPress={() => {
                setMenu(false);
                setConfirm('home');
              }}
              style={{ width: '100%', marginTop: 10 }}
            >
              <View>
                <Text style={styles.menuBtnText}>🏠  {t.backHome}</Text>
                <Text style={[styles.menuBtnHint, { color: colors.cocoaSoft }]}>{t.backHomeHint}</Text>
              </View>
            </FeltButton>
          </View>
        </View>
      </Modal>

      {/* ---------- تأكيد ---------- */}
      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Puppet
              type="grouch"
              size={72}
              color={confirm === 'end' ? colors.grape : colors.grass}
              deep={confirm === 'end' ? colors.grapeDeep : colors.grassDeep}
              mood="sad"
            />
            <Text style={styles.modalTitle}>
              {confirm === 'end' ? t.endRoundConfirm : t.backHomeConfirm}
            </Text>
            <Text style={styles.modalBody}>
              {confirm === 'end' ? t.endRoundBody : t.backHomeBody}
            </Text>
            <View style={[styles.modalRow, { flexDirection: t.row }]}>
              <FeltButton
                label={t.continuePlaying}
                isRTL={isRTL}
                color={colors.grass}
                deep={colors.grassDeep}
                textColor={colors.white}
                onPress={() => setConfirm(null)}
                style={{ flex: 1 }}
              />
              <FeltButton
                label={t.confirm}
                isRTL={isRTL}
                color={colors.white}
                deep={colors.stoneDeep}
                onPress={() => {
                  const what = confirm;
                  setConfirm(null);
                  if (what === 'end') endRound(true);
                  else onQuit();
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

const styles = StyleSheet.create({
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 11, paddingHorizontal: 20 },
  bigWhite: { fontSize: 27, fontWeight: '900', color: colors.white },
  subWhite: { fontSize: 14, fontWeight: '800', color: colors.cream, opacity: 0.92 },

  plateSmall: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 7 },
  plateSmallText: { color: colors.white, fontWeight: '900', fontSize: 14 },

  topicPill: { borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 7 },
  topicText: { color: colors.white, fontWeight: '900', fontSize: 14 },

  apiPill: {
    backgroundColor: colors.ocean,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderBottomWidth: 3,
    borderBottomColor: colors.oceanDeep,
  },
  apiPillText: { color: colors.white, fontWeight: '900', fontSize: 12 },

  errCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderBottomWidth: 8,
    borderBottomColor: colors.stoneDeep,
    padding: 18,
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  errTitle: { fontSize: 20, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  errHint: { fontSize: 14, fontWeight: '700', color: colors.cocoaSoft, textAlign: 'center', lineHeight: 21 },

  turnBanner: { borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 9 },
  turnText: { color: colors.white, fontWeight: '900', fontSize: 17 },

  countBubble: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 8,
    borderBottomColor: colors.stoneDeep,
  },
  countText: { fontSize: 46, fontWeight: '900', color: colors.ink },

  hud: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 8 },
  quit: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.stoneDeep,
  },
  quitText: { fontSize: 17, fontWeight: '900', color: colors.ink },
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

  modalWrap: { flex: 1, backgroundColor: 'rgba(51,36,29,0.68)', alignItems: 'center', justifyContent: 'center', padding: 26 },
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
  modalBody: { fontSize: 14, fontWeight: '700', color: colors.cocoaSoft, marginTop: 6, textAlign: 'center', lineHeight: 21 },
  modalRow: { gap: 10, marginTop: 16, width: '100%' },
  menuBtnText: { fontSize: 17, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  menuBtnHint: { fontSize: 12, fontWeight: '700', color: colors.cream, textAlign: 'center', marginTop: 2, opacity: 0.95 },
});
