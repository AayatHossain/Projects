import { useCallback, useEffect, useState } from 'react';
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

import { useRouter } from 'expo-router';

import { generateInsight } from '../../src/ai';
import { useAuth } from '../../src/auth';
import { useData } from '../../src/data';
import { useLang } from '../../src/i18n';
import { colors } from '../../src/theme';
import { Bar, Card, Ring, ringColor, SectionTitle } from '../../src/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { language, toggle, t, catLabel, fmtN } = useLang();
  const { user, logout } = useAuth();
  const { loading, income, categories, expenses, goals, arcade, spentForCategory, totalSpent, refresh } =
    useData();
  const [refreshing, setRefreshing] = useState(false);

  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const spent = totalSpent();
  const pct = income > 0 ? spent / income : 0;

  // Ask Gemini for a fresh insight. Passing the current one as `avoid` makes the
  // reload button produce a different angle instead of repeating.
  const newInsight = useCallback(async () => {
    setInsightLoading(true);
    setInsightError(null);
    try {
      const text = await generateInsight(
        { name: user?.name ?? 'User', income, categories, expenses, goals, arcade, spentForCategory, totalSpent },
        insight ? [insight] : [],
        language,
      );
      setInsight(text);
    } catch (e) {
      setInsightError(e instanceof Error ? e.message : t('home.insightError'));
    } finally {
      setInsightLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, income, categories, expenses, goals, arcade, insight, language]);

  // Generate one automatically once the financial data has loaded.
  useEffect(() => {
    if (!loading && !insight && !insightLoading) newInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Re-generate the insight in the new language when the user switches.
  useEffect(() => {
    if (!loading && insight) newInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

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
      <View style={styles.topbar}>
        <Pressable style={styles.headerLeft} onPress={() => router.push('/account')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name?.[0] ?? 'U').toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.hello}>{t('home.welcomeBack')}</Text>
            <Text style={styles.name}>{user?.name ?? t('home.greeting')}</Text>
          </View>
        </Pressable>
        <View style={styles.topbarRight}>
          <View style={styles.langToggle}>
            <Pressable
              onPress={() => language !== 'en' && toggle()}
              style={[styles.langBtn, language === 'en' && styles.langBtnOn]}>
              <Text style={[styles.langText, language === 'en' && styles.langTextOn]}>{t('lang.english')}</Text>
            </Pressable>
            <Pressable
              onPress={() => language !== 'bn' && toggle()}
              style={[styles.langBtn, language === 'bn' && styles.langBtnOn]}>
              <Text style={[styles.langText, language === 'bn' && styles.langTextOn]}>{t('lang.bangla')}</Text>
            </Pressable>
          </View>
          <Pressable style={styles.logout} onPress={logout}>
            <Text style={styles.logoutText}>{t('common.logout')}</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView
        style={styles.bgWrap}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Hero */}
        <Card style={styles.hero}>
          <View style={styles.row}>
            <View>
              <Text style={styles.heroLabel}>{t('home.spentThisMonth')}</Text>
              <Text style={styles.heroBig}>
                ৳{fmtN(spent)} <Text style={styles.heroSub}>/ {fmtN(income)}</Text>
              </Text>
            </View>
            <Ring
              size={84}
              stroke={9}
              pct={pct}
              color="#fff"
              trackColor="rgba(255,255,255,0.3)"
              labelColor="#fff"
              label={`${fmtN(pct * 100)}%`}
            />
          </View>
          <View style={styles.heroBar}>
            <View style={{ width: `${Math.min(pct, 1) * 100}%`, height: '100%', backgroundColor: '#fff', borderRadius: 999 }} />
          </View>
          <View style={[styles.row, { marginTop: 10 }]}>
            <Text style={styles.pill}>⭐ {t('home.takaPoints', { n: fmtN(arcade.points) })}</Text>
            <Text style={styles.pill}>📂 {t('home.categories', { n: fmtN(categories.length) })}</Text>
          </View>
        </Card>

        {/* AI insight (Gemini) */}
        <Card style={styles.ai}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiTag}>{t('home.aiInsight')}</Text>
            <Pressable
              onPress={newInsight}
              disabled={insightLoading}
              hitSlop={8}
              style={[styles.reloadBtn, insightLoading && { opacity: 0.5 }]}>
              {insightLoading ? (
                <ActivityIndicator size="small" color={colors.violet} />
              ) : (
                <Text style={styles.reloadIcon}>↻</Text>
              )}
            </Pressable>
          </View>
          {insightError ? (
            <Text style={[styles.aiText, { color: colors.red }]}>⚠️ {insightError}</Text>
          ) : insight ? (
            <Text style={styles.aiText}>{insight}</Text>
          ) : (
            <Text style={[styles.aiText, { fontStyle: 'italic', opacity: 0.7 }]}>
              {t('home.readingFinances')}
            </Text>
          )}
        </Card>

        {/* Expense progress by category */}
        <Card>
          <SectionTitle>{t('home.expenseProgress')}</SectionTitle>
          {categories.map((c) => {
            const s = spentForCategory(c.key);
            const p = c.alloc > 0 ? s / c.alloc : 0;
            return (
              <View key={c.key} style={{ marginBottom: 9 }}>
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>
                    {c.icon} {catLabel(c.key, c.label)}
                  </Text>
                  <Text style={styles.lineMuted}>
                    ৳{fmtN(s)} / {fmtN(c.alloc)}
                  </Text>
                </View>
                <Bar pct={p} color={ringColor(p)} />
              </View>
            );
          })}
        </Card>

        {/* Savings progress */}
        <Card>
          <SectionTitle>{t('home.savingsProgress')}</SectionTitle>
          {goals.length === 0 ? (
            <Text style={styles.lineMuted}>{t('home.noGoals')}</Text>
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
                      ৳{fmtN(g.saved)} / {fmtN(g.target)}
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
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  bgWrap: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 24 },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineStrong,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.tealTint, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  avatarText: { color: colors.tealDeep, fontWeight: '800', fontSize: 19 },
  hello: { fontSize: 13, color: colors.muted },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langToggle: { flexDirection: 'row', backgroundColor: '#eef2f7', borderRadius: 9, padding: 2 },
  langBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 },
  langBtnOn: { backgroundColor: colors.teal },
  langText: { fontSize: 11.5, fontWeight: '800', color: colors.muted },
  langTextOn: { color: '#fff' },
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
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reloadBtn: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e4d9fb' },
  reloadIcon: { fontSize: 16, fontWeight: '900', color: colors.violet, lineHeight: 18 },
  aiTag: { fontSize: 10, fontWeight: '800', color: colors.violet, letterSpacing: 0.5 },
  aiText: { fontSize: 13, color: '#3b0764', lineHeight: 20 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineLabel: { fontSize: 13, color: colors.ink2, fontWeight: '600' },
  lineMuted: { fontSize: 12.5, color: colors.muted, fontWeight: '600' },
});
