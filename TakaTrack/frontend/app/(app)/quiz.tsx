import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { coursesFor } from '../../src/coursesBn';
import { useData } from '../../src/data';
import { useLang } from '../../src/i18n';
import { colors } from '../../src/theme';
import { Card } from '../../src/ui';

export default function QuizScreen() {
  const router = useRouter();
  const { language, t, fmtN } = useLang();
  const params = useLocalSearchParams<{ course: string; lecture: string }>();
  const { completeActivity } = useData();

  const course = coursesFor(language).find((c) => c.key === params.course);
  const lectureIndex = parseInt(params.lecture ?? '0', 10);
  const lecture = course?.lectures[lectureIndex];

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!course || !lecture) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title={t('learning.title')} onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.muted}>{t('quiz.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const quiz = lecture.quiz;
  const total = quiz.length;
  const question = quiz[index];

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === question.correct) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      // Finish: record completion + award 2 points per correct answer.
      completeActivity(`quiz:${course!.key}:${lectureIndex}`, score * 2);
      setFinished(true);
    }
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const passed = score >= Math.ceil(total * 0.6);
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title={course.title} onBack={() => router.back()} />
        <View style={styles.center}>
          <View style={[styles.resultIcon, { backgroundColor: passed ? colors.greenTint : colors.amberTint }]}>
            <Ionicons name={passed ? 'trophy' : 'refresh'} size={40} color={passed ? colors.green : colors.amber} />
          </View>
          <Text style={styles.resultScore}>
            {fmtN(score)} / {fmtN(total)}
          </Text>
          <Text style={styles.resultMsg}>
            {passed ? t('quiz.passMsg', { n: fmtN(score * 2) }) : t('quiz.failMsg')}
          </Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>{t('quiz.backToCourse')}</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={restart}>
            <Text style={styles.secondaryBtnText}>{t('quiz.retake')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title={t('quiz.lectureQuiz', { n: fmtN(lectureIndex + 1) })} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((index + (picked !== null ? 1 : 0)) / total) * 100}%` }]} />
        </View>
        <Text style={styles.counter}>
          {t('quiz.questionOf', { a: fmtN(index + 1), b: fmtN(total) })}
        </Text>

        <Card>
          <Text style={styles.question}>{question.q}</Text>
          {question.options.map((opt, i) => {
            const reveal = picked !== null;
            const isCorrect = i === question.correct;
            const chosen = picked === i;
            return (
              <Pressable
                key={i}
                style={[
                  styles.option,
                  reveal && isCorrect && styles.optionGood,
                  reveal && chosen && !isCorrect && styles.optionBad,
                ]}
                onPress={() => pick(i)}
                disabled={reveal}>
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            );
          })}

          {picked !== null && (
            <Text style={styles.feedback}>
              {picked === question.correct ? t('quiz.correctPrefix') : t('quiz.wrongPrefix')}
              {question.why}
            </Text>
          )}
        </Card>

        {picked !== null && (
          <Pressable style={styles.primaryBtn} onPress={next}>
            <Text style={styles.primaryBtnText}>{index + 1 < total ? t('quiz.next') : t('quiz.seeResult')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
        <Ionicons name="close" size={24} color={colors.ink} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lineStrong,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, flex: 1, textAlign: 'center' },

  scroll: { padding: 14, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  muted: { fontSize: 13, color: colors.muted },

  progressTrack: { height: 8, borderRadius: 999, backgroundColor: colors.lineStrong, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.violet, borderRadius: 999 },
  counter: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 8, marginBottom: 8 },

  question: { fontSize: 15.5, fontWeight: '800', color: colors.ink, marginBottom: 6, lineHeight: 22 },
  option: { borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: '#fff', borderRadius: 12, padding: 13, marginTop: 9 },
  optionGood: { borderColor: colors.green, backgroundColor: colors.greenTint },
  optionBad: { borderColor: colors.red, backgroundColor: colors.redTint },
  optionText: { fontSize: 13.5, color: colors.ink2, fontWeight: '500' },
  feedback: { fontSize: 12.5, color: colors.body, marginTop: 11, backgroundColor: '#f1f5f9', padding: 11, borderRadius: 10, lineHeight: 19 },

  primaryBtn: { backgroundColor: colors.violet, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  secondaryBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  secondaryBtnText: { color: colors.violet, fontWeight: '700', fontSize: 13 },

  resultIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  resultScore: { fontSize: 34, fontWeight: '800', color: colors.ink },
  resultMsg: { fontSize: 13.5, color: colors.body, textAlign: 'center', marginBottom: 8, lineHeight: 20 },
});
