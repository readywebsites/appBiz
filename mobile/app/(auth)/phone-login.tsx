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
import { ChevronLeft, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors, radii, spacing, typography } from '../../src/theme';
import { PhoneInput } from '../../src/components/PhoneInput';
import { Button } from '../../src/components/Button';

export default function PhoneLoginScreen() {
  const router = useRouter();
  const { sendPhoneOtp } = useAuth();

  const [callingCode, setCallingCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    setError(null);
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

    if (!cleanNumber) {
      setError('Please enter your mobile number.');
      return;
    }

    if (callingCode === '+91' && cleanNumber.length !== 10) {
      setError('Indian mobile numbers must be 10 digits.');
      return;
    }

    if (cleanNumber.length < 7) {
      setError('Please enter a valid mobile number.');
      return;
    }

    const fullPhoneNumber = `${callingCode}${cleanNumber}`;
    setLoading(true);

    try {
      const res = await sendPhoneOtp(fullPhoneNumber);
      router.push({
        pathname: '/(auth)/phone-verify',
        params: {
          phone: fullPhoneNumber,
          cooldown: res.cooldown || 45,
          dev_mode: res.dev_mode ? '1' : '0',
          note: res.note || '',
        },
      });
    } catch (err: any) {
      setError(err.message || 'Unable to send verification code. Please try again.');
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>Enter your mobile number</Text>
            <Text style={styles.subtitle}>
              We will send an SMS with a 6-digit verification code to verify your identity.
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <PhoneInput
                label="Mobile Number"
                value={phoneNumber}
                onChangePhoneNumber={(text) => {
                  setPhoneNumber(text);
                  if (error) setError(null);
                }}
                callingCode={callingCode}
                onChangeCallingCode={setCallingCode}
                disabled={loading}
              />
            </View>

            <View style={styles.securityNote}>
              <ShieldCheck size={18} color="#93C5FD" />
              <Text style={styles.securityText}>
                Your number is securely stored and never shared with advertisers.
              </Text>
            </View>

            <Button
              title="Send Verification Code"
              onPress={handleSendCode}
              variant="primary"
              size="lg"
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          {/* Quick Demo Fill Helper for evaluation */}
          <TouchableOpacity
            style={styles.demoFill}
            onPress={() => {
              setCallingCode('+91');
              setPhoneNumber('9876543210');
            }}
          >
            <Text style={styles.demoFillText}>💡 Tap to fill Demo Client number (+91 98765 43210)</Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
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
  inputContainer: {
    marginBottom: spacing.lg,
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
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(37, 99, 235, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.xl,
  },
  securityText: {
    ...typography.bodySmall,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    width: '100%',
  },
  demoFill: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  demoFillText: {
    ...typography.bodySmall,
    color: '#6EE7B7',
    fontWeight: '700',
  },
});

