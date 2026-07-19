import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useStaffQueueContext } from '../../context/StaffQueueContext';
import { SafeScreen } from '../../components/SafeScreen';
import { StaffHeader } from '../../components/StaffHeader';
import { COLORS } from '../../lib/constants';
import { PhosphorIcon } from '../../components/PhosphorIcon';

console.log('🏪 [Staff Profile] Screen mounted');

function MenuItem({
  icon, label, sub, onPress, danger,
}: {
  icon: string; label: string; sub?: string;
  onPress: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.menuItem, danger && styles.menuItemDanger]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <PhosphorIcon icon={icon as any} size={20} color={danger ? COLORS.red : COLORS.gray500} weight="bold" />
      </View>
      <View style={styles.menuInfo}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      {!danger && <PhosphorIcon icon="CaretRight" size={16} color={COLORS.gray300} />}
    </TouchableOpacity>
  );
}

export default function StaffProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { queueTemplates } = useStaffQueueContext();
  const [editModal, setEditModal] = useState(false);
  const [passModal, setPassModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [passError, setPassError] = useState('');

  const initial = (profile?.name ?? 'U')[0].toUpperCase();

  async function handleLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => { await signOut(); router.replace('/(auth)/login'); },
      },
    ]);
  }

  async function handleSaveProfile() {
    if (!editName.trim()) { Alert.alert('Enter your name'); return; }
    setSaving(true);
    // Your update logic here
    setSaving(false);
    setEditModal(false);
    Alert.alert('Profile updated!');
  }

  async function handleChangePassword() {
    setPassError('');
    if (!newPass || !confirmPass) { setPassError('Fill in all fields.'); return; }
    if (newPass !== confirmPass) { setPassError('Passwords do not match.'); return; }
    if (newPass.length < 6) { setPassError('At least 6 characters required.'); return; }
    setSaving(true);
    // Your password update logic here
    setSaving(false);
    setPassModal(false);
    setNewPass('');
    setConfirmPass('');
    Alert.alert('Password changed!');
  }

  if (!profile) {
    return (
      <SafeScreen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.red} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.container}>
      <StaffHeader
        title="Profile"
        subtitle={profile?.name}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Card – white with shadow, not blending with header */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.avatarName}>{profile?.name ?? 'User'}</Text>
          <Text style={styles.avatarEmail}>{profile?.email ?? user?.email}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{queueTemplates?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Queues Created</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <View style={styles.staffBadge}>
                <PhosphorIcon icon="Shield" size={14} color={COLORS.yellow} weight="fill" />
                <Text style={styles.staffBadgeText}>Staff</Text>
              </View>
              <Text style={styles.statLabel}>Role</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Account Settings</Text>
        <MenuItem
          icon="Pencil" label="Edit Name" sub="Change your display name"
          onPress={() => { setEditName(profile?.name ?? ''); setEditModal(true); }}
        />
        <MenuItem
          icon="Lock" label="Change Password" sub="Update your password"
          onPress={() => setPassModal(true)}
        />

        <Text style={styles.sectionLabel}>Branch Information</Text>
        <View style={styles.branchInfo}>
          <View style={styles.branchItem}>
            <PhosphorIcon icon="Storefront" size={16} color={COLORS.gray500} />
            <Text style={styles.branchLabel}>Brand: {profile?.brand}</Text>
          </View>
          <View style={styles.branchItem}>
            <PhosphorIcon icon="MapPin" size={16} color={COLORS.gray500} />
            <Text style={styles.branchLabel}>Branch: {profile?.branch}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Session</Text>
        <MenuItem icon="SignOut" label="Sign Out" onPress={handleLogout} danger />
      </ScrollView>

      {/* Edit Name Bottom Sheet (unchanged) */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setEditModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle}>
              <View style={styles.modalHandleBar} />
            </View>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIconEdit}>
                <PhosphorIcon icon="Pencil" size={22} color={COLORS.white} weight="bold" />
              </View>
              <Text style={styles.modalTitle}>Edit Name</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setEditModal(false)}>
                <PhosphorIcon icon="X" size={20} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={COLORS.gray400}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <PhosphorIcon icon="Check" size={18} color={COLORS.white} weight="bold" />
                    <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Bottom Sheet (unchanged) */}
      <Modal visible={passModal} transparent animationType="slide" onRequestClose={() => setPassModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPassModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle}>
              <View style={styles.modalHandleBar} />
            </View>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIconLock}>
                <PhosphorIcon icon="Lock" size={22} color={COLORS.white} weight="bold" />
              </View>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setPassModal(false)}>
                <PhosphorIcon icon="X" size={20} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {passError ? <Text style={styles.errText}>{passError}</Text> : null}
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPass}
                onChangeText={setNewPass}
                placeholder="At least 6 characters"
                placeholderTextColor={COLORS.gray400}
                secureTextEntry
              />
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPass}
                onChangeText={setConfirmPass}
                placeholder="Repeat new password"
                placeholderTextColor={COLORS.gray400}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
                onPress={handleChangePassword}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <PhosphorIcon icon="Check" size={18} color={COLORS.white} weight="bold" />
                    <Text style={styles.modalSaveBtnText}>Update Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },

  // NEW avatar card (white, elevated)
  avatarCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  avatarEmail: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
  },
  stat: {
    alignItems: 'center',
    marginHorizontal: 14,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.red,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  statDiv: {
    width: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 4,
  },
  staffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.redLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  staffBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.red,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray400,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 14,
  },
  branchInfo: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 6,
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  branchLabel: {
    fontSize: 14,
    color: COLORS.gray700,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  menuItemDanger: {
    backgroundColor: '#FEF2F2',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuIconDanger: {
    backgroundColor: '#FEE2E2',
  },
  menuInfo: { flex: 1 },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  menuLabelDanger: {
    color: COLORS.red,
  },
  menuSub: {
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHandle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 2,
  },
  modalHeaderIconEdit: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderIconLock: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.gray900,
    marginLeft: 10,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    gap: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray600,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },
  errText: {
    fontSize: 13,
    color: COLORS.red,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: COLORS.red,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  modalSaveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});