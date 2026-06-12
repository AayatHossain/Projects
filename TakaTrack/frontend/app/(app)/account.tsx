import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/auth';
import { useData } from '../../src/data';
import { colors } from '../../src/theme';
import { Card, fmt, SectionTitle } from '../../src/ui';

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { income, goals, arcade, totalSpent } = useData();

  const spent = totalSpent();
  const initial = (user?.name?.[0] ?? 'U').toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>My Account</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile summary */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user?.name ?? 'User'}</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>

        {/* Account details */}
        <Card>
          <SectionTitle>Account details</SectionTitle>
          <Row label="Name" value={user?.name ?? '—'} />
          <Row label="Email" value={user?.email ?? '—'} />
          <Row label="Member ID" value={user?.uid ?? '—'} last />
        </Card>

        {/* Finance snapshot */}
        <Card>
          <SectionTitle>Your finances</SectionTitle>
          <Row label="Monthly income" value={`৳${fmt(income)}`} />
          <Row label="Spent this period" value={`৳${fmt(spent)}`} />
          <Row label="Remaining" value={`৳${fmt(income - spent)}`} />
          <Row label="Savings goals" value={`${goals.length}`} />
          <Row label="TakaPoints" value={`⭐ ${arcade.points}`} last />
        </Card>

        <Pressable style={styles.logout} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={colors.red} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
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

  profile: { alignItems: 'center', paddingVertical: 18 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.tealTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.teal,
    marginBottom: 12,
  },
  avatarText: { color: colors.tealDeep, fontWeight: '800', fontSize: 34 },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink },
  email: { fontSize: 13.5, color: colors.muted, marginTop: 2 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.lineStrong },
  rowLabel: { fontSize: 13.5, color: colors.muted, fontWeight: '600' },
  rowValue: { fontSize: 13.5, color: colors.ink2, fontWeight: '700', flexShrink: 1, textAlign: 'right' },

  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    backgroundColor: colors.redTint,
  },
  logoutText: { color: colors.red, fontWeight: '800', fontSize: 14 },
});
