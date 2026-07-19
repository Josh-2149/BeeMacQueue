import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhosphorIcon } from '../../components/PhosphorIcon';
import { StatusBar } from 'expo-status-bar';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  async function handleReset() {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email address'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'beemacqueue://auth/reset',
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else setSent(true);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <PhosphorIcon icon="ChevronLeft" size={24} color={COLORS.gray700} />
        <Text style={styles.backText}>Back to sign in</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <PhosphorIcon icon="Key" size={40} color={COLORS.red} weight="fill" />
        </View>

        <Text style={styles.title}>{sent ? 'Email sent!' : 'Reset Password'}</Text>
        <Text style={styles.subtitle}>
          {sent
            ? `A reset link was sent to ${email}. Check your inbox.`
            : "Enter your email and we'll send you a reset link."}
        </Text>

        {!sent && (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
              <PhosphorIcon icon="Envelope" size={20} color={focused ? COLORS.red : COLORS.gray400} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={COLORS.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.resetText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )}

        {sent && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.resetText}>Back to Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  backText: {
    fontSize: 15,
    color: COLORS.gray700,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.redBorder,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray500,
    lineHeight: 22,
    marginBottom: 28,
  },
  keyboardView: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    height: 52,
    marginBottom: 20,
  },
  inputWrapperFocused: {
    borderColor: COLORS.red,
    borderWidth: 2,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray900,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  resetButton: {
    backgroundColor: COLORS.red,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  resetText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },
});