import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Building,
  Mail,
  Phone,
  Shield,
  HelpCircle,
  LogOut,
  Trash2,
  Share2,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Boxes,
  Gift,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, radii, typography } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Badge } from '../../src/components/Badge';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateProfile, deleteAccount } = useAuth();

  const [businessName, setBusinessName] = useState(user?.customer_profile?.business_name || '');
  const [gstin, setGstin] = useState(user?.customer_profile?.gstin || '');
  const [whatsappUpdates, setWhatsappUpdates] = useState(user?.customer_profile?.whatsapp_updates ?? true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Synchronize local form inputs whenever user context updates from backend
  useEffect(() => {
    if (user?.customer_profile) {
      if (user.customer_profile.business_name !== undefined) {
        setBusinessName(user.customer_profile.business_name || '');
      }
      if (user.customer_profile.gstin !== undefined) {
        setGstin(user.customer_profile.gstin || '');
      }
      if (user.customer_profile.whatsapp_updates !== undefined) {
        setWhatsappUpdates(user.customer_profile.whatsapp_updates);
      }
    }
  }, [user?.customer_profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setJustSaved(false);
    try {
      const updated = await updateProfile({
        customer_profile: {
          business_name: businessName.trim(),
          gstin: gstin.trim().toUpperCase(),
          whatsapp_updates: whatsappUpdates,
        },
      });
      setJustSaved(true);
      setIsEditing(false);
      if (updated?.customer_profile) {
        setBusinessName(updated.customer_profile.business_name || '');
        setGstin(updated.customer_profile.gstin || '');
        setWhatsappUpdates(updated.customer_profile.whatsapp_updates ?? true);
      }
      Alert.alert('Profile Updated', 'Your business profile details have been saved and applied immediately.');
      setTimeout(() => {
        setJustSaved(false);
      }, 5000);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Biz499?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/welcome' as any);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Account Deletion Request',
      'This will schedule your account and associated profile for deactivation in accordance with data privacy regulations. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              Alert.alert('Deactivated', 'Your account deletion request has been submitted.');
              router.replace('/(tabs)');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not process deletion request.');
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account & Profile</Text>
        </View>
        <View style={styles.guestContainer}>
          <View style={styles.avatarPlaceholder}>
            <User size={36} color={colors.textLight} />
          </View>
          <Text style={styles.guestTitle}>Welcome to Biz499</Text>
          <Text style={styles.guestSubtitle}>
            Sign in or create your business account to manage website packages, track delivery, and view invoices.
          </Text>
          <View style={styles.guestButtons}>
            <Button
              title="Sign In"
              onPress={() => router.push('/(auth)/welcome' as any)}
              variant="primary"
              size="md"
              style={styles.fullWidth}
            />
            <Button
              title="Create Account"
              onPress={() => router.push('/(auth)/register')}
              variant="outline"
              size="md"
              style={styles.fullWidth}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const savedBusinessName = user?.customer_profile?.business_name?.trim();
  const hasExistingBusiness = Boolean(savedBusinessName);
  const activeBusinessName = savedBusinessName || businessName.trim();
  const displayName = activeBusinessName || (user?.full_name && !user.full_name.startsWith('client_') ? user.full_name : 'Business Client');
  const avatarLetter = (activeBusinessName?.[0] || user?.first_name?.[0] || 'B').toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Business Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
              {activeBusinessName ? (
                <Badge label="Active Business" variant="success" />
              ) : null}
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
            {user?.phone ? <Text style={styles.userPhone}>{user?.phone}</Text> : null}
          </View>
        </Card>

        {/* Business Profile & GST Card */}
        <Card style={styles.formCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={styles.cardSectionTitle}>Business Profile & GST</Text>
              <Text style={styles.cardSectionSubtitle}>
                {hasExistingBusiness
                  ? 'Verified entity for tax invoices & commercial compliance'
                  : 'Add your business name and GSTIN to enable business billing'}
              </Text>
            </View>
            <Badge
              label={hasExistingBusiness ? 'ACTIVE & VERIFIED' : 'SETUP REQUIRED'}
              variant={hasExistingBusiness ? 'success' : 'warning'}
            />
          </View>

          {/* Immediate feedback banner on save */}
          {justSaved && (
            <View style={styles.justSavedBanner}>
              <CheckCircle2 size={16} color="#34D399" />
              <Text style={styles.justSavedText}>Business profile details saved and applied!</Text>
            </View>
          )}

          {hasExistingBusiness && !isEditing ? (
            /* VERIFIED BUSINESS STATUS VIEW:
               Displays verified business status and hides all creation fields & buttons */
            <View style={styles.businessStatusContainer}>
              <View style={styles.statusRow}>
                <View style={styles.statusIconBox}>
                  <Building size={16} color="#6EE7B7" />
                </View>
                <View style={styles.statusContent}>
                  <Text style={styles.statusLabel}>REGISTERED BUSINESS ENTITY</Text>
                  <Text style={styles.statusValue}>{user?.customer_profile?.business_name}</Text>
                </View>
              </View>

              <View style={styles.statusDivider} />

              <View style={styles.statusRow}>
                <View style={styles.statusIconBox}>
                  <Shield size={16} color="#93C5FD" />
                </View>
                <View style={styles.statusContent}>
                  <Text style={styles.statusLabel}>GST NUMBER / TAX STATUS</Text>
                  {user?.customer_profile?.gstin ? (
                    <Text style={styles.statusValueHighlight}>
                      {user.customer_profile.gstin}
                    </Text>
                  ) : (
                    <Text style={styles.statusValueMuted}>
                      Not provided (Unregistered / Composition)
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.statusDivider} />

              <View style={styles.statusRow}>
                <View style={styles.statusIconBox}>
                  <Phone size={16} color="#34D399" />
                </View>
                <View style={styles.statusContent}>
                  <Text style={styles.statusLabel}>WHATSAPP ALERTS & INVOICES</Text>
                  <View style={styles.whatsappStatusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            user?.customer_profile?.whatsapp_updates ?? true
                              ? '#34D399'
                              : '#94A3B8',
                        },
                      ]}
                    />
                    <Text style={styles.statusValue}>
                      {user?.customer_profile?.whatsapp_updates ?? true
                        ? 'Enabled (Milestone alerts & invoice links active)'
                        : 'Disabled'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.statusDivider} />

              <View style={styles.statusRow}>
                <View style={styles.statusIconBox}>
                  <CheckCircle2 size={16} color="#6EE7B7" />
                </View>
                <View style={styles.statusContent}>
                  <Text style={styles.statusLabel}>COMMERCIAL BILLING STATUS</Text>
                  <Text style={styles.statusValue}>
                    Eligible for B2B GST tax invoices & digital receipts
                  </Text>
                </View>
              </View>

              <Button
                title="Edit Business Details"
                onPress={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                style={styles.editButton}
              />
            </View>
          ) : (
            /* CREATION / EDITING FORM VIEW:
               Shown when business does not exist yet (to Create) or when explicitly editing */
            <View style={styles.formContainer}>
              <Input
                label="Business Name / Company"
                placeholder="e.g. Acme Tech Solutions"
                value={businessName}
                onChangeText={setBusinessName}
              />

              <Input
                label="GSTIN (Optional)"
                placeholder="e.g. 27ABCDE1234F1Z5"
                value={gstin}
                onChangeText={setGstin}
                autoCapitalize="characters"
              />

              <View style={styles.switchRow}>
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchTitle}>WhatsApp Order & Project Alerts</Text>
                  <Text style={styles.switchSubtitle}>
                    Receive milestone status and invoice links on WhatsApp
                  </Text>
                </View>
                <Switch
                  value={whatsappUpdates}
                  onValueChange={setWhatsappUpdates}
                  trackColor={{ false: colors.border, true: colors.brand }}
                />
              </View>

              <View style={styles.formActionsRow}>
                <Button
                  title={
                    saving
                      ? 'Saving...'
                      : hasExistingBusiness
                      ? 'Update Business Details'
                      : 'Create Business Profile'
                  }
                  onPress={handleSaveProfile}
                  loading={saving}
                  size="sm"
                  variant="primary"
                  style={hasExistingBusiness ? styles.flex1 : styles.fullWidth}
                />
                {hasExistingBusiness && (
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setIsEditing(false);
                      setBusinessName(user?.customer_profile?.business_name || '');
                      setGstin(user?.customer_profile?.gstin || '');
                      setWhatsappUpdates(user?.customer_profile?.whatsapp_updates ?? true);
                    }}
                    variant="outline"
                    size="sm"
                    style={styles.cancelButton}
                  />
                )}
              </View>
            </View>
          )}
        </Card>

        {/* Referral Card */}
        {user?.customer_profile?.referral_code && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push('/referrals')}
          >
            <Card style={styles.referralCard}>
              <View style={styles.referralHeader}>
                <Gift size={16} color="#6EE7B7" />
                <Text style={styles.referralTitle}>Referrals & Rewards Program</Text>
                <ChevronRight size={14} color="#93C5FD" style={{ marginLeft: 'auto' }} />
              </View>
              <Text style={styles.referralCode}>{user.customer_profile.referral_code}</Text>
              <Text style={styles.referralSubtitle}>
                Gift ₹500 to fellow business owners. Earn ₹500 credit on every qualified project! Tap to view rewards hub.
              </Text>
            </Card>
          </TouchableOpacity>
        )}

        {/* Support & Actions List */}
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/my-services')}
          >
            <Boxes size={18} color="#6EE7B7" />
            <Text style={styles.menuItemText}>My Services & Cloud Subscriptions</Text>
            <ChevronRight size={16} color={colors.textLight} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/referrals')}
          >
            <Gift size={18} color="#FBBF24" />
            <Text style={styles.menuItemText}>Referrals & Rewards Hub</Text>
            <ChevronRight size={16} color={colors.textLight} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/support' as any)}
          >
            <HelpCircle size={18} color={colors.text} />
            <Text style={styles.menuItemText}>Customer Support & Helpdesk</Text>
            <ChevronRight size={16} color={colors.textLight} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}
          >
            <Mail size={18} color={colors.text} />
            <Text style={styles.menuItemText}>Notification Preferences</Text>
            <ChevronRight size={16} color={colors.textLight} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <LogOut size={18} color={colors.danger} />
            <Text style={[styles.menuItemText, { color: colors.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        </Card>

        {/* Account Deletion Request */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Trash2 size={14} color={colors.danger} />
          <Text style={styles.deleteText}>Request Account Deletion</Text>
        </TouchableOpacity>
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
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  userPhone: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
  },
  formCard: {
    gap: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  businessStatusContainer: {
    backgroundColor: 'rgba(6, 78, 59, 0.40)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.30)',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  statusIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  statusValueHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#93C5FD',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statusValueMuted: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontStyle: 'italic',
  },
  statusDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  whatsappStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  editButton: {
    marginTop: spacing.xs,
    borderColor: 'rgba(110, 231, 183, 0.40)',
  },
  formContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  formActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  flex1: {
    flex: 1,
  },
  cancelButton: {
    minWidth: 80,
  },
  justSavedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(16, 185, 129, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.50)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  justSavedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7F3D0',
    flex: 1,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSectionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
    paddingVertical: spacing.xs,
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: spacing.md,
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  switchSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  saveButton: {
    marginTop: spacing.xs,
  },
  referralCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    borderRadius: radii.xl,
    alignItems: 'center',
    padding: spacing.lg,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  referralTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
    textTransform: 'uppercase',
  },
  referralCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: spacing.xs,
  },
  referralSubtitle: {
    fontSize: 11,
    color: '#93C5FD',
    textAlign: 'center',
    opacity: 0.9,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 6,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  guestTitle: {
    ...typography.titleMedium,
    color: colors.text,
  },
  guestSubtitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  guestButtons: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  fullWidth: {
    width: '100%',
  },
});
