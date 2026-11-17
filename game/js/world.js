class World {
  constructor() {
    this.ports = [
      { id: 'alba', name: 'Port Alba', x: 600, y: 500, desc: 'The bustling trade capital of the Sapphire Coast.', prices: { Spice: 35, Silk: 85, Rum: 22, Pearls: 160 } },
      { id: 'coral', name: 'Coral Bay', x: 2600, y: 600, desc: 'Warm lagoons rich in pearls and exotic spices.', prices: { Spice: 25, Silk: 90, Rum: 30, Pearls: 120 } },
      { id: 'ember', name: 'Ember Isle', x: 2500, y: 1900, desc: 'Volcanic port known for fine spiced rum and iron.', prices: { Spice: 50, Silk: 70, Rum: 18, Pearls: 170 } },
      { id: 'mistral', name: 'Mistral Rock', x: 700, y: 1800, desc: 'Windy cliffs where silk weavers craft masterpieces.', prices: { Spice: 45, Silk: 60, Rum: 28, Pearls: 155 } },
      { id: 'pearl', name: 'Pearl Haven', x: 1600, y: 1200, desc: 'Central hub of merchants and mariners.', prices: { Spice: 40, Silk: 80, Rum: 25, Pearls: 140 } }
    ];

    this.islands = [
      { x: 600, y: 500, radius: 140 },
      { x: 2600, y: 600, radius: 160 },
      { x: 2500, y: 1900, radius: 150 },
      { x: 700, y: 1800, radius: 150 },
      { x: 1600, y: 1200, radius: 130 },
      // Minor islands / rocks
      { x: 1600, y: 500, radius: 90 },
      { x: 1600, y: 1900, radius: 90 },
      { x: 600, y: 1200, radius: 90 },
      { x: 2600, y: 1200, radius: 90 }
    ];

    this.rocks = [
      { x: 800, y: 650, radius: 35 },
      { x: 450, y: 400, radius: 30 },
      { x: 2400, y: 750, radius: 40 },
      { x: 2750, y: 450, radius: 30 },
      { x: 2350, y: 1750, radius: 35 },
      { x: 2650, y: 2050, radius: 40 },
      { x: 550, y: 1650, radius: 35 },
      { x: 850, y: 1950, radius: 30 },
      { x: 1450, y: 1100, radius: 25 },
      { x: 1750, y: 1300, radius: 25 }
    ];

    this.shallows = [
      { x: 600, y: 500, radius: 220 },
      { x: 2600, y: 600, radius: 240 },
      { x: 2500, y: 1900, radius: 230 },
      { x: 700, y: 1800, radius: 230 },
      { x: 1600, y: 1200, radius: 200 }
    ];
  }

  getPortAt(x, y, range = 120) {
    for (const port of this.ports) {
      const dist = Math.hypot(port.x - x, port.y - y);
      if (dist <= range) return port;
    }
    return null;
  }

  checkCollision(x, y, radius = 15) {
    // Check islands
    for (const isl of this.islands) {
      if (Math.hypot(isl.x - x, isl.y - y) < isl.radius + radius) return 'island';
    }
    // Check rocks
    for (const rock of this.rocks) {
      if (Math.hypot(rock.x - x, rock.y - y) < rock.radius + radius) return 'rock';
    }
    return null;
  }

  isShallow(x, y) {
    for (const shal of this.shallows) {
      if (Math.hypot(shal.x - x, shal.y - y) < shal.radius) return true;
    }
    return false;
  }
}

window.World = World;
