class UIManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.setupListeners();
  }

  setupListeners() {
    document.getElementById('btn-start').addEventListener('click', () => {
      window.soundManager.init();
      this.gameState.startGame();
    });

    document.getElementById('btn-how').addEventListener('click', () => {
      document.getElementById('how-modal').classList.remove('hidden');
    });

    document.getElementById('btn-close-how').addEventListener('click', () => {
      document.getElementById('how-modal').classList.add('hidden');
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      this.gameState.resumeGame();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.gameState.startGame();
    });

    document.getElementById('btn-quit').addEventListener('click', () => {
      this.gameState.showTitle();
    });

    document.getElementById('btn-victory-restart').addEventListener('click', () => {
      this.gameState.startGame();
    });

    document.getElementById('btn-gameover-restart').addEventListener('click', () => {
      this.gameState.startGame();
    });

    document.getElementById('btn-repair').addEventListener('click', () => {
      const trade = this.gameState.trade;
      const ship = this.gameState.ship;
      const repairCost = 50;
      if (trade.gold >= repairCost && ship.hull < ship.maxHull) {
        trade.gold -= repairCost;
        ship.hull = Math.min(ship.maxHull, ship.hull + 40);
        window.soundManager.playCoin();
        this.openTrade(this.currentPort);
      }
    });

    document.getElementById('btn-undock').addEventListener('click', () => {
      this.closeTrade();
    });
  }

  updateHUD() {
    const trade = this.gameState.trade;
    const ship = this.gameState.ship;
    const weather = this.gameState.weather;

    document.getElementById('hud-gold').innerText = Math.floor(trade.gold);
    document.getElementById('hud-cargo').innerText = trade.getTotalCargo();
    document.getElementById('hud-cargo-max').innerText = trade.maxCargo;
    document.getElementById('hud-hull').innerText = Math.max(0, Math.floor(ship.hull));
    document.getElementById('hud-hull-max').innerText = ship.maxHull;
    document.getElementById('hud-day').innerText = Math.floor(weather.dayTime * 10) + 1;
    document.getElementById('hud-wind-dir').innerText = weather.getWindDirName();
    document.getElementById('hud-wind-str').innerText = weather.windSpeed.toFixed(1) + 'x';

    if (trade.activeContract) {
      document.getElementById('hud-contract').innerText = `Contract: Deliver ${trade.activeContract.qty} ${trade.activeContract.good} to ${trade.activeContract.targetName} (${trade.activeContract.reward}G)`;
    } else {
      document.getElementById('hud-contract').innerText = 'Active Contract: None (Dock at port to pick up)';
    }

    // Check best gold
    const bestGold = Math.max(trade.gold, Number(localStorage.getItem('tidebound_best_gold') || 0));
    document.getElementById('lbl-best-gold').innerText = Math.floor(bestGold);
  }

  openTrade(port) {
    this.currentPort = port;
    this.gameState.state = 'trade';
    document.getElementById('trade-overlay').classList.remove('hidden');
    document.getElementById('trade-port-name').innerText = port.name;
    document.getElementById('trade-port-desc').innerText = port.desc;

    // Market list
    const marketList = document.getElementById('market-list');
    marketList.innerHTML = '';
    window.CONFIG.GOODS.forEach(good => {
      const price = port.prices[good] || 40;
      const sellPrice = Math.round(price * 1.2);
      const div = document.createElement('div');
      div.className = 'market-item';
      div.innerHTML = `
        <span><strong>${good}</strong> (Buy: ${price}G | Sell: ${sellPrice}G | Have: ${this.gameState.trade.cargo[good]})</span>
        <span>
          <button class="trade-btn" onclick="window.uiManager.buy('${good}', 1)">Buy 1</button>
          <button class="trade-btn" onclick="window.uiManager.sell('${good}', 1)">Sell 1</button>
        </span>
      `;
      marketList.appendChild(div);
    });

    // Contracts list
    const contractsList = document.getElementById('contracts-list');
    contractsList.innerHTML = '';
    if (this.gameState.trade.availableContracts.length === 0) {
      this.gameState.trade.generateContracts(this.gameState.world.ports);
    }
    this.gameState.trade.availableContracts.forEach(contract => {
      const div = document.createElement('div');
      div.className = 'contract-item';
      div.innerHTML = `
        <span>Deliver ${contract.qty} ${contract.good} to ${contract.targetName} (${contract.reward}G)</span>
        <button class="trade-btn" onclick="window.uiManager.acceptContract(${contract.id})">Accept</button>
      `;
      contractsList.appendChild(div);
    });

    // Shipyard list
    const shipyardList = document.getElementById('shipyard-list');
    shipyardList.innerHTML = '';
    Object.entries(window.CONFIG.UPGRADES).forEach(([key, up]) => {
      const lvl = this.gameState.trade.upgrades[key];
      const cost = up.cost * (lvl + 1);
      const div = document.createElement('div');
      div.className = 'upgrade-item';
      div.innerHTML = `
        <span>${up.name} (Lvl ${lvl}/${up.maxLevel})</span>
        <button class="trade-btn" onclick="window.uiManager.buyUpgrade('${key}')">${lvl >= up.maxLevel ? 'MAX' : cost + 'G'}</button>
      `;
      shipyardList.appendChild(div);
    });
  }

  closeTrade() {
    document.getElementById('trade-overlay').classList.add('hidden');
    this.gameState.state = 'play';
  }

  buy(good, qty) {
    const res = this.gameState.trade.buyGood(this.currentPort, good, qty);
    this.openTrade(this.currentPort);
  }

  sell(good, qty) {
    const res = this.gameState.trade.sellGood(this.currentPort, good, qty);
    this.openTrade(this.currentPort);
  }

  acceptContract(id) {
    const contract = this.gameState.trade.availableContracts.find(c => c.id === id);
    if (contract) {
      this.gameState.trade.acceptContract(contract);
      this.openTrade(this.currentPort);
    }
  }

  buyUpgrade(type) {
    this.gameState.trade.buyUpgrade(type);
    this.openTrade(this.currentPort);
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('hud').classList.add('hidden');
    if (screenId) {
      document.getElementById(screenId).classList.remove('hidden');
    }
  }
}

window.UIManager = UIManager;
