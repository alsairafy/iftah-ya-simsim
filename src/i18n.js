import React, { createContext, useContext, useMemo, useState } from 'react';

export const STRINGS = {
  ar: {
    dir: 'rtl',
    row: 'row-reverse',
    align: 'right',

    /* اختيار اللغة */
    chooseLanguage: 'اختر لغتك',
    chooseLanguageHint: 'كل الأسئلة والواجهة ستكون باللغة التي تختارها',
    arabicLabel: 'العربية',
    arabicSub: 'أسئلة وواجهة بالعربية',
    englishLabel: 'English',
    englishSub: 'Questions and UI in English',

    /* الرئيسية */
    appTitleTop: 'افتح',
    appTitleBottom: 'يا سمسم',
    tagline: 'لعبة الأسئلة والأجوبة',
    play: 'هيّا نلعب!',
    howTo: 'كيف ألعب؟',
    langButton: 'English',
    soundOn: 'الصوت مفتوح',
    soundOff: 'الصوت مغلق',
    musicOn: 'الموسيقى مفتوحة',
    musicOff: 'الموسيقى مغلقة',
    best: 'أفضل نتيجة',
    back: 'رجوع',

    /* الوضع */
    chooseMode: 'اختر طريقة اللعب',
    soloMode: 'لاعب واحد',
    soloHint: 'العب وحدك واجمع أعلى نتيجة',
    teamsMode: 'فريقان',
    teamsHint: 'تنافسوا بالدور على نفس الجهاز',
    teamNames: 'أسماء الفريقين',
    team1Default: 'الفريق الأحمر',
    team2Default: 'الفريق الأزرق',
    teamNameHint: 'تقدر تغيّر الأسماء',

    /* الإعدادات */
    matchSetup: 'إعدادات المباراة',
    roundsLabel: 'عدد الجولات',
    perRoundLabel: 'أسئلة كل جولة',
    timeLabel: 'وقت السؤال',
    secondsUnit: 'ث',
    totalQuestionsLabel: (n) => `${n} سؤالاً في المباراة`,
    startMatch: 'ابدأ المباراة',

    /* الفئة والمستوى */
    chooseCategory: 'اختر بابك',
    chooseLevel: 'اختر المستوى',
    levelEasy: 'سهل',
    levelMedium: 'متوسط',
    levelHard: 'صعب',
    levelEasyHint: 'أسئلة بسيطة للتسخين',
    levelMediumHint: 'تحتاج شوية تركيز',
    levelHardHint: 'للأبطال فقط!',
    mixedLevels: 'كل المستويات',
    mixedLevelsHint: 'خليط من السهل والصعب',

    /* اللعب */
    getReady: 'استعد!',
    roundOf: (a, b) => `الجولة ${a} من ${b}`,
    questionOf: (a, b) => `سؤال ${a} من ${b}`,
    turnOf: (name) => `دور ${name}`,
    yourTurn: 'دورك',
    points: 'نقطة',
    correct: 'إجابة صحيحة!',
    wrong: 'إجابة خاطئة',
    timeUp: 'انتهى الوقت!',
    theAnswerIs: 'الإجابة الصحيحة',
    streak: 'متتالية',
    next: 'التالي',
    seeResult: 'شوف النتيجة',
    scoreboard: 'لوحة النقاط',
    totalScore: 'مجموع نقاطك',
    correctAnswers: 'إجابات صحيحة',
    bestStreak: 'أطول متتالية',
    accuracy: 'نسبة الدقة',

    /* بين الجولات */
    roundOver: 'انتهت الجولة',
    standings: 'الترتيب',
    nextRound: 'الجولة التالية',
    leading: 'متقدّم',
    tied: 'متعادلان',
    roundSummary: 'ملخّص الجولة',
    thisRound: 'هذه الجولة',
    matchTotal: 'مجموع المباراة',
    setupNextRound: 'جهّز الجولة التالية',
    roundsDone: (a, b) => `أنهيت ${a} من ${b} جولات`,

    /* إعداد كل جولة */
    roundSetupTitle: (n, total) => `الجولة ${n} من ${total}`,
    chooseRoundCategory: 'اختر باب هذه الجولة',
    chooseRoundLevel: 'اختر مستوى هذه الجولة',
    variedRoundsHint: 'كل جولة لها بابها ومستواها — نوّع عشان ما تمل',
    alreadyPlayed: 'لعبته',
    startRound: 'ابدأ الجولة',

    /* قائمة الإيقاف داخل اللعب */
    pauseTitle: 'إيقاف مؤقت',
    endRound: 'إنهاء الجولة',
    endRoundHint: 'توقف هنا واحتسب نقاط الجولة',
    endRoundConfirm: 'تنهي الجولة الآن؟',
    endRoundBody: 'الأسئلة الباقية في هذه الجولة لن تُحتسب، ونقاطك المكتسبة تبقى محفوظة.',
    backHome: 'العودة للرئيسية',
    backHomeHint: 'اخرج من المباراة كاملة',
    backHomeConfirm: 'تخرج من المباراة؟',
    backHomeBody: 'نقاط المباراة كلها ستضيع.',
    continuePlaying: 'أكمل اللعب',
    confirm: 'نعم، تأكيد',

    /* النهاية */
    matchOver: 'انتهت المباراة!',
    finalResult: 'النتيجة النهائية',
    winnerIs: (name) => `🏆 الفائز: ${name}`,
    itsADraw: '🤝 تعادل!',
    newRecord: '🏆 رقم قياسي جديد',
    playAgain: 'مرة ثانية',
    home: 'الرئيسية',
    rankName: ['بطل السمسم!', 'ممتاز جداً!', 'أحسنت، واصل!', 'حاول مرة أخرى'],
    cheerHigh: 'أجبت عن أغلب الأسئلة بشكل صحيح — استمر هكذا!',
    cheerLow: 'كل سؤال تخطئ فيه هو معلومة جديدة تتعلّمها.',

    /* عام */
    quitTitle: 'تريد الخروج؟',
    quitBody: 'نقاط المباراة كلها ستضيع.',
    quitYes: 'نعم، اخرج',
    quitNo: 'أكمل اللعب',
    howToBody: [
      'اختر لغتك، ثم العب وحدك أو مع فريق ثانٍ.',
      'المباراة مقسّمة إلى جولات، وكل جولة عدد ثابت من الأسئلة.',
      'لكل سؤال وقت محدّد — كلما أجبت أسرع زادت نقاطك (حتى ١٠٠٠).',
      'في وضع الفريقين يتناوب الفريقان على الأسئلة سؤالاً بسؤال.',
      'ثلاث إجابات صحيحة متتالية = نقاط إضافية 🔥',
      'لا تتكرر الأسئلة حتى ينتهي بنك الأسئلة كله.',
    ],
    close: 'تمام',
    noRepeat: 'أسئلة جديدة في كل جولة',
    poolReset: 'أكملت كل الأسئلة! بدأنا من جديد 🎉',
    poolCapped: (n) => `⚠️ هذا المستوى فيه ${n} سؤالاً فقط، فستكون المباراة بهذا العدد.`,
  },

  en: {
    dir: 'ltr',
    row: 'row',
    align: 'left',

    chooseLanguage: 'Choose your language',
    chooseLanguageHint: 'The questions and the whole interface follow your choice',
    arabicLabel: 'العربية',
    arabicSub: 'أسئلة وواجهة بالعربية',
    englishLabel: 'English',
    englishSub: 'Questions and UI in English',

    appTitleTop: 'OPEN',
    appTitleBottom: 'SESAME',
    tagline: 'The Trivia Game',
    play: "Let's Play!",
    howTo: 'How to play',
    langButton: 'العربية',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    musicOn: 'Music on',
    musicOff: 'Music off',
    best: 'Best score',
    back: 'Back',

    chooseMode: 'Choose a mode',
    soloMode: 'Single player',
    soloHint: 'Play alone and chase a high score',
    teamsMode: 'Two teams',
    teamsHint: 'Take turns on the same device',
    teamNames: 'Team names',
    team1Default: 'Red Team',
    team2Default: 'Blue Team',
    teamNameHint: 'You can rename them',

    matchSetup: 'Match setup',
    roundsLabel: 'Rounds',
    perRoundLabel: 'Questions per round',
    timeLabel: 'Time per question',
    secondsUnit: 's',
    totalQuestionsLabel: (n) => `${n} questions this match`,
    startMatch: 'Start match',

    chooseCategory: 'Pick a door',
    chooseLevel: 'Pick a level',
    levelEasy: 'Easy',
    levelMedium: 'Medium',
    levelHard: 'Hard',
    levelEasyHint: 'Gentle warm-up questions',
    levelMediumHint: 'Needs a bit of thinking',
    levelHardHint: 'For champions only!',
    mixedLevels: 'All levels',
    mixedLevelsHint: 'A mix of easy and hard',

    getReady: 'Get ready!',
    roundOf: (a, b) => `Round ${a} of ${b}`,
    questionOf: (a, b) => `Question ${a} of ${b}`,
    turnOf: (name) => `${name}'s turn`,
    yourTurn: 'Your turn',
    points: 'points',
    correct: 'Correct!',
    wrong: 'Not quite',
    timeUp: "Time's up!",
    theAnswerIs: 'The answer is',
    streak: 'streak',
    next: 'Next',
    seeResult: 'See results',
    scoreboard: 'Scoreboard',
    totalScore: 'Your score',
    correctAnswers: 'Correct answers',
    bestStreak: 'Best streak',
    accuracy: 'Accuracy',

    roundOver: 'Round over',
    standings: 'Standings',
    nextRound: 'Next round',
    leading: 'leading',
    tied: 'All square',
    roundSummary: 'Round summary',
    thisRound: 'This round',
    matchTotal: 'Match total',
    setupNextRound: 'Set up the next round',
    roundsDone: (a, b) => `${a} of ${b} rounds played`,

    roundSetupTitle: (n, total) => `Round ${n} of ${total}`,
    chooseRoundCategory: 'Pick this round’s category',
    chooseRoundLevel: 'Pick this round’s level',
    variedRoundsHint: 'Every round gets its own category and level — mix it up',
    alreadyPlayed: 'played',
    startRound: 'Start the round',

    pauseTitle: 'Paused',
    endRound: 'End this round',
    endRoundHint: 'Stop here and bank this round’s points',
    endRoundConfirm: 'End the round now?',
    endRoundBody: 'The remaining questions in this round are skipped. Points you already earned are kept.',
    backHome: 'Back to home',
    backHomeHint: 'Leave the whole match',
    backHomeConfirm: 'Leave the match?',
    backHomeBody: 'All match points will be lost.',
    continuePlaying: 'Keep playing',
    confirm: 'Yes, confirm',

    matchOver: 'Match over!',
    finalResult: 'Final result',
    winnerIs: (name) => `🏆 Winner: ${name}`,
    itsADraw: "🤝 It's a draw!",
    newRecord: '🏆 New record',
    playAgain: 'Play again',
    home: 'Home',
    rankName: ['Sesame Champion!', 'Excellent!', 'Nice work, keep going!', 'Give it another go'],
    cheerHigh: 'You got most of them right — keep it up!',
    cheerLow: 'Every miss is a new fact you just learned.',

    quitTitle: 'Leave the match?',
    quitBody: 'All match points will be lost.',
    quitYes: 'Yes, leave',
    quitNo: 'Keep playing',
    howToBody: [
      'Pick your language, then play solo or against a second team.',
      'A match is split into rounds, each with a fixed number of questions.',
      'Every question is timed — the faster you answer, the more points (up to 1000).',
      'In team mode the two teams alternate question by question.',
      'Three correct in a row earns a bonus 🔥',
      "Questions never repeat until you've seen the whole bank.",
    ],
    close: 'Got it',
    noRepeat: 'Fresh questions every round',
    poolReset: "You've seen them all! Starting over 🎉",
    poolCapped: (n) => `⚠️ This level only has ${n} questions, so the match will be that long.`,
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState('ar');
  const [chosen, setChosen] = useState(false); // هل اختار المستخدم لغته بعد؟

  const value = useMemo(
    () => ({
      lang,
      setLang,
      chosen,
      chooseLang: (l) => {
        setLang(l);
        setChosen(true);
      },
      resetChoice: () => setChosen(false),
      toggle: () => setLang((l) => (l === 'ar' ? 'en' : 'ar')),
      t: STRINGS[lang],
      isRTL: lang === 'ar',
    }),
    [lang, chosen]
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
