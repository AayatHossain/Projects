import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/auth';
import { useData } from '../../src/data';
import { colors } from '../../src/theme';
import { Bar, Card, fmt, Ring, ringColor, SectionTitle } from '../../src/ui';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { loading, income, categories, goals, arcade, spentForCategory, totalSpent, refresh } =
    useData();
  const [refreshing, setRefreshing] = useState(false);

  const spent = totalSpent();
  const pct = income > 0 ? spent / income : 0;

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name?.[0] ?? 'U').toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.hello}>Welcome back</Text>
              <Text style={styles.name}>{user?.name ?? 'there'}</Text>
            </View>
          </View>
          <Pressable style={styles.logout} onPress={logout}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        {/* Hero */}
        <Card style={styles.hero}>
          <View style={styles.row}>
            <View>
              <Text style={styles.heroLabel}>Spent this month</Text>
              <Text style={styles.heroBig}>
                ৳{fmt(spent)} <Text style={styles.heroSub}>/ {fmt(income)}</Text>
              </Text>
            </View>
            <Ring
              size={84}
              stroke={9}
              pct={pct}
              color="#fff"
              trackColor="rgba(255,255,255,0.3)"
              labelColor="#fff"
              label={`${Math.round(pct * 100)}%`}
            />
          </View>
          <View style={styles.heroBar}>
            <View style={{ width: `${Math.min(pct, 1) * 100}%`, height: '100%', backgroundColor: '#fff', borderRadius: 999 }} />
          </View>
          <View style={[styles.row, { marginTop: 10 }]}>
            <Text style={styles.pill}>⭐ {arcade.points} TakaPoints</Text>
            <Text style={styles.pill}>📂 {categories.length} categories</Text>
          </View>
        </Card>

        {/* AI insight (placeholder) */}
        <Card style={styles.ai}>
          <Text style={styles.aiTag}>AI INSIGHT · placeholder</Text>
          <Text style={styles.aiText}>
            You&apos;re spending a bit fast on Lifestyle this week. A small ৳40/day trim keeps you on
            track and funds your Eid goal early.{' '}
            <Text style={{ fontStyle: 'italic' }}>(AI-generated message — wired up later.)</Text>
          </Text>
        </Card>

        {/* Expense progress by category */}
        <Card>
          <SectionTitle>Expense progress (by category)</SectionTitle>
          {categories.map((c) => {
            const s = spentForCategory(c.key);
            const p = c.alloc > 0 ? s / c.alloc : 0;
            return (
              <View key={c.key} style={{ marginBottom: 9 }}>
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>
                    {c.icon} {c.label}
                  </Text>
                  <Text style={styles.lineMuted}>
                    ৳{fmt(s)} / {fmt(c.alloc)}
                  </Text>
                </View>
                <Bar pct={p} color={ringColor(p)} />
              </View>
            );
          })}
        </Card>

        {/* Savings progress */}
        <Card>
          <SectionTitle>Savings progress (goals)</SectionTitle>
          {goals.length === 0 ? (
            <Text style={styles.lineMuted}>No goals yet — add one in the Goals tab.</Text>
          ) : (
            goals.map((g) => {
              const p = g.target > 0 ? g.saved / g.target : 0;
              return (
                <View key={g.id} style={{ marginBottom: 9 }}>
                  <View style={styles.lineRow}>
                    <Text style={styles.lineLabel}>
                      {g.icon} {g.name}
                    </Text>
                    <Text style={styles.lineMuted}>
                      ৳{fmt(g.saved)} / {fmt(g.target)}
                    </Text>
                  </View>
                  <Bar pct={p} />
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 6 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.tealTint, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  avatarText: { color: colors.tealDeep, fontWeight: '800', fontSize: 19 },
  hello: { fontSize: 13, color: colors.muted },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  logout: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#000', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 8 },
  logoutText: { color: colors.red, fontWeight: '700', fontSize: 12 },
  hero: { backgroundColor: colors.teal, borderWidth: 0 },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  heroBig: { fontSize: 25, fontWeight: '800', color: '#fff', marginTop: 2 },
  heroSub: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  heroBar: { height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { color: '#fff', fontSize: 11, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  ai: { backgroundColor: colors.violetTint, borderLeftWidth: 5, borderLeftColor: colors.violet, borderColor: '#ece5fb' },
  aiTag: { fontSize: 10, fontWeight: '800', color: colors.violet, marginBottom: 6, letterSpacing: 0.5 },
  aiText: { fontSize: 13, color: '#3b0764', lineHeight: 20 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineLabel: { fontSize: 13, color: colors.ink2, fontWeight: '600' },
  lineMuted: { fontSize: 12.5, color: colors.muted, fontWeight: '600' },
});
