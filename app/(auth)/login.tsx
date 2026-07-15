import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState('');

  const redirectTo = makeRedirectUri({ scheme: 'beemacqueue', path: 'auth/callback' });

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error: e } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (e) setError(e.message);
    else router.replace('/(tabs)/home');
  }

  async function handleOAuth(provider: 'google' | 'facebook') {
    setOauthLoading(provider);
    try {
      const { data, error: e } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (e) { setError(e.message); return; }
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success') {
          const url = new URL(result.url);
          const access_token =
            url.searchParams.get('access_token') ??
            url.hash.match(/access_token=([^&]+)/)?.[1];
          const refresh_token =
            url.searchParams.get('refresh_token') ??
            url.hash.match(/refresh_token=([^&]+)/)?.[1];
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      }
    } finally {
      setOauthLoading(null);
    }
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
        <Text style={styles.logoSub}>CDO's #1 Fast Food Queue Manager</Text>
        <Text style={styles.logoBrands}>
          🐝 Jollibee & 🍟 McDonald's · Cagayan de Oro
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome back 👋</Text>
        <Text style={styles.cardSub}>Sign in to skip the line</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
          placeholder="your@email.com"
          placeholderTextColor={COLORS.gray400}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
          placeholder="••••••••"
          placeholderTextColor={COLORS.gray400}
          secureTextEntry
        />

        <Link href="/(auth)/forgot-password" asChild>
          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity
          style={[styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.btnPrimaryText}>Sign In</Text>}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => handleOAuth('google')}
          disabled={!!oauthLoading}
        >
          {oauthLoading === 'google'
            ? <ActivityIndicator color={COLORS.gray700} size="small" />
            : (
              <>
                <Text style={styles.gIcon}>G</Text>
                <Text style={styles.socialText}>Continue with Google</Text>
              </>
            )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialBtn, styles.fbBtn]}
          onPress={() => handleOAuth('facebook')}
          disabled={!!oauthLoading}
        >
          {oauthLoading === 'facebook'
            ? <ActivityIndicator color={COLORS.white} size="small" />
            : (
              <>
                <Text style={[styles.gIcon, { color: COLORS.white }]}>f</Text>
                <Text style={[styles.socialText, { color: COLORS.white }]}>
                  Continue with Facebook
                </Text>
              </>
            )}
        </TouchableOpacity>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.switchLink}>Create one</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <Text style={styles.footer}>BeeMacQueue CDO · Powered by Supabase</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.redDark },
  content: { flexGrow: 1, padding: 24, paddingTop: 60, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 28 },
  logoEmoji: { fontSize: 52, marginBottom: 10 },
  logoTitle: { fontSize: 32, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  logoYellow: { color: COLORS.yellow },
  logoSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 5 },
  logoBrands: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.gray900, marginBottom: 4 },
  cardSub: { fontSize: 13, color: COLORS.gray500, marginBottom: 20 },
  errorBox: {
    backgroundColor: COLORS.redLight, borderRadius: 8, padding: 10,
    marginBottom: 14, borderWidth: 1, borderColor: COLORS.redBorder,
  },
  errorText: { fontSize: 13, color: COLORS.red, fontWeight: '600' },
  label: {
    fontSize: 11, fontWeight: '700', color: COLORS.gray600,
    marginBottom: 6, letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10,
    padding: 13, fontSize: 14, color: COLORS.gray900, marginBottom: 14,
  },
  forgotRow: { alignItems: 'flex-end', marginBottom: 16 },
  forgotText: { fontSize: 12, color: COLORS.red, fontWeight: '700' },
  btnPrimary: {
    backgroundColor: COLORS.red, borderRadius: 12, padding: 15, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.gray200 },
  dividerText: { fontSize: 12, color: COLORS.gray400, marginHorizontal: 10 },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 12,
    padding: 13, marginBottom: 10,
  },
  fbBtn: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
  gIcon: {
    fontSize: 17, fontWeight: '900', color: COLORS.gray700,
    width: 20, textAlign: 'center', marginRight: 10,
  },
  socialText: { fontSize: 14, fontWeight: '600', color: COLORS.gray700 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  switchText: { fontSize: 13, color: COLORS.gray500 },
  switchLink: { fontSize: 13, color: COLORS.red, fontWeight: '800' },
  footer: {
    textAlign: 'center', color: 'rgba(255,255,255,0.35)',
    fontSize: 11, marginTop: 20,
  },
});
