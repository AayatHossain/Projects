import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BADGES, QUIZ, QuizQuestion, SCENARIOS, Scenario } from '../../src/content';
import { useData } from '../../src/data';
import { colors } from '../../src/theme';
import { Card, ScreenTitle, SectionTitle } from '../../src/ui';

function ScenarioCard({
  scenario,
  done,
  onComplete,
}: {
  scenario: Scenario;
  done: boolean;
  onComplete: (points: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (scenario.options[i].good && !done) onComplete(scenario.points);
  }

  return (
    <Card style={styles.scn}>
      <SectionTitle>🎭 What Would You Do?</SectionTitle>
      <Text style={styles.scnText}>{scenario.text}</Text>
      {scenario.options.map((o, i) => {
        const chosen = picked === i;
        const style = [
          styles.opt,
          chosen && (o.good ? styles.optGood : styles.optBad),
        ];
        return (
          <Pressable key={i} style={style} onPress={() => pick(i)} disabled={picked !== null}>
            <Text style={styles.optText}>{o.label}</Text>
          </Pressable>
        );
      })}
      {picked !== null && (
        <Text style={styles.feedback}>
          {scenario.options[picked].feedback}
          {scenario.options[picked].good && !done ? `  +${scenario.points} pts` : ''}
        </Text>
      )}
    </Card>
  );
}

function QuizItem({
  q,
  index,
  done,
  onComplete,
}: {
  q: QuizQuestion;
  index: number;
  done: boolean;
  onComplete: (points: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correct && !done) onComplete(q.points);
  }

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.qText}>
        {index + 1}. {q.q}
      </Text>
      {q.a.map((opt, i) => {
        const showAnswer = picked !== null;
        const isCorrect = i === q.correct;
        const chosen = picked === i;
        const style = [
          styles.opt,
          showAnswer && isCorrect && styles.optGood,
          showAnswer && chosen && !isCorrect && styles.optBad,
        ];
        return (
          <Pressable key={i} style={style} onPress={() => pick(i)} disabled={showAnswer}>
            <Text style={styles.optText}>{opt}</Text>
          </Pressable>
        );
      })}
      {picked !== null && (
        <Text style={styles.feedback}>
          {picked === q.correct ? `✅ Correct! ${q.why}${done ? '' : `  +${q.points} pts`}` : `❌ ${q.why}`}
        </Text>
      )}
    </View>
  );
}

export default function ArcadeScreen() {
  const { arcade, completeActivity } = useData();
  const points = arcade.points ?? 0;
  const done = arcade.done ?? {};

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenTitle title="Literacy Arcade" subtitle="Learn money habits, earn points" />

        <Card style={styles.hero}>
          <View style={styles.row}>
            <View>
              <Text style={styles.heroLabel}>TakaPoints</Text>
              <Text style={styles.heroBig}>⭐ {points}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.heroLabel}>Daily streak</Text>
              <Text style={styles.heroBig}>🔥 1</Text>
            </View>
          </View>
        </Card>

        {SCENARIOS.map((s) => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            done={!!done[s.id]}
            onComplete={(pts) => completeActivity(s.id, pts)}
          />
        ))}

        <Card>
          <SectionTitle>Daily quiz · 3 questions</SectionTitle>
          {QUIZ.map((q, i) => (
            <QuizItem
              key={q.id}
              q={q}
              index={i}
              done={!!done[q.id]}
              onComplete={(pts) => completeActivity(q.id, pts)}
            />
          ))}
        </Card>

        <Card>
          <SectionTitle>Achievements</SectionTitle>
          <View style={styles.badges}>
            {BADGES.map((b) => {
              const unlocked = points >= b.threshold;
              return (
                <View key={b.label} style={styles.badge}>
                  <View style={[styles.badgeIcon, !unlocked && styles.badgeLocked]}>
                    <Text style={{ fontSize: 22 }}>{b.icon}</Text>
                  </View>
                  <Text style={styles.badgeLabel}>{b.label}</Text>
                  {!unlocked && <Text style={styles.badgeThresh}>{b.threshold} pts</Text>}
                </View>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, marginBottom: 12, marginTop: 4 },
  hero: { backgroundColor: '#7c3aed', borderWidth: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  heroBig: { fontSize: 25, fontWeight: '800', color: '#fff', marginTop: 2 },
  scn: { backgroundColor: '#faf5ff', borderColor: '#ede9fe', borderWidth: 2 },
  scnText: { fontSize: 12.5, color: colors.ink, lineHeight: 19, marginBottom: 4 },
  opt: { borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: '#fff', borderRadius: 11, padding: 12, marginTop: 8 },
  optGood: { borderColor: colors.green, backgroundColor: colors.greenTint },
  optBad: { borderColor: colors.red, backgroundColor: colors.redTint },
  optText: { fontSize: 13, color: colors.ink2, fontWeight: '500' },
  feedback: { fontSize: 12.5, color: colors.body, marginTop: 9, backgroundColor: '#f1f5f9', padding: 11, borderRadius: 10, lineHeight: 19 },
  qText: { fontSize: 13.5, fontWeight: '700', color: colors.ink2, marginBottom: 3 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: 64, alignItems: 'center' },
  badgeIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  badgeLocked: { opacity: 0.4 },
  badgeLabel: { fontSize: 9, color: '#475569', textAlign: 'center' },
  badgeThresh: { fontSize: 8, color: colors.muted },
});
