import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionDetection } from '../../src/physics/collision.js';
import { TileRenderer } from '../../src/game/tile-renderer.js';
import { Pod } from '../../src/game/pod.js';
import { POD_HOLDER_CHAR } from '../../src/core/constants.js';

// Regression tests for the pod holder / docking bug:
// The pod marker POD_HOLDER_CHAR (default '1', originally 'm') and related characters (0, 2)
// are now rendered as space and are NOT treated as walls by TileRenderer, so the pod
// does not explode when it leaves the holder. The characters stay in the layout.
describe('Pod holder docking regression', () => {
  let collision;
  let tileRenderer;

  beforeEach(() => {
    tileRenderer = new TileRenderer(); // isWall/getTileAt do not require loaded tiles
    collision = new CollisionDetection(tileRenderer);
  });

  it('treats POD_HOLDER_CHAR as NOT a wall (rendered as space)', () => {
    expect(tileRenderer.isWall(POD_HOLDER_CHAR)).toBe(false);
  });

  it('treats pod holder characters (0, 1, 2) as NOT walls', () => {
    expect(tileRenderer.isWall('0')).toBe(false);
    expect(tileRenderer.isWall('1')).toBe(false);
    expect(tileRenderer.isWall('2')).toBe(false);
  });

  it('does NOT explode the pod when it sits on POD_HOLDER_CHAR holder tile', () => {
    // Pod centered on the POD_HOLDER_CHAR tile (scaled tile size = 16, so center at 8,8)
    const level = { layout: [POD_HOLDER_CHAR], width: 1, height: 1 };
    const pod = new Pod(8, 8);
    pod.onHolder = false; // off the holder -> collision is checked
    const result = collision.checkPodCollision(pod, level);
    expect(result.collided).toBe(false);
  });

  it('never reports collision while the pod is on the holder (handled by caller via onHolder)', () => {
    // The game skips checkPodCollision entirely while onHolder is true; this
    // documents that the pod stays safe at its start position on the holder.
    const pod = new Pod(8, 8);
    expect(pod.onHolder).toBe(true);
  });
});
