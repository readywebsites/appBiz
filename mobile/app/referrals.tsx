import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Share2,
  Copy,
  Gift,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { api } from '../src/lib/api';
import { useAuth } from '../src/context/AuthContext';
import { colors, spacing, radii, typography, glassShadows } from '../src/theme';
import { Header } from '../src/components/Header';
import { Card } from '../src/components/Card';
import { Button } from '../src/components/Button';
import { Badge } from '../src/components/Badge';
import { LoadingState } from '../src/components/LoadingState';

export default function ReferralsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);

  const {
    data: referralData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['referrals-dashboard'],
    queryFn: () => api.getReferrals(),
    enabled: isAuthenticated,
  });

  const referralCode =
    referralData?.referral_code || user?.customer_profile?.referral_code || 'BIZ-499';
  const referralUrl = referralData?.referral_url || `https://biz499.com/ref/${referralCode}`;

  const handleCopyCode = async () => {
    setCopied(true);
    Alert.alert('Referral Code Copied! 📋', `Share code ${referralCode} with your business network to gift ₹500 off.`);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Biz499 - Website Development for ₹499',
        message: `Get your business online with a modern high-speed website from Biz499! Use my referral code ${referralCode} to claim ₹500 off your package: ${referralUrl}`,
        url: referralUrl,
      });
    } catch (err: any) {
      // User cancelled share
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Referrals & Rewards" showBack />
        <View style={styles.authPrompt}>
          <Gift size={48} color={colors.brand} />
          <Text style={styles.authTitle}>Invite Friends, Earn ₹500</Text>
          <Text style={styles.authSubtitle}>
            Sign in to access your unique referral code, track invited businesses, and redeem service credits.
          </Text>
          <Button
            title="Sign In to Continue"
            onPress={() => router.push('/(auth)/welcome')}
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
      <Header title="Referrals & Rewards Hub" subtitle="Gift ₹500 • Earn ₹500" showBack />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
      >
        {isLoading ? (
          <LoadingState message="Loading referral rewards..." />
        ) : (
          <>
            {/* Hero Referral Card */}
            <Card style={styles.heroCard}>
              <View style={styles.badgeRow}>
                <Badge label="PARTNER REWARD" variant="brand" />
                <Sparkles size={16} color="#6EE7B7" />
              </View>

              <Text style={styles.heroTitle}>Share Biz499 with Fellow Businesses</Text>
              <Text style={styles.heroSubtitle}>
                Both you and your referred business contact get <Text style={styles.highlightText}>₹500 off</Text> on website development packages!
              </Text>

              {/* Code Box */}
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>YOUR UNIQUE REFERRAL CODE</Text>
                <Text style={styles.codeText}>{referralCode}</Text>
                <View style={styles.codeActions}>
                  <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
                    <Copy size={14} color="#93C5FD" />
                    <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy Code'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <Share2 size={14} color="#064E3B" />
                    <Text style={styles.shareBtnText}>Share Link</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <Card style={styles.metricCard}>
                <Users size={18} color="#93C5FD" />
                <Text style={styles.metricValue}>{referralData?.total_invited || 0}</Text>
                <Text style={styles.metricLabel}>Invited Contacts</Text>
              </Card>

              <Card style={styles.metricCard}>
                <CheckCircle2 size={18} color="#6EE7B7" />
                <Text style={styles.metricValue}>{referralData?.successful_referrals || 0}</Text>
                <Text style={styles.metricLabel}>Qualified Orders</Text>
              </Card>

              <Card style={styles.metricCard}>
                <Gift size={18} color="#FBBF24" />
                <Text style={styles.metricValue}>₹{referralData?.earned_rewards || '0'}</Text>
                <Text style={styles.metricLabel}>Credits Earned</Text>
              </Card>
            </View>

            {/* How It Works Section */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>How the Referral Program Works</Text>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Share Your Code</Text>
                  <Text style={styles.stepDesc}>Send your referral code or link to business owners needing a website or redesign.</Text>
                </View>
              </View>

              <View style={styles.stepDivider} />

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>They Save ₹500 Instantly</Text>
                  <Text style={styles.stepDesc}>Your referral enters your code during registration or checkout to claim ₹500 off.</Text>
                </View>
              </View>

              <View style={styles.stepDivider} />

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>You Earn ₹500 Service Credit</Text>
                  <Text style={styles.stepDesc}>Upon their first package completion, ₹500 credit is deposited directly into your account.</Text>
                </View>
              </View>
            </Card>

            {/* Referral Activity Log */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>Referral Activity</Text>
              {referralData?.history && referralData.history.length > 0 ? (
                referralData.history.map((item: any) => (
                  <View key={item.id} style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyUser}>{item.referred_user}</Text>
                      <Text style={styles.historyDate}>Joined {item.created_at?.split('T')[0]}</Text>
                    </View>
                    <Badge
                      label={item.status}
                      variant={item.status === 'REWARDED' ? 'success' : item.status === 'QUALIFIED' ? 'brand' : 'neutral'}
                    />
                  </View>
                ))
              ) : (
                <View style={styles.emptyHistory}>
                  <Clock size={28} color="#64748B" />
                  <Text style={styles.emptyHistoryTitle}>No Referrals Yet</Text>
                  <Text style={styles.emptyHistorySubtitle}>
                    Share your code with other founders to start earning service credits.
                  </Text>
                </View>
              )}
            </Card>
          </>
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
    gap: spacing.lg,
    paddingBottom: 120,
  },
  heroCard: {
    backgroundColor: 'rgba(6, 78, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.35)',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    ...typography.titleMedium,
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 2,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  highlightText: {
    fontWeight: '800',
    color: '#6EE7B7',
  },
  codeContainer: {
    backgroundColor: 'rgba(10, 55, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.30)',
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  codeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginVertical: 2,
  },
  codeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    width: '100%',
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6EE7B7',
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#064E3B',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    gap: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  sectionCard: {
    gap: spacing.md,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  stepDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  historyUser: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: 4,
  },
  emptyHistoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  emptyHistorySubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 240,
  },
  authPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  authTitle: {
    ...typography.titleMedium,
    color: '#FFFFFF',
  },
  authSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
