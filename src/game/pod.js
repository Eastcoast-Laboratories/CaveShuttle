// Pod - The fuel canister that the ship must tow to the restart point
import { POD_MASS_FACTOR, POD_GRAVITY, POD_TETHER_LENGTH, POD_TETHER_STIFFNESS, POD_TETHER_DAMPING, POD_THRUST, FRICTION, POD_FUEL_CONSUMPTION } from '../core/constants.js';

export class Pod {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0; // radians
    this.rotation = 0; // degrees
    this.accelerate = 0;
    this.towed = false;
    this.active = true;
    this.onHolder = true; // Pod sits safely on its holder: no gravity, immune to enemy fire
    this.mass = POD_MASS_FACTOR; // Pod is much heavier than the ship
    this.towingDistance = POD_TETHER_LENGTH;
  }

  update(dt, gravity = POD_GRAVITY) {
    if (!this.active) return;

    // While on the holder the pod is locked in place (no gravity, no drift)
    if (this.onHolder) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    // Gravity always applies once the pod has left the holder (towed or free-falling).
    // The tow tether forces are applied separately (see applyTether) before this update.
    this.vy += gravity * dt;

    if (this.accelerate > 0) {
      this.vx += Math.sin(this.angle) * POD_THRUST * dt;
      this.vy -= Math.cos(this.angle) * POD_THRUST * dt;
    }

    this.vx *= Math.pow(FRICTION, dt);
    this.vy *= Math.pow(FRICTION, dt);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setVelocity(vx, vy) {
    this.vx = vx;
    this.vy = vy;
  }

  setAngle(angle) {
    this.angle = angle;
    this.rotation = (angle * 180 / Math.PI) % 360;
  }

  setAccelerate(accelerating) {
    this.accelerate = accelerating ? 1 : 0;
  }

  // Set the towed state. Towing also implies the pod has left the holder.
  setTowing(towing) {
    this.towed = towing;
    if (towing) this.onHolder = false;
  }

  // Physically-correct tow: a spring-damper tether connects ship and pod.
  // Forces are applied to BOTH bodies scaled by their mass, so the combined
  // system swings around its center of mass (which sits closer to the heavier pod).
  applyTether(ship, dt) {
    const dx = this.x - ship.x;
    const dy = this.y - ship.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const nx = dx / dist;
    const ny = dy / dist;

    // Spring force proportional to how far the tether is stretched/compressed
    const stretch = dist - POD_TETHER_LENGTH;
    let fx = -nx * stretch * POD_TETHER_STIFFNESS;
    let fy = -ny * stretch * POD_TETHER_STIFFNESS;

    // Damping along the tether using relative velocity
    const rvx = this.vx - ship.vx;
    const rvy = this.vy - ship.vy;
    const relAlong = rvx * nx + rvy * ny;
    fx -= nx * relAlong * POD_TETHER_DAMPING;
    fy -= ny * relAlong * POD_TETHER_DAMPING;

    // Apply acceleration = force / mass. Pod is heavier -> moves less for the same force.
    this.vx += (fx / this.mass) * dt;
    this.vy += (fy / this.mass) * dt;
    // Reaction force on the ship (ship mass = 1)
    ship.vx -= fx * dt;
    ship.vy -= fy * dt;
  }

  getTowPosition(ship, angle) {
    const distance = this.towingDistance;
    const behindX = ship.x - Math.sin(angle) * distance;
    const behindY = ship.y + Math.cos(angle) * distance;
    return { x: behindX, y: behindY };
  }

  moveToTowPosition(targetX, targetY, strength = 0.1) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    this.x += dx * strength;
    this.y += dy * strength;
  }
}
