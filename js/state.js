/* state.js — 游戏状态管理：初始化、存档、读档 */

const State = {
  data: null,
  SAVE_KEY: 'shengshi_group_save_v1',
  storageOK: true,   // localStorage 是否可用
  memStore: null,    // 不可用时的内存降级

  /* 初始化：检查存档，没有则进入难度选择 */
  init() {
    // 先探测 localStorage 是否可用（file:// 协议下可能被禁用）
    this.storageOK = this.testStorage();
    // 恢复主题
    if (window.Overview && Overview.initTheme) Overview.initTheme();
    const saved = this.load();
    if (saved) {
      this.data = saved;
      this.migrate();   // 兼容旧存档
      Router.goRoot('overview');
    } else {
      this.showDifficulty();
    }
  },

  /* 兼容旧存档：补全新增字段（逐个检查，避免新增股票/基金时旧存档漏初始化） */
  migrate() {
    const d = this.data;

    // 确保各价格容器存在
    if (!d.stockPrices) d.stockPrices = {};
    if (!d.stockHistory) d.stockHistory = {};
    if (!d.fundPrices) d.fundPrices = {};
    if (!d.fundHistory) d.fundHistory = {};
    if (!d.metalPrices) d.metalPrices = {};
    if (!d.fundHoldings) d.fundHoldings = [];
    if (!d.marketSentiment) d.marketSentiment = 0;
    if (!d.employees) d.employees = [];
    if (!d.inventory) d.inventory = {};   // 仓库原料库存：{ code: 数量 }
    if (!d.news) d.news = [];             // 新闻历史（旧存档补全）
    if (d.nextNewsDay == null) d.nextNewsDay = (d.date.totalDays || 0) + 3 + Math.floor(Math.random() * 3);
    if (!d.activeEffects) d.activeEffects = [];
    if (d.lastLogisticsIncome == null) d.lastLogisticsIncome = 0;
    if (d.lastLogisticsExpense == null) d.lastLogisticsExpense = 0;

    // 兼容旧版单员工结构 → 按类分组结构（仅在旧格式时执行）
    if (d.employees.length > 0 && d.employees[0].level !== undefined) {
      d.employees.forEach(e => {
        if (e.count === undefined) e.count = 1;
      });
      const merged = [];
      d.employees.forEach(g => {
        const key = (g.level) + '|' + (g.assign ? g.assign.type + '_' + g.assign.category : 'null');
        const exist = merged.find(m => m.key === key);
        if (exist) {
          exist.count += (g.count || 1);
        } else {
          g.key = key;
          merged.push(g);
        }
      });
      d.employees = merged;
    }

    // 逐个补全股票价格 + 历史（新增的股票在旧存档里不存在）
    DATA.stocks.forEach(s => {
      const p = d.stockPrices[s.code];
      if (p === undefined || p === null || isNaN(p) || p <= 0) {
        d.stockPrices[s.code] = s.basePrice;
      }
    });
    DATA.stocks.forEach(s => {
      if (!d.stockHistory[s.code] || d.stockHistory[s.code].length === 0) {
        d.stockHistory[s.code] = this.generateHistory(s.basePrice, 30);
      }
    });
    // 逐个补全基金价格 + 历史
    DATA.funds.forEach(f => {
      const p = d.fundPrices[f.code];
      if (p === undefined || p === null || isNaN(p) || p <= 0) {
        d.fundPrices[f.code] = f.basePrice;
      }
    });
    DATA.funds.forEach(f => {
      if (!d.fundHistory[f.code] || d.fundHistory[f.code].length === 0) {
        d.fundHistory[f.code] = this.generateHistory(f.basePrice, 30);
      }
    });
    // 逐个补全贵金属价格
    DATA.metals.forEach(m => {
      const p = d.metalPrices[m.code];
      if (p === undefined || p === null || isNaN(p) || p <= 0) {
        d.metalPrices[m.code] = m.basePrice;
      }
    });

    // 逐个补全原料市场价格
    if (!d.materialPrices) d.materialPrices = {};
    DATA.rawMaterials.forEach(m => {
      const p = d.materialPrices[m.code];
      if (p === undefined || p === null || isNaN(p) || p <= 0) {
        d.materialPrices[m.code] = m.price;
      }
    });

    // 清理异常持仓（旧 bug 中可能以 ¥0 买入了股票）
    if (d.stocks) {
      d.stocks = d.stocks.filter(s => s.avgCost > 0 && s.shares > 0);
    }
    if (d.fundHoldings) {
      d.fundHoldings = d.fundHoldings.filter(h => h.avgCost > 0 && h.shares > 0);
    }

    // 工厂产品系统迁移：旧工厂添加 products 字段
    if (d.industries) {
      d.industries.forEach(ind => {
        if (ind.type === 'factory' && !ind.products) {
          ind.products = {};
        }
      });
    }

    // 强制同步农产品市场价（确保旧存档价格与 data.js 一致）
    const priceResets = { wheat:2800, rice:3000, soy:5000, corn:2600, cotton:18000, rape:7000, sugarc:500, tea:40000, veg:3000, fruit:8000, rubber:12000, tobacco:25000, sorghum:2800, wood_bamboo:500, wood_pine:1000, wood_cedar:1200, wood_walnut:15000, wood_rosewood:100000, wood_nanmu:200000, coal:1000, iron:1000, copper:55000, baux:500, zinc_ore:2500, lead_ore:1800, tin:175000, tung:120000, silver_ore:5000, gold_ore:350000, rare_earth:65000, phos_ore:500, quartz_ore:300, limestone:80, steel:4500, ironR:3800, copperR:67000, alum:19000, zincR:23000, leadR:16000, tinR:220000, tungR:175000, alloy:22000, precious_m:450000 };
    Object.entries(priceResets).forEach(([code, newPrice]) => {
      if (d.materialPrices) {
        d.materialPrices[code] = newPrice;
      }
    });

    // 物流规则系统迁移
    if (!d.logisticsRules || !Array.isArray(d.logisticsRules)) d.logisticsRules = [];

    // 采矿许可证迁移：mine_land → 对应矿种的 licenseLevel
    if (d.industries) {
      // 查找是否有 mine_land 地产
      const mineLand = d.industries.find(i => i.type === 'estate' && i.category === 'mine_land');
      if (mineLand) {
        // 为每个已拥有的矿种添加 licenseLevel: 1
        d.industries.forEach(ind => {
          if (ind.type === 'mining' && !ind.licenseLevel) ind.licenseLevel = 1;
        });
        // 删除 mine_land 地产
        d.industries = d.industries.filter(i => !(i.type === 'estate' && i.category === 'mine_land'));
      }
      // 确保已有矿种都有 licenseLevel
      d.industries.forEach(ind => {
        if (ind.type === 'mining' && !ind.licenseLevel) ind.licenseLevel = 1;
      });
    }

    // 信用评级迁移
    if (!d.creditRating) d.creditRating = DATA.bank.defaultCredit;
    if (d.creditDaysWithoutLoan == null) d.creditDaysWithoutLoan = 0;

    // 员工系统迁移：旧分组模式 → 个体员工模式
    if (d.employees && d.employees.length > 0) {
      const first = d.employees[0];
      if (first.level !== undefined && first.count !== undefined) {
        const SURNAMES = ['王','李','张','刘','陈','杨','黄','赵','吴','周','徐','孙','马','胡','朱','郭','何','高','林','罗'];
        const GIVEN = ['伟','芳','娜','敏','静','丽','强','磊','洋','勇','艳','杰','娟','涛','明','超','霞','平','峰','鑫'];
        const BASE_MULT = { 1: 1.8, 2: 2.5, 3: 3.6, 4: 4.8 };
        const newName = () => SURNAMES[Math.floor(Math.random() * SURNAMES.length)] + GIVEN[Math.floor(Math.random() * GIVEN.length)];
        const expanded = [];
        d.employees.forEach(g => {
          const cnt = g.count || 1;
          const base = BASE_MULT[g.level] || 2.0;
          for (let i = 0; i < cnt; i++) {
            expanded.push({
              id: 'emp_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
              name: newName(),
              multiplier: Math.round((base + (Math.random() - 0.5) * 0.6) * 10) / 10,
              assign: g.assign || null
            });
          }
        });
        d.employees = expanded;
      }
    }
  },

  /* 探测 localStorage 是否可用 */
  testStorage() {
    try {
      const key = '__test__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  },

  /* 读档 */
  load() {
    if (!this.storageOK) return null;
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  /* 存档 */
  save() {
    if (!this.storageOK) return;
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      // 超出容量则静默失败
    }
  },

  /* 开始游戏（选择难度后调用） */
  startGame(difficulty) {
    const cfg = DATA.difficulties[difficulty];
    this.data = {
      date: { year: 2018, month: 1, day: 1, dayOfWeek: 1, totalDays: 0 },
      realDate: '2018-01-01',
      cash: cfg.cash,
      deposit: 0,
      loan: 0,
      interestRate: DATA.bank.baseRate,
      activeEffects: [],
      stocks: [],
      stockPrices: {},
      stockHistory: {},
      fundHoldings: [],
      fundPrices: {},
      fundHistory: {},
      metals: [],
      metalPrices: {},
      industries: [],
      employees: [],
      _initEmployees: true,  // Flag to generate initial employees after game start
      inventory: {},       // 仓库原料库存：{ code: 数量 }
      materialPrices: {},   // 原料市场价格（每日波动）
      marketSentiment: 0,   // 大盘情绪 -0.02 ~ 0.02
      lastNewsDay: -10,
      nextNewsDay: 4,        // 首次新闻在第 4 天
      news: [],             // 新闻历史
      logs: []
      ,logisticsRules: [],      // 物流自动买卖规则（数组）
      creditRating: DATA.bank.defaultCredit,  // 信用评级
      creditDaysWithoutLoan: 0   // 连续无贷款天数
    };
    // 初始化股票价格
    DATA.stocks.forEach(s => { this.data.stockPrices[s.code] = s.basePrice; });
    DATA.stocks.forEach(s => { this.data.stockHistory[s.code] = this.generateHistory(s.basePrice, 30); });
    // 初始化基金价格
    DATA.funds.forEach(f => { this.data.fundPrices[f.code] = f.basePrice; });
    DATA.funds.forEach(f => { this.data.fundHistory[f.code] = this.generateHistory(f.basePrice, 30); });
    // 初始化贵金属价格
    DATA.metals.forEach(m => { this.data.metalPrices[m.code] = m.basePrice; });
    // 初始化原料市场价格
    DATA.rawMaterials.forEach(m => { this.data.materialPrices[m.code] = m.price; });
    // 初始员工：12名免费员工
    if (this.data._initEmployees) {
      const newNames = Employees._randomName ? null : null;
      for (let i = 0; i < 12; i++) {
        const mult = Math.round((1.0 + Math.random() * 1.0) * 10) / 10;
        this.data.employees.push({
          id: 'emp_' + Date.now() + '_' + i,
          name: typeof Employees !== 'undefined' && Employees._randomName ? Employees._randomName() : ('员工' + (i+1)),
          multiplier: mult,
          assign: null
        });
      }
      delete this.data._initEmployees;
    }

    
    if (window.TimeManager) TimeManager.reset();
    this.save();
    Router.goRoot('overview');
  },

  /* 重置游戏 */
  reset() {
    this.data = null;
    if (this.storageOK) {
      try { localStorage.removeItem(this.SAVE_KEY); } catch (e) {}
    }
    if (window.TimeManager) TimeManager.reset();
    this.showDifficulty();
  },

  /* 难度选择页 */
  showDifficulty() {
    const app = document.getElementById('app');
    const storageNote = this.storageOK
      ? '<div class="text-sm text-muted" style="margin-top:8px;">✓ 支持存档（刷新后保留进度）</div>'
      : '<div class="text-sm text-muted" style="margin-top:8px;color:var(--warning);">⚠ 当前环境不支持存档，建议部署到服务器后使用</div>';
    app.innerHTML = `
      <div class="page" style="padding:24px 16px;">
        <div style="text-align:center; margin-bottom:24px;">
          <div style="font-size:28px; font-weight:600; margin-bottom:8px;">盛世集团</div>
          <div class="text-sm text-muted">文字模拟经营 · 从2018年开始</div>
        </div>
        <div class="section-title">选择难度</div>
        <div class="card-grid" style="margin-bottom:16px;">
          <button class="card" onclick="State.startGame('easy')">
            <div class="card-title">${DATA.difficulties.easy.name}</div>
            <div class="card-sub">${DATA.difficulties.easy.desc}</div>
            <div class="font-medium" style="margin-top:8px; color:var(--up);">¥${DATA.difficulties.easy.cash.toLocaleString('zh-CN')}</div>
          </button>
          <button class="card" onclick="State.startGame('normal')">
            <div class="card-title">${DATA.difficulties.normal.name}</div>
            <div class="card-sub">${DATA.difficulties.normal.desc}</div>
            <div class="font-medium" style="margin-top:8px; color:var(--warning);">¥${DATA.difficulties.normal.cash.toLocaleString('zh-CN')}</div>
          </button>
          <button class="card" onclick="State.startGame('hard')">
            <div class="card-title">${DATA.difficulties.hard.name}</div>
            <div class="card-sub">${DATA.difficulties.hard.desc}</div>
            <div class="font-medium" style="margin-top:8px; color:var(--down);">¥${DATA.difficulties.hard.cash.toLocaleString('zh-CN')}</div>
          </button>
        </div>
        ${storageNote}
      </div>
    `;
  },

  /* 查找产业品类对象 */
  findIndustryCategory(type, category) {
    const ind = DATA.industries[type];
    if (!ind) return null;
    return ind.categories.find(c => c.code === category) || null;
  },

  /* 格式化数字（智能切换：千分位 → 万 → 亿） */
  formatNum(n) {
    n = Math.round(n);
    const abs = Math.abs(n);
    if (abs >= 100000000) return (n / 100000000).toFixed(2) + '亿';
    if (abs >= 10000) return (n / 10000).toFixed(2) + '万';
    return n.toLocaleString('zh-CN');
  },

  /* 格式化金额（带¥） */
  formatMoney(n) {
    return '¥' + this.formatNum(n);
  },

  /* 格式化百分比 */
  formatPct(n) {
    return (n >= 0 ? '+' : '') + (n * 100).toFixed(2) + '%';
  },

  /* 计算总资产 */
  totalAssets() {
    let total = (this.data.cash || 0) + (this.data.deposit || 0) - (this.data.loan || 0);
    // 股票市值
    this.data.stocks.forEach(s => {
      total += s.shares * (this.data.stockPrices[s.code] || 0);
    });
    // 贵金属市值
    this.data.metals.forEach(m => {
      total += m.grams * (this.data.metalPrices[m.code] || 0);
    });
    // 实业估值（按购入价折旧 80%，乘以数量）
    this.data.industries.forEach(ind => {
      const cat = this.findIndustryCategory(ind.type, ind.category);
      if (cat && cat.cost) {
        let val = cat.cost * 0.8 * (ind.quantity || 1);
        if (ind.type === 'mining' && cat.licenseCost && ind.licenseLevel) val += cat.licenseCost * 0.3 * (ind.licenseLevel || 1);
        total += val;
      }
    });
    // 仓库库存市值
    if (window.Employees) { const wv = Employees.warehouseValue(); if (!isNaN(wv)) total += wv; }
    return total;
  },

  /* 计算日收入（含员工加成，扣员工薪水） */
  dailyIncome() {
    let income = 0;
    this.data.industries.forEach(ind => {
      const cat = this.findIndustryCategory(ind.type, ind.category);
      if (cat) {
        const qty = ind.quantity || 1;
        const empMult = window.Employees ? Employees.multiplier(ind.type, ind.category) : 1;
        if (empMult <= 0) return;  // 无员工无产出
        let recipeSat = 1.0;
        // 工厂类型优先使用产品系统
        if (ind.type === 'factory' && window.FactoryProducts && ind.products !== undefined) {
          // products 存在说明走产品系统，FactoryProducts.factoryDailyIncome 内部会遍历分配
          // 且已经包含了员工加成和等级加成
          const prodIncome = FactoryProducts.factoryDailyIncome(ind.category);
          if (!isNaN(prodIncome)) income += prodIncome;
          return; // 跳过后面的通用公式
        }
        if (ind.type === 'factory' && window.DATA && DATA.factoryRecipes[ind.category]) {
          recipeSat = Employees.recipeSatisfaction(ind.category, qty);
        }
        if (ind.type === 'metall' && window.DATA && DATA.smelterRecipes[ind.category]) {
          recipeSat = Employees.smelterSatisfaction(ind.category, qty);
        }
        let daily = 0;
        if (cat.produces) {
          const licenseMult = (ind.type === 'mining' && ind.licenseLevel && ind.licenseLevel > 1)
            ? (1 + (ind.licenseLevel - 1) * 0.2) : 1;
          const produceQty = cat.produces.qty * qty * (empMult || 0) * licenseMult;
          const matPrice = window.Employees ? Employees.materialPrice(cat.produces.code) : 0;
          daily = produceQty * matPrice;
        } else {
          const levelMult = (ind.type === 'farm' || ind.type === 'mining' || ind.type === 'metall') ? 1 : Engine.levelMultiplier(ind.level || 1);
          daily = (cat.dailyIncome || 0) * levelMult * qty * (empMult || 0) * (recipeSat || 1);
        }
        // 周末减半
        if (this.data.date.dayOfWeek === 0 || this.data.date.dayOfWeek === 6) {
          daily *= 0.5;
        }
        if (!isNaN(daily)) income += daily;
      }
    });
    // 存款利息（按天）
    income += this.data.deposit * (this.data.interestRate || DATA.bank.baseRate) / 365;
    // 估算物流买卖净现金流
    if (window.LogisticsSystem && this.data.logisticsRules && this.data.logisticsRules.length > 0) {
      const inv = this.data.inventory || {};
      const feeRate = LogisticsSystem.getBestFeeRate();
      this.data.logisticsRules.forEach(rule => {
        const mat = DATA.rawMaterials.find(m => m.code === rule.materialCode);
        if (!mat) return;
        const current = inv[rule.materialCode] || 0;
        if (rule.type === 'sell_above' && current > rule.threshold) {
          const excess = current - rule.threshold;
          const sellQty = Math.min(excess * (rule.percentage / 100), current);
          if (sellQty > 0.5) income += Math.floor(Employees.materialPrice(rule.materialCode) * (1 - feeRate) * sellQty);
        }
        if (rule.type === 'buy_below' && current < rule.threshold && LogisticsSystem.canAutoBuy()) {
          const shortage = rule.threshold - current;
          const buyQty = shortage * (rule.percentage / 100);
          if (buyQty > 0.5) income -= Math.floor(Employees.materialPrice(rule.materialCode) * buyQty);
        }
      });
    }
    // 扣员工薪水
    if (window.Employees) income -= Employees.totalSalary();
    return income;
  },

  /* 生成历史价格序列（用于 K 线） */
  generateHistory(basePrice, days) {
    const history = [];
    let price = basePrice * (0.85 + Math.random() * 0.1); // 起始价略低于现价
    for (let i = 0; i < days; i++) {
      const open = price;
      const change = (Math.random() - 0.48) * 0.04; // 略偏涨
      const close = Math.max(0.1, open * (1 + change));
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(500000 + Math.random() * 2000000);
      history.push({ open: Math.round(open*100)/100, close: Math.round(close*100)/100,
                     high: Math.round(high*100)/100, low: Math.round(low*100)/100, volume });
      price = close;
    }
    return history;
  }
};

window.State = State;
