/* state.js — 游戏状态管理：初始化、存档、读档 */
import { DATA, getNewsPool } from './data.js';
import { FactoryProducts } from './factoryProducts.js';
import { LogisticsSystem } from './logistics.js';
import { Router } from './ui.js';
import { Employees } from './employees.js';
import { TimeManager } from './time.js';
import { Competitors } from './competitors.js';
import { Engine } from './engine.js';

const SCHEMA_VERSION = 8;
export const State = {
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
  /* 版本化迁移：按 _schemaVersion 顺序执行，已执行过的自动跳过 */
  migrate() {
    const d = this.data;
    const currentVersion = d._schemaVersion || 0;
    if (currentVersion >= SCHEMA_VERSION) return;

    const migrations = [
      [1, this._migrateV1],
      [2, this._migrateV2],
      [3, this._migrateV3],
      [4, this._migrateV4],
      [5, this._migrateV5],
      [6, this._migrateV6],
      [7, this._migrateV7],
      [8, this._migrateV8]
    ];
    for (const [ver, fn] of migrations) {
      if (currentVersion < ver) fn.call(this, d);
    }
    d._schemaVersion = SCHEMA_VERSION;
    this.save();
  },

  /* ---- 迁移函数（按版本号排序） ---- */

  /* v1: 金融基础容器 */
  _migrateV1(d) {
    if (!d.stockPrices) d.stockPrices = {};
    if (!d.stockHistory) d.stockHistory = {};
    if (!d.fundPrices) d.fundPrices = {};
    if (!d.fundHistory) d.fundHistory = {};
    if (!d.metalPrices) d.metalPrices = {};
    if (!d.fundHoldings) d.fundHoldings = [];
    if (!d.marketSentiment) d.marketSentiment = 0;
  },

  /* v2: 员工、仓库、竞争对手、成就、期货、新闻、事件 */
  _migrateV2(d) {
    if (!d.employees) d.employees = [];
    if (!d.inventory) d.inventory = {};
    if (!d.competitors) d.competitors = [];
    if (!d.achievements) d.achievements = [];
    if (!d.futuresStats) d.futuresStats = { totalProfit: 0, totalLoss: 0 };
    if (!d.futuresPositions) d.futuresPositions = [];
    if (!d.news) d.news = [];
    if (d.nextNewsDay == null) d.nextNewsDay = (d.date.totalDays || 0) + 3 + Math.floor(Math.random() * 3);
    if (!d.activeEffects) d.activeEffects = [];
    if (d.lastLogisticsIncome == null) d.lastLogisticsIncome = 0;
    if (d.lastLogisticsExpense == null) d.lastLogisticsExpense = 0;
    // 旧版单员工结构 → 按类分组结构
    if (d.employees.length > 0 && d.employees[0].level !== undefined) {
      d.employees.forEach(e => { if (e.count === undefined) e.count = 1; });
      const merged = [];
      d.employees.forEach(g => {
        const key = (g.level) + '|' + (g.assign ? g.assign.type + '_' + g.assign.category : 'null');
        const exist = merged.find(m => m.key === key);
        if (exist) { exist.count += (g.count || 1); }
        else { g.key = key; merged.push(g); }
      });
      d.employees = merged;
    }
  },

  /* v3: 金融品种价格初始化 + 清理异常持仓 */
  _migrateV3(d) {
    DATA.stocks.forEach(s => {
      const p = d.stockPrices[s.code];
      if (p === undefined || p === null || isNaN(p) || p <= 0) d.stockPrices[s.code] = s.basePrice;
    });
    DATA.stocks.forEach(s => {
      if (!d.stockHistory[s.code] || d.stockHistory[s.code].length === 0)
        d.stockHistory[s.code] = this.generateHistory(s.basePrice, 30);
    });
    DATA.funds.forEach(f => {
      const p = d.fundPrices[f.code];
      if (p === undefined || p === null || isNaN(p) || p <= 0) d.fundPrices[f.code] = f.basePrice;
    });
    DATA.funds.forEach(f => {
      if (!d.fundHistory[f.code] || d.fundHistory[f.code].length === 0)
        d.fundHistory[f.code] = this.generateHistory(f.basePrice, 30);
    });
    DATA.metals.forEach(m => {
      const p = d.metalPrices[m.code];
      if (p === undefined || p === null || isNaN(p) || p <= 0) d.metalPrices[m.code] = m.basePrice;
    });
    if (d.stocks) d.stocks = d.stocks.filter(s => s.avgCost > 0 && s.shares > 0);
    if (d.fundHoldings) d.fundHoldings = d.fundHoldings.filter(h => h.avgCost > 0 && h.shares > 0);
  },

  /* v4: 原料市场价格 */
  _migrateV4(d) {
    if (!d.materialPrices) d.materialPrices = {};
    DATA.rawMaterials.forEach(m => {
      const p = d.materialPrices[m.code];
      if (p === undefined || p === null || isNaN(p) || p <= 0) d.materialPrices[m.code] = m.price;
    });
    const PRICE_DEFAULTS = {
      wheat:2400, rice:2800, soy:4500, corn:2400, cotton:15000, rape:6500, sugarc:500,
      tea:40000, veg:3000, fruit:8000, rubber:13000, tobacco:28000, sorghum:2600,
      wood_bamboo:500, wood_pine:1000, wood_cedar:1200, wood_walnut:15000,
      wood_rosewood:100000, wood_nanmu:200000, coal:800, iron:950, copper:78000,
      baux:600, zinc_ore:22000, lead_ore:15000, tin:260000, tung:85000, silver_ore:5000,
      gold_ore:350000, rare_earth:65000, phos_ore:800, quartz_ore:300, limestone:80,
      steel:3800, ironR:3200, copperR:80000, alum:20500, zincR:22500, leadR:17000,
      tinR:280000, tungR:160000, alloy:22000, precious_m:450000
    };
    Object.entries(PRICE_DEFAULTS).forEach(([code, defPrice]) => {
      const v = d.materialPrices[code];
      if (v === undefined || v === null || isNaN(v) || v <= 0) d.materialPrices[code] = defPrice;
    });
  },

  /* v5: 工厂产品系统 + 累计利润 + 产品价格 */
  _migrateV5(d) {
    if (d.industries) {
      d.industries.forEach(ind => {
        if (ind.type === 'factory' && !ind.products) ind.products = {};
        if (ind.cumulativeProfit === undefined) ind.cumulativeProfit = 0;
      });
    }
    if (!d.productPrices) d.productPrices = {};
    if (window.FactoryProducts && FactoryProducts.data) {
      Object.values(FactoryProducts.data).forEach(products => {
        products.forEach(p => {
          if (d.productPrices[p.code] === undefined) d.productPrices[p.code] = p.sellPrice;
        });
      });
    }
  },

  /* v6: 物流规则 + 采矿许可证（mine_land → licenseLevel） */
  _migrateV6(d) {
    if (!d.logisticsRules || !Array.isArray(d.logisticsRules)) d.logisticsRules = [];
    if (!d.productPriceMultipliers) d.productPriceMultipliers = {};
    if (d.industries) {
      const mineLand = d.industries.find(i => i.type === 'estate' && i.category === 'mine_land');
      if (mineLand) {
        d.industries.forEach(ind => {
          if (ind.type === 'mining' && !ind.licenseLevel) ind.licenseLevel = 1;
        });
        d.industries = d.industries.filter(i => !(i.type === 'estate' && i.category === 'mine_land'));
      }
      d.industries.forEach(ind => {
        if (ind.type === 'mining' && !ind.licenseLevel) ind.licenseLevel = 1;
      });
    }
  },

  /* v7: 信用评级 + 经济周期 + 天敌事件 */
  _migrateV7(d) {
    if (!d.creditRating) d.creditRating = DATA.bank.defaultCredit;
    if (d.creditDaysWithoutLoan == null) d.creditDaysWithoutLoan = 0;
    if (!d.economicPhase) d.economicPhase = 'stable';
    if (d.daysInPhase == null) d.daysInPhase = 0;
    if (!d.activeEvents) d.activeEvents = [];
    if (d.bankruptcyDays == null) d.bankruptcyDays = 0;
    if (d.nextDisasterDay == null) d.nextDisasterDay = (d.date.totalDays || 0) + 15 + Math.floor(Math.random() * 16);
  },

  /* v8: 每日统计 + 员工士气 + 分组→个体员工 */
  _migrateV8(d) {
    if (!d.dailyStats || !Array.isArray(d.dailyStats)) d.dailyStats = [];
    if (!d.industryDailyStats || typeof d.industryDailyStats !== 'object') d.industryDailyStats = {};
    if (d.employees) {
      d.employees.forEach(e => {
        if (e.morale == null) e.morale = 80 + Math.floor(Math.random() * 21);
      });
    }
    // 旧分组模式 → 个体员工模式
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
      _schemaVersion: SCHEMA_VERSION,
      difficulty: difficulty,
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
      industries: [
        { type: 'estate', category: 'residential', level: 1, quantity: 1, purchaseDay: 0 }
      ],
      employees: [],
      _initEmployees: true,  // Flag to generate initial employees after game start
      inventory: {},       // 仓库原料库存：{ code: 数量 }
      materialPrices: {},   // 原料市场价格（每日波动）
      marketSentiment: 0,   // 大盘情绪 -0.02 ~ 0.02
      lastNewsDay: -10,
      nextNewsDay: 4,        // 首次新闻在第 4 天
      news: [],             // 新闻历史
      logs: []
      ,logisticsRules: [],
      competitors: [],
      achievements: [],
      futuresStats: { totalProfit: 0, totalLoss: 0 },
      futuresPositions: [],      // 物流自动买卖规则（数组）
      productPriceMultipliers: {},  // { productCode: multiplier }
      creditRating: cfg.initialCredit || DATA.bank.defaultCredit,  // 信用评级
      creditDaysWithoutLoan: 0,   // 连续无贷款天数
      economicPhase: 'stable',    // 当前经济周期阶段
      daysInPhase: 0,             // 当前阶段已持续天数
      activeEvents: [],            // 活跃天敌事件
      bankruptcyDays: 0,            // 连续现金负数天数（破产自救阶段）
      nextDisasterDay: 15 + Math.floor(Math.random() * 16),  // 首次天敌事件在15-30天后
      dailyStats: [],              // 每日整体统计（环形缓冲，30天）
      industryDailyStats: {}        // 按产业类型拆分的每日收入（环形缓冲，7天）{ farm: [], mining: [], ... }
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
    // 初始化工厂产品价格
    this.data.productPrices = {};
    if (window.FactoryProducts && FactoryProducts.data) {
      Object.values(FactoryProducts.data).forEach(products => {
        products.forEach(p => {
          this.data.productPrices[p.code] = p.sellPrice;
        });
      });
    }
    // 初始员工
    if (this.data._initEmployees) {
      const newNames = Employees._randomName ? null : null;
      for (let i = 0; i < 8; i++) {
        const mult = Math.round((1.0 + Math.random() * 1.0) * 10) / 10;
        this.data.employees.push({
          id: 'emp_' + Date.now() + '_' + i,
          name: typeof Employees !== 'undefined' && Employees._randomName ? Employees._randomName() : ('员工' + (i+1)),
          multiplier: mult,
          assign: null,
          morale: 80 + Math.floor(Math.random() * 21)
        });
      }
      delete this.data._initEmployees;
    }
    
    if (window.TimeManager) TimeManager.reset();
    
    // 初始化竞争对手
    if (window.Competitors) Competitors.init();
    
    this.save();
    setTimeout(() => Router.goRoot('overview'), 0);
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
          <button class="card" onclick="State.startGame('hell')" style="border-color:var(--down);">
            <div class="card-title" style="color:var(--down);">${DATA.difficulties.hell.name}</div>
            <div class="card-sub">${DATA.difficulties.hell.desc}</div>
            <div class="font-medium" style="margin-top:8px; color:var(--down);">¥${DATA.difficulties.hell.cash.toLocaleString('zh-CN')}</div>
          </button>
        </div>
        ${storageNote}
      </div>
    `;
  },
  /* 获取当前难度配置 */
  getDifficultyConfig() {
    const diff = this.data.difficulty || 'normal';
    return DATA.difficulties[diff] || DATA.difficulties.normal;
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
    // 实业估值 = 购入成本 + 已实现利润
    this.data.industries.forEach(ind => {
      const cat = this.findIndustryCategory(ind.type, ind.category);
      if (!cat) return;
      const qty = ind.quantity || 1;
      let val = 0;

      // 购入成本：有 cost 的产业（矿业、地产、物流）加上已投入本金
      if (cat.cost) {
        val += cat.cost * qty;
        // 矿业许可证投入
        if (ind.type === 'mining' && cat.licenseCost && ind.licenseLevel) {
          val += cat.licenseCost * (ind.licenseLevel || 1);
        }
      }

      // 已实现利润 = 累计日产收入（不含任何预测成分）
      val += (ind.cumulativeProfit || 0);

      total += val;
    });
    // 仓库库存不并入净资产（已在产业累计利润中体现，避免重复计算）
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
            ? (1 + (ind.licenseLevel - 1) * 0.3) : 1;
          const prodRecipeSat = (ind.type === 'metall' && DATA.smelterRecipes[ind.category])
            ? Employees.smelterSatisfaction(ind.category, qty) : 1;
          const produceQty = cat.produces.qty * qty * (empMult || 0) * licenseMult * prodRecipeSat;
          const warehouseFree = window.Employees ? Employees.warehouseFree() : 0;
          const overflow = Math.max(0, produceQty - warehouseFree);
          if (overflow > 0) {
            const matPrice = window.Employees ? Employees.materialPrice(cat.produces.code) : 0;
            daily += Math.floor(matPrice * 0.98 * overflow);
          } else {
            const matPrice = window.Employees ? Employees.materialPrice(cat.produces.code) : 0;
            daily += produceQty * matPrice;
          }
        } else {
          // 无产出产业（地产/物流）：使用 dailyIncome
          daily = (cat.dailyIncome || 0) * qty * (empMult || 0) * (recipeSat || 1);
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
  /**
   * 计算单个产业的每日现金收入（含原料满足率折损）
   * 所有 UI 卡片 / 概览行统一调用此函数
   * @param {string} type   - 产业类型 (farm/metall/factory/mining/estate/logistics)
   * @param {string} category - 产业子类
   * @param {number} qty    - 数量
   * @param {object} [o]    - state 中的产业对象（可选，用于读 licenseLevel/products）
   * @returns {number} 每日现金收入（整数）
   */
  IndustryDailyIncome(type, category, qty, o) {
    if (!qty) qty = 1;
    const cat = State.findIndustryCategory(type, category);
    if (!cat) return 0;
    const empMult = Employees.multiplier(type, category);
    if (empMult <= 0) return 0;

    let recipeSat = 1.0;
    let licenseMult = 1.0;

    // 原料满足率（冶金 / 工厂）
    if (type === 'metall' && DATA.smelterRecipes[category]) {
      recipeSat = Employees.smelterSatisfaction(category, qty);
    } else if (type === 'factory' && DATA.factoryRecipes[category]) {
      recipeSat = Employees.recipeSatisfaction(category, qty);
    }

    // 采矿许可证
    if (type === 'mining' && o && o.licenseLevel > 1) {
      licenseMult = 1 + (o.licenseLevel - 1) * 0.3;
    }

    // 工厂产品系统（factoryDailyInternal 内部已含 recipeSat，不再重复乘）
    if (type === 'factory' && window.FactoryProducts && o && o.products) {
      const prodIncome = FactoryProducts.factoryDailyIncome(category);
      if (!isNaN(prodIncome) && prodIncome > 0) {
        return Math.round(prodIncome);
      }
    }

    // 有产出的产业（农业/矿业/冶金）
    if (cat.produces) {
      const produceQty = cat.produces.qty * qty * empMult * recipeSat * licenseMult;
      const matPrice = Employees.materialPrice(cat.produces.code);
      return Math.round(produceQty * matPrice);
    }

    // 无产出的产业（地产/物流）
    const levelMult = (type === 'farm' || type === 'mining' || type === 'metall')
      ? 1 : Engine.levelMultiplier((o && o.level) || 1);
    return Math.round((cat.dailyIncome || 0) * levelMult * qty * empMult * recipeSat);
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
