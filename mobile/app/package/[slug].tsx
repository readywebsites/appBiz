import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Square, Tag, Clock, ArrowRight } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { colors, spacing, radii, typography, glassShadows } from '../../src/theme';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { LoadingState } from '../../src/components/LoadingState';

export default function PackageCustomizeScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams();

  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');
  const [estimate, setEstimate] = useState<any>(null);
  const [estimating, setEstimating] = useState(false);

  const { data: packages, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => api.getPackages(),
  });

  const packageList = packages?.results || packages || [];
  const currentPkg = packageList.find((p: any) => p.slug === slug);

  const { data: serviceDetail } = useQuery({
    queryKey: ['serviceDetail', currentPkg?.service],
    queryFn: () => api.getServiceDetail(currentPkg?.service),
    enabled: !!currentPkg?.service,
  });

  const availableAddons = serviceDetail?.add_ons || [];

  // Instant calculation via backend
  const updateCalculation = async (addonIds: string[], code: string) => {
    if (!currentPkg) return;
    setEstimating(true);
    try {
      const res = await api.calculateEstimate({
        package_id: currentPkg.id,
        addon_ids: addonIds,
        coupon_code: code.trim(),
      });
      setEstimate(res);
    } catch (err: any) {
      console.warn('Estimate error:', err.message);
    } finally {
      setEstimating(false);
    }
  };

  useEffect(() => {
    if (currentPkg) {
      updateCalculation(selectedAddons, couponCode);
    }
  }, [currentPkg, selectedAddons]);

  const toggleAddon = (addonId: string) => {
    const updated = selectedAddons.includes(addonId)
      ? selectedAddons.filter((id) => id !== addonId)
      : [...selectedAddons, addonId];
    setSelectedAddons(updated);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    updateCalculation(selectedAddons, couponCode);
  };

  const handleProceedToCheckout = () => {
    if (!currentPkg) return;
    const addonParam = selectedAddons.join(',');
    router.push({
      pathname: '/checkout',
      params: {
        package_id: currentPkg.id,
        addon_ids: addonParam,
        coupon_code: couponCode,
        notes: notes,
      },
    });
  };

  if (isLoading || !currentPkg) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Customize Package" />
        <LoadingState message="Configuring package builder..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={`Customize ${currentPkg.name}`} />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Package Header Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.packageCategory}>Selected Package</Text>
          <Text style={styles.packageName}>{currentPkg.name}</Text>
          <Text style={styles.packageTagline}>{currentPkg.tagline}</Text>
          <View style={styles.basePriceRow}>
            <Text style={styles.basePrice}>Base: ₹{parseFloat(currentPkg.price).toLocaleString('en-IN')}</Text>
            <Text style={styles.deliveryInfo}>~{currentPkg.delivery_days} Days Turnaround</Text>
          </View>
        </Card>

        {/* Add-ons Selection */}
        {availableAddons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Desired Add-ons</Text>
            <View style={styles.addonsList}>
              {availableAddons.map((addon: any) => {
                const isSelected = selectedAddons.includes(addon.id);
                return (
                  <TouchableOpacity
                    key={addon.id}
                    style={[styles.addonRow, isSelected && styles.addonRowSelected]}
                    onPress={() => toggleAddon(addon.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkbox}>
                      {isSelected ? (
                        <CheckSquare size={20} color={colors.brand} />
                      ) : (
                        <Square size={20} color={colors.textLight} />
                      )}
                    </View>
                    <View style={styles.addonDetails}>
                      <Text style={styles.addonTitle}>{addon.name}</Text>
                      <Text style={styles.addonDescription}>{addon.description}</Text>
                    </View>
                    <Text style={styles.addonPriceTag}>+₹{parseFloat(addon.price).toLocaleString('en-IN')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Coupon Code Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply Discount Coupon</Text>
          <View style={styles.couponInputRow}>
            <TextInput
              placeholder="e.g. BIZ500 or WELCOME10"
              placeholderTextColor={colors.textLight}
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              style={styles.couponInput}
            />
            <Button
              title="Apply"
              onPress={handleApplyCoupon}
              variant="secondary"
              size="sm"
            />
          </View>
          {estimate?.coupon_code && (
            <Text style={styles.couponAppliedText}>
              Coupon <Text style={styles.bold}>{estimate.coupon_code}</Text> successfully applied!
            </Text>
          )}
        </View>

        {/* Project Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specific Requirements or Preferences</Text>
          <TextInput
            placeholder="Tell us about your brand colors, reference links, target audience..."
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            style={styles.notesInput}
          />
        </View>

        {/* Authoritative Live Price Breakdown */}
        {estimate && (
          <Card style={styles.calculationCard}>
            <Text style={styles.calcHeader}>Authoritative Quote Estimate</Text>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Package + Add-ons Subtotal:</Text>
              <Text style={styles.calcValue}>₹{parseFloat(estimate.subtotal).toLocaleString('en-IN')}</Text>
            </View>

            {parseFloat(estimate.discount) > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.discountLabel}>Coupon Discount:</Text>
                <Text style={styles.discountValue}>-₹{parseFloat(estimate.discount).toLocaleString('en-IN')}</Text>
              </View>
            )}

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>GST (18%):</Text>
              <Text style={styles.calcValue}>₹{parseFloat(estimate.tax).toLocaleString('en-IN')}</Text>
            </View>

            <View style={[styles.calcRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Package Price:</Text>
              <Text style={styles.totalValue}>₹{parseFloat(estimate.total).toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.advanceRow}>
              <Text style={styles.advanceText}>
                50% Advance to start: <Text style={styles.advanceAmount}>₹{parseFloat(estimate.advance_required).toLocaleString('en-IN')}</Text>
              </Text>
            </View>
          </Card>
        )}

        <Button
          title="Review & Proceed to Checkout"
          onPress={handleProceedToCheckout}
          variant="primary"
          size="lg"
          style={styles.proceedButton}
        />
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
  summaryCard: {
    backgroundColor: colors.glass.card,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...glassShadows.card,
  },
  packageCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6EE7B7',
    textTransform: 'uppercase',
  },
  packageName: {
    ...typography.titleMedium,
    color: '#FFFFFF',
    marginTop: 2,
  },
  packageTagline: {
    ...typography.bodyMedium,
    color: '#94A3B8',
    marginTop: 2,
  },
  basePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  basePrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  deliveryInfo: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addonsList: {
    gap: spacing.sm,
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
    gap: spacing.sm,
  },
  addonRowSelected: {
    borderColor: '#3B82F6',
    borderWidth: 1.5,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  checkbox: {
    padding: 2,
  },
  addonDetails: {
    flex: 1,
  },
  addonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addonDescription: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  addonPriceTag: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  couponInput: {
    flex: 1,
    backgroundColor: colors.glass.input,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  couponAppliedText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  bold: {
    fontWeight: '800',
  },
  notesInput: {
    backgroundColor: colors.glass.input,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 13,
    color: '#FFFFFF',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  calculationCard: {
    backgroundColor: colors.glass.cardDeep,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    ...glassShadows.card,
  },
  calcHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6EE7B7',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  calcValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  discountLabel: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  totalRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#6EE7B7',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  advanceRow: {
    marginTop: spacing.xs,
    backgroundColor: 'rgba(6, 35, 27, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.18)',
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  advanceText: {
    fontSize: 11,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  advanceAmount: {
    fontWeight: '800',
    color: '#6EE7B7',
  },
  proceedButton: {
    marginTop: spacing.sm,
  },
});
