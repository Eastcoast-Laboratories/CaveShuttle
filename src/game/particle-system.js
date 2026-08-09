// ParticleSystem - Manages particle effects
import { Particle } from './particle.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnExplosion(x, y, count = 20, color = '#ff6600') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 4 + 2;
      const lifetime = Math.random() * 30 + 20;
      this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
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
      this.particles.push(new Particle(x, y, vx, vy, '#ff6600', size, lifetime));
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
      this.particles.push(new Particle(x, y, vx, vy, '#ffff00', size, lifetime));
    }
  }

  update(dt) {
    this.particles.forEach(particle => particle.update(dt));
    this.particles = this.particles.filter(p => p.active);
  }

  render(ctx, offsetX, offsetY) {
    this.particles.forEach(particle => particle.render(ctx, offsetX, offsetY));
  }

  clear() {
    this.particles = [];
  }
}
