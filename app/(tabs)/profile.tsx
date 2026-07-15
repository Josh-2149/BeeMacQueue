import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../lib/constants';

function MenuItem({
  icon, label, sub, onPress, danger,
}: {
  icon: string; label: string; sub?: string;
  onPress: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.menuIcon, { backgroundColor: danger ? '#FEF2F2' : COLORS.gray100 }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={styles.menuInfo}>
        <Text style={[styles.menuLabel, danger && { color: '#991B1B' }]}>{label}</Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      {!danger && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut, updateProfile, updatePassword } = useAuth();
  const [editModal, setEditModal] = useState(false);
  const [passModal, setPassModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [passError, setPassError] = useState('');

  const initial = (profile?.name ?? 'U')[0].toUpperCase();

  async function handleLogout() {
    Alert.alert('Sign out', 'Are you sure?', [
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
    const ok = await updateProfile({ name: editName.trim() });
    setSaving(false);
    if (ok) { setEditModal(false); Alert.alert('Profile updated!'); }
    else Alert.alert('Error', 'Could not update profile.');
  }

  async function handleChangePassword() {
    setPassError('');
    if (!newPass || !confirmPass) { setPassError('Fill in all fields.'); return; }
    if (newPass !== confirmPass) { setPassError('Passwords do not match.'); return; }
    if (newPass.length < 6) { setPassError('At least 6 characters required.'); return; }
    setSaving(true);
    const ok = await updatePassword(newPass);
    setSaving(false);
    if (ok) {
      setPassModal(false); setNewPass(''); setConfirmPass('');
      Alert.alert('Password changed!');
    } else Alert.alert('Error', 'Could not update password.');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.avatarName}>{profile?.name ?? 'User'}</Text>
          <Text style={styles.avatarEmail}>{profile?.email ?? user?.email}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile?.queues_joined ?? 0}</Text>
              <Text style={styles.statLabel}>Queues joined</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile?.role === 'admin' ? '🛡️' : '👤'}</Text>
              <Text style={styles.statLabel}>{profile?.role ?? 'customer'}</Text>
            </View>
          </View>
        </View>

        {profile?.role === 'admin' && (
          <>
            <Text style={styles.sectionLabel}>ADMIN</Text>
            <TouchableOpacity
              style={styles.adminShortcut}
              onPress={() => router.push('/(tabs)/admin')}
              activeOpacity={0.8}
            >
              <Text style={styles.adminShortcutIcon}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminShortcutTitle}>Admin Dashboard</Text>
                <Text style={styles.adminShortcutSub}>Manage queues & branches</Text>
              </View>
              <Text style={{ color: COLORS.red, fontSize: 20 }}>›</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <MenuItem
          icon="✏️" label="Edit Name" sub="Change your display name"
          onPress={() => { setEditName(profile?.name ?? ''); setEditModal(true); }}
        />
        <MenuItem
          icon="🔒" label="Change Password" sub="Update your password"
          onPress={() => setPassModal(true)}
        />

        <Text style={styles.sectionLabel}>SESSION</Text>
        <MenuItem icon="🚪" label="Sign Out" onPress={handleLogout} danger />
      </ScrollView>

      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Name</Text>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={styles.modalInput} value={editName} onChangeText={setEditName}
              placeholder="Your name" placeholderTextColor={COLORS.gray400} autoFocus
            />
            <TouchableOpacity
              style={[styles.btnPrimary, saving && { opacity: 0.6 }]}
              onPress={handleSaveProfile} disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.btnText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setEditModal(false)}>
              <Text style={styles.btnSecText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={passModal} transparent animationType="slide" onRequestClose={() => setPassModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Change Password</Text>
            {passError ? <Text style={styles.errText}>{passError}</Text> : null}
            <Text style={styles.inputLabel}>NEW PASSWORD</Text>
            <TextInput
              style={styles.modalInput} value={newPass} onChangeText={setNewPass}
              placeholder="At least 6 characters" placeholderTextColor={COLORS.gray400} secureTextEntry
            />
            <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              style={styles.modalInput} value={confirmPass} onChangeText={setConfirmPass}
              placeholder="Repeat new password" placeholderTextColor={COLORS.gray400} secureTextEntry
            />
            <TouchableOpacity
              style={[styles.btnPrimary, { marginTop: 14 }, saving && { opacity: 0.6 }]}
              onPress={handleChangePassword} disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.btnText}>Update Password</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => { setPassModal(false); setPassError(''); }}
            >
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
  header: { backgroundColor: COLORS.red, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  avatarCard: {
    backgroundColor: COLORS.red, borderRadius: 18, padding: 24,
    alignItems: 'center', marginBottom: 20,
  },
  avatarCircle: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.yellow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: 30, fontWeight: '900', color: COLORS.redDark },
  avatarName: { fontSize: 20, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  avatarEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 18 },
  statsRow: { flexDirection: 'row' },
  stat: { alignItems: 'center', marginHorizontal: 16 },
  statNum: { fontSize: 24, fontWeight: '900', color: COLORS.yellow },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray400, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  adminShortcut: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.redLight,
    borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: COLORS.redBorder,
  },
  adminShortcutIcon: { fontSize: 24, marginRight: 12 },
  adminShortcutTitle: { fontSize: 15, fontWeight: '800', color: COLORS.red },
  adminShortcutSub: { fontSize: 12, color: COLORS.redDark, opacity: 0.7, marginTop: 2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  menuIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  menuSub: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  chevron: { fontSize: 20, color: COLORS.gray300 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 44,
  },
  modalHandle: { width: 40, height: 5, backgroundColor: COLORS.gray200, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.gray900, marginBottom: 18 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray600, marginBottom: 6, letterSpacing: 0.5 },
  modalInput: {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10,
    padding: 13, fontSize: 14, color: COLORS.gray900, marginBottom: 14,
  },
  errText: { fontSize: 13, color: COLORS.red, fontWeight: '600', marginBottom: 12 },
  btnPrimary: { backgroundColor: COLORS.red, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 10 },
  btnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  btnSecondary: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnSecText: { color: COLORS.gray600, fontWeight: '700', fontSize: 15 },
});
