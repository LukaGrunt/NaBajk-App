import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Colors from '@/constants/Colors';
import { FloatingRideButton } from '@/components/record/FloatingRideButton';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import { getOnboardingDone } from '@/utils/localSettings';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import { OnboardingTriggerContext } from '@/contexts/OnboardingTriggerContext';

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={22} {...props} />;
}

export default function TabLayout() {
  const { language } = useLanguage();
  const [onboardingVisible, setOnboardingVisible] = useState(false);

  useEffect(() => {
    getOnboardingDone().then(done => {
      if (!done) setTimeout(() => setOnboardingVisible(true), 600);
    });
  }, []);

  return (
    <OnboardingTriggerContext.Provider value={() => setOnboardingVisible(true)}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: Colors.brandGreen,
          tabBarInactiveTintColor: Colors.textSecondary,
          headerShown: false,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: t(language, 'routes'),
          tabBarIcon: ({ color }) => <TabBarIcon name="map-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tekme"
        options={{
          title: t(language, 'events'),
          tabBarIcon: ({ color }) => <TabBarIcon name="trophy" color={color} />,
        }}
      />
      {/* Hidden record tab - required for routing but not shown in tab bar */}
      <Tabs.Screen
        name="record"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="group-rides"
        options={{
          title: t(language, 'groupRides'),
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t(language, 'profile'),
          tabBarIcon: ({ color }) => <TabBarIcon name="user-circle" color={color} />,
        }}
      />
    </Tabs>

    {/* Floating Action Button - "The Beacon" */}
    <FloatingRideButton />

    <OnboardingOverlay
      visible={onboardingVisible}
      language={language}
      onDone={() => setOnboardingVisible(false)}
    />
    </OnboardingTriggerContext.Provider>
  );
}
