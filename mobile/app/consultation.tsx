import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, Clock, Video } from 'lucide-react-native';
import { Header } from '../src/components/Header';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { api } from '../src/lib/api';
import { colors, spacing, radii, typography } from '../src/theme';

export default function ConsultationScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('11:00 AM - 12:00 PM');
  const [topic, setTopic] = useState('Website Strategy & Package Recommendation');
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '02:00 PM - 03:00 PM',
    '04:00 PM - 05:00 PM',
    '06:00 PM - 07:00 PM',
  ];

  const handleBook = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !preferredDate) {
      Alert.alert('Required Fields', 'Please complete your contact details and preferred date.');
      return;
    }

    setLoading(true);
    try {
      await api.bookConsultation({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        preferred_date: preferredDate,
        preferred_time_slot: timeSlot,
        topic,
      });

      Alert.alert(
        'Call Scheduled! 📞',
        `Your 1-on-1 consultation for ${preferredDate} at ${timeSlot} has been booked. You will receive a Google Meet link via email and WhatsApp.`,
        [{ text: 'Awesome!', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Could not schedule call.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Book 1-on-1 Strategy Call" />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Video size={24} color={colors.brand} />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Complimentary 30-Min Strategy Call</Text>
            <Text style={styles.bannerDesc}>
              Discuss your target audience, e-commerce workflow, and architecture with our lead product specialist.
            </Text>
          </View>
        </View>

        <Input
          label="Your Full Name"
          placeholder="e.g. Vikram Singhania"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Email Address"
          placeholder="vikram@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          label="Phone Number"
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Input
          label="Preferred Date (YYYY-MM-DD)"
          placeholder="2026-10-28"
          value={preferredDate}
          onChangeText={setPreferredDate}
        />

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Time Slot</Text>
          <View style={styles.slotsGrid}>
            {timeSlots.map((slot) => {
              const isSelected = timeSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotPill, isSelected && styles.slotPillSelected]}
                  onPress={() => setTimeSlot(slot)}
                >
                  <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Input
          label="Consultation Topic / Focus"
          placeholder="e.g. Setting up payment gateway or choosing package"
          value={topic}
          onChangeText={setTopic}
        />

        <Button
          title="Confirm Strategy Call"
          onPress={handleBook}
          loading={loading}
          variant="primary"
          size="lg"
          style={styles.bookButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  bannerDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  section: {
    marginVertical: spacing.xs,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  slotPill: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slotPillSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  slotTextSelected: {
    color: colors.white,
  },
  bookButton: {
    marginTop: spacing.md,
  },
});

