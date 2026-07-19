// components/CustomerHeader.tsx
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../lib/constants';

interface Props {
  title: string;
}

export default function CustomerHeader({ title }: Props) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: COLORS.red,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
});