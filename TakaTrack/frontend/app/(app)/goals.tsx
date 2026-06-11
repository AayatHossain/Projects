import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Goal } from '../../src/api';
import { GOAL_TEMPLATES } from '../../src/content';
import { useData } from '../../src/data';
import { colors } from '../../src/theme';
import { Bar, Card, fmt, SectionTitle } from '../../src/ui';

function GoalCard({
  goal,
  onDeposit,
  onDelete,
}: {
  goal: Goal;
  onDeposit: (amount: number) => Promise<void>;
  onDelete: () => void;
}) {
  const [amount, setAmount] = useState('500');
  const [busy, setBusy] = useState(false);
  const pct = goal.target > 0 ? goal.saved / goal.target : 0;
  const remaining = goal.target - goal.saved;
  const days = remaining > 0 ? Math.ceil(remaining / goal.perDay) : 0;

  async function deposit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setBusy(true);
    try {
      await onDeposit(amt);
    } catch (e) {
      Alert.alert('Could not deposit', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <Pressable onLongPress={onDelete}>
        <View style={styles.row}>
          <Text style={styles.goalName}>
            {goal.icon} {goal.name}
          </Text>
          <Text style={styles.muted}>{Math.round(pct * 100)}%</Text>
        </View>
        <Bar pct={pct} />
        <Text style={[styles.muted, { marginTop: 7 }]}>
          ৳{fmt(goal.saved)} / {fmt(goal.target)} ·{' '}
          {days > 0 ? `~${days} days left` : '🎉 reached!'}
        </Text>
      </Pressable>
      <View style={styles.depositRow}>
        <Text style={styles.taka}>৳</Text>
        <TextInput
          style={styles.depInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="amount"
          placeholderTextColor={colors.muted}
        />
        <Pressable style={[styles.depBtn, busy && { opacity: 0.6 }]} onPress={deposit} disabled={busy}>
          <Text style={styles.depBtnText}>+ Deposit</Text>
        </Pressable>
      </View>
    </Card>
  );
}

export default function GoalsScreen() {
  const { goals, deposit, addGoal, deleteGoal } = useData();

  function confirmDelete(g: Goal) {
    Alert.alert('Delete goal?', g.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(g.id) },
    ]);
  }

  async function add(t: (typeof GOAL_TEMPLATES)[number]) {
    if (goals.find((g) => g.name === t.name)) {
      Alert.alert('Already added', `${t.name} is already in your goals.`);
      return;
    }
    try {
      await addGoal({ name: t.name, icon: t.icon, target: t.target });
    } catch (e) {
      Alert.alert('Could not add goal', e instanceof Error ? e.message : 'Try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Goals</Text>

        {goals.length === 0 ? (
          <Card>
            <Text style={styles.muted}>No goals yet — add one from a template below.</Text>
          </Card>
        ) : (
          goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onDeposit={(amt) => deposit(g.id, amt)}
              onDelete={() => confirmDelete(g)}
            />
          ))
        )}

        <Card>
          <SectionTitle>Add a goal (templates)</SectionTitle>
          <View style={styles.tmpl}>
            {GOAL_TEMPLATES.map((t) => (
              <Pressable key={t.name} style={styles.tmplBtn} onPress={() => add(t)}>
                <Text style={styles.tmplIcon}>{t.icon}</Text>
                <Text style={styles.tmplName}>{t.name}</Text>
                <Text style={styles.muted}>৳{fmt(t.target)}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Text style={styles.hint}>Long-press a goal card to delete it.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, marginBottom: 12, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalName: { fontSize: 15, fontWeight: '800', color: colors.ink },
  muted: { fontSize: 12, color: colors.muted },
  depositRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  taka: { fontSize: 16, fontWeight: '800', color: colors.ink },
  depInput: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.ink },
  depBtn: { backgroundColor: colors.teal, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  depBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  tmpl: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tmplBtn: { width: '47.5%', borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', borderRadius: 12, padding: 10 },
  tmplIcon: { fontSize: 18, marginBottom: 2 },
  tmplName: { fontSize: 12, fontWeight: '700', color: colors.ink },
  hint: { fontSize: 10, color: colors.muted, marginTop: 4, textAlign: 'center' },
});
