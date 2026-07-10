/* employees.js — 员工系统：每人独立，有名字有加成 */
import { DATA } from './data.js';
import { State } from './state.js';
import { Engine } from './engine.js';
import { FactoryProducts } from './factoryProducts.js';
import { UI, Router } from './ui.js';

export const Employees = {

  /* 百家姓 */
  _surnames: ['王','李','张','刘','陈','杨','黄','赵','吴','周','徐','孙','马','胡','朱','郭','何','高','林','罗'],
  _givenNames: ['伟','芳','娜','敏','静','丽','强','磊','洋','勇','艳','杰','娟','涛','明','超','霞','平','峰','鑫'],

  _randomName() {
    return this._surnames[Math.floor(Math.random() * this._surnames.length)] +
           this._givenNames[Math.floor(Math.random() * this._givenNames.length)];
  },

  /* 员工容量上限 = 住宅套数 × 10 */
  capacity() {
    let cap = 0;
    State.data.industries.forEach(ind => {
      if (ind.type === 'estate' && ind.category === 'residential') {
        cap += (ind.quantity || 1) * 10 * Engine.levelMultiplier(ind.level || 1);
      }
    });
    return cap;
  },

  /* 当前员工总数 */
  count() {
    return (State.data.employees || []).length;
  },

  /* 未分配员工数 */
  unassignedCount() {
    return (State.data.employees || []).filter(e => !e.assign).length;
  },

  /* 递归招聘：每人独立生成，免费按档随机，付费均匀随机 */
  recruit(mode, qty) {
    const cfg = DATA.recruit[mode];
    if (!cfg) return;
    const count = qty || 1;
    const cap = this.capacity();
    const cur = this.count();
    const room = cap - cur;
    if (room <= 0) { UI.toast('宿舍已满，无法招聘'); return; }
    const actual = Math.min(count, room);
    const totalCost = cfg.cost * actual;
    if (totalCost > 0 && State.data.cash < totalCost) {
      UI.toast('现金不足，需要 ¥' + totalCost.toLocaleString('zh-CN'));
      return;
    }
    if (totalCost > 0) State.data.cash -= totalCost;

    if (!State.data.employees) State.data.employees = [];
    const hired = [];
    for (let i = 0; i < actual; i++) {
      let mult;
      if (mode === 'free' && cfg.tiers) {
        // 免费招聘：随机选档（0-3 各 25%），再在档内均匀随机
        const tierIdx = Math.floor(Math.random() * cfg.tiers.length);
        const tier = cfg.tiers[tierIdx];
        mult = Math.round((tier.min + Math.random() * (tier.max - tier.min)) * 10) / 10;
      } else {
        // 付费招聘：minMult ~ maxMult 均匀随机
        mult = Math.round((cfg.minMult + Math.random() * (cfg.maxMult - cfg.minMult)) * 10) / 10;
      }
      const emp = {
        id: 'emp_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        name: this._randomName(),
        multiplier: mult,
        assign: null
      };
      State.data.employees.push(emp);
      hired.push(emp);
    }
    State.save();

    // 结果弹窗：>5人精简显示，≤5人完整列表
    const modeLabel = mode === 'free' ? '免费招聘' : '付费招聘';
    let rowsHtml;
    if (hired.length > 5) {
      const sorted = [...hired].sort((a, b) => b.multiplier - a.multiplier);
      const best = sorted.slice(0, 3);
      const rest = sorted.slice(3, -2);
      const worst = sorted.slice(-2);
      const avgMult = (hired.reduce((s, e) => s + e.multiplier, 0) / hired.length);
      const totalSalary = hired.reduce((s, e) => s + Math.round(e.multiplier * 120), 0);
      rowsHtml = `
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">${modeLabel} · 共花费 ${State.formatMoney(totalCost)}</p>
        <div style="border-bottom:0.5px solid var(--border);margin-bottom:6px;"></div>
        ${best.map(e => `<div class="list-row"><span class="list-label" style="color:var(--up);">最佳</span><span>${e.name} ×${e.multiplier} · 日薪 ¥${Math.round(e.multiplier * 120)}</span></div>`).join('')}
        <div class="text-sm text-muted" style="padding:4px 8px;">...还有 ${rest.length} 人</div>
        ${worst.map(e => `<div class="list-row"><span class="list-label" style="color:var(--down);">最差</span><span>${e.name} ×${e.multiplier} · 日薪 ¥${Math.round(e.multiplier * 120)}</span></div>`).join('')}
        <div style="border-bottom:0.5px solid var(--border);margin:6px 0;"></div>
        <div class="list-row"><span class="text-sm text-muted">平均加成 ×${avgMult.toFixed(1)}</span><span class="text-sm text-muted">总日薪 ¥${totalSalary.toLocaleString('zh-CN')}/天</span></div>
      `;
    } else {
      rowsHtml = `
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">${modeLabel} · 共花费 ${State.formatMoney(totalCost)}</p>
        ${hired.map(e => `<div class="list-row"><span class="list-label">${e.name}</span><span class="list-value">加成 ×${e.multiplier} · 日薪 ¥${Math.round(e.multiplier * 120)}</span></div>`).join('')}
      `;
    }
    UI.modal('🎉 招聘成功（' + actual + '人）· ' + modeLabel, rowsHtml,
      [{ label: '好的', class: 'primary', onclick: 'UI.closeModal()' }]);
    Router.refresh();
  },

  /* 分配单个员工到产业 */
  assign(empId, type, category, silent) {
    const emp = (State.data.employees || []).find(e => e.id === empId);
    if (!emp) { UI.toast('员工不存在'); return; }
    if (emp.assign) { UI.toast('该员工已分配'); return; }
    emp.assign = { type, category };
    State.save();
    if (!silent) { UI.toast(emp.name + ' 已分配'); Router.refresh(); }
  },

  /* 撤回单个员工 */
  unassign(empId, silent) {
    const emp = (State.data.employees || []).find(e => e.id === empId);
    if (!emp || !emp.assign) return;
    emp.assign = null;
    State.save();
    if (!silent) { UI.toast(emp.name + ' 已撤回'); Router.refresh(); }
  },

  /* 调拨单个员工 */
  transfer(empId, toType, toCategory) {
    const emp = (State.data.employees || []).find(e => e.id === empId);
    if (!emp || !emp.assign) { UI.toast('员工未分配'); return; }
    if (emp.assign.type === toType && emp.assign.category === toCategory) {
      UI.toast('已在当前产业'); return;
    }
    emp.assign = { type: toType, category: toCategory };
    State.save();
    const toCat = State.findIndustryCategory(toType, toCategory);
    UI.toast(emp.name + ' 已调拨至 ' + (toCat ? toCat.name : ''));
    Router.refresh();
  },

  /* 解雇 */
  fire(empId) {
    const emp = (State.data.employees || []).find(e => e.id === empId);
    if (!emp) return;
    UI.confirm('解雇员工', '确认解雇 ' + emp.name + '（加成 ×' + emp.multiplier + '）？', () => {
      State.data.employees = State.data.employees.filter(e => e.id !== empId);
      State.save();
      UI.toast('已解雇');
      Router.refresh();
    });
  },

  /* 获取分配到某产业的所有员工 */
  getAssigned(type, category) {
    return (State.data.employees || []).filter(e =>
      e.assign && e.assign.type === type && e.assign.category === category
    );
  },

  /* 计算某产业的员工加成倍率 */
  multiplier(type, category) {
    let m = 0;
    this.getAssigned(type, category).forEach(e => { m += e.multiplier; });
    return m;
  },

  /* 某产业分配的员工人数 */
  assignedCount(type, category) {
    return this.getAssigned(type, category).length;
  },

  /* 计算某产业是否有员工 */
  hasStaff(type, category) {
    return this.assignedCount(type, category) > 0;
  },

  /* 每日员工薪水总额（含难度系数） */
  totalSalary() {
    let s = 0;
    (State.data.employees || []).forEach(e => { s += Math.round(e.multiplier * 120); });
    const diffCfg = State.getDifficultyConfig ? State.getDifficultyConfig() : null;
    const mult = diffCfg ? diffCfg.salaryMult : 1.0;
    return Math.round(s * mult);
  },

  /* 更新全体员工士气（每日调用） */
  updateMorale(dayLog) {
    const emps = State.data.employees || [];
    if (emps.length === 0) return;
    const phase = State.data.economicPhase || 'stable';
    const phaseCfg = DATA.economicCycle.phases.find(p => p.id === phase);
    // 住宅最高等级（方案B：住宅品质士气恢复，已分配员工每日恢复 = 住宅等级）
    const maxResLevel = (State.data.industries || [])
      .filter(i => i.type === 'estate' && i.category === 'residential')
      .reduce((max, i) => Math.max(max, i.level || 1), 0);

    emps.forEach(e => {
      if (e.morale == null) e.morale = 100;
      let change = 0;

      // 经济周期影响
      if (phase === 'recession') change -= 1;
      else if (phase === 'depression') change -= 2;

      // 发生天敌事件且无钱应对（由 engine.js 在事件触发时标记）
      if (e._noMoneyEvent) {
        change -= 5;
        e._noMoneyEvent = false;
      }

      // 方案B：住宅品质士气恢复（仅已分配员工受惠于居住环境）
      if (e.assign && maxResLevel > 0) {
        change += maxResLevel;
      }

      // 士气低于 30：每天按概率自动离职（含经济周期倍率）
      const resignMult = (phaseCfg ? phaseCfg.resignMult : 1.0);
      if (e.morale < 30 && Math.random() < 0.10 * resignMult) {
        e._willResign = true;
      }

      e.morale = Math.max(0, Math.min(100, (e.morale || 100) + change));
    });

    // 士气为 0 → 次日必然离职
    emps.forEach(e => {
      if (e.morale <= 0) e._willResign = true;
    });

    // 执行离职
    const resigned = emps.filter(e => e._willResign);
    resigned.forEach(e => {
      delete e._willResign;
      State.data.employees = State.data.employees.filter(x => x.id !== e.id);
      if (dayLog) dayLog.details.push({ label: `😢 ${e.name} 因士气过低离职`, amount: 0, type: 'expense' });
    });
  },

  /* 发放奖金（多档）：small=月薪×0.5→+5, medium=月薪×2→+20, large=月薪×5→+50 */
  giveBonus(tier) {
    const emps = State.data.employees || [];
    if (emps.length === 0) { UI.toast('没有员工'); return; }
    const TIERS = {
      small: { label: '小额激励', costMult: 0.5, morale: 5 },
      medium: { label: '发奖金', costMult: 2.0, morale: 20 },
      large: { label: '大额分红', costMult: 5.0, morale: 50 }
    };
    const t = TIERS[tier] || TIERS.medium;
    const monthlySalary = this.totalSalary() * 30;
    const totalCost = Math.round(monthlySalary * t.costMult);
    if (State.data.cash < totalCost) { UI.toast('现金不足，需要 ¥' + totalCost.toLocaleString('zh-CN')); return; }
    State.data.cash -= totalCost;
    emps.forEach(e => { e.morale = Math.min(100, (e.morale || 100) + t.morale); });
    State.save();
    UI.toast('💖 ' + t.label + ' ¥' + totalCost.toLocaleString('zh-CN') + '，全体员工士气 +' + t.morale);
    Router.refresh();
  },

  /* 获取各档位奖金费用 */
  getBonusCost(tier) {
    const TIERS = { small: 0.5, medium: 2.0, large: 5.0 };
    const mult = TIERS[tier] || 2.0;
    return Math.round(this.totalSalary() * 30 * mult);
  },

  /* 获取平均士气 */
  averageMorale() {
    const emps = State.data.employees || [];
    if (emps.length === 0) return 100;
    return emps.reduce((s, e) => s + (e.morale || 100), 0) / emps.length;
  },

  /* 获取士气极低（<30）的员工数 */
  lowMoraleCount() {
    return (State.data.employees || []).filter(e => (e.morale || 100) < 30).length;
  },

  /* 获取加成最高的未分配员工 */
  getBestUnassigned() {
    const unassigned = (State.data.employees || []).filter(e => !e.assign);
    if (unassigned.length === 0) return null;
    return unassigned.sort((a, b) => b.multiplier - a.multiplier)[0];
  },

  /* 获取某产业加成最低的已分配员工 */
  getWorstAssigned(type, category) {
    const assigned = this.getAssigned(type, category);
    if (assigned.length === 0) return null;
    return assigned.sort((a, b) => a.multiplier - b.multiplier)[0];
  },

  /* ===== 以下为产业/仓库相关逻辑，保持不变 ===== */

  recipeSatisfaction(factoryCode, factoryQty) {
    const recipe = DATA.factoryRecipes[factoryCode];
    if (!recipe) return 1.0;
    const inv = State.data.inventory || {};
    let minSat = 1.0;
    recipe.forEach(req => {
      const have = inv[req.code] || 0;
      const need = req.qty * factoryQty;
      const sat = need > 0 ? Math.min(1, have / need) : 1;
      minSat = Math.min(minSat, sat);
    });
    return minSat;
  },

  consumeFactoryMaterials(factoryCode, factoryQty, satisfaction) {
    const recipe = DATA.factoryRecipes[factoryCode];
    if (!recipe) return;
    if (!State.data.inventory) return;
    recipe.forEach(req => {
      const consume = req.qty * factoryQty * satisfaction;
      State.data.inventory[req.code] = (State.data.inventory[req.code] || 0) - consume;
      if (State.data.inventory[req.code] <= 0.01) delete State.data.inventory[req.code];
    });
  },

  produceMaterials(ind, empMult, log, licenseMult) {
    const cat = State.findIndustryCategory(ind.type, ind.category);
    if (!cat || !cat.produces) return;
    if (empMult <= 0) return;
    const qty = ind.quantity || 1;
    const free = this.warehouseFree();
    const produce = cat.produces.qty * qty * empMult * (licenseMult || 1);
    const stored = Math.min(produce, free);
    const overflow = produce - stored;
    if (!State.data.inventory) State.data.inventory = {};
    if (stored > 0) {
      State.data.inventory[cat.produces.code] = (State.data.inventory[cat.produces.code] || 0) + stored;
    }
    if (overflow > 0.01) {
      const mat = DATA.rawMaterials.find(m => m.code === cat.produces.code);
      const price = this.materialPrice(cat.produces.code);
      State.data.cash += Math.floor(price * 0.98 * overflow);
    }
    if (log) {
      const mat = DATA.rawMaterials.find(m => m.code === cat.produces.code);
      const matName = mat ? mat.name : cat.produces.code;
      // 产量波动标签
      let yieldTag = '';
      if (ind.type === 'mining' && ind._yieldFactor !== undefined && ind._yieldFactor !== 100) {
        const diff = ind._yieldFactor - 100;
        yieldTag = diff > 0 ? ` 📈+${diff}%` : ` 📉${diff}%`;
      }
      if (stored > 0) log.details.push({ label: `${cat.name}${yieldTag} 产出 ${matName} +${stored.toFixed(1)}`, amount: 0, type: 'info' });
      if (overflow > 0.01) {
        const price = this.materialPrice(cat.produces.code);
        const cashIn = Math.floor(price * 0.98 * overflow);
        log.details.push({ label: `${cat.name}${yieldTag} 溢出 ${matName} ${overflow.toFixed(1)} 自动卖出 +¥${cashIn.toLocaleString('zh-CN')}`, amount: cashIn, type: 'income' });
        log.income += cashIn;
      }
      if (stored <= 0 && overflow <= 0.01) log.details.push({ label: `${cat.name}${yieldTag} 产出→无法产出`, amount: 0, type: 'warn' });
    }
  },

  factoryProductSatisfaction(factoryCode, factoryQty) {
    const owned = State.data.industries.find(i => i.type === 'factory' && i.category === factoryCode);
    if (!owned || !owned.products || !window.FactoryProducts) return 1.0;
    let minSat = 1.0;
    Object.entries(owned.products).forEach(([prodCode, lineCount]) => {
      if (lineCount <= 0) return;
      const sat = FactoryProducts.productSatisfaction(factoryCode, prodCode, lineCount);
      minSat = Math.min(minSat, sat);
    });
    return minSat;
  },

  consumeFactoryProductMaterials(factoryCode, factoryQty) {
    const owned = State.data.industries.find(i => i.type === 'factory' && i.category === factoryCode);
    if (!owned || !owned.products || !window.FactoryProducts) return;
    Object.entries(owned.products).forEach(([prodCode, lineCount]) => {
      if (lineCount <= 0) return;
      const sat = FactoryProducts.productSatisfaction(factoryCode, prodCode, lineCount);
      FactoryProducts.consumeProductMaterials(factoryCode, prodCode, lineCount, sat);
    });
  },

  produceFactoryProducts(factoryCode, factoryQty, log) {
    const owned = State.data.industries.find(i => i.type === 'factory' && i.category === factoryCode);
    if (!owned || !owned.products || !window.FactoryProducts) return;
    Object.entries(owned.products).forEach(([prodCode, lineCount]) => {
      if (lineCount <= 0) return;
      const sat = FactoryProducts.productSatisfaction(factoryCode, prodCode, lineCount);
      const product = FactoryProducts.getProduct(factoryCode, prodCode);
      if (!product) return;
      const result = FactoryProducts.produceProductOutput(factoryCode, prodCode, lineCount, sat);
      if (result && log) {
        if (result.stored > 0) {
          log.details.push({ label: '产出 ' + product.name + ' +' + result.stored.toFixed(1) + product.unit, amount: 0, type: 'info' });
        }
        if (result.overflow > 0.01) {
          const cashIn = Math.floor(result.sellPrice * 0.98 * result.overflow);
          State.data.cash += cashIn;
          log.income += cashIn;
          log.details.push({ label: '溢出 ' + product.name + ' ' + result.overflow.toFixed(1) + ' 自动售出 +' + State.formatMoney(cashIn), amount: cashIn, type: 'income' });
        }
      }
    });
  },

  materialPrice(code) {
    if (State.data.materialPrices && State.data.materialPrices[code]) return State.data.materialPrices[code];
    const mat = DATA.rawMaterials.find(m => m.code === code);
    return mat ? mat.price : 0;
  },

  materialSellPrice(code) { return this.materialPrice(code) * 0.98; },

  warehouseCapacity() {
    let cap = 0;
    State.data.industries.forEach(ind => {
      if (ind.type === 'estate' && ind.category === 'warehouse') {
        cap += (ind.quantity || 1) * DATA.warehouseCapacityPerUnit * Engine.levelMultiplier(ind.level || 1);
      }
    });
    return cap;
  },

  warehouseUsed() {
    let used = 0;
    const inv = State.data.inventory || {};
    Object.values(inv).forEach(qty => { used += qty; });
    return used;
  },

  warehouseFree() { return Math.max(0, this.warehouseCapacity() - this.warehouseUsed()); },

  warehouseValue() {
    const inv = State.data.inventory || {};
    let val = 0;
    Object.entries(inv).forEach(([code, qty]) => { val += this.materialPrice(code) * qty; });
    return val;
  },

  buyMaterial(code, qty) {
    const mat = DATA.rawMaterials.find(m => m.code === code);
    if (!mat) return;
    const price = this.materialPrice(code);
    const totalCost = Math.floor(price * qty);
    if (State.data.cash < totalCost) { UI.toast('现金不足'); return; }
    const free = this.warehouseFree();
    if (qty > free) { UI.toast('仓库容量不足'); return; }
    State.data.cash -= totalCost;
    if (!State.data.inventory) State.data.inventory = {};
    State.data.inventory[code] = (State.data.inventory[code] || 0) + qty;
    State.save();
    UI.toast(`购入 ${qty} ${mat.unit} ${mat.name}`);
    Router.refresh();
  },

  sellMaterial(code, qty) {
    const mat = DATA.rawMaterials.find(m => m.code === code);
    if (!mat) return;
    if (!State.data.inventory || !State.data.inventory[code]) { UI.toast('无库存'); return; }
    qty = Math.min(qty, State.data.inventory[code]);
    if (qty <= 0) return;
    const sellPrice = this.materialSellPrice(code);
    const refund = Math.floor(sellPrice * qty);
    State.data.inventory[code] -= qty;
    if (State.data.inventory[code] <= 0) delete State.data.inventory[code];
    State.data.cash += refund;
    State.save();
    UI.toast(`卖出 ${qty} ${mat.unit}，到账 ¥${refund.toLocaleString('zh-CN')}`);
    Router.refresh();
  },


  /**
   * 获取协同加成系数（上下游产业同时持有时减少原料消耗）
   * @param {string} industryType - 产业类型
   * @returns {number} 原料消耗倍率 (0.85 = 消耗减少15%)
   */
  getSynergyBonus(industryType) {
    const industries = State.data.industries || [];
    const hasMining = industries.some(i => i.type === 'mining');
    const hasMetall = industries.some(i => i.type === 'metall');
    const hasFarm = industries.some(i => i.type === 'farm');
    const hasFactory = industries.some(i => i.type === 'factory');

    // 完整产业链：矿业+冶金+工厂 → 15% 加成
    if (hasMining && hasMetall && hasFactory && (industryType === 'metall' || industryType === 'factory')) {
      return 0.85;
    }
    // 矿业+冶金 → 冶金消耗减少 10%
    if (hasMining && hasMetall && industryType === 'metall') {
      return 0.9;
    }
    // 农业+工厂 → 工厂农产品消耗减少 10%
    if (hasFarm && hasFactory && industryType === 'factory') {
      return 0.9;
    }
    // 冶金+工厂 → 工厂金属消耗减少 10%
    if (hasMetall && hasFactory && industryType === 'factory') {
      return 0.9;
    }
    return 1.0; // 无加成
  },

  smelterSatisfaction(smelterCode, smelterQty) {
    const recipe = DATA.smelterRecipes[smelterCode];
    if (!recipe) return 1.0;
    const inv = State.data.inventory || {};
    const synergy = this.getSynergyBonus('metall');
    let minSat = 1.0;
    recipe.forEach(req => {
      const have = inv[req.code] || 0;
      const need = req.qty * smelterQty * synergy;
      const sat = need > 0 ? Math.min(1, have / need) : 1;
      minSat = Math.min(minSat, sat);
    });
    return minSat;
  },

  consumeSmelterMaterials(smelterCode, smelterQty, satisfaction) {
    const recipe = DATA.smelterRecipes[smelterCode];
    if (!recipe) return;
    if (!State.data.inventory) return;
    recipe.forEach(req => {
      const consume = req.qty * smelterQty * satisfaction;
      State.data.inventory[req.code] = (State.data.inventory[req.code] || 0) - consume;
      if (State.data.inventory[req.code] <= 0.01) delete State.data.inventory[req.code];
    });
  }
};

window.Employees = Employees;
