import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';
import { colors, radii, spacing, typography } from '../src/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();

  const [statusMessage, setStatusMessage] = useState('Initializing Biz499 core...');
  const [initFailed, setInitFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Check accessibility reduced motion
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  useEffect(() => {
    const useNative = Platform.OS !== 'web';

    // 1. Fade in & scale reveal
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: reduceMotion ? 100 : 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: useNative,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: reduceMotion ? 100 : 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: useNative,
      }),
    ]).start();

    // 2. Continuous subtle glowing pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [reduceMotion]);

  // Run initialization sequence
  const startInitialization = async () => {
    setInitFailed(false);
    setStatusMessage('Initializing Biz499 core...');

    // Progress 0 -> 30%
    Animated.timing(progressAnim, {
      toValue: 0.3,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    try {
      await new Promise((res) => setTimeout(res, 350));
      setStatusMessage('Verifying secure connection...');

      // Progress 30 -> 70%
      Animated.timing(progressAnim, {
        toValue: 0.7,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();

      await refreshUser();

      setStatusMessage('Finishing setup...');
      // Progress 70 -> 100%
      Animated.timing(progressAnim, {
        toValue: 1.0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();

      await new Promise((res) => setTimeout(res, 450));

      // Route according to authentication state
      // If user exists in context, navigate to tabs; otherwise to welcome screen
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/welcome');
      }
    } catch {
      // Even if network has temporary hiccup, if we have local state proceed or allow retry
      setStatusMessage('Connection failed. Please check network.');
      setInitFailed(true);
    }
  };

  useEffect(() => {
    if (!loading) {
      startInitialization();
    }
  }, [loading]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Ambient background electric glow */}
      <Animated.View
        style={[
          styles.glowOrb,
          {
            opacity: glowAnim,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Brand Monogram Badge */}
        <View style={styles.logoContainer}>
          <View style={styles.outerRing}>
            <View style={styles.innerBadge}>
              <Text style={styles.logoTextMain}>BIZ</Text>
              <Text style={styles.logoTextAccent}>499</Text>
            </View>
          </View>
          <View style={styles.sparkleIcon}>
            <Sparkles size={18} color="#38BDF8" />
          </View>
        </View>

        {/* Brand Tagline */}
        <Text style={styles.brandTitle}>Biz499</Text>
        <Text style={styles.brandSubtitle}>DIGITAL SERVICES & WEB SOLUTIONS</Text>

        {/* Glowing Progress Line */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>

        {/* Dynamic Status Label */}
        <Text style={styles.statusLabel}>{statusMessage}</Text>

        {/* Retry State if failed */}
        {initFailed && (
          <View style={styles.retryContainer}>
            <View style={styles.retryNote}>
              <AlertCircle size={16} color={colors.accent} />
              <Text style={styles.retryText}>Could not connect to Biz499 servers.</Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={startInitialization}
              activeOpacity={0.8}
            >
              <RefreshCw size={16} color={colors.white} />
              <Text style={styles.retryButtonText}>Retry Initialization</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => router.replace('/(auth)/welcome')}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Continue to Welcome Screen</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Footer copyright */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Biz499 Digital Services</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Midnight Navy 950
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#1E3A8A', // Deep electric blue glow
    top: '25%',
    filter: Platform.OS === 'web' ? 'blur(90px)' : undefined,
    opacity: 0.35,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  outerRing: {
    width: 104,
    height: 104,
    borderRadius: 30,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  innerBadge: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoTextMain: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  logoTextAccent: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F59E0B', // Amber gold
    marginTop: -4,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#0F172A',
    borderRadius: radii.full,
    padding: 3,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 2,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#38BDF8', // Electric Cyan Blue
    borderRadius: radii.full,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  statusLabel: {
    ...typography.bodySmall,
    color: '#94A3B8',
    textAlign: 'center',
    minHeight: 20,
  },
  retryContainer: {
    marginTop: spacing.lg,
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  retryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  retryText: {
    ...typography.bodySmall,
    color: colors.accent,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.full,
    width: '100%',
    justifyContent: 'center',
  },
  retryButtonText: {
    ...typography.label,
    color: colors.white,
  },
  skipButton: {
    paddingVertical: spacing.xs,
  },
  skipButtonText: {
    ...typography.bodySmall,
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: spacing.xl,
  },
  footerText: {
    ...typography.bodySmall,
    color: '#475569',
    fontSize: 11,
  },
});

