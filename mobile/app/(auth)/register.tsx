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
import { X } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, radii, typography } from '../../src/theme';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password || !firstName.trim()) {
      Alert.alert('Required Fields', 'Please fill in your name, email, and a secure password.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password Length', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        business_name: businessName.trim(),
        referred_by: referralCode.trim(),
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Please check your inputs.');
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Start acquiring clients with your high-speed custom website
            </Text>

            <View style={styles.form}>
              <View style={styles.row}>
                <Input
                  label="First Name"
                  placeholder="Rahul"
                  value={firstName}
                  onChangeText={setFirstName}
                  containerStyle={styles.halfInput}
                />
                <Input
                  label="Last Name"
                  placeholder="Sharma"
                  value={lastName}
                  onChangeText={setLastName}
                  containerStyle={styles.halfInput}
                />
              </View>

              <Input
                label="Work Email"
                placeholder="rahul@business.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Input
                label="Mobile Phone (For WhatsApp updates)"
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Input
                label="Business / Brand Name"
                placeholder="e.g. Sharma Traders"
                value={businessName}
                onChangeText={setBusinessName}
              />

              <Input
                label="Password (min 8 characters)"
                placeholder="••••••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Input
                label="Referral Code (Optional)"
                placeholder="e.g. BIZ-APEX99"
                autoCapitalize="characters"
                value={referralCode}
                onChangeText={setReferralCode}
              />

              <Button
                title="Create Account & Continue"
                onPress={handleRegister}
                loading={loading}
                variant="primary"
                size="lg"
                style={styles.registerButton}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.signinLink}>Sign In</Text>
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
    paddingVertical: spacing.sm,
  },
  brandBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.40)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
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
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  signinLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6EE7B7',
  },
});

