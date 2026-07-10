/* competitors.js — 竞争对手与排名系统 v2：真实产业组合 + 策略AI */

const Competitors = {

  definitions: [
    {
      id: "huahai", name: "华海集团", style: "aggressive",
      desc: "激进扩张，偏好矿业能源",
      industries: ["mining", "estate"],
      startCash: 300000, employeeMult: 1.3,
      startPortfolio: [
        { type: "mining", category: "coal", qty: 2 },
        { type: "mining", category: "iron", qty: 1 }
      ]
    },
    {
      id: "xinsheng", name: "鑫盛资本", style: "steady",
      desc: "稳扎稳打，偏好地产物流",
      industries: ["estate", "logistics"],
      startCash: 400000, employeeMult: 1.5,
      startPortfolio: [
        { type: "estate", category: "farmland", qty: 2 },
        { type: "estate", category: "residential", qty: 1 }
      ]
    },
    {
      id: "hongyuan", name: "鸿远实业", style: "focused",
      desc: "深耕单一赛道，偏好高价值矿",
      industries: ["mining"],
      startCash: 200000, employeeMult: 1.4,
      startPortfolio: [
        { type: "mining", category: "iron", qty: 2 }
      ]
    }
  ],

  /* 风格配置 */
  _styleConfig: {
    aggressive: {
      label: "激进扩张", icon: "🔥", color: "var(--up)",
      maxSlotsBase: 4,          // 初始仓位上限
      slotsPerMonth: 1.2,       // 每月+1.2个仓位
      reinvestPct: 0.70,        // 70%收入再投资
      buyInterval: 3,           // 每3天考虑买一次
      targetTypes: ["mining"],  // 偏好矿业
      preferNew: false          // 不介意同品类加仓
    },
    steady: {
      label: "稳健经营", icon: "🛡️", color: "var(--info)",
      maxSlotsBase: 3,
      slotsPerMonth: 0.8,
      reinvestPct: 0.50,
      buyInterval: 6,
      targetTypes: ["estate", "logistics"],
      preferNew: true           // 偏好分散
    },
    focused: {
      label: "专注深耕", icon: "🎯", color: "var(--warning)",
      maxSlotsBase: 3,
      slotsPerMonth: 1.0,
      reinvestPct: 0.65,
      buyInterval: 4,
      targetTypes: ["mining"],
      preferNew: false
    }
  },

  /* ===== 初始化 ===== */
  init() {
    if (State.data.competitors && State.data.competitors.length > 0) {
      State.data.competitors.forEach(c => {
        const def = this.definitions.find(d => d.id === c.id);
        // 修复老存档：丢失的 portfolio 从定义填充
        if (!c.portfolio || c.portfolio.length === 0) {
          c.portfolio = def ? def.startPortfolio.map(p => ({ ...p })) : [];
        }
        // 修复老存档：丢失的起始现金
        if (c.cash === undefined || c.cash === 0) {
          c.cash = def ? def.startCash : 500000;
        }
        // licenseLevel 兼容
        c.portfolio.forEach(item => {
          if (item.type === 'mining' && !item.licenseLevel) item.licenseLevel = 1;
        });
        if (c.employeeMult === undefined) c.employeeMult = def ? def.employeeMult : 1.3;
        if (c.cumulativeProfit === undefined) c.cumulativeProfit = 0;
        if (c.lastBuyDay === undefined) c.lastBuyDay = -10;
        // 重建资产估值（当 assets 为 0 时，说明是刚修复的老存档）
        if (!c.assets || c.assets === 0) {
          this._recalcAssets(c);
        }
      });
      return;
    }
    State.data.competitors = this.definitions.map(def => ({
      id: def.id,
      name: def.name,
      style: def.style,
      desc: def.desc,
      cash: def.startCash,
      employeeMult: def.employeeMult,
      industries: [...def.industries],
      portfolio: def.startPortfolio.map(p => ({ ...p })),
      cumulativeProfit: 0,
      lastBuyDay: -10,
      history: [],
      lastChange: 0,
      lastAction: "成立"
    }));
  },

  /* 获取当前可持有的最大仓位 */
  _maxSlots(comp) {
    const cfg = this._styleConfig[comp.style] || this._styleConfig.steady;
    const day = (State.data.date || {}).totalDays || 0;
    const months = day / 30;
    return Math.round(cfg.maxSlotsBase + cfg.slotsPerMonth * months);
  },

  /* 重新估算资产（基于持仓成本价） */
  _recalcAssets(comp) {
    let invested = 0;
    (comp.portfolio || []).forEach(item => {
      const cat = State.findIndustryCategory(item.type, item.category);
      if (!cat) return;
      const q = item.qty || 1;
      if (cat.cost) {
        invested += cat.cost * q;
        if (item.type === 'mining' && cat.licenseCost) {
          invested += cat.licenseCost * (item.licenseLevel || 1);
        }
      }
    });
    comp.assets = (comp.cash || 0) + invested + (comp.cumulativeProfit || 0);
  },

  /* 计算单个产业的日产收入（使用动态员工倍率） */
  _dailyIncome(type, category, qty, empMult, licenseLevel, day) {
    const cat = State.findIndustryCategory(type, category);
    if (!cat) return 0;

    // 动态员工倍率：随天数增长（从1.3×起，每天+0.5%，第1000天≈6.8×）
    const dynamicEmp = empMult * (1 + day * 0.005);

    // 无产出产业（地产/物流）：按投资回报率
    if (!cat.produces) {
      const roi = cat.cost ? (cat.cost * qty * 0.004) : 0; // 0.4%/天 ≈ 146%/年
      // 同时保留基础收入作为保底
      const baseInc = (cat.dailyIncome || 0) * qty * dynamicEmp * 8;
      return Math.round(Math.max(roi, baseInc));
    }

    // 有产出产业：按产出量 × 市价
    let licenseM = 1;
    if (type === "mining" && licenseLevel && licenseLevel > 1) {
      licenseM = 1 + (licenseLevel - 1) * 0.3;
    }
    const produceQty = cat.produces.qty * qty * dynamicEmp * licenseM;
    const matPrice = Employees.materialPrice(cat.produces.code);
    return Math.round(produceQty * matPrice);
  },

  /* ===== 每日更新 ===== */
  updateDaily() {
    this.init();
    const phase = (State.data.economicPhase || "stable");
    const phaseMult = { prosperity: 1.2, stable: 1.0, recession: 0.8, depression: 0.5 }[phase] || 1.0;
    const day = (State.data.date || {}).totalDays || 0;

    State.data.competitors.forEach(comp => {
      const cfg = this._styleConfig[comp.style] || this._styleConfig.steady;

      // 1. 今日产业收入
      let dailyInc = 0;
      let investedValue = 0;
      comp.portfolio.forEach(item => {
        const inc = this._dailyIncome(item.type, item.category, item.qty || 1, comp.employeeMult, item.licenseLevel || 1, day);
        dailyInc += inc;
        const cat = State.findIndustryCategory(item.type, item.category);
        if (cat && cat.cost) {
          investedValue += cat.cost * (item.qty || 1);
          if (item.type === "mining" && cat.licenseCost) {
            investedValue += cat.licenseCost * (item.licenseLevel || 1) * (item.qty || 1);
          }
        }
      });

      // 2. 资产收益：总资产产生的金融回报（0.3%/天，让资金不会闲置）
      const assetIncome = Math.round((comp.assets || 0) * 0.003);

      dailyInc = Math.round((dailyInc + assetIncome) * phaseMult);

      // 3. 扣员工薪水（占比越来越小，不影响成长）
      const slotCount = comp.portfolio.reduce((s, p) => s + (p.qty || 1), 0);
      const empCount = Math.max(2, Math.round(slotCount * 1.5));
      const salary = Math.round(empCount * comp.employeeMult * 120);
      const netInc = dailyInc - salary;

      comp.cash = Math.max(0, comp.cash + netInc);
      if (netInc > 0) comp.cumulativeProfit += netInc;
      comp.lastChange = netInc;

      // 4. 投资决策
      comp.lastBuyDay = comp.lastBuyDay || -10;
      const maxSlots = this._maxSlots(comp);
      const canBuy = slotCount < maxSlots && (day - comp.lastBuyDay >= (cfg.buyInterval || 3));

      if (canBuy) {
        const result = this._tryBuy(comp, cfg);
        if (result) {
          comp.lastBuyDay = day;
          comp.lastAction = "买入" + result;
        } else {
          comp.lastAction = netInc >= 0 ? "观望(仓位满)" : "回血中";
        }
      } else if (slotCount >= maxSlots) {
        comp.lastAction = "仓位已满(" + slotCount + "/" + maxSlots + ")";
      } else {
        comp.lastAction = netInc >= 0 ? "日盈利" : "日亏损";
      }

      // 5. 资产 = 现金 + 持仓价值 + 累计利润
      comp.assets = comp.cash + investedValue + comp.cumulativeProfit;

      // 竞争保底：随着时间推移，对手资产不低于玩家的一个比例
      // 第 100 天 ≈ 10%，第 500 天 ≈ 30%，第 1000 天 ≈ 50%
      if (window.State && State.totalAssets) {
        const playerAssets = State.totalAssets();
        if (playerAssets > 0 && day > 50) {
          const floorRatio = Math.min(0.5, day * 0.0005);
          const floor = Math.floor(playerAssets * floorRatio);
          if (comp.assets < floor) {
            // 补差直接加进资产
            comp.assets = floor;
          }
        }
      }

      // 6. 历史
      if (day % 10 === 0) {
        comp.history.push({ day, assets: comp.assets });
        if (comp.history.length > 50) comp.history.shift();
      }
    });
  },

  /* 尝试买入 */
  _tryBuy(comp, cfg) {
    const options = [];

    if (cfg.targetTypes.includes("mining")) {
      DATA.industries.mining.categories.forEach(cat => {
        const alreadyOwn = comp.portfolio.find(p => p.type === "mining" && p.category === cat.code);
        const total = cat.cost + (alreadyOwn ? 0 : (cat.licenseCost || 0));
        // 留存30%现金作为安全垫
        if (comp.cash * 0.7 >= total) {
          options.push({
            type: "mining", category: cat.code, name: cat.name, cost: total,
            isNew: !alreadyOwn
          });
        }
      });
    }

    if (cfg.targetTypes.includes("estate")) {
      DATA.industries.estate.categories.forEach(cat => {
        if (comp.cash * 0.7 >= cat.cost) {
          options.push({ type: "estate", category: cat.code, name: cat.name, cost: cat.cost, isNew: true });
        }
      });
    }

    if (cfg.targetTypes.includes("logistics")) {
      DATA.industries.logistics.categories.forEach(cat => {
        if (comp.cash * 0.7 >= cat.cost) {
          options.push({ type: "logistics", category: cat.code, name: cat.name, cost: cat.cost, isNew: true });
        }
      });
    }

    if (options.length === 0) return null;

    // 选中策略
    const ownedCodes = new Set(comp.portfolio.map(p => p.category));
    let pick;
    if (cfg.preferNew) {
      // 稳健型：优先买没买过的品类
      const newOpts = options.filter(o => o.isNew);
      if (newOpts.length > 0 && Math.random() < 0.7) {
        pick = newOpts[Math.floor(Math.random() * newOpts.length)];
      } else {
        pick = options[Math.floor(Math.random() * options.length)];
      }
    } else {
      // 激进/专注型：均价买入
      pick = options[Math.floor(Math.random() * options.length)];
    }

    if (!pick || comp.cash < pick.cost) return null;
    comp.cash -= pick.cost;

    const existing = comp.portfolio.find(p => p.type === pick.type && p.category === pick.category);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      comp.portfolio.push({
        type: pick.type, category: pick.category, qty: 1,
        licenseLevel: pick.type === "mining" ? 1 : undefined
      });
    }
    return pick.name;
  },

  /* ===== 排名 ===== */
  getRanking() {
    const playerAssets = (State.totalAssets && State.totalAssets()) || 0;
    const comps = (State.data.competitors || []).map(c => ({
      name: c.name, assets: c.assets, style: c.style,
      lastChange: c.lastChange || 0, lastAction: c.lastAction || ""
    }));
    return [
      { name: "你的集团", assets: playerAssets, isPlayer: true },
      ...comps
    ].sort((a, b) => b.assets - a.assets);
  },

  getRankText() {
    const r = this.getRanking();
    return "第 " + (r.findIndex(x => x.isPlayer) + 1) + " / " + r.length + " 名";
  },

  getOpponent(rank) {
    const r = this.getRanking();
    return (rank >= 1 && rank <= r.length) ? r[rank - 1] : null;
  },

  getPlayerRankChange() {
    const cur = this.getRanking();
    const pr = cur.findIndex(r => r.isPlayer) + 1;
    if (State.data.lastPlayerRank == null) { State.data.lastPlayerRank = pr; return 0; }
    const ch = State.data.lastPlayerRank - pr;
    State.data.lastPlayerRank = pr;
    return ch;
  }
};

window.Competitors = Competitors;
