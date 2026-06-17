import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerThunk, loginThunk, AppDispatch, RootState } from '../store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme/colors';
import Icon from '../components/Icon';
import AppLogo from '../components/AppLogo';
import AnimatedPressable from '../components/AnimatedPressable';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Details', 'Please enter your name, email, and password.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password Too Short', 'Use at least 8 characters for your password.');
      return;
    }
    try {
      await dispatch(registerThunk({ email: email.trim(), password, displayName: displayName.trim() })).unwrap();
      await dispatch(loginThunk({ email: email.trim(), password })).unwrap();
    } catch {
      // handled by Redux
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn} pressedScale={0.9}>
            <Icon name="chevronLeft" size={24} color={COLORS.primary} />
          </AnimatedPressable>
          <View style={styles.logoArea}>
            <View style={styles.logoWrapper}>
              <AppLogo size={68} radius={18} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the durian community</Text>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={COLORS.textTertiary}
            value={displayName}
            onChangeText={setDisplayName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={COLORS.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Min 8 characters"
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <AnimatedPressable style={styles.eyeButton} onPress={() => setShowPassword((value) => !value)} pressedScale={0.9}>
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} color={COLORS.primary} />
            </AnimatedPressable>
          </View>
        </View>

        {/* Button */}
        <AnimatedPressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </AnimatedPressable>

        {/* Link */}
        <AnimatedPressable
          onPress={() => navigation.navigate('Login')}
          style={styles.link}
          pressedScale={0.96}
        >
          <Text style={styles.linkText}>
            Already have an account?{' '}
            <Text style={styles.linkHighlight}>Log In</Text>
          </Text>
        </AnimatedPressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  header: {
    position: 'relative',
    marginBottom: 32,
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
    padding: 4,
  },
  logoArea: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 86,
    height: 86,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textTertiary,
    letterSpacing: 0.3,
  },
  errorBox: {
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  eyeButton: {
    minWidth: 58,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  link: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.textTertiary,
    fontSize: 14,
  },
  linkHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
