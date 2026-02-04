import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Colors from '@/constants/Colors';
import { CenterTabButton } from '@/components/record/CenterTabButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={22} {...props} />;
}

export default function TabLayout() {
  const { language } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.brandGreen,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.cardSurface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 82,
          paddingBottom: 16,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
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
      <Tabs.Screen
        name="record"
        options={{
          title:          '',
          tabBarLabel:    () => null,
          tabBarIcon:     () => null,
          tabBarButton:   (props: any) => <CenterTabButton {...props} />,
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
  );
}
