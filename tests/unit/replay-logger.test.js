import { describe, expect, it } from 'vitest';
import { ReplayLogger } from '../../src/game/replay-logger.js';

describe('ReplayLogger', () => {
  it('uses active level time for input timestamps and total duration', () => {
    const logger = new ReplayLogger();
    logger.start();
    logger.record(1, 0, 100);
    logger.record(1, 0, 5000);
    logger.record(2, 0, 200);
    logger.stop(250);

    expect(logger.getLog()).toEqual({
      entries: [
        { t: 100, i: 1 },
        { t: 200, i: 2 },
      ],
      durationMs: 250,
      inputCount: 2,
      timeBasis: 'activeLevel',
    });
  });

  it('uses active level time for shortcut events', () => {
    const logger = new ReplayLogger();
    logger.start();
    logger.recordEvent('shortcut', { action: 'zeroGravityOn' }, 125);
    logger.stop(200);

    expect(logger.getLog().entries).toEqual([
      { t: 125, e: 'shortcut', action: 'zeroGravityOn' },
    ]);
  });
});
