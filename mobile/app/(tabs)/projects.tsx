import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban,
  Clock,
  Globe,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';
import { colors, spacing, radii, typography } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingState } from '../../src/components/LoadingState';

export default function ProjectsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['myProjects'],
    queryFn: () => api.getMyProjects(),
    enabled: isAuthenticated,
  });

  const projectList = projects?.results || projects || [];

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Projects</Text>
        </View>
        <EmptyState
          title="Sign in to track your website delivery"
          description="Log in with your customer account to view live milestone updates, staging previews and submit revision feedback."
          actionTitle="Sign In"
          onAction={() => router.push('/(auth)/login')}
          icon={<FolderKanban size={48} color={colors.brand} />}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Projects & Deliverables</Text>
        <Text style={styles.headerSubtitle}>Real-time milestone progress, staging previews & approvals</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { refetch(); }} />}
      >
        {isLoading ? (
          <LoadingState message="Loading your project milestones..." />
        ) : projectList.length === 0 ? (
          <EmptyState
            title="No Active Projects Yet"
            description="Once you choose a website package and complete your booking, your project delivery tracker will activate here automatically."
            actionTitle="Browse Website Packages"
            onAction={() => router.push('/(tabs)/services')}
            icon={<FolderKanban size={48} color={colors.brand} />}
          />
        ) : (
          projectList.map((project: any) => (
            <Card key={project.id} style={styles.projectCard}>
              <View style={styles.projectTop}>
                <Text style={styles.orderNumberText}>{project.order_number}</Text>
                <Badge
                  label={project.status?.replace(/_/g, ' ')}
                  variant={project.status === 'COMPLETED' ? 'success' : 'brand'}
                />
              </View>

              <Text style={styles.projectTitle}>{project.title}</Text>

              {/* Progress Slider */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Completion Progress</Text>
                  <Text style={styles.progressValue}>{project.progress_percentage}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${project.progress_percentage}%` }]}
                  />
                </View>
              </View>

              {/* Staging / Live Links */}
              <View style={styles.linksRow}>
                {project.staging_url ? (
                  <TouchableOpacity
                    style={styles.urlLink}
                    onPress={() => Linking.openURL(project.staging_url)}
                  >
                    <Globe size={14} color={colors.brand} />
                    <Text style={styles.urlLinkText}>Open Staging Preview</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.urlLink}>
                    <Clock size={14} color={colors.textLight} />
                    <Text style={styles.urlPendingText}>Staging in development</Text>
                  </View>
                )}

                {project.target_delivery_date && (
                  <Text style={styles.targetDateText}>Due: {project.target_delivery_date}</Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                {project.status === 'AWAITING_REQUIREMENTS' && (
                  <Button
                    title="Submit Requirements 📋"
                    onPress={() => router.push(`/project/${project.id}`)}
                    variant="outline"
                    size="sm"
                    style={{ ...styles.fullButton, borderColor: '#6EE7B7' }}
                  />
                )}
                <Button
                  title="View Portal & Milestones"
                  onPress={() => router.push(`/project/${project.id}`)}
                  variant="primary"
                  size="sm"
                  style={styles.fullButton}
                />
              </View>
            </Card>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.glass.header,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        } as any)
      : {}),
  },
  headerTitle: {
    ...typography.titleLarge,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: '#94A3B8',
    marginTop: 2,
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  projectCard: {
    padding: spacing.lg,
  },
  projectTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  orderNumberText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  projectTitle: {
    ...typography.titleSmall,
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  progressValue: {
    fontSize: 12,
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
    backgroundColor: colors.brand,
    borderRadius: radii.full,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  urlLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urlLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand,
  },
  urlPendingText: {
    fontSize: 11,
    color: colors.textLight,
  },
  targetDateText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  cardActions: {
    marginTop: spacing.md,
  },
  fullButton: {
    width: '100%',
  },
});
