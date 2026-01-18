import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';

interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, disabled = false, onPress }: ChipProps) {
  const containerStyle = [
    styles.container,
    selected && styles.selectedContainer,
    disabled && styles.disabledContainer,
  ];

  const textStyle = [
    styles.text,
    selected && styles.selectedText,
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardSurface,
    marginRight: 8,
  },
  selectedContainer: {
    backgroundColor: Colors.brandGreen,
  },
  disabledContainer: {
    backgroundColor: Colors.cardSurface,
    opacity: 0.6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  selectedText: {
    color: Colors.background,
    fontWeight: '600',
  },
  disabledText: {
    color: Colors.textMuted,
  },
});
