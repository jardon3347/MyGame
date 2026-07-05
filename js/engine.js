/* engine.js — 核心引擎：每日结算、价格波动、新闻触发 */

const Engine = {
  /* 等级倍率：每级 1.2x（上限 5 级） */
  levelMultiplier(level) {
    return (level || 1) * 1.2;
  },


  /* 推进 N 天 */
  advance(days) {
    const events = [];   // 收集期间触发的新闻
    const summaries = []; // 每日结算摘要

    for (let i = 0; i < days; i++) {
      const dayLog = this.advanceOneDay();
      summaries.push(dayLog);

      // 触发新闻（返回新闻对象或 null）
      const news = this.rollNews();
      if (news) {
        this.applyNewsEffects(news);
        if (!State.data.news) State.data.news = [];
        State.data.news.unshift({
          id: news.id,
          title: news.title,
          desc: news.desc,
          type: news.type,
          effects: news.effects,
          date: this.dateString(),
          day: State.data.date.totalDays
        });
        events.push(news);
        // 加速模式下遇事件暂停
        if (days > 1) break;
      }
    }

    State.save();
    return { summaries, events, completedDays: summaries.length };
  },

  /* 推进一天 */
  advanceOneDay() {
    const d = State.data.date;
    const log = { date: this.dateString(), day: d.totalDays, income: 0, expense: 0, details: [] };

    // ===== 产业链分阶段结算 =====
    // 阶段1：矿业+农业产出原料进仓库
    State.data.industries.forEach(ind => {
      if (ind.type !== 'mining' && ind.type !== 'farm') return;
      const empMult = Employees.multiplier(ind.type, ind.category);
      if (empMult <= 0) return;
      Employees.produceMaterials(ind, empMult, log);
    });

    // 阶段2：冶金消耗矿石→产出金属进仓库 + 现金收入
    State.data.industries.forEach(ind => {
      if (ind.type !== 'metall') return;
      const cat = State.findIndustryCategory(ind.type, ind.category);
      if (!cat) return;
      const qty = ind.quantity || 1;
      const empMult = Employees.multiplier(ind.type, ind.category);
      if (empMult <= 0) return;
      // 检查仓库矿石原料满足率
      let recipeSat = 1.0;
      if (DATA.smelterRecipes[ind.category]) {
        recipeSat = Employees.smelterSatisfaction(ind.category, qty);
        Employees.consumeSmelterMaterials(ind.category, qty, recipeSat);
      }
      // 现金收入
      let daily = cat.dailyIncome * Engine.levelMultiplier(ind.level || 1) * qty * empMult * recipeSat;
      if (d.dayOfWeek === 0 || d.dayOfWeek === 6) daily *= 0.5;
      State.data.cash += daily;
      log.income += daily;
      const empCnt = Employees.assignedCount(ind.type, ind.category);
      const satTag = recipeSat < 1 ? ` (原料${Math.round(recipeSat*100)}%)` : '';
      log.details.push({ label: `${cat.name}×${qty} 员工×${empCnt}${satTag}`, amount: daily, type: 'income' });
      // 产出金属进仓库
      Employees.produceMaterials(ind, empMult, log);
    });

    // 阶段3：工厂消耗农产品+金属→现金收入
    State.data.industries.forEach(ind => {
      if (ind.type !== 'factory') return;
      const cat = State.findIndustryCategory(ind.type, ind.category);
      if (!cat) return;
      const qty = ind.quantity || 1;
      const empMult = Employees.multiplier(ind.type, ind.category);
      if (empMult <= 0) return;
      // 检查仓库原料满足率
      let recipeSat = 1.0;
      if (DATA.factoryRecipes[ind.category]) {
        recipeSat = Employees.recipeSatisfaction(ind.category, qty);
        Employees.consumeFactoryMaterials(ind.category, qty, recipeSat);
      }
      let daily = cat.dailyIncome * Engine.levelMultiplier(ind.level || 1) * qty * empMult * recipeSat;
      if (d.dayOfWeek === 0 || d.dayOfWeek === 6) daily *= 0.5;
      State.data.cash += daily;
      log.income += daily;
      const empCnt = Employees.assignedCount(ind.type, ind.category);
      const satTag = recipeSat < 1 ? ` (原料${Math.round(recipeSat*100)}%)` : '';
      log.details.push({ label: `${cat.name}×${qty} 员工×${empCnt}${satTag}`, amount: daily, type: 'income' });
    });

    // 阶段4：无配方产业（纯现金收入，冶金/工厂已在阶段2/3结算过）
    State.data.industries.forEach(ind => {
      if (ind.type === 'metall' || ind.type === 'factory') return;
      const cat = State.findIndustryCategory(ind.type, ind.category);
      if (!cat) return;
      const qty = ind.quantity || 1;
      const empMult = Employees.multiplier(ind.type, ind.category);
      if (empMult <= 0) return;
      let daily = cat.dailyIncome * Engine.levelMultiplier(ind.level || 1) * qty * empMult;
      if (d.dayOfWeek === 0 || d.dayOfWeek === 6) daily *= 0.5;
      State.data.cash += daily;
      log.income += daily;
      const empCnt = Employees.assignedCount(ind.type, ind.category);
      log.details.push({ label: `${cat.name}×${qty} 员工×${empCnt}`, amount: daily, type: 'income' });
    });

    // 1b. 员工薪水（每日支出）
    const salary = Employees.totalSalary();
    if (salary > 0) {
      State.data.cash -= salary;
      log.expense += salary;
      log.details.push({ label: `员工薪水（${Employees.count()}人）`, amount: salary, type: 'expense' });
    }

    // 2. 存款利息（按当前浮动利率）
    const depoRate = State.data.interestRate || DATA.bank.baseRate;
    const interest = State.data.deposit * depoRate / 365;
    State.data.deposit += interest;
    log.income += interest;
    if (interest > 0) log.details.push({ label: `存款利息 (${(depoRate*100).toFixed(2)}%)`, amount: interest, type: 'income' });

    // 2b. 贷款利息
    if ((State.data.loan || 0) > 0) {
      const loanRate = depoRate * DATA.bank.loanRateMultiplier;
      const loanInterest = State.data.loan * loanRate / 365;
      State.data.cash -= loanInterest;
      log.expense += loanInterest;
      log.details.push({ label: `贷款利息 (${(loanRate*100).toFixed(2)}%)`, amount: loanInterest, type: 'expense' });
    }

    // 2c. 处理活跃效果到期
    this.processActiveEffects();

    // 2d. 利率自然波动（每日微小随机漂移）
    const drift = (Math.random() - 0.5) * 2 * (DATA.bank.rateDriftPerDay || 0.0003);
    State.data.interestRate = (State.data.interestRate || DATA.bank.baseRate) + drift;
    State.data.interestRate = Math.max(DATA.bank.rateMin, Math.min(DATA.bank.rateMax, State.data.interestRate));

    // 3. 产业维护成本（日均 1%，乘以数量）
    let maintenance = 0;
    State.data.industries.forEach(ind => {
      const cat = State.findIndustryCategory(ind.type, ind.category);
      if (cat) maintenance += cat.cost * 0.0001 * Engine.levelMultiplier(ind.level || 1) * (ind.quantity || 1);
    });
    State.data.cash -= maintenance;
    log.expense += maintenance;
    if (maintenance > 0) log.details.push({ label: '维护成本', amount: maintenance, type: 'expense' });

    // 4. 股价波动
    this.updateStockPrices(log);

    // 5. 贵金属价格波动
    this.updateMetalPrices(log);

    // 5b. 原料市场价格波动
    this.updateMaterialPrices();

    // 6. 推进日期
    this.advanceDate();
    log.net = log.income - log.expense;

    // 7. 大盘情绪衰减
    State.data.marketSentiment *= 0.9;

    return log;
  },

  /* 更新股票价格 */
  updateStockPrices(log) {
    DATA.stocks.forEach(s => {
      const oldPrice = State.data.stockPrices[s.code] || s.basePrice;
      // 基础波动 ±2%
      let change = (Math.random() - 0.5) * 0.04;
      // 大盘情绪
      change += State.data.marketSentiment;
      const newPrice = Math.max(0.1, oldPrice * (1 + change));
      State.data.stockPrices[s.code] = Math.round(newPrice * 100) / 100;
      // 追加历史
      if (!State.data.stockHistory) State.data.stockHistory = {};
      if (!State.data.stockHistory[s.code]) State.data.stockHistory[s.code] = [];
      const hist = State.data.stockHistory[s.code];
      const open = oldPrice;
      const close = State.data.stockPrices[s.code];
      hist.push({
        open: open,
        close: close,
        high: Math.max(open, close) * (1 + Math.random() * 0.015),
        low: Math.min(open, close) * (1 - Math.random() * 0.015),
        volume: Math.floor(500000 + Math.random() * 2000000)
      });
      if (hist.length > 60) hist.shift(); // 保留最近 60 天
    });
    // 基金价格（跟随对应行业，波动更小）
    if (!State.data.fundPrices) State.data.fundPrices = {};
    if (!State.data.fundHistory) State.data.fundHistory = {};
    DATA.funds.forEach(f => {
      const oldPrice = State.data.fundPrices[f.code] || f.basePrice;
      let change = (Math.random() - 0.5) * 0.02; // 基金波动小
      change += State.data.marketSentiment * 0.5;
      const newPrice = Math.max(0.1, oldPrice * (1 + change));
      State.data.fundPrices[f.code] = Math.round(newPrice * 10000) / 10000;
      if (!State.data.fundHistory[f.code]) State.data.fundHistory[f.code] = [];
      const hist = State.data.fundHistory[f.code];
      hist.push({ open: oldPrice, close: State.data.fundPrices[f.code],
                  high: Math.max(oldPrice, State.data.fundPrices[f.code]),
                  low: Math.min(oldPrice, State.data.fundPrices[f.code]) });
      if (hist.length > 60) hist.shift();
    });
  },

  /* 更新贵金属价格 */
  updateMetalPrices(log) {
    DATA.metals.forEach(m => {
      const oldPrice = State.data.metalPrices[m.code] || m.basePrice;
      let change = (Math.random() - 0.5) * m.volatility * 2;
      const newPrice = Math.max(0.1, oldPrice * (1 + change));
      State.data.metalPrices[m.code] = Math.round(newPrice * 100) / 100;
    });
  },

  /* 更新原料市场价格（每日波动 ±1.5%，受大盘情绪轻微影响） */
  updateMaterialPrices() {
    if (!State.data.materialPrices) State.data.materialPrices = {};
    DATA.rawMaterials.forEach(m => {
      const oldPrice = State.data.materialPrices[m.code] || m.price;
      let change = (Math.random() - 0.5) * 0.03; // ±1.5% 基础波动
      change += State.data.marketSentiment * 0.3; // 大盘情绪轻微传导
      const newPrice = Math.max(0.1, oldPrice * (1 + change));
      State.data.materialPrices[m.code] = Math.round(newPrice * 100) / 100;
    });
  },

  /* 推进日期 */
  advanceDate() {
    const d = State.data.date;
    d.totalDays++;
    const date = new Date(2018, 0, 1);
    date.setDate(date.getDate() + d.totalDays);
    d.year = date.getFullYear();
    d.month = date.getMonth() + 1;
    d.day = date.getDate();
    d.dayOfWeek = date.getDay();
    State.data.realDate = date.toISOString().slice(0, 10);
  },

  /* 日期字符串 */
  dateString() {
    const d = State.data.date;
    const wd = ['日','一','二','三','四','五','六'][d.dayOfWeek];
    return `${d.year}年${d.month}月${d.day}日 周${wd}`;
  },

  /* 触发新闻（确定性调度：每 3-5 天必定触发一次） */
  rollNews() {
    const d = State.data.date;
    const now = d.totalDays;

    // 初始化下次新闻日
    if (State.data.nextNewsDay == null) {
      State.data.nextNewsDay = now + 3 + Math.floor(Math.random() * 3);
    }

    // 还没到下次新闻触发日
    if (now < State.data.nextNewsDay) return null;

    // 获取当前可用的事件池（历史+预设+随机）
    const pool = getNewsPool(now);
    if (pool.length === 0) {
      // 无可用事件，推迟到明天再试
      State.data.nextNewsDay = now + 1;
      return null;
    }

    // 避免与最近 8 条重复
    const recentIds = (State.data.news || []).slice(0, 8).map(n => n.id);
    const fresh = pool.filter(n => !recentIds.includes(n.id));
    const pick = fresh.length > 0 ? fresh[Math.floor(Math.random() * fresh.length)]
                                  : pool[Math.floor(Math.random() * pool.length)];

    // 随机持续天数：3-7 天
    pick.duration = 3 + Math.floor(Math.random() * 5);

    // 设定下次新闻日：3-5 天后
    State.data.nextNewsDay = now + 3 + Math.floor(Math.random() * 3);
    State.data.lastNewsDay = now;

    return pick;
  },

  /* 应用新闻影响：存储为活跃效果（带持续天数） */
  applyNewsEffects(news) {
    const e = news.effects;
    if (!e) return;

    const duration = news.duration || 4;
    const now = State.data.date.totalDays;

    // 立即应用一次效果
    if (e.sectors) {
      Object.entries(e.sectors).forEach(([code, pct]) => { this._applySectorEffect(code, pct); });
    }
    if (e.metals) {
      Object.entries(e.metals).forEach(([code, pct]) => { this._applyMetalEffect(code, pct); });
    }
    if (e.materials) {
      Object.entries(e.materials).forEach(([code, pct]) => { this._applyMaterialEffect(code, pct); });
    }
    if (e.marketSentiment != null) {
      State.data.marketSentiment = (State.data.marketSentiment || 0) + e.marketSentiment;
      State.data.marketSentiment = Math.max(-0.05, Math.min(0.05, State.data.marketSentiment));
    }
    if (e.interestRate != null) {
      State.data.interestRate = (State.data.interestRate || DATA.bank.baseRate) + e.interestRate;
      State.data.interestRate = Math.max(DATA.bank.rateMin, Math.min(DATA.bank.rateMax, State.data.interestRate));
    }

    // 存入活跃效果列表
    if (!State.data.activeEffects) State.data.activeEffects = [];
    e._origDuration = duration;
    State.data.activeEffects.push({
      id: news.id + '_' + now,
      title: news.title,
      effects: e,
      duration: duration,
      remainingDays: duration,
      startDay: now
    });
  },

  /* 每日处理活跃效果：减天数，到期反转利率和情绪 */
  processActiveEffects() {
    if (!State.data.activeEffects) State.data.activeEffects = [];
    State.data.activeEffects = State.data.activeEffects.filter(eff => {
      eff.remainingDays--;
      if (eff.remainingDays <= 0) {
        const e = eff.effects;
        if (e.marketSentiment != null) {
          State.data.marketSentiment = (State.data.marketSentiment || 0) - e.marketSentiment;
          State.data.marketSentiment = Math.max(-0.05, Math.min(0.05, State.data.marketSentiment));
        }
        if (e.interestRate != null) {
          State.data.interestRate = (State.data.interestRate || DATA.bank.baseRate) - e.interestRate;
          State.data.interestRate = Math.max(DATA.bank.rateMin, Math.min(DATA.bank.rateMax, State.data.interestRate));
        }
        return false;
      }
      return true;
    });
  },

  _applySectorEffect(code, pct) {
    const sector = DATA.sectorMap[code];
    if (!sector) return;
    Object.entries(DATA.stockSectorMap).forEach(([stockCode, stockSector]) => {
      if (sector.includes(stockSector)) {
        const stock = DATA.stocks.find(s => s.code === stockCode);
        const old = State.data.stockPrices[stockCode] || (stock ? stock.basePrice : 1);
        State.data.stockPrices[stockCode] = Math.round(old * (1 + pct) * 100) / 100;
      }
    });
    if (State.data.fundPrices) {
      DATA.funds.forEach(f => {
        if (sector.includes(f.sector) || f.sector === 'mixed' || f.sector === 'index') {
          const old = State.data.fundPrices[f.code] || f.basePrice;
          State.data.fundPrices[f.code] = Math.round(old * (1 + pct * 0.6) * 10000) / 10000;
        }
      });
    }
    const matCodeMap = { rare: 'rare_earth', precious: 'precious_m', phos: 'phos_ore', quartz: 'quartz_ore' };
    const matCode = matCodeMap[code] || code;
    const mat = DATA.rawMaterials.find(m => m.code === matCode);
    if (mat) {
      if (!State.data.materialPrices) State.data.materialPrices = {};
      const oldMat = State.data.materialPrices[matCode] || mat.price;
      State.data.materialPrices[matCode] = Math.round(oldMat * (1 + pct) * 100) / 100;
    }
  },

  _applyMetalEffect(code, pct) {
    const m = DATA.metals.find(x => x.code === code);
    if (!m) return;
    const old = State.data.metalPrices[code] || m.basePrice;
    State.data.metalPrices[code] = Math.round(old * (1 + pct) * 100) / 100;
  },

  _applyMaterialEffect(code, pct) {
    const mat = DATA.rawMaterials.find(m => m.code === code);
    if (!mat) return;
    if (!State.data.materialPrices) State.data.materialPrices = {};
    const oldMat = State.data.materialPrices[code] || mat.price;
    State.data.materialPrices[code] = Math.round(oldMat * (1 + pct) * 100) / 100;
  },

  /* 获取新闻影响标签 */
  getNewsTags(news) {
    const tags = [];
    if (!news || !news.effects) return tags;
    if (news.effects.sectors) {
      Object.entries(news.effects.sectors).forEach(([code, pct]) => {
        const cat = this.findCategoryByCode(code);
        if (cat) tags.push({ label: `${cat.name} ${State.formatPct(pct)}`, type: pct >= 0 ? 'up' : 'down' });
      });
    }
    if (news.effects.metals) {
      Object.entries(news.effects.metals).forEach(([code, pct]) => {
        const m = DATA.metals.find(x => x.code === code);
        if (m) tags.push({ label: `${m.name} ${State.formatPct(pct)}`, type: pct >= 0 ? 'up' : 'down' });
      });
    }
    if (news.effects.materials) {
      Object.entries(news.effects.materials).forEach(([code, pct]) => {
        const mat = DATA.rawMaterials.find(m => m.code === code);
        if (mat) tags.push({ label: `${mat.name} ${State.formatPct(pct)}`, type: pct >= 0 ? 'up' : 'down' });
      });
    }
    if (news.effects.interestRate) {
      tags.push({ label: `利率 ${State.formatPct(news.effects.interestRate)}`, type: news.effects.interestRate >= 0 ? 'up' : 'down' });
    }
    if (news.effects.marketSentiment) {
      tags.push({ label: `大盘 ${State.formatPct(news.effects.marketSentiment)}`, type: news.effects.marketSentiment >= 0 ? 'up' : 'down' });
    }
    if (news.duration) {
      tags.push({ label: `持续 ${news.duration} 天`, type: 'info' });
    }
    return tags;
  },

  /* 反查品类 */
  findCategoryByCode(code) {
    for (const type in DATA.industries) {
      const cat = DATA.industries[type].categories.find(c => c.code === code);
      if (cat) return cat;
    }
    // 贵金属
    const m = DATA.metals.find(x => x.code === code);
    if (m) return m;
    return null;
  }
};

window.Engine = Engine;
