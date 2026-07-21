import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';

import { LangProvider, useLang } from './src/i18n';
import { initSound, setSoundEnabled, setMusicEnabled, playMusic } from './src/sound';
import LanguageScreen from './src/screens/LanguageScreen';
import HomeScreen from './src/screens/HomeScreen';
import ModeScreen from './src/screens/ModeScreen';
import SetupScreen from './src/screens/SetupScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import LevelScreen from './src/screens/LevelScreen';
import RoundScreen from './src/screens/RoundScreen';
import RoundBreakScreen from './src/screens/RoundBreakScreen';
import ResultScreen from './src/screens/ResultScreen';
import { colors, DEFAULT_SETUP, TEAM_STYLES } from './src/theme';

// حالة فريق واحد عند بداية المباراة
const makeTeam = (name, i) => ({
  name,
  score: 0, // مجموع المباراة كلها
  roundScore: 0, // نقاط الجولة الحالية فقط
  correct: 0,
  asked: 0,
  streak: 0,
  bestStreak: 0,
  ...TEAM_STYLES[i],
});

function Game() {
  const { chosen, chooseLang, t } = useLang();

  // home → mode → setup → roundCategory → roundLevel → round → roundBreak → … → result
  const [screen, setScreen] = useState('home');

  const [teamNames, setTeamNames] = useState(null); // null = لاعب واحد
  const [setup, setSetup] = useState(DEFAULT_SETUP);

  const [teams, setTeams] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [history, setHistory] = useState([]); // {category, level} لكل جولة انتهت
  const [category, setCategory] = useState(null); // باب الجولة الحالية
  const [level, setLevel] = useState('mixed'); // مستوى الجولة الحالية
  const [lastRound, setLastRound] = useState(null); // نتيجة آخر جولة للعرض

  const [result, setResult] = useState(null);
  const [best, setBest] = useState(0);
  const [isBest, setIsBest] = useState(false);
  const [seen, setSeen] = useState(() => new Set());
  const [runId, setRunId] = useState(0);

  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);

  useEffect(() => {
    initSound();
  }, []);

  useEffect(() => {
    if (!chosen) return;
    playMusic(screen === 'round' ? 'game' : 'menu');
  }, [screen, chosen]);

  function toggleSound(next) {
    setSoundOn(next);
    setSoundEnabled(next);
  }
  function toggleMusic(next) {
    setMusicOn(next);
    setMusicEnabled(next);
  }

  /* ---------- بدء مباراة جديدة ---------- */
  function startMatch(cfg) {
    setSetup(cfg);
    setTeams((teamNames || [t.soloMode]).map(makeTeam));
    setRoundIndex(0);
    setHistory([]);
    setLastRound(null);
    setScreen('roundCategory');
  }

  /* ---------- انتهت جولة ---------- */
  function finishRound(r) {
    // نسجّل الأسئلة المطروحة حتى لا تتكرر
    setSeen((prev) => {
      const next = r.didReset ? new Set() : new Set(prev);
      r.keys.forEach((k) => next.add(k));
      return next;
    });

    setTeams(r.teams);
    setHistory((h) => [...h, { category, level, answered: r.answered, roundSize: r.roundSize }]);
    setLastRound({ ...r, category, level });
    setScreen('roundBreak');
  }

  /* ---------- بعد شاشة الملخّص ---------- */
  function afterBreak() {
    const isLast = roundIndex + 1 >= setup.rounds;
    if (isLast) {
      finishMatch();
      return;
    }
    // نصفّر نقاط الجولة ونجهّز الجولة التالية
    setTeams((prev) => prev.map((tm) => ({ ...tm, roundScore: 0, streak: 0 })));
    setRoundIndex((i) => i + 1);
    setScreen('roundCategory');
  }

  function finishMatch() {
    const isTeamMode = teams.length > 1;
    const beat = !isTeamMode && teams[0].score > best;
    setIsBest(beat);
    if (beat) setBest(teams[0].score);
    setResult({
      teams,
      isTeamMode,
      history,
      totalQ: teams.reduce((n, tm) => n + tm.asked, 0),
      didReset: false,
    });
    setScreen('result');
  }

  function goHome() {
    setScreen('home');
  }

  const usedCategories = history.map((h) => h.category.id);

  if (!chosen) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <LanguageScreen onPick={chooseLang} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {screen === 'home' && (
        <HomeScreen
          best={best}
          soundOn={soundOn}
          musicOn={musicOn}
          onToggleSound={toggleSound}
          onToggleMusic={toggleMusic}
          onStart={() => setScreen('mode')}
        />
      )}

      {screen === 'mode' && (
        <ModeScreen
          onBack={goHome}
          onPick={({ mode, names }) => {
            setTeamNames(mode === 'teams' ? names : null);
            setScreen('setup');
          }}
        />
      )}

      {screen === 'setup' && (
        <SetupScreen teams={teamNames} onBack={() => setScreen('mode')} onStart={startMatch} />
      )}

      {/* اختيار باب الجولة الحالية */}
      {screen === 'roundCategory' && (
        <CategoryScreen
          seen={seen}
          roundIndex={roundIndex}
          rounds={setup.rounds}
          usedCategories={usedCategories}
          onBack={roundIndex === 0 ? () => setScreen('setup') : () => setScreen('roundBreak')}
          onPick={(c) => {
            setCategory(c);
            setScreen('roundLevel');
          }}
        />
      )}

      {/* اختيار مستوى الجولة الحالية */}
      {screen === 'roundLevel' && (
        <LevelScreen
          category={category}
          seen={seen}
          roundIndex={roundIndex}
          rounds={setup.rounds}
          onBack={() => setScreen('roundCategory')}
          onPick={(lv) => {
            setLevel(lv);
            setRunId((n) => n + 1);
            setScreen('round');
          }}
        />
      )}

      {screen === 'round' && (
        <RoundScreen
          key={runId}
          category={category}
          level={level}
          setup={setup}
          roundIndex={roundIndex}
          teams={teams}
          seen={seen}
          onFinish={finishRound}
          onQuit={goHome}
        />
      )}

      {screen === 'roundBreak' && lastRound && (
        <RoundBreakScreen
          teams={teams}
          roundIndex={roundIndex}
          rounds={setup.rounds}
          category={lastRound.category}
          level={lastRound.level}
          endedEarly={lastRound.endedEarly}
          answered={lastRound.answered}
          roundSize={lastRound.roundSize}
          isLast={roundIndex + 1 >= setup.rounds}
          onNext={afterBreak}
        />
      )}

      {screen === 'result' && (
        <ResultScreen
          result={result}
          category={category}
          isBest={isBest}
          onReplay={() => startMatch(setup)}
          onHome={goHome}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <LangProvider>
      <Game />
    </LangProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sky },
});
