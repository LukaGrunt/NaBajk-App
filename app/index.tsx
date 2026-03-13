import { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { getTermsAccepted } from '@/utils/localSettings';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Index() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [minReady, setMinReady] = useState(false);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.92);
  const barWidth = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: barWidth.value * SCREEN_WIDTH,
  }));

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700 });
    logoScale.value = withTiming(1, { duration: 700 });
    barWidth.value = withTiming(1, { duration: 2000 });
    const t = setTimeout(() => setMinReady(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (authLoading || !minReady) return;

    if (!user) {
      router.replace('/auth-welcome');
      return;
    }

    getTermsAccepted().then((accepted) => {
      if (!accepted) {
        router.replace('/terms-acceptance');
      } else {
        router.replace('/(tabs)');
      }
    });
  }, [authLoading, minReady, user]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('@/assets/images/logo-navbar.png')}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
      <View style={styles.barContainer}>
        <Animated.View style={[styles.bar, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0B',
  },
  logo: {
    width: 180,
    height: 60,
  },
  barContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'transparent',
  },
  bar: {
    height: 3,
    backgroundColor: '#00BC7C',
  },
});
