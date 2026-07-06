/* logistics.js — 物流系统：自动买卖规则管理、结算 */

const LogisticsSystem = {

  /* 获取物流总规则槽位（所有物流站的 slots × 数量） */
  getTotalSlots() {
    let slots = 0;
    (State.data.industries || []).forEach(ind => {
      if (ind.type !== 'logistics') return;
      const cat = State.findIndustryCategory('logistics', ind.category);
      if (cat) slots += (cat.slots || 5) * (ind.quantity || 1);
    });
    return slots;
  },

  /* 已用槽位 */
  getUsedSlots() {
    return (State.data.logisticsRules || []).length;
  },

  /* 最优手续费率（取所有物流站中最低的） */
  getBestFeeRate() {
    let best = 0.02; // 默认2%
    (State.data.industries || []).forEach(ind => {
      if (ind.type !== 'logistics') return;
      const cat = State.findIndustryCategory('logistics', ind.category);
      if (cat && cat.feeRate && cat.feeRate < best) best = cat.feeRate;
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

  /* 物流站类型信息摘要 */
  getStationSummary() {
    const stations = [];
    (State.data.industries || []).forEach(ind => {
      if (ind.type !== 'logistics') return;
      const cat = State.findIndustryCategory('logistics', ind.category);
      if (cat) {
        stations.push({
          name: cat.name,
          quantity: ind.quantity || 1,
          level: ind.level || 1,
          slots: (cat.slots || 5) * (ind.quantity || 1),
          feeRate: cat.feeRate || 0.02,
          canBuy: !!cat.canBuy,
          finishedOnly: !!cat.finishedOnly
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
    if (!rules || rules.length === 0) return;
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
          const sellPrice = mat.price * (1 - feeRate);
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
