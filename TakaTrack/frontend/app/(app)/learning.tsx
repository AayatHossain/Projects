import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COURSES } from '../../src/courses';
import { useData } from '../../src/data';
import { colors } from '../../src/theme';
import { Bar, Card, ScreenTitle } from '../../src/ui';

const lecId = (course: string, i: number) => `lec:${course}:${i}`;
const quizId = (course: string, i: number) => `quiz:${course}:${i}`;

export default function LearningScreen() {
  const router = useRouter();
  const { arcade, completeActivity } = useData();
  const done = arcade.done ?? {};
  const points = arcade.points ?? 0;

  const [openCourse, setOpenCourse] = useState<string | null>(COURSES[0]?.key ?? null);
  const [openLecture, setOpenLecture] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenTitle title="Learning" subtitle="Money courses & quizzes" />

        <Card style={styles.hero}>
          <View style={styles.row}>
            <View>
              <Text style={styles.heroLabel}>TakaPoints earned</Text>
              <Text style={styles.heroBig}>⭐ {points}</Text>
            </View>
            <Ionicons name="school" size={40} color="rgba(255,255,255,0.85)" />
          </View>
        </Card>

        {COURSES.map((course) => {
          const total = course.lectures.length;
          const completed = course.lectures.filter((_, i) => done[lecId(course.key, i)]).length;
          const pct = total > 0 ? completed / total : 0;
          const expanded = openCourse === course.key;

          return (
            <Card key={course.key} style={styles.courseCard}>
              <Pressable
                style={styles.courseHead}
                onPress={() => setOpenCourse(expanded ? null : course.key)}>
                <View style={styles.courseIcon}>
                  <Ionicons name={course.icon as never} size={22} color={colors.violet} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseBlurb}>{course.blurb}</Text>
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </Pressable>

              <View style={styles.progressRow}>
                <View style={styles.flex}>
                  <Bar pct={pct} color={colors.violet} />
                </View>
                <Text style={styles.progressText}>
                  {completed}/{total}
                </Text>
              </View>

              {expanded &&
                course.lectures.map((lec, i) => {
                  const isDone = !!done[lecId(course.key, i)];
                  const quizDone = !!done[quizId(course.key, i)];
                  const lecKey = `${course.key}:${i}`;
                  const lecOpen = openLecture === lecKey;

                  return (
                    <View key={i} style={styles.lecture}>
                      <Pressable
                        style={styles.lectureHead}
                        onPress={() => setOpenLecture(lecOpen ? null : lecKey)}>
                        <Ionicons
                          name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                          size={20}
                          color={isDone ? colors.green : colors.faint}
                        />
                        <Text style={[styles.lectureTitle, isDone && styles.lectureTitleDone]}>
                          Lecture {i + 1}: {lec.title}
                        </Text>
                        <Ionicons name={lecOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
                      </Pressable>

                      {lecOpen && (
                        <View style={styles.lectureBody}>
                          {lec.body.map((para, j) => (
                            <View key={j} style={styles.bulletRow}>
                              <Text style={styles.bulletDot}>•</Text>
                              <Text style={styles.bulletText}>{para}</Text>
                            </View>
                          ))}

                          <View style={styles.actions}>
                            {isDone ? (
                              <View style={[styles.actionBtn, styles.completedBtn]}>
                                <Ionicons name="checkmark" size={15} color={colors.green} />
                                <Text style={styles.completedText}>Completed</Text>
                              </View>
                            ) : (
                              <Pressable
                                style={[styles.actionBtn, styles.completeBtn]}
                                onPress={() => completeActivity(lecId(course.key, i), 5)}>
                                <Text style={styles.completeText}>Mark as complete</Text>
                              </Pressable>
                            )}

                            <Pressable
                              style={[styles.actionBtn, styles.quizBtn, !isDone && styles.quizBtnOff]}
                              disabled={!isDone}
                              onPress={() =>
                                router.push({
                                  pathname: '/quiz',
                                  params: { course: course.key, lecture: String(i) },
                                })
                              }>
                              <Ionicons name="help-circle" size={15} color="#fff" />
                              <Text style={styles.quizText}>{quizDone ? 'Retake quiz' : 'Take quiz'}</Text>
                              {quizDone && <Ionicons name="checkmark-circle" size={14} color="#fff" />}
                            </Pressable>
                          </View>
                          {!isDone && (
                            <Text style={styles.lockHint}>Mark the lecture complete to unlock its quiz.</Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
            </Card>
          );
        })}

        <Text style={styles.footnote}>More courses coming soon.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 24 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  hero: { backgroundColor: colors.violet, borderWidth: 0 },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  heroBig: { fontSize: 25, fontWeight: '800', color: '#fff', marginTop: 2 },

  courseCard: { paddingBottom: 6 },
  courseHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  courseIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.violetTint, alignItems: 'center', justifyContent: 'center' },
  courseTitle: { fontSize: 15.5, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  courseBlurb: { fontSize: 11.5, color: colors.muted, marginTop: 2, lineHeight: 15 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  progressText: { fontSize: 12, fontWeight: '800', color: colors.violet },

  lecture: { borderTopWidth: 1, borderTopColor: colors.lineStrong, marginTop: 10, paddingTop: 10 },
  lectureHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  lectureTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.ink2, lineHeight: 18 },
  lectureTitleDone: { color: colors.muted },
  lectureBody: { marginTop: 10, paddingLeft: 4 },
  bulletRow: { flexDirection: 'row', gap: 7, marginBottom: 7 },
  bulletDot: { fontSize: 13, color: colors.violet, fontWeight: '800', lineHeight: 19 },
  bulletText: { flex: 1, fontSize: 12.5, color: colors.body, lineHeight: 19 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, flex: 1 },
  completeBtn: { borderWidth: 1, borderColor: colors.violet, backgroundColor: '#fff' },
  completeText: { fontSize: 12.5, fontWeight: '700', color: colors.violet },
  completedBtn: { backgroundColor: colors.greenTint, borderWidth: 1, borderColor: '#bbf7d0' },
  completedText: { fontSize: 12.5, fontWeight: '700', color: colors.green },
  quizBtn: { backgroundColor: colors.violet },
  quizBtnOff: { backgroundColor: colors.lineStrong },
  quizText: { fontSize: 12.5, fontWeight: '800', color: '#fff' },
  lockHint: { fontSize: 10.5, color: colors.faint, marginTop: 7 },

  footnote: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 6 },
});
