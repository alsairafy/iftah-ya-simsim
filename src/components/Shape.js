import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme';

/**
 * أشكال الإجابات الأربعة (مثلث / معيّن / دائرة / مربّع) — بنمط كاهوت
 * مرسومة بحدود View بدون مكتبة SVG
 */
export default function Shape({ kind, size = 22, color = colors.white }) {
  if (kind === 'triangle') {
    return (
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.55,
          borderRightWidth: size * 0.55,
          borderBottomWidth: size * 0.95,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          backgroundColor: 'transparent',
        }}
      />
    );
  }

  if (kind === 'diamond') {
    return (
      <View
        style={{
          width: size * 0.75,
          height: size * 0.75,
          backgroundColor: color,
          borderRadius: size * 0.1,
          transform: [{ rotate: '45deg' }],
        }}
      />
    );
  }

  if (kind === 'circle') {
    return (
      <View
        style={{
          width: size * 0.92,
          height: size * 0.92,
          borderRadius: size,
          backgroundColor: color,
        }}
      />
    );
  }

  // square
  return (
    <View
      style={{
        width: size * 0.85,
        height: size * 0.85,
        borderRadius: size * 0.14,
        backgroundColor: color,
      }}
    />
  );
}
