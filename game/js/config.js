window.CONFIG = {
  WORLD_WIDTH: 3200,
  WORLD_HEIGHT: 2400,
  GOODS: ['Spice', 'Silk', 'Rum', 'Pearls'],
  BASE_PRICES: {
    'Spice': 40,
    'Silk': 80,
    'Rum': 25,
    'Pearls': 150
  },
  UPGRADES: {
    hull: { name: 'Sturdy Hull (+40 HP)', cost: 300, maxLevel: 3, val: 40 },
    sails: { name: 'Swift Sails (+25% Speed)', cost: 350, maxLevel: 2, val: 0.25 },
    cannons: { name: 'Twin Cannons (+Dmg/Rate)', cost: 400, maxLevel: 3, val: 1 },
    hold: { name: 'Deep Hold (+8 Cargo)', cost: 250, maxLevel: 4, val: 8 }
  }
};
