import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pending } from '../../src/api';
import { CATEGORY_GROUPS } from '../../src/content';
import { useData } from '../../src/data';
import { useLang } from '../../src/i18n';
import { colors } from '../../src/theme';
import { Card, ScreenTitle } from '../../src/ui';

function PendingCard({ item }: { item: Pending }) {
  const { t, catLabel, goalLabel, fmtN, formatDate } = useLang();
  const { goals, categorizePending, savePendingToGoal, dismissPending } = useData();
  const [catKey, setCatKey] = useState(item.suggestedCatKey || 'others');
  const [goalId, setGoalId] = useState(goals[0]?.id ?? '');
  const [busy, setBusy] = useState(false);

  const incoming = item.direction === 'in';

  async function add() {
    if (busy) return;
    setBusy(true);
    try {
      if (incoming) {
        if (!goalId) return;
        await savePendingToGoal(item.id, goalId);
      } else {
        const group = CATEGORY_GROUPS.find((g) => g.key === catKey);
        await categorizePending(item.id, catKey, group?.label ?? item.suggestedCatLabel, item.counterparty);
      }
    } catch (e) {
      Alert.alert(t('common.couldNotSave'), e instanceof Error ? e.message : t('common.tryAgain'));
    } finally {
      setBusy(false);
    }
  }

  async function dismiss() {
    setBusy(true);
    try {
      await dismissPending(item.id);
    } catch (e) {
      Alert.alert(t('common.couldNotSave'), e instanceof Error ? e.message : t('common.tryAgain'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <View style={styles.headRow}>
        <View style={[styles.dirBadge, incoming ? styles.inBadge : styles.outBadge]}>
          <Text style={[styles.dirText, incoming ? styles.inText : styles.outText]}>
            {incoming ? `↓ ${t('notif.received')}` : `↑ ${t('notif.spent')}`}
          </Text>
        </View>
        <Text style={styles.amount}>৳{fmtN(item.amount)}</Text>
      </View>

      <Text style={styles.meta}>
        {item.counterparty ? `${item.counterparty} · ` : ''}
        {t('notif.via', { provider: item.provider })}
        {item.fee > 0 ? ` · ${t('notif.fee', { n: fmtN(item.fee) })}` : ''}
      </Text>
      <Text style={styles.time}>{formatDate(new Date(item.ts))}</Text>
      <Text style={styles.raw} numberOfLines={2}>
        {item.raw}
      </Text>

      {incoming ? (
        goals.length === 0 ? (
          <Text style={styles.hint}>{t('notif.noGoals')}</Text>
        ) : (
          <>
            <Text style={styles.pickLabel}>{t('notif.pickGoal')}</Text>
            <View style={styles.chips}>
              {goals.map((g) => {
                const on = g.id === goalId;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => setGoalId(g.id)}
                    style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                      {g.icon} {goalLabel(g.name)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )
      ) : (
        <>
          <Text style={styles.pickLabel}>{t('notif.pickCategory')}</Text>
          <View style={styles.chips}>
            {CATEGORY_GROUPS.map((g) => {
              const on = g.key === catKey;
              return (
                <Pressable
                  key={g.key}
                  onPress={() => setCatKey(g.key)}
                  style={[styles.chip, on && styles.chipOn]}>
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>
                    {g.icon} {catLabel(g.key, g.label)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.dismissBtn} onPress={dismiss} disabled={busy}>
          <Text style={styles.dismissText}>{t('notif.dismiss')}</Text>
        </Pressable>
        <Pressable
          style={[styles.addBtn, (busy || (incoming && !goalId)) && { opacity: 0.5 }]}
          onPress={add}
          disabled={busy || (incoming && !goalId)}>
          <Text style={styles.addText}>{incoming ? t('notif.saveToGoal') : t('notif.addExpense')}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

export default function NotificationsScreen() {
  const { t } = useLang();
  const { pending, scanForSms, dismissPending } = useData();
  const [busy, setBusy] = useState(false);

  async function scan() {
    setBusy(true);
    try {
      await scanForSms();
    } finally {
      setBusy(false);
    }
  }

  function dismissAll() {
    if (pending.length === 0) return;
    Alert.alert(t('notif.dismissAllTitle'), t('notif.dismissAllMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('notif.dismiss'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await Promise.all(pending.map((p) => dismissPending(p.id)));
          } catch (e) {
            Alert.alert(t('common.couldNotSave'), e instanceof Error ? e.message : t('common.tryAgain'));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenTitle title={t('notif.title')} subtitle={t('notif.subtitle')} />

        <View style={styles.toolbar}>
          <Pressable style={[styles.toolBtn, busy && { opacity: 0.5 }]} onPress={scan} disabled={busy}>
            <Text style={styles.toolText}>{t('notif.scanNow')}</Text>
          </Pressable>
          <Pressable
            style={[styles.toolBtn, styles.clearBtn, (busy || pending.length === 0) && { opacity: 0.5 }]}
            onPress={dismissAll}
            disabled={busy || pending.length === 0}>
            <Text style={[styles.toolText, styles.clearText]}>{t('notif.dismissAll')}</Text>
          </Pressable>
        </View>

        {pending.length === 0 ? (
          <Card>
            <Text style={styles.empty}>{t('notif.empty')}</Text>
            <Text style={styles.hint}>{t('notif.permissionHint')}</Text>
          </Card>
        ) : (
          pending.map((p) => <PendingCard key={p.id} item={p} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 24 },
  toolbar: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  toolBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.teal, borderRadius: 12, paddingVertical: 11, alignItems: 'center', backgroundColor: '#fff' },
  toolText: { fontSize: 12.5, fontWeight: '800', color: colors.teal },
  clearBtn: { backgroundColor: colors.redTint, borderColor: colors.red },
  clearText: { color: colors.red },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dirBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  inBadge: { backgroundColor: colors.greenTint },
  outBadge: { backgroundColor: colors.redTint },
  dirText: { fontSize: 11, fontWeight: '800' },
  inText: { color: colors.green },
  outText: { color: colors.red },
  amount: { fontSize: 22, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 12.5, color: colors.body, fontWeight: '600', marginTop: 8 },
  time: { fontSize: 11, color: colors.muted, marginTop: 2 },
  raw: { fontSize: 11.5, color: colors.muted, marginTop: 8, fontStyle: 'italic', lineHeight: 16 },
  pickLabel: { fontSize: 12.5, fontWeight: '800', color: colors.body, marginTop: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { fontSize: 12, color: colors.ink2, fontWeight: '600' },
  chipTextOn: { color: '#fff', fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dismissBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', backgroundColor: '#fff' },
  dismissText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  addBtn: { flex: 2, backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  addText: { fontSize: 13.5, fontWeight: '800', color: '#fff' },
  empty: { fontSize: 13, color: colors.ink2, fontWeight: '600' },
  hint: { fontSize: 11.5, color: colors.muted, marginTop: 8, lineHeight: 16 },
});
