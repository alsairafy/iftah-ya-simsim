import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { colors } from '../theme';

/**
 * دُمى بستايل "افتح يا سمسم" — مرسومة بالكامل بعناصر View، بدون أي صور.
 *
 * type: 'bird' | 'furry' | 'grouch' | 'camel' | 'cookie'
 * mood: 'idle' | 'happy' | 'sad' | 'think'
 */
export default function Puppet({
  type = 'furry',
  size = 120,
  color = colors.tomato,
  deep = colors.tomatoDeep,
  mood = 'idle',
  style,
}) {
  const bob = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fast = mood === 'happy';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: fast ? 280 : 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: fast ? 280 : 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob, mood]);

  useEffect(() => {
    let alive = true;
    let timer;
    const tick = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        Animated.sequence([
          Animated.timing(blink, { toValue: 0.08, duration: 80, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start(tick);
      }, 1500 + Math.random() * 3000);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [blink]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.06] });
  const rotate = bob.interpolate({
    inputRange: [0, 1],
    outputRange: mood === 'happy' ? ['-8deg', '8deg'] : ['-2deg', '2deg'],
  });

  const s = size / 100; // معامل القياس

  return (
    <Animated.View style={[{ alignItems: 'center' }, style, { transform: [{ translateY }, { rotate }] }]}>
      {type === 'bird' && <Bird s={s} color={color} deep={deep} mood={mood} blink={blink} />}
      {type === 'furry' && <Furry s={s} color={color} deep={deep} mood={mood} blink={blink} />}
      {type === 'grouch' && <Grouch s={s} color={color} deep={deep} mood={mood} blink={blink} />}
      {type === 'camel' && <Camel s={s} color={color} deep={deep} mood={mood} blink={blink} />}
      {type === 'cookie' && <Cookie s={s} color={color} deep={deep} mood={mood} blink={blink} />}
    </Animated.View>
  );
}

/* ---------- أجزاء مشتركة ---------- */

// العين البارزة الكبيرة — علامة دُمى سمسم المميزة
function Eye({ s, d = 34, blink, look = 'center', ring = colors.white, lid }) {
  const pupil = d * 0.42;
  const pos =
    look === 'down'
      ? { bottom: d * 0.12 }
      : look === 'up'
      ? { top: d * 0.1 }
      : { top: d * 0.28 };

  return (
    <Animated.View
      style={{
        width: d * s,
        height: d * s,
        borderRadius: (d * s) / 2,
        backgroundColor: ring,
        borderWidth: 2.5 * s,
        borderColor: colors.ink,
        alignItems: 'center',
        overflow: 'hidden',
        transform: [{ scaleY: blink }],
      }}
    >
      <View
        style={[
          {
            position: 'absolute',
            width: pupil * s,
            height: pupil * s,
            borderRadius: (pupil * s) / 2,
            backgroundColor: colors.ink,
          },
          { top: pos.top ? pos.top * s : undefined, bottom: pos.bottom ? pos.bottom * s : undefined },
        ]}
      />
      {/* جفن علوي لبعض الشخصيات */}
      {lid && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            width: '100%',
            height: d * s * 0.34,
            backgroundColor: lid,
          }}
        />
      )}
    </Animated.View>
  );
}

// فم مبتسم / حزين / مفتوح
function Mouth({ s, w = 40, mood, fill = colors.cocoa, tongue = colors.tomato }) {
  if (mood === 'sad') {
    return (
      <View
        style={{
          width: w * s,
          height: w * 0.5 * s,
          borderWidth: 4.5 * s,
          borderColor: fill,
          borderRadius: w * 0.5 * s,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
        }}
      />
    );
  }
  const open = mood === 'happy';
  return (
    <View
      style={{
        width: w * s * (open ? 1.1 : 1),
        height: w * s * (open ? 0.75 : 0.5),
        backgroundColor: fill,
        borderBottomLeftRadius: w * s,
        borderBottomRightRadius: w * s,
        borderTopLeftRadius: w * s * 0.12,
        borderTopRightRadius: w * s * 0.12,
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: w * s * 0.55,
          height: w * s * 0.5,
          borderRadius: w * s * 0.3,
          backgroundColor: tongue,
          marginTop: w * s * (open ? 0.3 : 0.22),
        }}
      />
    </View>
  );
}

// حافة "فرو" — دوائر صغيرة حول الرأس
function Fuzz({ s, count = 12, radius, color, dot = 12 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: dot * s,
              height: dot * s,
              borderRadius: (dot * s) / 2,
              backgroundColor: color,
              left: radius * s + Math.cos(angle) * radius * s - (dot * s) / 2,
              top: radius * s + Math.sin(angle) * radius * s - (dot * s) / 2,
            }}
          />
        );
      })}
    </>
  );
}

/* ---------- الشخصيات ---------- */

// الطائر الطويل — ريش على الرأس ومنقار برتقالي
function Bird({ s, color, deep, mood, blink }) {
  return (
    <View style={{ alignItems: 'center' }}>
      {/* الريش */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: -6 * s }}>
        {[16, 26, 18].map((h, i) => (
          <View
            key={i}
            style={{
              width: 10 * s,
              height: h * s,
              backgroundColor: deep,
              borderRadius: 6 * s,
              marginHorizontal: 1.5 * s,
              transform: [{ rotate: `${(i - 1) * 14}deg` }],
            }}
          />
        ))}
      </View>

      {/* الرأس */}
      <View
        style={{
          width: 88 * s,
          height: 82 * s,
          backgroundColor: color,
          borderRadius: 44 * s,
          borderBottomWidth: 5 * s,
          borderBottomColor: deep,
          alignItems: 'center',
          paddingTop: 8 * s,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 4 * s }}>
          <Eye s={s} d={30} blink={blink} look={mood === 'sad' ? 'down' : 'center'} lid={color} />
          <Eye s={s} d={30} blink={blink} look={mood === 'sad' ? 'down' : 'center'} lid={color} />
        </View>
        {/* المنقار */}
        <View
          style={{
            width: 34 * s,
            height: 22 * s,
            backgroundColor: colors.orange,
            borderRadius: 8 * s,
            borderBottomLeftRadius: 16 * s,
            borderBottomRightRadius: 16 * s,
            borderBottomWidth: 3 * s,
            borderBottomColor: colors.orangeDeep,
            marginTop: 4 * s,
          }}
        />
      </View>
    </View>
  );
}

// الوحش الفروي المستدير
function Furry({ s, color, deep, mood, blink }) {
  return (
    <View style={{ width: 96 * s, height: 96 * s, alignItems: 'center', justifyContent: 'center' }}>
      <Fuzz s={s} count={14} radius={48} color={deep} dot={15} />
      <View
        style={{
          position: 'absolute',
          width: 86 * s,
          height: 86 * s,
          borderRadius: 43 * s,
          backgroundColor: color,
          alignItems: 'center',
          paddingTop: 6 * s,
        }}
      >
        {/* عينان بارزتان فوق الرأس */}
        <View style={{ flexDirection: 'row', gap: 2 * s, marginTop: -14 * s }}>
          <Eye s={s} d={34} blink={blink} look={mood === 'sad' ? 'down' : 'up'} />
          <Eye s={s} d={34} blink={blink} look={mood === 'sad' ? 'down' : 'up'} />
        </View>
        {/* الأنف */}
        <View
          style={{
            width: 20 * s,
            height: 15 * s,
            borderRadius: 10 * s,
            backgroundColor: colors.orange,
            marginTop: 4 * s,
          }}
        />
        <View style={{ marginTop: 3 * s }}>
          <Mouth s={s} w={34} mood={mood} />
        </View>
      </View>
    </View>
  );
}

// النكد داخل صندوق — حاجبان كثيفان
function Grouch({ s, color, deep, mood, blink }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 84 * s,
          height: 66 * s,
          backgroundColor: color,
          borderTopLeftRadius: 42 * s,
          borderTopRightRadius: 42 * s,
          alignItems: 'center',
          paddingTop: 4 * s,
        }}
      >
        {/* حاجب واحد كثيف */}
        <View
          style={{
            position: 'absolute',
            top: 2 * s,
            width: 66 * s,
            height: 11 * s,
            borderRadius: 6 * s,
            backgroundColor: deep,
            zIndex: 3,
          }}
        />
        <View style={{ flexDirection: 'row', gap: 3 * s, marginTop: 6 * s }}>
          <Eye s={s} d={28} blink={blink} look={mood === 'happy' ? 'up' : 'down'} />
          <Eye s={s} d={28} blink={blink} look={mood === 'happy' ? 'up' : 'down'} />
        </View>
        <View style={{ marginTop: 2 * s }}>
          <Mouth s={s} w={30} mood={mood === 'idle' ? 'sad' : mood} />
        </View>
      </View>
      {/* الصندوق */}
      <View
        style={{
          width: 100 * s,
          height: 34 * s,
          backgroundColor: colors.pavement,
          borderTopLeftRadius: 8 * s,
          borderTopRightRadius: 8 * s,
          borderBottomWidth: 5 * s,
          borderBottomColor: colors.pavementDeep,
          justifyContent: 'space-evenly',
          paddingVertical: 4 * s,
        }}
      >
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{ height: 4 * s, backgroundColor: colors.pavementDeep, marginHorizontal: 6 * s, borderRadius: 2 }}
          />
        ))}
      </View>
    </View>
  );
}

// الجمل — رمز "افتح يا سمسم"
function Camel({ s, color, deep, mood, blink }) {
  return (
    <View style={{ alignItems: 'center' }}>
      {/* الأذنان */}
      <View style={{ flexDirection: 'row', width: 76 * s, justifyContent: 'space-between', marginBottom: -8 * s }}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{
              width: 16 * s,
              height: 20 * s,
              borderRadius: 10 * s,
              backgroundColor: deep,
              transform: [{ rotate: `${i ? 20 : -20}deg` }],
            }}
          />
        ))}
      </View>

      {/* الرأس */}
      <View
        style={{
          width: 76 * s,
          height: 64 * s,
          backgroundColor: color,
          borderRadius: 34 * s,
          alignItems: 'center',
          paddingTop: 8 * s,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 4 * s }}>
          <Eye s={s} d={26} blink={blink} look={mood === 'sad' ? 'down' : 'center'} lid={color} />
          <Eye s={s} d={26} blink={blink} look={mood === 'sad' ? 'down' : 'center'} lid={color} />
        </View>
      </View>

      {/* الخطم الطويل */}
      <View
        style={{
          width: 52 * s,
          height: 40 * s,
          backgroundColor: colors.sand,
          borderRadius: 22 * s,
          borderBottomWidth: 4 * s,
          borderBottomColor: colors.sandDeep,
          marginTop: -12 * s,
          alignItems: 'center',
          paddingTop: 6 * s,
        }}
      >
        {/* المنخران */}
        <View style={{ flexDirection: 'row', gap: 10 * s }}>
          {[0, 1].map((i) => (
            <View
              key={i}
              style={{ width: 7 * s, height: 9 * s, borderRadius: 5 * s, backgroundColor: colors.cocoaSoft }}
            />
          ))}
        </View>
        <View style={{ marginTop: 3 * s }}>
          <Mouth s={s} w={26} mood={mood} fill={colors.cocoaSoft} tongue={colors.pink} />
        </View>
      </View>
    </View>
  );
}

// وحش العيون المتدحرجة — عينان ضخمتان غير متساويتين
function Cookie({ s, color, deep, mood, blink }) {
  return (
    <View style={{ width: 100 * s, height: 96 * s, alignItems: 'center', justifyContent: 'center' }}>
      <Fuzz s={s} count={16} radius={48} color={deep} dot={13} />
      <View
        style={{
          position: 'absolute',
          width: 88 * s,
          height: 86 * s,
          borderRadius: 44 * s,
          backgroundColor: color,
          alignItems: 'center',
        }}
      >
        {/* عينان متداخلتان بأحجام مختلفة — التوقيع الأشهر */}
        <View style={{ flexDirection: 'row', marginTop: -18 * s, alignItems: 'flex-end' }}>
          <Eye s={s} d={38} blink={blink} look="up" />
          <View style={{ marginLeft: -8 * s, marginBottom: 6 * s }}>
            <Eye s={s} d={32} blink={blink} look="center" />
          </View>
        </View>
        <View style={{ marginTop: 10 * s }}>
          <Mouth s={s} w={46} mood={mood === 'idle' ? 'happy' : mood} tongue={colors.pink} />
        </View>
      </View>
    </View>
  );
}
