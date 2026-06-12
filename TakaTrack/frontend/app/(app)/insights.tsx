import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { generateInsights } from '../../src/ai';
import { useAuth } from '../../src/auth';
import { useData } from '../../src/data';
import { useLang } from '../../src/i18n';
import { colors } from '../../src/theme';
import { Card } from '../../src/ui';

export default function InsightsScreen() {
  const router = useRouter();
  const { t, language } = useLang();
  const { token, user } = useAuth();
  const { income, categories, expenses, goals, arcade, spentForCategory, totalSpent } = useData();

  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await generateInsights(
        token ?? '',
        { name: user?.name ?? 'User', income, categories, expenses, goals, arcade, spentForCategory, totalSpent },
        5,
        language,
      );
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('insights.error'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, income, categories, expenses, goals, arcade, language]);

  // Generate once on open.
  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('insights.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>{t('insights.subtitle')}</Text>

        {error && <Text style={styles.error}>⚠️ {error}</Text>}

        {loading && items.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.violet} />
            <Text style={styles.loadingText}>{t('insights.loading')}</Text>
          </View>
        ) : (
          items.map((text, i) => (
            <Card key={i} style={styles.card}>
              <View style={styles.numberDot}>
                <Text style={styles.numberText}>{i + 1}</Text>
              </View>
              <Text style={styles.cardText}>{text}</Text>
            </Card>
          ))
        )}

        <Pressable
          style={[styles.genBtn, loading && { opacity: 0.6 }]}
          onPress={generate}
          disabled={loading}>
          {loading && items.length > 0 ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={styles.genBtnText}>{t('insights.generate')}</Text>
            </>
          )}
        </Pressable>
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

  scroll: { padding: 14, paddingBottom: 28 },
  subtitle: { fontSize: 13, color: colors.muted, marginBottom: 12 },

  error: { fontSize: 13, color: colors.red, marginBottom: 10, fontWeight: '600' },

  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 13, color: colors.muted },

  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: colors.violetTint,
    borderLeftWidth: 5,
    borderLeftColor: colors.violet,
    borderColor: '#ece5fb',
  },
  numberDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  numberText: { color: '#fff', fontWeight: '800', fontSize: 12.5 },
  cardText: { flex: 1, fontSize: 14, color: '#3b0764', lineHeight: 20 },

  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.violet,
  },
  genBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
