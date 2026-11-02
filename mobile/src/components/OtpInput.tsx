import React, { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
}) => {
  const inputRefs = useRef<(any | null)[]>([]);
  const lastTriggeredRef = useRef<string>('');

  // Split value into array of length
  const digits = Array(length)
    .fill('')
    .map((_, i) => (value && value[i] ? value[i] : ''));

  const handleChangeText = (text: string, index: number) => {
    // Handle paste of multiple characters
    const cleanDigits = text.replace(/[^0-9]/g, '');

    if (cleanDigits.length > 1) {
      const pasted = cleanDigits.slice(0, length);
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      if (pasted.length === length && pasted !== lastTriggeredRef.current) {
        lastTriggeredRef.current = pasted;
        if (onComplete) {
          onComplete(pasted);
        }
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanDigits.slice(-1); // Take latest single digit
    const updatedValue = newDigits.join('');
    onChange(updatedValue);

    // Auto-advance to next input if digit entered
    if (cleanDigits && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger onComplete ONLY when 6th digit is typed and not previously triggered
    if (updatedValue.length === length && updatedValue !== lastTriggeredRef.current) {
      lastTriggeredRef.current = updatedValue;
      if (onComplete) {
        onComplete(updatedValue);
      }
    } else if (updatedValue.length < length) {
      lastTriggeredRef.current = '';
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<{ key: string }>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      lastTriggeredRef.current = '';
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const isFocused = value.length === index;
        const isFilled = !!digits[index];

        return (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[
              styles.input,
              isFocused && styles.inputFocused,
              isFilled && styles.inputFilled,
              hasError && styles.inputError,
              disabled && styles.inputDisabled,
            ]}
            keyboardType="number-pad"
            maxLength={length} // Allow paste on any cell
            value={digits[index]}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            editable={!disabled}
            selectTextOnFocus
            textAlign="center"
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            textContentType="oneTimeCode"
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    marginVertical: spacing.md,
  },
  input: {
    flex: 1,
    height: 54,
    maxWidth: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  inputFocused: {
    borderColor: '#60A5FA',
    borderWidth: 2,
    backgroundColor: 'rgba(10, 55, 42, 0.90)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  inputFilled: {
    borderColor: '#34D399',
    borderWidth: 2,
    backgroundColor: 'rgba(8, 45, 35, 0.90)',
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: colors.borderLight,
  },
});

