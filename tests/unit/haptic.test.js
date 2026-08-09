import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @capacitor/haptics and @capacitor/core before importing
vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    vibrate: vi.fn(() => Promise.resolve()),
  },
  ImpactStyle: {},
  NotificationType: {},
}));
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(() => 'web'),
    isNativePlatform: vi.fn(() => false),
  },
}));

import { vibrate } from '../../src/core/haptics.js';

describe('vibrate (active core/haptics.js)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a function', () => {
    expect(typeof vibrate).toBe('function');
  });

  it('should call Haptics.vibrate with duration for a number pattern', async () => {
    await vibrate(200);
    const { Haptics } = await import('@capacitor/haptics');
    expect(Haptics.vibrate).toHaveBeenCalledWith({ duration: 200 });
  });

  it('should call Haptics.vibrate for each on-duration in an array pattern', async () => {
    await vibrate([100, 50, 200]);
    const { Haptics } = await import('@capacitor/haptics');
    expect(Haptics.vibrate).toHaveBeenCalledTimes(2);
    expect(Haptics.vibrate).toHaveBeenNthCalledWith(1, { duration: 100 });
    expect(Haptics.vibrate).toHaveBeenNthCalledWith(2, { duration: 200 });
  });
});
