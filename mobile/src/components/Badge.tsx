import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface BadgeProps {
  label: string;
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'brand', style }) => {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  brand: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderColor: 'rgba(147, 197, 253, 0.40)',
    borderWidth: 1,
  },
  text_brand: {
    color: '#93C5FD',
  },
  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.20)',
    borderColor: 'rgba(110, 231, 183, 0.40)',
    borderWidth: 1,
  },
  text_success: {
    color: '#6EE7B7',
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderColor: 'rgba(252, 211, 77, 0.40)',
    borderWidth: 1,
  },
  text_warning: {
    color: '#FDE68A',
  },
  danger: {
    backgroundColor: 'rgba(239, 68, 68, 0.20)',
    borderColor: 'rgba(252, 165, 165, 0.40)',
    borderWidth: 1,
  },
  text_danger: {
    color: '#FCA5A5',
  },
  neutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
  },
  text_neutral: {
    color: '#CBD5E1',
  },
});

