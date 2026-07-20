import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../lib/constants';
import { LiveDot } from './ui';

interface CustomerHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export function CustomerHeader({ title, subtitle, rightElement }: CustomerHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Row 1 – Brand + LiveDot */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <Image source={require('../assets/logo.jpg')} style={styles.brandLogo} />
          <Text style={styles.brandText}>BeeMacQueue</Text>
        </View>
        <LiveDot />
      </View>

      {/* Row 2 – Page title + optional right element */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {rightElement && <View style={styles.rightSlot}>{rightElement}</View>}
      </View>

      {/* Row 3 – Optional subtitle */}
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.red,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
    flex: 1,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginTop: 4,
  },
});