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
      Router.go('home');
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

    // 兼容旧版单员工结构 → 按类分组结构
    // 旧：{ id, level, assign, hireDay }  新：{ id, level, count, assign }
    d.employees.forEach(e => {
      if (e.count === undefined) e.count = 1;
    });
    // 合并同等级同分配的组
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
      inventory: {},       // 仓库原料库存：{ code: 数量 }
      materialPrices: {},   // 原料市场价格（每日波动）
      marketSentiment: 0,   // 大盘情绪 -0.02 ~ 0.02
      lastNewsDay: -10,
      nextNewsDay: 4,        // 首次新闻在第 4 天
      news: [],             // 新闻历史
      logs: []
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
    // 重置时间
    if (window.TimeManager) TimeManager.reset();
    this.save();
    Router.go('home');
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
    let total = this.data.cash + this.data.deposit - (this.data.loan || 0);
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
      if (cat && cat.cost) total += cat.cost * 0.8 * (ind.quantity || 1);
    });
    // 仓库库存市值
    if (window.Employees) total += Employees.warehouseValue();
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
        if (ind.type === 'factory' && window.DATA && DATA.factoryRecipes[ind.category]) {
          recipeSat = Employees.recipeSatisfaction(ind.category, qty);
        }
        if (ind.type === 'metall' && window.DATA && DATA.smelterRecipes[ind.category]) {
          recipeSat = Employees.smelterSatisfaction(ind.category, qty);
        }
        let daily = cat.dailyIncome * (ind.level || 1) * qty * empMult * recipeSat;
        // 周末减半
        if (this.data.date.dayOfWeek === 0 || this.data.date.dayOfWeek === 6) {
          daily *= 0.5;
        }
        income += daily;
      }
    });
    // 存款利息（按天）
    income += this.data.deposit * (this.data.interestRate || DATA.bank.baseRate) / 365;
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
