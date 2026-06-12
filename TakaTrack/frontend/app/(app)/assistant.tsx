import { useRef, useState } from 'react';
import {
  ActivityIndicator,
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

import { askAI, buildSnapshot, ChatTurn } from '../../src/ai';
import { useAuth } from '../../src/auth';
import { useData } from '../../src/data';
import { useLang } from '../../src/i18n';
import { colors } from '../../src/theme';

export default function AssistantScreen() {
  const { t, language } = useLang();
  const { token, user } = useAuth();
  const { income, categories, expenses, goals, arcade, spentForCategory, totalSpent } = useData();

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // System instruction: chat style + the shared financial snapshot.
  function buildContext(): string {
    return [
      `You are the in-app financial assistant for TakaTrack, a personal budgeting app used in Bangladesh. Currency is Bangladeshi Taka (৳).`,
      `Answer in a friendly, practical tone. Keep replies concise — usually 2 to 5 sentences. Give specific, actionable advice using the user's real numbers below. Do not invent data; if something isn't in the snapshot, say you don't have it. Don't give heavy financial/legal disclaimers.`,
      `Always reply in ${language === 'bn' ? 'Bangla (বাংলা)' : 'English'}, regardless of the language the user writes in.`,
      ``,
      buildSnapshot({
        name: user?.name ?? 'User',
        income,
        categories,
        expenses,
        goals,
        arcade,
        spentForCategory,
        totalSpent,
      }),
    ].join('\n');
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    const next: ChatTurn[] = [...turns, { role: 'user', text }];
    setTurns(next);
    setInput('');
    setError(null);
    setBusy(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    try {
      const reply = await askAI(token ?? '', next, buildContext());
      setTurns((prev) => [...prev, { role: 'model', text: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('assistant.error'));
    } finally {
      setBusy(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }

  const suggestions = [t('assistant.suggest1'), t('assistant.suggest2'), t('assistant.suggest3')];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('assistant.title')}</Text>
          <Text style={styles.subtitle}>{t('assistant.subtitle')}</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Bubble role="model" text={t('assistant.greeting')} />

          {turns.map((turn, i) => (
            <Bubble key={i} role={turn.role} text={turn.text} />
          ))}

          {busy && (
            <View style={[styles.bubble, styles.modelBubble, styles.typing]}>
              <ActivityIndicator size="small" color={colors.teal} />
              <Text style={styles.typingText}>{t('assistant.thinking')}</Text>
            </View>
          )}

          {error && <Text style={styles.error}>⚠️ {error}</Text>}

          {turns.length === 0 && !busy && (
            <View style={styles.suggestions}>
              {suggestions.map((s) => (
                <Pressable key={s} style={styles.chip} onPress={() => setInput(s)}>
                  <Text style={styles.chipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('assistant.inputPlaceholder')}
            placeholderTextColor={colors.muted}
            multiline
            onSubmitEditing={send}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || busy) && styles.sendBtnOff]}
            onPress={send}
            disabled={!input.trim() || busy}>
            <Text style={styles.sendIcon}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ role, text }: { role: 'user' | 'model'; text: string }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.modelBubble]}>
      <Text style={[styles.bubbleText, isUser && styles.userText]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },

  scroll: { padding: 14, paddingBottom: 18 },

  bubble: { maxWidth: '86%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.teal, borderBottomRightRadius: 4 },
  modelBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.line },
  bubbleText: { fontSize: 14.5, lineHeight: 21, color: colors.ink2 },
  userText: { color: '#fff', fontWeight: '500' },

  typing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 13, color: colors.muted },

  error: { fontSize: 13, color: colors.red, marginTop: 4, marginBottom: 6, fontWeight: '600' },

  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { backgroundColor: colors.tealTint, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: colors.tealTint2 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.tealDark },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#fff' },
  input: { flex: 1, maxHeight: 120, borderWidth: 1, borderColor: colors.line, borderRadius: 20, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 14.5, color: colors.ink, backgroundColor: colors.bg },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: colors.lineStrong },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '900', lineHeight: 22 },
});
