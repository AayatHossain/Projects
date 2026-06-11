import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from './theme';

/** Thousands separator without relying on Intl (Hermes-safe). */
export const fmt = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Green under 75%, amber under 100%, red at/over budget. */
export const ringColor = (pct: number) =>
  pct < 0.75 ? colors.green : pct < 1 ? '#f59e0b' : colors.red;

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
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
  trackColor = '#e9eef4',
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color: string;
  label: string;
  trackColor?: string;
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
      <Text style={{ fontWeight: '800', fontSize: size * 0.24, color: colors.ink }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 10 },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e9eef4',
    overflow: 'hidden',
    marginTop: 7,
  },
});
