// TIDEBOUND: Captain of the Sapphire Coast — boot, game loop, state machine, input.
// Hand-written to complete the build while the recorded builder session is down on
// a daily API quota (see repo notes). The recorded session wrote every other file;
// this file wires them together. It also carries two small integration patches:
//   1. World instances have no WORLD_WIDTH/HEIGHT (CONFIG does) — set here.
//   2. render.js iterates `for (const p of pirates)` where pirates is the
//      PirateSystem object, not the array — make the system iterable here.
// The game loop honours gameState.hitStop (brief freeze) and gameState.timeScale
// (slow-mo) so juice effects are one-line sets from anywhere in the code.

(function () {
  'use strict';

  var CFG = window.CONFIG;
  var canvas = document.getElementById('game-canvas');

  // ---- integration patch: PirateSystem is iterable over its live pirates ----
  if (window.PirateSystem && !window.PirateSystem.prototype[Symbol.iterator]) {
    window.PirateSystem.prototype[Symbol.iterator] = function *() {
      yield* this.pirates;
    };
  }

  // ---- input ----
  var input = { keys: {}, mouseX: 640, mouseY: 360, mouseDown: false };
  window.addEventListener('keydown', function (e) {
    input.keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) >= 0) {
      e.preventDefault();
    }
    handleKeyPress(e.code);
  });
  window.addEventListener('keyup', function (e) { input.keys[e.code] = false; });
  canvas.addEventListener('mousemove', function (e) {
    var r = canvas.getBoundingClientRect();
    input.mouseX = e.clientX - r.left;
    input.mouseY = e.clientY - r.top;
  });
  canvas.addEventListener('mousedown', function (e) {
    var r = canvas.getBoundingClientRect();
    input.mouseX = e.clientX - r.left;
    input.mouseY = e.clientY - r.top;
    input.mouseDown = true;
    tryFire();
  });
  window.addEventListener('mouseup', function () { input.mouseDown = false; });

  // ---- game state ----
  var gameState = {
    state: 'title', // title | play | trade | pause | victory | gameover
    world: null,
    weather: null,
    trade: null,
    ship: null,
    combat: null,
    pirates: null,
    renderer: null,
    ui: null,
    shots: null,
    particles: [],
    floatingTexts: [],
    hitStop: 0,
    timeScale: 1,
    slowMoTimer: 0,
    flashWhite: 0,
    fireCooldown: 0,
    elapsed: 0,
    stats: { sunk: 0, contractsDone: 0, shotsFired: 0 },
    prevPirateCount: 0
  };

  // Spawn helpers ------------------------------------------------------------
  function spawnParticles(x, y, opts) {
    opts = opts || {};
    var count = opts.count || 10;
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = (opts.speed || 80) * (0.4 + Math.random() * 0.8);
      gameState.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: opts.life || 0.6, maxLife: opts.life || 0.6,
        size: opts.size || 4, color: opts.color || '#ffd98a'
      });
    }
  }
  gameState.spawnParticles = spawnParticles;
  gameState.fx = gameState.particles; // alias for juice snippets

  function spawnText(x, y, text, color) {
    gameState.floatingTexts.push({ x: x, y: y, text: text, color: color || '#fff', life: 1.0, maxLife: 1.0 });
  }
  gameState.spawnText = spawnText;

  // State transitions ----------------------------------------------------------
  function showOnly(screenId) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.add('hidden'); });
    document.getElementById('trade-overlay').classList.add('hidden');
    if (screenId) document.getElementById(screenId).classList.remove('hidden');
  }

  gameState.showTitle = function () {
    gameState.state = 'title';
    showOnly('title-screen');
    document.getElementById('hud').classList.add('hidden');
    gameState.ui.updateHUD();
  };

  gameState.startGame = function () {
    gameState.world = new window.World();
    // Integration patch 1: World has no dimensions; CONFIG does.
    gameState.world.WORLD_WIDTH = CFG.WORLD_WIDTH;
    gameState.world.WORLD_HEIGHT = CFG.WORLD_HEIGHT;
    gameState.weather = new window.WeatherSystem();
    gameState.trade = new window.TradeSystem();
    gameState.ship = new window.Ship(1600, 1450);
    gameState.combat = new window.CombatSystem();
    gameState.pirates = new window.PirateSystem();
    gameState.particles = [];
    gameState.floatingTexts = [];
    gameState.hitStop = 0;
    gameState.timeScale = 1;
    gameState.slowMoTimer = 0;
    gameState.flashWhite = 0;
    gameState.fireCooldown = 0;
    gameState.elapsed = 0;
    gameState.stats = { sunk: 0, contractsDone: 0, shotsFired: 0 };
    gameState.prevPirateCount = 0;
    gameState.trade.generateContracts(gameState.world.ports);
    // Opening action: two pirates already on the hunt so the first 30s are fun.
    gameState.pirates.spawnPirate(gameState.world);
    gameState.pirates.spawnPirate(gameState.world);
    gameState.state = 'play';
    showOnly(null);
    document.getElementById('hud').classList.remove('hidden');
    gameState.ui.updateHUD();
  };

  gameState.pauseGame = function () {
    if (gameState.state !== 'play') return;
    gameState.state = 'pause';
    showOnly('pause-screen');
  };

  gameState.resumeGame = function () {
    if (gameState.state !== 'pause') return;
    gameState.state = 'play';
    showOnly(null);
    document.getElementById('hud').classList.remove('hidden');
  };

  gameState.showVictory = function () {
    gameState.state = 'victory';
    var s = gameState.stats;
    var best = Math.max(gameState.trade.gold, Number(localStorage.getItem('tidebound_best_gold') || 0));
    localStorage.setItem('tidebound_best_gold', String(Math.floor(best)));
    document.getElementById('victory-stats').innerHTML =
      '<p>Final Gold: <strong>' + Math.floor(gameState.trade.gold) + ' G</strong></p>' +
      '<p>Pirates sunk: <strong>' + s.sunk + '</strong></p>' +
      '<p>Contracts completed: <strong>' + gameState.trade.contractsCompleted + '</strong></p>' +
      '<p>Days at sea: <strong>' + (Math.floor(gameState.weather.dayTime * 10) + 1) + '</strong></p>';
    showOnly('victory-screen');
    document.getElementById('hud').classList.add('hidden');
    window.soundManager.playVictory();
  };

  gameState.showGameOver = function () {
    gameState.state = 'gameover';
    var s = gameState.stats;
    var best = Math.max(gameState.trade.gold, Number(localStorage.getItem('tidebound_best_gold') || 0));
    localStorage.setItem('tidebound_best_gold', String(Math.floor(best)));
    document.getElementById('gameover-stats').innerHTML =
      '<p>Gold earned: <strong>' + Math.floor(gameState.trade.gold) + ' G</strong></p>' +
      '<p>Pirates sunk: <strong>' + s.sunk + '</strong></p>' +
      '<p>Contracts completed: <strong>' + gameState.trade.contractsCompleted + '</strong></p>' +
      '<p>Best gold: <strong>' + Math.floor(best) + ' G</strong></p>';
    showOnly('gameover-screen');
    document.getElementById('hud').classList.add('hidden');
  };

  gameState.render = function () {
    gameState.renderer.render(gameState);
    // White telegraph flash (boss warning) drawn over the scene.
    if (gameState.flashWhite > 0) {
      var ctx = gameState.renderer.ctx;
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.6, gameState.flashWhite * 4) + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    // Floating combat text.
    var ctx2 = gameState.renderer.ctx;
    ctx2.save();
    var camX = gameState.ship.x - canvas.width / 2;
    var camY = gameState.ship.y - canvas.height / 2;
    ctx2.translate(-camX, -camY);
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    for (var i = 0; i < gameState.floatingTexts.length; i++) {
      var t = gameState.floatingTexts[i];
      ctx2.fillStyle = t.color;
      ctx2.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx2.fillText(t.text, t.x, t.y);
    }
    ctx2.restore();
    if (gameState.state === 'play' || gameState.state === 'trade') gameState.ui.updateHUD();
  };

  // ---- combat helpers ----
  function tryFire() {
    if (gameState.state !== 'play' || gameState.fireCooldown > 0) return;
    var ship = gameState.ship;
    // Mouse position in world coordinates (camera is centred on the ship).
    var wx = input.mouseX + ship.x - canvas.width / 2;
    var wy = input.mouseY + ship.y - canvas.height / 2;
    var lvl = gameState.trade.upgrades.cannons;
    gameState.combat.fireCannon(ship, wx, wy, true, 1 + 0.3 * lvl);
    gameState.fireCooldown = Math.max(0.3, 0.6 - 0.1 * lvl);
    gameState.stats.shotsFired++;
  }

  function handleKeyPress(code) {
    if (code === 'KeyM') { window.soundManager.toggleMute(); return; }
    if (code === 'Space') { tryFire(); return; }
    if (code === 'KeyP' || code === 'Escape') {
      if (gameState.state === 'play') gameState.pauseGame();
      else if (gameState.state === 'pause') gameState.resumeGame();
      return;
    }
    if (code === 'KeyR' && (gameState.state === 'victory' || gameState.state === 'gameover')) {
      gameState.startGame();
      return;
    }
    if (code === 'KeyE' && gameState.state === 'play') {
      var port = gameState.world.getPortAt(gameState.ship.x, gameState.ship.y, 200);
      if (port) {
        window.soundManager.playBell();
        gameState.ui.openTrade(port);
      }
      return;
    }
  }

  // ---- per-frame update ----
  function update(dt) {
    // Hit-stop freezes the world briefly (juice); the scene still renders.
    if (gameState.hitStop > 0) { gameState.hitStop -= dt; return; }

    // Slow-mo timer.
    if (gameState.slowMoTimer > 0) {
      gameState.slowMoTimer -= dt;
      gameState.timeScale = 0.3;
      if (gameState.slowMoTimer <= 0) gameState.timeScale = 1;
    }
    if (gameState.flashWhite > 0) gameState.flashWhite -= dt;
    var sdt = dt * gameState.timeScale;

    if (gameState.state === 'title') {
      gameState.weather.update(sdt, CFG.WORLD_WIDTH, CFG.WORLD_HEIGHT);
      return;
    }
    if (gameState.state !== 'play') return;

    gameState.elapsed += sdt;
    gameState.fireCooldown = Math.max(0, gameState.fireCooldown - sdt);

    // Hold-to-fire with Space.
    if (input.keys['Space']) tryFire();

    // Keep max hull in sync with the Sturdy Hull upgrade.
    var hullLvl = gameState.trade.upgrades.hull;
    gameState.ship.maxHull = 100 + 40 * hullLvl;

    gameState.weather.update(sdt, CFG.WORLD_WIDTH, CFG.WORLD_HEIGHT);
    gameState.ship.update(sdt, input, gameState.world, gameState.weather);

    // Storm damage + push.
    var storm = gameState.weather.getStormAt(gameState.ship.x, gameState.ship.y);
    if (storm) {
      gameState.ship.hull -= 6 * sdt;
      gameState.ship.x += (storm.vx || 0) * sdt * 0.5;
      gameState.ship.y += (storm.vy || 0) * sdt * 0.5;
      if (Math.random() < sdt * 2) window.soundManager.playSplash();
    }

    var before = gameState.pirates.pirates.length;
    gameState.pirates.update(sdt, gameState);
    gameState.combat.update(sdt, gameState);

    // Track sinks (pirates removed by pirates.update on death).
    var sunk = before - gameState.pirates.pirates.length;
    if (sunk > 0) {
      gameState.stats.sunk += sunk;
      gameState.hitStop = Math.max(gameState.hitStop, 0.02); // kill hit-stop
      for (var i = 0; i < sunk; i++) {
        spawnParticles(gameState.ship.x, gameState.ship.y, { count: 6, color: '#ffd23e', speed: 120, life: 0.4, size: 3 });
      }
    }
    // Area-clear slow-mo: the sea just went quiet after a fight.
    if (gameState.prevPirateCount > 0 && gameState.pirates.pirates.length === 0) {
      gameState.slowMoTimer = 0.6;
      spawnParticles(gameState.ship.x, gameState.ship.y, { count: 16, color: '#ffd98a', speed: 200, life: 0.5, size: 4 });
      spawnText(gameState.ship.x, gameState.ship.y - 40, 'SEAS CLEAR!', '#ffd98a');
    }
    gameState.prevPirateCount = gameState.pirates.pirates.length;

    // Particles.
    for (var j = gameState.particles.length - 1; j >= 0; j--) {
      var p = gameState.particles[j];
      p.x += p.vx * sdt; p.y += p.vy * sdt; p.life -= sdt;
      if (p.life <= 0) gameState.particles.splice(j, 1);
    }
    for (var k = gameState.floatingTexts.length - 1; k >= 0; k--) {
      var t = gameState.floatingTexts[k];
      t.y -= 30 * sdt; t.life -= sdt;
      if (t.life <= 0) gameState.floatingTexts.splice(k, 1);
    }

    // Win / lose.
    if (gameState.trade.gold >= 10000) { gameState.showVictory(); return; }
    if (gameState.ship.hull <= 0) { gameState.showGameOver(); return; }
  }

  // ---- boot ----
  gameState.renderer = new window.Renderer(canvas);
  gameState.ui = new window.UIManager(gameState);
  window.uiManager = gameState.ui;
  gameState.shots = new window.ShotManager(gameState);
  window.gameState = gameState;
  window.__tidebound = gameState;

  // A world exists behind the title screen so the first render never crashes.
  gameState.world = new window.World();
  gameState.world.WORLD_WIDTH = CFG.WORLD_WIDTH;
  gameState.world.WORLD_HEIGHT = CFG.WORLD_HEIGHT;
  gameState.weather = new window.WeatherSystem();
  gameState.trade = new window.TradeSystem();
  gameState.ship = new window.Ship(1600, 1450);
  gameState.combat = new window.CombatSystem();
  gameState.pirates = new window.PirateSystem();

  var shotMode = gameState.shots.handleShotParam();
  if (!shotMode) gameState.showTitle();

  var last = performance.now();
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    try {
      update(dt);
      gameState.render();
    } catch (err) {
      console.error('TIDEBOUND loop error:', err);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
