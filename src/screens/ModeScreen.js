import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, TextInput, ScrollView } from 'react-native';
import Backdrop from '../components/Backdrop';
import Puppet from '../components/Puppet';
import FeltButton from '../components/FeltButton';
import { useLang } from '../i18n';
import { fx } from '../sound';
import { colors, radius, TEAM_STYLES } from '../theme';

/**
 * اختيار طريقة اللعب: لاعب واحد أو فريقان.
 * عند اختيار الفريقين تظهر خانتان لتسمية كل فريق.
 */
export default function ModeScreen({ onPick, onBack }) {
  const { t, isRTL } = useLang();
  const [mode, setMode] = useState(null); // null | 'solo' | 'teams'
  const [names, setNames] = useState([t.team1Default, t.team2Default]);

  const setName = (i, v) => setNames((n) => n.map((x, k) => (k === i ? v : x)));

  return (
    <Backdrop tint={colors.grape} scene="strip">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { flexDirection: t.row }]}>
          <Pressable onPress={onBack} onPressIn={() => fx('tap', 'light')} style={styles.back} hitSlop={12}>
            <Text style={styles.backText}>{t.back}</Text>
          </Pressable>
          <View style={styles.plate}>
            <Text style={styles.plateText}>{t.chooseMode}</Text>
          </View>
          <View style={{ width: 78 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* لاعب واحد */}
          <Pressable
            onPressIn={() => fx('tap', 'light')}
            onPress={() => setMode('solo')}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.sun,
                borderBottomColor: colors.sunDeep,
                borderBottomWidth: pressed ? 3 : 8,
                transform: [{ translateY: pressed ? 5 : 0 }],
                flexDirection: t.row,
              },
              mode === 'solo' && styles.cardActive,
            ]}
          >
            <Puppet type="bird" size={62} color={colors.cream} deep={colors.stoneDeep} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { textAlign: t.align }]}>👤 {t.soloMode}</Text>
              <Text style={[styles.cardHint, { textAlign: t.align }]}>{t.soloHint}</Text>
            </View>
            {mode === 'solo' && <Text style={styles.check}>✓</Text>}
          </Pressable>

          {/* فريقان */}
          <Pressable
            onPressIn={() => fx('tap', 'light')}
            onPress={() => setMode('teams')}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.grass,
                borderBottomColor: colors.grassDeep,
                borderBottomWidth: pressed ? 3 : 8,
                transform: [{ translateY: pressed ? 5 : 0 }],
                flexDirection: t.row,
              },
              mode === 'teams' && styles.cardActive,
            ]}
          >
            <View style={{ flexDirection: 'row' }}>
              <Puppet type="furry" size={52} color={colors.tomato} deep={colors.tomatoDeep} />
              <Puppet type="cookie" size={52} color={colors.ocean} deep={colors.oceanDeep} style={{ marginLeft: -10 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { textAlign: t.align }]}>👥 {t.teamsMode}</Text>
              <Text style={[styles.cardHint, { textAlign: t.align }]}>{t.teamsHint}</Text>
            </View>
            {mode === 'teams' && <Text style={styles.check}>✓</Text>}
          </Pressable>

          {/* أسماء الفريقين */}
          {mode === 'teams' && (
            <View style={styles.namesBox}>
              <Text style={[styles.namesTitle, { writingDirection: t.dir }]}>{t.teamNames}</Text>
              {TEAM_STYLES.map((st, i) => (
                <View key={i} style={[styles.nameRow, { flexDirection: t.row }]}>
                  <View style={[styles.dot, { backgroundColor: st.color, borderBottomColor: st.deep }]} />
                  <TextInput
                    value={names[i]}
                    onChangeText={(v) => setName(i, v)}
                    maxLength={16}
                    style={[styles.input, { textAlign: t.align, writingDirection: t.dir }]}
                    placeholder={i === 0 ? t.team1Default : t.team2Default}
                    placeholderTextColor={colors.stoneDeep}
                  />
                </View>
              ))}
              <Text style={[styles.namesHint, { writingDirection: t.dir }]}>✏️ {t.teamNameHint}</Text>
            </View>
          )}

          <FeltButton
            label={t.next}
            size="lg"
            isRTL={isRTL}
            disabled={!mode}
            color={colors.tomato}
            deep={colors.tomatoDeep}
            textColor={colors.white}
            onPress={() =>
              onPick({
                mode,
                names: mode === 'teams'
                  ? names.map((n, i) => (n.trim() ? n.trim() : i === 0 ? t.team1Default : t.team2Default))
                  : null,
              })
            }
            style={{ marginTop: 18, alignSelf: 'center', minWidth: 220 }}
          />
          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 },
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  plateText: { fontSize: 21, fontWeight: '900', color: colors.ink },

  body: { paddingHorizontal: 18, paddingTop: 18, gap: 13 },
  card: { borderRadius: radius.lg, padding: 13, alignItems: 'center', gap: 12 },
  cardActive: { borderWidth: 4, borderColor: colors.white },
  cardTitle: { fontSize: 20, fontWeight: '900', color: colors.ink },
  cardHint: { fontSize: 13, fontWeight: '700', color: colors.ink, opacity: 0.72, marginTop: 2 },
  check: { fontSize: 22, fontWeight: '900', color: colors.white },

  namesBox: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderBottomWidth: 7,
    borderBottomColor: colors.stoneDeep,
    padding: 15,
    gap: 10,
  },
  namesTitle: { fontSize: 17, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  nameRow: { alignItems: 'center', gap: 10 },
  dot: { width: 26, height: 26, borderRadius: 13, borderBottomWidth: 4 },
  input: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    borderBottomWidth: 3,
    borderBottomColor: colors.stoneDeep,
  },
  namesHint: { fontSize: 12, fontWeight: '700', color: colors.cocoaSoft, textAlign: 'center' },
});
