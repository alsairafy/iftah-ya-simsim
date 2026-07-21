import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * مدير المؤثرات الصوتية.
 * كل الأصوات ملفات WAV مولّدة برمجياً داخل المشروع — لا شيء يُحمَّل من الإنترنت.
 * كل صوت له مشغّل جاهز في الذاكرة، فتشغيله فوري بلا تأخير.
 */
const FILES = {
  tap: require('../assets/sounds/tap.wav'),
  count: require('../assets/sounds/count.wav'),
  go: require('../assets/sounds/go.wav'),
  correct: require('../assets/sounds/correct.wav'),
  wrong: require('../assets/sounds/wrong.wav'),
  timeup: require('../assets/sounds/timeup.wav'),
  streak: require('../assets/sounds/streak.wav'),
  finish: require('../assets/sounds/finish.wav'),
  tick: require('../assets/sounds/tick.wav'),
};

// مقطوعتان خلفيتان تدوران بلا توقف (loop)
const MUSIC = {
  menu: require('../assets/sounds/bg_menu.wav'),
  game: require('../assets/sounds/bg_game.wav'),
};

const MUSIC_VOLUME = 0.42; // منخفض عمداً حتى لا يزاحم المؤثرات

const players = {};
const musicPlayers = {};
let ready = false;
let enabled = true; // المفتاح الرئيسي: يتحكّم بكل شيء
let musicEnabled = true; // مفتاح الموسيقى وحدها
let currentTrack = null;
let duckUntil = 0; // وقت انتهاء الخفض المؤقّت للموسيقى

export async function initSound() {
  if (ready) return;
  ready = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true, // يشتغل حتى لو الجوال على الصامت
      shouldRouteThroughEarpiece: false,
      interruptionMode: 'mixWithOthers',
    });
  } catch (e) {
    // لا يمنع اللعب إذا فشل ضبط وضع الصوت
  }
  Object.entries(FILES).forEach(([name, src]) => {
    try {
      const p = createAudioPlayer(src);
      p.volume = 1;
      players[name] = p;
    } catch (e) {
      // تجاهل أي صوت يفشل تحميله
    }
  });

  Object.entries(MUSIC).forEach(([name, src]) => {
    try {
      const p = createAudioPlayer(src);
      p.loop = true;
      p.volume = MUSIC_VOLUME;
      musicPlayers[name] = p;
    } catch (e) {
      // تجاهل
    }
  });
}

/** تشغيل مؤثر — يعيده من البداية إذا كان يعمل */
export function play(name) {
  if (!enabled) return;
  const p = players[name];
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch (e) {
    // تجاهل
  }
}

/** اهتزاز خفيف — على الأجهزة التي تدعمه فقط */
export function buzz(kind = 'light') {
  if (!enabled || Platform.OS === 'web') return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if (kind === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    // تجاهل
  }
}

/** صوت + اهتزاز معاً */
export function fx(name, kind) {
  play(name);
  if (kind) buzz(kind);
}

/* ---------- الموسيقى الخلفية ---------- */

const safe = (fn) => {
  try {
    fn();
  } catch (e) {
    // تجاهل أي خطأ في التشغيل حتى لا يوقف اللعبة
  }
};

// المستوى المطلوب الآن: منخفض أثناء فترة الخفض، وطبيعي بعدها
const targetVolume = () => (Date.now() < duckUntil ? MUSIC_VOLUME * 0.25 : MUSIC_VOLUME);

/** يشغّل مقطوعة ('menu' أو 'game') ويوقف السابقة. آمن للاستدعاء المتكرر. */
export function playMusic(name) {
  currentTrack = name;
  if (!enabled || !musicEnabled) return;

  Object.entries(musicPlayers).forEach(([key, p]) => {
    if (key === name) return;
    safe(() => p.pause());
  });

  const p = musicPlayers[name];
  if (!p) return;
  safe(() => {
    // نحترم الخفض المؤقّت حتى لو تغيّرت المقطوعة أثناءه
    p.volume = targetVolume();
    if (!p.playing) p.play();
  });
}

/** يوقف الموسيقى مؤقتاً (يبقى المقطع الحالي محفوظاً) */
export function stopMusic() {
  Object.values(musicPlayers).forEach((p) => safe(() => p.pause()));
}

/** يخفض الموسيقى لحظياً ثم يعيدها — يُستخدم مع الفانفير */
export function duckMusic(ms = 2200) {
  duckUntil = Date.now() + ms;
  // نخفض كل المقطوعات حتى لو بُدّلت المقطوعة أثناء فترة الخفض
  Object.values(musicPlayers).forEach((p) => safe(() => {
    p.volume = MUSIC_VOLUME * 0.25;
  }));

  setTimeout(() => {
    if (Date.now() < duckUntil) return; // خفض أحدث ألغى هذا المؤقّت
    Object.values(musicPlayers).forEach((p) => safe(() => {
      p.volume = MUSIC_VOLUME;
    }));
  }, ms + 40);
}

export function setMusicEnabled(v) {
  musicEnabled = v;
  if (!v) stopMusic();
  else if (currentTrack) playMusic(currentTrack);
}

export function isMusicEnabled() {
  return musicEnabled;
}

/** المفتاح الرئيسي: يكتم المؤثرات والموسيقى والاهتزاز معاً */
export function setSoundEnabled(v) {
  enabled = v;
  if (!v) {
    Object.values(players).forEach((p) => safe(() => p.pause()));
    stopMusic();
  } else if (currentTrack) {
    playMusic(currentTrack);
  }
}

export function isSoundEnabled() {
  return enabled;
}
