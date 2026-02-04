import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { BlurView } from 'expo-blur';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  icon?: 'google' | 'envelope' | 'apple';
}

export function AuthButton({ label, onPress, loading = false, icon }: AuthButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={loading}
      style={styles.container}
    >
      <BlurView intensity={20} tint="light" style={styles.blur}>
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <>
              {icon && (
                <View style={styles.iconContainer}>
                  <FontAwesome
                    name={icon === 'envelope' ? 'envelope-o' : icon}
                    size={20}
                    color="#000000"
                  />
                </View>
              )}
              <Text style={styles.text}>{label}</Text>
            </>
          )}
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  blur: {
    borderRadius: 50,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
});
