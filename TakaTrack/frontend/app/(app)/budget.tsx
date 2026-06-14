import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Category } from '../../src/api';
import { useData } from '../../src/data';
import { useLang } from '../../src/i18n';
import { colors } from '../../src/theme';
import { Bar, Card, Ring, ringColor, ScreenTitle, SectionTitle } from '../../src/ui';

// Default budget template (mirrors the backend seed). Setting an income spreads it
// across the categories using these proportions.
const DEFAULT_ALLOC: Record<string, number> = {
  food: 9000,
  transport: 4000,
  utilities: 11000,
  lifestyle: 4000,
  health: 2000,
  others: 0,
};
const DEFAULT_TOTAL = Object.values(DEFAULT_ALLOC).reduce((s, n) => s + n, 0); // 30000

/** Distribute `income` across categories by the default proportions; total == income. */
function allocateByIncome(categories: Category[], income: number): Category[] {
  const allocs = categories.map((c) =>
    Math.round((income * (DEFAULT_ALLOC[c.key] ?? 0)) / DEFAULT_TOTAL),
  );
  // Absorb rounding into the largest category so allocations sum exactly to income.
  const sum = allocs.reduce((s, n) => s + n, 0);
  const diff = income - sum;
  if (diff !== 0 && allocs.length) {
    let idx = 0;
    allocs.forEach((a, i) => {
      if (a > allocs[idx]) idx = i;
    });
    allocs[idx] = Math.max(0, allocs[idx] + diff);
  }
  return categories.map((c, i) => ({ ...c, alloc: allocs[i] }));
}

export default function BudgetScreen() {
  const { t, catLabel, fmtN } = useLang();
  const { income, categories, spentForCategory, saveBudget, resetBudget } = useData();
  const [value, setValue] = useState(String(income));
  const [busyIncome, setBusyIncome] = useState(false);
  const [busyReset, setBusyReset] = useState(false);

  // allocation edit mode
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busySave, setBusySave] = useState(false);

  const allocTotal = editing
    ? categories.reduce((s, c) => s + (parseFloat(drafts[c.key]) || 0), 0)
    : categories.reduce((s, c) => s + c.alloc, 0);
  const over = allocTotal - income;

  async function saveIncome() {
    const v = parseFloat(value);
    if (!v || v <= 0) {
      Alert.alert(t('budget.enterIncomeTitle'), t('budget.enterIncomeMsg'));
      return;
    }
    setBusyIncome(true);
    try {
      // Setting income auto-distributes it across the categories by default.
      await saveBudget(v, allocateByIncome(categories, v));
      Alert.alert(t('budget.savedTitle'), t('budget.savedMsg'));
    } catch (e) {
      Alert.alert(t('common.couldNotSave'), e instanceof Error ? e.message : t('common.tryAgain'));
    } finally {
      setBusyIncome(false);
    }
  }

  function startEdit() {
    const d: Record<string, string> = {};
    categories.forEach((c) => (d[c.key] = String(c.alloc)));
    setDrafts(d);
    setEditing(true);
  }

  async function saveAllocations() {
    const newCategories = categories.map((c) => ({
      ...c,
      alloc: Math.max(0, parseFloat(drafts[c.key]) || 0),
    }));
    setBusySave(true);
    try {
      await saveBudget(income, newCategories);
      setEditing(false);
    } catch (e) {
      Alert.alert(t('common.couldNotSave'), e instanceof Error ? e.message : t('common.tryAgain'));
    } finally {
      setBusySave(false);
    }
  }

  function confirmReset() {
    Alert.alert(t('budget.resetTitle'), t('budget.resetMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('budget.reset'),
        style: 'destructive',
        onPress: async () => {
          setBusyReset(true);
          try {
            await resetBudget();
            setEditing(false);
          } catch (e) {
            Alert.alert(t('common.couldNotSave'), e instanceof Error ? e.message : t('common.tryAgain'));
          } finally {
            setBusyReset(false);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ScreenTitle title={t('budget.title')} subtitle={t('budget.subtitle')} />

        <Card>
          <SectionTitle>{t('budget.monthlyIncome')}</SectionTitle>
          <View style={styles.incomeRow}>
            <Text style={styles.taka}>৳</Text>
            <TextInput
              style={styles.incomeInput}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              placeholder={t('budget.incomePlaceholder')}
              placeholderTextColor={colors.muted}
            />
            <Pressable style={[styles.setBtn, busyIncome && { opacity: 0.6 }]} onPress={saveIncome} disabled={busyIncome}>
              <Text style={styles.setBtnText}>{t('budget.set')}</Text>
            </Pressable>
          </View>
          <View style={styles.legend}>
            <Legend color={colors.green} label={t('budget.legendSafe')} />
            <Legend color="#f59e0b" label={t('budget.legendApproaching')} />
            <Legend color={colors.red} label={t('budget.legendOverspent')} />
          </View>
        </Card>

        {/* Allocation summary + warning */}
        <Card style={over > 0 ? styles.warnCard : undefined}>
          <View style={styles.row}>
            <Text style={styles.summaryLabel}>{t('budget.totalAllocated')}</Text>
            <Text style={[styles.summaryVal, over > 0 && { color: colors.red }]}>
              ৳{fmtN(allocTotal)} / {fmtN(income)}
            </Text>
          </View>
          {over > 0 ? (
            <Text style={styles.warnText}>{t('budget.overBy', { n: fmtN(over) })}</Text>
          ) : (
            <Text style={styles.okText}>{t('budget.unallocated', { n: fmtN(income - allocTotal) })}</Text>
          )}
          <Pressable
            style={[styles.resetBtn, busyReset && { opacity: 0.6 }]}
            onPress={confirmReset}
            disabled={busyReset}>
            <Text style={styles.resetText}>↺ {t('budget.reset')}</Text>
          </Pressable>
        </Card>

        <Card>
          <View style={[styles.row, { marginBottom: 10 }]}>
            <Text style={styles.cardTitle}>{t('budget.catVsSpent')}</Text>
            {editing ? (
              <View style={styles.editActions}>
                <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable onPress={saveAllocations} style={[styles.saveBtn, busySave && { opacity: 0.6 }]} disabled={busySave}>
                  <Text style={styles.saveText}>{t('common.save')}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={startEdit} style={styles.editBtn}>
                <Text style={styles.editText}>{t('goals.edit')}</Text>
              </Pressable>
            )}
          </View>

          {categories.map((c) => {
            const spent = spentForCategory(c.key);
            if (editing) {
              return (
                <View key={c.key} style={styles.editRow}>
                  <Text style={styles.editName}>
                    {c.icon} {catLabel(c.key, c.label)}
                  </Text>
                  <View style={styles.allocInputWrap}>
                    <Text style={styles.takaSmall}>৳</Text>
                    <TextInput
                      style={styles.allocInput}
                      value={drafts[c.key]}
                      onChangeText={(txt) => setDrafts((p) => ({ ...p, [c.key]: txt }))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>
              );
            }
            const pct = c.alloc > 0 ? spent / c.alloc : 0;
            return (
              <View key={c.key} style={styles.env}>
                <Ring size={56} stroke={7} pct={pct} color={ringColor(pct)} label={`${fmtN(pct * 100)}%`} />
                <View style={styles.envMeta}>
                  <View style={styles.row}>
                    <Text style={styles.envName}>
                      {c.icon} {catLabel(c.key, c.label)}
                    </Text>
                    <Text style={styles.muted}>
                      ৳{fmtN(spent)} / {fmtN(c.alloc)}
                    </Text>
                  </View>
                  <Bar pct={pct} color={ringColor(pct)} />
                </View>
              </View>
            );
          })}

          {editing ? (
            <Text style={styles.hint}>{t('budget.editHintEditing')}</Text>
          ) : (
            <Text style={styles.hint}>{t('budget.editHintDefault')}</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, marginBottom: 12, marginTop: 4 },
  incomeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taka: { fontSize: 18, fontWeight: '800', color: colors.ink },
  incomeInput: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontWeight: '700', color: colors.ink },
  setBtn: { backgroundColor: '#eef2f7', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11 },
  setBtnText: { color: '#334155', fontWeight: '800', fontSize: 13 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 3, marginRight: 5 },
  legendText: { fontSize: 10, color: colors.muted },

  warnCard: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  summaryLabel: { fontSize: 14, fontWeight: '800', color: colors.ink },
  summaryVal: { fontSize: 14, fontWeight: '800', color: colors.ink },
  warnText: { fontSize: 12, color: '#b91c1c', marginTop: 8, lineHeight: 18, fontWeight: '600' },
  okText: { fontSize: 12, color: colors.green, marginTop: 8 },
  resetBtn: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#fca5a5', backgroundColor: colors.redTint },
  resetText: { fontSize: 12.5, fontWeight: '800', color: colors.red },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.ink },
  editBtn: { backgroundColor: '#eef2f7', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 6 },
  editText: { fontSize: 12, fontWeight: '700', color: colors.teal },
  editActions: { flexDirection: 'row', gap: 7 },
  cancelBtn: { borderRadius: 9, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.line },
  cancelText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  saveBtn: { backgroundColor: colors.teal, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 6 },
  saveText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.lineStrong },
  editName: { fontSize: 13.5, fontWeight: '700', color: colors.ink2, flex: 1 },
  allocInputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 10, width: 130 },
  takaSmall: { fontSize: 14, fontWeight: '700', color: colors.muted },
  allocInput: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, fontSize: 14, fontWeight: '700', color: colors.ink },

  env: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.lineStrong },
  envMeta: { flex: 1 },
  envName: { fontSize: 13.5, fontWeight: '800', color: colors.ink2 },
  muted: { fontSize: 12.5, color: colors.muted, fontWeight: '500' },
  hint: { fontSize: 10, color: colors.muted, marginTop: 10 },
});
