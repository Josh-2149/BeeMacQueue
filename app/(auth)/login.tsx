import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  Keyboard,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../lib/constants';
import { PhosphorIcon } from '../../components/PhosphorIcon';
import { BrandLogo } from '../../components/BrandLogo';
import Particles from '../../components/Particles';
import { useToast } from '../../context/ToastContext';
import Svg, { Path, G } from 'react-native-svg';

console.log('🔑 [Login] Screen mounted');

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ✅ Google SVG Icon Component
const GoogleIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 16 16">
    <G fill="none" fillRule="evenodd" clipRule="evenodd">
      <Path 
        fill="#f44336" 
        d="M7.209 1.061c.725-.081 1.154-.081 1.933 0a6.57 6.57 0 0 1 3.65 1.82a100 100 0 0 0-1.986 1.93q-1.876-1.59-4.188-.734q-1.696.78-2.362 2.528a78 78 0 0 1-2.148-1.658a.26.26 0 0 0-.16-.027q1.683-3.245 5.26-3.86" 
        opacity="0.987" 
      />
      <Path 
        fill="#ffc107" 
        d="M1.946 4.92q.085-.013.161.027a78 78 0 0 0 2.148 1.658A7.6 7.6 0 0 0 4.04 7.99q.037.678.215 1.331L2 11.116Q.527 8.038 1.946 4.92" 
        opacity="0.997" 
      />
      <Path 
        fill="#448aff" 
        d="M12.685 13.29a26 26 0 0 0-2.202-1.74q1.15-.812 1.396-2.228H8.122V6.713q3.25-.027 6.497.055q.616 3.345-1.423 6.032a7 7 0 0 1-.51.49" 
        opacity="0.999" 
      />
      <Path 
        fill="#43a047" 
        d="M4.255 9.322q1.23 3.057 4.51 2.854a3.94 3.94 0 0 0 1.718-.626q1.148.812 2.202 1.74a6.62 6.62 0 0 1-4.027 1.684a6.4 6.4 0 0 1-1.02 0Q3.82 14.524 2 11.116z" 
        opacity="0.993" 
      />
    </G>
  </Svg>
);

// ✅ Facebook SVG Icon Component
const FacebookIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 512 512">
    <Path 
      fill="#0866ff" 
      d="M213.8 509.4C92.2 487.7 0 382.7 0 256C0 115.2 115.2 0 256 0s256 115.2 256 256c0 126.7-92.2 231.7-213.8 253.4l-14.1-11.5h-56.3z" 
    />
    <Path 
      fill="#fff" 
      d="m355.8 327.7l11.5-71.7h-67.8v-49.9c0-20.5 7.7-35.8 38.4-35.8h33.3V105c-17.9-2.6-38.4-5.1-56.3-5.1c-58.9 0-99.8 35.8-99.8 99.8V256h-64v71.7h64v180.5c14.1 2.6 28.2 3.8 42.2 3.8c14.1 0 28.2-1.3 42.2-3.8V327.7z" 
    />
  </Svg>
);

export default function LoginScreen() {
  console.log('🔑 [Login] Rendering');
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithFacebook, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    ]).start();

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
    outputRange: [SCREEN_HEIGHT * 0.25, 0],
  });

  const { showToast } = useToast();

  const handleLogin = async () => {
    console.log('🔑 [Login] Login attempt:', email);
    setError('');
    Keyboard.dismiss();
    
    if (!email.trim() || !password) {
      showToast({ title: 'Missing fields', message: 'Please enter email and password', variant: 'error' });
      return;
    }

    const result = await signIn(email.trim(), password);
    console.log('🔑 [Login] Login result:', result);
    
    if (!result.success) {
      showToast({ title: 'Login failed', message: result.error || 'Unable to sign in', variant: 'error' });
    }
  };

  // ✅ Functional Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setSocialLoading('google');
      const result = await signInWithGoogle();
      if (result.success) {
        showToast({ title: 'Success', message: 'Signed in with Google', variant: 'success' });
        // Navigation will be handled by the auth guard
      } else {
        showToast({ title: 'Google Sign-In Failed', message: result.error || 'Unable to sign in with Google', variant: 'error' });
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      showToast({ title: 'Error', message: error.message || 'Failed to sign in with Google', variant: 'error' });
    } finally {
      setSocialLoading(null);
    }
  };

  // ✅ Functional Facebook Sign-In
  const handleFacebookSignIn = async () => {
    try {
      setSocialLoading('facebook');
      const result = await signInWithFacebook();
      if (result.success) {
        showToast({ title: 'Success', message: 'Signed in with Facebook', variant: 'success' });
        // Navigation will be handled by the auth guard
      } else {
        showToast({ title: 'Facebook Sign-In Failed', message: result.error || 'Unable to sign in with Facebook', variant: 'error' });
      }
    } catch (error: any) {
      console.error('Facebook sign-in error:', error);
      showToast({ title: 'Error', message: error.message || 'Failed to sign in with Facebook', variant: 'error' });
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <View style={styles.background}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
        <Particles count={25} />
      </View>

      {!isKeyboardVisible && (
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <BrandLogo />
          <Text style={styles.brandName}>
            Bee<Text style={styles.brandHighlight}>Mac</Text>Queue
          </Text>
          <Text style={styles.brandSubtitle}>Skip the line, enjoy your meal</Text>
        </Animated.View>
      )}

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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.welcome}>Welcome Back! 👋</Text>
            <Text style={styles.welcomeSub}>Sign in to continue</Text>

            {error ? (
              <View style={styles.errorBox}>
                <PhosphorIcon icon="WarningCircle" size={20} color={COLORS.red} weight="fill" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, email ? styles.inputFilled : null]}>
                <PhosphorIcon icon="Envelope" size={20} color={email ? COLORS.red : COLORS.gray400} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, password ? styles.inputFilled : null]}>
                <PhosphorIcon icon="Lock" size={20} color={password ? COLORS.red : COLORS.gray400} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.gray400}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <PhosphorIcon icon={showPassword ? "Eye" : "EyeSlash"} size={20} color={COLORS.gray400} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.loginText}>Sign In</Text>
                  <PhosphorIcon icon="ArrowRight" size={20} color={COLORS.white} weight="bold" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ✅ Social buttons in one row with rounded corners */}
            <View style={styles.socialRow}>
              <TouchableOpacity 
                style={[
                  styles.socialButton, 
                  styles.googleButton,
                  socialLoading === 'google' && styles.socialButtonDisabled
                ]} 
                onPress={handleGoogleSignIn}
                disabled={socialLoading === 'google' || loading}
                activeOpacity={0.7}
              >
                {socialLoading === 'google' ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <>
                    <GoogleIcon />
                    <Text style={[styles.socialButtonText, styles.googleButtonText]}>Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.socialButton, 
                  styles.facebookButton,
                  socialLoading === 'facebook' && styles.socialButtonDisabled
                ]} 
                onPress={handleFacebookSignIn}
                disabled={socialLoading === 'facebook' || loading}
                activeOpacity={0.7}
              >
                {socialLoading === 'facebook' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <FacebookIcon />
                    <Text style={[styles.socialButtonText, styles.facebookButtonText]}>Facebook</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Create one</Text>
                </TouchableOpacity>
              </Link>
            </View>
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
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandHighlight: {
    color: COLORS.yellow,
  },
  brandSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
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
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.redLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.redBorder,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray600,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    height: 52,
  },
  inputFilled: {
    borderColor: COLORS.red,
    borderWidth: 2,
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  forgotText: {
    fontSize: 13,
    color: COLORS.red,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.red,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  loginText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#6B7280',
    fontSize: 13,
  },
  // ✅ Social buttons row - SIDE BY SIDE with MORE ROUNDED CORNERS
  socialRow: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  socialButton: {
    width: '100%',
    height: 50,
    borderRadius: 25, // ✅ More rounded - fully pill-shaped
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  googleButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  googleButtonText: {
    color: COLORS.black,
  },
  facebookButtonText: {
    color: COLORS.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: COLORS.gray500,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.red,
    fontWeight: '800',
    fontSize: 14,
  },
});