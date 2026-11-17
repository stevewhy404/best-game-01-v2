class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.miniCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
  }

  render(gameState) {
    const ctx = this.ctx;
    const { ship, world, weather, combat, pirates, particles } = gameState;

    ctx.save();
    // Camera transform centered on player ship
    const camX = ship.x - this.canvas.width / 2;
    const camY = ship.y - this.canvas.height / 2;

    // Day/Night tint
    const dayTime = weather.dayTime;
    let oceanColor = '#15315e';
    if (dayTime > 0.4 && dayTime < 0.6) oceanColor = '#0d1b33'; // night
    else if (dayTime >= 0.6 && dayTime < 0.7) oceanColor = '#2b213a'; // dawn

    ctx.fillStyle = oceanColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-camX, -camY);

    // Render Shallows
    for (const shal of world.shallows) {
      ctx.fillStyle = 'rgba(30, 90, 140, 0.3)';
      ctx.beginPath();
      ctx.arc(shal.x, shal.y, shal.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Islands
    for (const isl of world.islands) {
      ctx.fillStyle = '#2c5e3b';
      ctx.beginPath();
      ctx.arc(isl.x, isl.y, isl.radius, 0, Math.PI * 2);
      ctx.fill();

      // Island beach ring
      ctx.strokeStyle = '#c2b280';
      ctx.lineWidth = 12;
      ctx.stroke();
    }

    // Render Rocks
    for (const rock of world.rocks) {
      ctx.fillStyle = '#555555';
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Render Ports
    for (const port of world.ports) {
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(port.x, port.y, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(port.name, port.x, port.y - 35);
    }

    // Render Storms
    for (const storm of weather.storms) {
      ctx.fillStyle = 'rgba(50, 50, 70, 0.4)';
      ctx.beginPath();
      ctx.arc(storm.x, storm.y, storm.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Particles & Wake
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Pirates
    for (const p of pirates) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.isBoss ? '#111' : '#8b0000';
      ctx.beginPath();
      ctx.moveTo(p.radius, 0);
      ctx.lineTo(-p.radius, -p.radius * 0.7);
      ctx.lineTo(-p.radius * 0.6, 0);
      ctx.lineTo(-p.radius, p.radius * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Health bar
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(p.x - 20, p.y - p.radius - 12, 40, 6);
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(p.x - 20, p.y - p.radius - 12, 40 * (p.hull / p.maxHull), 6);
    }

    // Render Player Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Hull
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.moveTo(ship.radius + 4, 0);
    ctx.lineTo(-ship.radius, -ship.radius * 0.6);
    ctx.lineTo(-ship.radius * 0.7, 0);
    ctx.lineTo(-ship.radius, ship.radius * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3d2314';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sails
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(-6, -12, 12, 24);
    ctx.restore();

    // Render Cannonballs
    for (const cb of combat.cannonballs) {
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(cb.x, cb.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // restore camera transform

    // Render Minimap
    this.renderMinimap(gameState);

    ctx.restore();
  }

  renderMinimap(gameState) {
    const ctx = this.miniCtx;
    if (!ctx) return;
    const { ship, world, pirates } = gameState;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, w, h);

    const scaleX = w / world.WORLD_WIDTH;
    const scaleY = h / world.WORLD_HEIGHT;

    // Islands on minimap
    for (const isl of world.islands) {
      ctx.fillStyle = '#2c5e3b';
      ctx.beginPath();
      ctx.arc(isl.x * scaleX, isl.y * scaleY, isl.radius * scaleX, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ports on minimap
    for (const port of world.ports) {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(port.x * scaleX - 3, port.y * scaleY - 3, 6, 6);
    }

    // Pirates on minimap
    for (const p of pirates) {
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(p.x * scaleX - 2, p.y * scaleY - 2, 4, 4);
    }

    // Player on minimap
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(ship.x * scaleX, ship.y * scaleY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.Renderer = Renderer;
