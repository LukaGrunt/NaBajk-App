import { useLocalSearchParams } from 'expo-router';
import CreateGroupRideScreen from '@/screens/CreateGroupRideScreen';

export default function CreateGroupRideRoute() {
  const { routeId } = useLocalSearchParams<{ routeId?: string }>();
  return <CreateGroupRideScreen initialRouteId={routeId} />;
}
