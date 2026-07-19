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
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../lib/constants';
import { PhosphorIcon } from '../../components/PhosphorIcon';

console.log('🔑 [Login] Screen mounted');

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  console.log('🔑 [Login] Rendering');
  const router = useRouter();
  const { signIn, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  const handleLogin = async () => {
    console.log('🔑 [Login] Login attempt:', email);
    setError('');
    Keyboard.dismiss();
    
    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }

    const result = await signIn(email.trim(), password);
    console.log('🔑 [Login] Login result:', result);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <View style={styles.background}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>

      {!isKeyboardVisible && (
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.logoWrapper}>
            <PhosphorIcon icon="Storefront" size={48} color={COLORS.yellow} weight="fill" />
          </View>
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
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
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
    marginBottom: 20,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray600,
    marginBottom: 6,
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
    marginBottom: 20,
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