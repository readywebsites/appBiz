import React, { useState } from 'react';
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
import { ShoppingBag, Receipt, Download, Clock, CreditCard, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';
import { colors, spacing, radii, typography } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingState } from '../../src/components/LoadingState';

export default function OrdersScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'invoices'>('orders');

  const { data: orders, isLoading: loadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => api.getMyOrders(),
    enabled: isAuthenticated,
  });

  const { data: invoices, isLoading: loadingInvoices, refetch: refetchInvoices } = useQuery({
    queryKey: ['myInvoices'],
    queryFn: () => api.getMyInvoices(),
    enabled: isAuthenticated,
  });

  const orderList = orders?.results || orders || [];
  const invoiceList = invoices?.results || invoices || [];

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Orders & Billing</Text>
        </View>
        <EmptyState
          title="Sign in to view orders and receipts"
          description="Log in to access your order history, payment records, and download GST tax invoices."
          actionTitle="Sign In"
          onAction={() => router.push('/(auth)/login')}
          icon={<ShoppingBag size={48} color={colors.brand} />}
        />
      </SafeAreaView>
    );
  }

  const handleDownloadInvoice = (invoiceId: string) => {
    const url = api.getInvoicePdfUrl(invoiceId);
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders & Financials</Text>
        <Text style={styles.headerSubtitle}>Commercial transactions, payment receipts, and GST invoices</Text>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.switchButton, activeTab === 'orders' && styles.switchButtonActive]}
            onPress={() => setActiveTab('orders')}
          >
            <ShoppingBag size={14} color={activeTab === 'orders' ? '#6EE7B7' : '#94A3B8'} />
            <Text style={[styles.switchText, activeTab === 'orders' && styles.switchTextActive]}>
              Orders ({orderList.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchButton, activeTab === 'invoices' && styles.switchButtonActive]}
            onPress={() => setActiveTab('invoices')}
          >
            <Receipt size={14} color={activeTab === 'invoices' ? '#6EE7B7' : '#94A3B8'} />
            <Text style={[styles.switchText, activeTab === 'invoices' && styles.switchTextActive]}>
              Invoices & Tax Receipts
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingOrders || loadingInvoices}
            onRefresh={() => {
              refetchOrders();
              refetchInvoices();
            }}
          />
        }
      >
        {activeTab === 'orders' ? (
          loadingOrders ? (
            <LoadingState message="Loading your orders..." />
          ) : orderList.length === 0 ? (
            <EmptyState
              title="No Orders Yet"
              description="You have not placed any website package orders. Browse our packages to launch your site."
              actionTitle="Browse Packages"
              onAction={() => router.push('/(tabs)/services')}
              icon={<ShoppingBag size={44} color={colors.brand} />}
            />
          ) : (
            orderList.map((order: any) => (
              <Card key={order.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <Text style={styles.orderNumberText}>{order.order_number}</Text>
                  <Badge
                    label={order.payment_status}
                    variant={order.payment_status === 'PAID' ? 'success' : 'brand'}
                  />
                </View>

                {/* Items */}
                <View style={styles.orderItemsList}>
                  {order.items?.map((it: any) => (
                    <View key={it.id} style={styles.itemRow}>
                      <Text style={styles.itemTitle}>{it.title}</Text>
                      <Text style={styles.itemPrice}>₹{parseFloat(it.total_price).toLocaleString('en-IN')}</Text>
                    </View>
                  ))}
                </View>

                {/* Totals */}
                <View style={styles.orderTotals}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Grand Total (Inc. GST):</Text>
                    <Text style={styles.totalAmount}>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.paidLabel}>Amount Paid:</Text>
                    <Text style={styles.paidAmount}>₹{parseFloat(order.amount_paid).toLocaleString('en-IN')}</Text>
                  </View>
                  {parseFloat(order.balance_due) > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.dueLabel}>Balance Remaining:</Text>
                      <Text style={styles.dueAmount}>₹{parseFloat(order.balance_due).toLocaleString('en-IN')}</Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.orderActions}>
                  {parseFloat(order.balance_due) > 0 && (
                    <Button
                      title="Pay Balance"
                      onPress={() => router.push(`/checkout?order_id=${order.id}`)}
                      size="sm"
                      style={styles.payButton}
                    />
                  )}
                  {order.has_project && (
                    <Button
                      title="Open Project"
                      onPress={() => router.push('/(tabs)/projects')}
                      variant="outline"
                      size="sm"
                    />
                  )}
                </View>
              </Card>
            ))
          )
        ) : (
          /* Invoices List */
          loadingInvoices ? (
            <LoadingState message="Loading your invoices..." />
          ) : invoiceList.length === 0 ? (
            <EmptyState
              title="No Invoices Issued Yet"
              description="Invoices with official sequential numbering and GST tax breakdown will appear here once payment is reconciled."
              icon={<Receipt size={44} color={colors.brand} />}
            />
          ) : (
            invoiceList.map((inv: any) => (
              <Card key={inv.id} style={styles.invoiceCard}>
                <View style={styles.orderTop}>
                  <Text style={styles.orderNumberText}>{inv.invoice_number}</Text>
                  <Badge label={inv.status} variant={inv.status === 'PAID' ? 'success' : 'brand'} />
                </View>

                <Text style={styles.invDateText}>Issued on: {inv.issue_date} • Order: {inv.order_number}</Text>

                <View style={styles.invAmountRow}>
                  <Text style={styles.invAmountLabel}>Invoice Total:</Text>
                  <Text style={styles.invAmountValue}>₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}</Text>
                </View>

                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => handleDownloadInvoice(inv.id)}
                >
                  <Download size={14} color="#93C5FD" />
                  <Text style={styles.downloadText}>Download Official PDF Receipt</Text>
                </TouchableOpacity>
              </Card>
            ))
          )
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
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(6, 35, 27, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderRadius: radii.lg,
    padding: 3,
    marginTop: spacing.md,
  },
  switchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radii.md,
    gap: 6,
  },
  switchButtonActive: {
    backgroundColor: 'rgba(12, 70, 54, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    shadowColor: '#01150F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 4,
    elevation: 2,
  },
  switchText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  switchTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  orderCard: {
    padding: spacing.lg,
  },
  invoiceCard: {
    padding: spacing.lg,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  orderNumberText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  orderItemsList: {
    marginVertical: spacing.sm,
    gap: 4,
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
  orderTotals: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    gap: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  totalAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paidLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  paidAmount: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  dueLabel: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '600',
  },
  dueAmount: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.danger,
  },
  orderActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  payButton: {
    flex: 1,
  },
  invDateText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  invAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  invAmountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  invAmountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    paddingVertical: 10,
    borderRadius: radii.md,
    gap: 6,
  },
  downloadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
  },
});
