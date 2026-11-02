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
import { ChevronLeft, Edit2, Info, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors, radii, spacing, typography } from '../../src/theme';
import { OtpInput } from '../../src/components/OtpInput';
import { ResendCountdown } from '../../src/components/ResendCountdown';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function PhoneVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone: string;
    cooldown?: string;
    dev_mode?: string;
    note?: string;
  }>();

  const phone = params.phone || '';
  const initialCooldown = parseInt(params.cooldown || '45', 10);
  const isDevMode = params.dev_mode === '1';

  const { verifyPhoneOtp, sendPhoneOtp } = useAuth();

  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
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
      await verifyPhoneOtp({
        phone,
        otp: code,
        full_name: fullName.trim() || undefined,
        business_name: businessName.trim() || undefined,
      });

      // Verification successful, route to authenticated tabs
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [otp, phone, fullName, businessName, verifyPhoneOtp, router]);

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await sendPhoneOtp(phone);
      Alert.alert('Code Sent', `A new verification code has been dispatched to ${phone}.`);
    } catch (err: any) {
      setError(err.message || 'Unable to resend verification code.');
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
            <Text style={styles.title}>Enter verification code</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.subtitle}>
                Sent to <Text style={styles.phoneHighlight}>{phone}</Text>
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.editPhoneBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Edit2 size={14} color={colors.brand} />
              </TouchableOpacity>
            </View>

            {/* Dev Mode Notification if active */}
            {isDevMode && (
              <View style={styles.devNotice}>
                <Info size={16} color={colors.accent} />
                <Text style={styles.devNoticeText}>
                  Development mode: Check your backend terminal for the latest 6-digit verification code generated for this request.
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

            {/* Optional Onboarding Details (Useful for first-time phone signups) */}
            <View style={styles.onboardingSection}>
              <Text style={styles.onboardingTitle}>Business & Profile Details (Optional)</Text>
              <Text style={styles.onboardingSubtitle}>
                Add your details to automatically configure your customer account.
              </Text>

              <Input
                label="Your Full Name"
                placeholder="e.g. Ramesh Patel"
                value={fullName}
                onChangeText={setFullName}
                disabled={loading}
              />

              <Input
                label="Business / Company Name"
                placeholder="e.g. Patel Digital Solutions"
                value={businessName}
                onChangeText={setBusinessName}
                disabled={loading}
              />
            </View>

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
  },
  title: {
    ...typography.titleLarge,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
  phoneHighlight: {
    color: colors.text,
    fontWeight: '700',
  },
  editPhoneBtn: {
    padding: 2,
  },
  devNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.accentLight,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: spacing.md,
  },
  devNoticeText: {
    ...typography.bodySmall,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
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
    textAlign: 'center',
  },
  onboardingSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  onboardingTitle: {
    ...typography.titleSmall,
    color: colors.text,
  },
  onboardingSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  submitBtn: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});

