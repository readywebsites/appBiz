import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity, Platform } from 'react-native';
import { colors, radii, spacing, glassShadows } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'glass' | 'glassDark' | 'solid';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'glass',
}) => {
  const variantStyle =
    variant === 'glassDark'
      ? styles.glassDark
      : variant === 'solid'
      ? styles.solid
      : styles.glass;

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        style={[variantStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[variantStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  glass: {
    backgroundColor: colors.glass.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...glassShadows.card,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  glassDark: {
    backgroundColor: colors.glass.cardDark,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glass.borderDark,
    ...glassShadows.cardDark,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  solid: {
    backgroundColor: colors.cardSolid,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSolid,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
});
