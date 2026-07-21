import React, { useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';
import { fx } from '../sound';

/**
 * زر بحافة سفلية سميكة "ينضغط" للأسفل عند اللمس
 */
export default function FeltButton({
  label,
  onPress,
  color = colors.sun,
  deep = colors.sunDeep,
  textColor = colors.ink,
  size = 'md',
  disabled = false,
  isRTL = true,
  sound = 'tap',
  style,
  labelStyle,
  children,
}) {
  const press = useRef(new Animated.Value(0)).current;
  const lip = size === 'lg' ? 9 : size === 'sm' ? 5 : 7;

  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, lip] });
  const lipHeight = press.interpolate({ inputRange: [0, 1], outputRange: [lip, 0] });

  const to = (v) =>
    Animated.spring(press, { toValue: v, useNativeDriver: false, speed: 45, bounciness: 0 }).start();

  const pad =
    size === 'lg'
      ? { paddingVertical: 19, paddingHorizontal: 32 }
      : size === 'sm'
      ? { paddingVertical: 9, paddingHorizontal: 15 }
      : { paddingVertical: 14, paddingHorizontal: 22 };

  return (
    <Pressable
      onPressIn={() => {
        if (disabled) return;
        to(1);
        if (sound) fx(sound, 'light');
      }}
      onPressOut={() => !disabled && to(0)}
      onPress={() => !disabled && onPress && onPress()}
      disabled={disabled}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}
    >
      <Animated.View style={{ paddingBottom: lipHeight }}>
        <Animated.View
          style={[
            styles.face,
            pad,
            { backgroundColor: color, borderBottomColor: deep, borderBottomWidth: lip, transform: [{ translateY }] },
          ]}
        >
          {children || (
            <Text
              style={[
                styles.label,
                {
                  color: textColor,
                  fontSize: size === 'lg' ? 25 : size === 'sm' ? 15 : 19,
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
                labelStyle,
              ]}
            >
              {label}
            </Text>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '900', textAlign: 'center' },
});
