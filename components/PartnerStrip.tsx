import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';

// Proper type for FontAwesome icon names
type FAIconName = React.ComponentProps<typeof FontAwesome>['name'];

export interface Partner {
  id: string;
  name: string;
  valueProp: { sl: string; en: string };
  url: string;
  icon?: FAIconName;
  logoImage?: ImageSourcePropType; // Local require() image
  category?: { sl: string; en: string }; // Category tag shown above the card
}

interface PartnerStripProps {
  partners: Partner[];
  language: 'sl' | 'en';
}

interface PartnerCardProps {
  partner: Partner;
  language: 'sl' | 'en';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PartnerCard({ partner, language }: PartnerCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <View style={styles.cardWrapper}>
      {/* Category tag above card */}
      {partner.category && (
        <Text style={styles.categoryTag}>{partner.category[language]}</Text>
      )}
      <AnimatedPressable
        style={[styles.card, animatedStyle]}
        onPress={() => Linking.openURL(partner.url)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Logo image or icon */}
        {partner.logoImage ? (
          <Image
            source={partner.logoImage}
            style={styles.logoImage}
            contentFit="contain"
          />
        ) : (
          <>
            <View style={styles.iconContainer}>
              <FontAwesome name={partner.icon || 'building'} size={22} color={Colors.brandGreen} />
            </View>
            <Text style={styles.partnerName} numberOfLines={1}>{partner.name}</Text>
            <View style={styles.chevronContainer}>
              <FontAwesome name="chevron-right" size={10} color={Colors.textMuted} />
            </View>
          </>
        )}
      </AnimatedPressable>
    </View>
  );
}

export function PartnerStrip({ partners, language }: PartnerStripProps) {
  return (
    <View style={styles.container}>
      {/* Partner cards row */}
      <View style={styles.cardsRow}>
        {partners.slice(0, 2).map((partner) => (
          <PartnerCard key={partner.id} partner={partner} language={language} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardWrapper: {
    flex: 1,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingLeft: 2,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(11, 191, 118, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  chevronContainer: {
    opacity: 0.5,
  },
  logoImage: {
    flex: 1,
    height: 40,
  },
});
