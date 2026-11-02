import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { colors, spacing, radii, typography } from '../../src/theme';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { LoadingState } from '../../src/components/LoadingState';

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams();

  const { data: service, isLoading } = useQuery({
    queryKey: ['serviceDetail', slug],
    queryFn: () => api.getServiceDetail(String(slug)),
    enabled: !!slug,
  });

  if (isLoading || !service) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Service Details" />
        <LoadingState message="Loading package details..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={service.title} />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Banner image */}
        {service.image_url ? (
          <Image source={{ uri: service.image_url }} style={styles.heroImage} resizeMode="cover" />
        ) : null}

        <View style={styles.headerInfo}>
          <Text style={styles.categoryName}>{service.category_name}</Text>
          <Text style={styles.title}>{service.title}</Text>
          <Text style={styles.description}>{service.full_description || service.short_description}</Text>
        </View>

        {/* Packages Comparison */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>Available Package Tiers</Text>

          {service.packages?.map((pkg: any) => (
            <Card
              key={pkg.id}
              style={[styles.packageCard, pkg.is_popular && styles.popularCard]}
            >
              <View style={styles.pkgTop}>
                <View style={styles.pkgTopContent}>
                  <Text style={styles.pkgName} numberOfLines={2}>{pkg.name}</Text>
                  <Text style={styles.pkgTagline} numberOfLines={2}>{pkg.tagline}</Text>
                </View>
                {pkg.is_popular && (
                  <View style={styles.badgeWrapper}>
                    <Badge label="Recommended" variant="warning" />
                  </View>
                )}
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.pkgPrice}>₹{parseFloat(pkg.price).toLocaleString('en-IN')}</Text>
                {pkg.original_price && (
                  <Text style={styles.originalPrice}>₹{parseFloat(pkg.original_price).toLocaleString('en-IN')}</Text>
                )}
              </View>

              <View style={styles.deliveryRow}>
                <Clock size={12} color={colors.textMuted} />
                <Text style={styles.deliveryText}>Estimated Turnaround: ~{pkg.delivery_days} Days</Text>
              </View>

              {/* Features List */}
              <View style={styles.featuresList}>
                {pkg.features?.map((f: any) => (
                  <View key={f.id} style={styles.featureItem}>
                    <CheckCircle2 size={14} color={colors.success} />
                    <Text style={styles.featureText}>{f.title}</Text>
                  </View>
                ))}
              </View>

              <Button
                title="Select This Package"
                onPress={() => router.push(`/package/${pkg.slug}`)}
                variant={pkg.is_popular ? 'primary' : 'outline'}
                size="md"
              />
            </Card>
          ))}
        </View>

        {/* Add-ons Preview */}
        {service.add_ons && service.add_ons.length > 0 && (
          <View style={styles.addonsSection}>
            <Text style={styles.sectionTitle}>Optional Upgrades & Add-ons</Text>
            {service.add_ons.map((addon: any) => (
              <Card key={addon.id} style={styles.addonCard}>
                <View style={styles.addonLeft}>
                  <Text style={styles.addonName}>{addon.name}</Text>
                  <Text style={styles.addonDesc}>{addon.description}</Text>
                </View>
                <Text style={styles.addonPrice}>+₹{parseFloat(addon.price).toLocaleString('en-IN')}</Text>
              </Card>
            ))}
          </View>
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
    paddingBottom: 120,
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  headerInfo: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6EE7B7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    ...typography.titleLarge,
    color: colors.text,
    marginTop: spacing.xs,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  packagesSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  packageCard: {
    padding: spacing.lg,
  },
  popularCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  pkgTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pkgTopContent: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  badgeWrapper: {
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  pkgName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  pkgTagline: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pkgPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  deliveryText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
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
    color: colors.text,
  },
  addonsSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  addonLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  addonName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  addonDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  addonPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6EE7B7',
  },
});
