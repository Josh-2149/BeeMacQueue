import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Establishment } from '../types';
import { COLORS, BRAND } from '../lib/constants';
import { Badge } from './ui';

interface Props {
  establishment: Establishment;
  onJoin: () => void;
}

export function EstablishmentCard({ establishment: e, onJoin }: Props) {
  const brand = BRAND[e.brand];
  const ahead = Math.max(0, (e.current_queue || 0) - (e.next_serving || 1) + 1);
  const waitMins = Math.max(0, ahead - 1) * (e.avg_wait_mins || 5);

  return (
    <View style={styles.card}>
      <View style={[styles.topBar, { backgroundColor: brand.color }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: brand.light }]}>
            <Text style={styles.brandEmoji}>{brand.emoji}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>{e.name}</Text>
            <Text style={styles.branch} numberOfLines={1}>{e.branch}</Text>
            <Text style={styles.address} numberOfLines={1}>📍 {e.address}</Text>
          </View>
        </View>

        <View style={styles.badges}>
          <Badge label={e.is_open ? '● Open' : 'Closed'} variant={e.is_open ? 'green' : 'gray'} />
          <Badge label={brand.label} variant={e.brand === 'jollibee' ? 'red' : 'yellow'} />
        </View>

        {e.is_open ? (
          <View style={styles.queuePanel}>
            <View style={styles.queueStat}>
              <Text style={styles.queueStatNum}>{e.current_queue || 0}</Text>
              <Text style={styles.queueStatLabel}>In queue</Text>
            </View>
            <View style={styles.queueDivider} />
            <View style={styles.queueStat}>
              <Text style={styles.queueStatNum}>#{e.next_serving || 1}</Text>
              <Text style={styles.queueStatLabel}>Serving</Text>
            </View>
            <View style={styles.queueDivider} />
            <View style={styles.queueStat}>
              <Text style={styles.queueStatNum}>{waitMins}m</Text>
              <Text style={styles.queueStatLabel}>Est. wait</Text>
            </View>
            <TouchableOpacity style={styles.joinBtn} onPress={onJoin} activeOpacity={0.8}>
              <Text style={styles.joinBtnText}>Join</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.closedBanner}>
            <Text style={styles.closedText}>This branch is currently closed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 3, overflow: 'hidden',
  },
  topBar: { height: 5 },
  body: { padding: 14 },
  header: { flexDirection: 'row', marginBottom: 10 },
  iconBox: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  brandEmoji: { fontSize: 24 },
  nameBlock: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '800', color: COLORS.gray900 },
  branch: { fontSize: 13, fontWeight: '600', color: COLORS.gray600, marginTop: 1 },
  address: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  badges: { flexDirection: 'row', marginBottom: 12 },
  queuePanel: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.gray50, borderRadius: 12, padding: 12,
  },
  queueStat: { flex: 1, alignItems: 'center' },
  queueStatNum: { fontSize: 18, fontWeight: '800', color: COLORS.red },
  queueStatLabel: { fontSize: 9, color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 },
  queueDivider: { width: 1, height: 28, backgroundColor: COLORS.gray200 },
  joinBtn: { backgroundColor: COLORS.red, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, marginLeft: 8 },
  joinBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  closedBanner: { backgroundColor: COLORS.gray100, borderRadius: 10, padding: 12, alignItems: 'center' },
  closedText: { fontSize: 13, color: COLORS.gray400 },
});
