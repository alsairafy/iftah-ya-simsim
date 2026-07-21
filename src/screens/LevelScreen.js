import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import Backdrop from '../components/Backdrop';
import Puppet from '../components/Puppet';
import { remainingCount } from '../data';
import { fx } from '../sound';
import { useLang } from '../i18n';
import { colors, radius, levelStyles } from '../theme';

export default function LevelScreen({ category, onPick, onBack, seen, roundIndex, rounds }) {
  const { t, lang } = useLang();
  const perRound = typeof roundIndex === 'number';

  const options = [
    { id: 'easy', name: t.levelEasy, hint: t.levelEasyHint },
    { id: 'medium', name: t.levelMedium, hint: t.levelMediumHint },
    { id: 'hard', name: t.levelHard, hint: t.levelHardHint },
    { id: 'mixed', name: t.mixedLevels, hint: t.mixedLevelsHint },
  ];

  return (
    <Backdrop tint={category.color} scene="strip">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { flexDirection: t.row }]}>
          <Pressable onPress={onBack} onPressIn={() => fx('tap', 'light')} style={styles.back} hitSlop={12}>
            <Text style={styles.backText}>{t.back}</Text>
          </Pressable>
          <View style={styles.plate}>
            <Text style={styles.plateText}>{perRound ? t.chooseRoundLevel : t.chooseLevel}</Text>
          </View>
          <View style={{ width: 78 }} />
        </View>

        {perRound && (
          <View style={styles.roundBanner}>
            <Text style={styles.roundBannerText}>{t.roundSetupTitle(roundIndex + 1, rounds)}</Text>
          </View>
        )}

        <View style={styles.hero}>
          <Puppet type={category.puppet} size={92} color={colors.cream} deep={colors.stoneDeep} mood="think" />
          <View style={styles.catPill}>
            <Text style={styles.catText}>
              {category.emoji}  {category[lang]}
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {options.map((o) => {
            const st = levelStyles[o.id];
            const left = remainingCount(category.id, o.id, seen);
            return (
              <Pressable
                key={o.id}
                onPressIn={() => fx('tap', 'light')}
                onPress={() => onPick(o.id)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: st.color,
                    borderBottomColor: st.deep,
                    borderBottomWidth: pressed ? 3 : 7,
                    transform: [{ translateY: pressed ? 4 : 0 }],
                    flexDirection: t.row,
                  },
                ]}
              >
                <View style={[styles.emojiBox, { backgroundColor: st.deep }]}>
                  <Text style={styles.emoji}>{st.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { textAlign: t.align }]}>{o.name}</Text>
                  <Text style={[styles.rowHint, { textAlign: t.align }]}>{o.hint}</Text>
                </View>
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{left}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.footNote, { writingDirection: t.dir }]}>✨ {t.noRepeat}</Text>
      </SafeAreaView>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
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
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  plateText: { fontSize: 22, fontWeight: '900', color: colors.ink },

  hero: { alignItems: 'center', marginTop: 6 },
  catPill: {
    marginTop: -6,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  catText: { color: colors.white, fontWeight: '900', fontSize: 16 },

  list: { paddingHorizontal: 18, gap: 12, marginTop: 16 },
  row: {
    borderRadius: radius.md,
    padding: 13,
    alignItems: 'center',
    gap: 12,
  },
  emojiBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  rowTitle: { fontSize: 20, fontWeight: '900', color: colors.ink },
  rowHint: { fontSize: 13, fontWeight: '700', color: colors.ink, opacity: 0.72, marginTop: 1 },
  countPill: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radius.pill,
    minWidth: 30,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
  },
  countText: { fontSize: 13, fontWeight: '900', color: colors.ink },

  footNote: {
    textAlign: 'center',
    marginTop: 16,
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
    opacity: 0.9,
  },
  roundBanner: {
    alignSelf: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginTop: 8,
  },
  roundBannerText: { color: colors.white, fontWeight: '900', fontSize: 13 },
});
