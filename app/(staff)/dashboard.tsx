import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useStaffQueueContext } from '../../context/StaffQueueContext';
import { useNotification } from '../../context/NotificationContext';
import { SafeScreen } from '../../components/SafeScreen';
import { StaffStatsCard } from '../../components/StaffStatsCard';
import { StaffQueueCard } from '../../components/StaffQueueCard';
import { SectionLabel } from '../../components/ui';
import { StaffHeader } from '../../components/StaffHeader';
import { COLORS } from '../../lib/constants';
import { PhosphorIcon } from '../../components/PhosphorIcon';

console.log('🏪 [Staff Dashboard] Screen mounted');

const ESTIMATED_TIMES = [5, 10, 15, 20, 25, 30, 45, 60];

export default function StaffDashboardScreen() {
  console.log('🏪 [Staff Dashboard] Rendering');
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'waiting' | 'serving' | 'completed'>('waiting');
  const [templatesExpanded, setTemplatesExpanded] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [queueName, setQueueName] = useState('');
  const [estimatedWait, setEstimatedWait] = useState('15');
  const [capacity, setCapacity] = useState('50');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  console.log('[DEBUG] Modal visible:', showCreateModal);
  console.log('[DEBUG] Dropdown visible:', showTimeDropdown);
  console.log('[DEBUG] Selected time:', estimatedWait);

  const {
    waitingList,
    servingList,
    servedList,
    queueTemplates,
    stats,
    establishment,
    loading: queueLoading,
    processing,
    creating,
    error,
    serveNext,
    markServed,
    callCustomer,
    cancelCustomer,
    refresh,
    createQueue,
    getQueues,
  } = useStaffQueueContext();

  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'staff') {
      console.log('🏪 [Staff Dashboard] 🚫 Not staff, redirecting');
      Alert.alert('Access Denied', 'Staff only area');
      router.replace('/(customer)/home');
    }
  }, [profile, authLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    await getQueues();
    setRefreshing(false);
  };

  const handleServeNext = async () => {
    const success = await serveNext();
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

  const handleCreateQueue = async () => {
    if (!queueName.trim()) {
      Alert.alert('Error', 'Please enter a queue name');
      return;
    }

    const result = await createQueue({
      name: queueName.trim(),
      estimatedWait: parseInt(estimatedWait) || 15,
      capacity: parseInt(capacity) || 50,
      status: 'active',
    });

    if (result.success) {
      Alert.alert('✅ Queue Created!', `"${queueName}" queue is now active.`);
      setShowCreateModal(false);
      setQueueName('');
      setEstimatedWait('15');
      setCapacity('50');

      console.log('🔔 Sending notification for queue creation');
      await addNotification({
        user_id: profile?.id || '',
        title: '📋 New Queue Created!',
        message: `Queue "${queueName.trim()}" has been opened and is ready for customers. (${capacity} capacity, ~${estimatedWait}min wait)`,
        type: 'queue',
        priority: 'high',
        metadata: {
          queue_name: queueName.trim(),
          estimated_wait: parseInt(estimatedWait) || 15,
          capacity: parseInt(capacity) || 50,
        }
      });

      await refresh();
      await getQueues();
    } else {
      Alert.alert('Error', result.error || 'Failed to create queue');
    }
  };

  const getCurrentList = () => {
    switch (selectedTab) {
      case 'waiting': return waitingList;
      case 'serving': return servingList;
      case 'completed': return servedList;
      default: return waitingList;
    }
  };

  const getEmptyMessage = () => {
    switch (selectedTab) {
      case 'waiting': return { icon: 'Clock', title: 'No waiting customers', sub: 'Great! All caught up.' };
      case 'serving': return { icon: 'UserCircle', title: 'No one being served', sub: 'Start serving the next customer.' };
      case 'completed': return { icon: 'CheckCircle', title: 'No completed customers yet', sub: 'Completed customers will appear here.' };
      default: return { icon: 'List', title: 'Empty', sub: '' };
    }
  };

  const getSectionLabel = () => {
    if (selectedTab === 'waiting') return 'Waiting Queue';
    if (selectedTab === 'serving') return 'Currently Serving';
    return 'Completed Customers';
  };

  const getTemplateIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('vip')) return 'Star';
    if (lower.includes('express')) return 'Rocket';
    if (lower.includes('regular')) return 'Users';
    if (lower.includes('priority')) return 'Crown';
    return 'Queue';
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const currentList = getCurrentList();
  const emptyState = getEmptyMessage();

  return (
    <SafeScreen style={styles.container}>
      <StaffHeader
        title="Dashboard"
        subtitle={`${establishment?.name || 'No branch'} · ${establishment?.branch || ''}\n${profile.name}`}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.red} />}
        showsVerticalScrollIndicator={false}
      >
        <StaffStatsCard stats={stats} onServeNext={handleServeNext} processing={processing} />

        {queueTemplates && queueTemplates.length > 0 && (
          <View style={styles.templatesSection}>
            <TouchableOpacity
              style={styles.templatesHeader}
              onPress={() => setTemplatesExpanded(!templatesExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.templatesHeaderLeft}>
                <PhosphorIcon icon="Queue" size={16} color={COLORS.blue} weight="bold" />
                <Text style={styles.templatesTitle}>Active Queues</Text>
                <View style={styles.templatesCount}>
                  <Text style={styles.templatesCountText}>{queueTemplates.length}</Text>
                </View>
              </View>
              <PhosphorIcon
                icon={templatesExpanded ? 'CaretUp' : 'CaretDown'}
                size={16}
                color={COLORS.gray500}
                weight="bold"
              />
            </TouchableOpacity>

            {templatesExpanded && (
              <>
                <Text style={styles.templatesSub}>
                  Queue templates available for customers to join
                </Text>

                {queueTemplates.map((template: any) => {
                  const notes = template.metadata || {};
                  const name = notes.name || template.name || 'Unnamed Queue';
                  const icon = getTemplateIcon(name);
                  const creatorName = notes.created_by_name || template.creator_name || template.user?.name || 'Unknown Staff';
                  const isActive = notes.status === 'active' || notes.status === undefined;

                  return (
                    <View key={template.id} style={styles.templateCard}>
                      <View style={styles.templateCardHeader}>
                        <View style={styles.templateIconContainer}>
                          <PhosphorIcon icon={icon as any} size={18} color={COLORS.blue} weight="bold" />
                        </View>
                        <View style={styles.templateInfo}>
                          <Text style={styles.templateName}>{name}</Text>
                          <View style={styles.templateMetaRow}>
                            <PhosphorIcon icon="User" size={10} color={COLORS.gray400} weight="bold" />
                            <Text style={styles.templateCreator}> Created by {creatorName}</Text>
                          </View>
                          <View style={styles.templateMetaRow}>
                            <PhosphorIcon icon="Calendar" size={10} color={COLORS.gray400} weight="bold" />
                            <Text style={styles.templateDate}> {formatDate(template.created_at)}</Text>
                          </View>
                        </View>
                        <View style={[styles.templateStatus, { backgroundColor: isActive ? COLORS.greenLight : COLORS.gray100 }]}>
                          <View style={[styles.templateStatusDot, { backgroundColor: isActive ? COLORS.green : COLORS.gray400 }]} />
                          <Text style={[styles.templateStatusText, { color: isActive ? COLORS.green : COLORS.gray500 }]}>
                            {isActive ? 'Active' : 'Paused'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.templateDetails}>
                        <View style={styles.templateDetail}>
                          <PhosphorIcon icon="Clock" size={12} color={COLORS.gray400} weight="bold" />
                          <Text style={styles.templateDetailText}>{notes.estimatedWait || 15} min wait</Text>
                        </View>
                        <View style={styles.templateDetail}>
                          <PhosphorIcon icon="Users" size={12} color={COLORS.gray400} weight="bold" />
                          <Text style={styles.templateDetailText}>{notes.capacity || 50} capacity</Text>
                        </View>
                      </View>

                      <View style={styles.templateReadOnly}>
                        <PhosphorIcon icon="Info" size={10} color={COLORS.gray400} weight="bold" />
                        <Text style={styles.templateReadOnlyText}>Manage in My Queue tab</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'waiting' && styles.tabActive]}
            onPress={() => setSelectedTab('waiting')}
          >
            <View style={styles.tabContent}>
              <PhosphorIcon icon="Clock" size={13} color={selectedTab === 'waiting' ? COLORS.white : COLORS.gray500} weight={selectedTab === 'waiting' ? 'bold' : 'regular'} />
              <Text style={[styles.tabText, selectedTab === 'waiting' && styles.tabTextActive]}>
                Waiting ({stats.totalWaiting})
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'serving' && styles.tabActive]}
            onPress={() => setSelectedTab('serving')}
          >
            <View style={styles.tabContent}>
              <PhosphorIcon icon="UserCircle" size={13} color={selectedTab === 'serving' ? COLORS.white : COLORS.gray500} weight={selectedTab === 'serving' ? 'bold' : 'regular'} />
              <Text style={[styles.tabText, selectedTab === 'serving' && styles.tabTextActive]}>
                Serving ({stats.totalServing})
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
            onPress={() => setSelectedTab('completed')}
          >
            <View style={styles.tabContent}>
              <PhosphorIcon icon="CheckCircle" size={13} color={selectedTab === 'completed' ? COLORS.white : COLORS.gray500} weight={selectedTab === 'completed' ? 'fill' : 'regular'} />
              <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
                Completed ({stats.totalServed})
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <SectionLabel>{getSectionLabel()}</SectionLabel>

        {currentList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <PhosphorIcon icon={emptyState.icon as any} size={36} color={COLORS.gray300} />
            <Text style={styles.emptyTitle}>{emptyState.title}</Text>
            <Text style={styles.emptySub}>{emptyState.sub}</Text>
          </View>
        ) : (
          currentList.map((entry) => {
            let queueIcon = 'Clock';
            const notes = entry.notes ? JSON.parse(entry.notes) : {};
            const name = notes.name || '';
            if (name.toLowerCase().includes('vip')) queueIcon = 'Star';
            else if (name.toLowerCase().includes('express')) queueIcon = 'Rocket';
            else if (name.toLowerCase().includes('regular')) queueIcon = 'Users';
            else if (name.toLowerCase().includes('priority')) queueIcon = 'Crown';

            return (
              <StaffQueueCard
                key={entry.id}
                entry={entry}
                queueIcon={queueIcon}
                onServe={() => handleServeNext()}
                onCall={() => handleCallCustomer(entry.id)}
                onCancel={() => handleCancelCustomer(entry.id)}
                onMarkServed={() => handleMarkServed(entry.id)}
                showActions={selectedTab !== 'completed'}
              />
            );
          })
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>BeeMacQueue CDO · Staff Portal</Text>
          <Text style={styles.footerSub}>Real-time queue management</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.createFab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <PhosphorIcon icon="Plus" size={28} color={COLORS.white} weight="bold" />
      </TouchableOpacity>

      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowCreateModal(false);
              setShowTimeDropdown(false);
            }}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle}>
              <View style={styles.modalHandleBar} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Queue</Text>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Queue Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Regular, Express, VIP"
                  placeholderTextColor={COLORS.gray400}
                  value={queueName}
                  onChangeText={setQueueName}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Est. Wait (mins)</Text>
                  <TouchableOpacity
                    style={styles.dropdownInput}
                    onPress={() => setShowTimeDropdown(!showTimeDropdown)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownText}>{estimatedWait} min</Text>
                    <PhosphorIcon icon="CaretDown" size={16} color={COLORS.gray500} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Capacity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="50"
                    placeholderTextColor={COLORS.gray400}
                    value={capacity}
                    onChangeText={setCapacity}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalCreateBtn, creating && styles.modalCreateBtnDisabled]}
                onPress={handleCreateQueue}
                disabled={creating}
                activeOpacity={0.8}
              >
                {creating ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalCreateBtnText}>Create Queue</Text>
                )}
              </TouchableOpacity>
            </View>

            {showTimeDropdown && (
              <View style={styles.dropdownContainer}>
                <View style={styles.dropdownList}>
                  <ScrollView
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {ESTIMATED_TIMES.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.dropdownItem,
                          parseInt(estimatedWait) === time && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setEstimatedWait(String(time));
                          setShowTimeDropdown(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          parseInt(estimatedWait) === time && styles.dropdownItemTextActive
                        ]}>
                          {time} min
                        </Text>
                        {parseInt(estimatedWait) === time && (
                          <PhosphorIcon icon="Check" size={16} color={COLORS.red} weight="bold" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
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
  scroll: { flex: 1 },
  content: { padding: 14, paddingBottom: 100 },

  templatesSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.blueBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 0.5,
  },
  templatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  templatesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  templatesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.blue,
  },
  templatesCount: {
    backgroundColor: COLORS.blueLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  templatesCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.blue,
  },
  templatesSub: {
    fontSize: 10,
    color: COLORS.gray400,
    marginLeft: 24,
    marginBottom: 10,
    marginTop: 2,
  },
  templateCard: {
    backgroundColor: COLORS.blueLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.blueBorder,
  },
  templateCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  templateIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  templateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  templateCreator: {
    fontSize: 9,
    color: COLORS.gray500,
  },
  templateDate: {
    fontSize: 9,
    color: COLORS.gray400,
  },
  templateStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  templateStatusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  templateStatusText: {
    fontSize: 8,
    fontWeight: '700',
  },
  templateDetails: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 36,
    marginBottom: 4,
  },
  templateDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  templateDetailText: {
    fontSize: 9,
    color: COLORS.gray500,
  },
  templateReadOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 36,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray200,
  },
  templateReadOnlyText: {
    fontSize: 8,
    color: COLORS.gray400,
    fontStyle: 'italic',
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.red,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray500,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  createFab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: COLORS.gray400,
    fontWeight: '600',
  },
  footerSub: {
    fontSize: 8,
    color: COLORS.gray300,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.gray400,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
    maxHeight: '90%',
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
    marginBottom: 20,
    paddingTop: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
    textAlign: 'center',
  },
  modalBody: {
    gap: 14,
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
  dropdownInput: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    padding: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.gray900,
  },
  dropdownContainer: {
    position: 'absolute',
    bottom: 170,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  dropdownList: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.blueLight,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.gray700,
  },
  dropdownItemTextActive: {
    color: COLORS.red,
    fontWeight: '700',
  },
  modalCreateBtn: {
    backgroundColor: COLORS.red,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalCreateBtnDisabled: {
    opacity: 0.6,
  },
  modalCreateBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});