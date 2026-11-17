class TradeSystem {
  constructor() {
    this.gold = 500;
    this.maxCargo = 24;
    this.cargo = {
      'Spice': 0,
      'Silk': 0,
      'Rum': 0,
      'Pearls': 0
    };
    this.upgrades = {
      hull: 0,
      sails: 0,
      cannons: 0,
      hold: 0
    };
    this.activeContract = null;
    this.availableContracts = [];
    this.contractsCompleted = 0;
  }

  getTotalCargo() {
    return Object.values(this.cargo).reduce((a, b) => a + b, 0);
  }

  buyGood(port, good, qty) {
    const price = port.prices[good] || window.CONFIG.BASE_PRICES[good];
    const cost = price * qty;
    if (this.gold < cost) return { success: false, msg: 'Not enough gold!' };
    if (this.getTotalCargo() + qty > this.maxCargo) return { success: false, msg: 'Cargo hold full!' };

    this.gold -= cost;
    this.cargo[good] += qty;
    window.soundManager.playCoin();
    return { success: true, msg: `Bought ${qty} ${good} for ${cost}G` };
  }

  sellGood(port, good, qty) {
    if (this.cargo[good] < qty) return { success: false, msg: 'Not enough cargo to sell!' };
    const price = port.prices[good] || window.CONFIG.BASE_PRICES[good];
    const revenue = Math.round(price * 1.2) * qty; // sell slightly higher than buy base

    this.cargo[good] -= qty;
    this.gold += revenue;
    window.soundManager.playCoin();

    // Check contract completion
    if (this.activeContract && this.activeContract.good === good && this.activeContract.targetPort === port.id) {
      if (this.cargo[good] >= this.activeContract.qty) {
        this.cargo[good] -= this.activeContract.qty;
        this.gold += this.activeContract.reward;
        this.contractsCompleted++;
        const bonusMsg = ` Contract Completed! Earned bonus ${this.activeContract.reward}G!`;
        this.activeContract = null;
        window.soundManager.playVictory();
        return { success: true, msg: `Sold ${qty} ${good} for ${revenue}G.${bonusMsg}` };
      }
    }

    return { success: true, msg: `Sold ${qty} ${good} for ${revenue}G` };
  }

  generateContracts(ports) {
    this.availableContracts = [];
    const goods = window.CONFIG.GOODS;
    for (let i = 0; i < 3; i++) {
      const origin = ports[Math.floor(Math.random() * ports.length)];
      let target = ports[Math.floor(Math.random() * ports.length)];
      while (target.id === origin.id) target = ports[Math.floor(Math.random() * ports.length)];
      const good = goods[Math.floor(Math.random() * goods.length)];
      const qty = 5 + Math.floor(Math.random() * 8);
      const reward = qty * (window.CONFIG.BASE_PRICES[good] || 40) + 150;
      this.availableContracts.push({
        id: Math.random(),
        originId: origin.id,
        originName: origin.name,
        targetPort: target.id,
        targetName: target.name,
        good,
        qty,
        reward
      });
    }
  }

  acceptContract(contract) {
    if (this.activeContract) return { success: false, msg: 'Already have an active contract!' };
    this.activeContract = contract;
    window.soundManager.playBell();
    return { success: true, msg: `Accepted contract: Deliver ${contract.qty} ${contract.good} to ${contract.targetName}` };
  }

  buyUpgrade(type) {
    const upDef = window.CONFIG.UPGRADES[type];
    const lvl = this.upgrades[type];
    if (lvl >= upDef.maxLevel) return { success: false, msg: 'Upgrade maxed out!' };
    const cost = upDef.cost * (lvl + 1);
    if (this.gold < cost) return { success: false, msg: 'Not enough gold for upgrade!' };

    this.gold -= cost;
    this.upgrades[type]++;
    if (type === 'hold') {
      this.maxCargo += upDef.val;
    }
    window.soundManager.playCoin();
    return { success: true, msg: `Upgraded ${upDef.name} to Level ${this.upgrades[type]}` };
  }
}

window.TradeSystem = TradeSystem;
