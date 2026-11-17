class Ship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0; // facing angle
    this.speed = 0;
    this.maxSpeed = 160;
    this.turnSpeed = 2.2;
    this.sailsState = 1; // 0 = dropped/stopped, 1 = half, 2 = full
    this.maxHull = 100;
    this.hull = 100;
    this.radius = 18;
    this.wakeTimer = 0;
  }

  update(dt, input, world, weather) {
    // Sails control (W/S or Up/Down)
    if (input.keys['KeyW'] || input.keys['ArrowUp']) {
      this.sailsState = Math.min(2, this.sailsState + dt * 1.5);
    }
    if (input.keys['KeyS'] || input.keys['ArrowDown']) {
      this.sailsState = Math.max(0, this.sailsState - dt * 1.5);
    }

    // Steering (A/D or Left/Right)
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) {
      this.angle -= this.turnSpeed * dt * (this.speed / this.maxSpeed + 0.3);
    }
    if (input.keys['KeyD'] || input.keys['ArrowRight']) {
      this.angle += this.turnSpeed * dt * (this.speed / this.maxSpeed + 0.3);
    }

    // Wind effect calculation
    // angle between ship heading and wind angle
    const windAngleDiff = Math.abs(Math.atan2(Math.sin(weather.windAngle - this.angle), Math.cos(weather.windAngle - this.angle)));
    // Sailing downwind (angleDiff near 0) is fast; sailing into wind (angleDiff near PI) is slow
    const windFactor = Math.cos(windAngleDiff) * 0.5 + 0.75; // 0.25 to 1.25

    let targetSpeed = (this.sailsState / 2) * this.maxSpeed * weather.windSpeed * windFactor;

    // Upgrades boost speed
    // swift sails upgrade
    const tradeSys = window.gameState?.trade;
    if (tradeSys && tradeSys.upgrades.sails > 0) {
      targetSpeed *= (1 + tradeSys.upgrades.sails * 0.25);
    }

    // Shallows slow down
    if (world.isShallow(this.x, this.y)) {
      targetSpeed *= 0.6;
    }

    // Smooth speed change
    this.speed += (targetSpeed - this.speed) * dt * 2.0;

    // Move
    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;

    const nextX = this.x + vx * dt;
    const nextY = this.y + vy * dt;

    // Collision check with world (islands/rocks)
    const collision = world.checkCollision(nextX, nextY, this.radius);
    if (!collision) {
      this.x = nextX;
      this.y = nextY;
    } else {
      // Hit obstacle
      this.speed *= -0.3;
      this.hull -= 10;
      window.soundManager.playThud();
    }

    // Clamp to world bounds
    this.x = Math.max(50, Math.min(world.WORLD_WIDTH - 50, this.x));
    this.y = Math.max(50, Math.min(world.WORLD_HEIGHT - 50, this.y));

    // Wake particles
    if (this.speed > 20) {
      this.wakeTimer += dt;
      if (this.wakeTimer > 0.15) {
        this.wakeTimer = 0;
        if (window.gameState && window.gameState.particles) {
          window.gameState.particles.push({
            x: this.x - Math.cos(this.angle) * 15,
            y: this.y - Math.sin(this.angle) * 15,
            vx: -Math.cos(this.angle) * 10 + (Math.random() - 0.5) * 10,
            vy: -Math.sin(this.angle) * 10 + (Math.random() - 0.5) * 10,
            life: 1.0,
            maxLife: 1.0,
            size: 6,
            color: 'rgba(255, 255, 255, 0.6)'
          });
        }
      }
    }
  }
}

window.Ship = Ship;
