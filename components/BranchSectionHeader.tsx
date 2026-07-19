import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, BRAND } from '../lib/constants';
import { BrandType } from '../types';

interface BranchSectionHeaderProps {
  brand: BrandType;
  branch: string;
  queueCount: number;
}

export function BranchSectionHeader({ brand, branch, queueCount }: BranchSectionHeaderProps) {
  const brandInfo = BRAND[brand];
  
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={[styles.brandDot, { backgroundColor: brandInfo.color }]} />
        <View>
          <Text style={styles.branchName}>
            {brandInfo.emoji} {brandInfo.label} · {branch}
          </Text>
        </View>
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{queueCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.red,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  branchName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  countBadge: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray600,
  },
});