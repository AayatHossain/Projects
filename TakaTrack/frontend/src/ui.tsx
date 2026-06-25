import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, radius, shadow } from './theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({ style, onPress, disabled, ...rest }: PressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pop = () => {
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
    ]).start();
  };
  const flat = typeof style === 'function' ? (style as (s: { pressed: boolean }) => StyleProp<ViewStyle>)({ pressed: false }) : style;
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPress={(e) => {
        if (!disabled) pop();
        onPress?.(e);
      }}
      style={[flat as StyleProp<ViewStyle>, { transform: [{ scale }] }]}
    />
  );
}

export function FadeSlideIn({
  children,
  delay = 0,
  from = 16,
}: {
  children: React.ReactNode;
  delay?: number;
  from?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
      }}>
      {children}
    </Animated.View>
  );
}

export const fmt = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const ringColor = (pct: number) =>
  pct < 0.75 ? colors.green : pct < 1 ? colors.amber : colors.red;

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

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
  const target = Math.max(0, Math.min(pct, 1));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [target, anim]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.barTrack}>
      <Animated.View style={{ width, height: '100%', borderRadius: 999, backgroundColor: color ?? colors.teal }} />
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
