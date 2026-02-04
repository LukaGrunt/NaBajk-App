import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user, loading: authLoading } = useAuth();

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00BC7C" />
      </View>
    );
  }

  // Auth gate: if not signed in, show auth welcome
  if (!user) {
    return <Redirect href="/auth-welcome" />;
  }

  // If signed in, show main app
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#03130E',
  },
});
