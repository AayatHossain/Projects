import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useData } from './data';
import { colors, shadow } from './theme';

type Glyph = keyof typeof Ionicons.glyphMap;
type Item = { path: string; label: string; active: Glyph; inactive: Glyph; badge?: boolean };

const PRIMARY: Item[] = [
  { path: '/', label: 'Home', active: 'home', inactive: 'home-outline' },
  { path: '/notifications', label: 'Inbox', active: 'notifications', inactive: 'notifications-outline', badge: true },
  { path: '/expenses', label: 'Expenses', active: 'wallet', inactive: 'wallet-outline' },
  { path: '/goals', label: 'Goals', active: 'flag', inactive: 'flag-outline' },
];

const OVERFLOW: Item[] = [
  { path: '/transactions', label: 'Transactions', active: 'receipt', inactive: 'receipt-outline' },
  { path: '/budget', label: 'Budget', active: 'pie-chart', inactive: 'pie-chart-outline' },
  { path: '/learning', label: 'Learning', active: 'school', inactive: 'school-outline' },
  { path: '/assistant', label: 'Assistant', active: 'sparkles', inactive: 'sparkles-outline' },
];

function isActive(path: string, pathname: string) {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(path + '/');
}

export function AppTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { pending } = useData();
  const [open, setOpen] = useState(false);

  const go = (path: string) => {
    setOpen(false);
    router.navigate(path as never);
  };

  const overflowActive = OVERFLOW.some((i) => isActive(i.path, pathname));
  const moreColor = overflowActive || open ? colors.teal : colors.muted;

  return (
    <>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.panel, { marginBottom: 70 + insets.bottom }]}>
            {OVERFLOW.map((it) => {
              const on = isActive(it.path, pathname);
              return (
                <Pressable key={it.path} style={styles.panelItem} onPress={() => go(it.path)}>
                  <View style={[styles.panelIcon, on && styles.panelIconOn]}>
                    <Ionicons name={on ? it.active : it.inactive} size={22} color={on ? '#fff' : colors.teal} />
                  </View>
                  <Text style={styles.panelLabel}>{it.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <View style={[styles.bar, { height: 64 + insets.bottom, paddingBottom: 8 + insets.bottom }]}>
        {PRIMARY.map((it) => {
          const on = isActive(it.path, pathname);
          const color = on ? colors.teal : colors.muted;
          return (
            <Pressable key={it.path} style={styles.tab} onPress={() => go(it.path)}>
              <View>
                <Ionicons name={on ? it.active : it.inactive} size={22} color={color} />
                {it.badge && pending.length > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pending.length}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, { color }]}>{it.label}</Text>
            </Pressable>
          );
        })}
        <Pressable style={styles.tab} onPress={() => setOpen((o) => !o)}>
          <Ionicons name="ellipsis-horizontal" size={22} color={moreColor} />
          <Text style={[styles.label, { color: moreColor }]}>More</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.lineStrong,
    paddingTop: 8,
    alignItems: 'center',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 10.5, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(11,18,32,0.35)', justifyContent: 'flex-end' },
  panel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.card,
  },
  panelItem: { width: '25%', alignItems: 'center', paddingVertical: 12, gap: 6 },
  panelIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.tealTint, alignItems: 'center', justifyContent: 'center' },
  panelIconOn: { backgroundColor: colors.teal },
  panelLabel: { fontSize: 11, fontWeight: '700', color: colors.ink2, textAlign: 'center' },
});
