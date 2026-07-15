import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) { Alert.alert('Enter your email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'beemacqueue://auth/reset',
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else setSent(true);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back to sign in</Text>
      </TouchableOpacity>

      <View style={styles.iconBox}>
        <Text style={styles.icon}>🔒</Text>
      </View>

      <Text style={styles.title}>{sent ? 'Email sent!' : 'Reset password'}</Text>
      <Text style={styles.sub}>
        {sent
          ? `A reset link was sent to ${email}. Check your inbox.`
          : "Enter your email and we'll send you a reset link."}
      </Text>

      {!sent && (
        <>
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
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnText}>Send reset link</Text>}
          </TouchableOpacity>
        </>
      )}

      {sent && (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.btnText}>Back to sign in</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: 24, paddingTop: 64 },
  back: { marginBottom: 40 },
  backText: { color: COLORS.red, fontSize: 14, fontWeight: '700' },
  iconBox: {
    width: 68, height: 68, borderRadius: 18,
    backgroundColor: COLORS.redLight, alignItems: 'center',
    justifyContent: 'center', marginBottom: 20,
  },
  icon: { fontSize: 30 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.gray900, marginBottom: 10 },
  sub: { fontSize: 14, color: COLORS.gray500, lineHeight: 22, marginBottom: 28 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.gray600, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10,
    padding: 13, fontSize: 14, color: COLORS.gray900, marginBottom: 16,
  },
  btn: { backgroundColor: COLORS.red, borderRadius: 12, padding: 15, alignItems: 'center' },
  btnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
