class WeatherSystem {
  constructor() {
    this.windAngle = Math.PI * 0.25; // Direction wind is blowing TOWARDS
    this.windSpeed = 2.0; // multiplier
    this.windTimer = 0;
    this.dayTime = 0; // 0 to 1 (0 = dawn, 0.5 = dusk/night)
    this.dayDuration = 180; // seconds per full day/night cycle
    this.storms = [
      { x: 1200, y: 900, vx: 20, vy: 15, radius: 250 },
      { x: 2000, y: 1500, vx: -15, vy: 20, radius: 300 }
    ];
  }

  update(dt, worldWidth, worldHeight) {
    this.windTimer += dt;
    if (this.windTimer > 15) {
      this.windTimer = 0;
      this.windAngle += (Math.random() - 0.5) * 0.8;
      this.windSpeed = 1.2 + Math.random() * 1.8;
    }

    this.dayTime = (this.dayTime + dt / this.dayDuration) % 1;

    // Move storms
    for (const storm of this.storms) {
      storm.x += storm.vx * dt;
      storm.y += storm.vy * dt;
      if (storm.x < 0 || storm.x > worldWidth) storm.vx *= -1;
      if (storm.y < 0 || storm.y > worldHeight) storm.vy *= -1;
    }
  }

  getWindDirName() {
    const deg = (this.windAngle * 180 / Math.PI + 360) % 360;
    if (deg > 337.5 || deg <= 22.5) return 'N';
    if (deg > 22.5 && deg <= 67.5) return 'NE';
    if (deg > 67.5 && deg <= 112.5) return 'E';
    if (deg > 112.5 && deg <= 157.5) return 'SE';
    if (deg > 157.5 && deg <= 202.5) return 'S';
    if (deg > 202.5 && deg <= 247.5) return 'SW';
    if (deg > 247.5 && deg <= 292.5) return 'W';
    return 'NW';
  }

  getStormAt(x, y) {
    for (const storm of this.storms) {
      if (Math.hypot(storm.x - x, storm.y - y) < storm.radius) return storm;
    }
    return null;
  }
}

window.WeatherSystem = WeatherSystem;
