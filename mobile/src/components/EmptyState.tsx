import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography } from '../theme';

interface EmptyStateProps {
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionTitle,
  onAction,
  icon,
}) => {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          size="sm"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleSmall,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    minWidth: 140,
  },
});

