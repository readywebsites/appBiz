import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { RotateCcw, Clock } from 'lucide-react-native';
import { colors, spacing, typography } from '../theme';

interface ResendCountdownProps {
  initialSeconds?: number;
  onResend: () => Promise<void> | void;
  loading?: boolean;
}

export const ResendCountdown: React.FC<ResendCountdownProps> = ({
  initialSeconds = 45,
  onResend,
  loading = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handlePress = async () => {
    if (secondsLeft > 0 || loading) return;
    await onResend();
    setSecondsLeft(initialSeconds);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {secondsLeft > 0 ? (
        <View style={styles.countdownRow}>
          <Clock size={15} color={colors.textMuted} />
          <Text style={styles.countdownText}>
            Resend code in <Text style={styles.timeHighlight}>{formatTime(secondsLeft)}</Text>
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handlePress}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : (
            <>
              <RotateCcw size={15} color={colors.brand} />
              <Text style={styles.resendText}>Resend Verification Code</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
  timeHighlight: {
    fontWeight: '700',
    color: colors.brand,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  resendText: {
    ...typography.label,
    color: colors.brand,
    textDecorationLine: 'underline',
  },
});

