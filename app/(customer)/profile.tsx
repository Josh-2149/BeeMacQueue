// app/(customer)/profile.tsx
import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, RefreshControl,
  ActionSheetIOS, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { useQueueContext } from '../../context/QueueContext';
import { SafeScreen } from '../../components/SafeScreen';
import { CustomerHeader } from '../../components/CustomerHeader';
import { COLORS } from '../../lib/constants';
import { PhosphorIcon } from '../../components/PhosphorIcon';
import { RemoteImage } from '../../components/RemoteImage';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

console.log('👤 [Customer Profile] Screen mounted');

interface ProfileStats {
  totalJoined: number;
  completed: number;
  cancelled: number;
}

function MenuItem({
  icon, label, sub, onPress, danger,
}: {
  icon: string; label: string; sub?: string;
  onPress: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, danger && styles.menuItemDanger]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <PhosphorIcon icon={icon as any} size={20} color={danger ? COLORS.red : COLORS.gray600} weight="bold" />
      </View>
      <View style={styles.menuInfo}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      {!danger && <PhosphorIcon icon="CaretRight" size={16} color={COLORS.gray300} weight="bold" />}
    </TouchableOpacity>
  );
}

export default function CustomerProfileScreen() {
  console.log('👤 [Customer Profile] Rendering');
  const router = useRouter();
  const { user, profile, signOut, updateProfile, updatePassword, uploadAvatar } = useAuth();
  const { activeQueue, history } = useQueueContext();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  
  const [editModal, setEditModal] = useState(false);
  const [passModal, setPassModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [passError, setPassError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({ totalJoined: 0, completed: 0, cancelled: 0 });
  const [avatarCacheBuster, setAvatarCacheBuster] = useState(Date.now());

  useEffect(() => {
    const totalJoined = history.length + (activeQueue ? 1 : 0);
    const completed = history.filter(e => e.status === 'completed').length;
    const cancelled = history.filter(e => e.status === 'cancelled').length;
    setStats({ totalJoined, completed, cancelled });
  }, [activeQueue, history]);

  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarCacheBuster(Date.now());
    }
  }, [profile?.avatar_url]);

  const avatarUri = profile?.avatar_url
    ? `${profile.avatar_url.split('?t=')[0]}?t=${avatarCacheBuster}`
    : null;

  async function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }

  async function handlePickImage() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery', 'Remove Photo'],
          destructiveButtonIndex: 3, cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) await openCamera();
          if (buttonIndex === 2) await openGallery();
          if (buttonIndex === 3) await removeAvatar();
        }
      );
    } else {
      const choice = await showConfirm({
        title: 'Profile Picture',
        message: 'Choose an option',
        options: [
          { label: 'Cancel', style: 'cancel' },
          { label: 'Take Photo' },
          { label: 'Choose from Gallery' },
          { label: 'Remove Photo', style: 'destructive' },
        ],
      });

      if (choice === 'Take Photo') await openCamera();
      if (choice === 'Choose from Gallery') await openGallery();
      if (choice === 'Remove Photo') await removeAvatar();
    }
  }

  async function openCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast({ title: 'Permission needed', message: 'Please allow camera access.', variant: 'warning' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) await uploadImage(result.assets[0].uri);
  }

  async function openGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ title: 'Permission needed', message: 'Please allow photo library access.', variant: 'warning' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) await uploadImage(result.assets[0].uri);
  }

  async function uploadImage(uri: string) {
    setUploading(true);
    const url = await uploadAvatar(uri);
    if (url) {
      setAvatarCacheBuster(Date.now());
      showToast({ title: 'Success', message: 'Profile picture updated!', variant: 'success' });
    } else {
      showToast({ title: 'Error', message: 'Failed to upload profile picture.', variant: 'error' });
    }
    setUploading(false);
  }

  async function removeAvatar() {
    const choice = await showConfirm({
      title: 'Remove Photo',
      message: 'Are you sure you want to remove your profile photo?',
      options: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Remove', style: 'destructive' },
      ],
    });

    if (choice !== 'Remove') return;

    setUploading(true);
    const result = await updateProfile({ avatar_url: '' } as any);
    if (result.success) {
      setAvatarCacheBuster(Date.now());
      showToast({ title: 'Success', message: 'Profile picture removed.', variant: 'success' });
    }
    setUploading(false);
  }

  async function handleLogout() {
    const choice = await showConfirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      options: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Sign Out', style: 'destructive' },
      ],
    });

    if (choice !== 'Sign Out') return;
    await signOut();
    router.replace('/(auth)/login');
  }

  async function handleSaveProfile() {
    if (!editName.trim()) { showToast({ title: 'Error', message: 'Please enter your name', variant: 'error' }); return; }
    setSaving(true);
    const updates: any = { name: editName.trim() };
    if (editPhone.trim()) updates.phone_number = editPhone.trim();
    const result = await updateProfile(updates);
    setSaving(false);
    if (result.success) { setEditModal(false); showToast({ title: 'Success', message: 'Profile updated!', variant: 'success' }); }
    else showToast({ title: 'Error', message: result.error || 'Could not update profile.', variant: 'error' });
  }

  async function handleChangePassword() {
    setPassError('');
    if (!currentPass || !newPass || !confirmPass) { setPassError('Please fill in all fields.'); return; }
    if (newPass !== confirmPass) { setPassError('Passwords do not match.'); return; }
    if (newPass.length < 6) { setPassError('At least 6 characters.'); return; }
    setSaving(true);
    const { success, error } = await updatePassword(newPass);
    setSaving(false);
    if (success) {
      setPassModal(false); setCurrentPass(''); setNewPass(''); setConfirmPass('');
      showToast({ title: 'Success', message: 'Password changed!', variant: 'success' });
    } else setPassError(error || 'Could not update password.');
  }

  if (!profile) {
    return (
      <SafeScreen style={styles.container}>
        <CustomerHeader title="Profile" subtitle="Manage your account" />
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.red} /></View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.container}>
      <CustomerHeader title="Profile" subtitle="Manage your account" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.red} />}>
        <View style={styles.avatarCard}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage} disabled={uploading} activeOpacity={0.7}>
            <View style={styles.avatarCircle}>
              {uploading ? <ActivityIndicator color={COLORS.white} size="large" />
              : avatarUri ? <RemoteImage key={`avatar-${avatarCacheBuster}`} uri={avatarUri} style={styles.avatarImage} contentFit="cover" onError={(err) => console.log('Avatar load error:', err)} />
              : <PhosphorIcon icon="UserCircle" size={52} color={COLORS.white} weight="fill" />}
            </View>
            <View style={styles.cameraBadge}><PhosphorIcon icon="NotePencil" size={14} color={COLORS.white} weight="bold" /></View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
          <Text style={styles.avatarName}>{profile?.name ?? 'User'}</Text>
          <Text style={styles.avatarEmail}>{profile?.email ?? user?.email}</Text>
          <View style={styles.infoPillsRow}>
            <View style={styles.infoPill}>
              <PhosphorIcon icon="Phone" size={16} color={COLORS.gray500} />
              <Text style={styles.infoPillValue} numberOfLines={1}>
                {profile.phone_number || 'Not set'}
              </Text>
            </View>
            <View style={styles.infoPill}>
              <PhosphorIcon icon="User" size={16} color={COLORS.gray500} />
              <Text style={styles.infoPillValue} numberOfLines={1}>
                Customer
              </Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <PhosphorIcon icon="Queue" size={16} color={COLORS.blue} weight="fill" />
              <Text style={styles.statNum}>{stats.totalJoined}</Text>
              <Text style={styles.statLabel}>Total{'\n'}Joined</Text>
            </View>
            <View style={styles.statBox}>
              <PhosphorIcon icon="CheckCircle" size={16} color={COLORS.green} weight="fill" />
              <Text style={[styles.statNum, { color: COLORS.green }]}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <PhosphorIcon icon="XCircle" size={16} color={COLORS.red} weight="fill" />
              <Text style={[styles.statNum, { color: COLORS.red }]}>{stats.cancelled}</Text>
              <Text style={styles.statLabel}>Cancelled</Text>
            </View>
          </View>
        </View>
        {history.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Queue History</Text>
            <View style={styles.historyCard}>
              {history.slice(0, 3).map((entry, i) => {
                const isCompleted = entry.status === 'completed';
                const isCancelled = entry.status === 'cancelled';
                return (
                  <View key={entry.id}>
                    {i > 0 && <View style={styles.historyDivider} />}
                    <View style={styles.historyRow}>
                      <View style={[styles.historyDot, { backgroundColor: isCompleted ? COLORS.green : COLORS.red }]} />
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyName} numberOfLines={1}>
                          #{entry.ticket_number} {entry.queue?.name || 'Queue'}
                        </Text>
                        <Text style={styles.historyMeta}>
                          {entry.establishment?.name || ''} · {new Date(entry.created_at).toLocaleDateString('en-PH', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </Text>
                      </View>
                      <View style={[styles.historyBadge, { backgroundColor: isCompleted ? COLORS.greenLight : COLORS.redLight }]}>
                        <Text style={[styles.historyBadgeText, { color: isCompleted ? COLORS.green : COLORS.red }]}>
                          {isCompleted ? 'Completed' : 'Cancelled'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
        <Text style={styles.sectionLabel}>Account Settings</Text>
        <MenuItem icon="NotePencil" label="Edit Profile" sub="Change your name and phone number" onPress={() => { setEditName(profile?.name ?? ''); setEditPhone(profile?.phone_number ?? ''); setEditModal(true); }} />
        <MenuItem icon="Lock" label="Change Password" sub="Update your password" onPress={() => setPassModal(true)} />
        <Text style={styles.sectionLabel}>App Info</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}><PhosphorIcon icon="AppWindow" size={16} color={COLORS.gray500} weight="bold" /><Text style={styles.infoLabel}>Version 1.0.0 (Build 1)</Text></View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}><PhosphorIcon icon="Shield" size={16} color={COLORS.gray500} weight="bold" /><Text style={styles.infoLabel}>BeeMacQueue CDO</Text></View>
        </View>
        <Text style={styles.sectionLabel}>Session</Text>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <PhosphorIcon icon="SignOut" size={20} color={COLORS.white} weight="bold" /><Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setEditModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle}><View style={styles.modalHandleBar} /></View>
            <View style={styles.modalHeader}>
              <View style={[styles.modalHeaderIcon, { backgroundColor: COLORS.blue }]}><PhosphorIcon icon="NotePencil" size={22} color={COLORS.white} weight="bold" /></View>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setEditModal(false)}><PhosphorIcon icon="X" size={20} color={COLORS.gray400} weight="bold" /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor={COLORS.gray400} autoFocus />
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} placeholder="+639171234567" placeholderTextColor={COLORS.gray400} keyboardType="phone-pad" />
              <TouchableOpacity style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]} onPress={handleSaveProfile} disabled={saving} activeOpacity={0.8}>
                {saving ? <ActivityIndicator color={COLORS.white} /> : <><PhosphorIcon icon="Check" size={18} color={COLORS.white} weight="bold" /><Text style={styles.modalSaveBtnText}>Save Changes</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={passModal} transparent animationType="slide" onRequestClose={() => setPassModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPassModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle}><View style={styles.modalHandleBar} /></View>
            <View style={styles.modalHeader}>
              <View style={[styles.modalHeaderIcon, { backgroundColor: COLORS.orange }]}><PhosphorIcon icon="Lock" size={22} color={COLORS.white} weight="bold" /></View>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setPassModal(false)}><PhosphorIcon icon="X" size={20} color={COLORS.gray400} weight="bold" /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {passError ? <View style={styles.errorBanner}><PhosphorIcon icon="WarningCircle" size={16} color={COLORS.red} weight="fill" /><Text style={styles.errText}>{passError}</Text></View> : null}
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput style={styles.input} value={currentPass} onChangeText={setCurrentPass} placeholder="Enter current password" placeholderTextColor={COLORS.gray400} secureTextEntry />
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput style={styles.input} value={newPass} onChangeText={setNewPass} placeholder="At least 6 characters" placeholderTextColor={COLORS.gray400} secureTextEntry />
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput style={styles.input} value={confirmPass} onChangeText={setConfirmPass} placeholder="Repeat new password" placeholderTextColor={COLORS.gray400} secureTextEntry />
              <TouchableOpacity style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={saving} activeOpacity={0.8}>
                {saving ? <ActivityIndicator color={COLORS.white} /> : <><PhosphorIcon icon="Check" size={18} color={COLORS.white} weight="bold" /><Text style={styles.modalSaveBtnText}>Update Password</Text></>}
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
  avatarCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: COLORS.gray100 },
  avatarWrapper: { position: 'relative', marginBottom: 8 },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white },
  avatarHint: { fontSize: 12, color: COLORS.gray400, fontWeight: '500', marginBottom: 8 },
  avatarName: { fontSize: 20, fontWeight: '800', color: COLORS.gray900, marginBottom: 4 },
  avatarEmail: { fontSize: 13, color: COLORS.gray500, marginBottom: 4 },
  infoPillsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  infoPill: { flex: 1, backgroundColor: COLORS.gray50, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', gap: 4 },
  infoPillValue: { fontSize: 10, fontWeight: '600', color: COLORS.gray700, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.gray100, gap: 8 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: COLORS.gray50, borderRadius: 10, gap: 4 },
  statNum: { fontSize: 18, fontWeight: '900', color: COLORS.blue },
  statLabel: { fontSize: 9, color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600', textAlign: 'center', lineHeight: 12 },
  historyCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 8 },
  historyDivider: { height: 1, backgroundColor: COLORS.gray100, marginVertical: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
  historyDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 13, fontWeight: '700', color: COLORS.gray900 },
  historyMeta: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  historyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  historyBadgeText: { fontSize: 10, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray400, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 6 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8 },
  menuItemDanger: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  menuIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuIconDanger: { backgroundColor: '#FEE2E2' },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  menuLabelDanger: { color: COLORS.red },
  menuSub: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  infoCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8, gap: 10 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoDivider: { height: 1, backgroundColor: COLORS.gray100 },
  infoLabel: { fontSize: 14, color: COLORS.gray700, fontWeight: '500' },
  signOutBtn: { backgroundColor: COLORS.red, borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 4 },
  signOutText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 30, paddingTop: 6 },
  modalHandle: { alignItems: 'center', paddingVertical: 8 },
  modalHandleBar: { width: 40, height: 4, backgroundColor: COLORS.gray200, borderRadius: 2 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingTop: 2 },
  modalHeaderIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: COLORS.gray900, marginLeft: 12 },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center' },
  modalBody: { gap: 14 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray600, marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 13, fontSize: 15, color: COLORS.gray900, backgroundColor: COLORS.white },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.redLight, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.redBorder },
  errText: { fontSize: 13, color: COLORS.red, fontWeight: '600', flex: 1 },
  modalSaveBtn: { backgroundColor: COLORS.red, borderRadius: 12, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 6 },
  modalSaveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});