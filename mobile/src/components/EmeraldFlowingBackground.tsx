import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg';

export type EmeraldBackgroundVariant = 'light' | 'dark' | 'auto';

interface EmeraldFlowingBackgroundProps {
  variant?: EmeraldBackgroundVariant;
  disableAnimation?: boolean;
}

/**
 * Premium Executive Emerald Glassmorphic Background for Biz499.
 *
 * Engineered to provide a rich, deep emerald optical canvas with ambient
 * luminous depth designed specifically for frosted glass cards, transparent headers,
 * and high-contrast typography.
 */
export const EmeraldFlowingBackground: React.FC<EmeraldFlowingBackgroundProps> = ({
  variant = 'light',
  disableAnimation = false,
}) => {
  const isDark = variant === 'dark';
  const baseGradId = isDark ? 'biz499_glass_base_dark' : 'biz499_glass_base_light';
  const glowOrbTopId = isDark ? 'biz499_glass_glow_dark1' : 'biz499_glass_glow_top';
  const glowOrbBottomId = isDark ? 'biz499_glass_glow_dark2' : 'biz499_glass_glow_bottom';

  const [reduceMotion, setReduceMotion] = useState(false);
  const breathAnim = useRef(new Animated.Value(0)).current;

  // Check system accessibility settings for reduced motion
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  // Subtle, premium breathing motion on native driver
  useEffect(() => {
    if (disableAnimation || reduceMotion) {
      breathAnim.setValue(0.5);
      return;
    }

    const useNative = Platform.OS !== 'web';
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 7500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 7500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: useNative,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [disableAnimation, reduceMotion]);

  // Interpolate subtle transform scale and opacity for flowing ambiance
  const auraScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.05],
  });

  const auraOpacity = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.85],
  });

  return (
    <View
      style={styles.container}
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {/* 1. Deep Executive Emerald Base Canvas */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {isDark ? (
            <LinearGradient id={baseGradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#072B20" stopOpacity="1" />
              <Stop offset="0.35" stopColor="#041E16" stopOpacity="1" />
              <Stop offset="0.70" stopColor="#02140E" stopOpacity="1" />
              <Stop offset="1" stopColor="#010A07" stopOpacity="1" />
            </LinearGradient>
          ) : (
            <LinearGradient id={baseGradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0A4D3C" stopOpacity="1" />
              <Stop offset="0.35" stopColor="#073B2E" stopOpacity="1" />
              <Stop offset="0.70" stopColor="#042D23" stopOpacity="1" />
              <Stop offset="1" stopColor="#021D16" stopOpacity="1" />
            </LinearGradient>
          )}
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${baseGradId})`} />
      </Svg>

      {/* 2. Hardware-Accelerated Ambient Luminous Depth Layer for Glass Refraction */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: auraOpacity,
            transform: [{ scale: auraScale }],
          },
        ]}
      >
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            {isDark ? (
              <>
                <RadialGradient id={glowOrbTopId} cx="75%" cy="20%" r="65%">
                  <Stop offset="0" stopColor="#059669" stopOpacity="0.40" />
                  <Stop offset="0.6" stopColor="#10B981" stopOpacity="0.12" />
                  <Stop offset="1" stopColor="#072B20" stopOpacity="0" />
                </RadialGradient>
                <RadialGradient id={glowOrbBottomId} cx="25%" cy="75%" r="55%">
                  <Stop offset="0" stopColor="#047857" stopOpacity="0.30" />
                  <Stop offset="1" stopColor="#010A07" stopOpacity="0" />
                </RadialGradient>
              </>
            ) : (
              <>
                <RadialGradient id={glowOrbTopId} cx="75%" cy="22%" r="65%">
                  <Stop offset="0" stopColor="#10B981" stopOpacity="0.28" />
                  <Stop offset="0.55" stopColor="#059669" stopOpacity="0.12" />
                  <Stop offset="1" stopColor="#073B2E" stopOpacity="0" />
                </RadialGradient>
                <RadialGradient id={glowOrbBottomId} cx="20%" cy="72%" r="55%">
                  <Stop offset="0" stopColor="#34D399" stopOpacity="0.18" />
                  <Stop offset="0.6" stopColor="#047857" stopOpacity="0.08" />
                  <Stop offset="1" stopColor="#021D16" stopOpacity="0" />
                </RadialGradient>
              </>
            )}
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${glowOrbTopId})`} />
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${glowOrbBottomId})`} />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
