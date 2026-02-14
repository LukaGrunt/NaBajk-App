import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, LayoutChangeEvent, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const indicatorPosition = useSharedValue(0);
  const [tabWidth, setTabWidth] = useState(0);

  // Get visible routes (excluding hidden tabs)
  const visibleRoutes = state.routes.filter((route: any) => {
    const { options } = descriptors[route.key];
    return options.href !== null;
  });

  const activeVisibleIndex = visibleRoutes.findIndex(
    (route: any) => route.key === state.routes[state.index].key
  );

  // Update indicator position when tab changes
  React.useEffect(() => {
    if (activeVisibleIndex >= 0 && tabWidth > 0) {
      indicatorPosition.value = withSpring(activeVisibleIndex * tabWidth, {
        damping: 20,
        stiffness: 300,
      });
    }
  }, [activeVisibleIndex, tabWidth]);

  const indicatorWidth = tabWidth - 16;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value + 8 }],
    width: indicatorWidth > 0 ? indicatorWidth : 0,
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    const numTabs = visibleRoutes.length;
    if (numTabs > 0) {
      setTabWidth(width / numTabs);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.tabBarWrapper} onLayout={handleLayout}>
        {/* Animated pill indicator */}
        {tabWidth > 0 && (
          <Animated.View style={[styles.indicator, indicatorStyle]} />
        )}

        {/* Tab items */}
        <View style={styles.tabBar}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];

            // Skip hidden tabs
            if (options.href === null) return null;

            const isFocused = state.index === index;
            const color = isFocused ? Colors.brandGreen : Colors.textSecondary;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // Get icon name based on route
            let iconName: React.ComponentProps<typeof FontAwesome>['name'] = 'circle';
            if (route.name === 'index') iconName = 'map-o';
            else if (route.name === 'tekme') iconName = 'trophy';
            else if (route.name === 'group-rides') iconName = 'users';
            else if (route.name === 'settings') iconName = 'user-circle';

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <FontAwesome name={iconName} size={20} color={color} />
                </View>
                <Text
                  style={[
                    styles.label,
                    { color },
                  ]}
                  numberOfLines={1}
                >
                  {options.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tabBarWrapper: {
    backgroundColor: Colors.surface1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 6,
    height: 44,
    backgroundColor: `${Colors.brandGreen}15`,
    borderRadius: 22,
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconContainer: {
    width: 36,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
