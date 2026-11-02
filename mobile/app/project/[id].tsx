import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Globe,
  FileEdit,
  ThumbsUp,
  FileText,
  X,
  Server,
  ShieldCheck,
  Star,
  Upload,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { colors, spacing, radii, typography, glassShadows } from '../../src/theme';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { Input } from '../../src/components/Input';
import { LoadingState } from '../../src/components/LoadingState';

type PortalTab = 'overview' | 'requirements' | 'revisions' | 'hosting' | 'documents' | 'review';

export default function ProjectDetailPortalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<PortalTab>('overview');

  // Revision Modal State
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revTitle, setRevTitle] = useState('');
  const [revDesc, setRevDesc] = useState('');
  const [submittingRev, setSubmittingRev] = useState(false);

  // Requirements Form State
  const [reqBusinessName, setReqBusinessName] = useState('');
  const [reqTagline, setReqTagline] = useState('');
  const [reqAbout, setReqAbout] = useState('');
  const [reqServices, setReqServices] = useState('');
  const [reqColors, setReqColors] = useState('');
  const [reqReferences, setReqReferences] = useState('');
  const [reqDomainName, setReqDomainName] = useState('');
  const [reqHasOwnDomain, setReqHasOwnDomain] = useState(false);
  const [reqContactEmail, setReqContactEmail] = useState('');
  const [reqContactPhone, setReqContactPhone] = useState('');
  const [reqWhatsapp, setReqWhatsapp] = useState('');
  const [reqInstructions, setReqInstructions] = useState('');
  const [reqLogoUrl, setReqLogoUrl] = useState('');
  const [savingReq, setSavingReq] = useState(false);
  const [submittingReq, setSubmittingReq] = useState(false);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHeadline, setReviewHeadline] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [testimonialConsent, setTestimonialConsent] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Renewal Modal / Loading
  const [requestingRenewal, setRequestingRenewal] = useState(false);

  const {
    data: project,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['projectDetail', id],
    queryFn: () => api.getProjectDetail(String(id)),
    enabled: !!id,
  });

  // Populate requirements state from project data
  useEffect(() => {
    if (project?.requirements) {
      const r = project.requirements;
      setReqBusinessName(r.business_name || '');
      setReqTagline(r.tagline || '');
      setReqAbout(r.about_business || '');
      setReqServices(r.services_offered || '');
      setReqColors(r.preferred_colors || '');
      setReqReferences(r.design_references || '');
      setReqDomainName(r.domain_name || '');
      setReqHasOwnDomain(Boolean(r.has_own_domain));
      setReqContactEmail(r.contact_email || '');
      setReqContactPhone(r.contact_phone || '');
      setReqWhatsapp(r.whatsapp_number || '');
      setReqInstructions(r.special_instructions || '');
      setReqLogoUrl(r.logo_url || '');
    }
  }, [project?.requirements]);

  // Populate existing review state
  useEffect(() => {
    if (project?.review) {
      setReviewRating(project.review.rating || 5);
      setReviewHeadline(project.review.headline || '');
      setReviewFeedback(project.review.feedback || '');
      setTestimonialConsent(Boolean(project.review.testimonial_permission));
    }
  }, [project?.review]);

  // Handle Requirements Save / Submit
  const handleSaveRequirements = async (submit: boolean = false) => {
    if (submit) {
      if (!reqBusinessName.trim()) {
        Alert.alert('Required Field', 'Please enter your Business Name or Brand.');
        return;
      }
      if (!reqContactPhone.trim() && !reqContactEmail.trim()) {
        Alert.alert('Required Contact', 'Please provide a primary contact phone number or email.');
        return;
      }
    }

    if (submit) setSubmittingReq(true);
    else setSavingReq(true);

    try {
      await api.saveProjectRequirements(
        String(id),
        {
          business_name: reqBusinessName.trim(),
          tagline: reqTagline.trim(),
          about_business: reqAbout.trim(),
          services_offered: reqServices.trim(),
          preferred_colors: reqColors.trim(),
          design_references: reqReferences.trim(),
          domain_name: reqDomainName.trim(),
          has_own_domain: reqHasOwnDomain,
          contact_email: reqContactEmail.trim(),
          contact_phone: reqContactPhone.trim(),
          whatsapp_number: reqWhatsapp.trim(),
          special_instructions: reqInstructions.trim(),
          logo_url: reqLogoUrl.trim(),
        },
        submit
      );

      if (submit) {
        Alert.alert(
          'Requirements Submitted! 📋',
          'Your project manager and developers have received your specifications and will begin production.'
        );
      } else {
        Alert.alert('Draft Saved', 'Your requirement details have been saved.');
      }
      refetch();
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Could not save requirements.');
    } finally {
      setSavingReq(false);
      setSubmittingReq(false);
    }
  };

  // Handle Revision Submission
  const handleSubmitRevision = async () => {
    if (!revTitle.trim() || !revDesc.trim()) {
      Alert.alert('Required Fields', 'Please describe the change or adjustment needed.');
      return;
    }
    setSubmittingRev(true);
    try {
      await api.requestRevision(String(id), {
        title: revTitle.trim(),
        description: revDesc.trim(),
      });
      setShowRevisionModal(false);
      setRevTitle('');
      setRevDesc('');
      Alert.alert(
        'Revision Request Submitted',
        'Your project lead has been notified and will apply the requested adjustments.'
      );
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not submit revision.');
    } finally {
      setSubmittingRev(false);
    }
  };

  // Handle Final Approval
  const handleApproveFinal = async () => {
    Alert.alert(
      'Approve & Sign-Off Deliverable',
      'By signing off, you confirm satisfaction with the staging deliverables and authorize final production domain launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Launch',
          onPress: async () => {
            try {
              await api.approveProject(String(id), 'FINAL_DELIVERY_SIGN_OFF', 'Approved by customer via portal.');
              Alert.alert('Project Signed Off! 🚀', 'Congratulations on your new website! Domain propagation is initiated.');
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not record approval.');
            }
          },
        },
      ]
    );
  };

  // Handle Domain Renewal Request
  const handleRequestRenewal = async () => {
    Alert.alert(
      'Request Domain & Hosting Renewal',
      `Annual renewal rate for ${project?.domain_hosting?.domain_name || 'your website'} is ₹${project?.domain_hosting?.annual_renewal_price || '1,499'}. Would you like to request renewal confirmation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Renewal Request',
          onPress: async () => {
            setRequestingRenewal(true);
            try {
              await api.requestDomainRenewal(String(id), 'Client requested renewal via mobile app.');
              Alert.alert('Renewal Requested', 'Our billing and technical team will generate your renewal invoice and confirm execution.');
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not submit renewal request.');
            } finally {
              setRequestingRenewal(false);
            }
          },
        },
      ]
    );
  };

  // Handle Project Review Submission
  const handleSubmitReview = async () => {
    if (!reviewFeedback.trim()) {
      Alert.alert('Review Required', 'Please share a brief feedback comment about your website experience.');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.submitProjectReview(String(id), {
        rating: reviewRating,
        headline: reviewHeadline.trim(),
        feedback: reviewFeedback.trim(),
        testimonial_permission: testimonialConsent,
      });
      Alert.alert('Review Submitted! ⭐', 'Thank you for your feedback! It helps fellow business owners and our design team.');
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading || !project) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Project Portal" showBack />
        <LoadingState message="Loading your project portal..." />
      </SafeAreaView>
    );
  }

  const isCompleted = project.status === 'COMPLETED';
  const reqStatus = project.requirements?.status || 'PENDING';
  const hasStaging = Boolean(project.staging_url);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={project.title} subtitle={project.order_number} showBack />

      {/* Navigation Sub-Tabs */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]}
            onPress={() => setActiveTab('overview')}
          >
            <FolderKanban size={13} color={activeTab === 'overview' ? '#6EE7B7' : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'requirements' && styles.tabItemActive]}
            onPress={() => setActiveTab('requirements')}
          >
            <FileEdit size={13} color={activeTab === 'requirements' ? '#6EE7B7' : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === 'requirements' && styles.tabTextActive]}>Requirements</Text>
            {reqStatus === 'PENDING' && <View style={styles.tabBadgeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'revisions' && styles.tabItemActive]}
            onPress={() => setActiveTab('revisions')}
          >
            <Globe size={13} color={activeTab === 'revisions' ? '#6EE7B7' : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === 'revisions' && styles.tabTextActive]}>
              Preview & Edits ({project.revisions?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'hosting' && styles.tabItemActive]}
            onPress={() => setActiveTab('hosting')}
          >
            <Server size={13} color={activeTab === 'hosting' ? '#6EE7B7' : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === 'hosting' && styles.tabTextActive]}>Domain & Hosting</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'documents' && styles.tabItemActive]}
            onPress={() => setActiveTab('documents')}
          >
            <FileText size={13} color={activeTab === 'documents' ? '#6EE7B7' : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>
              Files ({project.files?.length || 0})
            </Text>
          </TouchableOpacity>

          {isCompleted && (
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'review' && styles.tabItemActive]}
              onPress={() => setActiveTab('review')}
            >
              <Star size={13} color={activeTab === 'review' ? '#FBBF24' : '#94A3B8'} />
              <Text style={[styles.tabText, activeTab === 'review' && styles.tabTextActive]}>Review</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* ========================================================== */}
        {/* TAB 1: OVERVIEW & STAGING PREVIEW */}
        {/* ========================================================== */}
        {activeTab === 'overview' && (
          <>
            {/* Staging Live Banner */}
            {hasStaging ? (
              <Card style={styles.stagingBannerCard}>
                <View style={styles.stagingRow}>
                  <View style={styles.stagingIconBox}>
                    <Globe size={20} color="#6EE7B7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stagingTitle}>Staging Preview is Ready</Text>
                    <Text style={styles.stagingSubtitle}>Inspect your mobile-responsive website draft</Text>
                  </View>
                </View>
                <View style={styles.stagingActions}>
                  <TouchableOpacity
                    style={styles.openPreviewBtn}
                    onPress={() => Linking.openURL(project.staging_url)}
                  >
                    <ExternalLink size={14} color="#064E3B" />
                    <Text style={styles.openPreviewBtnText}>Open Staging Website</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.requestChangesBtn}
                    onPress={() => setShowRevisionModal(true)}
                  >
                    <FileEdit size={14} color="#93C5FD" />
                    <Text style={styles.requestChangesBtnText}>Request Changes</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ) : (
              <Card style={styles.stagingPendingCard}>
                <Clock size={18} color="#94A3B8" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.stagingPendingTitle}>Staging In Development</Text>
                  <Text style={styles.stagingPendingDesc}>
                    {reqStatus === 'PENDING'
                      ? 'Please submit your project requirements below to initiate staging wireframing.'
                      : 'Designers are crafting your website layout. Staging link will appear here once ready.'}
                  </Text>
                </View>
              </Card>
            )}

            {/* Live Website Link if Completed */}
            {project.live_url && (
              <TouchableOpacity
                style={styles.liveWebsiteBanner}
                onPress={() => Linking.openURL(project.live_url)}
              >
                <CheckCircle2 size={16} color="#34D399" />
                <Text style={styles.liveWebsiteText}>Live Production Domain: {project.live_url}</Text>
                <ExternalLink size={14} color="#6EE7B7" />
              </TouchableOpacity>
            )}

            {/* Delivery Progress Card */}
            <Card style={styles.overviewCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderNumber}>{project.order_number}</Text>
                <Badge
                  label={project.status?.replace(/_/g, ' ')}
                  variant={isCompleted ? 'success' : 'brand'}
                />
              </View>

              <Text style={styles.projectTitle}>{project.title}</Text>
              {project.client_notes ? (
                <Text style={styles.clientNotes}>{project.client_notes}</Text>
              ) : null}

              {/* Progress Slider */}
              <View style={styles.progressContainer}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Production & Deployment Progress</Text>
                  <Text style={styles.progressValue}>{project.progress_percentage}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${project.progress_percentage}%` }]} />
                </View>
              </View>

              {project.target_delivery_date && (
                <View style={styles.deliveryDateRow}>
                  <Calendar size={13} color="#94A3B8" />
                  <Text style={styles.deliveryDateText}>
                    Target Handover Date: <Text style={styles.boldText}>{project.target_delivery_date}</Text>
                  </Text>
                </View>
              )}
            </Card>

            {/* Milestone Timeline */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Milestone Timeline</Text>
              <View style={styles.milestonesList}>
                {project.milestones && project.milestones.length > 0 ? (
                  project.milestones.map((m: any, idx: number) => {
                    const isDone = m.status === 'COMPLETED';
                    const isCurrent = m.status === 'IN_PROGRESS';
                    return (
                      <View key={m.id || idx} style={styles.milestoneRow}>
                        <View style={styles.timelineTrack}>
                          <View
                            style={[
                              styles.milestoneDot,
                              isDone && styles.dotDone,
                              isCurrent && styles.dotCurrent,
                            ]}
                          >
                            {isDone ? (
                              <CheckCircle2 size={12} color="#FFFFFF" />
                            ) : (
                              <Text style={styles.dotNumber}>{idx + 1}</Text>
                            )}
                          </View>
                          {idx < project.milestones.length - 1 && (
                            <View style={[styles.timelineLine, isDone && styles.lineDone]} />
                          )}
                        </View>

                        <View style={styles.milestoneContent}>
                          <View style={styles.milestoneTop}>
                            <Text style={styles.milestoneTitle}>{m.title}</Text>
                            <Badge
                              label={m.status}
                              variant={isDone ? 'success' : isCurrent ? 'brand' : 'neutral'}
                            />
                          </View>
                          {m.description ? (
                            <Text style={styles.milestoneDesc}>{m.description}</Text>
                          ) : null}
                          {m.due_date ? (
                            <Text style={styles.milestoneDue}>Target: {m.due_date}</Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>Standard 3-day turnaround milestones in progress.</Text>
                )}
              </View>
            </View>

            {/* Final Sign-Off Action */}
            {!isCompleted && (
              <View style={styles.signOffBox}>
                <View style={styles.signOffTextCol}>
                  <Text style={styles.signOffTitle}>Satisfied with Staging Preview?</Text>
                  <Text style={styles.signOffSubtitle}>
                    Approve deliverables to deploy your site live to your official domain.
                  </Text>
                </View>
                <Button
                  title="Approve & Launch 🚀"
                  onPress={handleApproveFinal}
                  variant="primary"
                  size="md"
                  style={styles.signOffBtn}
                />
              </View>
            )}
          </>
        )}

        {/* ========================================================== */}
        {/* TAB 2: REQUIREMENTS CENTER */}
        {/* ========================================================== */}
        {activeTab === 'requirements' && (
          <Card style={styles.tabContentCard}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardSectionTitle}>Project Requirements Portal</Text>
                <Text style={styles.cardSectionSubtitle}>
                  Provide brand assets, content and preferences for website assembly
                </Text>
              </View>
              <Badge
                label={reqStatus.replace(/_/g, ' ')}
                variant={reqStatus === 'APPROVED' ? 'success' : reqStatus === 'SUBMITTED' ? 'brand' : 'warning'}
              />
            </View>

            {/* Status notice */}
            {reqStatus === 'SUBMITTED' && (
              <View style={styles.infoBanner}>
                <CheckCircle2 size={16} color="#34D399" />
                <Text style={styles.infoBannerText}>
                  Requirements submitted on {project.requirements?.submitted_at?.split('T')[0] || 'today'}. Our team is reviewing the assets.
                </Text>
              </View>
            )}

            {project.requirements?.staff_feedback ? (
              <View style={styles.feedbackBanner}>
                <AlertCircle size={16} color="#FBBF24" />
                <Text style={styles.feedbackBannerText}>
                  Staff Feedback: {project.requirements.staff_feedback}
                </Text>
              </View>
            ) : null}

            {/* Inputs */}
            <Input
              label="Business Name / Brand"
              placeholder="e.g. Acme Tech Solutions"
              value={reqBusinessName}
              onChangeText={setReqBusinessName}
            />

            <Input
              label="Tagline / Slogan"
              placeholder="e.g. Modern Web Solutions for Local Businesses"
              value={reqTagline}
              onChangeText={setReqTagline}
            />

            <Input
              label="About Business / Company Overview"
              placeholder="Tell us what your business does, your mission, and key offerings..."
              multiline
              numberOfLines={3}
              value={reqAbout}
              onChangeText={setReqAbout}
            />

            <Input
              label="Services / Products to Highlight"
              placeholder="List the primary 3-6 services you want featured on the website..."
              multiline
              numberOfLines={2}
              value={reqServices}
              onChangeText={setReqServices}
            />

            <Input
              label="Preferred Brand Colors / Theme"
              placeholder="e.g. Emerald Green (#064E3B), Gold accents, or Clean Navy Blue"
              value={reqColors}
              onChangeText={setReqColors}
            />

            <Input
              label="Benchmark / Reference Websites (URLs)"
              placeholder="e.g. https://stripe.com, https://example.com"
              value={reqReferences}
              onChangeText={setReqReferences}
            />

            <Input
              label="Logo URL / Cloud Asset Link"
              placeholder="e.g. https://drive.google.com/... or Imgur / Dropbox link"
              value={reqLogoUrl}
              onChangeText={setReqLogoUrl}
            />

            {/* Domain Preference */}
            <View style={styles.domainToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Do you already own a custom domain?</Text>
                <Text style={styles.toggleSubtitle}>Toggle on if you registered a domain on GoDaddy, Namecheap, etc.</Text>
              </View>
              <Switch
                value={reqHasOwnDomain}
                onValueChange={setReqHasOwnDomain}
                trackColor={{ false: colors.border, true: colors.brand }}
              />
            </View>

            <Input
              label={reqHasOwnDomain ? "Your Existing Domain Name" : "Desired Domain Name to Register"}
              placeholder="e.g. mybusiness.in or mybusiness.com"
              value={reqDomainName}
              onChangeText={setReqDomainName}
            />

            <View style={styles.divider} />
            <Text style={styles.subsectionTitle}>Contact & Social Links for Website</Text>

            <Input
              label="Public Email"
              placeholder="contact@mybusiness.com"
              value={reqContactEmail}
              onChangeText={setReqContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Primary Phone Number"
              placeholder="+91 98765 43210"
              value={reqContactPhone}
              onChangeText={setReqContactPhone}
              keyboardType="phone-pad"
            />

            <Input
              label="WhatsApp Number for Chat Widget"
              placeholder="+91 98765 43210"
              value={reqWhatsapp}
              onChangeText={setReqWhatsapp}
              keyboardType="phone-pad"
            />

            <Input
              label="Special Instructions / Additional Notes"
              placeholder="Any specific requests or design preferences for the team..."
              multiline
              numberOfLines={3}
              value={reqInstructions}
              onChangeText={setReqInstructions}
            />

            {/* Requirement Actions */}
            <View style={styles.reqButtonsRow}>
              <Button
                title="Save Draft"
                onPress={() => handleSaveRequirements(false)}
                loading={savingReq}
                variant="outline"
                size="md"
                style={styles.flex1}
              />
              <Button
                title="Submit to Team 📋"
                onPress={() => handleSaveRequirements(true)}
                loading={submittingReq}
                variant="primary"
                size="md"
                style={styles.flex1}
              />
            </View>
          </Card>
        )}

        {/* ========================================================== */}
        {/* TAB 3: REVISIONS & PREVIEW LOG */}
        {/* ========================================================== */}
        {activeTab === 'revisions' && (
          <Card style={styles.tabContentCard}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardSectionTitle}>Preview & Revision History</Text>
                <Text style={styles.cardSectionSubtitle}>
                  Track change requests, modifications and developer responses
                </Text>
              </View>
              <Button
                title="New Edit Request"
                onPress={() => setShowRevisionModal(true)}
                variant="primary"
                size="sm"
                icon={<FileEdit size={14} color="#FFFFFF" />}
              />
            </View>

            {project.revisions && project.revisions.length > 0 ? (
              <View style={styles.revisionsList}>
                {project.revisions.map((rev: any, index: number) => (
                  <View key={rev.id || index} style={styles.revisionCard}>
                    <View style={styles.revHeader}>
                      <Text style={styles.revTitle}>{rev.title}</Text>
                      <Badge
                        label={rev.status?.replace(/_/g, ' ')}
                        variant={rev.status === 'IMPLEMENTED' ? 'success' : 'brand'}
                      />
                    </View>
                    <Text style={styles.revDesc}>{rev.description}</Text>
                    <Text style={styles.revDate}>
                      Submitted {rev.created_at?.split('T')[0]} by {rev.requested_by_name || 'You'}
                    </Text>

                    {rev.staff_response ? (
                      <View style={styles.staffResponseBox}>
                        <Text style={styles.staffResponseLabel}>Lead Developer Response:</Text>
                        <Text style={styles.staffResponseText}>{rev.staff_response}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <FileEdit size={36} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Revisions Requested</Text>
                <Text style={styles.emptySubtitle}>
                  When you review your staging preview, you can request adjustments or edits here.
                </Text>
                <Button
                  title="Request Change"
                  onPress={() => setShowRevisionModal(true)}
                  variant="outline"
                  size="sm"
                  style={{ marginTop: spacing.sm }}
                />
              </View>
            )}
          </Card>
        )}

        {/* ========================================================== */}
        {/* TAB 4: DOMAIN & HOSTING */}
        {/* ========================================================== */}
        {activeTab === 'hosting' && (
          <Card style={styles.tabContentCard}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardSectionTitle}>Domain & Cloud Infrastructure</Text>
                <Text style={styles.cardSectionSubtitle}>Managed DNS, SSL certificates and high-speed hosting</Text>
              </View>
              <Badge
                label={project.domain_hosting?.renewal_status || 'ACTIVE'}
                variant={project.domain_hosting?.renewal_status === 'RENEWAL_DUE' ? 'warning' : 'success'}
              />
            </View>

            {/* Hosting Details Grid */}
            <View style={styles.specsContainer}>
              <View style={styles.specRow}>
                <Globe size={16} color="#6EE7B7" />
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>DOMAIN NAME</Text>
                  <Text style={styles.specValue}>{project.domain_hosting?.domain_name || project.live_url || 'Pending Configuration'}</Text>
                </View>
              </View>

              <View style={styles.specDivider} />

              <View style={styles.specRow}>
                <Server size={16} color="#93C5FD" />
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>HOSTING PROVIDER & PLAN</Text>
                  <Text style={styles.specValue}>{project.domain_hosting?.hosting_plan || 'Pro Business Cloud SSD (High Speed)'}</Text>
                </View>
              </View>

              <View style={styles.specDivider} />

              <View style={styles.specRow}>
                <ShieldCheck size={16} color="#34D399" />
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>SSL CERTIFICATE STATUS</Text>
                  <Text style={styles.specValue}>
                    {project.domain_hosting?.ssl_status || 'ACTIVE'} (256-Bit TLS Automated Encryption)
                  </Text>
                </View>
              </View>

              <View style={styles.specDivider} />

              <View style={styles.specRow}>
                <Calendar size={16} color="#FBBF24" />
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>NEXT RENEWAL DATE</Text>
                  <Text style={styles.specValue}>
                    {project.domain_hosting?.domain_expires_at || '1 Year from Handover'} • ₹{project.domain_hosting?.annual_renewal_price || '1,499'}/year
                  </Text>
                </View>
              </View>
            </View>

            {/* Renewal CTA */}
            <Button
              title={requestingRenewal ? "Submitting..." : "Request Domain & Hosting Renewal"}
              onPress={handleRequestRenewal}
              loading={requestingRenewal}
              variant="outline"
              size="md"
              style={{ marginTop: spacing.md }}
              icon={<Server size={16} color={colors.brand} />}
            />
          </Card>
        )}

        {/* ========================================================== */}
        {/* TAB 5: DELIVERABLES & DOCUMENT CENTER */}
        {/* ========================================================== */}
        {activeTab === 'documents' && (
          <Card style={styles.tabContentCard}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardSectionTitle}>Document Center & Files</Text>
                <Text style={styles.cardSectionSubtitle}>
                  Design assets, source code archives, invoices & deliverables
                </Text>
              </View>
            </View>

            {/* Direct Invoice PDF Entry */}
            {project.order && (
              <View style={styles.docItem}>
                <FileText size={20} color="#93C5FD" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>Tax Invoice & Payment Receipt</Text>
                  <Text style={styles.docSubtitle}>Official GST Invoice for {project.order_number}</Text>
                </View>
                <Button
                  title="View PDF"
                  onPress={() => Linking.openURL(api.getInvoicePdfUrl(project.order))}
                  variant="outline"
                  size="sm"
                />
              </View>
            )}

            {/* Project Files */}
            {project.files && project.files.length > 0 ? (
              project.files.map((f: any) => (
                <View key={f.id} style={styles.docItem}>
                  <FileText size={20} color={colors.brand} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{f.title}</Text>
                    <Text style={styles.docSubtitle}>{f.file_type} • {f.created_at?.split('T')[0]}</Text>
                  </View>
                  {f.file_url ? (
                    <Button
                      title="Open"
                      onPress={() => Linking.openURL(f.file_url)}
                      variant="outline"
                      size="sm"
                    />
                  ) : null}
                </View>
              ))
            ) : null}
          </Card>
        )}

        {/* ========================================================== */}
        {/* TAB 6: PROJECT REVIEW & FEEDBACK */}
        {/* ========================================================== */}
        {activeTab === 'review' && isCompleted && (
          <Card style={styles.tabContentCard}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardSectionTitle}>Client Satisfaction & Review</Text>
                <Text style={styles.cardSectionSubtitle}>Rate your completed website and delivery experience</Text>
              </View>
              <Badge label="VERIFIED CLIENT" variant="success" />
            </View>

            {/* Star Rating Selector */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewRating(star)}
                  style={styles.starBtn}
                >
                  <Star
                    size={30}
                    color={star <= reviewRating ? '#FBBF24' : '#64748B'}
                    fill={star <= reviewRating ? '#FBBF24' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
              <Text style={styles.starRatingText}>{reviewRating} of 5 Stars</Text>
            </View>

            <Input
              label="Review Headline"
              placeholder="e.g. Great high-speed website, fast 3-day turnaround!"
              value={reviewHeadline}
              onChangeText={setReviewHeadline}
            />

            <Input
              label="Written Testimonial"
              placeholder="Share how Biz499 helped establish your business online..."
              multiline
              numberOfLines={4}
              value={reviewFeedback}
              onChangeText={setReviewFeedback}
            />

            <View style={styles.domainToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Feature as Client Testimonial</Text>
                <Text style={styles.toggleSubtitle}>Allow featuring your review on the Biz499 homepage</Text>
              </View>
              <Switch
                value={testimonialConsent}
                onValueChange={setTestimonialConsent}
                trackColor={{ false: colors.border, true: colors.brand }}
              />
            </View>

            <Button
              title={submittingReview ? "Saving Review..." : "Submit Project Review"}
              onPress={handleSubmitReview}
              loading={submittingReview}
              variant="primary"
              size="md"
              style={{ marginTop: spacing.md }}
            />
          </Card>
        )}
      </ScrollView>

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Website Revision</Text>
              <TouchableOpacity onPress={() => setShowRevisionModal(false)}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Revision title e.g. Color adjustment on hero header"
              placeholderTextColor="#94A3B8"
              value={revTitle}
              onChangeText={setRevTitle}
              style={styles.modalInput}
            />

            <TextInput
              placeholder="Describe the exact changes, sections or text adjustments you need..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={revDesc}
              onChangeText={setRevDesc}
              style={styles.modalTextArea}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowRevisionModal(false)}
                variant="ghost"
                size="md"
              />
              <Button
                title="Submit Revision"
                onPress={handleSubmitRevision}
                loading={submittingRev}
                variant="primary"
                size="md"
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabBar: {
    backgroundColor: colors.glass.header,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
    paddingVertical: spacing.xs,
  },
  tabScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.20)',
    borderColor: 'rgba(110, 231, 183, 0.40)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#6EE7B7',
    fontWeight: '700',
  },
  tabBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FBBF24',
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  stagingBannerCard: {
    backgroundColor: 'rgba(6, 78, 59, 0.50)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.40)',
    gap: spacing.sm,
  },
  stagingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stagingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stagingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stagingSubtitle: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 1,
  },
  stagingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  openPreviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6EE7B7',
    paddingVertical: 9,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    gap: 6,
  },
  openPreviewBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#064E3B',
  },
  requestChangesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingVertical: 9,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    gap: 6,
  },
  requestChangesBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
  },
  stagingPendingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.50)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  stagingPendingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stagingPendingDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  liveWebsiteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.35)',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  liveWebsiteText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  overviewCard: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  orderNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6EE7B7',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  projectTitle: {
    ...typography.titleMedium,
    color: '#FFFFFF',
    marginTop: 2,
  },
  clientNotes: {
    ...typography.bodyMedium,
    color: '#94A3B8',
    marginTop: spacing.xs,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressRow: {
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
    fontSize: 13,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  progressBar: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: radii.full,
  },
  deliveryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  deliveryDateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  milestonesList: {
    backgroundColor: colors.glass.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineTrack: {
    alignItems: 'center',
    width: 24,
  },
  milestoneDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: '#059669',
    borderColor: '#34D399',
  },
  dotCurrent: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  dotNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    marginVertical: 4,
  },
  lineDone: {
    backgroundColor: '#059669',
  },
  milestoneContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  milestoneTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  milestoneDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  milestoneDue: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  signOffBox: {
    backgroundColor: 'rgba(6, 78, 59, 0.40)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.35)',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  signOffTextCol: {
    gap: 2,
  },
  signOffTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  signOffSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  signOffBtn: {
    marginTop: spacing.xs,
  },
  tabContentCard: {
    gap: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardSectionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '600',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  feedbackBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#FDE68A',
    fontWeight: '600',
  },
  domainToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  toggleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: spacing.xs,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6EE7B7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reqButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  flex1: {
    flex: 1,
  },
  revisionsList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  revisionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.40)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  revHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  revTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  revDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  revDate: {
    fontSize: 10,
    color: '#64748B',
  },
  staffResponseBox: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.xs,
    gap: 2,
  },
  staffResponseLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93C5FD',
    textTransform: 'uppercase',
  },
  staffResponseText: {
    fontSize: 11,
    color: '#E2E8F0',
  },
  specsContainer: {
    backgroundColor: 'rgba(6, 78, 59, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.25)',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  specContent: {
    flex: 1,
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  specDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  docSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: spacing.sm,
  },
  starBtn: {
    padding: 2,
  },
  starRatingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(1, 21, 15, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#073327',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.35)',
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalInput: {
    backgroundColor: 'rgba(8, 45, 35, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.25)',
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 13,
    color: '#FFFFFF',
  },
  modalTextArea: {
    backgroundColor: 'rgba(8, 45, 35, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.25)',
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 13,
    color: '#FFFFFF',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
