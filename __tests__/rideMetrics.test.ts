import {
  computeDistanceMeters,
  computeMovingSeconds,
  calcElevationGain,
  calcElevationGainFromPoints,
  finalizeRide,
} from '@/lib/rideMetrics';
import { correctElevations } from '@/lib/elevationCorrection';
import type { RecordedPoint } from '@/lib/rideRecorder';

const M_PER_DEG_LAT = 111_195; // metres per degree of latitude

/** Track heading due north at constant speed; alt via callback. */
function makeTrack(opts: {
  count:      number;
  intervalS?: number;                  // seconds between fixes
  speedMs?:   number;                  // ground speed
  alt?:       (i: number) => number;
}): RecordedPoint[] {
  const { count, intervalS = 4, speedMs = 8, alt } = opts;
  const points: RecordedPoint[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      lat:       46 + (i * speedMs * intervalS) / M_PER_DEG_LAT,
      lng:       14.5,
      alt:       alt ? alt(i) : undefined,
      timestamp: 1_700_000_000_000 + i * intervalS * 1000,
      accuracy:  5,
    });
  }
  return points;
}

// ── distance ─────────────────────────────────────────────

describe('computeDistanceMeters', () => {
  it('sums haversine segments (101 fixes × 32 m ≈ 3200 m)', () => {
    const d = computeDistanceMeters(makeTrack({ count: 101 }));
    expect(d).toBeGreaterThan(3190);
    expect(d).toBeLessThan(3210);
  });

  it('is 0 for fewer than 2 points', () => {
    expect(computeDistanceMeters(makeTrack({ count: 1 }))).toBe(0);
    expect(computeDistanceMeters([])).toBe(0);
  });
});

// ── moving time ──────────────────────────────────────────

describe('computeMovingSeconds', () => {
  it('counts normal GPS cadence fully', () => {
    // 10 fixes 5 s apart → 9 gaps × 5 s
    expect(computeMovingSeconds(makeTrack({ count: 10, intervalS: 5 }))).toBe(45);
  });

  it('excludes a long stationary pause (café stop)', () => {
    const a = makeTrack({ count: 5 });            // 16 s moving
    const last = a[a.length - 1];
    // 300 s later, same location → not moving
    const b = makeTrack({ count: 5 }).map((p, i) => ({
      ...p,
      lat:       last.lat + (i * 32) / M_PER_DEG_LAT,
      timestamp: last.timestamp + 300_000 + i * 4000,
    }));
    expect(computeMovingSeconds([...a, ...b])).toBe(32);
  });

  it('keeps a long gap when the rider covered ground (GPS dropout)', () => {
    const a = makeTrack({ count: 5 });            // 16 s
    const last = a[a.length - 1];
    // 120 s gap, 960 m further north → implied 8 m/s → riding
    const b = makeTrack({ count: 5 }).map((p, i) => ({
      ...p,
      lat:       last.lat + (960 + i * 32) / M_PER_DEG_LAT,
      timestamp: last.timestamp + 120_000 + i * 4000,
    }));
    expect(computeMovingSeconds([...a, ...b])).toBe(16 + 120 + 16);
  });
});

// ── elevation gain (hysteresis) ──────────────────────────

describe('calcElevationGain', () => {
  it('accumulates climbs between local extrema', () => {
    // 0→10 (gain 10), 10→5, 5→20 (gain 15)
    expect(calcElevationGain([0, 10, 5, 20], 2)).toBe(25);
  });

  it('ignores oscillation below the threshold', () => {
    expect(calcElevationGain([0, 1, 0, 1, 0, 1], 2)).toBe(0);
  });

  it('captures a steady climb of tiny per-step deltas in full', () => {
    const alts = Array.from({ length: 201 }, (_, i) => i * 0.5); // 100 m total
    expect(calcElevationGain(alts, 2)).toBe(100);
  });

  it('counts nothing on a pure descent', () => {
    expect(calcElevationGain([100, 80, 60, 40], 2)).toBe(0);
  });
});

describe('calcElevationGainFromPoints', () => {
  it('keeps the gain of a smooth gentle climb (DEM-corrected data)', () => {
    // 200 steps × 0.5 m — the old per-step MIN_DELTA=1 reported ~0 here
    const track = makeTrack({ count: 201, alt: i => 100 + i * 0.5 });
    const gain = calcElevationGainFromPoints(track, true);
    expect(gain).toBeGreaterThan(95);   // smoothing trims only the track ends
    expect(gain).toBeLessThanOrEqual(100);
  });

  it('rejects bounded noise on a flat ride (raw GPS data)', () => {
    // ±5 m composite noise around 300 m — the old algorithm accumulated
    // every ≥1 m up-step of this into large phantom gain
    const track = makeTrack({
      count: 500,
      alt: i => 300 + 3 * Math.sin(i * 1.3) + 2 * Math.sin(i * 0.29),
    });
    expect(calcElevationGainFromPoints(track, false)).toBeLessThanOrEqual(20);
  });

  it('returns 0 when altitudes are missing', () => {
    expect(calcElevationGainFromPoints(makeTrack({ count: 10 }), false)).toBe(0);
  });
});

// ── DEM correction + finalizeRide ────────────────────────

describe('correctElevations', () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it('replaces altitudes and reports corrected=true on API success', async () => {
    global.fetch = jest.fn(async (url: any) => {
      const n = String(url).split('|').length;   // one elevation per sample
      return {
        ok: true,
        json: async () => ({
          status: 'OK',
          results: Array.from({ length: n }, (_, i) => ({ elevation: 100 + i * 10 })),
        }),
      } as any;
    }) as any;

    // 3 fixes 100 m apart → all 3 survive downsampling
    const track = makeTrack({ count: 3, intervalS: 10, speedMs: 10, alt: () => 555 });
    const result = await correctElevations(track);
    expect(result.corrected).toBe(true);
    expect(result.points.map(p => p.alt)).toEqual([100, 110, 120]);
  });

  it('returns original points with corrected=false on network failure', async () => {
    global.fetch = jest.fn(async () => { throw new Error('offline'); }) as any;
    const track = makeTrack({ count: 3, alt: i => 100 + i });
    const result = await correctElevations(track);
    expect(result.corrected).toBe(false);
    expect(result.points).toBe(track);
  });
});

describe('finalizeRide', () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it('produces consistent metrics from one track when DEM is unavailable', async () => {
    global.fetch = jest.fn(async () => { throw new Error('offline'); }) as any;

    // 101 fixes, 8 m/s, steady 1 m-per-fix climb
    const track = makeTrack({ count: 101, alt: i => 200 + i });
    const m = await finalizeRide(track, 450);

    expect(m.elevationCorrected).toBe(false);
    expect(m.elapsedSeconds).toBe(450);
    expect(m.movingSeconds).toBe(400);                 // 100 gaps × 4 s
    expect(m.distanceMeters).toBeCloseTo(3200, -1);
    expect(m.avgSpeedKmh).toBeCloseTo(3.2 / (400 / 3600), 0);
    expect(m.elevationGainM).toBeGreaterThan(95);      // steady climb survives raw threshold
    expect(m.elevationGainM).toBeLessThanOrEqual(100);
    expect(m.points).toHaveLength(101);
  });
});
