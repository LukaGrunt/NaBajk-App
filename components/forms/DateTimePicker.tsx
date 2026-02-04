import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '@/constants/Colors';
import { formatShortDate, formatTime } from '@/utils/dateFormatting';

interface DateTimePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode: 'date' | 'time';
  error?: string;
  minimumDate?: Date;
}

export function DateTimePickerComponent({
  label,
  value,
  onChange,
  mode,
  error,
  minimumDate,
}: DateTimePickerProps) {
  const [show, setShow] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const displayValue =
    mode === 'date'
      ? formatShortDate(value.toISOString(), 'sl')
      : formatTime(value.toISOString());

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.button, error && styles.buttonError]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.value}>{displayValue}</Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      {show && (
        <DateTimePicker
          value={value}
          mode={mode}
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
}

export { DateTimePickerComponent as DateTimePicker };

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
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
