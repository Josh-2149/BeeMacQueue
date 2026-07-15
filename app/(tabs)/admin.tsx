import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useEstablishments } from '../../hooks/useEstablishments';
import { useAdminQueue } from '../../hooks/useAdminQueue';
import { SectionLabel, EmptyState, Badge, LiveDot } from '../../components/ui';
import { COLORS, BRAND } from '../../lib/constants';
import { QueueEntry, BrandType } from '../../types';

export default function AdminScreen() {
  const {
    establishments,
    loading: estLoading,
    addEstablishment,
    toggleOpen,
    resetQueue,
    deleteEstablishment,
  } = useEstablishments();
  const {
    liveQueue, servedToday, loading: queueLoading,
    serveTicket, cancelTicket, refresh,
  } = useAdminQueue();

  const [addModal, setAddModal] = useState(false);
  const [brand, setBrand] = useState<BrandType>('jollibee');
  const [branch, setBranch] = useState('');
  const [address, setAddress] = useState('');
  const [waitMins, setWaitMins] = useState('5');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'branches'>('queue');

  const openBranches = establishments.filter((e) => e.is_open).length;

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleServe(entry: QueueEntry) {
    Alert.alert(
      'Serve ticket?',
      `Mark ticket #${entry.ticket_number} as served?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Serve',
          onPress: async () => {
            await serveTicket(entry);
            Alert.alert('✅ Served!', `Ticket #${entry.ticket_number} served. Customer notified.`);
          },
        },
      ]
    );
  }

  async function handleCancel(entry: QueueEntry) {
    Alert.alert(
      'Cancel ticket?',
      `Cancel ticket #${entry.ticket_number}? The customer will be notified.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Ticket', style: 'destructive',
          onPress: async () => { await cancelTicket(entry); },
        },
      ]
    );
  }

  async function handleResetQueue(id: string, name: string) {
    Alert.alert('Reset queue?', `Reset queue for ${name} to 0?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: async () => { await resetQueue(id); Alert.alert('Queue reset!'); },
      },
    ]);
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert('Delete branch?', `Permanently delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteEstablishment(id); }
          catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  }

  async function handleAdd() {
    if (!branch.trim() || !address.trim()) { Alert.alert('Fill in all fields'); return; }
    setSaving(true);
    try {
      await addEstablishment({
        brand,
        branch: branch.trim(),
        address: address.trim(),
        avg_wait_mins: parseInt(waitMins) || 5,
      });
      setAddModal(false);
      setBranch(''); setAddress(''); setWaitMins('5');
      Alert.alert('Branch added!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🛡️ Admin Dashboard</Text>
          <Text style={styles.headerSub}>BeeMacQueue CDO</Text>
        </View>
        <LiveDot />
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{liveQueue.length}</Text>
          <Text style={styles.statLabel}>In queue</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{openBranches}</Text>
          <Text style={styles.statLabel}>Open now</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{servedToday}</Text>
          <Text style={styles.statLabel}>Served today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{establishments.length}</Text>
          <Text style={styles.statLabel}>Branches</Text>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'queue' && styles.tabActive]}
          onPress={() => setActiveTab('queue')}
        >
          <Text style={[styles.tabText, activeTab === 'queue' && styles.tabTextActive]}>
            Live Queue{liveQueue.length > 0 ? ` (${liveQueue.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'branches' && styles.tabActive]}
          onPress={() => setActiveTab('branches')}
        >
          <Text style={[styles.tabText, activeTab === 'branches' && styles.tabTextActive]}>
            Branches ({establishments.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.red} />}
        showsVerticalScrollIndicator={false}
      >
        {/* LIVE QUEUE TAB */}
        {activeTab === 'queue' && (
          <>
            <View style={styles.sectionRow}>
              <SectionLabel>REAL-TIME QUEUE</SectionLabel>
              <LiveDot />
            </View>

            {queueLoading && liveQueue.length === 0 ? (
              <ActivityIndicator color={COLORS.red} style={{ marginTop: 20 }} />
            ) : liveQueue.length === 0 ? (
              <EmptyState icon="✅" title="No active queues" sub="All customers have been served!" />
            ) : (
              liveQueue.map((entry) => {
                const est = entry.establishment as any;
                const person = entry.user as any;
                const b = (est?.brand ?? 'jollibee') as BrandType;
                const ahead = Math.max(0, entry.ticket_number - (est?.next_serving ?? 1));
                const wait = ahead * (est?.avg_wait_mins ?? 5);
                return (
                  <View key={entry.id} style={styles.queueCard}>
                    <View style={[styles.queueAccent, { backgroundColor: BRAND[b]?.color ?? COLORS.red }]} />
                    <View style={styles.queueBody}>
                      <View style={styles.queueTop}>
                        <View style={styles.ticketTag}>
                          <Text style={styles.ticketTagText}>#{entry.ticket_number}</Text>
                        </View>
                        <View style={styles.queueMeta}>
                          <Text style={styles.queueUserName}>{person?.name ?? 'Customer'}</Text>
                          <Text style={styles.queueUserEmail}>{person?.email ?? ''}</Text>
                        </View>
                        <Badge
                          label={ahead === 0 ? 'Next!' : `${ahead} ahead`}
                          variant={ahead === 0 ? 'green' : 'blue'}
                        />
                      </View>
                      <View style={styles.queueBranchRow}>
                        <Text style={styles.queueBranchText}>
                          {BRAND[b]?.emoji} {est?.name} · {est?.branch}
                        </Text>
                        <Text style={styles.queueWaitText}>~{wait}m wait</Text>
                      </View>
                      <View style={styles.queueActions}>
                        <TouchableOpacity style={styles.serveBtn} onPress={() => handleServe(entry)}>
                          <Text style={styles.serveBtnText}>✅ Serve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(entry)}>
                          <Text style={styles.cancelBtnText}>❌ Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* BRANCHES TAB */}
        {activeTab === 'branches' && (
          <>
            <View style={styles.sectionRow}>
              <SectionLabel>MANAGE BRANCHES</SectionLabel>
              <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)}>
                <Text style={styles.addBtnText}>+ Add Branch</Text>
              </TouchableOpacity>
            </View>

            {estLoading && establishments.length === 0 ? (
              <ActivityIndicator color={COLORS.red} style={{ marginTop: 20 }} />
            ) : establishments.length === 0 ? (
              <EmptyState icon="🏬" title="No branches yet" sub="Add your first branch above" />
            ) : (
              establishments.map((est) => {
                const b = BRAND[est.brand];
                return (
                  <View key={est.id} style={styles.branchCard}>
                    <View style={[styles.branchAccent, { backgroundColor: b.color }]} />
                    <View style={styles.branchBody}>
                      <View style={styles.branchHeader}>
                        <View style={[styles.branchIconBox, { backgroundColor: b.light }]}>
                          <Text style={{ fontSize: 20 }}>{b.emoji}</Text>
                        </View>
                        <View style={styles.branchInfo}>
                          <Text style={styles.branchName}>{est.name}</Text>
                          <Text style={styles.branchBranch}>{est.branch}</Text>
                          <Text style={styles.branchAddress}>📍 {est.address}</Text>
                        </View>
                        <Badge
                          label={est.is_open ? '● Open' : 'Closed'}
                          variant={est.is_open ? 'green' : 'gray'}
                        />
                      </View>

                      <View style={styles.branchStats}>
                        <View style={styles.branchStat}>
                          <Text style={styles.branchStatNum}>{est.current_queue}</Text>
                          <Text style={styles.branchStatLabel}>In queue</Text>
                        </View>
                        <View style={styles.branchStatDivider} />
                        <View style={styles.branchStat}>
                          <Text style={styles.branchStatNum}>#{est.next_serving}</Text>
                          <Text style={styles.branchStatLabel}>Serving</Text>
                        </View>
                        <View style={styles.branchStatDivider} />
                        <View style={styles.branchStat}>
                          <Text style={styles.branchStatNum}>{est.avg_wait_mins}m</Text>
                          <Text style={styles.branchStatLabel}>Avg wait</Text>
                        </View>
                      </View>

                      <View style={styles.branchActions}>
                        <TouchableOpacity
                          style={[styles.branchBtn, est.is_open ? styles.branchBtnClose : styles.branchBtnOpen]}
                          onPress={() => toggleOpen(est.id, est.is_open)}
                        >
                          <Text style={[styles.branchBtnText, { color: est.is_open ? '#991B1B' : COLORS.green }]}>
                            {est.is_open ? 'Close' : 'Open'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.branchBtnGray}
                          onPress={() => handleResetQueue(est.id, `${est.name} ${est.branch}`)}
                        >
                          <Text style={styles.branchBtnGrayText}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.branchBtnDanger}
                          onPress={() => handleDelete(est.id, `${est.name} ${est.branch}`)}
                        >
                          <Text style={styles.branchBtnDangerText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Add Branch Modal */}
      <Modal visible={addModal} transparent animationType="slide" onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Branch</Text>
            <Text style={styles.modalSub}>Add a CDO Jollibee or McDonald's branch</Text>

            <Text style={styles.inputLabel}>BRAND</Text>
            <View style={styles.brandRow}>
              {(['jollibee', 'mcdo'] as const).map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.brandBtn, brand === b && styles.brandBtnActive]}
                  onPress={() => setBrand(b)}
                >
                  <Text style={{ fontSize: 18, marginRight: 6 }}>{BRAND[b].emoji}</Text>
                  <Text style={[styles.brandBtnText, brand === b && { color: COLORS.red }]}>
                    {BRAND[b].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>BRANCH NAME</Text>
            <TextInput
              style={styles.modalInput}
              value={branch}
              onChangeText={setBranch}
              placeholder="e.g. Divisoria Branch"
              placeholderTextColor={COLORS.gray400}
            />

            <Text style={styles.inputLabel}>ADDRESS</Text>
            <TextInput
              style={styles.modalInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Street, Cagayan de Oro City"
              placeholderTextColor={COLORS.gray400}
            />

            <Text style={styles.inputLabel}>AVG WAIT TIME (mins per person)</Text>
            <TextInput
              style={styles.modalInput}
              value={waitMins}
              onChangeText={setWaitMins}
              placeholder="5"
              placeholderTextColor={COLORS.gray400}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.btnPrimary, saving && { opacity: 0.6 }]}
              onPress={handleAdd}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.btnPrimaryText}>Add Branch</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setAddModal(false)} disabled={saving}>
              <Text style={styles.btnSecText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.red, paddingTop: 56, paddingHorizontal: 20,
    paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statsBar: {
    backgroundColor: COLORS.white, flexDirection: 'row',
    paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.gray200,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: COLORS.red },
  statLabel: { fontSize: 9, color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 3 },
  statDivider: { width: 1, backgroundColor: COLORS.gray200, marginVertical: 4 },
  tabRow: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.gray200,
  },
  tab: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.red },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray400 },
  tabTextActive: { color: COLORS.red, fontWeight: '800' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addBtn: { backgroundColor: COLORS.red, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 12 },
  queueCard: {
    backgroundColor: COLORS.white, borderRadius: 14, marginBottom: 12,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  queueAccent: { width: 5 },
  queueBody: { flex: 1, padding: 14 },
  queueTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ticketTag: { backgroundColor: COLORS.redLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 10 },
  ticketTagText: { fontSize: 18, fontWeight: '900', color: COLORS.red },
  queueMeta: { flex: 1 },
  queueUserName: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
  queueUserEmail: { fontSize: 11, color: COLORS.gray400, marginTop: 1 },
  queueBranchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  queueBranchText: { fontSize: 12, color: COLORS.gray500, flex: 1 },
  queueWaitText: { fontSize: 12, fontWeight: '700', color: COLORS.orange },
  queueActions: { flexDirection: 'row' },
  serveBtn: {
    flex: 1, backgroundColor: COLORS.greenLight, borderRadius: 8,
    padding: 9, alignItems: 'center', borderWidth: 1,
    borderColor: COLORS.greenBorder, marginRight: 8,
  },
  serveBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.green },
  cancelBtn: {
    flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8,
    padding: 9, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '800', color: '#991B1B' },
  branchCard: {
    backgroundColor: COLORS.white, borderRadius: 14, marginBottom: 12,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  branchAccent: { width: 5 },
  branchBody: { flex: 1, padding: 14 },
  branchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  branchIconBox: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  branchInfo: { flex: 1 },
  branchName: { fontSize: 15, fontWeight: '800', color: COLORS.gray900 },
  branchBranch: { fontSize: 12, fontWeight: '600', color: COLORS.gray600, marginTop: 1 },
  branchAddress: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  branchStats: { flexDirection: 'row', backgroundColor: COLORS.gray50, borderRadius: 10, padding: 10, marginBottom: 12 },
  branchStat: { flex: 1, alignItems: 'center' },
  branchStatNum: { fontSize: 18, fontWeight: '800', color: COLORS.red },
  branchStatLabel: { fontSize: 9, color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 },
  branchStatDivider: { width: 1, backgroundColor: COLORS.gray200, marginVertical: 4 },
  branchActions: { flexDirection: 'row' },
  branchBtn: { flex: 1, borderRadius: 8, padding: 9, alignItems: 'center', marginRight: 6 },
  branchBtnOpen: { backgroundColor: COLORS.greenLight, borderWidth: 1, borderColor: COLORS.greenBorder },
  branchBtnClose: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  branchBtnText: { fontSize: 12, fontWeight: '800' },
  branchBtnGray: {
    flex: 1, backgroundColor: COLORS.gray100, borderRadius: 8,
    padding: 9, alignItems: 'center', borderWidth: 1,
    borderColor: COLORS.gray200, marginRight: 6,
  },
  branchBtnGrayText: { fontSize: 12, fontWeight: '700', color: COLORS.gray600 },
  branchBtnDanger: {
    flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8,
    padding: 9, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA',
  },
  branchBtnDangerText: { fontSize: 12, fontWeight: '700', color: '#991B1B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44 },
  modalHandle: { width: 40, height: 5, backgroundColor: COLORS.gray200, borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.gray900, marginBottom: 4 },
  modalSub: { fontSize: 13, color: COLORS.gray500, marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray600, marginBottom: 6, letterSpacing: 0.5 },
  brandRow: { flexDirection: 'row', marginBottom: 16 },
  brandBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 13, borderRadius: 10, borderWidth: 1.5,
    borderColor: COLORS.gray200, marginRight: 10,
  },
  brandBtnActive: { borderColor: COLORS.red, backgroundColor: COLORS.redLight },
  brandBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.gray500 },
  modalInput: {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10,
    padding: 13, fontSize: 14, color: COLORS.gray900, marginBottom: 14,
  },
  btnPrimary: { backgroundColor: COLORS.red, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 10 },
  btnPrimaryText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  btnSecondary: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnSecText: { color: COLORS.gray600, fontWeight: '700', fontSize: 15 },
});
