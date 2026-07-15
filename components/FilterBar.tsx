import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../lib/constants';

interface Filter { key: string; label: string; }
interface Props { filters: Filter[]; active: string; onSelect: (key: string) => void; }

export function FilterBar({ filters, active, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.bar}
    >
      {filters.map((f) => (
        <TouchableOpacity
          key={f.key}
          style={[styles.chip, active === f.key && styles.active]}
          onPress={() => onSelect(f.key)}
          activeOpacity={0.75}
        >
          <Text style={[styles.chipText, active === f.key && styles.activeText]}>
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 12 },
  row: { paddingBottom: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.gray200,
    backgroundColor: COLORS.white, marginRight: 8,
  },
  active: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  activeText: { color: COLORS.white },
});
