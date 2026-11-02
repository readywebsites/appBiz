import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, ShieldCheck, User as UserIcon, RefreshCw } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { Header } from '../../src/components/Header';
import { Badge } from '../../src/components/Badge';
import { LoadingState } from '../../src/components/LoadingState';
import { colors, spacing, typography, radii } from '../../src/theme';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const {
    data: ticket,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['support-ticket', id],
    queryFn: () => api.getTicketDetail(id!),
    enabled: !!id,
    refetchInterval: 10000, // Poll every 10s for updates
  });

  const replyMutation = useMutation({
    mutationFn: (message: string) => api.replyTicket(id!, message),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['support-ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => api.closeTicket(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      Alert.alert('Ticket Closed', 'This support ticket has been resolved and closed.');
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => api.reopenTicket(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      Alert.alert('Ticket Reopened', 'This support ticket has been reopened for follow-up.');
    },
  });

  const handleSend = () => {
    if (!replyText.trim() || replyMutation.isPending) return;
    replyMutation.mutate(replyText.trim());
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

  if (isLoading || !ticket) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Ticket Thread" showBack />
        <LoadingState message="Loading ticket conversation..." />
      </SafeAreaView>
    );
  }

  const isClosed = ticket.status === 'CLOSED';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={ticket.ticket_number}
        subtitle={ticket.category}
        showBack
        rightAction={
          <TouchableOpacity onPress={() => refetch()} disabled={isRefetching}>
            <RefreshCw size={18} color={isRefetching ? colors.brand : colors.textMuted} />
          </TouchableOpacity>
        }
      />

      {/* Ticket Context Header */}
      <View style={styles.headerContext}>
        <View style={styles.headerTop}>
          <Text style={styles.ticketSubject} numberOfLines={2}>
            {ticket.subject}
          </Text>
          <Badge
            label={formatStatus(ticket.status)}
            variant={getStatusVariant(ticket.status)}
          />
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.headerMetaText}>Priority: {ticket.priority}</Text>
          <Text style={styles.headerMetaText}>•</Text>
          <Text style={styles.headerMetaText}>
            Opened{' '}
            {new Date(ticket.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.ticketActionsRow}>
          {isClosed ? (
            <TouchableOpacity
              style={styles.reopenButton}
              onPress={() => reopenMutation.mutate()}
              disabled={reopenMutation.isPending}
            >
              <RefreshCw size={12} color="#6EE7B7" />
              <Text style={styles.reopenButtonText}>
                {reopenMutation.isPending ? 'Reopening...' : 'Reopen Ticket'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
            >
              <ShieldCheck size={12} color="#94A3B8" />
              <Text style={styles.closeButtonText}>
                {closeMutation.isPending ? 'Closing...' : 'Mark Resolved & Close'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={ticket.messages || []}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isStaff = item.is_staff_reply;
            return (
              <View style={[styles.messageWrapper, isStaff ? styles.staffWrapper : styles.clientWrapper]}>
                {isStaff && (
                  <View style={styles.staffHeader}>
                    <ShieldCheck size={14} color={colors.brand} />
                    <Text style={styles.staffHeaderTitle}>Biz499 Support ({item.sender_name})</Text>
                  </View>
                )}
                <View style={[styles.bubble, isStaff ? styles.staffBubble : styles.clientBubble]}>
                  <Text style={[styles.messageText, isStaff ? styles.staffText : styles.clientText]}>
                    {item.message}
                  </Text>
                </View>
                <Text style={styles.timestamp}>
                  {new Date(item.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          }}
        />

        {/* Reply Bar */}
        {isClosed ? (
          <View style={styles.closedNotice}>
            <Text style={styles.closedNoticeText}>
              This ticket has been marked as resolved & closed. If you need further assistance, please raise a new ticket.
            </Text>
          </View>
        ) : (
          <View style={styles.replyBar}>
            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply to technical support..."
              placeholderTextColor={colors.textLight}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!replyText.trim() || replyMutation.isPending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!replyText.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Send size={18} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerContext: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  ticketSubject: {
    flex: 1,
    ...typography.titleSmall,
    color: colors.text,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerMetaText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  ticketActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  reopenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.35)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  reopenButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  closeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  messagesContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  messageWrapper: {
    maxWidth: '82%',
    gap: 3,
  },
  staffWrapper: {
    alignSelf: 'flex-start',
  },
  clientWrapper: {
    alignSelf: 'flex-end',
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
    marginLeft: 4,
  },
  staffHeaderTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.brand,
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.lg,
  },
  staffBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 4,
  },
  clientBubble: {
    backgroundColor: colors.brand,
    borderTopRightRadius: 4,
  },
  messageText: {
    ...typography.bodyMedium,
    lineHeight: 20,
  },
  staffText: {
    color: colors.text,
  },
  clientText: {
    color: colors.white,
  },
  timestamp: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.textLight,
    alignSelf: 'flex-end',
    marginTop: 2,
    marginRight: 4,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  replyInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    ...typography.bodyMedium,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  closedNotice: {
    padding: spacing.md,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
  },
  closedNoticeText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
