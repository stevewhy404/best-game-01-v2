class ShotManager {
  constructor(gameState) {
    this.gameState = gameState;
  }

  handleShotParam() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (!shot) return false;

    // Deterministic seed if provided
    const seed = Number(params.get('seed') || 42);
    window.rng = new window.SededRandom(seed);

    // Setup scene based on shot type
    if (shot === 'title') {
      this.gameState.showTitle();
    } else if (shot === 'play' || shot === 'battle') {
      this.gameState.startGame();
      // Spawn a pirate near player for battle shot
      this.gameState.pirates.pirates.push({
        x: this.gameState.ship.x + 150,
        y: this.gameState.ship.y - 100,
        angle: Math.PI,
        speed: 100,
        maxSpeed: 120,
        hull: 40,
        maxHull: 50,
        radius: 16,
        isBoss: false
      });
      // Fire a cannonball
      this.gameState.combat.fireCannon(this.gameState.ship, this.gameState.ship.x + 200, this.gameState.ship.y - 120, true, 1.0);
      this.gameState.state = 'play';
      document.getElementById('title-screen').classList.add('hidden');
      document.getElementById('hud').classList.remove('hidden');
    } else if (shot === 'trade') {
      this.gameState.startGame();
      const port = this.gameState.world.ports[0];
      this.gameState.ship.x = port.x - 30;
      this.gameState.ship.y = port.y;
      this.gameState.ui.openTrade(port);
    } else if (shot === 'victory') {
      this.gameState.trade.gold = 10500;
      this.gameState.showVictory();
    }

    // Render once and mark ready
    setTimeout(() => {
      this.gameState.render();
      window.__shotReady = true;
      console.log('__shotReady = true for shot:', shot);
    }, 200);

    return true;
  }
}

window.ShotManager = ShotManager;
