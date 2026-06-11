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

const ICONS = ['🎯', '🛍️', '🛡️', '🏠', '📱', '🚗', '🎓', '💍', '🕋', '✈️', '🏢', '🏡'];

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
      <Pressable style={styles.closeBtn} onPress={onDelete} hitSlop={8}>
        <Text style={styles.closeText}>×</Text>
      </Pressable>

      <View style={styles.row}>
        <Text style={styles.goalName}>
          {goal.icon} {goal.name}
        </Text>
        <Text style={[styles.muted, { marginRight: 22 }]}>{Math.round(pct * 100)}%</Text>
      </View>
      <Bar pct={pct} />
      <Text style={[styles.muted, { marginTop: 7 }]}>
        ৳{fmt(goal.saved)} / {fmt(goal.target)} · {days > 0 ? `~${days} days left` : '🎉 reached!'}
      </Text>

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

  // create-goal form (used by both custom entry and templates)
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [busy, setBusy] = useState(false);

  function confirmDelete(g: Goal) {
    Alert.alert('Delete goal?', g.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(g.id) },
    ]);
  }

  function prefill(t: (typeof GOAL_TEMPLATES)[number]) {
    setName(t.name);
    setTarget(String(t.target));
    setIcon(t.icon);
  }

  async function create() {
    const goalName = name.trim();
    const amt = parseFloat(target);
    if (!goalName) {
      Alert.alert('Name needed', 'Give your goal a name.');
      return;
    }
    if (!amt || amt <= 0) {
      Alert.alert('Amount needed', 'Enter how much you need to save.');
      return;
    }
    if (goals.find((g) => g.name.toLowerCase() === goalName.toLowerCase())) {
      Alert.alert('Already exists', `You already have a goal called "${goalName}".`);
      return;
    }
    setBusy(true);
    try {
      await addGoal({ name: goalName, icon, target: amt });
      setName('');
      setTarget('');
      setIcon('🎯');
    } catch (e) {
      Alert.alert('Could not add goal', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Goals</Text>

        {goals.length === 0 ? (
          <Card>
            <Text style={styles.muted}>No goals yet — create one below.</Text>
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

        {/* Create a goal */}
        <Card>
          <SectionTitle>Create a goal</SectionTitle>

          <Text style={styles.fieldLabel}>Start from a template (tap, then set your amount)</Text>
          <View style={styles.tmpl}>
            {GOAL_TEMPLATES.map((t) => (
              <Pressable key={t.name} style={styles.tmplBtn} onPress={() => prefill(t)}>
                <Text style={styles.tmplIcon}>{t.icon}</Text>
                <Text style={styles.tmplName}>{t.name}</Text>
                <Text style={styles.muted}>suggested ৳{fmt(t.target)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconRow}>
            {ICONS.map((em) => (
              <Pressable
                key={em}
                style={[styles.iconChip, icon === em && styles.iconChipOn]}
                onPress={() => setIcon(em)}>
                <Text style={{ fontSize: 20 }}>{em}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Goal name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder='e.g. "New laptop"'
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.fieldLabel}>Target amount</Text>
          <View style={styles.targetRow}>
            <Text style={styles.taka}>৳</Text>
            <TextInput
              style={[styles.input, styles.flex, { marginTop: 0 }]}
              value={target}
              onChangeText={setTarget}
              keyboardType="numeric"
              placeholder="amount you need"
              placeholderTextColor={colors.muted}
            />
          </View>

          <Pressable style={[styles.addBtn, busy && { opacity: 0.6 }]} onPress={create} disabled={busy}>
            <Text style={styles.addBtnText}>+ Add goal</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 24 },
  flex: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, marginBottom: 12, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalName: { fontSize: 15, fontWeight: '800', color: colors.ink, flex: 1 },
  muted: { fontSize: 12, color: colors.muted },
  closeBtn: { position: 'absolute', top: 8, right: 10, zIndex: 2, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 22, color: colors.muted, fontWeight: '700', lineHeight: 24 },
  depositRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  taka: { fontSize: 16, fontWeight: '800', color: colors.ink },
  depInput: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.ink },
  depBtn: { backgroundColor: colors.teal, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  depBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 4 },
  tmpl: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tmplBtn: { width: '47.5%', borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', borderRadius: 12, padding: 10 },
  tmplIcon: { fontSize: 18, marginBottom: 2 },
  tmplName: { fontSize: 12, fontWeight: '700', color: colors.ink },
  iconRow: { flexDirection: 'row', marginBottom: 6 },
  iconChip: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginRight: 7, backgroundColor: '#fff' },
  iconChipOn: { borderColor: colors.teal, backgroundColor: '#ecfdf5' },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink, backgroundColor: '#fff', marginTop: 2 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
