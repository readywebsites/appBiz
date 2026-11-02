import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Phone, Mail, ArrowRight, ShieldCheck, Globe, Sparkles } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { EmeraldFlowingBackground } from '../../src/components/EmeraldFlowingBackground';

export default function WelcomeAuthScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <EmeraldFlowingBackground variant="dark" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Top Brand Banner */}
        <View style={styles.brandHero}>
          <View style={styles.badgePromo}>
            <Sparkles size={12} color="#F59E0B" />
            <Text style={styles.badgePromoText}>Web Development from ₹499</Text>
          </View>

          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText} numberOfLines={1}>BIZ<Text style={{ color: '#F59E0B' }}>499</Text></Text>
          </View>

          <Text style={styles.heroTitle}>Welcome to Biz499</Text>
          <Text style={styles.heroSubtitle}>
            Your digital growth partner. Access verified website packages, instant custom quotes, real-time milestone delivery, and dedicated 24/7 technical support.
          </Text>
        </View>

        {/* Feature Highlights Pills */}
        <View style={styles.highlightsContainer}>
          <View style={styles.highlightPill}>
            <Globe size={16} color={colors.brand} />
            <Text style={styles.highlightPillText}>High-Speed Business Websites</Text>
          </View>
          <View style={styles.highlightPill}>
            <ShieldCheck size={16} color={colors.success} />
            <Text style={styles.highlightPillText}>Milestone-Tracked Delivery</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Primary: Continue with Phone */}
          <TouchableOpacity
            style={styles.primaryPhoneButton}
            onPress={() => router.push('/(auth)/phone-login')}
            activeOpacity={0.85}
          >
            <View style={styles.btnIconCircle}>
              <Phone size={18} color={colors.white} />
            </View>
            <Text style={styles.primaryPhoneText}>Continue with Phone</Text>
            <ArrowRight size={18} color={colors.white} />
          </TouchableOpacity>

          {/* Secondary: Continue with Email */}
          <TouchableOpacity
            style={styles.secondaryEmailButton}
            onPress={() => router.push('/(auth)/email-login')}
            activeOpacity={0.8}
          >
            <Mail size={18} color={colors.primary} />
            <Text style={styles.secondaryEmailText}>Continue with Email</Text>
          </TouchableOpacity>

          {/* Guest Exploration Option */}
          <TouchableOpacity
            style={styles.guestLink}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.guestLinkText}>Explore Services as Guest</Text>
            <ArrowRight size={14} color={colors.brand} />
          </TouchableOpacity>
        </View>

        {/* Footer with Legal Links */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to Biz499's{' '}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL('https://biz499.com/terms/').catch(() => {})}
            >
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL('https://biz499.com/privacy/').catch(() => {})}
            >
              Privacy Policy
            </Text>.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02140F',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  badgePromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  badgePromoText: {
    ...typography.label,
    color: '#F59E0B',
    fontSize: 11,
  },
  logoMark: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minWidth: 140,
    borderRadius: radii.xl,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  logoMarkText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  heroTitle: {
    ...typography.titleLarge,
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.bodyMedium,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.xs,
  },
  highlightsContainer: {
    gap: spacing.sm,
    marginVertical: spacing.xl,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  highlightPillText: {
    ...typography.bodyMedium,
    color: '#F1F5F9',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: spacing.md,
    width: '100%',
  },
  primaryPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2563EB',
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryPhoneText: {
    ...typography.titleSmall,
    color: colors.white,
    flex: 1,
    marginLeft: spacing.md,
  },
  secondaryEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: radii.xl,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },
  secondaryEmailText: {
    ...typography.titleSmall,
    color: colors.primary,
    fontWeight: '700',
  },
  guestLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  guestLinkText: {
    ...typography.bodyMedium,
    color: '#6EE7B7',
    fontWeight: '700',
  },
  footer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  footerText: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: 'rgba(255, 255, 255, 0.85)',
    textDecorationLine: 'underline',
  },
});

