import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Clock, ArrowRight } from 'lucide-react-native';
import { api } from '../src/lib/api';
import { colors, spacing, radii, typography } from '../src/theme';
import { Header } from '../src/components/Header';
import { Card } from '../src/components/Card';
import { EmptyState } from '../src/components/EmptyState';
import { LoadingState } from '../src/components/LoadingState';

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notificationList = notifications?.results || notifications || [];

  const handleNotificationPress = async (item: any) => {
    if (!item.is_read) {
      await api.markNotificationRead(item.id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
    if (item.data?.screen === 'Project' && item.data?.id) {
      router.push(`/project/${item.data.id}`);
    } else if (item.data?.ticket_id) {
      router.push(`/support/${item.data.ticket_id}`);
    } else if (item.data?.order_id) {
      router.push('/(tabs)/orders');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Notifications"
        rightAction={
          notificationList.length > 0 ? (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={() => markAllMutation.mutate()}
            >
              <CheckCheck size={16} color="#6EE7B7" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { refetch(); }} />}
      >
        {isLoading ? (
          <LoadingState message="Loading your notification inbox..." />
        ) : notificationList.length === 0 ? (
          <EmptyState
            title="All caught up!"
            description="You have no notifications. Important updates on your website orders and milestones will appear here."
            icon={<Bell size={44} color={colors.brand} />}
          />
        ) : (
          notificationList.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => handleNotificationPress(item)}
            >
              <Card
                style={[
                  styles.notificationCard,
                  !item.is_read && styles.unreadNotificationCard,
                ]}
              >
                <View style={styles.notifHeader}>
                  <View style={styles.notifDotRow}>
                    {!item.is_read && <View style={styles.unreadDot} />}
                    <Text style={styles.notifType}>{item.notification_type}</Text>
                  </View>
                  <Text style={styles.notifDate}>{item.created_at?.split('T')[0]}</Text>
                </View>

                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifBody}>{item.body}</Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  notificationCard: {
    padding: spacing.md,
  },
  unreadNotificationCard: {
    borderColor: '#3B82F6',
    borderWidth: 1.5,
    backgroundColor: 'rgba(10, 40, 55, 0.85)',
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  notifDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
  },
  notifType: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    textTransform: 'uppercase',
  },
  notifDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notifBody: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
    lineHeight: 17,
  },
});

