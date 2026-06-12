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
import { Bar, Card, fmt, ScreenTitle } from '../../src/ui';

const ICONS = ['🎯', '🛍️', '🛡️', '🏠', '📱', '🚗', '🎓', '💍', '🕋', '✈️', '🏢', '🏡'];

function GoalCard({
  goal,
  onDeposit,
  onSave,
  onDelete,
}: {
  goal: Goal;
  onDeposit: (amount: number) => Promise<void>;
  onSave: (patch: { saved: number; target: number; perDay: number }) => Promise<void>;
  onDelete: () => void;
}) {
  const [amount, setAmount] = useState('500');
  const [busy, setBusy] = useState(false);

  // edit mode
  const [editing, setEditing] = useState(false);
  const [savedDraft, setSavedDraft] = useState('');
  const [targetDraft, setTargetDraft] = useState('');
  const [daysDraft, setDaysDraft] = useState('');

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

  function startEdit() {
    setSavedDraft(String(goal.saved));
    setTargetDraft(String(goal.target));
    // Show the goal's full timeline (target ÷ daily rate), not just the days left.
    setDaysDraft(String(Math.max(1, Math.round(goal.target / goal.perDay))));
    setEditing(true);
  }

  async function saveEdit() {
    const s = parseFloat(savedDraft);
    const t = parseFloat(targetDraft);
    const d = parseFloat(daysDraft);
    if (isNaN(s) || s < 0) return Alert.alert('Check deposited', 'Enter a valid saved amount.');
    if (!t || t <= 0) return Alert.alert('Check target', 'Enter a target greater than 0.');
    if (!d || d <= 0) return Alert.alert('Check days', 'Enter target days greater than 0.');
    const perDay = Math.max(1, Math.round(t / d));
    setBusy(true);
    try {
      await onSave({ saved: s, target: t, perDay });
      setEditing(false);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
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
        {!editing && (
          <Pressable onPress={startEdit} style={styles.editBtn} hitSlop={6}>
            <Text style={styles.editText}>✎ Edit</Text>
          </Pressable>
        )}
      </View>
      <Bar pct={pct} />
      <Text style={[styles.muted, { marginTop: 7 }]}>
        ৳{fmt(goal.saved)} / {fmt(goal.target)} · {Math.round(pct * 100)}% ·{' '}
        {days > 0 ? `~${days} days left` : '🎉 reached!'}
      </Text>

      {editing ? (
        <View style={styles.editBox}>
          <EditField label="Deposited (৳)" value={savedDraft} onChange={setSavedDraft} />
          <EditField label="Target amount (৳)" value={targetDraft} onChange={setTargetDraft} />
          <EditField label="Target days" value={daysDraft} onChange={setDaysDraft} />
          <Text style={styles.hint}>Daily target updates to ৳{fmt(perDayPreview(targetDraft, daysDraft))}/day.</Text>
          <View style={styles.editActions}>
            <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={saveEdit} style={[styles.saveBtn, busy && { opacity: 0.6 }]} disabled={busy}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      ) : (
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
      )}
    </Card>
  );
}

function perDayPreview(target: string, days: string): number {
  const t = parseFloat(target);
  const d = parseFloat(days);
  if (!t || !d || d <= 0) return 0;
  return Math.max(1, Math.round(t / d));
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (t: string) => void }) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        style={styles.editInput}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

export default function GoalsScreen() {
  const { goals, deposit, addGoal, updateGoal, deleteGoal } = useData();

  // create-goal form (used by both custom entry and templates)
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [days, setDays] = useState('90');
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
    const numDays = parseFloat(days);
    if (!goalName) {
      Alert.alert('Name needed', 'Give your goal a name.');
      return;
    }
    if (!amt || amt <= 0) {
      Alert.alert('Amount needed', 'Enter how much you need to save.');
      return;
    }
    if (!numDays || numDays <= 0) {
      Alert.alert('Days needed', 'Enter how many days you want to reach it in.');
      return;
    }
    if (goals.find((g) => g.name.toLowerCase() === goalName.toLowerCase())) {
      Alert.alert('Already exists', `You already have a goal called "${goalName}".`);
      return;
    }
    const perDay = Math.max(1, Math.round(amt / numDays));
    setBusy(true);
    try {
      await addGoal({ name: goalName, icon, target: amt, perDay });
      setName('');
      setTarget('');
      setDays('90');
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
        <ScreenTitle title="My Goals" subtitle="Save toward what matters" />

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
              onSave={(patch) => updateGoal(g.id, patch)}
              onDelete={() => confirmDelete(g)}
            />
          ))
        )}

        {/* Create a goal */}
        <Card>
          <Text style={styles.createHeading}>Create a goal</Text>
          <Text style={styles.createSub}>Start from a template or create your own goal</Text>
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

          <View style={styles.twoCol}>
            <View style={styles.flex}>
              <Text style={styles.fieldLabel}>Target amount</Text>
              <View style={styles.targetRow}>
                <Text style={styles.taka}>৳</Text>
                <TextInput
                  style={[styles.input, styles.flex, { marginTop: 0 }]}
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="numeric"
                  placeholder="amount"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>
            <View style={styles.daysCol}>
              <Text style={styles.fieldLabel}>Target days</Text>
              <TextInput
                style={[styles.input, { marginTop: 0 }]}
                value={days}
                onChangeText={setDays}
                keyboardType="numeric"
                placeholder="90"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>
          {parseFloat(target) > 0 && parseFloat(days) > 0 && (
            <Text style={styles.perDayNote}>
              That&apos;s ৳{fmt(Math.max(1, Math.round(parseFloat(target) / parseFloat(days))))}/day to reach it on time.
            </Text>
          )}

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
  goalName: { fontSize: 16, fontWeight: '800', color: colors.ink, flex: 1, letterSpacing: -0.2 },
  muted: { fontSize: 12.5, color: colors.muted, fontWeight: '500' },
  closeBtn: { position: 'absolute', top: 8, right: 10, zIndex: 2, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 22, color: colors.muted, fontWeight: '700', lineHeight: 24 },
  editBtn: { backgroundColor: '#eef2f7', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 6, marginRight: 22 },
  editText: { fontSize: 12, fontWeight: '700', color: colors.teal },
  editBox: { marginTop: 12, gap: 10 },
  editField: { gap: 5 },
  editLabel: { fontSize: 12, fontWeight: '700', color: colors.body },
  editInput: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, fontWeight: '700', color: colors.ink, backgroundColor: '#fff' },
  hint: { fontSize: 11.5, color: colors.teal, fontWeight: '600' },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  cancelBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  cancelText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  saveBtn: { flex: 1, backgroundColor: colors.teal, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  saveText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  twoCol: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  daysCol: { width: 110 },
  perDayNote: { fontSize: 12, color: colors.teal, fontWeight: '600', marginTop: 8 },
  depositRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  taka: { fontSize: 16, fontWeight: '800', color: colors.ink },
  depInput: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.ink },
  depBtn: { backgroundColor: colors.teal, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  depBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  createHeading: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  createSub: { fontSize: 13, color: colors.muted, marginTop: 3, marginBottom: 12 },
  fieldLabel: { fontSize: 12.5, fontWeight: '800', color: colors.body, marginBottom: 7, marginTop: 4 },
  tmpl: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tmplBtn: { width: '47.5%', borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: '#fff', borderRadius: 12, padding: 11 },
  tmplIcon: { fontSize: 19, marginBottom: 3 },
  tmplName: { fontSize: 12.5, fontWeight: '700', color: colors.ink2 },
  iconRow: { flexDirection: 'row', marginBottom: 6 },
  iconChip: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginRight: 7, backgroundColor: '#fff' },
  iconChipOn: { borderColor: colors.teal, backgroundColor: '#ecfdf5' },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink, backgroundColor: '#fff', marginTop: 2 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
