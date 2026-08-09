// Particle - Visual effect for explosions, acceleration, sparks
export class Particle {
  constructor(x, y, vx, vy, color, size, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.age = 0;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    if (this.age >= this.lifetime) {
      this.active = false;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // Apply gravity
    this.vy += 0.05 * dt;
    
    // Apply friction
    this.vx *= 0.99;
    this.vy *= 0.99;
  }

  render(ctx, offsetX, offsetY) {
    if (!this.active) return;

    const alpha = 1 - (this.age / this.lifetime);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x - offsetX, this.y - offsetY, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  deactivate() {
    this.active = false;
  }
}
