import { detectClimb, detectClimbs, ClimbDefinition } from '@/lib/climbDetection';
import type { RecordedPoint } from '@/lib/rideRecorder';

const M_PER_DEG_LAT = 111_195;
const BASE_LAT = 46.0;
const BASE_LNG = 14.5;
const BASE_TS  = 1_700_000_000_000;

/**
 * Track heading due north. `meters(i)` gives the northward offset of fix i,
 * `lngOffsetM(i)` an optional eastward offset (for shortcut scenarios).
 */
function makeTrack(opts: {
  count:       number;
  intervalS?:  number;
  meters:      (i: number) => number;
  lngOffsetM?: (i: number) => number;
}): RecordedPoint[] {
  const { count, intervalS = 4, meters, lngOffsetM } = opts;
  return Array.from({ length: count }, (_, i) => ({
    lat:       BASE_LAT + meters(i) / M_PER_DEG_LAT,
    lng:       BASE_LNG + (lngOffsetM ? lngOffsetM(i) : 0) / (M_PER_DEG_LAT * Math.cos(BASE_LAT * Math.PI / 180)),
    timestamp: BASE_TS + i * intervalS * 1000,
    accuracy:  5,
  }));
}

/** A 3 km straight climb with checkpoints at 0 / 750 / 1500 / 2250 / 3000 m. */
const CLIMB: ClimbDefinition = {
  id:    'climb-1',
  title: 'Testni vzpon',
  checkpoints: [0, 750, 1500, 2250, 3000].map(m => ({
    lat: BASE_LAT + m / M_PER_DEG_LAT,
    lng: BASE_LNG,
  })),
};

describe('detectClimb', () => {
  it('detects a full ascent and times it from start to summit', () => {
    // 201 fixes 15 m apart at 4 s → 3000 m in 800 s
    const track = makeTrack({ count: 201, meters: i => i * 15 });
    const result = detectClimb(track, CLIMB);
    expect(result).not.toBeNull();
    expect(result!.timeSeconds).toBe(800);
    expect(result!.startIndex).toBe(0);
    expect(result!.summitIndex).toBe(200);
  });

  it('rejects a shortcut that skips a midpoint', () => {
    // Same ride but the middle third detours 200 m east — misses the 1500 m checkpoint
    const track = makeTrack({
      count: 201,
      meters: i => i * 15,
      lngOffsetM: i => (i > 70 && i < 130 ? 200 : 0),
    });
    expect(detectClimb(track, CLIMB)).toBeNull();
  });

  it('rejects a ride that only reaches halfway', () => {
    const track = makeTrack({ count: 100, meters: i => i * 15 }); // ends at 1485 m
    expect(detectClimb(track, CLIMB)).toBeNull();
  });

  it('rejects riding the climb downhill (checkpoints in reverse order)', () => {
    const track = makeTrack({ count: 201, meters: i => 3000 - i * 15 });
    expect(detectClimb(track, CLIMB)).toBeNull();
  });

  it('rejects a parallel road 150 m to the side', () => {
    const track = makeTrack({ count: 201, meters: i => i * 15, lngOffsetM: () => 150 });
    expect(detectClimb(track, CLIMB)).toBeNull();
  });

  it('keeps the best time when the climb is ridden twice in one ride', () => {
    // Up in 800 s, descend, up again 25% faster (12 s gaps → 600 s)
    const up1  = makeTrack({ count: 201, meters: i => i * 15 });
    const down = makeTrack({ count: 101, meters: i => 3000 - i * 30 })
      .map((p, i) => ({ ...p, timestamp: up1[200].timestamp + (i + 1) * 4000 }));
    const up2  = makeTrack({ count: 201, meters: i => i * 15 })
      .map((p, i) => ({ ...p, timestamp: down[100].timestamp + (i + 1) * 3000 }));
    const result = detectClimb([...up1, ...down, ...up2], CLIMB);
    expect(result).not.toBeNull();
    // ~600 s for the faster second ascent; the turnaround fix at the base
    // (descent arriving at the start checkpoint) may add a few seconds.
    expect(result!.timeSeconds).toBeGreaterThanOrEqual(600);
    expect(result!.timeSeconds).toBeLessThanOrEqual(610);
  });

  it('times from the closest approach, not the radius edge', () => {
    // Fixes 15 m apart: several consecutive fixes sit inside the 60 m radius.
    // The chosen index must be the one nearest the checkpoint itself.
    const track = makeTrack({ count: 201, meters: i => i * 15 });
    const result = detectClimb(track, CLIMB)!;
    // Summit checkpoint is at exactly 3000 m → fix #200 (3000 m) is closest
    expect(result.summitIndex).toBe(200);
  });
});

describe('detectClimbs (bbox prefilter + batch)', () => {
  it('returns conquests only for climbs the track actually covers', () => {
    const farClimb: ClimbDefinition = {
      id:    'climb-2',
      title: 'Daleč stran',
      checkpoints: CLIMB.checkpoints.map(cp => ({ ...cp, lat: cp.lat + 1 })), // ~111 km north
    };
    const track = makeTrack({ count: 201, meters: i => i * 15 });
    const results = detectClimbs(track, [CLIMB, farClimb]);
    expect(results).toHaveLength(1);
    expect(results[0].climbId).toBe('climb-1');
  });

  it('handles empty inputs', () => {
    expect(detectClimbs([], [CLIMB])).toEqual([]);
    expect(detectClimbs(makeTrack({ count: 10, meters: i => i * 15 }), [])).toEqual([]);
  });
});
