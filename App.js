import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';

import { LangProvider, useLang } from './src/i18n';
import { initSound, setSoundEnabled, setMusicEnabled, playMusic } from './src/sound';
import LanguageScreen from './src/screens/LanguageScreen';
import HomeScreen from './src/screens/HomeScreen';
import ModeScreen from './src/screens/ModeScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import LevelScreen from './src/screens/LevelScreen';
import SetupScreen from './src/screens/SetupScreen';
import MatchScreen from './src/screens/MatchScreen';
import ResultScreen from './src/screens/ResultScreen';
import { colors, DEFAULT_SETUP } from './src/theme';

function Game() {
  const { chosen, chooseLang } = useLang();

  // language → home → mode → categories → levels → setup → match → result
  const [screen, setScreen] = useState('home');
  const [teamNames, setTeamNames] = useState(null); // null = لاعب واحد
  const [category, setCategory] = useState(null);
  const [level, setLevel] = useState('mixed');
  const [setup, setSetup] = useState(DEFAULT_SETUP);
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(0);
  const [isBest, setIsBest] = useState(false);
  // مفاتيح الأسئلة التي طُرحت — تمنع التكرار بين المباريات
  const [seen, setSeen] = useState(() => new Set());
  const [runId, setRunId] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);

  useEffect(() => {
    initSound();
  }, []);

  // موسيقى مرحة أثناء المباراة، وهادئة في بقية الشاشات
  useEffect(() => {
    if (!chosen) return;
    playMusic(screen === 'match' ? 'game' : 'menu');
  }, [screen, chosen]);

  function toggleSound(next) {
    setSoundOn(next);
    setSoundEnabled(next);
  }

  function toggleMusic(next) {
    setMusicOn(next);
    setMusicEnabled(next);
  }

  function startMatch(cfg) {
    setSetup(cfg);
    setRunId((n) => n + 1);
    setScreen('match');
  }

  function replay() {
    setRunId((n) => n + 1);
    setScreen('match');
  }

  function finish(r) {
    setSeen((prev) => {
      const next = r.didReset ? new Set() : new Set(prev);
      r.keys.forEach((k) => next.add(k));
      return next;
    });
    // الرقم القياسي لوضع اللاعب الواحد فقط
    const beat = !r.isTeamMode && r.teams[0].score > best;
    setIsBest(beat);
    if (beat) setBest(r.teams[0].score);
    setResult(r);
    setScreen('result');
  }

  // شاشة اختيار اللغة تسبق كل شيء
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
          onBack={() => setScreen('home')}
          onPick={({ mode, names }) => {
            setTeamNames(mode === 'teams' ? names : null);
            setScreen('categories');
          }}
        />
      )}

      {screen === 'categories' && (
        <CategoryScreen
          seen={seen}
          onBack={() => setScreen('mode')}
          onPick={(c) => {
            setCategory(c);
            setScreen('levels');
          }}
        />
      )}

      {screen === 'levels' && (
        <LevelScreen
          category={category}
          seen={seen}
          onBack={() => setScreen('categories')}
          onPick={(lv) => {
            setLevel(lv);
            setScreen('setup');
          }}
        />
      )}

      {screen === 'setup' && (
        <SetupScreen
          category={category}
          level={level}
          teams={teamNames}
          seen={seen}
          onBack={() => setScreen('levels')}
          onStart={startMatch}
        />
      )}

      {screen === 'match' && (
        <MatchScreen
          key={runId}
          category={category}
          level={level}
          setup={setup}
          teamNames={teamNames}
          seen={seen}
          onFinish={finish}
          onQuit={() => setScreen('home')}
        />
      )}

      {screen === 'result' && (
        <ResultScreen
          result={result}
          category={category}
          isBest={isBest}
          onReplay={replay}
          onHome={() => setScreen('home')}
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
