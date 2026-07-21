import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Animated } from 'react-native';
import Backdrop from '../components/Backdrop';
import Puppet from '../components/Puppet';
import { useLang } from '../i18n';
import { fx } from '../sound';
import { colors, radius } from '../theme';

/**
 * أول شاشة في التطبيق — يختار اللاعب لغته قبل أي شيء.
 * تُعرض النصوص باللغتين معاً حتى يفهمها الجميع.
 */
export default function LanguageScreen({ onPick }) {
  const { t } = useLang();
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 5, bounciness: 10 }).start();
  }, [pop]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  const OPTIONS = [
    {
      id: 'ar',
      title: 'العربية',
      sub: 'الأسئلة والواجهة بالعربية',
      flag: '🇸🇦',
      color: colors.grass,
      deep: colors.grassDeep,
      puppet: 'camel',
    },
    {
      id: 'en',
      title: 'English',
      sub: 'Questions and interface in English',
      flag: '🇬🇧',
      color: colors.ocean,
      deep: colors.oceanDeep,
      puppet: 'bird',
    },
  ];

  return (
    <Backdrop scene="strip">
      <SafeAreaView style={styles.safe}>
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <View style={styles.sign}>
            <Text style={styles.titleTop}>افتح يا سمسم</Text>
            <Text style={styles.titleBottom}>OPEN SESAME</Text>
          </View>
        </Animated.View>

        <View style={styles.headings}>
          <Text style={styles.h1}>اختر لغتك</Text>
          <Text style={styles.h1en}>Choose your language</Text>
        </View>

        <View style={styles.list}>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.id}
              onPressIn={() => fx('tap', 'light')}
              onPress={() => {
                fx('go', 'medium');
                onPick(o.id);
              }}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: o.color,
                  borderBottomColor: o.deep,
                  borderBottomWidth: pressed ? 3 : 8,
                  transform: [{ translateY: pressed ? 5 : 0 }],
                },
              ]}
            >
              <Puppet type={o.puppet} size={70} color={colors.cream} deep={colors.stoneDeep} mood="happy" />
              <Text style={styles.flag}>{o.flag}</Text>
              <Text style={styles.cardTitle}>{o.title}</Text>
              <Text style={styles.cardSub}>{o.sub}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', justifyContent: 'space-around', paddingVertical: 22, paddingHorizontal: 18 },
  sign: {
    backgroundColor: colors.tomato,
    borderBottomWidth: 9,
    borderBottomColor: colors.tomatoDeep,
    borderRadius: radius.lg,
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  titleTop: { fontSize: 34, fontWeight: '900', color: colors.white },
  titleBottom: { fontSize: 17, fontWeight: '900', color: colors.sand, letterSpacing: 2, marginTop: 2 },

  headings: { alignItems: 'center', gap: 2 },
  h1: { fontSize: 25, fontWeight: '900', color: colors.white },
  h1en: { fontSize: 17, fontWeight: '800', color: colors.cream, opacity: 0.92 },

  list: { flexDirection: 'row', gap: 13, width: '100%', justifyContent: 'center' },
  card: {
    flex: 1,
    maxWidth: 190,
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    gap: 2,
  },
  flag: { fontSize: 26, marginTop: 4 },
  cardTitle: { fontSize: 21, fontWeight: '900', color: colors.white },
  cardSub: { fontSize: 12, fontWeight: '700', color: colors.cream, textAlign: 'center', lineHeight: 17 },
});
