import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';

export function LogoTile() {
  return (
    <View style={styles.container}>
      <View style={styles.tile}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    width: 150,
    height: 150,
    borderRadius: 28,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // iOS shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});
