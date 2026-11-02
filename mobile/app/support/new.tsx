import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, Send, CheckCircle2 } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/context/AuthContext';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { colors, spacing, typography, radii } from '../../src/theme';

const CATEGORIES = [
  { id: 'GENERAL', label: 'General Enquiry' },
  { id: 'PROJECT', label: 'Project & Scope' },
  { id: 'BILLING', label: 'Billing & Payments' },
  { id: 'TECHNICAL', label: 'Technical & Bug' },
  { id: 'SALES', label: 'Sales & Upgrade' },
];

const PRIORITIES = [
  { id: 'LOW', label: 'Low', color: colors.textMuted },
  { id: 'MEDIUM', label: 'Medium', color: colors.accent },
  { id: 'HIGH', label: 'High', color: colors.brand },
  { id: 'URGENT', label: 'Urgent', color: colors.danger },
];

export default function NewSupportTicketScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: {
      subject: string;
      category: string;
      priority: string;
      initial_message: string;
    }) => api.createTicket(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      Alert.alert(
        'Ticket Created',
        `Your support request #${data.ticket_number} has been logged. Our technical team will respond shortly.`,
        [
          {
            text: 'View Ticket',
            onPress: () => router.replace(`/support/${data.id}` as any),
          },
        ]
      );
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to submit ticket. Please try again.');
    },
  });

  const handleSubmit = () => {
    setError(null);
    if (!subject.trim()) {
      setError('Please provide a subject line for your query.');
      return;
    }
    if (!initialMessage.trim()) {
      setError('Please describe your issue or requirement.');
      return;
    }

    createMutation.mutate({
      subject: subject.trim(),
      category,
      priority,
      initial_message: initialMessage.trim(),
    });
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="New Ticket" showBack />
        <View style={styles.authPrompt}>
          <LifeBuoy size={48} color={colors.textLight} />
          <Text style={styles.authTitle}>Sign In Required</Text>
          <Text style={styles.authSubtitle}>
            Please sign in to raise a support ticket and connect with our technical engineers.
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            size="md"
            style={{ width: '100%', marginTop: spacing.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Raise Support Ticket" showBack />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Category Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.chipsRow}>
              {CATEGORIES.map((c) => {
                const isSelected = category === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setCategory(c.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Priority Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.chipsRow}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.chip,
                      isSelected && {
                        backgroundColor: p.color,
                        borderColor: p.color,
                      },
                    ]}
                    onPress={() => setPriority(p.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && { color: colors.white, fontWeight: '700' },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Subject Field */}
          <Input
            label="Subject"
            placeholder="e.g. Need to update hero banner text on staging site"
            value={subject}
            onChangeText={setSubject}
            maxLength={180}
          />

          {/* Description Field */}
          <Input
            label="Detailed Description"
            placeholder="Please detail what you need help with. Include URL, screen details, or revision steps..."
            value={initialMessage}
            onChangeText={setInitialMessage}
            multiline
            numberOfLines={5}
            style={styles.messageInput}
          />

          <View style={styles.helpNote}>
            <Text style={styles.helpNoteText}>
              Biz499 support SLAs: Critical/Urgent queries are acknowledged within 2 hours. General queries are responded to within same business day.
            </Text>
          </View>

          <Button
            title="Submit Ticket"
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            loading={createMutation.isPending}
            style={styles.submitBtn}
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
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helpNote: {
    padding: spacing.md,
    backgroundColor: colors.borderLight,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
  },
  helpNoteText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  errorBox: {
    padding: spacing.md,
    backgroundColor: colors.dangerLight,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  authTitle: {
    ...typography.titleMedium,
    color: colors.text,
    marginTop: spacing.md,
  },
  authSubtitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

