// Ship class for player ship
import { GRAVITY, ROTATION_SPEED, FUEL_CONSUMPTION, FRICTION, ACCELERATE_POWER, FUEL_MAX } from '../core/constants.js';

export class Ship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0; // radians
    this.rotation = 0; // degrees
    this.accelerate = 0;
    this.fuel = FUEL_MAX;
  }

  update(dt, gravity = GRAVITY, gravityMultiplier = 1.0) {
    // Apply gravity (10% stronger, multiplied by difficulty multiplier)
    this.vy += gravity * gravityMultiplier * dt;

    // Apply acceleration
    if (this.accelerate > 0) {
      const acceleratePower = ACCELERATE_POWER * dt;
      this.vx += Math.sin(this.angle) * acceleratePower;
      this.vy -= Math.cos(this.angle) * acceleratePower;
      this.fuel -= FUEL_CONSUMPTION * dt;
    }

    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Friction
    this.vx *= Math.pow(FRICTION, dt);
    this.vy *= Math.pow(FRICTION, dt);

    // Clamp fuel
    if (this.fuel < 0) this.fuel = 0;
  }

  rotateLeft(dt = 1) {
    this.angle -= ROTATION_SPEED * dt;
    this.rotation = (this.angle * 180 / Math.PI) % 360;
  }

  rotateRight(dt = 1) {
    this.angle += ROTATION_SPEED * dt;
    this.rotation = (this.angle * 180 / Math.PI) % 360;
  }

  setAngle(angle) {
    this.angle = angle;
    this.rotation = (angle * 180 / Math.PI) % 360;
  }

  setAccelerate(accelerating) {
    this.accelerate = accelerating ? 1 : 0;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setVelocity(vx, vy) {
    this.vx = vx;
    this.vy = vy;
  }
}
