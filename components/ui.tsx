import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, TextInput, TextInputProps,
} from 'react-native';
import { COLORS } from '../lib/constants';

console.log('🎨 [UI] Module loaded');

// ── Button ────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'outline' | 'yellow' | 'danger' | 'ghost';
interface BtnProps {
  label: string; onPress: () => void; loading?: boolean; disabled?: boolean;
  variant?: BtnVariant; full?: boolean; small?: boolean; style?: ViewStyle;
}
export function Btn({ label, onPress, loading, disabled, variant = 'primary', full, small, style }: BtnProps) {
  const bgMap: Record<BtnVariant, ViewStyle> = {
    primary:   { backgroundColor: COLORS.red },
    secondary: { backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200 },
    outline:   { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.red },
    yellow:    { backgroundColor: COLORS.yellow },
    danger:    { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
    ghost:     { backgroundColor: 'transparent' },
  };
  const textMap: Record<BtnVariant, TextStyle> = {
    primary:   { color: COLORS.white },
    secondary: { color: COLORS.gray700 },
    outline:   { color: COLORS.red },
    yellow:    { color: COLORS.gray900 },
    danger:    { color: '#991B1B' },
    ghost:     { color: COLORS.gray600 },
  };
  return (
    <TouchableOpacity
      style={[btnS.base, bgMap[variant], full && btnS.full, small && btnS.small, (disabled || loading) && btnS.disabled, style]}
      onPress={onPress} disabled={disabled || loading} activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? COLORS.white : COLORS.red} size="small" />
        : <Text style={[btnS.text, textMap[variant], small && btnS.textSmall]}>{label}</Text>}
    </TouchableOpacity>
  );
}
const btnS = StyleSheet.create({
  base: { borderRadius: 10, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  full: { width: '100%' },
  small: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '700', fontSize: 15 },
  textSmall: { fontSize: 13 },
});

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends TextInputProps { label?: string; error?: string; }
export function Input({ label, error, style, ...rest }: InputProps) {
  return (
    <View style={inpS.group}>
      {label ? <Text style={inpS.label}>{label}</Text> : null}
      <TextInput
        style={[inpS.input, error ? inpS.inputError : undefined, style as TextStyle]}
        placeholderTextColor={COLORS.gray400}
        {...rest}
      />
      {error ? <Text style={inpS.error}>{error}</Text> : null}
    </View>
  );
}
const inpS = StyleSheet.create({
  group: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.gray600, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 13, fontSize: 14, color: COLORS.gray900, backgroundColor: COLORS.white },
  inputError: { borderColor: COLORS.red },
  error: { fontSize: 12, color: COLORS.red, marginTop: 4 },
});

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'red' | 'green' | 'yellow' | 'blue' | 'gray' | 'orange';
interface BadgeProps { label: string; variant?: BadgeVariant; }
export function Badge({ label, variant = 'gray' }: BadgeProps) {
  const colorMap: Record<BadgeVariant, { bg: string; text: string }> = {
    red:    { bg: COLORS.redLight,    text: COLORS.red },
    green:  { bg: COLORS.greenLight,  text: COLORS.green },
    yellow: { bg: COLORS.yellowLight, text: COLORS.yellowDark },
    blue:   { bg: COLORS.blueLight,   text: COLORS.blue },
    gray:   { bg: COLORS.gray100,     text: COLORS.gray500 },
    orange: { bg: COLORS.orangeLight, text: COLORS.orange },
  };
  const c = colorMap[variant];
  return (
    <View style={[{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginRight: 6, backgroundColor: c.bg }]}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.text }}>{label}</Text>
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; style?: ViewStyle; padded?: boolean; }
export function Card({ children, style, padded = true }: CardProps) {
  return (
    <View style={[{ backgroundColor: COLORS.white, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }, padded && { padding: 16 }, style]}>
      {children}
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: COLORS.gray200 }} />
      {label ? <Text style={{ fontSize: 12, color: COLORS.gray400, marginHorizontal: 10 }}>{label}</Text> : null}
      {label ? <View style={{ flex: 1, height: 1, backgroundColor: COLORS.gray200 }} /> : null}
    </View>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
interface SectionLabelProps {
  children: React.ReactNode;
}
export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.gray400, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 }}>
      {children}
    </Text>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
interface EmptyStateProps { icon: string; title: string; sub?: string; }
export function EmptyState({ icon, title, sub }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
      <Text style={{ fontSize: 44, marginBottom: 12 }}>{icon}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.gray600, marginBottom: 4 }}>{title}</Text>
      {sub ? <Text style={{ fontSize: 13, color: COLORS.gray400, textAlign: 'center' }}>{sub}</Text> : null}
    </View>
  );
}

// ── LiveDot ───────────────────────────────────────────────────────────────────
export function LiveDot() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4ADE80', marginRight: 5 }} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#4ADE80', letterSpacing: 0.5 }}>LIVE</Text>
    </View>
  );
}

// ── ScreenHeader ──────────────────────────────────────────────────────────────
interface ScreenHeaderProps { title: string; subtitle?: string; right?: React.ReactNode; }
export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  return (
    <View style={{ backgroundColor: COLORS.red, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 }}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}