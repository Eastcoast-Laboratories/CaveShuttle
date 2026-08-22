// Collision detection system
export class CollisionDetection {
  constructor(levelRenderer) {
    this.levelRenderer = levelRenderer;
  }

  checkShipCollision(ship, level) {
    if (!level || !level.layout) return { collided: false };

    const shipRadius = 8;
    
    // Check ship center
    const centerTile = this.levelRenderer.getTileAt(level, ship.x, ship.y, 'ship-center');
    if (this.levelRenderer.isWall(centerTile)) {
      return { collided: true, tile: centerTile, point: { x: ship.x, y: ship.y } };
    }

    const shipPoints = this.getShipPoints(ship, shipRadius);

    for (const point of shipPoints) {
      const tile = this.levelRenderer.getTileAt(level, point.x, point.y, 'ship-perimeter');
      if (this.levelRenderer.isWall(tile)) {
        return { collided: true, tile, point };
      }
    }

    return { collided: false };
  }

  getShipPoints(ship, radius) {
    const points = [];
    const numPoints = 8;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      points.push({
        x: ship.x + Math.cos(angle) * radius,
        y: ship.y + Math.sin(angle) * radius
      });
    }

    return points;
  }

  resolveCollision(entity, collision) {
    if (!collision.collided) return;

    const scaledSize = this.levelRenderer.getScaledTileSize();
    const radius = 8; // ship and pod collision radius

    // The wall tile that was hit
    const tileX = Math.floor(collision.point.x / scaledSize);
    const tileY = Math.floor(collision.point.y / scaledSize);
    const tileLeft = tileX * scaledSize;
    const tileRight = tileLeft + scaledSize;
    const tileTop = tileY * scaledSize;
    const tileBottom = tileTop + scaledSize;

    // Closest point on the wall tile to the entity center
    const closestX = Math.max(tileLeft, Math.min(entity.x, tileRight));
    const closestY = Math.max(tileTop, Math.min(entity.y, tileBottom));
    let nx = entity.x - closestX;
    let ny = entity.y - closestY;
    let dist = Math.hypot(nx, ny);
    let overlap = radius - dist;

    if (dist === 0) {
      // Entity center is inside the wall tile; push back opposite to movement
      const v = Math.hypot(entity.vx, entity.vy);
      if (v > 0.001) {
        nx = -entity.vx / v;
        ny = -entity.vy / v;
      } else {
        nx = 0;
        ny = -1;
      }
      overlap = radius;
    } else {
      nx /= dist;
      ny /= dist;
    }

    // Push the entity out of the wall by the overlap plus a small safety margin
    const push = Math.max(overlap + 0.5, 0.5);
    entity.x += nx * push;
    entity.y += ny * push;

    // Reflect the velocity component that is heading into the wall
    const dot = entity.vx * nx + entity.vy * ny;
    if (dot < 0) {
      entity.vx -= 2 * dot * nx;
      entity.vy -= 2 * dot * ny;
    }

    // Dampen slightly so the bounce doesn't grow out of control
    entity.vx *= 0.8;
    entity.vy *= 0.8;
  }

  checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
  }

  checkPointCollision(x, y, level) {
    if (!level || !level.layout) return false;
    const tile = this.levelRenderer.getTileAt(level, x, y, 'point');
    return this.levelRenderer.isWall(tile);
  }

  checkAABB(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
      x1 < x2 + w2 &&
      x1 + w1 > x2 &&
      y1 < y2 + h2 &&
      y1 + h1 > y2
    );
  }

  checkPodCollision(pod, level) {
    if (!level || !level.layout) return { collided: false };

    const podRadius = 8;
    
    // Check pod center
    const centerTile = this.levelRenderer.getTileAt(level, pod.x, pod.y, 'pod-center');
    if (this.levelRenderer.isWall(centerTile)) {
      return { collided: true, tile: centerTile, point: { x: pod.x, y: pod.y } };
    }

    // Check pod perimeter points
    const podPoints = this.getPodPoints(pod, podRadius);
    for (const point of podPoints) {
      const tile = this.levelRenderer.getTileAt(level, point.x, point.y, 'pod-perimeter');
      if (this.levelRenderer.isWall(tile)) {
        return { collided: true, tile, point };
      }
    }

    return { collided: false };
  }

  getPodPoints(pod, radius) {
    const points = [];
    const numPoints = 8;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      points.push({
        x: pod.x + Math.cos(angle) * radius,
        y: pod.y + Math.sin(angle) * radius
      });
    }

    return points;
  }

  checkBulletCollision(bullet, level, owner = 'unknown') {
    if (!level || !level.layout) return { collided: false };

    const bulletRadius = 2;

    // Tiles that are solid for ship/pod but should not block bunker- nor player-bullets
    // - Bunker variants (the functional bunker markers handle bullets themselves)
    const bulletPassThroughTiles = ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', '[', 'X', 'Y', 'Z', '\\', ']', '^', '_', 'L', 'M', 'N', 'O', 'v', 'w', 'q', 'r', 's', 'u', 'x', 'ý', '§'];

    // Check bullet center
    const centerTile = this.levelRenderer.getTileAt(level, bullet.x, bullet.y, 'bullet-center:' + owner);
    if (this.levelRenderer.isWall(centerTile) && !bulletPassThroughTiles.includes(centerTile)) {
      if (centerTile != 'p') {
        console.log('[BULLET_WALL_HIT] owner:', owner, 'tile:', centerTile, 'bullet pos:', { x: bullet.x.toFixed(1), y: bullet.y.toFixed(1) }, 'point:', { x: bullet.x.toFixed(1), y: bullet.y.toFixed(1) });
      }
      return { collided: true, tile: centerTile, point: { x: bullet.x, y: bullet.y } };
    }

    // Check bullet perimeter points
    const bulletPoints = this.getBulletPoints(bullet, bulletRadius);
    for (const point of bulletPoints) {
      const tile = this.levelRenderer.getTileAt(level, point.x, point.y, 'bullet-perimeter:' + owner);
      if (this.levelRenderer.isWall(tile) && !bulletPassThroughTiles.includes(tile)) {
        if (tile != 'p') {
          console.log('[BULLET_WALL_HIT] owner:', owner, 'tile:', tile, 'bullet pos:', { x: bullet.x.toFixed(1), y: bullet.y.toFixed(1) }, 'point:', { x: point.x.toFixed(1), y: point.y.toFixed(1) });
        }
        return { collided: true, tile, point };
      }
    }

    return { collided: false };
  }

  getBulletPoints(bullet, radius) {
    const points = [];
    const numPoints = 4;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      points.push({
        x: bullet.x + Math.cos(angle) * radius,
        y: bullet.y + Math.sin(angle) * radius
      });
    }

    return points;
  }
}
