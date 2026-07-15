import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'admin'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim(), role } },
    });
    if (!e && data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: name.trim(),
        email: email.trim(),
        role,
        queues_joined: 0,
      });
    }
    setLoading(false);
    if (e) { setError(e.message); return; }
    Alert.alert(
      'Account created!',
      'Check your email to verify, then sign in.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
    );
  }

  return (
    <ScrollView
      style={styles.bg}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoArea}>
        <Text style={styles.logoEmoji}>🍔</Text>
        <Text style={styles.logoTitle}>
          Bee<Text style={styles.logoYellow}>Mac</Text>Queue
        </Text>
        <Text style={styles.logoSub}>Create your free account</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Join the queue revolution</Text>
        <Text style={styles.cardSub}>Set up your BeeMacQueue profile</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>FULL NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Juan dela Cruz"
          placeholderTextColor={COLORS.gray400}
        />

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor={COLORS.gray400}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          placeholderTextColor={COLORS.gray400}
          secureTextEntry
        />

        <Text style={styles.label}>I AM A...</Text>
        <View style={styles.roleRow}>
          {(['customer', 'admin'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => setRole(r)}
            >
              <Text style={styles.roleEmoji}>
                {r === 'customer' ? '👤' : '🛡️'}
              </Text>
              <Text style={[
                styles.roleBtnText,
                role === r && styles.roleBtnTextActive,
              ]}>
                {r === 'customer' ? 'Customer' : 'Admin'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.switchLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.redDark },
  content: { flexGrow: 1, padding: 24, paddingTop: 60, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoEmoji: { fontSize: 44, marginBottom: 8 },
  logoTitle: { fontSize: 30, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  logoYellow: { color: COLORS.yellow },
  logoSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: COLORS.gray900, marginBottom: 4 },
  cardSub: { fontSize: 13, color: COLORS.gray500, marginBottom: 20 },
  errorBox: {
    backgroundColor: COLORS.redLight, borderRadius: 8, padding: 10,
    marginBottom: 14, borderWidth: 1, borderColor: COLORS.redBorder,
  },
  errorText: { fontSize: 13, color: COLORS.red, fontWeight: '600' },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.gray600, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10,
    padding: 13, fontSize: 14, color: COLORS.gray900, marginBottom: 14,
  },
  roleRow: { flexDirection: 'row', marginBottom: 20 },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 13, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.gray200,
    marginRight: 10,
  },
  roleBtnActive: { borderColor: COLORS.red, backgroundColor: COLORS.redLight },
  roleEmoji: { fontSize: 16, marginRight: 6 },
  roleBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.gray500 },
  roleBtnTextActive: { color: COLORS.red },
  btnPrimary: {
    backgroundColor: COLORS.red, borderRadius: 12, padding: 15,
    alignItems: 'center', marginBottom: 16,
  },
  btnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'center' },
  switchText: { fontSize: 13, color: COLORS.gray500 },
  switchLink: { fontSize: 13, color: COLORS.red, fontWeight: '800' },
});
