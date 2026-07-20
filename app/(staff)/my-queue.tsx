// app/(staff)/my-queue.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
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
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { SafeScreen } from '../../components/SafeScreen';
import { StaffHeader } from '../../components/StaffHeader';
import { StaffQueueCard } from '../../components/StaffQueueCard';
import { SectionLabel } from '../../components/ui';
import { COLORS } from '../../lib/constants';
import { PhosphorIcon } from '../../components/PhosphorIcon';

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
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'staff') {
      console.log('🏪 [Staff MyQueue] 🚫 Not staff, redirecting');
      showToast({ title: 'Access Denied', message: 'Staff only area', variant: 'error' });
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
      showToast({ title: 'No Waiting Customers', message: 'There are no customers in the waiting queue.', variant: 'info' });
    }
  };

  const handleMarkServed = async (entryId: string) => {
    const choice = await showConfirm({
      title: 'Mark as Served',
      message: 'Confirm this customer has been served?',
      options: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Confirm', style: 'default' },
      ],
    });

    if (choice === 'Confirm') {
      await markServed(entryId);
    }
  };

  const handleCancelCustomer = async (entryId: string) => {
    const choice = await showConfirm({
      title: 'Remove Customer',
      message: 'Are you sure you want to remove this customer from the queue?',
      options: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Remove', style: 'destructive' },
      ],
    });

    if (choice === 'Remove') {
      await cancelCustomer(entryId);
    }
  };

  const handleCallCustomer = async (entryId: string) => {
    await callCustomer(entryId);
    showToast({ title: 'Customer Called', message: 'Notification has been sent to the customer.', variant: 'success' });
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
      showToast({ title: 'Error', message: 'Please enter a queue name', variant: 'error' });
      return;
    }

    const result = await updateQueue(editingQueue.id, {
      name: editName.trim(),
      capacity: parseInt(editCapacity) || 50,
      estimated_wait_mins: parseInt(editWait) || 15,
    });

    if (result.success) {
      showToast({ title: 'Queue Updated', message: `"${editName}" has been updated.`, variant: 'success' });
      setShowEditModal(false);
      setEditingQueue(null);
      Keyboard.dismiss();
      await refresh();
    } else {
      showToast({ title: 'Error', message: result.error || 'Failed to update queue', variant: 'error' });
    }
  };

  const handleDeleteQueue = async (queue: any) => {
    const choice = await showConfirm({
      title: 'Delete Queue',
      message: `Are you sure you want to delete "${queue.name}"? This will remove it from customer view.`,
      options: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Delete', style: 'destructive' },
      ],
    });

    if (choice !== 'Delete') return;

    const result = await deleteQueue(queue.id);
    if (result.success) {
      showToast({ title: 'Queue Deleted', message: `"${queue.name}" has been deleted.`, variant: 'success' });
      await refresh();
    } else {
      showToast({ title: 'Error', message: result.error || 'Failed to delete queue', variant: 'error' });
    }
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
          <PhosphorIcon icon="Warning" size={64} color={COLORS.red} />
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
      subtitle={`${profile.brand?.toUpperCase() || 'Unknown'} — ${profile.branch || 'No branch'}\n${profile.name}`}
    />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.red} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Queue Statistics */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: COLORS.blue }]}>
            <PhosphorIcon icon="Clock" size={18} color={COLORS.blue} weight="bold" />
            <Text style={[styles.statNumber, { color: COLORS.blue }]}>{stats.totalWaiting}</Text>
            <Text style={styles.statLabel}>Waiting</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: COLORS.orange }]}>
            <PhosphorIcon icon="UserCircle" size={18} color={COLORS.orange} weight="bold" />
            <Text style={[styles.statNumber, { color: COLORS.orange }]}>{stats.totalServing}</Text>
            <Text style={styles.statLabel}>Serving</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: COLORS.green }]}>
            <PhosphorIcon icon="CheckCircle" size={18} color={COLORS.green} weight="bold" />
            <Text style={[styles.statNumber, { color: COLORS.green }]}>{stats.totalServed}</Text>
            <Text style={styles.statLabel}>Served</Text>
          </View>
        </View>

        {/* Queue List - All queues for this branch */}
        {queues && queues.length > 0 && (
          <View style={styles.queuesSection}>
            <Text style={styles.sectionTitle}>Active Queues</Text>
            {queues.map((q) => {
              const waitingCount = waitingList.filter((e) => e.queue_id === q.id).length;
              const isSelected = selectedQueue === q.id;
              return (
                <TouchableOpacity
                  key={q.id}
                  style={[styles.queueCard, isSelected && styles.queueCardSelected]}
                  onPress={() => setSelectedQueue(isSelected ? 'all' : q.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.queueCardLeft}>
                    <View style={[styles.queueDot, { backgroundColor: isSelected ? COLORS.red : COLORS.gray300 }]} />
                    <View>
                      <Text style={styles.queueCardName}>{q.name}</Text>
                      <Text style={styles.queueCardMeta}>
                        {waitingCount} waiting · ~{q.estimated_wait_mins || 15} min · cap {q.capacity || 50}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.queueCardActions}>
                    <TouchableOpacity style={styles.editBtnSmall} onPress={() => handleEditQueue(q)}>
                      <PhosphorIcon icon="NotePencil" size={14} color={COLORS.blue} weight="bold" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtnSmall} onPress={() => handleDeleteQueue(q)}>
                      <PhosphorIcon icon="Trash" size={14} color={COLORS.red} weight="bold" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <SectionLabel>
          {selectedQueue === 'all' ? 'All Waiting Customers' : `Waiting for "${queues.find(q => q.id === selectedQueue)?.name || 'Queue'}"`}
        </SectionLabel>

        {filteredList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <PhosphorIcon icon="Users" size={48} color={COLORS.gray300} weight="bold" />
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
                createdByName={queues.find(q => q.id === entry.queue_id)?.created_by_name || (entry as any).created_by_name || undefined}
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
            <PhosphorIcon icon="ArrowRight" size={20} color={COLORS.white} weight="bold" />
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
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 10, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1, borderLeftWidth: 3 },
  statNumber: { fontSize: 22, fontWeight: '800', color: COLORS.red },
  statLabel: { fontSize: 10, color: COLORS.gray400, textTransform: 'uppercase', fontWeight: '600' },
  queuesSection: { backgroundColor: COLORS.white, borderRadius: 10, padding: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray700, marginBottom: 10 },
  queueCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.gray50, borderRadius: 10, padding: 12, marginBottom: 8 },
  queueCardSelected: { backgroundColor: COLORS.redLight, borderWidth: 1.5, borderColor: COLORS.red },
  queueCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  queueDot: { width: 8, height: 8, borderRadius: 4 },
  queueCardName: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
  queueCardMeta: { fontSize: 11, color: COLORS.gray500, marginTop: 2 },
  queueCardActions: { flexDirection: 'row', gap: 6 },
  editBtnSmall: { padding: 6, borderRadius: 6, backgroundColor: COLORS.blueLight },
  deleteBtnSmall: { padding: 6, borderRadius: 6, backgroundColor: COLORS.redLight },
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