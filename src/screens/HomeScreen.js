import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, Pressable, Modal, ScrollView } from 'react-native';
import Backdrop from '../components/Backdrop';
import Puppet from '../components/Puppet';
import FeltButton from '../components/FeltButton';
import { fx } from '../sound';
import { useLang } from '../i18n';
import { colors, radius } from '../theme';
import { TOTAL_QUESTIONS } from '../data';

export default function HomeScreen({ onStart, best, soundOn, musicOn, onToggleSound, onToggleMusic }) {
  const { t, isRTL, toggle } = useLang();
  const [help, setHelp] = useState(false);
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 5, bounciness: 11 }).start();
  }, [pop, isRTL]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });

  return (
    <Backdrop>
      <SafeAreaView style={styles.safe}>
        {/* مبدّل اللغة + الصوت + الشرح */}
        <View style={[styles.topBar, { flexDirection: t.row }]}>
          <Pressable
            onPress={() => {
              fx('tap', 'light');
              toggle();
            }}
            style={styles.langBtn}
            hitSlop={10}
          >
            <Text style={styles.langText}>🌐 {t.langButton}</Text>
          </Pressable>

          <View style={[styles.iconRow, { flexDirection: t.row }]}>
            <Pressable
              onPress={() => {
                const next = !soundOn;
                onToggleSound(next);
                if (next) fx('go', 'medium');
              }}
              style={[styles.iconBtn, !soundOn && styles.iconBtnOff]}
              hitSlop={10}
              accessibilityLabel={soundOn ? t.soundOn : t.soundOff}
            >
              <Text style={styles.iconText}>{soundOn ? '🔊' : '🔇'}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                fx('tap', 'light');
                onToggleMusic(!musicOn);
              }}
              style={[styles.iconBtn, !musicOn && styles.iconBtnOff]}
              hitSlop={10}
              accessibilityLabel={musicOn ? t.musicOn : t.musicOff}
            >
              <Text style={[styles.iconText, !musicOn && { opacity: 0.45 }]}>🎵</Text>
              {/* خط مائل يوضّح أن الموسيقى مغلقة */}
              {!musicOn && <View style={styles.slash} />}
            </Pressable>
            <Pressable
              onPress={() => {
                fx('tap', 'light');
                setHelp(true);
              }}
              style={styles.iconBtn}
              hitSlop={10}
            >
              <Text style={styles.iconText}>؟</Text>
            </Pressable>
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <View style={styles.sign}>
            <Text style={styles.titleTop}>{t.appTitleTop}</Text>
            <Text style={styles.titleBottom}>{t.appTitleBottom}</Text>
            {[
              [true, true],
              [true, false],
              [false, true],
              [false, false],
            ].map(([top, left], i) => (
              <View
                key={i}
                style={[styles.bolt, top ? { top: 10 } : { bottom: 10 }, left ? { left: 10 } : { right: 10 }]}
              />
            ))}
          </View>
          <View style={styles.ribbon}>
            <Text style={styles.ribbonText}>{t.tagline}</Text>
          </View>
        </Animated.View>

        {/* الشخصيات */}
        <View style={styles.cast}>
          <Puppet type="grouch" size={78} color={colors.grass} deep={colors.grassDeep} />
          <Puppet type="bird" size={104} color={colors.sun} deep={colors.sunDeep} mood="happy" />
          <Puppet type="cookie" size={92} color={colors.ocean} deep={colors.oceanDeep} />
          <Puppet type="camel" size={86} color={colors.orange} deep={colors.orangeDeep} />
        </View>

        <View style={styles.bottom}>
          <View style={[styles.chipRow, { flexDirection: t.row }]}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>📚 {TOTAL_QUESTIONS}</Text>
            </View>
            {best > 0 && (
              <View style={[styles.chip, { backgroundColor: colors.sun }]}>
                <Text style={styles.chipText}>⭐ {best}</Text>
              </View>
            )}
          </View>

          <FeltButton
            label={t.play}
            size="lg"
            isRTL={isRTL}
            color={colors.tomato}
            deep={colors.tomatoDeep}
            textColor={colors.white}
            onPress={onStart}
            style={{ minWidth: 250 }}
          />
        </View>
      </SafeAreaView>

      {/* نافذة الشرح */}
      <Modal visible={help} transparent animationType="fade" onRequestClose={() => setHelp(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { writingDirection: t.dir }]}>{t.howTo}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {t.howToBody.map((line, i) => (
                <View key={i} style={[styles.bulletRow, { flexDirection: t.row }]}>
                  <View style={styles.bulletDot} />
                  <Text style={[styles.bulletText, { textAlign: t.align, writingDirection: t.dir }]}>{line}</Text>
                </View>
              ))}
            </ScrollView>
            <FeltButton
              label={t.close}
              isRTL={isRTL}
              color={colors.grass}
              deep={colors.grassDeep}
              textColor={colors.white}
              onPress={() => setHelp(false)}
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between', paddingBottom: 14 },
  topBar: { justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, alignItems: 'center' },
  langBtn: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 4,
    borderBottomColor: colors.stoneDeep,
  },
  langText: { fontWeight: '900', color: colors.ink, fontSize: 14 },
  iconRow: { gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.stoneDeep,
  },
  iconBtnOff: { backgroundColor: colors.stone, opacity: 0.75 },
  iconText: { fontWeight: '900', color: colors.ink, fontSize: 17 },
  slash: {
    position: 'absolute',
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.tomatoDeep,
    transform: [{ rotate: '-45deg' }],
  },

  sign: {
    backgroundColor: colors.tomato,
    borderBottomWidth: 10,
    borderBottomColor: colors.tomatoDeep,
    borderRadius: radius.lg,
    paddingHorizontal: 34,
    paddingVertical: 14,
    alignItems: 'center',
  },
  titleTop: { fontSize: 28, fontWeight: '900', color: colors.sand, letterSpacing: 1 },
  titleBottom: { fontSize: 46, lineHeight: 58, fontWeight: '900', color: colors.white, letterSpacing: 1 },
  bolt: { position: 'absolute', width: 11, height: 11, borderRadius: 6, backgroundColor: colors.sand, opacity: 0.85 },

  ribbon: {
    marginTop: -11,
    backgroundColor: colors.grape,
    borderBottomWidth: 6,
    borderBottomColor: colors.grapeDeep,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  ribbonText: { color: colors.white, fontWeight: '900', fontSize: 15 },

  cast: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: -4 },

  bottom: { alignItems: 'center', gap: 12 },
  chipRow: { gap: 8 },
  chip: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 4,
    borderBottomColor: colors.stoneDeep,
  },
  chipText: { fontWeight: '900', color: colors.ink, fontSize: 14 },

  modalWrap: { flex: 1, backgroundColor: 'rgba(51,36,29,0.6)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  modalCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderBottomWidth: 8,
    borderBottomColor: colors.stoneDeep,
    padding: 22,
    width: '100%',
  },
  modalTitle: { fontSize: 24, fontWeight: '900', color: colors.ink, textAlign: 'center', marginBottom: 14 },
  bulletRow: { alignItems: 'flex-start', gap: 10, marginBottom: 11 },
  bulletDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.tomato, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 16, lineHeight: 25, fontWeight: '700', color: colors.ink },
});
