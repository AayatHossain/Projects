import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Transaction } from '../../src/api';
import { useData } from '../../src/data';
import { useLang } from '../../src/i18n';
import { colors } from '../../src/theme';
import { Card, PressableScale as Pressable } from '../../src/ui';

const PROVIDERS: Record<string, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  upay: 'Upay',
  bank: 'Bank',
};

function meta(tx: Transaction) {
  if (tx.type === 'income') return { sign: '+', color: colors.green, icon: '💰' };
  if (tx.type === 'saving') return { sign: '', color: colors.teal, icon: '🎯' };
  return { sign: '−', color: colors.red, icon: tx.type === 'sent' ? '📤' : '🧾' };
}

export default function TransactionsScreen() {
  const router = useRouter();
  const { t, fmtN, formatDate } = useLang();
  const { transactions, refresh } = useData();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, []),
  );

  function title(tx: Transaction) {
    if (tx.type === 'income') {
      return tx.label && tx.label !== 'Received' ? `${t('txn.received')} · ${tx.label}` : t('txn.received');
    }
    if (tx.type === 'sent') return tx.label ? `${t('txn.sent')} · ${tx.label}` : t('txn.sent');
    if (tx.type === 'saving') return t('txn.savedTo', { g: tx.goalName || tx.label });
    return tx.label || tx.catLabel || t('txn.spent');
  }

  function sub(tx: Transaction) {
    const parts: string[] = [];
    const p = PROVIDERS[tx.provider];
    if (p) parts.push(t('txn.via', { p }));
    else if (tx.source === 'manual') parts.push(t('txn.manual'));
    if (tx.type === 'expense' && tx.catLabel) parts.push(tx.catLabel);
    if (tx.type === 'income' && tx.goalName) parts.push(`→ ${tx.goalName}`);
    return parts.join(' · ');
  }

  function dayLabel(ts: number) {
    const d = new Date(ts);
    const now = new Date();
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
    if (diff === 0) return t('txn.today');
    if (diff === 1) return t('txn.yesterday');
    return formatDate(d);
  }

  const groups: { label: string; items: Transaction[] }[] = [];
  for (const tx of transactions) {
    const label = dayLabel(tx.ts);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(tx);
    else groups.push({ label, items: [tx] });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('txn.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {transactions.length === 0 ? (
          <Card>
            <Text style={styles.empty}>{t('txn.empty')}</Text>
          </Card>
        ) : (
          groups.map((g) => (
            <View key={g.label} style={styles.group}>
              <Text style={styles.dayLabel}>{g.label}</Text>
              <Card style={styles.dayCard}>
                {g.items.map((tx, i) => {
                  const m = meta(tx);
                  return (
                    <View key={tx.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                      <View style={styles.iconWrap}>
                        <Text style={styles.icon}>{m.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {title(tx)}
                        </Text>
                        {sub(tx) ? (
                          <Text style={styles.rowSub} numberOfLines={1}>
                            {sub(tx)}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={[styles.amount, { color: m.color }]}>
                        {m.sign}৳{fmtN(tx.amount)}
                      </Text>
                    </View>
                  );
                })}
              </Card>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  scroll: { padding: 14, paddingTop: 16, paddingBottom: 28 },
  group: { marginBottom: 6 },
  dayLabel: { fontSize: 12.5, fontWeight: '800', color: colors.muted, marginBottom: 7, marginLeft: 4 },
  dayCard: { padding: 4, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  iconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.ink2 },
  rowSub: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 15.5, fontWeight: '800' },
  empty: { fontSize: 13, color: colors.muted },
});
