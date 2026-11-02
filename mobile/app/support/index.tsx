import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LifeBuoy, Plus, ChevronRight, MessageSquare, AlertCircle } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/context/AuthContext';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { LoadingState } from '../../src/components/LoadingState';
import { EmptyState } from '../../src/components/EmptyState';
import { colors, spacing, typography, radii } from '../../src/theme';

export default function SupportTicketsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const { data: tickets = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => api.getTickets(),
    enabled: isAuthenticated,
  });

  const getStatusVariant = (status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'brand' => {
    switch (status) {
      case 'OPEN':
        return 'brand';
      case 'IN_PROGRESS':
        return 'warning';
      case 'WAITING_CUSTOMER':
        return 'danger';
      case 'RESOLVED':
      case 'CLOSED':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'Open';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'WAITING_CUSTOMER':
        return 'Action Required';
      case 'RESOLVED':
        return 'Resolved';
      case 'CLOSED':
        return 'Closed';
      default:
        return status;
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Support Desk" showBack />
        <View style={styles.authPrompt}>
          <LifeBuoy size={48} color={colors.textLight} />
          <Text style={styles.authTitle}>Support & Helpdesk</Text>
          <Text style={styles.authSubtitle}>
            Please sign in to view your tickets, submit new queries, or track resolution status.
          </Text>
          <Button
            title="Sign In to Continue"
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
      <Header
        title="Support Tickets"
        showBack
        rightAction={
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => router.push('/support/new')}
            activeOpacity={0.8}
          >
            <Plus size={16} color={colors.white} />
            <Text style={styles.newButtonText}>New</Text>
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading tickets..." />
      ) : tickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="No Support Tickets"
            description="Have a question about your website project, payments, or scope? Raise a ticket and our team will assist you promptly."
            actionTitle="Create Support Ticket"
            onAction={() => router.push('/support/new')}
          />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={colors.brand} />
          }
          renderItem={({ item }) => (
            <Card style={styles.ticketCard} onPress={() => router.push(`/support/${item.id}` as any)}>
              <View style={styles.cardHeader}>
                <View style={styles.metaRow}>
                  <Text style={styles.ticketNumber}>{item.ticket_number}</Text>
                  <Text style={styles.categoryBadge}>{item.category}</Text>
                </View>
                <Badge label={formatStatus(item.status)} variant={getStatusVariant(item.status)} />
              </View>

              <Text style={styles.ticketSubject} numberOfLines={2}>
                {item.subject}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.messageCount}>
                  <MessageSquare size={13} color={colors.textMuted} />
                  <Text style={styles.messageCountText}>
                    {item.messages ? item.messages.length : 1} messages
                  </Text>
                </View>
                <View style={styles.viewRow}>
                  <Text style={styles.dateText}>
                    {new Date(item.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                  <ChevronRight size={16} color={colors.textLight} />
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  newButtonText: {
    color: colors.white,
    ...typography.label,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  ticketCard: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ticketNumber: {
    ...typography.label,
    color: colors.brand,
  },
  categoryBadge: {
    ...typography.bodySmall,
    color: colors.textMuted,
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
    textTransform: 'capitalize',
  },
  ticketSubject: {
    ...typography.titleSmall,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  messageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  messageCountText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    ...typography.bodySmall,
    color: colors.textLight,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
});
