/* engine.js — 核心引擎：每日结算、价格波动、新闻触发 */

const Engine = {
  /* 等级倍率：每级 1.2x（上限 5 级） */
  levelMultiplier(level) {
    return (level || 1) * 1.2;
  },

  /* 工厂秒级结算（3 秒一批，由 TimeManager 每 3 秒调用）
     不推进日期、不触发新闻、不更新股价、不计入 daily log */
  factoryTick() {
    if (!State.data) return;
    State.data.industries.forEach(ind => {
      if (ind.type !== 'factory') return;
      const empMult = Employees.multiplier(ind.type, ind.category);
      if (empMult <= 0) return;
      // 没有产品分配则跳过
      if (!ind.products || Object.keys(ind.products).length === 0) return;
      const levelMult = Engine.levelMultiplier(ind.level || 1);
      // 检查是否有正数的产品分配
      let hasAlloc = false;
      Object.values(ind.products).forEach(v => { if (v > 0) hasAlloc = true; });
      if (!hasAlloc) return;
      const batchIncome = FactoryProducts.produceBatch(ind, empMult, levelMult);
      if (batchIncome > 0) {
        State.data.cash += batchIncome;
      }
    });
    State.save();
  },


  /* 破产检测：返回 true 表示破产 */
  checkBankruptcy() {
    const s = State.data;
    // 计算总资产
    let totalAssets = (s.cash || 0) + (s.deposit || 0);
    // 股票市值
    (s.stocks || []).forEach(st => {
      totalAssets += (st.shares || 0) * (s.stockPrices[st.code] || 0);
    });
    // 基金市值
    (s.fundHoldings || []).forEach(h => {
      totalAssets += (h.shares || 0) * (s.fundPrices[h.code] || 0);
    });
    // 贵金属市值
    (s.metals || []).forEach(m => {
      totalAssets += (m.grams || 0) * (s.metalPrices[m.code] || 0);
    });
    // 总负债
    const totalDebt = Math.abs(s.loan || 0);
    // 净资产 = 总资产 - 总负债
    const netWorth = totalAssets - totalDebt;
    // 破产阈值：净资产低于 -50000
    if (netWorth < -50000) {
      this.showGameOver(netWorth);
      return true;
    }
    return false;
  },

  /* 游戏结束画面 */
  showGameOver(netWorth) {
    const s = State.data;
    const days = s.date.totalDays || 0;
    const years = (days / 365).toFixed(1);
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
      <div class="page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;padding:20px;">
        <div style="font-size:48px;margin-bottom:16px;">\u2620\uFE0F</div>
        <div style="font-size:24px;font-weight:700;color:var(--down);margin-bottom:8px;">\u7834\u4EA7\u6E38\u620F\u7ED3\u675F</div>
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;text-align:center;line-height:1.8;">
          \u5728\u7ECF\u8425 ${years} \u5E74\uFF08${days} \u5929\uFF09\u540E\uFF0C<br>
          \u516C\u53F8\u51C0\u8D44\u4EA7\u8D1F\u503C ${State.formatMoney(netWorth)}<br>
          \u5DF2\u65E0\u6CD5\u7EE7\u7EED\u8FD0\u8425\u3002
        </div>
        <div style="background:var(--bg-soft);border-radius:8px;padding:16px;width:100%;max-width:300px;margin-bottom:24px;">
          <div class="list-row" style="margin-bottom:4px;">
            <span class="list-label">\u73B0\u91D1</span>
            <span class="list-value ${s.cash >= 0 ? '' : 'down'}">${State.formatMoney(s.cash)}</span>
          </div>
          <div class="list-row" style="margin-bottom:4px;">
            <span class="list-label">\u8D37\u6B3E</span>
            <span class="list-value down">${State.formatMoney(s.loan || 0)}</span>
          </div>
          <div class="list-row" style="margin-bottom:4px;">
            <span class="list-label">\u5B58\u6B3E</span>
            <span class="list-value">${State.formatMoney(s.deposit || 0)}</span>
          </div>
          <div class="list-row">
            <span class="list-label">\u51C0\u8D44\u4EA7</span>
            <span class="list-value ${netWorth >= 0 ? 'up' : 'down'}">${State.formatMoney(netWorth)}</span>
          </div>
        </div>
        <button class="btn primary" style="width:100%;max-width:300px;" onclick="State.reset()">\u91CD\u65B0\u5F00\u59CB</button>
      </div>
    `;
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

    // 破产则停止推进
    if (State.data && State.data.cash < -100000) {
      this.checkBankruptcy();
      return { summaries, events, completedDays: summaries.length };
    }
    State.save();
    return { summaries, events, completedDays: summaries.length };
  },

  /* 深拷贝当前存档（用于事务回滚） */
  _snapshot() {
    return JSON.stringify(State.data);
  },

  /* 还原存档快照 */
  _restore(snapshot) {
    try {
      State.data = JSON.parse(snapshot);
    } catch (e) {
      // 解析失败时保持现状，避免二次破坏
    }
  },

  /* 推进一天 */
  advanceOneDay() {
    const d = State.data.date;
    const log = { date: this.dateString(), day: d.totalDays, income: 0, expense: 0, details: [] };

    // ===== 产业链分阶段结算 =====
    // 阶段1：矿业+农业产出原料进仓库
    State.data.industries.forEach(ind => {
      if (ind.type !== 'mining' && ind.type !== 'farm') return;
      // 采矿许可证检查：无许可证不产出
      if (ind.type === 'mining' && (!ind.licenseLevel || ind.licenseLevel <= 0)) return;
      const empMult = Employees.multiplier(ind.type, ind.category);
      if (empMult <= 0) return;
      const licenseMult1 = (ind.type === 'mining' && ind.licenseLevel && ind.licenseLevel > 1)
        ? (1 + (ind.licenseLevel - 1) * 0.2) : 1;
        Employees.produceMaterials(ind, empMult, log, licenseMult1);
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
      // 现金收入 = 产出量 × 市场价
      const produceCode = cat.produces ? cat.produces.code : null;
      const produceQty = cat.produces ? cat.produces.qty * qty * empMult * (recipeSat || 1) : 0;
      const matPrice = produceCode ? Employees.materialPrice(produceCode) : 0;
      let daily = produceQty * matPrice;
      if (d.dayOfWeek === 0 || d.dayOfWeek === 6) daily *= 0.5;
      State.data.cash += daily;
      log.income += daily;
      const empCnt = Employees.assignedCount(ind.type, ind.category);
      const satTag = recipeSat < 1 ? ` (原料${Math.round(recipeSat*100)}%)` : '';
      log.details.push({ label: `${cat.name}×${qty} 员工×${empCnt}${satTag}`, amount: daily, type: 'income' });
      // 产出金属进仓库
      Employees.produceMaterials(ind, empMult, log);
    });

    // 阶段3：工厂产品系统（已由 3 秒实时结算替代，此处跳过）
    // （保留空循环避免影响阶段编号，但不再执行工厂生产）

    // 阶段4：无配方产业（纯现金收入，冶金/工厂已在阶段2/3结算过）
    State.data.industries.forEach(ind => {
      if (ind.type === 'metall' || ind.type === 'factory') return;
      const cat = State.findIndustryCategory(ind.type, ind.category);
      if (!cat) return;
      const qty = ind.quantity || 1;
      const empMult = Employees.multiplier(ind.type, ind.category);
      if (empMult <= 0) return;
      // 产出类产业已通过 produceMaterials 处理（进仓库+溢出卖现）
      // 此处只保留无产出产业的 dailyIncome
      if (!cat.produces) {
        let daily = (cat.dailyIncome || 0) * Engine.levelMultiplier(ind.level || 1) * qty * empMult;
        if (d.dayOfWeek === 0 || d.dayOfWeek === 6) daily *= 0.5;
        State.data.cash += daily;
        log.income += daily;
        const empCnt = Employees.assignedCount(ind.type, ind.category);
        log.details.push({ label: `${cat.name}×${qty} 员工×${empCnt}`, amount: daily, type: 'income' });
      }
    });

    // 1b. 员工薪水（每日支出）
    // 阶段5：物流结算（自动卖出/自动买入）
    if (window.LogisticsSystem) {
      LogisticsSystem.settle(log);
      // 统计物流产业真实收支
      let logisticsIncome = 0, logisticsExpense = 0;
      log.details.forEach(d => {
        if (d.label.startsWith('🚛物流')) {
          if (d.type === 'income') logisticsIncome += d.amount;
          else if (d.type === 'expense') logisticsExpense += d.amount;
        }
      });
      State.data.lastLogisticsIncome = logisticsIncome;
      State.data.lastLogisticsExpense = logisticsExpense;
    }
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
      const credit = DATA.bank.creditRatings[State.data.creditRating] || DATA.bank.creditRatings[State.data.defaultCredit || 'B'];
      const loanRateMultiplier = credit ? credit.rateMultiplier : DATA.bank.loanRateMultiplier;
      const loanRate = depoRate * loanRateMultiplier;
      const loanInterest = State.data.loan * loanRate / 365;
      State.data.cash -= loanInterest;
      log.expense += loanInterest;
      log.details.push({ label: `贷款利息 (${(loanRate*100).toFixed(2)}%)`, amount: loanInterest, type: 'expense' });
    }

    // 2b+. 信用评级每日更新
    this.updateCreditRating();

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
      if (!cat || !cat.cost) return;
      let cost = cat.cost * 0.0001 * Engine.levelMultiplier(ind.level || 1) * (ind.quantity || 1);
      // 矿业：许可证等级降低维护成本 — 每级 -10%
      if (ind.type === 'mining' && ind.licenseLevel && ind.licenseLevel > 1) {
        cost = cost / (1 + (ind.licenseLevel - 1) * 0.1);
      }
      maintenance += cost;
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

    // 8. 破产检测
    if (this.checkBankruptcy()) {
      return log;
    }

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

  /* 每日更新信用评级 */
  updateCreditRating() {
    const s = State.data;
    const bank = DATA.bank;
    const ratings = bank.creditRatings;
    if (!ratings) return;
    const keys = ['A','B','C','D'];
    if (s.loan === 0 || !s.loan) {
      s.creditDaysWithoutLoan = (s.creditDaysWithoutLoan || 0) + 1;
    } else {
      s.creditDaysWithoutLoan = 0;
    }
    // 升级检测
    if (s.creditDaysWithoutLoan >= bank.creditUpgradeDays && s.creditRating !== 'A') {
      const idx = keys.indexOf(s.creditRating || bank.defaultCredit);
      if (idx > 0) {
        s.creditRating = keys[idx - 1];
        // 通知玩家
        if (!s._silentCredit) {
          State.data.news = State.data.news || [];
          s.news.unshift({ id: 'cr_up_' + Date.now(), title: '信用评级提升', desc: '连续无贷款表现良好，信用评级升至 ' + ratings[s.creditRating].name, type: 'info', date: this.dateString(), day: s.date.totalDays });
        }
        s.creditDaysWithoutLoan = 0;
      }
    }
    // 降级检测（loan > 0 连续 creditDowngradeDays 天）
    if ((s.loan || 0) > 0) {
      s._creditLoanDays = (s._creditLoanDays || 0) + 1;
    } else {
      s._creditLoanDays = 0;
    }
    if ((s._creditLoanDays || 0) >= bank.creditDowngradeDays && s.creditRating !== 'D') {
      const idx = keys.indexOf(s.creditRating || bank.defaultCredit);
      if (idx >= 0 && idx < keys.length - 1) {
        s.creditRating = keys[idx + 1];
        s._creditLoanDays = 0;
      }
    }
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
    if (e.products) {
      const origMults = {};
      Object.entries(e.products).forEach(([prodCode, mult]) => {
        const current = (State.data.productPriceMultipliers || {})[prodCode] || 1;
        origMults[prodCode] = current;
        if (!State.data.productPriceMultipliers) State.data.productPriceMultipliers = {};
        State.data.productPriceMultipliers[prodCode] = Math.round(current * mult * 100) / 100;
      });
      e._origProductMults = origMults;
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
        if (e._origProductMults) {
          Object.entries(e._origProductMults).forEach(([prodCode, origMult]) => {
            if (State.data.productPriceMultipliers) {
              State.data.productPriceMultipliers[prodCode] = origMult;
              if (State.data.productPriceMultipliers[prodCode] === 1) {
                delete State.data.productPriceMultipliers[prodCode];
              }
            }
          });
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
