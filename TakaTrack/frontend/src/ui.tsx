import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, radius, shadow } from './theme';

/** Thousands separator without relying on Intl (Hermes-safe). */
export const fmt = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Green under 75%, amber under 100%, red at/over budget. */
export const ringColor = (pct: number) =>
  pct < 0.75 ? colors.green : pct < 1 ? colors.amber : colors.red;

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Large page heading with optional subtitle and a right-side slot. */
export function ScreenTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.titleWrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

export function Bar({ pct, color }: { pct: number; color?: string }) {
  return (
    <View style={styles.barTrack}>
      <View
        style={{
          width: `${Math.max(0, Math.min(pct, 1)) * 100}%`,
          height: '100%',
          borderRadius: 999,
          backgroundColor: color ?? colors.teal,
        }}
      />
    </View>
  );
}

export function Ring({
  pct,
  size = 58,
  stroke = 7,
  color,
  label,
  trackColor = '#e6ebf2',
  labelColor,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color: string;
  label: string;
  trackColor?: string;
  labelColor?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(pct, 1)) * circ;
  const c = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>
      <Text style={{ fontWeight: '800', fontSize: size * 0.25, color: labelColor ?? colors.ink }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 14,
    ...shadow.card,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 3 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.1,
    marginBottom: 12,
  },
  divider: { height: 1, backgroundColor: colors.lineStrong },
  barTrack: {
    height: 11,
    borderRadius: 999,
    backgroundColor: '#e6ebf2',
    overflow: 'hidden',
    marginTop: 8,
  },
});
