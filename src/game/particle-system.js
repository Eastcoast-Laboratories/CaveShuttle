// ParticleSystem - Manages particle effects
import { Particle } from './particle.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this._pool = [];
  }

  // Reuse a dead particle from the pool, or create a new one if pool is empty.
  // This eliminates per-frame `new Particle()` allocations in hot paths like spawnAccelerate.
  _acquire(x, y, vx, vy, color, size, lifetime) {
    const p = this._pool.length > 0 ? this._pool.pop() : new Particle();
    p.reset(x, y, vx, vy, color, size, lifetime);
    return p;
  }

  spawnExplosion(x, y, count = 20, color = '#ff6600') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 4 + 2;
      const lifetime = Math.random() * 30 + 20;
      this.particles.push(this._acquire(x, y, vx, vy, color, size, lifetime));
    }
  }

  spawnPowerupBurst(x, y, color = '#ffd700') {
    // Expanding ring burst — fast outward particles in all directions
    const ringCount = 20;
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      const speed = 4 + Math.random() * 1.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 3 + 2;
      const lifetime = Math.random() * 15 + 15;
      this.particles.push(this._acquire(x, y, vx, vy, color, size, lifetime));
    }
    // Rising sparkles — upward-moving small particles that fade slowly
    const sparkleCount = 15;
    for (let i = 0; i < sparkleCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.6;
      const speed = Math.random() * 2 + 1.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 2 + 1;
      const lifetime = Math.random() * 25 + 25;
      const sparkleColor = Math.random() > 0.5 ? color : '#ffffff';
      this.particles.push(this._acquire(x, y, vx, vy, sparkleColor, size, lifetime));
    }
    // Central flash — a few large particles that shrink rapidly
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 6 + 4;
      const lifetime = Math.random() * 8 + 8;
      this.particles.push(this._acquire(x, y, vx, vy, '#ffffff', size, lifetime));
    }
  }

  spawnAccelerate(x, y, angle, count = 3) {
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      const accelerateAngle = angle + Math.PI + spread;
      const speed = Math.random() * 2 + 1;
      const vx = Math.cos(accelerateAngle) * speed;
      const vy = Math.sin(accelerateAngle) * speed;
      const size = Math.random() * 3 + 1;
      const lifetime = Math.random() * 15 + 10;
      this.particles.push(this._acquire(x, y, vx, vy, '#ff6600', size, lifetime));
    }
  }

  spawnSparks(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 2 + 1;
      const lifetime = Math.random() * 20 + 10;
      this.particles.push(this._acquire(x, y, vx, vy, '#ffff00', size, lifetime));
    }
  }

  update(dt) {
    // In-place compaction: dead particles are returned to the pool for reuse.
    let writeIndex = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      particle.update(dt);
      if (particle.active) {
        this.particles[writeIndex++] = particle;
      } else {
        this._pool.push(particle);
      }
    }
    this.particles.length = writeIndex;
  }

  render(ctx, offsetX, offsetY) {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].render(ctx, offsetX, offsetY);
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    // Return all active particles to the pool instead of discarding them.
    for (let i = 0; i < this.particles.length; i++) {
      this._pool.push(this.particles[i]);
    }
    this.particles.length = 0;
  }
}
