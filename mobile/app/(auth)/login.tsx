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
import { Lock, Mail, ArrowRight, X } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, radii, typography } from '../../src/theme';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.back();
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoClient = () => {
    setEmail('demo.client@example.com');
    setPassword('Biz499Client#2026');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>BIZ499</Text>
            </View>
            <Text style={styles.title}>Sign in to your account</Text>
            <Text style={styles.subtitle}>
              Access your website project status, custom quotes, and invoices
            </Text>

            <View style={styles.form}>
              <Input
                label="Email Address"
                placeholder="client@yourbusiness.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Input
                label="Password"
                placeholder="••••••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                variant="primary"
                size="lg"
                style={styles.loginButton}
              />
            </View>

            {/* Quick Demo Fill */}
            <TouchableOpacity style={styles.demoFillButton} onPress={fillDemoClient}>
              <Text style={styles.demoFillText}>Use Demo Client Account (1-Click)</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                <Text style={styles.signupLink}>Create Account</Text>
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
    backgroundColor: '#073327',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingVertical: spacing.md,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  brandBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.40)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
  },
  title: {
    ...typography.titleLarge,
    color: '#FFFFFF',
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.xs,
  },
  loginButton: {
    marginTop: spacing.md,
  },
  demoFillButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  demoFillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxl,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  signupLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6EE7B7',
  },
});

