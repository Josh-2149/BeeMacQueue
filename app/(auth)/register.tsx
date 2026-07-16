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
  Alert,
  Keyboard,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhosphorIcon } from '../../components/PhosphorIcon';
import { StatusBar } from 'expo-status-bar';
import { UserRole, BrandType } from '../../types';

console.log('🔵 [REGISTER] Screen mounted');

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// CDO Branches Data
const BRANCHES = {
  jollibee: [
    'Jollibee Divisoria',
    'Jollibee Limketkai',
    'Jollibee Carmen',
    'Jollibee Cogon',
    'Jollibee Gaisano City'
  ],
  mcdo: [
    "McDonald's Divisoria",
    "McDonald's Limketkai",
    "McDonald's Gaisano City",
    "McDonald's SM CDO",
    "McDonald's Centrio"
  ]
};

export default function RegisterScreen() {
  console.log('🔄 [REGISTER] Rendering');
  
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Role selection
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  
  // Staff-specific fields
  const [selectedBrand, setSelectedBrand] = useState<BrandType>('jollibee');
  const [selectedBranch, setSelectedBranch] = useState<string>(BRANCHES.jollibee[0]);
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('🎬 [REGISTER] Starting animations');
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
      console.log('✅ [REGISTER] Animations completed');
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

  const getErrorMessage = (error: any): string => {
    if (!error) return 'An unexpected error occurred.';
    const message = error.message || error.toString();
    if (message.includes('User already registered')) {
      return 'This email is already registered. Please sign in instead.';
    }
    if (message.includes('Password should be at least 6 characters')) {
      return 'Password must be at least 6 characters long.';
    }
    if (message.includes('Invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Please verify your email address. Check your inbox for the verification link.';
    }
    if (message.includes('rate limit')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (message.includes('network')) {
      return 'Network error. Please check your internet connection.';
    }
    return message;
  };

  async function handleRegister() {
    console.log('📝 [REGISTER] Registration attempt started');
    setError('');
    Keyboard.dismiss();
    
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (selectedRole === 'staff') {
      if (!selectedBrand) {
        setError('Please select a brand.');
        return;
      }
      if (!selectedBranch) {
        setError('Please select a branch.');
        return;
      }
    }
    
    setLoading(true);
    try {
      const { data, error: e } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { 
          data: { 
            name: name.trim(), 
            role: selectedRole,
            brand: selectedRole === 'staff' ? selectedBrand : null,
            branch: selectedRole === 'staff' ? selectedBranch : null,
          } 
        },
      });
      
      if (e) {
        setLoading(false);
        setError(getErrorMessage(e));
        return;
      }
      
      if (!data.user) {
        setLoading(false);
        setError('Failed to create account. Please try again.');
        return;
      }
      
      const profileData: any = {
        id: data.user.id,
        name: name.trim(),
        email: email.trim(),
        role: selectedRole,
        queues_joined: 0,
      };
      
      if (selectedRole === 'staff') {
        profileData.brand = selectedBrand;
        profileData.branch = selectedBranch;
      }
      
      await supabase.from('profiles').upsert(profileData);
      setLoading(false);
      
      const roleMessage = selectedRole === 'staff' 
        ? `You're now a staff member at ${selectedBranch}! 🎉\n\nPlease sign in to access your staff dashboard.`
        : 'Welcome to BeeMacQueue! 🎉\n\nYour account has been created successfully.\n\nPlease sign in to start joining queues and skip the line!';
      
      Alert.alert(
        'Account Created! 🎉',
        roleMessage,
        [{ 
          text: 'Sign In Now', 
          onPress: () => router.replace('/(auth)/login')
        }]
      );
    } catch (err) {
      setLoading(false);
      setError('An unexpected error occurred. Please check your internet connection and try again.');
    }
  }

  const renderRoleSelection = () => (
    <View style={styles.roleSelectionContainer}>
      <Text style={styles.sectionLabel}>I am a:</Text>
      <View style={styles.roleOptions}>
        <TouchableOpacity
          style={[styles.roleOption, selectedRole === 'customer' && styles.roleOptionActive]}
          onPress={() => setSelectedRole('customer')}
          activeOpacity={0.7}
        >
          <View style={[styles.roleIconContainer, selectedRole === 'customer' && styles.roleIconContainerActive]}>
            <PhosphorIcon 
              icon="User" 
              size={28} 
              color={selectedRole === 'customer' ? COLORS.white : COLORS.gray500} 
              weight={selectedRole === 'customer' ? 'fill' : 'regular'}
            />
          </View>
          <Text style={[styles.roleOptionTitle, selectedRole === 'customer' && styles.roleOptionTitleActive]}>
            Customer
          </Text>
          <Text style={styles.roleOptionSubtext}>Join queues & get served</Text>
          {selectedRole === 'customer' && (
            <View style={styles.roleCheckmark}>
              <PhosphorIcon icon="CheckCircle" size={20} color={COLORS.green} weight="fill" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleOption, selectedRole === 'staff' && styles.roleOptionActive]}
          onPress={() => setSelectedRole('staff')}
          activeOpacity={0.7}
        >
          <View style={[styles.roleIconContainer, selectedRole === 'staff' && styles.roleIconContainerActive]}>
            <PhosphorIcon 
              icon="Storefront" 
              size={28} 
              color={selectedRole === 'staff' ? COLORS.white : COLORS.gray500} 
              weight={selectedRole === 'staff' ? 'fill' : 'regular'}
            />
          </View>
          <Text style={[styles.roleOptionTitle, selectedRole === 'staff' && styles.roleOptionTitleActive]}>
            Staff / Crew
          </Text>
          <Text style={styles.roleOptionSubtext}>Manage your branch queue</Text>
          {selectedRole === 'staff' && (
            <View style={styles.roleCheckmark}>
              <PhosphorIcon icon="CheckCircle" size={20} color={COLORS.green} weight="fill" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStaffFields = () => (
    <View style={styles.staffFields}>
      <Text style={styles.sectionLabel}>Which brand?</Text>
      <View style={styles.brandOptions}>
        <TouchableOpacity
          style={[styles.brandOption, selectedBrand === 'jollibee' && styles.brandOptionActive]}
          onPress={() => {
            setSelectedBrand('jollibee');
            setSelectedBranch(BRANCHES.jollibee[0]);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.brandEmoji}>🐥</Text>
          <Text style={[styles.brandName, selectedBrand === 'jollibee' && styles.brandNameActive]}>
            Jollibee
          </Text>
          {selectedBrand === 'jollibee' && (
            <View style={styles.brandCheckmark}>
              <PhosphorIcon icon="Check" size={16} color={COLORS.red} weight="bold" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.brandOption, selectedBrand === 'mcdo' && styles.brandOptionActive]}
          onPress={() => {
            setSelectedBrand('mcdo');
            setSelectedBranch(BRANCHES.mcdo[0]);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.brandEmoji}>🍟</Text>
          <Text style={[styles.brandName, selectedBrand === 'mcdo' && styles.brandNameActive]}>
            McDonald's
          </Text>
          {selectedBrand === 'mcdo' && (
            <View style={styles.brandCheckmark}>
              <PhosphorIcon icon="Check" size={16} color={COLORS.red} weight="bold" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Select your branch:</Text>
      <View style={styles.branchList}>
        {BRANCHES[selectedBrand].map((branch) => (
          <TouchableOpacity
            key={branch}
            style={[styles.branchOption, selectedBranch === branch && styles.branchOptionActive]}
            onPress={() => setSelectedBranch(branch)}
            activeOpacity={0.7}
          >
            <View style={styles.branchOptionContent}>
              <View style={styles.branchRadio}>
                {selectedBranch === branch && <View style={styles.branchRadioActive} />}
              </View>
              <Text style={[styles.branchOptionText, selectedBranch === branch && styles.branchOptionTextActive]}>
                {branch}
              </Text>
              {selectedBranch === branch && (
                <PhosphorIcon icon="CheckCircle" size={20} color={COLORS.green} weight="fill" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <View style={styles.background}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>

      {/* Header - Hide when keyboard is open */}
      {!isKeyboardVisible && (
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.brandContainer}>
            <View style={styles.logoWrapper}>
              <PhosphorIcon icon="Storefront" size={40} color={COLORS.yellow} weight="fill" />
            </View>
            <Text style={styles.brandName}>
              Bee<Text style={styles.brandHighlight}>Mac</Text>Queue
            </Text>
            <Text style={styles.brandSubtitle}>
              {selectedRole === 'staff' ? 'Staff Registration' : 'Join the queue revolution'}
            </Text>
          </View>
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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView 
            ref={scrollViewRef}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            // REMOVED: keyboardDismissMode="on-drag" - THIS WAS THE ISSUE!
          >
            <View style={styles.headerContent}>
              <Text style={styles.welcomeText}>Create Account ✨</Text>
              <Text style={styles.welcomeSubtext}>
                {selectedRole === 'staff' ? 'Set up your staff account' : 'Start your queue journey today'}
              </Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <PhosphorIcon icon="WarningCircle" size={20} color={COLORS.red} weight="fill" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => setError('')} style={styles.errorClose}>
                  <PhosphorIcon icon="X" size={16} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.form}>
              {renderRoleSelection()}
              {selectedRole === 'staff' && renderStaffFields()}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <PhosphorIcon icon="User" size={20} color={COLORS.gray400} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.gray400}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <PhosphorIcon icon="Envelope" size={20} color={COLORS.gray400} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
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

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <PhosphorIcon icon="Lock" size={20} color={COLORS.gray400} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Minimum 6 characters"
                    placeholderTextColor={COLORS.gray400}
                    secureTextEntry={!showPassword}
                    returnKeyType="go"
                    onSubmitEditing={handleRegister}
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
                {password.length > 0 && password.length < 6 && (
                  <Text style={styles.passwordHint}>
                    <PhosphorIcon icon="Warning" size={12} color={COLORS.orange} />
                    {' '}Password must be at least 6 characters
                  </Text>
                )}
                {password.length >= 6 && (
                  <Text style={styles.passwordSuccess}>
                    <PhosphorIcon icon="Check" size={12} color={COLORS.green} />
                    {' '}Password strength: Good
                  </Text>
                )}
              </View>

              <View style={styles.roleSummaryContainer}>
                <View style={[styles.roleSummaryBadge, selectedRole === 'staff' && styles.roleSummaryBadgeStaff]}>
                  <PhosphorIcon 
                    icon={selectedRole === 'staff' ? "Storefront" : "UserCircle"} 
                    size={18} 
                    color={selectedRole === 'staff' ? COLORS.blue : COLORS.green} 
                    weight="fill" 
                  />
                  <Text style={styles.roleSummaryText}>
                    {selectedRole === 'staff' ? `Staff at ${selectedBranch}` : 'Customer Account'}
                  </Text>
                  <PhosphorIcon icon="CheckCircle" size={16} color={selectedRole === 'staff' ? COLORS.blue : COLORS.green} weight="fill" />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.createButton, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={COLORS.white} />
                    <Text style={styles.loadingText}>Creating account...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.createText}>
                      {selectedRole === 'staff' ? 'Create Staff Account' : 'Create Account'}
                    </Text>
                    <PhosphorIcon icon="ArrowRight" size={22} color={COLORS.white} weight="bold" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.signInLink}>Sign in</Text>
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
  passwordHint: {
    fontSize: 12,
    color: COLORS.orange,
    marginTop: 4,
    marginLeft: 4,
  },
  passwordSuccess: {
    fontSize: 12,
    color: COLORS.green,
    marginTop: 4,
    marginLeft: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray600,
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  roleSelectionContainer: {
    marginBottom: 16,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    alignItems: 'center',
    position: 'relative',
  },
  roleOptionActive: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.redLight,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleIconContainerActive: {
    backgroundColor: COLORS.red,
  },
  roleOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray600,
    marginBottom: 2,
  },
  roleOptionTitleActive: {
    color: COLORS.red,
  },
  roleOptionSubtext: {
    fontSize: 11,
    color: COLORS.gray400,
    textAlign: 'center',
  },
  roleCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  staffFields: {
    marginBottom: 12,
  },
  brandOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  brandOption: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    alignItems: 'center',
    position: 'relative',
  },
  brandOptionActive: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.redLight,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  brandEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  brandNameActive: {
    color: COLORS.red,
  },
  brandCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  branchList: {
    gap: 8,
    marginBottom: 4,
  },
  branchOption: {
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  branchOptionActive: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.redLight,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  branchOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  branchOptionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  branchOptionTextActive: {
    color: COLORS.red,
    fontWeight: '600',
  },
  roleSummaryContainer: {
    marginBottom: 16,
  },
  roleSummaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    alignSelf: 'flex-start',
  },
  roleSummaryBadgeStaff: {
    backgroundColor: COLORS.blueLight,
    borderColor: COLORS.blueBorder,
  },
  roleSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
    marginHorizontal: 8,
  },
  createButton: {
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
    marginBottom: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  createText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  signInText: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  signInLink: {
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