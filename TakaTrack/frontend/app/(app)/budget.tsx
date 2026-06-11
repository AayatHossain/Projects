import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useData } from '../../src/data';
import { colors } from '../../src/theme';
import { Bar, Card, fmt, Ring, ringColor, SectionTitle } from '../../src/ui';

export default function BudgetScreen() {
  const { income, categories, spentForCategory, setIncome } = useData();
  const [value, setValue] = useState(String(income));
  const [busy, setBusy] = useState(false);

  async function save() {
    const v = parseFloat(value);
    if (!v || v <= 0) {
      Alert.alert('Enter income', 'Type your monthly income.');
      return;
    }
    setBusy(true);
    try {
      await setIncome(v);
      Alert.alert('Saved', 'Monthly income updated.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Budget Core</Text>

        <Card>
          <SectionTitle>Monthly income</SectionTitle>
          <View style={styles.incomeRow}>
            <Text style={styles.taka}>৳</Text>
            <TextInput
              style={styles.incomeInput}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              placeholder="30000"
              placeholderTextColor={colors.muted}
            />
            <Pressable style={[styles.setBtn, busy && { opacity: 0.6 }]} onPress={save} disabled={busy}>
              <Text style={styles.setBtnText}>Set</Text>
            </Pressable>
          </View>
          <View style={styles.legend}>
            <Legend color={colors.green} label="Safe" />
            <Legend color="#f59e0b" label="Approaching" />
            <Legend color={colors.red} label="Overspent" />
          </View>
        </Card>

        <Card>
          <SectionTitle>Envelopes — allocated vs spent</SectionTitle>
          {categories.map((c) => {
            const spent = spentForCategory(c.key);
            const pct = c.alloc > 0 ? spent / c.alloc : 0;
            return (
              <View key={c.key} style={styles.env}>
                <Ring size={56} stroke={7} pct={pct} color={ringColor(pct)} label={`${Math.round(pct * 100)}%`} />
                <View style={styles.envMeta}>
                  <View style={styles.row}>
                    <Text style={styles.envName}>
                      {c.icon} {c.label}
                    </Text>
                    <Text style={styles.muted}>
                      ৳{fmt(spent)} / {fmt(c.alloc)}
                    </Text>
                  </View>
                  <Bar pct={pct} color={ringColor(pct)} />
                </View>
              </View>
            );
          })}
          <Text style={styles.hint}>
            Allocations come from your defaults; logging an expense fills the matching envelope.
          </Text>
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
  env: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  envMeta: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  envName: { fontSize: 13, fontWeight: '800', color: colors.ink },
  muted: { fontSize: 12, color: colors.muted },
  hint: { fontSize: 10, color: colors.muted, marginTop: 10 },
});
