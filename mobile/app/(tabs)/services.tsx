import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowRight, Sparkles, PlusCircle } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { colors, spacing, radii, typography, glassShadows } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { LoadingState } from '../../src/components/LoadingState';

export default function ServicesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>((params.category as string) || '');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const { data: services, isLoading: loadingServices, refetch } = useQuery({
    queryKey: ['services', selectedCategory],
    queryFn: () => api.getServices(selectedCategory || undefined),
  });

  const categoryList = categories?.results || categories || [];
  const serviceList = (services?.results || services || []).filter((s: any) =>
    searchQuery ? s.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services & Packages</Text>
        <Text style={styles.headerSubtitle}>High-performance website development for every business tier</Text>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textLight} />
          <TextInput
            placeholder="Search business websites, e-commerce..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Categories Horizontal Tabs */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[styles.categoryTab, !selectedCategory && styles.activeTab]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.tabText, !selectedCategory && styles.activeTabText]}>All Services</Text>
          </TouchableOpacity>
          {categoryList.map((c: any) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.categoryTab, selectedCategory === c.slug && styles.activeTab]}
              onPress={() => setSelectedCategory(c.slug)}
            >
              <Text style={[styles.tabText, selectedCategory === c.slug && styles.activeTabText]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loadingServices} onRefresh={() => { refetch(); }} />}
      >
        {/* Custom Quote Request Banner */}
        <View style={styles.customQuoteBanner}>
          <View style={styles.customQuoteContent}>
            <Text style={styles.customQuoteTitle}>Need a custom scope or specific integration?</Text>
            <Text style={styles.customQuoteDesc}>Get a detailed proposal tailored to your business requirements.</Text>
          </View>
          <Button
            title="Request Quote"
            onPress={() => router.push('/enquiry')}
            size="sm"
            style={styles.customQuoteButton}
          />
        </View>

        {/* Services List */}
        {loadingServices ? (
          <LoadingState message="Fetching service packages..." />
        ) : serviceList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No matching services found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search terms or filter category.</Text>
          </View>
        ) : (
          serviceList.map((service: any) => (
            <Card key={service.id} style={styles.serviceCard}>
              {service.image_url ? (
                <Image source={{ uri: service.image_url }} style={styles.serviceImage} resizeMode="cover" />
              ) : null}

              <View style={styles.serviceBody}>
                <View style={styles.categoryBadgeRow}>
                  <Text style={styles.categoryNameText}>{service.category_name}</Text>
                  {service.is_featured && (
                    <View style={styles.featuredBadge}>
                      <Sparkles size={10} color="#93C5FD" />
                      <Text style={styles.featuredText}>Featured</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDesc}>{service.short_description}</Text>

                <View style={styles.serviceFooter}>
                  <View>
                    <Text style={styles.startingFromText}>Starting from</Text>
                    <Text style={styles.startingPrice}>
                      ₹{parseFloat(service.starting_price).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <Button
                    title="View Packages"
                    onPress={() => router.push(`/service/${service.slug}`)}
                    variant="primary"
                    size="sm"
                  />
                </View>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.input,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.glass.inputBorder,
    gap: spacing.sm,
    shadowColor: '#01150F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFFFFF',
  },
  categoriesWrapper: {
    backgroundColor: colors.glass.header,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
    paddingVertical: spacing.sm,
  },
  categoriesScroll: {},
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xxl,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    marginRight: spacing.sm,
    backgroundColor: colors.glass.pill,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.30)',
    shadowColor: '#01150F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        } as any)
      : {}),
  },
  activeTab: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  activeTabText: {
    color: colors.white,
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  customQuoteBanner: {
    backgroundColor: colors.glass.cardDark,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
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
  customQuoteContent: {
    flex: 1,
  },
  customQuoteTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  customQuoteDesc: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  customQuoteButton: {
    backgroundColor: colors.brand,
  },
  serviceCard: {
    padding: 0,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 150,
  },
  serviceBody: {
    padding: spacing.lg,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  categoryNameText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6EE7B7',
    textTransform: 'uppercase',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.40)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
    gap: 3,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#93C5FD',
  },
  serviceTitle: {
    ...typography.titleSmall,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  serviceDesc: {
    ...typography.bodyMedium,
    color: '#94A3B8',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  startingFromText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  startingPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: spacing.xxxl,
    alignItems: 'center',
    backgroundColor: colors.glass.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...glassShadows.card,
  },
  emptyTitle: {
    ...typography.titleSmall,
    color: colors.text,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});

