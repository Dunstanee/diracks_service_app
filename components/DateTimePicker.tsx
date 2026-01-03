import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type DateTimePickerMode = 'date' | 'time' | 'datetime';

interface DateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  mode?: DateTimePickerMode;
  format?: string; // 'YYYY-MM-DD', 'DD/MM/YYYY', etc.
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
  placeholder?: string;
}

const formatDate = (date: Date, format: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};

const parseDate = (dateString: string, format: string): Date | null => {
  try {
    const yearIndex = format.indexOf('YYYY');
    const monthIndex = format.indexOf('MM');
    const dayIndex = format.indexOf('DD');
    const hourIndex = format.indexOf('HH');
    const minuteIndex = format.indexOf('mm');

    if (yearIndex === -1 || monthIndex === -1 || dayIndex === -1) {
      return null;
    }

    const year = parseInt(dateString.substring(yearIndex, yearIndex + 4), 10);
    const month = parseInt(dateString.substring(monthIndex, monthIndex + 2), 10) - 1;
    const day = parseInt(dateString.substring(dayIndex, dayIndex + 2), 10);
    const hours = hourIndex !== -1 ? parseInt(dateString.substring(hourIndex, hourIndex + 2), 10) : 0;
    const minutes = minuteIndex !== -1 ? parseInt(dateString.substring(minuteIndex, minuteIndex + 2), 10) : 0;

    return new Date(year, month, day, hours, minutes);
  } catch {
    return null;
  }
};

export default function CustomDateTimePicker({
  label,
  value,
  onChange,
  mode = 'date',
  format = 'YYYY-MM-DD',
  minimumDate,
  maximumDate,
  error,
  placeholder,
}: DateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());

  const handleOpenPicker = () => {
    setTempDate(value || new Date());
    setShowPicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android') {
        onChange(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
    setTempDate(value || new Date());
  };

  const displayValue = value ? formatDate(value, format) : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.inputContainer, error && styles.inputError]}
        onPress={handleOpenPicker}
        activeOpacity={0.7}
      >
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {displayValue || placeholder || 'Select date'}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.neutral.gray.medium} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && (
        <>
          {Platform.OS === 'ios' && (
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={handleCancel} style={styles.iosPickerButton}>
                  <Text style={styles.iosPickerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.iosPickerTitle}>Select {mode === 'date' ? 'Date' : mode === 'time' ? 'Time' : 'Date & Time'}</Text>
                <TouchableOpacity onPress={handleConfirm} style={styles.iosPickerButton}>
                  <Text style={[styles.iosPickerButtonText, styles.iosPickerButtonConfirm]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode={mode}
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={styles.picker}
              />
            </View>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={tempDate}
              mode={mode}
              display="default"
              onChange={handleDateChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.gray.lighter,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.semantic.error,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  placeholder: {
    color: colors.neutral.gray.medium,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.semantic.error,
    marginTop: 4,
  },
  iosPickerContainer: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  iosPickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  iosPickerButtonText: {
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.medium,
  },
  iosPickerButtonConfirm: {
    color: colors.primary.green,
    fontFamily: fonts.weights.semiBold,
  },
  iosPickerTitle: {
    fontSize: 16,
    fontFamily: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  picker: {
    width: '100%',
    height: 200,
  },
});

