import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  PhoneCall,
  MessageCircle,
  Briefcase,
  Star,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';
import { colors, spacing, radii, typography, glassShadows } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const { data: banners, refetch: refetchBanners } = useQuery({
    queryKey: ['banners'],
    queryFn: () => api.getBanners(),
  });

  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const { data: packages, refetch: refetchPackages } = useQuery({
    queryKey: ['packages'],
    queryFn: () => api.getPackages(),
  });

  const { data: testimonials, refetch: refetchTestimonials } = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => api.getTestimonials(),
  });

  const { data: activeProjects } = useQuery({
    queryKey: ['myProjectsSnippet'],
    queryFn: () => api.getMyProjects(),
    enabled: isAuthenticated,
  });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchBanners(),
      refetchCategories(),
      refetchPackages(),
      refetchTestimonials(),
    ]);
    setRefreshing(false);
  };

  const bannerList = banners?.results || banners || [];
  const categoryList = categories?.results || categories || [];
  const packageList = packages?.results || packages || [];
  const testimonialList = testimonials?.results || testimonials || [];
  const projectList = activeProjects?.results || activeProjects || [];

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hi%20Biz499,%20I%20am%20interested%20in%20a%20website%20development%20package.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.brandSubtitle}>DIGITAL WEB SOLUTIONS</Text>
          <Text style={styles.brandTitle}>Biz499</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.contentContainer}
      >
        {/* User Greeting if logged in */}
        {isAuthenticated && (
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
              Welcome back, <Text style={styles.boldText}>{user?.customer_profile?.business_name || user?.first_name || 'Client'}</Text> 👋
            </Text>
            {projectList.length > 0 && (
              <TouchableOpacity
                style={styles.activeProjectBanner}
                onPress={() => router.push('/(tabs)/projects')}
              >
                <View style={styles.activeProjectDot} />
                <Text style={styles.activeProjectText}>
                  Active Project: <Text style={styles.activeProjectBold}>{projectList[0].title}</Text> ({projectList[0].progress_percentage}%)
                </Text>
                <ArrowRight size={14} color="#6EE7B7" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Hero Banner Carousel Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Sparkles size={12} color="#93C5FD" />
            <Text style={styles.heroBadgeText}>LAUNCH SPECIAL</Text>
          </View>
          <Text style={styles.heroTitle}>Get Your Modern Business Website for just ₹499</Text>
          <Text style={styles.heroSubtitle}>
            100% responsive, high-speed mobile website with WhatsApp chat & Google SEO ready in 3 days.
          </Text>
          <View style={styles.heroButtonRow}>
            <Button
              title="Explore Packages"
              onPress={() => router.push('/(tabs)/services')}
              size="md"
              style={styles.heroCta}
            />
            <TouchableOpacity style={styles.consultLink} onPress={() => router.push('/consultation')}>
              <Text style={styles.consultLinkText}>Book Call</Text>
              <ArrowRight size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Categories Horizontal Pills */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Service Categories</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/services')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {categoryList.map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryPill}
                onPress={() => router.push(`/(tabs)/services?category=${cat.slug}`)}
              >
                <Text style={styles.categoryPillText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Packages Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Website Packages</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/services')}>
              <Text style={styles.seeAllText}>Compare Tiers</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.packagesContainer}>
            {packageList.slice(0, 3).map((pkg: any) => (
              <Card key={pkg.id} style={styles.packageCard}>
                <View style={styles.packageHeader}>
                  <View style={styles.packageHeaderContent}>
                    <Text style={styles.packageName} numberOfLines={2}>{pkg.name}</Text>
                    <Text style={styles.packageTagline} numberOfLines={2}>{pkg.tagline}</Text>
                  </View>
                  {pkg.is_popular && (
                    <View style={styles.badgeWrapper}>
                      <Badge label="Best Seller" variant="warning" />
                    </View>
                  )}
                </View>

                {/* Price Display */}
                <View style={styles.priceRow}>
                  <Text style={styles.packagePrice}>₹{parseFloat(pkg.price).toLocaleString('en-IN')}</Text>
                  {pkg.original_price && (
                    <Text style={styles.originalPrice}>₹{parseFloat(pkg.original_price).toLocaleString('en-IN')}</Text>
                  )}
                </View>
                <View style={styles.deliveryBadge}>
                  <Clock size={12} color={colors.textMuted} />
                  <Text style={styles.deliveryText}>~{pkg.delivery_days} Days Turnaround</Text>
                </View>

                {/* Features Checklist */}
                <View style={styles.featuresList}>
                  {pkg.features?.slice(0, 4).map((f: any) => (
                    <View key={f.id} style={styles.featureItem}>
                      <CheckCircle size={14} color={colors.success} />
                      <Text style={styles.featureText}>{f.title}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Button */}
                <Button
                  title="Customize & Order"
                  onPress={() => router.push(`/package/${pkg.slug}`)}
                  variant="primary"
                  size="md"
                  style={styles.packageButton}
                />
              </Card>
            ))}
          </View>
        </View>

        {/* How Process Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Biz499 Works</Text>
          <View style={styles.stepsContainer}>
            {[
              { step: '1', title: 'Choose Package', desc: 'Select starter, growth or e-commerce package.' },
              { step: '2', title: 'Submit Requirements', desc: 'Share your business details, logo and content.' },
              { step: '3', title: 'Review Staging Preview', desc: 'Inspect your interactive preview and request edits.' },
              { step: '4', title: 'Domain Launch', desc: 'Your website goes live with SSL and Google ranking setup.' },
            ].map((s) => (
              <View key={s.step} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{s.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Why Choose Biz499 */}
        <View style={styles.valueSection}>
          <Text style={styles.valueTitle}>Why Businesses Trust Biz499</Text>
          <View style={styles.valuesGrid}>
            <View style={styles.valueItem}>
              <Zap size={20} color={colors.brand} />
              <Text style={styles.valueItemTitle}>Ultra-Fast Loading</Text>
              <Text style={styles.valueItemDesc}>Optimized for under 1.5 second loading speed on 4G/5G.</Text>
            </View>
            <View style={styles.valueItem}>
              <ShieldCheck size={20} color={colors.success} />
              <Text style={styles.valueItemTitle}>100% Transparent</Text>
              <Text style={styles.valueItemDesc}>No recurring lock-in or hidden maintenance fees.</Text>
            </View>
          </View>
        </View>

        {/* Client Testimonials */}
        {testimonialList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verified Customer Reviews</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.testimonialsScroll}
              contentContainerStyle={styles.testimonialsContent}
            >
              {testimonialList.map((t: any) => (
                <View key={t.id} style={styles.testimonialCard}>
                  <View style={styles.starRow}>
                    {[...Array(t.rating || 5)].map((_, idx) => (
                      <Star key={idx} size={14} color={colors.accent} fill={colors.accent} />
                    ))}
                  </View>
                  <Text style={styles.testimonialText}>"{t.feedback}"</Text>
                  <View style={styles.clientMeta}>
                    <Text style={styles.clientName}>{t.client_name}</Text>
                    <Text style={styles.clientBiz}>{t.business_name} • {t.designation}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Floating Quick Consultation / WhatsApp Bar */}
        <View style={styles.contactBar}>
          <TouchableOpacity style={styles.contactAction} onPress={handleWhatsApp}>
            <MessageCircle size={18} color="#25D366" />
            <Text style={styles.contactActionText}>WhatsApp Inquiry</Text>
          </TouchableOpacity>
          <View style={styles.contactDivider} />
          <TouchableOpacity style={styles.contactAction} onPress={() => router.push('/consultation')}>
            <PhoneCall size={18} color={colors.brand} />
            <Text style={styles.contactActionText}>Book Strategy Call</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6EE7B7',
    letterSpacing: 1.2,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    paddingBottom: 120,
  },
  greetingContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  greetingText: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  boldText: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeProjectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.card,
    borderWidth: 1,
    borderColor: colors.glass.border,
    padding: spacing.md,
    borderRadius: radii.xl,
    marginTop: spacing.sm,
    gap: spacing.sm,
    ...glassShadows.card,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  activeProjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6EE7B7',
  },
  activeProjectText: {
    flex: 1,
    fontSize: 12,
    color: '#E2E8F0',
  },
  activeProjectBold: {
    fontWeight: '700',
    color: '#6EE7B7',
  },
  heroCard: {
    margin: spacing.lg,
    backgroundColor: colors.glass.cardDark,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.30)',
    ...glassShadows.cardDark,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.40)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 5,
    marginBottom: spacing.sm,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  heroButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  heroCta: {
    flex: 1,
  },
  consultLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  consultLinkText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  categoriesScroll: {
    marginHorizontal: -spacing.lg,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xxl,
  },
  categoryPill: {
    backgroundColor: colors.glass.pill,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.30)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.full,
    marginRight: spacing.sm,
    shadowColor: '#01150F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 2,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        } as any)
      : {}),
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  packagesContainer: {
    gap: spacing.md,
  },
  packageCard: {
    padding: spacing.lg,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  packageHeaderContent: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  badgeWrapper: {
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  packageName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  packageTagline: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  packagePrice: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  deliveryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  featuresList: {
    marginVertical: spacing.md,
    gap: spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E2E8F0',
  },
  packageButton: {
    marginTop: spacing.sm,
  },
  stepsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.card,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    gap: spacing.md,
    ...glassShadows.card,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#93C5FD',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  valueSection: {
    margin: spacing.lg,
    backgroundColor: colors.glass.card,
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...glassShadows.card,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: spacing.md,
  },
  valuesGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  valueItem: {
    flex: 1,
    backgroundColor: 'rgba(6, 35, 27, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.18)',
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  valueItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: spacing.xs,
  },
  valueItemDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  testimonialsScroll: {
    marginHorizontal: -spacing.lg,
    marginTop: spacing.md,
  },
  testimonialsContent: {
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xxl,
  },
  testimonialCard: {
    width: 270,
    backgroundColor: colors.glass.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...glassShadows.card,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: spacing.xs,
  },
  testimonialText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#F1F5F9',
    lineHeight: 18,
  },
  clientMeta: {
    marginTop: spacing.md,
  },
  clientName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clientBiz: {
    fontSize: 11,
    color: '#94A3B8',
  },
  contactBar: {
    flexDirection: 'row',
    backgroundColor: colors.glass.header,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.30)',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...glassShadows.floating,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        } as any)
      : {}),
  },
  contactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  contactActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});

