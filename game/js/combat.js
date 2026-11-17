class CombatSystem {
  constructor() {
    this.cannonballs = [];
  }

  fireCannon(ship, targetX, targetY, isPlayer = true, damageMultiplier = 1) {
    const speed = 500;
    const angle = Math.atan2(targetY - ship.y, targetX - ship.x);
    
    // Fire left and right broadside or toward target based on ship angle/offset
    this.cannonballs.push({
      x: ship.x,
      y: ship.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.2, // seconds max flight
      isPlayer,
      damage: 25 * damageMultiplier
    });

    window.soundManager.playCannon();
  }

  update(dt, gameState) {
    for (let i = this.cannonballs.length - 1; i >= 0; i--) {
      const cb = this.cannonballs[i];
      cb.x += cb.vx * dt;
      cb.y += cb.vy * dt;
      cb.life -= dt;

      if (cb.life <= 0) {
        this.cannonballs.splice(i, 1);
        continue;
      }

      // Check collision with world
      if (gameState.world.checkCollision(cb.x, cb.y, 5)) {
        this.createExplosion(cb.x, cb.y, 'rgba(200, 200, 200, 0.7)');
        this.cannonballs.splice(i, 1);
        continue;
      }

      if (cb.isPlayer) {
        // Check hits on pirates
        let hitPirate = false;
        for (const pirate of gameState.pirates.pirates) {
          if (Math.hypot(pirate.x - cb.x, pirate.y - cb.y) < pirate.radius + 5) {
            pirate.hull -= cb.damage;
            hitPirate = true;
            this.createExplosion(cb.x, cb.y, 'rgba(255, 128, 0, 0.8)');
            window.soundManager.playThud();
            break;
          }
        }
        if (hitPirate) {
          this.cannonballs.splice(i, 1);
          continue;
        }
      } else {
        // Check hit on player ship
        const player = gameState.ship;
        if (Math.hypot(player.x - cb.x, player.y - cb.y) < player.radius + 5) {
          player.hull -= cb.damage;
          this.createExplosion(cb.x, cb.y, 'rgba(255, 50, 50, 0.9)');
          window.soundManager.playThud();
          this.cannonballs.splice(i, 1);
          continue;
        }
      }
    }
  }

  createExplosion(x, y, color) {
    if (!window.gameState || !window.gameState.particles) return;
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      window.gameState.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6,
        maxLife: 0.6,
        size: 4 + Math.random() * 6,
        color
      });
    }
  }
}

window.CombatSystem = CombatSystem;
