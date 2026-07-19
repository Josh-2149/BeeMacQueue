// app/(staff)/my-queue.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useStaffQueueContext } from '../../context/StaffQueueContext';
import { SafeScreen } from '../../components/SafeScreen';
import { StaffHeader } from '../../components/StaffHeader';
import { StaffQueueCard } from '../../components/StaffQueueCard';
import { SectionLabel } from '../../components/ui';
import { COLORS } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';

console.log('🏪 [Staff MyQueue] Screen mounted');

export default function StaffMyQueueScreen() {
  console.log('🏪 [Staff MyQueue] Rendering');
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<string | 'all'>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQueue, setEditingQueue] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editWait, setEditWait] = useState('');

  const {
    waitingList,
    servingList,
    servedList,
    queues,
    stats,
    establishment,
    loading: queueLoading,
    processing,
    error,
    serveNext,
    markServed,
    callCustomer,
    cancelCustomer,
    refresh,
    updateQueue,
    deleteQueue,
  } = useStaffQueueContext();

  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'staff') {
      console.log('🏪 [Staff MyQueue] 🚫 Not staff, redirecting');
      Alert.alert('Access Denied', 'Staff only area');
      router.replace('/(customer)/home');
    }
  }, [profile, authLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleServeNext = async (queueId?: string) => {
    const success = await serveNext(queueId);
    if (!success) {
      Alert.alert('No Waiting Customers', 'There are no customers in the waiting queue.');
    }
  };

  const handleMarkServed = (entryId: string) => {
    Alert.alert(
      'Mark as Served',
      'Confirm this customer has been served?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'default', onPress: () => markServed(entryId) },
      ]
    );
  };

  const handleCancelCustomer = (entryId: string) => {
    Alert.alert(
      'Remove Customer',
      'Are you sure you want to remove this customer from the queue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => cancelCustomer(entryId) },
      ]
    );
  };

  const handleCallCustomer = (entryId: string) => {
    callCustomer(entryId);
    Alert.alert('✅ Customer Called', 'Notification has been sent to the customer.');
  };

  const handleEditQueue = (queue: any) => {
    setEditingQueue(queue);
    setEditName(queue.name || '');
    setEditCapacity(String(queue.capacity || 50));
    setEditWait(String(queue.estimated_wait_mins || 15));
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter a queue name');
      return;
    }

    const result = await updateQueue(editingQueue.id, {
      name: editName.trim(),
      capacity: parseInt(editCapacity) || 50,
      estimated_wait_mins: parseInt(editWait) || 15,
    });

    if (result.success) {
      Alert.alert('✅ Queue Updated', `"${editName}" has been updated.`);
      setShowEditModal(false);
      setEditingQueue(null);
      Keyboard.dismiss();
      await refresh();
    } else {
      Alert.alert('Error', result.error || 'Failed to update queue');
    }
  };

  const handleDeleteQueue = (queue: any) => {
    Alert.alert(
      'Delete Queue',
      `Are you sure you want to delete "${queue.name}"? This will remove it from customer view.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          const result = await deleteQueue(queue.id);
          if (result.success) {
            Alert.alert('✅ Queue Deleted', `"${queue.name}" has been deleted.`);
            await refresh();
          } else {
            Alert.alert('Error', result.error || 'Failed to delete queue');
          }
        }},
      ]
    );
  };

  const getFilteredList = () => {
    if (selectedQueue === 'all') {
      return waitingList;
    }
    return waitingList.filter((entry) => entry.queue_id === selectedQueue);
  };

  if (authLoading || queueLoading) {
    return (
      <SafeScreen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.red} />
          <Text style={styles.loadingText}>
            {authLoading ? 'Loading profile...' : 'Loading queue data...'}
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </SafeScreen>
    );
  }

  if (!profile || profile.role !== 'staff') {
    return (
      <SafeScreen style={styles.container}>
        <View style={styles.accessDenied}>
          <Ionicons name="warning-outline" size={64} color={COLORS.red} />
          <Text style={styles.accessTitle}>Access Denied</Text>
          <Text style={styles.accessSub}>Staff only area</Text>
          <TouchableOpacity style={styles.accessButton} onPress={() => router.replace('/(customer)/home')}>
            <Text style={styles.accessButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeScreen>
    );
  }

  const filteredList = getFilteredList();

  return (
    <SafeScreen style={styles.container}>
      <StaffHeader
        title="My Queue"
        subtitle={`${establishment?.name || 'No branch'} · ${establishment?.branch || ''}\n${profile.name}`}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.red} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Queue Statistics */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalWaiting}</Text>
            <Text style={styles.statLabel}>Waiting</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalServing}</Text>
            <Text style={styles.statLabel}>Serving</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalServed}</Text>
            <Text style={styles.statLabel}>Served Today</Text>
          </View>
        </View>

        {/* Queue List - All queues for this branch */}
        {queues && queues.length > 0 && (
          <View style={styles.queuesSection}>
            <Text style={styles.sectionTitle}>Manage Queues</Text>
            {queues.map((q) => {
              const waitingCount = waitingList.filter((e) => e.queue_id === q.id).length;
              return (
                <View key={q.id} style={styles.queueItem}>
                  <View style={styles.queueItemLeft}>
                    <Text style={styles.queueItemName}>{q.name}</Text>
                    <Text style={styles.queueItemMeta}>
                      {waitingCount} waiting · ~{q.estimated_wait_mins || 15}min · {q.capacity || 50} cap
                    </Text>
                  </View>
                  <View style={styles.queueItemActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() => handleEditQueue(q)}
                    >
                      <Ionicons name="pencil-outline" size={16} color={COLORS.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDeleteQueue(q)}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Queue Selector */}
        {queues && queues.length > 0 && (
          <View style={styles.queueSelector}>
            <Text style={styles.queueSelectorLabel}>Filter by Queue:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.queueSelectorScroll}>
              <TouchableOpacity
                style={[styles.queueChip, selectedQueue === 'all' && styles.queueChipActive]}
                onPress={() => setSelectedQueue('all')}
              >
                <Text style={[styles.queueChipText, selectedQueue === 'all' && styles.queueChipTextActive]}>
                  All ({waitingList.length})
                </Text>
              </TouchableOpacity>
              {queues.map((q) => {
                const count = waitingList.filter((e) => e.queue_id === q.id).length;
                return (
                  <TouchableOpacity
                    key={q.id}
                    style={[styles.queueChip, selectedQueue === q.id && styles.queueChipActive]}
                    onPress={() => setSelectedQueue(q.id)}
                  >
                    <Text style={[styles.queueChipText, selectedQueue === q.id && styles.queueChipTextActive]}>
                      {q.name} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <SectionLabel>
          {selectedQueue === 'all' ? 'All Waiting Customers' : `Waiting for "${queues.find(q => q.id === selectedQueue)?.name || 'Queue'}"`}
        </SectionLabel>

        {filteredList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={COLORS.gray300} />
            <Text style={styles.emptyTitle}>No waiting customers</Text>
            <Text style={styles.emptySub}>
              {selectedQueue === 'all'
                ? 'All caught up! No one is waiting.'
                : 'This queue is empty.'}
            </Text>
          </View>
        ) : (
          filteredList.map((entry) => {
            const queueName = queues.find((q) => q.id === entry.queue_id)?.name || 'Unknown';
            return (
              <StaffQueueCard
                key={entry.id}
                entry={entry}
                queueName={queueName}
                onServe={() => handleServeNext(entry.queue_id)}
                onCall={() => handleCallCustomer(entry.id)}
                onCancel={() => handleCancelCustomer(entry.id)}
                onMarkServed={() => handleMarkServed(entry.id)}
                showActions={true}
              />
            );
          })
        )}

        {/* Quick Serve Button */}
        {filteredList.length > 0 && (
          <TouchableOpacity
            style={styles.serveButton}
            onPress={() => handleServeNext(selectedQueue === 'all' ? undefined : selectedQueue)}
            disabled={processing}
          >
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            <Text style={styles.serveButtonText}>
              {processing ? 'Serving...' : 'Serve Next Customer'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>BeeMacQueue CDO · Staff Portal</Text>
          <Text style={styles.footerSub}>Real-time queue management</Text>
        </View>
      </ScrollView>

      {/* Edit Queue Modal - FIXED with keyboard handling */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowEditModal(false);
          Keyboard.dismiss();
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => {
                setShowEditModal(false);
                Keyboard.dismiss();
              }}
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle}>
                  <View style={styles.modalHandleBar} />
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Edit Queue</Text>
                  </View>

                  <View style={styles.modalBody}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Queue Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Queue name"
                        placeholderTextColor={COLORS.gray400}
                        value={editName}
                        onChangeText={setEditName}
                        returnKeyType="next"
                      />
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.inputLabel}>Est. Wait (mins)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="15"
                          placeholderTextColor={COLORS.gray400}
                          value={editWait}
                          onChangeText={setEditWait}
                          keyboardType="numeric"
                          returnKeyType="next"
                        />
                      </View>

                      <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.inputLabel}>Capacity</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="50"
                          placeholderTextColor={COLORS.gray400}
                          value={editCapacity}
                          onChangeText={setEditCapacity}
                          keyboardType="numeric"
                          returnKeyType="done"
                          onSubmitEditing={handleSaveEdit}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.modalSaveBtn}
                      onPress={handleSaveEdit}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => {
                        setShowEditModal(false);
                        Keyboard.dismiss();
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.gray500, fontWeight: '500' },
  errorText: { fontSize: 13, color: COLORS.red, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 },
  accessDenied: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  accessTitle: { fontSize: 24, fontWeight: '800', color: COLORS.gray900 },
  accessSub: { fontSize: 14, color: COLORS.gray500, textAlign: 'center' },
  accessButton: { backgroundColor: COLORS.red, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  accessButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 10, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  statNumber: { fontSize: 24, fontWeight: '800', color: COLORS.red },
  statLabel: { fontSize: 10, color: COLORS.gray500, textTransform: 'uppercase', fontWeight: '600', marginTop: 2 },
  queuesSection: { backgroundColor: COLORS.white, borderRadius: 10, padding: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray700, marginBottom: 10 },
  queueItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  queueItemLeft: { flex: 1 },
  queueItemName: { fontSize: 14, fontWeight: '600', color: COLORS.gray900 },
  queueItemMeta: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  queueItemActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6, borderRadius: 6, borderWidth: 1 },
  editBtn: { borderColor: COLORS.blue, backgroundColor: COLORS.blueLight },
  deleteBtn: { borderColor: COLORS.red, backgroundColor: COLORS.redLight },
  queueSelector: { backgroundColor: COLORS.white, borderRadius: 10, padding: 12, marginBottom: 16 },
  queueSelectorLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray600, marginBottom: 8 },
  queueSelectorScroll: { flexDirection: 'row' },
  queueChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.gray100, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  queueChipActive: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  queueChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },
  queueChipTextActive: { color: COLORS.white },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray600 },
  emptySub: { fontSize: 13, color: COLORS.gray400, textAlign: 'center' },
  serveButton: { flexDirection: 'row', backgroundColor: COLORS.red, borderRadius: 10, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  serveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  footer: { marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.gray200, alignItems: 'center' },
  footerText: { fontSize: 10, color: COLORS.gray400, fontWeight: '600' },
  footerSub: { fontSize: 8, color: COLORS.gray300, marginTop: 2 },
  
  // Modal styles - FIXED
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { flex: 1, backgroundColor: 'transparent' },
  keyboardAvoidingView: { 
    justifyContent: 'flex-end', 
    width: '100%',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
    width: '100%',
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalHandle: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  modalHandleBar: {
    width: 36,
    height: 3.5,
    backgroundColor: COLORS.gray200,
    borderRadius: 2,
  },
  modalHeader: {
    marginBottom: 16,
    paddingTop: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
    textAlign: 'center',
  },
  modalBody: {
    gap: 12,
  },
  inputGroup: {
    marginBottom: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray500,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    padding: 11,
    fontSize: 14,
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },
  inputRow: {
    flexDirection: 'row',
  },
  modalSaveBtn: {
    backgroundColor: COLORS.red,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalSaveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  modalCancelBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray300,
    marginTop: 6,
  },
  modalCancelBtnText: {
    color: COLORS.gray600,
    fontSize: 15,
    fontWeight: '600',
  },
});