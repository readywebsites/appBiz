import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../src/components/Header';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { api } from '../src/lib/api';
import { colors, spacing, radii, typography } from '../src/theme';

export default function EnquiryScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [requirements, setRequirements] = useState('');
  const [budget, setBudget] = useState('499');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !requirements.trim()) {
      Alert.alert('Required Fields', 'Please complete your contact details and project requirements.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitEnquiry({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company_name: companyName.trim(),
        requirements: requirements.trim(),
        estimated_budget: budget || '499',
        source: 'Mobile App Custom Quotation',
      });

      Alert.alert(
        'Enquiry Submitted! 🚀',
        `Your quotation request has been logged with reference ${res.reference_id}. Our technical architect will review and contact you within 2 business hours.`,
        [{ text: 'Great, thanks!', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Could not submit enquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Request Custom Quotation" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.introBox}>
            <Text style={styles.introTitle}>Custom Website Scope</Text>
            <Text style={styles.introDesc}>
              Have unique design needs, specific payment gateway requirements, or a large multi-vendor catalog? Tell us what you're building.
            </Text>
          </View>

          <Input
            label="Full Name"
            placeholder="e.g. Sameer Nair"
            value={fullName}
            onChangeText={setFullName}
          />

          <Input
            label="Work Email"
            placeholder="sameer@yourbusiness.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="Mobile Phone (With WhatsApp)"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Input
            label="Company / Brand Name"
            placeholder="e.g. Nair Logistics"
            value={companyName}
            onChangeText={setCompanyName}
          />

          <Input
            label="Estimated Budget (₹ INR)"
            placeholder="e.g. 9999"
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
          />

          <Input
            label="Detailed Project Requirements & Features"
            placeholder="Describe what pages you need, target delivery date, reference websites you like..."
            multiline
            numberOfLines={4}
            value={requirements}
            onChangeText={setRequirements}
            style={styles.textArea}
          />

          <Button
            title="Submit Quotation Request"
            onPress={handleSubmit}
            loading={loading}
            variant="primary"
            size="lg"
            style={styles.submitButton}
          />
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
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  introBox: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  introTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  introDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

