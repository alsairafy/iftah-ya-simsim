// لوحة ألوان "افتح يا سمسم" — ألوان جوخ (فِلت) دافئة وزاهية
export const colors = {
  // السماء والشارع
  sky: '#63C7F2',
  skyDeep: '#2E9FD4',
  skyNight: '#3B5BA9',
  brick: '#C8654A',
  brickDeep: '#9A4632',
  stone: '#E4D6BE',
  stoneDeep: '#C2AE90',
  sand: '#FFE9C4',
  sandDeep: '#F0D2A0',
  pavement: '#B9AFA0',
  pavementDeep: '#948A7C',

  // ألوان الشخصيات
  sun: '#FFC93C',
  sunDeep: '#E8A317',
  tomato: '#F2544B',
  tomatoDeep: '#C4342C',
  grass: '#5BC55F',
  grassDeep: '#3A9A40',
  grape: '#9B63DE',
  grapeDeep: '#6E3BB8',
  ocean: '#3D8FE0',
  oceanDeep: '#2668B5',
  orange: '#FF8A3D',
  orangeDeep: '#DB6415',
  pink: '#FF7BAC',
  pinkDeep: '#DB4E85',
  cocoa: '#4A3227',
  cocoaSoft: '#8A6350',

  cream: '#FFF8EC',
  white: '#FFFFFF',
  ink: '#33241D',
  shadow: 'rgba(51,36,29,0.18)',
};

// ألوان وأشكال الإجابات الأربع — نظام كاهوت بلمسة سمسم
export const answerStyles = [
  { color: colors.tomato, deep: colors.tomatoDeep, shape: 'triangle' },
  { color: colors.ocean, deep: colors.oceanDeep, shape: 'diamond' },
  { color: colors.sun, deep: colors.sunDeep, shape: 'circle' },
  { color: colors.grass, deep: colors.grassDeep, shape: 'square' },
];

export const levelStyles = {
  easy: { color: colors.grass, deep: colors.grassDeep, emoji: '🌱' },
  medium: { color: colors.sun, deep: colors.sunDeep, emoji: '⚡' },
  hard: { color: colors.tomato, deep: colors.tomatoDeep, emoji: '🔥' },
  mixed: { color: colors.grape, deep: colors.grapeDeep, emoji: '🎲' },
};

export const radius = { sm: 12, md: 20, lg: 30, xl: 40, pill: 999 };

// حافة سفلية سميكة تعطي إحساس الجوخ / اللعبة الورقية
export const felt = (deep, size = 6) => ({
  borderBottomWidth: size,
  borderBottomColor: deep,
});

export const MAX_POINTS = 1000;

// إعدادات المباراة — الخيارات المتاحة والقيم الافتراضية
export const ROUND_OPTIONS = [3, 6, 9];
export const PER_ROUND_OPTIONS = [4, 6, 8];
export const TIME_OPTIONS = [10, 20, 30];

// المباراة الافتراضية: ٦ جولات × ٦ أسئلة، لكل جولة بابها ومستواها
export const DEFAULT_SETUP = { rounds: 6, perRound: 6, seconds: 20 };

// ألوان الفريقين
export const TEAM_STYLES = [
  { color: colors.tomato, deep: colors.tomatoDeep, puppet: 'furry', emoji: '🔴' },
  { color: colors.ocean, deep: colors.oceanDeep, puppet: 'cookie', emoji: '🔵' },
];
