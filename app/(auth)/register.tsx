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
  Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../lib/constants';
import { PhosphorIcon } from '../../components/PhosphorIcon';
import { BrandLogo } from '../../components/BrandLogo';
import { useToast } from '../../context/ToastContext';

console.log('📝 [Register] Screen mounted');

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BRANCHES = {
  jollibee: ['Jollibee Divisoria', 'Jollibee Limketkai', 'Jollibee Carmen', 'Jollibee Cogon', 'Jollibee Gaisano City'],
  mcdo: ["McDonald's Divisoria", "McDonald's Limketkai", "McDonald's Gaisano City", "McDonald's SM CDO", "McDonald's Centrio"]
};

export default function RegisterScreen() {
  console.log('📝 [Register] Rendering');
  const router = useRouter();
  const { signUp, loading } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'staff'>('customer');
  const [brand, setBrand] = useState<'jollibee' | 'mcdo'>('jollibee');
  const [branch, setBranch] = useState(BRANCHES.jollibee[0]);
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

  const { showToast } = useToast();

  const handleRegister = async () => {
    console.log('📝 [Register] Register attempt:', email, 'role:', role);
    setError('');
    Keyboard.dismiss();
    
    if (!name.trim() || !email.trim() || !password) {
      showToast({ title: 'Missing fields', message: 'Please fill in all fields', variant: 'error' });
      return;
    }
    
    if (password.length < 6) {
      showToast({ title: 'Weak password', message: 'Password must be at least 6 characters', variant: 'error' });
      return;
    }

    if (role === 'staff' && !branch) {
      showToast({ title: 'Missing branch', message: 'Please select a branch', variant: 'error' });
      return;
    }

    const result = await signUp(
      email.trim(),
      password,
      name.trim(),
      role,
      brand,
      branch
    );
    
    console.log('📝 [Register] Register result:', result);
    
    if (!result.success) {
      showToast({ title: 'Registration failed', message: result.error || 'Please try again', variant: 'error' });
      return;
    }

    showToast({ title: 'Account created', message: role === 'staff' ? `You're now a staff member at ${branch}! Please sign in.` : 'Welcome to BeeMacQueue! Please sign in.', variant: 'success' });
    router.replace('/(auth)/login');
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
          <BrandLogo />
          <Text style={styles.brandName}>
            Bee<Text style={styles.brandHighlight}>Mac</Text>Queue
          </Text>
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
            <Text style={styles.welcome}>Create Account ✨</Text>
            <Text style={styles.welcomeSub}>
              {role === 'staff' ? 'Set up your staff account' : 'Start your queue journey today'}
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <PhosphorIcon icon="WarningCircle" size={20} color={COLORS.red} weight="fill" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Role Selection */}
            <Text style={styles.label}>I am a:</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleOption, role === 'customer' && styles.roleActive]}
                onPress={() => setRole('customer')}
                activeOpacity={0.7}
              >
                <View style={[styles.roleIcon, role === 'customer' && styles.roleIconActive]}>
                  <PhosphorIcon icon="User" size={24} color={role === 'customer' ? COLORS.white : COLORS.gray500} weight={role === 'customer' ? 'fill' : 'regular'} />
                </View>
                <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>Customer</Text>
                <Text style={styles.roleSubtext}>Join queues & get served</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, role === 'staff' && styles.roleActive]}
                onPress={() => setRole('staff')}
                activeOpacity={0.7}
              >
                <View style={[styles.roleIcon, role === 'staff' && styles.roleIconActive]}>
                  <PhosphorIcon icon="Storefront" size={24} color={role === 'staff' ? COLORS.white : COLORS.gray500} weight={role === 'staff' ? 'fill' : 'regular'} />
                </View>
                <Text style={[styles.roleText, role === 'staff' && styles.roleTextActive]}>Staff / Crew</Text>
                <Text style={styles.roleSubtext}>Manage your branch queue</Text>
              </TouchableOpacity>
            </View>

            {/* Staff Fields */}
            {role === 'staff' && (
              <>
                <Text style={styles.label}>Brand</Text>
                <View style={styles.brandContainer}>
                  <TouchableOpacity
                    style={[styles.brandOption, brand === 'jollibee' && styles.brandActive]}
                    onPress={() => {
                      setBrand('jollibee');
                      setBranch(BRANCHES.jollibee[0]);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.brandImageWrapper}>
                      <Image
                        source={require('../../assets/brand_logos/jollibee.jpeg')}
                        style={styles.brandImage}
                        resizeMode="cover"
                      />
                    </View>
                    <Text style={[styles.brandText, brand === 'jollibee' && styles.brandTextActive]}>Jollibee</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.brandOption, brand === 'mcdo' && styles.brandActive]}
                    onPress={() => {
                      setBrand('mcdo');
                      setBranch(BRANCHES.mcdo[0]);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.brandImageWrapper}>
                      <Image
                        source={require('../../assets/brand_logos/mcdo.jpeg')}
                        style={styles.brandImage}
                        resizeMode="cover"
                      />
                    </View>
                    <Text style={[styles.brandText, brand === 'mcdo' && styles.brandTextActive]}>McDonald's</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Branch</Text>
                {BRANCHES[brand].map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.branchOption, branch === b && styles.branchActive]}
                    onPress={() => setBranch(b)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.branchRadio}>
                      {branch === b && <View style={styles.branchRadioActive} />}
                    </View>
                    <Text style={[styles.branchText, branch === b && styles.branchTextActive]}>{b}</Text>
                    {branch === b && <PhosphorIcon icon="CheckCircle" size={20} color={COLORS.green} weight="fill" />}
                  </TouchableOpacity>
                ))}
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputWrapper, name ? styles.inputFilled : null]}>
                <PhosphorIcon icon="User" size={20} color={name ? COLORS.red : COLORS.gray400} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.gray400}
                />
              </View>
            </View>

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
              <Text style={styles.label}>Password (min 6 characters)</Text>
              <View style={[styles.inputWrapper, password ? styles.inputFilled : null]}>
                <PhosphorIcon icon="Lock" size={20} color={password ? COLORS.red : COLORS.gray400} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={COLORS.gray400}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <PhosphorIcon icon={showPassword ? "Eye" : "EyeSlash"} size={20} color={COLORS.gray400} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.registerText}>
                    {role === 'staff' ? 'Create Staff Account' : 'Create Account'}
                  </Text>
                  <PhosphorIcon icon="ArrowRight" size={20} color={COLORS.white} weight="bold" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Sign in</Text>
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
    height: SCREEN_HEIGHT * 0.35,
    backgroundColor: COLORS.redDark,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: COLORS.redDark,
  },
  header: {
    paddingTop: 30,
    paddingBottom: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  welcome: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 2,
  },
  welcomeSub: {
    fontSize: 13,
    color: COLORS.gray500,
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.redLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.redBorder,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray600,
    marginBottom: 6,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    height: 48,
  },
  inputFilled: {
    borderColor: COLORS.red,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray900,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  passwordInput: {
    paddingRight: 4,
  },
  eyeButton: {
    padding: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  roleActive: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.redLight,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  roleIconActive: {
    backgroundColor: COLORS.red,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  roleTextActive: {
    color: COLORS.red,
  },
  roleSubtext: {
    fontSize: 10,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: 1,
  },
  brandContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  brandOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  brandActive: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.redLight,
  },
  brandImageWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
    textAlign: 'center',
  },
  brandTextActive: {
    color: COLORS.red,
  },
  branchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    marginBottom: 6,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  branchActive: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.redLight,
  },
  branchRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchRadioActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.red,
  },
  branchText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  branchTextActive: {
    color: COLORS.red,
    fontWeight: '600',
  },
  registerButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.red,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
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
  registerText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: COLORS.gray500,
    fontSize: 13,
  },
  footerLink: {
    color: COLORS.red,
    fontWeight: '800',
    fontSize: 13,
  },
});