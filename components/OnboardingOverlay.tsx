import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Svg, { Line, Circle, Rect, Path } from 'react-native-svg';
import { Language, t, strings } from '@/constants/i18n';
import { setOnboardingDone } from '@/utils/localSettings';

const { width: W, height: H } = Dimensions.get('window');
const CALLOUT_H = 108; // estimated callout card height

type Cutout =
  | { type: 'circle'; r: number }
  | { type: 'rect'; w: number; h: number; rx: number };

interface StepDef {
  titleKey: keyof typeof strings.sl;
  bodyKey: keyof typeof strings.sl;
  cx: number; // center x of highlighted element
  cy: number; // center y of highlighted element
  cutout: Cutout;
  calloutTop: number;
}

const STEPS: StepDef[] = [
  // Step 1: FAB green button — 64px circle, bottom: 24 → center at H-56
  {
    titleKey: 'onboardFabTitle',
    bodyKey: 'onboardFabBody',
    cx: W / 2,
    cy: H - 56,
    cutout: { type: 'circle', r: 44 },
    calloutTop: H * 0.30,
  },
  // Step 2: Quick Picks horizontal row
  {
    titleKey: 'onboardQuickTitle',
    bodyKey: 'onboardQuickBody',
    cx: W / 2,
    cy: H * 0.44,
    cutout: { type: 'rect', w: W - 24, h: 96, rx: 20 },
    calloutTop: H * 0.63,
  },
  // Step 3: HeaderPanel (search bar + region chips)
  {
    titleKey: 'onboardSearchTitle',
    bodyKey: 'onboardSearchBody',
    cx: W / 2,
    cy: H * 0.19,
    cutout: { type: 'rect', w: W - 24, h: 112, rx: 28 },
    calloutTop: H * 0.50,
  },
  // Step 4: Custom tab bar — rounded pill, paddingHorizontal 12, center ~H-60
  {
    titleKey: 'onboardTabsTitle',
    bodyKey: 'onboardTabsBody',
    cx: W / 2,
    cy: H - 60,
    cutout: { type: 'rect', w: W - 24, h: 56, rx: 28 },
    calloutTop: H * 0.37,
  },
];

/**
 * SVG path with fillRule="evenodd" so the inner shape is a transparent hole
 * in the dark overlay — making the highlighted element show through clearly.
 */
function makeOverlayPath(s: StepDef): string {
  const outer = `M 0 0 H ${W} V ${H} H 0 Z`;
  const { cx, cy, cutout } = s;

  if (cutout.type === 'circle') {
    // Two half-arcs describe a full circle subpath
    const r = cutout.r;
    return `${outer} M ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy + r} A ${r} ${r} 0 1 0 ${cx} ${cy - r} Z`;
  } else {
    // Rectangular subpath — evenodd makes this area transparent
    const x = cx - cutout.w / 2;
    const y = cy - cutout.h / 2;
    return `${outer} M ${x} ${y} H ${x + cutout.w} V ${y + cutout.h} H ${x} Z`;
  }
}

/**
 * Returns the point on the cutout outline nearest to the callout anchor.
 * The arrow line ends here, not at the element center.
 */
function getLineEnd(s: StepDef, anchorY: number): { x: number; y: number } {
  const { cx, cy, cutout } = s;
  const fromTop = anchorY < cy;
  if (cutout.type === 'circle') {
    return { x: cx, y: fromTop ? cy - cutout.r - 4 : cy + cutout.r + 4 };
  }
  const halfH = cutout.h / 2;
  return { x: cx, y: fromTop ? cy - halfH - 4 : cy + halfH + 4 };
}

interface Props {
  visible: boolean;
  onDone: () => void;
  language: Language;
}

export default function OnboardingOverlay({ visible, onDone, language }: Props) {
  const [step, setStep] = useState(0);

  async function finish() {
    await setOnboardingDone(true);
    onDone();
  }

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await finish();
    }
  }

  const s = STEPS[step];

  // Anchor: bottom edge of callout if callout is above target, top edge otherwise
  const calloutAbove = s.calloutTop + CALLOUT_H < s.cy;
  const anchorY = calloutAbove ? s.calloutTop + CALLOUT_H : s.calloutTop;
  const lineEnd = getLineEnd(s, anchorY);

  // When the spotlight is near the bottom, move controls below the callout
  // to avoid them overlapping the highlighted area
  const spotlightAtBottom = s.cy > H * 0.78;
  const controlsPos = spotlightAtBottom
    ? { top: s.calloutTop + CALLOUT_H + 24 }
    : { bottom: 52 };

  // Cutout outline dimensions (for Circle / Rect stroke)
  const ol = s.cutout.type === 'rect'
    ? { x: s.cx - s.cutout.w / 2, y: s.cy - s.cutout.h / 2 }
    : null;

  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View style={styles.container}>

        {/* SVG layer — full screen, non-interactive */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">

          {/* Dark overlay with a transparent hole punched through it */}
          <Path
            d={makeOverlayPath(s)}
            fillRule="evenodd"
            fill="rgba(0,0,0,0.80)"
          />

          {/* Subtle green tint over the spotlight area */}
          {s.cutout.type === 'circle' ? (
            <Circle
              cx={s.cx} cy={s.cy} r={s.cutout.r}
              fill="rgba(11,191,118,0.10)"
            />
          ) : ol && (
            <Rect
              x={ol.x} y={ol.y}
              width={s.cutout.w} height={s.cutout.h}
              rx={s.cutout.rx}
              fill="rgba(11,191,118,0.10)"
            />
          )}

          {/* Green outline that precisely borders the highlighted element */}
          {s.cutout.type === 'circle' ? (
            <Circle
              cx={s.cx} cy={s.cy} r={s.cutout.r}
              stroke="#0BBF76" strokeWidth={2} fill="none"
            />
          ) : ol && (
            <Rect
              x={ol.x} y={ol.y}
              width={s.cutout.w} height={s.cutout.h}
              rx={s.cutout.rx}
              stroke="#0BBF76" strokeWidth={2} fill="none"
            />
          )}

          {/* Dashed arrow line from callout edge → spotlight outline edge */}
          <Line
            x1={W / 2} y1={anchorY}
            x2={lineEnd.x} y2={lineEnd.y}
            stroke="#0BBF76"
            strokeWidth={1.5}
            strokeDasharray="6,4"
          />

        </Svg>

        {/* Callout card */}
        <View style={[styles.callout, { top: s.calloutTop }]}>
          <Text style={styles.calloutTitle}>{t(language, s.titleKey)}</Text>
          <Text style={styles.calloutBody}>{t(language, s.bodyKey)}</Text>
        </View>

        {/* Controls: skip · dots · next/start */}
        <View style={[styles.controls, controlsPos]}>
          <TouchableOpacity
            onPress={finish}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.skipText}>{t(language, 'onboardSkip')}</Text>
          </TouchableOpacity>

          <View style={styles.dotsRow}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
            <Text style={styles.nextText}>
              {step === STEPS.length - 1
                ? t(language, 'onboardStart')
                : `${t(language, 'onboardNext')} →`}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  callout: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#1A1A1C',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(11,191,118,0.30)',
  },
  calloutTitle: {
    color: '#0BBF76',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  calloutBody: {
    color: '#E5E5E7',
    fontSize: 14,
    lineHeight: 20,
  },
  controls: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 15,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  dotActive: {
    backgroundColor: '#0BBF76',
  },
  nextBtn: {
    backgroundColor: '#0BBF76',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  nextText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
