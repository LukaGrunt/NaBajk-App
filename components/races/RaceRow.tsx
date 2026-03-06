import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { Race } from '@/repositories/racesRepo';
import { useLanguage } from '@/contexts/LanguageContext';

// ── type inference ─────────────────────────────────────

type FAIcon = React.ComponentProps<typeof FontAwesome>['name'];

export interface TypeSpec {
  icon:   FAIcon;
  iconCol: string; // icon foreground
  bgCol:  string;  // chip background (low-opacity tint)
}

/**
 * Infer race category from explicit type string or name fallback.
 * Exported so the detail modal can render the same chip without duplicating logic.
 */
export function inferType(name: string, type?: string): TypeSpec {
  // Use explicit type if provided (new rows)
  if (type) {
    const t = type.toLowerCase();
    if (t === 'kronometer')
      return { icon: 'clock-o',    iconCol: '#5EEAD4', bgCol: 'rgba(94, 234, 212, 0.15)' };
    if (t === 'vzpon')
      return { icon: 'chevron-up', iconCol: '#FB923C', bgCol: 'rgba(251, 146, 60, 0.15)' };
    // 'cestna' falls through to bicycle default below
    return   { icon: 'bicycle',    iconCol: '#60A5FA', bgCol: 'rgba(96, 165, 250, 0.15)' };
  }

  // Fallback: infer from name (old rows without explicit type)
  const n = name.toLowerCase();
  if (n.includes('kronometr') || n.includes('time trial') || /\btt\b/.test(n))
    return { icon: 'clock-o',    iconCol: '#5EEAD4', bgCol: 'rgba(94, 234, 212, 0.15)' };  // teal
  if (n.includes('maraton') || n.includes('marathon') || n.includes('gran fondo') || n.includes('granfondo'))
    return { icon: 'trophy',     iconCol: '#34D399', bgCol: 'rgba(52, 211, 153, 0.15)' };   // muted green
  if (n.includes('vzpon') || n.includes('hill climb') || n.includes('climb'))
    return { icon: 'chevron-up', iconCol: '#FB923C', bgCol: 'rgba(251, 146, 60, 0.15)' };   // warm orange
  return   { icon: 'bicycle',    iconCol: '#60A5FA', bgCol: 'rgba(96, 165, 250, 0.15)' };   // soft blue
}

// ── component ──────────────────────────────────────────

interface RaceRowProps {
  race:    Race;
  isToday: boolean;
  isFirst: boolean;
  isLast:  boolean;
  onPress: () => void;
}

export function RaceRow({ race, isToday, isFirst, isLast, onPress }: RaceRowProps) {
  const { language } = useLanguage();
  const date    = new Date(race.raceDate + 'T12:00:00');
  const day     = date.getDate();
  const locale  = language === 'sl' ? 'sl-SI' : 'en-US';
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).toUpperCase();
  const type    = inferType(race.name, race.type);

  const cardStyle = [
    styles.card,
    isFirst  && styles.cardFirst,
    isLast   && styles.cardLast,
    !isLast  && styles.cardDivider,
    isLast   && styles.cardLastMargin,
  ];

  return (
    <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
      {/* Day badge */}
      <View style={[styles.dayBadge, isToday && styles.dayBadgeToday]}>
        <Text style={[styles.dayWeekday, isToday && styles.dayTextToday]}>{weekday}</Text>
        <Text style={[styles.dayNumber,  isToday && styles.dayTextToday]}>{day}</Text>
      </View>

      {/* Type icon chip */}
      <View style={[styles.iconChip, { backgroundColor: type.bgCol }]}>
        <FontAwesome name={type.icon} size={15} color={type.iconCol} />
      </View>

      {/* Name + location */}
      <View style={styles.middle}>
        <Text style={styles.raceName} numberOfLines={1}>{race.name}</Text>
        {race.region && (
          <Text style={styles.location}>{race.region}</Text>
        )}
      </View>

      {/* Right: chevron only */}
      <View style={styles.right}>
        <FontAwesome name="chevron-right" size={13} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

// ── styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.cardSurface,
    paddingVertical:   14,
    paddingHorizontal: 14,
    marginHorizontal:  16,
    gap:               12,
  },

  /* positional card variants */
  cardFirst: {
    borderTopLeftRadius:  14,
    borderTopRightRadius: 14,
  },
  cardLast: {
    borderBottomLeftRadius:  14,
    borderBottomRightRadius: 14,
  },
  cardLastMargin: {
    marginBottom: 8,
  },
  cardDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },

  /* day badge — neutral unless today */
  dayBadge: {
    width:           48,
    minWidth:        48,
    height:          44,
    borderRadius:    10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  dayBadgeToday: {
    backgroundColor: Colors.brandGreen,
  },
  dayWeekday: {
    fontSize:    9,
    fontWeight:  '600',
    color:       Colors.textMuted,
    letterSpacing: 0.5,
  },
  dayNumber: {
    fontSize:   16,
    fontWeight: '700',
    color:      Colors.textPrimary,
  },
  dayTextToday: {
    color: Colors.background,
  },

  /* type icon chip */
  iconChip: {
    width:          32,
    minWidth:       32,
    height:         32,
    borderRadius:   10,
    justifyContent: 'center',
    alignItems:     'center',
  },

  /* middle: name + location */
  middle: {
    flex:     1,
    minWidth: 0,
  },
  raceName: {
    fontSize:   15,
    fontWeight: '600',
    color:      Colors.textPrimary,
  },
  location: {
    fontSize:  13,
    color:     Colors.textMuted,
    marginTop: 2,
  },

  /* right icon */
  right: {
    flexDirection: 'row',
    alignItems:    'center',
  },
});
