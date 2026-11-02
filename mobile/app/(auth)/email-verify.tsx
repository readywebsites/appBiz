import React, { useState, useRef, useCallback } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Mail, Info } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors, radii, spacing, typography } from '../../src/theme';
import { OtpInput } from '../../src/components/OtpInput';
import { ResendCountdown } from '../../src/components/ResendCountdown';
import { Button } from '../../src/components/Button';

export default function EmailVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email: string;
    cooldown?: string;
    dev_mode?: string;
  }>();

  const email = params.email || '';
  const initialCooldown = parseInt(params.cooldown || '45', 10);
  const isDevMode = params.dev_mode === '1';

  const { verifyEmailOtp, sendEmailOtp } = useAuth();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const handleVerify = useCallback(async (codeToVerify?: string) => {
    if (isSubmittingRef.current) return;

    const code = codeToVerify || otp;
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    isSubmittingRef.current = true;
    setError(null);
    setLoading(true);

    try {
      await verifyEmailOtp({ email, otp: code });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [otp, email, verifyEmailOtp, router]);

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await sendEmailOtp(email);
      Alert.alert('Code Sent', `A new verification code has been dispatched to ${email}.`);
    } catch (err: any) {
      setError(err.message || 'Unable to resend email verification code.');
    } finally {
      setResending(false);
    }
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
            <View style={styles.iconCircle}>
              <Mail size={28} color="#93C5FD" />
            </View>

            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit verification code to <Text style={styles.emailHighlight}>{email}</Text>.
            </Text>

            {isDevMode && (
              <View style={styles.devNotice}>
                <Info size={16} color={colors.accent} />
                <Text style={styles.devNoticeText}>
                  Development mode: Check your backend terminal for the latest 6-digit verification code.
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* 6-Digit Auto-Advancing OTP Input */}
            <OtpInput
              length={6}
              value={otp}
              onChange={(val) => {
                setOtp(val);
                if (error) setError(null);
              }}
              onComplete={handleVerify}
              disabled={loading}
              hasError={!!error}
            />

            {/* Resend Countdown Component */}
            <ResendCountdown
              initialSeconds={initialCooldown}
              onResend={handleResend}
              loading={resending}
            />

            <Button
              title="Verify & Continue"
              onPress={() => handleVerify()}
              variant="primary"
              size="lg"
              loading={loading}
              disabled={otp.length !== 6 || loading}
              style={styles.submitBtn}
            />
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
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleLarge,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emailHighlight: {
    color: colors.text,
    fontWeight: '700',
  },
  devNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentLight,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: spacing.md,
    width: '100%',
  },
  devNoticeText: {
    ...typography.bodySmall,
    color: '#92400E',
    flex: 1,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: spacing.md,
    width: '100%',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    fontWeight: '500',
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    marginTop: spacing.xl,
  },
});

