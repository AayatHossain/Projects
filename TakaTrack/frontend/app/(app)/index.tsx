import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/auth';
import { colors } from '../../src/theme';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Welcome,</Text>
          <Text style={styles.name}>{user?.name ?? 'there'} 👋</Text>
        </View>
        <Pressable style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>You&apos;re signed in</Text>
        <Text style={styles.cardBody}>{user?.email}</Text>
        <Text style={styles.cardHint}>
          Authentication is wired to the FastAPI backend and Firebase Realtime Database.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming next</Text>
        <Text style={styles.bullet}>📊  Monthly Budget Core (envelopes + safety rings)</Text>
        <Text style={styles.bullet}>💸  Smart Expense Logger</Text>
        <Text style={styles.bullet}>🎯  Goal Setter &amp; Progress Tracker</Text>
        <Text style={styles.bullet}>🎮  Financial Literacy Arcade</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, padding: 18 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  hello: { fontSize: 15, color: colors.muted },
  name: { fontSize: 26, fontWeight: '800', color: colors.ink },
  logout: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutText: { color: colors.red, fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#334155', marginBottom: 8 },
  cardBody: { fontSize: 16, fontWeight: '700', color: colors.teal },
  cardHint: { fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 19 },
  bullet: { fontSize: 14, color: colors.ink, paddingVertical: 5 },
});
