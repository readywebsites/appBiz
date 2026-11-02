import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Boxes,
  Globe,
  Server,
  ShieldCheck,
  Calendar,
  ArrowRight,
  ExternalLink,
  Clock,
  Sparkles,
  RefreshCw,
  FolderKanban,
} from 'lucide-react-native';
import { api } from '../src/lib/api';
import { useAuth } from '../src/context/AuthContext';
import { colors, spacing, radii, typography } from '../src/theme';
import { Header } from '../src/components/Header';
import { Card } from '../src/components/Card';
import { Button } from '../src/components/Button';
import { Badge } from '../src/components/Badge';
import { LoadingState } from '../src/components/LoadingState';
import { EmptyState } from '../src/components/EmptyState';

export default function MyServicesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<'all' | 'active' | 'in_progress' | 'renewal_due'>('all');

  const {
    data: services = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['myServices'],
    queryFn: () => api.getMyServices(),
    enabled: isAuthenticated,
  });

  const filteredServices = (services || []).filter((s: any) => {
    if (filter === 'active') return s.status === 'ACTIVE';
    if (filter === 'in_progress') return s.status === 'IN_PROGRESS';
    if (filter === 'renewal_due') return s.status === 'RENEWAL_DUE';
    return true;
  });

  const handleRequestRenewal = (service: any) => {
    Alert.alert(
      'Service & Domain Renewal',
      `Annual renewal rate for ${service.domain_name || service.title} is ₹${service.renewal_price || '1,499'}. Would you like to request renewal confirmation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Renewal',
          onPress: async () => {
            if (service.project_id) {
              try {
                await api.requestDomainRenewal(service.project_id, 'Client requested renewal from My Services.');
                Alert.alert('Renewal Requested', 'Our billing team will prepare your renewal invoice and confirm extension.');
                refetch();
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Could not submit renewal request.');
              }
            } else {
              Alert.alert('Renewal Queued', 'Your renewal request has been noted. Our team will contact you.');
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="My Services & Care Plans" showBack />
        <EmptyState
          title="Sign in to view your services"
          description="Log in with your customer account to view your purchased website packages, domain renewals, and active cloud care plans."
          actionTitle="Sign In"
          onAction={() => router.push('/(auth)/welcome')}
          icon={<Boxes size={48} color={colors.brand} />}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="My Services & Care Plans"
        subtitle="Active websites, domain hosting and subscriptions"
        showBack
      />

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All Services ({services.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'active' && styles.filterChipActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
              Active Sites
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'in_progress' && styles.filterChipActive]}
            onPress={() => setFilter('in_progress')}
          >
            <Text style={[styles.filterText, filter === 'in_progress' && styles.filterTextActive]}>
              In Development
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'renewal_due' && styles.filterChipActive]}
            onPress={() => setFilter('renewal_due')}
          >
            <Text style={[styles.filterText, filter === 'renewal_due' && styles.filterTextActive]}>
              Renewals Due
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
      >
        {isLoading ? (
          <LoadingState message="Loading your services & care plans..." />
        ) : filteredServices.length === 0 ? (
          <EmptyState
            title="No Services Found"
            description="You don't have any active packages under this filter. Browse our high-performance website packages to launch a site."
            actionTitle="Browse Website Packages"
            onAction={() => router.push('/(tabs)/services')}
            icon={<Boxes size={48} color={colors.brand} />}
          />
        ) : (
          filteredServices.map((service: any) => {
            const isActive = service.status === 'ACTIVE';
            const isRenewalDue = service.status === 'RENEWAL_DUE';

            return (
              <Card key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderNumber}>{service.order_number}</Text>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceCategory}>
                      {service.category} • {service.package_name}
                    </Text>
                  </View>
                  <Badge
                    label={service.status?.replace(/_/g, ' ')}
                    variant={isActive ? 'success' : isRenewalDue ? 'warning' : 'brand'}
                  />
                </View>

                {/* Infrastructure Details */}
                <View style={styles.infraCard}>
                  {service.domain_name && (
                    <View style={styles.infraRow}>
                      <Globe size={14} color="#6EE7B7" />
                      <Text style={styles.infraText} numberOfLines={1}>
                        Domain: <Text style={styles.whiteBold}>{service.domain_name}</Text>
                      </Text>
                    </View>
                  )}

                  <View style={styles.infraRow}>
                    <ShieldCheck size={14} color="#93C5FD" />
                    <Text style={styles.infraText}>
                      SSL Security: <Text style={styles.whiteBold}>{service.ssl_status} (Automated TLS)</Text>
                    </Text>
                  </View>

                  <View style={styles.infraRow}>
                    <Server size={14} color="#34D399" />
                    <Text style={styles.infraText}>
                      Hosting Plan: <Text style={styles.whiteBold}>{service.hosting_plan}</Text>
                    </Text>
                  </View>

                  {service.renewal_date && (
                    <View style={styles.infraRow}>
                      <Calendar size={14} color="#FBBF24" />
                      <Text style={styles.infraText}>
                        Renewal Date: <Text style={styles.whiteBold}>{service.renewal_date}</Text> (₹{service.renewal_price}/year)
                      </Text>
                    </View>
                  )}
                </View>

                {/* Progress bar if in development */}
                {!isActive && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressRow}>
                      <Text style={styles.progressLabel}>Delivery Milestone Progress</Text>
                      <Text style={styles.progressValue}>{service.progress_percentage}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${service.progress_percentage}%` }]} />
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  {service.project_id && (
                    <Button
                      title="Open Project Portal"
                      onPress={() => router.push(`/project/${service.project_id}`)}
                      variant="primary"
                      size="sm"
                      style={styles.flex1}
                      icon={<FolderKanban size={14} color="#FFFFFF" />}
                    />
                  )}

                  {service.live_url && (
                    <TouchableOpacity
                      style={styles.liveBtn}
                      onPress={() => Linking.openURL(service.live_url)}
                    >
                      <ExternalLink size={14} color="#6EE7B7" />
                      <Text style={styles.liveBtnText}>Visit Site</Text>
                    </TouchableOpacity>
                  )}

                  {(isActive || isRenewalDue) && (
                    <TouchableOpacity
                      style={styles.renewBtn}
                      onPress={() => handleRequestRenewal(service)}
                    >
                      <RefreshCw size={13} color="#93C5FD" />
                      <Text style={styles.renewBtnText}>Renew</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          })
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
  filterBar: {
    backgroundColor: colors.glass.header,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
    paddingVertical: spacing.xs,
  },
  filterScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.20)',
    borderColor: 'rgba(110, 231, 183, 0.40)',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterTextActive: {
    color: '#6EE7B7',
    fontWeight: '700',
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  serviceCard: {
    gap: spacing.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  orderNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6EE7B7',
    letterSpacing: 0.5,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  serviceCategory: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  infraCard: {
    backgroundColor: 'rgba(6, 78, 59, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.25)',
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    gap: 6,
  },
  infraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infraText: {
    fontSize: 11,
    color: '#CBD5E1',
    flex: 1,
  },
  whiteBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressContainer: {
    gap: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: radii.full,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  flex1: {
    flex: 1,
  },
  liveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.35)',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.md,
  },
  liveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  renewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37, 99, 235, 0.20)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.md,
  },
  renewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
  },
});
