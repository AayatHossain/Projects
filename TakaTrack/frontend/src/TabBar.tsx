import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useData } from './data';
import { colors, shadow } from './theme';

type Glyph = keyof typeof Ionicons.glyphMap;
type Item = { path: string; label: string; active: Glyph; inactive: Glyph; badge?: boolean };

function TabButton({
  icon,
  label,
  active,
  badge,
  onPress,
}: {
  icon: Glyph;
  label: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const color = active ? colors.teal : colors.muted;
  const handle = () => {
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Pressable style={styles.tab} onPress={handle}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={icon} size={22} color={color} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </Animated.View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

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
          return (
            <TabButton
              key={it.path}
              icon={on ? it.active : it.inactive}
              label={it.label}
              active={on}
              badge={it.badge && pending.length > 0 ? pending.length : undefined}
              onPress={() => go(it.path)}
            />
          );
        })}
        <TabButton
          icon="ellipsis-horizontal"
          label="More"
          active={overflowActive || open}
          onPress={() => setOpen((o) => !o)}
        />
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
