import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  disabled,
  editable,
  ...props
}) => {
  const isEditable = disabled !== undefined ? !disabled : editable;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textLight}
        style={[
          styles.input,
          error && styles.inputError,
          disabled && styles.inputDisabled,
          style,
        ]}
        editable={isEditable}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.glass.input,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    shadowColor: '#022C22',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: colors.borderLight,
  },
  errorText: {
    fontSize: 11,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});

