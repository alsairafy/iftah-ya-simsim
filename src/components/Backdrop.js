import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme';

const { width: W } = Dimensions.get('window');

function Cloud({ top, from, duration, scale = 1 }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [x, duration]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [from, from + W + 200] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top, transform: [{ translateX }, { scale }] }}
    >
      <View style={styles.cloudBody}>
        <View style={[styles.puff, { width: 52, height: 52, left: -16, top: -22 }]} />
        <View style={[styles.puff, { width: 38, height: 38, right: -10, top: -14 }]} />
      </View>
    </Animated.View>
  );
}

/**
 * مشهد الشارع: سماء + شمس + سحب + عمارة طوب + درج + فانوس + سياج
 * scene: 'full' — المشهد كامل | 'strip' — شريط أرضي بسيط فقط
 */
export default function Backdrop({ children, tint = colors.sky, scene = 'full' }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 30000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.root, { backgroundColor: tint }]}>
      {/* الشمس */}
      <Animated.View pointerEvents="none" style={[styles.sun, { transform: [{ rotate }] }]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={[styles.ray, { transform: [{ rotate: `${i * 22.5}deg` }] }]} />
        ))}
        <View style={styles.sunCore} />
      </Animated.View>

      <Cloud top={90} from={-140} duration={34000} />
      <Cloud top={190} from={-W * 0.55} duration={48000} scale={0.65} />

      {scene === 'full' ? <Street /> : <Strip />}

      {children}
    </View>
  );
}

// شريط أرضي بسيط لشاشات اللعب
function Strip() {
  return (
    <View pointerEvents="none" style={styles.strip}>
      <View style={styles.stripLip} />
    </View>
  );
}

// مشهد الشارع الكامل
function Street() {
  return (
    <View pointerEvents="none" style={styles.street}>
      {/* عمارة الطوب */}
      <View style={styles.building}>
        {/* صفوف الطوب */}
        {Array.from({ length: 7 }).map((_, r) => (
          <View key={r} style={[styles.brickRow, { marginLeft: r % 2 ? 0 : -14 }]}>
            {Array.from({ length: 6 }).map((__, c) => (
              <View key={c} style={styles.brick} />
            ))}
          </View>
        ))}

        {/* الشباك */}
        <View style={styles.window}>
          <View style={styles.windowGlass} />
          <View style={styles.windowCross} />
          <View style={[styles.windowCross, styles.windowCrossV]} />
        </View>

        {/* الباب ولوحة الرقم */}
        <View style={styles.door}>
          <View style={styles.doorKnob} />
        </View>
        <View style={styles.plate}>
          <Text style={styles.plateText}>١٢٣</Text>
        </View>
      </View>

      {/* الدرج */}
      <View style={styles.stoop}>
        <View style={[styles.step, { width: 96 }]} />
        <View style={[styles.step, { width: 118 }]} />
        <View style={[styles.step, { width: 140 }]} />
      </View>

      {/* الفانوس */}
      <View style={styles.lamp}>
        <View style={styles.lampGlow} />
        <View style={styles.lampHead} />
        <View style={styles.lampPole} />
      </View>

      {/* الرصيف */}
      <View style={styles.pavement}>
        <View style={styles.pavementLip} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },

  sun: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {
    position: 'absolute',
    width: 200,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.sun,
    opacity: 0.5,
  },
  sunCore: { width: 124, height: 124, borderRadius: 62, backgroundColor: colors.sun },

  cloudBody: { width: 88, height: 32, borderRadius: 18, backgroundColor: colors.white, opacity: 0.92 },
  puff: { position: 'absolute', borderRadius: 40, backgroundColor: colors.white },

  strip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: colors.sand,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  stripLip: {
    height: 11,
    backgroundColor: colors.sandDeep,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },

  street: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 300 },

  building: {
    position: 'absolute',
    bottom: 74,
    left: 18,
    width: 172,
    height: 186,
    backgroundColor: colors.brick,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
    paddingTop: 8,
  },
  brickRow: { flexDirection: 'row', marginBottom: 4 },
  brick: {
    width: 30,
    height: 14,
    backgroundColor: colors.brickDeep,
    opacity: 0.45,
    borderRadius: 3,
    marginRight: 4,
  },
  window: {
    position: 'absolute',
    top: 26,
    right: 20,
    width: 52,
    height: 56,
    backgroundColor: colors.stone,
    borderRadius: 6,
    padding: 5,
  },
  windowGlass: { flex: 1, backgroundColor: colors.skyDeep, borderRadius: 3, opacity: 0.85 },
  windowCross: {
    position: 'absolute',
    top: '48%',
    left: 5,
    right: 5,
    height: 4,
    backgroundColor: colors.stone,
  },
  windowCrossV: { top: 5, bottom: 5, left: '46%', right: undefined, width: 4, height: undefined },
  door: {
    position: 'absolute',
    bottom: 0,
    left: 24,
    width: 54,
    height: 88,
    backgroundColor: colors.cocoa,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 7,
  },
  doorKnob: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.sun },
  plate: {
    position: 'absolute',
    bottom: 92,
    left: 26,
    backgroundColor: colors.cream,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderBottomWidth: 3,
    borderBottomColor: colors.stoneDeep,
  },
  plateText: { fontSize: 15, fontWeight: '900', color: colors.brickDeep },

  stoop: { position: 'absolute', bottom: 74, left: 8, alignItems: 'flex-start' },
  step: {
    height: 13,
    backgroundColor: colors.stone,
    borderTopWidth: 3,
    borderTopColor: colors.white,
    borderBottomWidth: 3,
    borderBottomColor: colors.stoneDeep,
  },

  lamp: { position: 'absolute', bottom: 74, right: 34, alignItems: 'center' },
  lampGlow: {
    position: 'absolute',
    top: -8,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.sun,
    opacity: 0.35,
  },
  lampHead: {
    width: 24,
    height: 26,
    backgroundColor: colors.sun,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 3,
    borderColor: colors.cocoa,
  },
  lampPole: { width: 8, height: 108, backgroundColor: colors.cocoa, borderRadius: 4 },

  pavement: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 74, backgroundColor: colors.pavement },
  pavementLip: { height: 10, backgroundColor: colors.pavementDeep },
});
