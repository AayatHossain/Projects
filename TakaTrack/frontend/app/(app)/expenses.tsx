import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CATEGORY_GROUPS } from '../../src/content';
import { useData } from '../../src/data';
import { colors } from '../../src/theme';
import { Card, fmt, SectionTitle } from '../../src/ui';

type Selected = { catKey: string; catLabel: string; note: string };

export default function ExpensesScreen() {
  const { expenses, logExpense, deleteExpense } = useData();
  const [selected, setSelected] = useState<Selected | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  // session-only custom chips added under Lifestyle & Family
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  function pick(catKey: string, catLabel: string, item: string) {
    setSelected({ catKey, catLabel, note: item });
  }

  function addCustom() {
    const name = customInput.trim();
    if (!name) return;
    setCustomItems((prev) => [...prev, name]);
    setCustomInput('');
    setShowCustom(false);
    pick('lifestyle', 'Lifestyle & Family', name);
  }

  async function onAdd() {
    if (busy) return;
    if (!selected) {
      Alert.alert('Pick a category', 'Tap a category above first.');
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Enter an amount', 'Type how much you spent.');
      return;
    }
    setBusy(true);
    try {
      await logExpense({
        catKey: selected.catKey,
        catLabel: selected.catLabel,
        note: note.trim() || selected.note,
        amt,
      });
      setAmount('');
      setNote('');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete(id: string, label: string) {
    Alert.alert('Delete entry?', label, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Expenses</Text>

          <Card>
            <SectionTitle>Quick log — tap a category</SectionTitle>
            {CATEGORY_GROUPS.map((g) => {
              const items = g.key === 'lifestyle' ? [...g.items, ...customItems] : g.items;
              return (
                <View key={g.key} style={{ marginBottom: 12 }}>
                  <Text style={styles.groupHead}>
                    {g.icon} {g.label}
                  </Text>
                  <View style={styles.chips}>
                    {items.map((item) => {
                      const on = selected?.note === item && selected?.catKey === g.key;
                      return (
                        <Pressable
                          key={item}
                          onPress={() => pick(g.key, g.label, item)}
                          style={[styles.chip, on && styles.chipOn]}>
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>{item}</Text>
                        </Pressable>
                      );
                    })}
                    {g.key === 'lifestyle' && (
                      <Pressable
                        onPress={() => setShowCustom((s) => !s)}
                        style={[styles.chip, styles.chipAdd]}>
                        <Text style={[styles.chipText, { color: colors.teal }]}>+ Custom</Text>
                      </Pressable>
                    )}
                  </View>
                  {g.key === 'lifestyle' && showCustom && (
                    <View style={styles.customRow}>
                      <TextInput
                        style={styles.customInput}
                        value={customInput}
                        onChangeText={setCustomInput}
                        placeholder='e.g. "Biye bari gift"'
                        placeholderTextColor={colors.muted}
                        onSubmitEditing={addCustom}
                      />
                      <Pressable style={styles.smallBtn} onPress={addCustom}>
                        <Text style={styles.smallBtnText}>Add</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}

            <Text style={styles.selNote}>
              {selected ? (
                <>
                  Selected: <Text style={{ fontWeight: '700', color: colors.ink }}>{selected.catLabel}</Text> — {selected.note}
                </>
              ) : (
                'No category selected — tap one above.'
              )}
            </Text>

            <View style={styles.logBar}>
              <TextInput
                style={[styles.input, styles.amtInput]}
                value={amount}
                onChangeText={setAmount}
                placeholder="৳ amount"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.flex]}
                value={note}
                onChangeText={setNote}
                placeholder="note (optional)"
                placeholderTextColor={colors.muted}
              />
              <Pressable style={[styles.addBtn, busy && { opacity: 0.6 }]} onPress={onAdd} disabled={busy}>
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
            </View>
          </Card>

          <Card>
            <SectionTitle>Recent transactions</SectionTitle>
            {expenses.length === 0 ? (
              <Text style={styles.muted}>No transactions yet.</Text>
            ) : (
              expenses.map((x) => (
                <Pressable
                  key={x.id}
                  onLongPress={() => confirmDelete(x.id, `${x.note || x.catLabel} · ৳${fmt(x.amt)}`)}
                  style={styles.entry}>
                  <View>
                    <Text style={styles.entryNote}>{x.note || x.catLabel}</Text>
                    <Text style={styles.entryCat}>{x.catLabel}</Text>
                  </View>
                  <Text style={styles.entryAmt}>৳{fmt(x.amt)}</Text>
                </Pressable>
              ))
            )}
            {expenses.length > 0 && <Text style={styles.hint}>Long-press an entry to delete.</Text>}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { padding: 14, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, marginBottom: 12, marginTop: 4 },
  groupHead: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  chipOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipAdd: { borderStyle: 'dashed', borderColor: colors.teal },
  chipText: { fontSize: 11.5, color: colors.ink },
  chipTextOn: { color: '#fff', fontWeight: '700' },
  customRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  customInput: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: colors.ink },
  smallBtn: { backgroundColor: colors.teal, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  selNote: { fontSize: 11.5, color: colors.muted, marginTop: 10, marginBottom: 6 },
  logBar: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink, backgroundColor: '#fff' },
  amtInput: { width: 96 },
  addBtn: { backgroundColor: colors.teal, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  entry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.line },
  entryNote: { fontSize: 13, color: colors.ink },
  entryCat: { fontSize: 10, color: colors.muted, marginTop: 1 },
  entryAmt: { fontSize: 14, fontWeight: '700', color: colors.ink },
  muted: { fontSize: 12, color: colors.muted },
  hint: { fontSize: 10, color: colors.muted, marginTop: 8 },
});
