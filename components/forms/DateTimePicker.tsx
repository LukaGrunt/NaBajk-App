import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { formatShortDate, formatTime } from '@/utils/dateFormatting';

interface DateTimePickerProps {
  label: string;
  value: Date;
  mode: 'date' | 'time';
  error?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function DateTimePickerComponent({
  label,
  value,
  mode,
  error,
  isOpen,
  onToggle,
}: DateTimePickerProps) {
  const displayValue =
    mode === 'date'
      ? formatShortDate(value.toISOString(), 'sl')
      : formatTime(value.toISOString());

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.button, error && styles.buttonError, isOpen && styles.buttonOpen]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.value}>{displayValue}</Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export { DateTimePickerComponent as DateTimePicker };

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  button: {
    backgroundColor: Colors.cardSurface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonOpen: {
    borderColor: Colors.brandGreen,
  },
  buttonError: {
    borderColor: '#EF4444',
  },
  value: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  error: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
  },
});
