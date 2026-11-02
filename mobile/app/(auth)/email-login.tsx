import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, Lock, Mail, ShieldAlert } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors, radii, spacing, typography } from '../../src/theme';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function EmailLoginScreen() {
  const router = useRouter();
  const { loginWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithEmail({ email: email.trim().toLowerCase(), password });

      if (res.requires_otp) {
        // Route to email OTP verification screen
        router.push({
          pathname: '/(auth)/email-verify',
          params: {
            email: email.trim().toLowerCase(),
            cooldown: res.cooldown || 45,
            dev_mode: res.dev_mode ? '1' : '0',
          },
        });
      } else {
        // Authenticated directly
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoClient = () => {
    setEmail('demo.client@example.com');
    setPassword('Biz499Client#2026');
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Sign in with Email</Text>
            <Text style={styles.subtitle}>
              Enter your Biz499 account email and password to access your dashboard.
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="Email Address"
              placeholder="name@company.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={loading}
            />

            <View style={styles.passwordWrapper}>
              <Input
                label="Biz499 Account Password"
                placeholder="Enter account password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry={!showPassword}
                disabled={loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.textMuted} />
                ) : (
                  <Eye size={18} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() =>
                Alert.alert(
                  'Password Reset',
                  'To reset your password, contact support@biz499.com or ask your account manager.'
                )
              }
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              variant="primary"
              size="lg"
              loading={loading}
              style={styles.submitBtn}
            />

            {/* 1-Click Demo Client Pre-fill */}
            <TouchableOpacity style={styles.demoBox} onPress={fillDemoClient}>
              <Text style={styles.demoBoxTitle}>⚡ 1-Click Demo Client</Text>
              <Text style={styles.demoBoxText}>demo.client@example.com / Biz499Client#2026</Text>
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerPrompt}>Don't have an account yet?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.titleLarge,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    fontWeight: '500',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: 38,
    padding: 4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
    marginTop: -spacing.xs,
  },
  forgotText: {
    ...typography.bodySmall,
    color: '#6EE7B7',
    fontWeight: '700',
  },
  submitBtn: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  demoBox: {
    backgroundColor: 'rgba(37, 99, 235, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  demoBoxTitle: {
    ...typography.label,
    color: '#93C5FD',
    marginBottom: 2,
  },
  demoBoxText: {
    ...typography.bodySmall,
    color: '#E2E8F0',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
  },
  registerPrompt: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
  registerLink: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: '#6EE7B7',
  },
});

