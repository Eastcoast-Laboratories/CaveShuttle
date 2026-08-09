// Slider - Moving platform activated by buttons
export class Slider {
  constructor(x, y, type = '@', direction = 'horizontal') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.direction = direction;
    this.active = false;
    this.targetX = x;
    this.targetY = y;
    this.speed = 1;
    this.moveDistance = 32; // Distance to move when activated
  }

  update(dt) {
    // Move towards target position
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    
    if (Math.abs(dx) > 0.1) {
      this.x += Math.sign(dx) * this.speed * dt;
    }
    if (Math.abs(dy) > 0.1) {
      this.y += Math.sign(dy) * this.speed * dt;
    }
  }

  activate() {
    this.active = true;
    if (this.direction === 'horizontal') {
      this.targetX = this.x + this.moveDistance;
    } else {
      this.targetY = this.y + this.moveDistance;
    }
  }

  deactivate() {
    this.active = false;
    if (this.direction === 'horizontal') {
      this.targetX = this.x - this.moveDistance;
    } else {
      this.targetY = this.y - this.moveDistance;
    }
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }
}
