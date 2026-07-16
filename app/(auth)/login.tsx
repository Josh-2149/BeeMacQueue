import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  Keyboard,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhosphorIcon } from '../../components/PhosphorIcon';
import { StatusBar } from 'expo-status-bar';

console.log('🔵 [LOGIN] Screen mounted');

WebBrowser.maybeCompleteAuthSession();

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  console.log('🔄 [LOGIN] Rendering');
  
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const redirectTo = makeRedirectUri({ scheme: 'beemacqueue', path: 'auth/callback' });
  console.log('🔑 [LOGIN] Redirect URI:', redirectTo);

  useEffect(() => {
    console.log('🎬 [LOGIN] Starting animations');
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('✅ [LOGIN] Animations completed');
    });

    // Keyboard listeners
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const slideTransform = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.3, 0],
  });

  async function handleLogin() {
    console.log('🔐 [LOGIN] Attempting login with email:', email);
    setError('');
    Keyboard.dismiss();
    if (!email.trim() || !password) {
      console.log('❌ [LOGIN] Validation failed: Empty fields');
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { error: e } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (e) {
        console.log('❌ [LOGIN] Login error:', e.message);
        setError(e.message);
      } else {
        console.log('✅ [LOGIN] Login successful, navigating to home');
        router.replace('/(tabs)/home');
      }
    } catch (err) {
      console.log('❌ [LOGIN] Unexpected login error:', err);
      setLoading(false);
      setError('An unexpected error occurred');
    }
  }

  async function handleOAuth(provider: 'google' | 'facebook') {
    console.log(`🔐 [LOGIN] Starting ${provider} OAuth flow`);
    setOauthLoading(provider);
    try {
      const { data, error: e } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (e) {
        console.log(`❌ [LOGIN] ${provider} OAuth error:`, e.message);
        setError(e.message);
        return;
      }
      if (data?.url) {
        console.log(`✅ [LOGIN] ${provider} OAuth URL received`);
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        console.log(`📱 [LOGIN] ${provider} OAuth result type:`, result.type);
        if (result.type === 'success') {
          const url = new URL(result.url);
          const access_token =
            url.searchParams.get('access_token') ??
            url.hash.match(/access_token=([^&]+)/)?.[1];
          const refresh_token =
            url.searchParams.get('refresh_token') ??
            url.hash.match(/refresh_token=([^&]+)/)?.[1];
          if (access_token && refresh_token) {
            console.log('✅ [LOGIN] Setting session from OAuth');
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      }
    } catch (err) {
      console.log(`❌ [LOGIN] ${provider} OAuth unexpected error:`, err);
      setError(`Failed to sign in with ${provider}`);
    } finally {
      setOauthLoading(null);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      {/* Background */}
      <View style={styles.background}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>

      {/* Header - Only show when keyboard is hidden */}
      {!isKeyboardVisible && (
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.brandContainer}>
            <View style={styles.logoWrapper}>
              <PhosphorIcon icon="Storefront" size={40} color={COLORS.yellow} weight="fill" />
            </View>
            <Text style={styles.brandName}>
              Bee<Text style={styles.brandHighlight}>Mac</Text>Queue
            </Text>
            <Text style={styles.brandSubtitle}>Skip the line, enjoy your meal</Text>
          </View>
        </Animated.View>
      )}

      {/* Bottom Sheet - Fixed position, no animation on keyboard */}
      <Animated.View 
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: isKeyboardVisible ? 0 : slideTransform }],
            opacity: fadeAnim,
          }
        ]}
      >
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          > 
          
            <View style={styles.headerContent}>
              <Text style={styles.welcomeText}>Welcome Back! 👋</Text>
              <Text style={styles.welcomeSubtext}>Sign in to continue to your queue</Text>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <PhosphorIcon icon="WarningCircle" size={20} color={COLORS.red} weight="fill" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => setError('')} style={styles.errorClose}>
                  <PhosphorIcon icon="X" size={16} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <PhosphorIcon icon="Envelope" size={20} color={COLORS.gray400} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(t) => { 
                      setEmail(t); 
                      setError(''); 
                    }}
                    placeholder="your@email.com"
                    placeholderTextColor={COLORS.gray400}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <PhosphorIcon icon="Lock" size={20} color={COLORS.gray400} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={(t) => { 
                      setPassword(t); 
                      setError(''); 
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={COLORS.gray400}
                    secureTextEntry={!showPassword}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <PhosphorIcon 
                      icon={showPassword ? "Eye" : "EyeSlash"} 
                      size={20} 
                      color={COLORS.gray400} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity style={styles.forgotContainer}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </Link>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.signInButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.signInText}>Sign In</Text>
                    <PhosphorIcon icon="ArrowRight" size={22} color={COLORS.white} weight="bold" />
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity
                  style={[styles.socialButton, styles.googleButton]}
                  onPress={() => handleOAuth('google')}
                  disabled={!!oauthLoading}
                  activeOpacity={0.7}
                >
                  {oauthLoading === 'google' ? (
                    <ActivityIndicator color={COLORS.gray700} size="small" />
                  ) : (
                    <>
                      <PhosphorIcon icon="GoogleLogo" size={24} color="#EA4335" />
                      <Text style={styles.socialText}>Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, styles.facebookButton]}
                  onPress={() => handleOAuth('facebook')}
                  disabled={!!oauthLoading}
                  activeOpacity={0.7}
                >
                  {oauthLoading === 'facebook' ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <>
                      <PhosphorIcon icon="FacebookLogo" size={24} color={COLORS.white} weight="fill" />
                      <Text style={[styles.socialText, styles.facebookText]}>Facebook</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity>
                    <Text style={styles.signUpLink}>Create one</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            <Text style={styles.footerText}>BeeMacQueue CDO • Powered by Supabase</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.redDark,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: COLORS.redDark,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: COLORS.redDark,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandHighlight: {
    color: COLORS.yellow,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  brandSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontWeight: '500',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    marginTop: 8,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 2,
  },
  welcomeSubtext: {
    fontSize: 13,
    color: COLORS.gray500,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.redLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.redBorder,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.red,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorClose: {
    padding: 4,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray600,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray900,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  passwordInput: {
    paddingRight: 4,
  },
  eyeButton: {
    padding: 4,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 13,
    color: COLORS.red,
    fontWeight: '700',
  },
  signInButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.red,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  signInText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray200,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.gray400,
    marginHorizontal: 12,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  googleButton: {
    borderColor: '#EA4335',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
    marginLeft: 8,
  },
  facebookText: {
    color: COLORS.white,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  signUpText: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  signUpLink: {
    fontSize: 14,
    color: COLORS.red,
    fontWeight: '800',
  },
  footerText: {
    textAlign: 'center',
    color: COLORS.gray400,
    fontSize: 11,
    marginTop: 12,
    fontWeight: '500',
  },
});