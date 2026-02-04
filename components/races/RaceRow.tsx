import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { Race } from '@/repositories/racesRepo';

// ── type inference ─────────────────────────────────────

type FAIcon = React.ComponentProps<typeof FontAwesome>['name'];

export interface TypeSpec {
  icon:   FAIcon;
  iconCol: string; // icon foreground
  bgCol:  string;  // chip background (low-opacity tint)
}

/**
 * Infer race category from the name.  Exported so the detail modal
 * can render the same chip without duplicating logic.
 */
export function inferType(name: string): TypeSpec {
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
  onPress: () => void;
}

export function RaceRow({ race, isToday, onPress }: RaceRowProps) {
  const day  = new Date(race.raceDate + 'T12:00:00').getDate();
  const type = inferType(race.name);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Day badge */}
      <View style={[styles.dayBadge, isToday && styles.dayBadgeToday]}>
        <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>{day}</Text>
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

      {/* Right: subtle link hint + chevron */}
      <View style={styles.right}>
        {race.link && <FontAwesome name="external-link" size={11} color={Colors.textMuted} />}
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
    borderRadius:      14,
    paddingVertical:   14,
    paddingHorizontal: 14,
    marginHorizontal:  16,
    marginBottom:      8,
    gap:               12,
  },

  /* day badge — neutral unless today */
  dayBadge: {
    width:           38,
    minWidth:        38,
    height:          38,
    borderRadius:    10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  dayBadgeToday: {
    backgroundColor: Colors.brandGreen, // only green accent in the row
  },
  dayNumber: {
    fontSize:   16,
    fontWeight: '700',
    color:      Colors.textPrimary,
  },
  dayNumberToday: {
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

  /* right icons */
  right: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
});
