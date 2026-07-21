import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import Backdrop from '../components/Backdrop';
import Puppet from '../components/Puppet';
import { categories, remainingCount } from '../data';
import { fx } from '../sound';
import { useLang } from '../i18n';
import { colors, radius } from '../theme';

export default function CategoryScreen({
  onPick,
  onBack,
  onHome,
  seen,
  roundIndex,
  rounds,
  usedCategories = [],
}) {
  const { t, lang } = useLang();
  const perRound = typeof roundIndex === 'number'; // نحن نجهّز جولة محدّدة

  return (
    <Backdrop tint={colors.skyDeep} scene="strip">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { flexDirection: t.row }]}>
          <Pressable onPress={onBack} onPressIn={() => fx('tap', 'light')} style={styles.back} hitSlop={12}>
            <Text style={styles.backText}>{t.back}</Text>
          </Pressable>
          <View style={styles.plate}>
            <Text style={styles.plateText}>{perRound ? t.chooseRoundCategory : t.chooseCategory}</Text>
          </View>
          {onHome ? (
            <Pressable onPress={onHome} onPressIn={() => fx('tap', 'light')} style={styles.home} hitSlop={12}>
              {/* نص لا أيقونة — الأيقونة 🏠 تتعارض مع فئة «حياتنا اليومية» */}
              <Text style={styles.homeText}>{t.goHome}</Text>
            </Pressable>
          ) : (
            <View style={{ width: 78 }} />
          )}
        </View>

        {perRound && (
          <View style={styles.roundBanner}>
            <Text style={styles.roundBannerText}>{t.roundSetupTitle(roundIndex + 1, rounds)}</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {categories.map((c) => {
            const left = remainingCount(c.id, 'mixed', seen);
            return (
              <Pressable
                key={c.id}
                onPressIn={() => fx('tap', 'light')}
                onPress={() => onPick(c)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: c.color,
                    borderBottomColor: c.deep,
                    borderBottomWidth: pressed ? 3 : 8,
                    transform: [{ translateY: pressed ? 5 : 0 }],
                  },
                ]}
              >
                <Puppet type={c.puppet} size={62} color={colors.cream} deep={colors.stoneDeep} />
                <Text style={styles.emoji}>{c.emoji}</Text>
                <Text style={styles.cardText} numberOfLines={2}>
                  {c[lang]}
                </Text>
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{left}</Text>
                </View>
                {/* علامة على الأبواب التي لُعبت في جولة سابقة */}
                {usedCategories.includes(c.id) && (
                  <View style={styles.usedTag}>
                    <Text style={styles.usedText}>✓ {t.alreadyPlayed}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          <View style={{ height: 110 }} />
        </ScrollView>
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
    paddingBottom: 4,
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
    backgroundColor: colors.sun,
    borderBottomWidth: 6,
    borderBottomColor: colors.sunDeep,
    borderRadius: radius.md,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  plateText: { fontSize: 23, fontWeight: '900', color: colors.ink },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    width: '45%',
    aspectRatio: 0.88,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 8,
  },
  emoji: { fontSize: 24, marginTop: 2 },
  cardText: { fontSize: 17, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  countPill: {
    position: 'absolute',
    top: 9,
    right: 9,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radius.pill,
    minWidth: 26,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignItems: 'center',
  },
  countText: { fontSize: 12, fontWeight: '900', color: colors.ink },

  home: {
    width: 78,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: 7,
    borderBottomWidth: 4,
    borderBottomColor: colors.stoneDeep,
  },
  homeText: { fontSize: 13, fontWeight: '900', color: colors.tomatoDeep },

  roundBanner: {
    alignSelf: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginTop: 8,
  },
  roundBannerText: { color: colors.white, fontWeight: '900', fontSize: 13 },

  usedTag: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(51,36,29,0.72)',
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  usedText: { fontSize: 10, fontWeight: '900', color: colors.white },
});
