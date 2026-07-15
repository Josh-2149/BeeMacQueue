import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Establishment } from '../types';
import { COLORS, BRAND } from '../lib/constants';

interface Props {
  visible: boolean;
  establishment: Establishment | null;
  joining: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function JoinModal({ visible, establishment: est, joining, onConfirm, onClose }: Props) {
  if (!est) return null;
  const brand = BRAND[est.brand];
  const ahead = Math.max(0, (est.current_queue || 0) - (est.next_serving || 1) + 1);
  const waitMins = Math.max(0, ahead - 1) * (est.avg_wait_mins || 5);
  const yourTicket = (est.current_queue || 0) + 1;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={[styles.banner, { backgroundColor: brand.color }]}>
            <Text style={styles.bannerText}>{brand.emoji} {est.name}</Text>
            <Text style={styles.bannerBranch}>{est.branch}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>#{yourTicket}</Text>
              <Text style={styles.statLabel}>Your ticket</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{Math.max(0, ahead - 1)}</Text>
              <Text style={styles.statLabel}>People ahead</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{waitMins}m</Text>
              <Text style={styles.statLabel}>Est. wait</Text>
            </View>
          </View>

          <Text style={styles.addressText}>📍 {est.address}</Text>

          <TouchableOpacity
            style={[styles.confirmBtn, joining && { opacity: 0.65 }]}
            onPress={onConfirm}
            disabled={joining || !est.is_open}
            activeOpacity={0.8}
          >
            {joining
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.confirmBtnText}>
                  {est.is_open ? 'Confirm & Join Queue' : 'Branch is Closed'}
                </Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={joining}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, paddingBottom: 40, overflow: 'hidden',
  },
  handle: { width: 40, height: 5, backgroundColor: COLORS.gray200, borderRadius: 3, alignSelf: 'center', marginVertical: 14 },
  banner: { paddingVertical: 16, paddingHorizontal: 20, marginBottom: 20 },
  bannerText: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  bannerBranch: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  statsRow: {
    flexDirection: 'row', marginHorizontal: 20,
    backgroundColor: COLORS.gray50, borderRadius: 14, padding: 14, marginBottom: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '900', color: COLORS.red },
  statLabel: { fontSize: 10, color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 3 },
  statDivider: { width: 1, backgroundColor: COLORS.gray200, marginVertical: 4 },
  addressText: { fontSize: 13, color: COLORS.gray500, marginHorizontal: 20, marginBottom: 20 },
  confirmBtn: {
    backgroundColor: COLORS.red, marginHorizontal: 20, borderRadius: 12,
    padding: 15, alignItems: 'center', marginBottom: 10,
  },
  confirmBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  cancelBtn: {
    borderWidth: 1.5, borderColor: COLORS.gray200, marginHorizontal: 20,
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.gray600, fontWeight: '600', fontSize: 15 },
});
