// Mines - hostile mines that moves randomly in free areas
import { MINE_RADIUS, MINE_SPEED_MIN, MINE_SPEED_MAX, MINE_CHANGE_DIR_MIN_FRAMES, MINE_CHANGE_DIR_MAX_FRAMES, MINE_BOUNCE_DAMPING, MINE_TURN_RATE, MINE_STUCK_BOUNCE_THRESHOLD, MINE_STUCK_BOUNCE_WINDOW, MINE_UNSTUCK_FRAMES, MINE_ACTIVATION_DISTANCE, MINE_MAX_DISTANCE_FROM_START } from '../core/constants.js';

export class EnemyMine {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.active = true;
    this.activated = false;
    this.radius = MINE_RADIUS;
    this.changeDirTimer = 0;
    this.changeDirInterval = MINE_CHANGE_DIR_MIN_FRAMES + Math.random() * (MINE_CHANGE_DIR_MAX_FRAMES - MINE_CHANGE_DIR_MIN_FRAMES);
    this.speed = MINE_SPEED_MIN + Math.random() * (MINE_SPEED_MAX - MINE_SPEED_MIN);
    this.targetAngle = Math.random() * Math.PI * 2;
    this.targetVx = Math.cos(this.targetAngle) * this.speed;
    this.targetVy = Math.sin(this.targetAngle) * this.speed;
    this.vx = this.targetVx;
    this.vy = this.targetVy;
    // Stuck detection state
    this.bounceHistory = []; // timestamps of recent bounces
    this.collisionDisabled = 0; // frames remaining with collision disabled
  }

  update(dt, level, tileRenderer, shipX, shipY) {
    if (!this.active) return;

    // Only start moving once the ship is within activation distance
    if (!this.activated) {
      if (shipX != null && shipY != null) {
        const dx = this.x - shipX;
        const dy = this.y - shipY;
        const distToShip = Math.sqrt(dx * dx + dy * dy);
        if (distToShip <= MINE_ACTIVATION_DISTANCE) {
          this.activated = true;
          console.log('[ENEMY_MINE] Activated at distance', distToShip.toFixed(0), 'from ship');
        }
      }
      if (!this.activated) return;
    }

    // Check distance from start point; reverse 180° if max distance reached
    const sdx = this.x - this.startX;
    const sdy = this.y - this.startY;
    const distFromStart = Math.sqrt(sdx * sdx + sdy * sdy);
    if (distFromStart >= MINE_MAX_DISTANCE_FROM_START) {
      // Reverse direction 180 degrees
      this.targetAngle = Math.atan2(this.vy, this.vx) + Math.PI;
      this.targetVx = Math.cos(this.targetAngle) * this.speed;
      this.targetVy = Math.sin(this.targetAngle) * this.speed;
      this.vx = this.targetVx;
      this.vy = this.targetVy;
      this.changeDirTimer = 0;
    }

    // Periodically pick a new random target direction
    this.changeDirTimer += dt;
    if (this.changeDirTimer >= this.changeDirInterval) {
      this.changeDirTimer = 0;
      this.changeDirInterval = MINE_CHANGE_DIR_MIN_FRAMES + Math.random() * (MINE_CHANGE_DIR_MAX_FRAMES - MINE_CHANGE_DIR_MIN_FRAMES);
      this._pickNewDirection();
    }

    // Smoothly interpolate velocity toward target direction (curve instead of snap)
    this.vx += (this.targetVx - this.vx) * MINE_TURN_RATE;
    this.vy += (this.targetVy - this.vy) * MINE_TURN_RATE;

    // Apply current velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Update angle to match movement direction
    this.angle = Math.atan2(this.vy, this.vx);

    // Check collision with walls and bounce (unless in escape mode)
    if (this.collisionDisabled > 0) {
      this.collisionDisabled -= dt;
    } else {
      const collision = this._checkCollision(level, tileRenderer);
      if (collision) {
        this._bounceOffWall(collision, tileRenderer);
        this._recordBounce();
        if (this._isStuck()) {
          this._escapeStuck(level, tileRenderer);
        }
      }
    }
  }

  _recordBounce() {
    const now = performance.now();
    this.bounceHistory.push(now);
    // Keep only bounces within the window (convert frames to ms at ~60fps)
    const windowMs = MINE_STUCK_BOUNCE_WINDOW * (1000 / 60);
    this.bounceHistory = this.bounceHistory.filter(t => now - t < windowMs);
  }

  _isStuck() {
    return this.bounceHistory.length >= MINE_STUCK_BOUNCE_THRESHOLD;
  }

  _escapeStuck(level, tileRenderer) {
    // Scan 8 directions and pick the one with the most free space ahead
    const scaledSize = tileRenderer.getScaledTileSize();
    const checkDist = scaledSize * 3; // check 3 tiles ahead
    let bestDir = null;
    let bestClearance = -1;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      let clearance = 0;
      for (let step = 1; step <= 3; step++) {
        const checkX = this.x + dx * checkDist * (step / 3);
        const checkY = this.y + dy * checkDist * (step / 3);
        const tile = tileRenderer.getTileAt(level, checkX, checkY, 'enemy-ship-path');
        if (tileRenderer.isWall(tile)) break;
        clearance = step;
      }
      if (clearance > bestClearance) {
        bestClearance = clearance;
        bestDir = { angle, dx, dy };
      }
    }

    if (bestDir) {
      // Set both current and target velocity toward the free direction
      this.vx = bestDir.dx * this.speed;
      this.vy = bestDir.dy * this.speed;
      this.targetVx = this.vx;
      this.targetVy = this.vy;
    }

    // Temporarily disable collision to let the mine escape
    this.collisionDisabled = MINE_UNSTUCK_FRAMES;
    this.bounceHistory = [];
    console.log('[MINE_STUCK] Mine was stuck, escaping in direction', bestDir ? bestDir.angle.toFixed(2) : 'none');
  }

  _pickNewDirection() {
    const angle = Math.random() * Math.PI * 2;
    this.targetVx = Math.cos(angle) * this.speed;
    this.targetVy = Math.sin(angle) * this.speed;
  }

  _checkCollision(level, tileRenderer) {
    if (!level || !tileRenderer) return null;
    const scaledSize = tileRenderer.getScaledTileSize();
    const r = this.radius + (scaledSize / 2) - 5; // mines keep a small distance from walls
    const points = [
      { x: this.x, y: this.y },
      { x: this.x - r, y: this.y },
      { x: this.x + r, y: this.y },
      { x: this.x, y: this.y - r },
      { x: this.x, y: this.y + r },
      { x: this.x - r * 0.7, y: this.y - r * 0.7 },
      { x: this.x + r * 0.7, y: this.y - r * 0.7 },
      { x: this.x - r * 0.7, y: this.y + r * 0.7 },
      { x: this.x + r * 0.7, y: this.y + r * 0.7 },
    ];
    for (const p of points) {
      const tile = tileRenderer.getTileAt(level, p.x, p.y, 'enemy-ship-perimeter');
      if (tileRenderer.isWall(tile)) return { tile, point: p };
    }
    return null;
  }

  // Bounce off wall using the same approach as CollisionDetection.resolveCollision:
  // find the wall tile, compute the normal, push out, and reflect velocity.
  _bounceOffWall(collision, tileRenderer) {
    const scaledSize = tileRenderer.getScaledTileSize();
    const tileX = Math.floor(collision.point.x / scaledSize);
    const tileY = Math.floor(collision.point.y / scaledSize);
    const tileLeft = tileX * scaledSize;
    const tileRight = tileLeft + scaledSize;
    const tileTop = tileY * scaledSize;
    const tileBottom = tileTop + scaledSize;

    // Closest point on the wall tile to the mine center
    const closestX = Math.max(tileLeft, Math.min(this.x, tileRight));
    const closestY = Math.max(tileTop, Math.min(this.y, tileBottom));
    let nx = this.x - closestX;
    let ny = this.y - closestY;
    let dist = Math.hypot(nx, ny);
    const radius = this.radius;
    let overlap = radius - dist;

    if (dist === 0) {
      // Mine center is inside the wall tile; push back opposite to movement
      const v = Math.hypot(this.vx, this.vy);
      if (v > 0.001) {
        nx = -this.vx / v;
        ny = -this.vy / v;
      } else {
        nx = 0;
        ny = -1;
      }
      overlap = radius;
    } else {
      nx /= dist;
      ny /= dist;
    }

    // Push the mine out of the wall
    const push = Math.max(overlap + 0.5, 0.5);
    this.x += nx * push;
    this.y += ny * push;

    // Reflect velocity component heading into the wall
    const dot = this.vx * nx + this.vy * ny;
    if (dot < 0) {
      this.vx -= 2 * dot * nx;
      this.vy -= 2 * dot * ny;
    }

    // Dampen slightly so the bounce doesn't grow out of control
    this.vx *= MINE_BOUNCE_DAMPING;
    this.vy *= MINE_BOUNCE_DAMPING;
  }
}
