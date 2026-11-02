import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Globe, Zap, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { colors, spacing, radii, typography } from '../src/theme';
import { Button } from '../src/components/Button';
import { storage } from '../src/lib/storage';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: Globe,
    title: 'Modern Business Websites from ₹499',
    description: 'Get an ultra-responsive, professional web presence tailored to acquire customers for your business.',
  },
  {
    icon: Zap,
    title: 'Lightning-Fast 3-Day Turnaround',
    description: 'Our streamlined engineering pipeline delivers functional staging previews and rapid domain launch in days, not months.',
  },
  {
    icon: ShieldCheck,
    title: '100% Transparent & Zero Lock-in',
    description: 'No hidden hosting charges, no complex contracts. Full source code ownership, free SSL, and WhatsApp chat support included.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleFinish = async () => {
    await storage.setItem('biz499_onboarding_seen', 'true');
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (currentIdx < slides.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      handleFinish();
    }
  };

  const CurrentIcon = slides[currentIdx].icon;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleFinish}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <CurrentIcon size={48} color="#93C5FD" />
        </View>

        <Text style={styles.title}>{slides[currentIdx].title}</Text>
        <Text style={styles.description}>{slides[currentIdx].description}</Text>

        <View style={styles.dotsRow}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                currentIdx === idx ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title={currentIdx === slides.length - 1 ? "Get Started" : "Continue"}
          onPress={handleNext}
          variant="primary"
          size="lg"
          style={styles.fullWidth}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  topBar: {
    alignItems: 'flex-end',
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.titleLarge,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  description: {
    ...typography.bodyLarge,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xxl,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.brand,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: colors.border,
  },
  footer: {
    paddingVertical: spacing.md,
  },
  fullWidth: {
    width: '100%',
  },
});

