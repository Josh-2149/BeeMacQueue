import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useStaffQueueContext } from '../../context/StaffQueueContext';
import { SafeScreen } from '../../components/SafeScreen';
import { StaffHeader } from '../../components/StaffHeader';
import { COLORS } from '../../lib/constants';
import { PhosphorIcon } from '../../components/PhosphorIcon';

console.log('🏪 [Staff MyQueue] Screen mounted');

type FilterType = 'all' | 'active' | 'paused';

export default function StaffMyQueueScreen() {
  console.log('🏪 [Staff MyQueue] Rendering');
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [queues, setQueues] = useState<any[]>([]);
  const [filteredQueues, setFilteredQueues] = useState<any[]>([]);
  const [loadingQueues, setLoadingQueues] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQueue, setEditingQueue] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editWait, setEditWait] = useState('');
  const [editCapacity, setEditCapacity] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingQueue, setDeletingQueue] = useState<any>(null);

  const {
    getQueues,
    updateQueue,
    deleteQueue,
    refresh,
    loading,
    error,
  } = useStaffQueueContext();

  useEffect(() => {
    if (!authLoading && profile) {
      loadQueues();
    }
  }, [authLoading, profile]);

  useEffect(() => {
    filterQueues();
  }, [queues, filter]);

  const loadQueues = async () => {
    setLoadingQueues(true);
    const result = await getQueues();
    if (result.success) {
      setQueues(result.data);
    }
    setLoadingQueues(false);
  };

  const filterQueues = () => {
    if (filter === 'all') {
      setFilteredQueues(queues);
    } else {
      setFilteredQueues(queues.filter(q => q.metadata?.status === filter));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    await loadQueues();
    setRefreshing(false);
  };

  const handleEditQueue = (queue: any) => {
    const metadata = queue.metadata || {};
    setEditingQueue(queue);
    setEditName(metadata.name || '');
    setEditWait(String(metadata.estimatedWait || 15));
    setEditCapacity(String(metadata.capacity || 50));
    setShowEditModal(true);
  };

  const handleUpdateQueue = async () => {
    if (!editName.trim() || !editingQueue) return;

    const result = await updateQueue(editingQueue.id, {
      name: editName.trim(),
      estimatedWait: parseInt(editWait) || 15,
      capacity: parseInt(editCapacity) || 50,
    });

    if (result.success) {
      Alert.alert('✅ Updated', 'Queue updated successfully!');
      setShowEditModal(false);
      await loadQueues();
    } else {
      Alert.alert('Error', result.error || 'Failed to update queue');
    }
  };

  const handleDeleteQueue = (queue: any) => {
    setDeletingQueue(queue);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingQueue) return;

    const result = await deleteQueue(deletingQueue.id);
    if (result.success) {
      Alert.alert('🗑️ Deleted', 'Queue removed successfully');
      setShowDeleteModal(false);
      await loadQueues();
    } else {
      Alert.alert('Error', result.error || 'Failed to delete queue');
    }
    setDeletingQueue(null);
  };

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  const getFilterCount = (status: FilterType) => {
    if (status === 'all') return queues.length;
    return queues.filter(q => q.metadata?.status === status).length;
  };

  if (authLoading || loading || loadingQueues) {
    return (
      <SafeScreen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.red} />
          <Text style={styles.loadingText}>
            {authLoading ? 'Loading profile...' : 'Loading queues...'}
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

  return (
    <SafeScreen style={styles.container}>
      <StaffHeader
        title="My Queues"
        subtitle="Manage your created queues"
      />

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({getFilterCount('all')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Active ({getFilterCount('active')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'paused' && styles.filterTabActive]}
          onPress={() => setFilter('paused')}
        >
          <Text style={[styles.filterText, filter === 'paused' && styles.filterTextActive]}>
            Paused ({getFilterCount('paused')})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.red} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredQueues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <PhosphorIcon icon="Queue" size={40} color={COLORS.gray300} />
            <Text style={styles.emptyTitle}>No Queues Found</Text>
            <Text style={styles.emptySub}>
              {filter === 'all' ? 'Create your first queue from Dashboard' : `No ${filter} queues`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.createQueueBtn}
                onPress={() => router.push('/(staff)/dashboard')}
              >
                <PhosphorIcon icon="Plus" size={14} color={COLORS.white} weight="bold" />
                <Text style={styles.createQueueBtnText}>Go to Dashboard</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredQueues.map((queue) => {
            const metadata = queue.metadata || {};
            const creatorName = queue.creator_name || metadata.created_by_name || (queue.user as any)?.name || 'Unknown Staff';

            return (
              <View key={queue.id} style={styles.queueCard}>
                <View style={styles.queueHeader}>
                  <View style={styles.queueHeaderLeft}>
                    <View style={styles.queueIcon}>
                      <PhosphorIcon icon="Queue" size={14} color={COLORS.red} weight="bold" />
                    </View>
                    <View>
                      <Text style={styles.queueName}>{metadata.name || 'Unnamed Queue'}</Text>
                      <Text style={styles.queueDate}>Created {formatDate(queue.created_at)}</Text>
                      <Text style={styles.queueCreator}>
                        <PhosphorIcon icon="User" size={10} color={COLORS.gray400} weight="bold" />
                        {' '}by {creatorName}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.queueActions}>
                    <TouchableOpacity
                      style={styles.queueActionBtn}
                      onPress={() => handleEditQueue(queue)}
                    >
                      <PhosphorIcon icon="Pencil" size={14} color={COLORS.blue} weight="bold" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.queueActionBtn, styles.deleteActionBtn]}
                      onPress={() => handleDeleteQueue(queue)}
                    >
                      <PhosphorIcon icon="Trash" size={14} color={COLORS.red} weight="bold" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.queueStats}>
                  <View style={styles.queueStat}>
                    <PhosphorIcon icon="Clock" size={11} color={COLORS.gray400} />
                    <Text style={styles.queueStatText}>
                      {metadata.estimatedWait || 15} min
                    </Text>
                  </View>
                  <View style={styles.queueStat}>
                    <PhosphorIcon icon="Users" size={11} color={COLORS.gray400} />
                    <Text style={styles.queueStatText}>
                      {metadata.capacity || 50}
                    </Text>
                  </View>
                  <View style={[styles.queueStat, styles.queueStatusBadge]}>
                    <View style={[styles.statusDot, { backgroundColor: metadata.status === 'active' ? COLORS.green : COLORS.gray400 }]} />
                    <Text style={styles.queueStatText}>
                      {metadata.status === 'active' ? 'Active' : 'Paused'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Edit Queue Bottom Sheet */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle}>
              <View style={styles.modalHandleBar} />
            </View>

            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIconEdit}>
                <PhosphorIcon icon="Pencil" size={18} color={COLORS.white} weight="bold" />
              </View>
              <Text style={styles.modalTitle}>Edit Queue</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowEditModal(false)}
              >
                <PhosphorIcon icon="X" size={18} color={COLORS.gray400} />
              </TouchableOpacity>
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
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={styles.inputLabel}>Est. Wait (mins)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="15"
                    placeholderTextColor={COLORS.gray400}
                    value={editWait}
                    onChangeText={setEditWait}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={styles.inputLabel}>Capacity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="50"
                    placeholderTextColor={COLORS.gray400}
                    value={editCapacity}
                    onChangeText={setEditCapacity}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalUpdateBtn]}
                onPress={handleUpdateQueue}
                activeOpacity={0.8}
              >
                <Text style={styles.modalUpdateBtnText}>Update Queue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Bottom Sheet */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDeleteModal(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle}>
              <View style={styles.modalHandleBar} />
            </View>

            <View style={styles.deleteContent}>
              <View style={styles.deleteIcon}>
                <PhosphorIcon icon="Trash" size={28} color={COLORS.red} weight="bold" />
              </View>
              <Text style={styles.deleteTitle}>Delete Queue?</Text>
              <Text style={styles.deleteSub}>
                This will permanently remove "{deletingQueue?.metadata?.name || 'this queue'}" and all its data.
              </Text>

              <View style={styles.deleteActions}>
                <TouchableOpacity
                  style={[styles.deleteBtn, styles.deleteCancelBtn]}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={styles.deleteCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteBtn, styles.deleteConfirmBtn]}
                  onPress={confirmDelete}
                >
                  <PhosphorIcon icon="Trash" size={14} color={COLORS.white} weight="bold" />
                  <Text style={styles.deleteConfirmText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: COLORS.red,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  accessTitle: { fontSize: 24, fontWeight: '800', color: COLORS.gray900 },
  accessSub: { fontSize: 14, color: COLORS.gray500, textAlign: 'center' },
  accessButton: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  accessButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 6,
  },
  filterTabActive: {
    backgroundColor: COLORS.red,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  scroll: { flex: 1 },
  content: { padding: 12, paddingBottom: 40 },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.gray400,
    textAlign: 'center',
  },
  createQueueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.red,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  createQueueBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  queueCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 0.5,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  queueHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queueIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: COLORS.redLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  queueDate: {
    fontSize: 9,
    color: COLORS.gray400,
    marginTop: 1,
  },
  queueCreator: {
    fontSize: 9,
    color: COLORS.gray400,
    marginTop: 1,
  },
  queueActions: {
    flexDirection: 'row',
    gap: 4,
  },
  queueActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: COLORS.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionBtn: {
    backgroundColor: '#FEF2F2',
  },
  queueStats: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  queueStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  queueStatText: {
    fontSize: 10,
    color: COLORS.gray500,
  },
  queueStatusBadge: {
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingBottom: 26,
    paddingTop: 4,
  },
  modalHandle: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalHandleBar: {
    width: 32,
    height: 3,
    backgroundColor: COLORS.gray200,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 2,
  },
  modalHeaderIconEdit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gray900,
    marginLeft: 8,
  },
  modalClose: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    gap: 10,
  },
  inputGroup: {
    marginBottom: 2,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.gray500,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },
  inputRow: {
    flexDirection: 'row',
  },
  modalUpdateBtn: {
    backgroundColor: COLORS.blue,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  modalUpdateBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteContent: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  deleteIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  deleteSub: {
    fontSize: 11,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: 2,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  deleteCancelBtn: {
    backgroundColor: COLORS.gray100,
  },
  deleteCancelText: {
    color: COLORS.gray600,
    fontWeight: '600',
    fontSize: 12,
  },
  deleteConfirmBtn: {
    backgroundColor: COLORS.red,
  },
  deleteConfirmText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
});