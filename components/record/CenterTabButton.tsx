import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';

/**
 * Raised circular button rendered in the center of the bottom tab bar.
 * Ignores the default tab-press navigation; pushes /record instead.
 */
export function CenterTabButton({ style: _style, ...props }: any) {
  const router = useRouter();

  return (
    <TouchableOpacity
      {...props}
      style={styles.touchable}
      onPress={() => router.push('/record')}
      activeOpacity={0.7}
    >
      <View style={styles.circle}>
        <FontAwesome name="dot-circle-o" size={28} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  circle: {
    width:            56,
    height:           56,
    borderRadius:     28,
    backgroundColor:  Colors.cardSurface,
    borderWidth:      2.5,
    borderColor:      Colors.brandGreen,
    alignItems:       'center',
    justifyContent:   'center',
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 3 },
    shadowOpacity:    0.35,
    shadowRadius:     8,
    elevation:        7,
  },
});
