// app/(staff)/profile.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, RefreshControl,
  Image, ActionSheetIOS, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { SafeScreen } from '../../components/SafeScreen';
import { StaffHeader } from '../../components/StaffHeader';
import { COLORS } from '../../lib/constants';
import { PhosphorIcon } from '../../components/PhosphorIcon';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

console.log('🏪 [Staff Profile] Screen mounted');

interface StaffStats {
  servedToday: number;
  servedThisWeek: number;
  totalServed: number;
  avgRating: number;
}

type TeamMemberProfile = Profile & { last_active?: string | null };

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

export default function StaffProfileScreen() {
  console.log('🏪 [Staff Profile] Rendering');
  const router = useRouter();
  const { user, profile, signOut, updateProfile, updatePassword, uploadAvatar, refreshProfile } = useAuth();
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
  const [loadingStats, setLoadingStats] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<StaffStats>({ 
    servedToday: 0, servedThisWeek: 0, totalServed: 0, avgRating: 0 
  });
  const [teamMembers, setTeamMembers] = useState<TeamMemberProfile[]>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(0);

  // Fetch staff performance stats
  async function fetchStats() {
    if (!profile?.id) return;
    setLoadingStats(true);
    try {
      const todayStart = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('served_by', profile.id)
        .gte('served_at', `${todayStart}T00:00:00`)
        .lte('served_at', `${todayStart}T23:59:59`);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const { count: weekCount } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('served_by', profile.id)
        .gte('served_at', weekStart.toISOString());

      const { count: totalCount } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('served_by', profile.id);

      console.log('🏪 [Staff Profile] Stats raw counts:', { today: todayCount, week: weekCount, total: totalCount });

      setStats({
        servedToday: todayCount || 0,
        servedThisWeek: weekCount || 0,
        totalServed: totalCount || 0,
        avgRating: 0,
      });
    } catch (err) {
      console.log('🏪 [Staff Profile] Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }

  // ✅ FIXED: Sync avatar when profile loads (even after logout/login)
  useEffect(() => {
    fetchStats();
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      if (profile?.id) {
        fetchStats();
      }
    }, [profile?.id])
  );

  useEffect(() => {
    if (!profile?.brand || !profile?.branch) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'staff')
      .eq('brand', profile.brand)
      .eq('branch', profile.branch)
      .then(({ data }) => {
        if (data) {
          const sorted = [...data].sort((a, b) => {
            if (a.id === profile.id) return -1;
            if (b.id === profile.id) return 1;
            const aOnline = a.last_active && new Date(a.last_active).getTime() > Date.now() - 300000;
            const bOnline = b.last_active && new Date(b.last_active).getTime() > Date.now() - 300000;
            return aOnline === bOnline ? 0 : aOnline ? -1 : 1;
          });
          setTeamMembers(sorted);
        }
      });
  }, [profile?.brand, profile?.branch]);

  useEffect(() => {
    console.log('🖼️ [Staff] Profile updated, avatar_url:', profile?.avatar_url);
    if (profile?.avatar_url) {
      // Strip any existing timestamp and add fresh one
      const cleanUrl = profile.avatar_url.split('?t=')[0];
      setAvatarUri(cleanUrl + '?t=' + Date.now());
      setAvatarKey(prev => prev + 1);
    } else {
      setAvatarUri(null);
    }
  }, [profile?.avatar_url, profile?.id]);

  async function handleRefresh() {
    setRefreshing(true);
    await refreshProfile();
    await fetchStats();
    setRefreshing(false);
  }

  async function handlePickImage() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery', 'Remove Photo'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
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
      showToast({ title: 'Permission needed', message: 'Please allow camera access to take a photo.', variant: 'warning' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  }

  async function openGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ title: 'Permission needed', message: 'Please allow access to your photo library.', variant: 'warning' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  }

  async function uploadImage(uri: string) {
    setUploading(true);
    const url = await uploadAvatar(uri);
    if (url) {
      setAvatarUri(url + '?t=' + Date.now());
      setAvatarKey(prev => prev + 1);
      await refreshProfile();
      showToast({ title: 'Success', message: 'Profile picture updated!', variant: 'success' });
    } else {
      showToast({ title: 'Error', message: 'Failed to upload profile picture. Please try again.', variant: 'error' });
    }
    setUploading(false);
  }

  async function removeAvatar() {
    const choice = await showConfirm({
      title: 'Remove Photo',
      message: 'Are you sure you want to remove your profile picture?',
      options: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Remove', style: 'destructive' },
      ],
    });

    if (choice !== 'Remove') return;

    setUploading(true);
    const result = await updateProfile({ avatar_url: '' } as any);
    if (result.success) {
      setAvatarUri(null);
      await refreshProfile();
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
    if (editPhone.trim()) { updates.phone_number = editPhone.trim(); }
    const result = await updateProfile(updates);
    setSaving(false);
    if (result.success) {
      setEditModal(false);
      await refreshProfile();
      showToast({ title: 'Success', message: 'Profile updated successfully!', variant: 'success' });
    } else {
      showToast({ title: 'Error', message: result.error || 'Could not update profile.', variant: 'error' });
    }
  }

  async function handleChangePassword() {
    setPassError('');
    if (!currentPass || !newPass || !confirmPass) { setPassError('Please fill in all fields.'); return; }
    if (newPass !== confirmPass) { setPassError('New passwords do not match.'); return; }
    if (newPass.length < 6) { setPassError('Password must be at least 6 characters.'); return; }
    setSaving(true);
    const { success, error } = await updatePassword(newPass);
    setSaving(false);
    if (success) {
      setPassModal(false); setCurrentPass(''); setNewPass(''); setConfirmPass('');
      showToast({ title: 'Success', message: 'Password changed successfully!', variant: 'success' });
    } else { setPassError(error || 'Could not update password. Please try again.'); }
  }

  if (!profile) {
    return (
      <SafeScreen style={styles.container}>
        <StaffHeader title="Profile" subtitle="Loading..." />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.red} />
        </View>
      </SafeScreen>
    );
  }

  console.log('🖼️ [Staff] Rendering avatar, avatarUri:', avatarUri);

  return (
    <SafeScreen style={styles.container}>
      <StaffHeader title="Profile" subtitle={profile?.name} />

      <ScrollView 
        style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.red} />}
      >
        <View style={styles.avatarCard}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage} disabled={uploading} activeOpacity={0.7}>
            <View style={styles.avatarCircle}>
              {uploading ? (
                <ActivityIndicator color={COLORS.white} size="large" />
              ) : avatarUri ? (
                <Image 
                  key={`avatar-${avatarKey}`}
                  source={{ uri: avatarUri, cache: 'reload' }}
                  style={styles.avatarImage}
                />
              ) : (
                <PhosphorIcon icon="UserCircle" size={52} color={COLORS.white} weight="fill" />
              )}
            </View>
            <View style={styles.cameraBadge}>
              <PhosphorIcon icon="NotePencil" size={14} color={COLORS.white} weight="bold" />
            </View>
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
              <PhosphorIcon icon="Storefront" size={16} color={COLORS.gray500} />
              <Text style={styles.infoPillValue} numberOfLines={1}>
                {profile.brand || '—'}
              </Text>
            </View>
          </View>
          
          {loadingStats ? (
            <ActivityIndicator size="small" color={COLORS.red} style={{ marginTop: 16 }} />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <PhosphorIcon icon="Calendar" size={16} color={COLORS.red} weight="fill" />
                <Text style={styles.statNum}>{stats.servedToday}</Text>
                <Text style={styles.statLabel}>{`Today's\nQueues`}</Text>
              </View>
              <View style={styles.statBox}>
                <PhosphorIcon icon="ChartBar" size={16} color={COLORS.blue} weight="fill" />
                <Text style={styles.statNum}>{stats.servedThisWeek}</Text>
                <Text style={styles.statLabel}>{`This\nWeek`}</Text>
              </View>
              <View style={styles.statBox}>
                <PhosphorIcon icon="Users" size={16} color={COLORS.green} weight="fill" />
                <Text style={styles.statNum}>{stats.totalServed}</Text>
                <Text style={styles.statLabel}>{`Total\nServed`}</Text>
              </View>
              <View style={styles.statBox}>
                <PhosphorIcon icon="Star" size={16} color={COLORS.yellow} weight="fill" />
                <Text style={styles.statNum}>{stats.avgRating || '—'}</Text>
                <Text style={styles.statLabel}>{`Avg\nRating`}</Text>
              </View>
            </View>
          )}
        </View>

        {teamMembers.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>
              TEAM · {profile.branch} ({teamMembers.length})
            </Text>
            <View style={styles.teamCard}>
              {teamMembers.slice(0, 3).map((member, i) => {
                const isOnline = member.last_active && new Date(member.last_active).getTime() > Date.now() - 300000;
                const isMe = member.id === profile.id;
                return (
                  <View key={member.id}>
                    {i > 0 && <View style={styles.teamSeparator} />}
                    <View style={styles.teamRow}>
                      <View style={styles.teamAvatar}>
                        {member.avatar_url ? (
                          <Image source={{ uri: member.avatar_url }} style={styles.teamAvatarImg} />
                        ) : (
                          <PhosphorIcon icon="User" size={18} color={COLORS.gray400} weight="bold" />
                        )}
                      </View>
                      <View style={styles.teamInfo}>
                        <View style={styles.teamNameRow}>
                          <Text style={styles.teamName}>
                            {member.name}{isMe ? ' ' : ''}
                            {isMe && <Text style={styles.youTag}>(You)</Text>}
                          </Text>
                          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22C55E' : '#9CA3AF' }]} />
                          <Text style={[styles.statusText, { color: isOnline ? '#22C55E' : '#9CA3AF' }]}>
                            {isOnline ? 'online' : 'offline'}
                          </Text>
                        </View>
                        <Text style={styles.teamSub}>📞 {member.phone_number || '—'}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
              {teamMembers.length > 3 && (
                <TouchableOpacity style={styles.seeAllBtn} onPress={() => setShowTeamModal(true)} activeOpacity={0.7}>
                  <Text style={styles.seeAllText}>👥 See all {teamMembers.length} team members</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Branch Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <PhosphorIcon icon="Storefront" size={18} color={COLORS.gray500} weight="bold" />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Brand</Text>
              <Text style={styles.infoValue}>{profile?.brand || 'Not assigned'}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <PhosphorIcon icon="MapPin" size={18} color={COLORS.gray500} weight="bold" />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Branch</Text>
              <Text style={styles.infoValue}>{profile?.branch || 'Not assigned'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Account Settings</Text>
        <MenuItem icon="NotePencil" label="Edit Profile" sub="Change your name and phone number"
          onPress={() => { setEditName(profile?.name ?? ''); setEditPhone(profile?.phone_number ?? ''); setEditModal(true); }} />
        <MenuItem icon="Lock" label="Change Password" sub="Update your password"
          onPress={() => setPassModal(true)} />

        <Text style={styles.sectionLabel}>Session</Text>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <PhosphorIcon icon="SignOut" size={20} color={COLORS.white} weight="bold" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setEditModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle}><View style={styles.modalHandleBar} /></View>
            <View style={styles.modalHeader}>
              <View style={[styles.modalHeaderIcon, { backgroundColor: COLORS.blue }]}>
                <PhosphorIcon icon="NotePencil" size={22} color={COLORS.white} weight="bold" />
              </View>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setEditModal(false)}>
                <PhosphorIcon icon="X" size={20} color={COLORS.gray400} weight="bold" />
              </TouchableOpacity>
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
              <View style={[styles.modalHeaderIcon, { backgroundColor: COLORS.orange }]}>
                <PhosphorIcon icon="Lock" size={22} color={COLORS.white} weight="bold" />
              </View>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setPassModal(false)}>
                <PhosphorIcon icon="X" size={20} color={COLORS.gray400} weight="bold" />
              </TouchableOpacity>
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

      <Modal visible={showTeamModal} transparent animationType="slide" onRequestClose={() => setShowTeamModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowTeamModal(false)} />
          <View style={styles.teamModalSheet}>
            <View style={styles.modalHandle}>
              <View style={styles.modalHandleBar} />
            </View>
            <View style={styles.teamModalHeader}>
              <Text style={styles.teamModalTitle}>
                Team · {profile.branch} <Text style={styles.teamModalCount}>({teamMembers.length})</Text>
              </Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowTeamModal(false)}>
                <PhosphorIcon icon="X" size={20} color={COLORS.gray400} weight="bold" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.teamModalScroll} 
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            >
              {teamMembers.map((member, i) => {
                const isOnline = member.last_active && new Date(member.last_active).getTime() > Date.now() - 300000;
                const isMe = member.id === profile.id;
                return (
                  <View key={member.id}>
                    {i > 0 && <View style={styles.teamSeparator} />}
                    <View style={styles.teamRow}>
                      <View style={styles.teamAvatar}>
                        {member.avatar_url ? (
                          <Image source={{ uri: member.avatar_url }} style={styles.teamAvatarImg} />
                        ) : (
                          <PhosphorIcon icon="User" size={18} color={COLORS.gray400} weight="bold" />
                        )}
                      </View>
                      <View style={styles.teamInfo}>
                        <View style={styles.teamNameRow}>
                          <Text style={styles.teamName}>
                            {member.name}{isMe ? ' ' : ''}
                            {isMe && <Text style={styles.youTag}>(You)</Text>}
                          </Text>
                          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22C55E' : '#9CA3AF' }]} />
                          <Text style={[styles.statusText, { color: isOnline ? '#22C55E' : '#9CA3AF' }]}>
                            {isOnline ? 'online' : 'offline'}
                          </Text>
                        </View>
                        <Text style={styles.teamSub}>📞 {member.phone_number || '—'}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
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
  avatarEmail: { fontSize: 13, color: COLORS.gray500, marginBottom: 12 },
  infoPillsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  infoPill: { flex: 1, backgroundColor: COLORS.gray50, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', gap: 4 },
  infoPillValue: { fontSize: 10, fontWeight: '600', color: COLORS.gray700, textAlign: 'center' },
  teamCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 8 },
  teamSeparator: { height: 1, backgroundColor: COLORS.gray100, marginVertical: 8 },
  teamRow: { flexDirection: 'row', alignItems: 'center' },
  teamAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  teamAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  teamInfo: { flex: 1, marginLeft: 10 },
  teamNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamName: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
  youTag: { fontSize: 11, color: COLORS.blue, fontWeight: '600' },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 10, fontWeight: '600' },
  teamSub: { fontSize: 11, color: COLORS.gray400, marginTop: 1 },
  seeAllBtn: { backgroundColor: COLORS.gray50, borderRadius: 10, paddingVertical: 12, marginTop: 8, alignItems: 'center' },
  seeAllText: { fontSize: 13, fontWeight: '600', color: COLORS.gray600 },
  statsGrid: { flexDirection: 'row', paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.gray100, gap: 8 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: COLORS.gray50, borderRadius: 10, gap: 6 },
  statNum: { fontSize: 18, fontWeight: '900', color: COLORS.gray900 },
  statLabel: { fontSize: 9, color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, fontWeight: '600', textAlign: 'center', lineHeight: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray400, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 6 },
  infoCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoTextGroup: { flex: 1 },
  infoDivider: { height: 1, backgroundColor: COLORS.gray100 },
  infoLabel: { fontSize: 11, color: COLORS.gray400, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 15, color: COLORS.gray900, fontWeight: '700', marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8 },
  menuItemDanger: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  menuIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuIconDanger: { backgroundColor: '#FEE2E2' },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  menuLabelDanger: { color: COLORS.red },
  menuSub: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
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
  teamModalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 6, paddingBottom: 30, maxHeight: '80%' },
  teamModalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  teamModalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.gray900, flex: 1 },
  teamModalCount: { fontSize: 13, fontWeight: '400', color: COLORS.gray400 },
  teamModalScroll: { flex: 1 },
  modalBody: { gap: 14 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray600, marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: { borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, padding: 13, fontSize: 15, color: COLORS.gray900, backgroundColor: COLORS.white },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.redLight, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.redBorder },
  errText: { fontSize: 13, color: COLORS.red, fontWeight: '600', flex: 1 },
  modalSaveBtn: { backgroundColor: COLORS.red, borderRadius: 12, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 6 },
  modalSaveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});