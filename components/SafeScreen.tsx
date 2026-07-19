import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../lib/constants';

interface SafeScreenProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

export function SafeScreen({ children, style, backgroundColor = COLORS.bg }: SafeScreenProps) {
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});