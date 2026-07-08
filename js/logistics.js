/* logistics.js — 物流系统：自动买卖规则管理、结算 */

const LogisticsSystem = {

  /* 等级效率加成：每升一级+20% */
  getLevelMultiplier(level) {
    return 1 + (level - 1) * 0.2;
  },

  /* 获取单个物流站的有效槽位数（含等级加成） */
  getEffectiveSlots(cat, level, quantity) {
    return Math.floor((cat.slots || 5) * (quantity || 1) * this.getLevelMultiplier(level || 1));
  },

  /* 获取物流总规则槽位（所有物流站的有效槽位之和） */
  getTotalSlots() {
    let slots = 0;
    (State.data.industries || []).forEach(ind => {
      if (ind.type !== 'logistics') return;
      const cat = State.findIndustryCategory('logistics', ind.category);
      if (cat) slots += this.getEffectiveSlots(cat, ind.level, ind.quantity);
    });
    return slots;
  },

  /* 已用槽位 */
  getUsedSlots() {
    return (State.data.logisticsRules || []).length;
  },

  /* 剩余槽位 */
  getFreeSlots() {
    return Math.max(0, this.getTotalSlots() - this.getUsedSlots());
  },

  /* 获取单个物流站的有效手续费率（含等级加成，等级越高手续费越低） */
  getEffectiveFeeRate(cat, level) {
    return (cat.feeRate || 0.02) / this.getLevelMultiplier(level || 1);
  },

  /* 最优手续费率（取所有物流站中最低的，含等级加成） */
  getBestFeeRate() {
    let best = 0.02;
    (State.data.industries || []).forEach(ind => {
      if (ind.type !== 'logistics') return;
      const cat = State.findIndustryCategory('logistics', ind.category);
      if (cat && cat.feeRate !== undefined) {
        const effective = this.getEffectiveFeeRate(cat, ind.level);
        if (effective < best) best = effective;
      }
    });
    return best;
  },

  /* 是否支持自动买入 */
  canAutoBuy() {
    return (State.data.industries || []).some(ind => {
      if (ind.type !== 'logistics') return false;
      const cat = State.findIndustryCategory('logistics', ind.category);
      return cat && cat.canBuy;
    });
  },

  /* 是否支持成品管理 */
  canManageFinished() {
    return (State.data.industries || []).some(ind => {
      if (ind.type !== 'logistics') return false;
      const cat = State.findIndustryCategory('logistics', ind.category);
      return cat && cat.finishedOnly;
    });
  },

  /* 是否支持高端物料（跨境物流站） */
  canManagePremium() {
    return (State.data.industries || []).some(ind => {
      if (ind.type !== 'logistics') return false;
      const cat = State.findIndustryCategory('logistics', ind.category);
      return cat && cat.premiumOnly;
    });
  },

  /* 物流站类型信息摘要 */
  getStationSummary() {
    const stations = [];
    (State.data.industries || []).forEach(ind => {
      if (ind.type !== 'logistics') return;
      const cat = State.findIndustryCategory('logistics', ind.category);
      if (cat) {
        stations.push({
          code: cat.code,
          name: cat.name,
          quantity: ind.quantity || 1,
          level: ind.level || 1,
          effectiveSlots: this.getEffectiveSlots(cat, ind.level, ind.quantity),
          effectiveFeeRate: this.getEffectiveFeeRate(cat, ind.level),
          rawFeeRate: cat.feeRate || 0.02,
          rawSlots: cat.slots || 5,
          canBuy: !!cat.canBuy,
          finishedOnly: !!cat.finishedOnly,
          premiumOnly: !!cat.premiumOnly
        });
      }
    });
    return stations;
  },

  /* 添加规则 */
  addRule(rule) {
    if (!State.data.logisticsRules) State.data.logisticsRules = [];
    State.data.logisticsRules.push(rule);
    State.save();
  },

  /* 删除规则 */
  removeRule(index) {
    if (!State.data.logisticsRules) return;
    if (index < 0 || index >= State.data.logisticsRules.length) return;
    State.data.logisticsRules.splice(index, 1);
    State.save();
  },

  /* 编辑规则（替换指定索引的规则） */
  editRule(index, newRule) {
    if (!State.data.logisticsRules) return;
    if (index < 0 || index >= State.data.logisticsRules.length) return;
    State.data.logisticsRules[index] = newRule;
    State.save();
  },

  /* 手续费后卖出价 */
  getSellPrice(materialCode) {
    const mat = DATA.rawMaterials.find(m => m.code === materialCode);
    if (!mat) return 0;
    const mktPrice = Employees.materialPrice(materialCode);
    const feeRate = this.getBestFeeRate();
    return mktPrice * (1 - feeRate);
  },

  /* ===== 每日结算 ===== */
  settle(log) {
    const rules = State.data.logisticsRules;
    if (!rules || !Array.isArray(rules) || rules.length === 0) return;
    if (!State.data.inventory) State.data.inventory = {};
    const inv = State.data.inventory;
    const feeRate = this.getBestFeeRate();

    rules.forEach(rule => {
      const mat = DATA.rawMaterials.find(m => m.code === rule.materialCode);
      if (!mat) return;

      const current = inv[rule.materialCode] || 0;

      // 自动卖出：库存超过阈值
      if (rule.type === 'sell_above' && current > rule.threshold) {
        const excess = current - rule.threshold;
        const sellQty = excess * (rule.percentage / 100);
        const actualQty = Math.min(sellQty, current);
        if (actualQty > 0.5) {
          const sellPrice = Employees.materialPrice(rule.materialCode) * (1 - feeRate);
          const cash = Math.floor(sellPrice * actualQty);
          inv[rule.materialCode] -= actualQty;
          if (inv[rule.materialCode] <= 0.01) delete inv[rule.materialCode];
          State.data.cash += cash;
          if (log) {
            log.details.push({ label: '🚛物流卖出 ' + mat.name + ' ' + actualQty.toFixed(0) + mat.unit, amount: cash, type: 'income' });
            log.income += cash;
          }
        }
      }

      // 自动买入：库存低于阈值
      if (rule.type === 'buy_below' && current < rule.threshold) {
        if (!this.canAutoBuy()) return;
        const shortage = rule.threshold - current;
        const buyQty = shortage * (rule.percentage / 100);
        if (buyQty < 0.5) return;
        const price = Employees.materialPrice(rule.materialCode);
        const totalCost = Math.floor(price * buyQty);
        if (State.data.cash >= totalCost) {
          const free = Employees.warehouseFree();
          const actualBuy = Math.min(buyQty, free);
          if (actualBuy > 0.5) {
            const cost = Math.floor(price * actualBuy);
            State.data.cash -= cost;
            inv[rule.materialCode] = (inv[rule.materialCode] || 0) + actualBuy;
            if (log) {
              log.details.push({ label: '🚛物流买入 ' + mat.name + ' ' + actualBuy.toFixed(0) + mat.unit, amount: -cost, type: 'expense' });
              log.expense += cost;
            }
          }
        }
      }
    });
  }
};

window.LogisticsSystem = LogisticsSystem;
