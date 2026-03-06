import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getTermsAccepted } from '@/utils/localSettings';

export default function Index() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/auth-welcome');
      return;
    }

    // Signed in — check if user has accepted terms
    getTermsAccepted().then((accepted) => {
      if (!accepted) {
        router.replace('/terms-acceptance');
      } else {
        router.replace('/(tabs)');
      }
    });
  }, [authLoading, user]);

  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#00BC7C" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#03130E',
  },
});
