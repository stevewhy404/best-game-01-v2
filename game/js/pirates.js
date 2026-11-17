class PirateSystem {
  constructor() {
    this.pirates = [];
    this.spawnTimer = 0;
    this.bossSpawned = false;
  }

  update(dt, gameState) {
    this.spawnTimer += dt;
    // Spawn pirates periodically
    if (this.spawnTimer > 20 && this.pirates.length < 5) {
      this.spawnTimer = 0;
      this.spawnPirate(gameState.world);
    }

    // Boss condition: 3 contracts completed or gold >= 5000
    if (!this.bossSpawned && (gameState.trade.contractsCompleted >= 3 || gameState.trade.gold >= 5000)) {
      this.spawnBoss(gameState.world);
      this.bossSpawned = true;
    }

    const player = gameState.ship;
    for (let i = this.pirates.length - 1; i >= 0; i--) {
      const p = this.pirates[i];

      // AI movement: chase player if close
      const dist = Math.hypot(player.x - p.x, player.y - p.y);
      if (dist < 600) {
        const targetAngle = Math.atan2(player.y - p.y, player.x - p.x);
        // Turn towards player
        let angleDiff = targetAngle - p.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        p.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 1.5 * dt);

        p.speed += (p.maxSpeed - p.speed) * dt;

        // Fire cannons if close and cooldown ready
        p.fireTimer = (p.fireTimer || 0) + dt;
        if (dist < 350 && p.fireTimer > 3.0) {
          p.fireTimer = 0;
          gameState.combat.fireCannon(p, player.x, player.y, false, p.isBoss ? 1.5 : 1.0);
        }
      } else {
        p.speed += (80 - p.speed) * dt;
        p.angle += 0.5 * dt;
      }

      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;

      // Check if dead
      if (p.hull <= 0) {
        gameState.combat.createExplosion(p.x, p.y, 'rgba(255, 200, 0, 0.9)');
        gameState.trade.gold += p.isBoss ? 2000 : 150;
        window.soundManager.playCoin();
        this.pirates.splice(i, 1);
      }
    }
  }

  spawnPirate(world) {
    const x = Math.random() * world.WORLD_WIDTH;
    const y = Math.random() * world.WORLD_HEIGHT;
    // ensure not too close to player
    if (window.gameState && Math.hypot(window.gameState.ship.x - x, window.gameState.ship.y - y) < 400) return;

    this.pirates.push({
      x, y,
      angle: Math.random() * Math.PI * 2,
      speed: 100,
      maxSpeed: 120,
      hull: 50,
      maxHull: 50,
      radius: 16,
      isBoss: false
    });
  }

  spawnBoss(world) {
    this.pirates.push({
      x: world.WORLD_WIDTH / 2,
      y: 200,
      angle: Math.PI / 2,
      speed: 80,
      maxSpeed: 100,
      hull: 300,
      maxHull: 300,
      radius: 28,
      isBoss: true
    });
    window.soundManager.playBell();
  }
}

window.PirateSystem = PirateSystem;
