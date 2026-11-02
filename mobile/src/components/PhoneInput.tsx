import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { ChevronDown, Phone, Search, X } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../theme';

export interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
}

export const POPULAR_COUNTRIES: CountryCode[] = [
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AE', dialCode: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SG', dialCode: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'DE', dialCode: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
];

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangePhoneNumber: (text: string) => void;
  callingCode: string;
  onChangeCallingCode: (code: string) => void;
  error?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label = 'Mobile Number',
  value,
  onChangePhoneNumber,
  callingCode = '+91',
  onChangeCallingCode,
  error,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const currentCountry =
    POPULAR_COUNTRIES.find((c) => c.dialCode === callingCode) || POPULAR_COUNTRIES[0];

  const filteredCountries = POPULAR_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search)
  );

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputRow, error && styles.rowError]}>
        {/* Country Code Picker Button */}
        <TouchableOpacity
          style={styles.countryPicker}
          onPress={() => setModalVisible(true)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.flagText}>{currentCountry.flag}</Text>
          <Text style={styles.callingCodeText}>{callingCode}</Text>
          <ChevronDown size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Phone Number Field */}
        <TextInput
          style={styles.textInput}
          placeholder="98765 43210"
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={(text) => onChangePhoneNumber(text.replace(/[^0-9]/g, ''))}
          keyboardType="phone-pad"
          maxLength={15}
          editable={!disabled}
          autoComplete={Platform.OS === 'android' ? 'tel' : 'tel'}
          textContentType="telephoneNumber"
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Country Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country or code..."
                placeholderTextColor={colors.textLight}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    item.dialCode === callingCode && styles.countryItemSelected,
                  ]}
                  onPress={() => {
                    onChangeCallingCode(item.dialCode);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryDialCode}>{item.dialCode}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    width: '100%',
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 50,
  },
  rowError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: '100%',
  },
  flagText: {
    fontSize: 18,
  },
  callingCodeText: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing.md,
    ...typography.bodyLarge,
    color: colors.text,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '60%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.titleSmall,
    color: colors.text,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 42,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    ...typography.bodyMedium,
    color: colors.text,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  countryItemSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: radii.sm,
  },
  countryFlag: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  countryName: {
    flex: 1,
    ...typography.bodyLarge,
    color: '#FFFFFF',
  },
  countryDialCode: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: '#6EE7B7',
  },
});

