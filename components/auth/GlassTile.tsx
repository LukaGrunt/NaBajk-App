import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassTileProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function GlassTile({ children, style, intensity = 20 }: GlassTileProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint="dark" style={styles.blur}>
        <View style={styles.content}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  blur: {
    flex: 1,
    backgroundColor: 'rgba(15, 25, 20, 0.6)',
  },
  content: {
    flex: 1,
  },
});
