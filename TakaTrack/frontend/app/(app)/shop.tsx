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

import { Advice, ShopOffer, api } from '../../src/api';
import { buildSnapshot } from '../../src/ai';
import { useAuth } from '../../src/auth';
import { useData } from '../../src/data';
import { useLang } from '../../src/i18n';
import { colors } from '../../src/theme';
import { Card, ScreenTitle, SectionTitle } from '../../src/ui';

const VERDICT_STYLE = {
  buy: { bg: colors.greenTint, border: colors.green, text: colors.green, key: 'advisor.verdictBuy' },
  wait: { bg: colors.amberTint, border: colors.amber, text: '#b45309', key: 'advisor.verdictWait' },
  alternative: { bg: colors.violetTint, border: colors.violet, text: colors.violet, key: 'advisor.verdictAlt' },
} as const;

function openLink(url: string) {
  if (url) Linking.openURL(url).catch(() => {});
}

function OfferRow({ offer, best, label }: { offer: ShopOffer; best: boolean; label: string }) {
  return (
    <Pressable style={[styles.offer, best && styles.offerBest]} onPress={() => openLink(offer.link)}>
      {offer.thumbnail ? (
        <Image source={{ uri: offer.thumbnail }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]} />
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.offerTop}>
          <Text style={styles.offerSource} numberOfLines={1}>
            {offer.source}
          </Text>
          {best && <Text style={styles.bestTag}>{label}</Text>}
        </View>
        {offer.delivery ? <Text style={styles.offerDelivery}>{offer.delivery}</Text> : null}
        {offer.rating ? <Text style={styles.offerRating}>★ {offer.rating}{offer.reviews ? ` (${offer.reviews})` : ''}</Text> : null}
      </View>
      <Text style={[styles.offerPrice, best && { color: colors.green }]}>{offer.priceText || offer.price}</Text>
    </Pressable>
  );
}

export default function ShopScreen() {
  const { t, fmtN } = useLang();
  const { user, token } = useAuth();
  const { income, categories, expenses, goals, arcade, spentForCategory, totalSpent } = useData();

  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [budget, setBudget] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Advice | null>(null);

  async function advise() {
    if (loading) return;
    if (!product.trim()) {
      setError(t('advisor.needProduct'));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const context = buildSnapshot({
        name: user?.name ?? 'User',
        income,
        categories,
        expenses,
        goals,
        arcade,
        spentForCategory,
        totalSpent,
      });
      const res = await api.shopping.advise(token ?? '', {
        product: product.trim(),
        price: parseFloat(price) || undefined,
        budget: parseFloat(budget) || undefined,
        link: link.trim() || undefined,
        context,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('advisor.error'));
    } finally {
      setLoading(false);
    }
  }

  const v = result ? VERDICT_STYLE[result.verdict] : null;
  const topAlt = result?.alternatives?.[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ScreenTitle title={t('advisor.title')} subtitle={t('advisor.subtitle')} />

        <Card>
          <Text style={styles.fieldLabel}>{t('advisor.productLabel')}</Text>
          <TextInput
            style={styles.input}
            value={product}
            onChangeText={setProduct}
            placeholder={t('advisor.productPlaceholder')}
            placeholderTextColor={colors.muted}
          />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.fieldLabel}>{t('advisor.priceLabel')}</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="e.g. 120000"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.fieldLabel}>{t('advisor.budgetLabel')}</Text>
              <TextInput
                style={styles.input}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                placeholder="max spend"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>
          <Text style={styles.fieldLabel}>{t('advisor.linkLabel')}</Text>
          <TextInput
            style={styles.input}
            value={link}
            onChangeText={setLink}
            autoCapitalize="none"
            placeholder="https://…"
            placeholderTextColor={colors.muted}
          />
          <Pressable style={[styles.cta, loading && { opacity: 0.6 }]} onPress={advise} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>{t('advisor.submit')}</Text>
            )}
          </Pressable>
          {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
          {loading ? <Text style={styles.analyzing}>{t('advisor.analyzing')}</Text> : null}
        </Card>

        {result && v && (
          <>
            <Card style={[styles.verdict, { backgroundColor: v.bg, borderColor: v.border }]}>
              <Text style={[styles.verdictTag, { color: v.text }]}>{t(v.key as never)}</Text>
              <View style={styles.verdictRow}>
                <Text style={[styles.verdictLabel, { color: v.text }]}>{result.label}</Text>
                {result.best ? (
                  <Text style={[styles.verdictPrice, { color: v.text }]}>
                    {result.best.priceText || `${result.currency}${fmtN(result.best.price)}`}
                  </Text>
                ) : null}
              </View>
              {result.reason ? <Text style={styles.verdictReason}>{result.reason}</Text> : null}
              {topAlt && topAlt.savings > 0 ? (
                <Text style={[styles.saveLine, { color: v.text }]}>
                  {t('advisor.youSave', { c: result.currency, n: fmtN(topAlt.savings) })}{' '}
                  ({topAlt.savingsPct}%) · {topAlt.name}
                </Text>
              ) : null}
            </Card>

            {result.offers.length > 0 ? (
              <Card>
                <SectionTitle>{t('advisor.whereToBuy')}</SectionTitle>
                {result.offers.map((o, i) => (
                  <OfferRow key={`${o.source}-${i}`} offer={o} best={i === 0} label={t('advisor.bestPrice')} />
                ))}
              </Card>
            ) : (
              <Card>
                <Text style={styles.muted}>{t('advisor.noOffers')}</Text>
              </Card>
            )}

            {result.alternatives.length > 0 && (
              <Card>
                <SectionTitle>{t('advisor.alternatives')}</SectionTitle>
                {result.alternatives.map((a, i) => (
                  <Pressable key={`${a.name}-${i}`} style={styles.alt} onPress={() => openLink(a.link)}>
                    {a.thumbnail ? (
                      <Image source={{ uri: a.thumbnail }} style={styles.thumb} />
                    ) : (
                      <View style={[styles.thumb, styles.thumbEmpty]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.altName} numberOfLines={2}>{a.name}</Text>
                      <Text style={styles.offerSource}>{a.source}</Text>
                      {a.savings > 0 ? (
                        <Text style={styles.altSave}>
                          {t('advisor.save', { c: result.currency, n: fmtN(a.savings), p: a.savingsPct })}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.altPrice}>{a.priceText || `${result.currency}${fmtN(a.price)}`}</Text>
                  </Pressable>
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
  fieldLabel: { fontSize: 12.5, fontWeight: '800', color: colors.body, marginBottom: 7, marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: colors.ink, backgroundColor: '#fff' },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  cta: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 14.5 },
  error: { color: colors.red, fontSize: 12.5, marginTop: 10, fontWeight: '600' },
  analyzing: { color: colors.muted, fontSize: 12, marginTop: 10, fontStyle: 'italic', textAlign: 'center' },
  verdict: { borderWidth: 1.5, borderLeftWidth: 6 },
  verdictTag: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  verdictRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  verdictLabel: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, flex: 1 },
  verdictPrice: { fontSize: 20, fontWeight: '800' },
  verdictReason: { fontSize: 13, color: colors.ink2, lineHeight: 19, marginTop: 8 },
  saveLine: { fontSize: 13, fontWeight: '800', marginTop: 10 },
  offer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.lineStrong },
  offerBest: { backgroundColor: colors.greenTint, borderRadius: 10, paddingHorizontal: 8, borderBottomWidth: 0, marginBottom: 4 },
  thumb: { width: 42, height: 42, borderRadius: 8, backgroundColor: '#f1f5f9' },
  thumbEmpty: { borderWidth: 1, borderColor: colors.line },
  offerTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offerSource: { fontSize: 13.5, fontWeight: '700', color: colors.ink2, flexShrink: 1 },
  bestTag: { fontSize: 9, fontWeight: '900', color: '#fff', backgroundColor: colors.green, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden' },
  offerDelivery: { fontSize: 11, color: colors.muted, marginTop: 1 },
  offerRating: { fontSize: 11, color: colors.amber, marginTop: 1, fontWeight: '700' },
  offerPrice: { fontSize: 15, fontWeight: '800', color: colors.ink },
  alt: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.lineStrong },
  altName: { fontSize: 13, fontWeight: '700', color: colors.ink2 },
  altSave: { fontSize: 11.5, fontWeight: '800', color: colors.green, marginTop: 2 },
  altPrice: { fontSize: 15, fontWeight: '800', color: colors.ink },
  muted: { fontSize: 12.5, color: colors.muted },
});
