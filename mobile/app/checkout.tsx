import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';
import { api } from '../src/lib/api';
import { colors, spacing, radii, typography, glassShadows } from '../src/theme';
import { Header } from '../src/components/Header';
import { Card } from '../src/components/Card';
import { Button } from '../src/components/Button';
import { LoadingState } from '../src/components/LoadingState';

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [payFull, setPayFull] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const setupOrder = async () => {
      if (!isAuthenticated) {
        Alert.alert('Sign In Required', 'Please sign in or create an account to proceed with checkout.', [
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        ]);
        setLoading(false);
        return;
      }

      try {
        if (params.order_id) {
          // Paying balance on existing order
          const myOrders = await api.getMyOrders();
          const list = myOrders.results || myOrders || [];
          const found = list.find((o: any) => o.id === params.order_id);
          if (found) setOrder(found);
        } else if (params.package_id) {
          // Direct checkout
          const addonIds = params.addon_ids ? String(params.addon_ids).split(',').filter(Boolean) : [];
          const newOrder = await api.checkout({
            package_id: String(params.package_id),
            addon_ids: addonIds,
            coupon_code: params.coupon_code ? String(params.coupon_code) : undefined,
            notes: params.notes ? String(params.notes) : undefined,
          });
          setOrder(newOrder);
        }
      } catch (err: any) {
        Alert.alert('Checkout Error', err.message || 'Could not initiate checkout.');
      } finally {
        setLoading(false);
      }
    };

    setupOrder();
  }, [params, isAuthenticated]);

  const handlePayNow = async () => {
    if (!order) return;
    setProcessing(true);
    try {
      // 1. Initiate Payment Order on server
      const paymentOrder = await api.initiatePayment(order.id, !payFull);

      // 2. In Sandbox / Development mode, simulate client gateway checkout & complete with verification
      // For production Razorpay, opens RazorpayCheckout.open(options) with paymentOrder.gateway_order_id
      const verifyResponse = await api.verifyPayment({
        gateway_order_id: paymentOrder.gateway_order_id,
        gateway_payment_id: `pay_${Date.now()}`,
        gateway_signature: 'test_signature',
      });

      Alert.alert(
        'Payment Verified & Confirmed! 🎉',
        `Your payment of ₹${paymentOrder.amount} has been reconciled. Your website project portal and tax invoice have been generated.`,
        [
          {
            text: 'View Project Portal',
            onPress: () => router.replace('/(tabs)/projects'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message || 'Payment verification could not be completed.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Secure Checkout" />
        <LoadingState message="Validating order and pricing rules..." />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Checkout" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>No active order found for checkout.</Text>
          <Button title="Browse Packages" onPress={() => router.replace('/(tabs)/services')} size="md" />
        </View>
      </SafeAreaView>
    );
  }

  const advanceAmount = (parseFloat(order.total_amount) * 0.5).toFixed(2);
  const payableAmount = payFull ? order.balance_due : advanceAmount;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Order Confirmation & Payment" />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Order Reference */}
        <Card style={styles.orderSummaryCard}>
          <Text style={styles.orderLabel}>Order Reference</Text>
          <Text style={styles.orderNumber}>{order.order_number}</Text>

          {/* Items */}
          <View style={styles.itemsList}>
            {order.items?.map((it: any) => (
              <View key={it.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>{it.title} (x{it.quantity})</Text>
                <Text style={styles.itemPrice}>₹{parseFloat(it.total_price).toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>

          {/* Pricing breakdown */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Subtotal:</Text>
              <Text style={styles.totalNum}>₹{parseFloat(order.subtotal).toLocaleString('en-IN')}</Text>
            </View>

            {parseFloat(order.discount_amount) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.discountText}>Coupon Discount:</Text>
                <Text style={styles.discountNum}>-₹{parseFloat(order.discount_amount).toLocaleString('en-IN')}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalText}>GST Tax (18%):</Text>
              <Text style={styles.totalNum}>₹{parseFloat(order.tax_amount).toLocaleString('en-IN')}</Text>
            </View>

            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalText}>Total Order Value:</Text>
              <Text style={styles.grandTotalNum}>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </Card>

        {/* Payment Options (Advance vs Full) */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Select Payment Option</Text>

          <TouchableOpacity
            style={[styles.paymentOptionCard, !payFull && styles.optionCardActive]}
            onPress={() => setPayFull(false)}
            activeOpacity={0.8}
          >
            <View style={styles.optionRadio}>
              {!payFull && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Pay 50% Advance (Start Project)</Text>
              <Text style={styles.optionDesc}>
                Pay ₹{parseFloat(advanceAmount).toLocaleString('en-IN')} now. Remaining balance due upon milestone delivery sign-off.
              </Text>
            </View>
            <Text style={styles.optionPrice}>₹{parseFloat(advanceAmount).toLocaleString('en-IN')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOptionCard, payFull && styles.optionCardActive]}
            onPress={() => setPayFull(true)}
            activeOpacity={0.8}
          >
            <View style={styles.optionRadio}>
              {payFull && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Pay Full Amount (100%)</Text>
              <Text style={styles.optionDesc}>Clear complete payment upfront for instant priority scheduling.</Text>
            </View>
            <Text style={styles.optionPrice}>₹{parseFloat(order.balance_due).toLocaleString('en-IN')}</Text>
          </TouchableOpacity>
        </View>

        {/* Security Assurance */}
        <View style={styles.securityBox}>
          <ShieldCheck size={20} color={colors.success} />
          <View style={styles.securityTextContainer}>
            <Text style={styles.securityTitle}>256-Bit SSL Encrypted Razorpay Sandbox Checkout</Text>
            <Text style={styles.securityDesc}>
              Card, UPI & NetBanking processed via compliant payment gateway. Zero sensitive details stored on device.
            </Text>
          </View>
        </View>

        {/* Pay Button */}
        <Button
          title={`Pay ₹${parseFloat(payableAmount).toLocaleString('en-IN')} & Launch Project`}
          onPress={handlePayNow}
          loading={processing}
          variant="primary"
          size="lg"
          style={styles.payCta}
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
  orderSummaryCard: {
    padding: spacing.lg,
    backgroundColor: colors.glass.card,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: radii.xl,
    ...glassShadows.card,
  },
  orderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6EE7B7',
    textTransform: 'uppercase',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 12,
    color: '#E2E8F0',
    flex: 1,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  totalsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  totalNum: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  discountText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  discountNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  grandTotalRow: {
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  grandTotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  grandTotalNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#6EE7B7',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  optionsSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.glass.border,
    gap: spacing.md,
  },
  optionCardActive: {
    borderColor: '#3B82F6',
    borderWidth: 1.5,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6EE7B7',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.card,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
    gap: spacing.sm,
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  securityDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  payCta: {
    marginTop: spacing.sm,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: {
    ...typography.titleSmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
