// Bunker - Enemy that shoots at the ship
export class Bunker {
  constructor(x, y, type = 'P') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.shootCooldown = 0;
    this.shootInterval = 120; // Frames between shots (2 seconds at 60fps)
    this.active = true;
  }

  update(dt, shipX, shipY) {
    if (!this.active) return;

    // Update cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    // Check if should shoot
    if (this.shootCooldown <= 0) {
      this.shootCooldown = this.shootInterval;
      return this.shouldShoot(shipX, shipY);
    }

    return null;
  }

  shouldShoot(shipX, shipY) {
    // Calculate angle to ship
    const dx = shipX - this.x;
    const dy = shipY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only shoot if ship is within range
    if (distance > 300) return null;

    // Calculate angle
    const angle = Math.atan2(dy, dx);
    
    return { angle, speed: 3 };
  }
}
