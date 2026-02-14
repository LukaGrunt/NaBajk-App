// Quick script to clear auth and onboarding state
import AsyncStorage from '@react-native-async-storage/async-storage';

async function resetAuth() {
  await AsyncStorage.multiRemove([
    'nb_auth_user_email',
    'nb_push_permission_asked',
    'nb_push_permission_status',
    'nb_onboarding_done',
    'nb_language',
    'nb_rider_level'
  ]);
  console.log('Auth and onboarding cleared!');
}

resetAuth();
