import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShopOffer, SearchResult, api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { useLang } from '../../src/i18n';
import { colors } from '../../src/theme';
import { Card, ScreenTitle } from '../../src/ui';

function openLink(url: string) {
  if (url) Linking.openURL(url).catch(() => {});
}

function ProductRow({ p, currency }: { p: ShopOffer; currency: string }) {
  const { fmtN } = useLang();
  return (
    <Pressable style={styles.product} onPress={() => openLink(p.link)}>
      {p.thumbnail ? (
        <Image source={{ uri: p.thumbnail }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>
          {p.title}
        </Text>
        <Text style={styles.source} numberOfLines={1}>
          {p.source}
          {p.delivery ? ` · ${p.delivery}` : ''}
        </Text>
        <View style={styles.metaRow}>
          {p.rating ? <Text style={styles.rating}>★ {Number(p.rating).toFixed(1)}{p.reviews ? ` (${p.reviews})` : ''}</Text> : null}
          {!p.inStock ? <Text style={styles.oos}>out of stock</Text> : null}
        </View>
      </View>
      <View style={styles.priceCol}>
        <Text style={styles.price}>{p.priceText || `${currency}${fmtN(p.price)}`}</Text>
        {p.original && p.discountPct ? (
          <>
            <Text style={styles.original}>{currency}{fmtN(p.original)}</Text>
            <Text style={styles.discount}>-{p.discountPct}%</Text>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ShopScreen() {
  const { t, fmtN } = useLang();
  const { token } = useAuth();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);

  async function run() {
    if (loading) return;
    if (!query.trim()) {
      setError(t('shop.needQuery'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.shopping.search(token ?? '', query.trim());
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('shop.error'));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ScreenTitle title={t('shop.title')} subtitle={t('shop.subtitle')} />

        <Card>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder={t('shop.placeholder')}
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              onSubmitEditing={run}
            />
            <Pressable style={[styles.searchBtn, loading && { opacity: 0.6 }]} onPress={run} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchBtnText}>{t('shop.search')}</Text>}
            </Pressable>
          </View>
          {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
          {loading ? <Text style={styles.analyzing}>{t('shop.searching')}</Text> : null}
        </Card>

        {result && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.results}>{t('shop.results', { n: fmtN(result.count) })}</Text>
              {result.potentialSavings > 0 ? (
                <Text style={styles.savings}>
                  {t('shop.savings', { c: result.currency, n: fmtN(result.potentialSavings) })}
                </Text>
              ) : null}
            </View>

            {result.products.length === 0 ? (
              <Card>
                <Text style={styles.muted}>{t('shop.noResults')}</Text>
              </Card>
            ) : (
              <Card>
                {result.products.map((p, i) => (
                  <ProductRow key={`${p.source}-${i}`} p={p} currency={result.currency} />
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 14, paddingBottom: 28 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: colors.ink, backgroundColor: '#fff' },
  searchBtn: { backgroundColor: colors.teal, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12, minWidth: 78, alignItems: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 13.5 },
  error: { color: colors.red, fontSize: 12.5, marginTop: 10, fontWeight: '600' },
  analyzing: { color: colors.muted, fontSize: 12, marginTop: 10, fontStyle: 'italic' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 2 },
  results: { fontSize: 13, fontWeight: '800', color: colors.ink2 },
  savings: { fontSize: 12.5, fontWeight: '800', color: colors.green },
  product: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.lineStrong },
  thumb: { width: 56, height: 56, borderRadius: 9, backgroundColor: '#f1f5f9' },
  thumbEmpty: { borderWidth: 1, borderColor: colors.line },
  title: { fontSize: 13, fontWeight: '700', color: colors.ink2, lineHeight: 17 },
  source: { fontSize: 11, color: colors.muted, marginTop: 3 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 3, alignItems: 'center' },
  rating: { fontSize: 11, color: colors.amber, fontWeight: '700' },
  oos: { fontSize: 10, color: colors.red, fontWeight: '700' },
  priceCol: { alignItems: 'flex-end', minWidth: 76 },
  price: { fontSize: 15, fontWeight: '800', color: colors.ink },
  original: { fontSize: 11, color: colors.muted, textDecorationLine: 'line-through', marginTop: 2 },
  discount: { fontSize: 11, fontWeight: '800', color: colors.green, marginTop: 1 },
  muted: { fontSize: 12.5, color: colors.muted },
});
