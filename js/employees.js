/* employees.js — 员工系统：按类分组、批量招聘、分配、产出加成 */

const Employees = {

  /* 员工容量上限 = 住宅套数 × 10（每套住宅容纳 10 人） */
  capacity() {
    let cap = 0;
    State.data.industries.forEach(ind => {
      if (ind.type === 'estate' && ind.category === 'residential') {
        cap += (ind.quantity || 1) * 10;
      }
    });
    return cap;
  },

  /* 当前员工总数（按 count 求和） */
  count() {
    let n = 0;
    (State.data.employees || []).forEach(g => { n += (g.count || 0); });
    return n;
  },

  /* 是否还能招人 */
  canRecruit(n) {
    return this.count() + (n || 1) <= this.capacity();
  },

  /* 未分配员工数 */
  unassignedCount() {
    let n = 0;
    (State.data.employees || []).forEach(g => {
      if (!g.assign) n += (g.count || 0);
    });
    return n;
  },

  /* 按等级统计未分配员工数 */
  unassignedByLevel() {
    const cnt = [0, 0, 0, 0]; // L1~L4
    (State.data.employees || []).forEach(g => {
      if (!g.assign && g.level >= 1 && g.level <= 4) cnt[g.level - 1] += (g.count || 0);
    });
    return cnt;
  },

  /* 招聘：一次招 batchCount 个 */
  recruit(mode) {
    const cfg = DATA.recruit[mode];
    if (!cfg) return;
    const batch = cfg.batchCount !== undefined ? cfg.batchCount : DATA.recruit.batchCount;

    if (!this.canRecruit(batch)) {
      const room = this.capacity() - this.count();
      UI.toast(`宿舍仅剩 ${room} 个名额，无法一次招 ${batch} 人`);
      return;
    }
    if (cfg.cost > 0 && State.data.cash < cfg.cost) {
      UI.toast('现金不足，需要 ¥' + cfg.cost.toLocaleString('zh-CN'));
      return;
    }

    // 扣钱
    if (cfg.cost > 0) State.data.cash -= cfg.cost;

    // 按概率抽取 batch 个员工的等级
    const results = [0, 0, 0, 0]; // L1~L4 数量
    for (let i = 0; i < batch; i++) {
      const r = Math.random();
      let acc = 0, level = 0;
      for (let j = 0; j < cfg.prob.length; j++) {
        acc += cfg.prob[j];
        if (r < acc) { level = j + 1; break; }
      }
      if (level === 0) level = 1; // 兜底
      results[level - 1]++;
    }

    // 合并到未分配组（同等级合并）
    if (!State.data.employees) State.data.employees = [];
    results.forEach((cnt, idx) => {
      if (cnt <= 0) return;
      const level = idx + 1;
      const existing = State.data.employees.find(g => !g.assign && g.level === level);
      if (existing) {
        existing.count = (existing.count || 0) + cnt;
      } else {
        State.data.employees.push({
          id: 'grp_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
          level: level,
          count: cnt,
          assign: null
        });
      }
    });
    State.save();

    // 构建结果展示
    const summary = results.map((cnt, idx) => {
      if (cnt === 0) return '';
      const lvl = DATA.employeeLevels['L' + (idx + 1)];
      return `<div class="list-row">
        <span class="list-label" style="color:${lvl.color};">● ${lvl.name}</span>
        <span class="list-value">${cnt} 人 · 产出 ×${lvl.multiplier} · 日薪 ¥${lvl.salary}/人</span>
      </div>`;
    }).join('');

    const modeLabel = mode === 'free' ? '免费招聘' : (mode === 'paid' ? '付费招聘 ¥' + cfg.cost.toLocaleString('zh-CN') : '猎头招聘 ¥' + cfg.cost.toLocaleString('zh-CN'));
    UI.modal('🎉 招聘成功（' + batch + '人）', `
      <p style="font-size:13px; color:var(--text-secondary); margin-bottom:10px;">${modeLabel}</p>
      ${summary || '<div class="empty">未招到任何员工</div>'}
    `, [
      { label: '好的', class: 'primary', onclick: 'UI.closeModal()' }
    ]);
    Router.refresh();
  },

  /* 分配员工到产业：从某等级未分配组中拆出 n 人 */
  assign(groupId, n, type, category) {
    const grp = (State.data.employees || []).find(g => g.id === groupId);
    if (!grp) { UI.toast('员工组不存在'); return; }
    if (grp.assign) { UI.toast('该组已分配'); return; }
    n = Math.min(n, grp.count || 0);
    if (n <= 0) { UI.toast('数量无效'); return; }

    // 检查目标是否已有同等级分配组，有则合并
    const target = State.data.employees.find(g =>
      g.assign && g.assign.type === type && g.assign.category === category && g.level === grp.level
    );
    if (target) {
      target.count = (target.count || 0) + n;
    } else {
      State.data.employees.push({
        id: 'grp_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        level: grp.level,
        count: n,
        assign: { type, category }
      });
    }
    // 从源组扣除
    grp.count -= n;
    if (grp.count <= 0) {
      State.data.employees = State.data.employees.filter(g => g.id !== grp.id);
    }
    State.save();
    UI.toast(`已分配 ${n} 人到产业`);
    Router.refresh();
  },

  /* 撤回分配：整组撤回为未分配 */
  unassign(groupId) {
    const grp = (State.data.employees || []).find(g => g.id === groupId);
    if (!grp || !grp.assign) return;
    // 合并到同等级未分配组
    const unassigned = State.data.employees.find(g => !g.assign && g.level === grp.level);
    if (unassigned) {
      unassigned.count = (unassigned.count || 0) + (grp.count || 0);
      State.data.employees = State.data.employees.filter(g => g.id !== grp.id);
    } else {
      grp.assign = null;
    }
    State.save();
    UI.toast('已撤回，员工空闲');
    Router.refresh();
  },

  /* 跨品类调拨：从某已分配组拆 n 人到另一个品类 */
  transfer(fromGroupId, n, toType, toCategory) {
    const grp = (State.data.employees || []).find(g => g.id === fromGroupId);
    if (!grp || !grp.assign) { UI.toast('员工组不存在或未分配'); return; }
    n = Math.min(n, grp.count || 0);
    if (n <= 0) { UI.toast('数量无效'); return; }

    // 如果目标是同类型同品类，不允许（就是自己）
    if (grp.assign.type === toType && grp.assign.category === toCategory) {
      UI.toast('已在当前品类');
      return;
    }

    // 添加到目标（同等级合并）
    const target = State.data.employees.find(g =>
      g.assign && g.assign.type === toType && g.assign.category === toCategory && g.level === grp.level
    );
    if (target) {
      target.count = (target.count || 0) + n;
    } else {
      State.data.employees.push({
        id: 'grp_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        level: grp.level,
        count: n,
        assign: { type: toType, category: toCategory }
      });
    }
    // 从源组扣除
    grp.count -= n;
    if (grp.count <= 0) {
      State.data.employees = State.data.employees.filter(g => g.id !== grp.id);
    }
    State.save();
    const fromCat = State.findIndustryCategory(grp.assign.type, grp.assign.category);
    const toCat = State.findIndustryCategory(toType, toCategory);
    UI.toast(`已调拨 ${n} 人：${fromCat ? fromCat.name : ''} → ${toCat ? toCat.name : ''}`);
    Router.refresh();
  },

  /* 撤回部分员工 */
  unassignSome(groupId, n) {
    const grp = (State.data.employees || []).find(g => g.id === groupId);
    if (!grp || !grp.assign) return;
    n = Math.min(n, grp.count || 0);
    if (n <= 0) return;
    const unassigned = State.data.employees.find(g => !g.assign && g.level === grp.level);
    if (unassigned) {
      unassigned.count = (unassigned.count || 0) + n;
    } else {
      State.data.employees.push({
        id: 'grp_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        level: grp.level,
        count: n,
        assign: null
      });
    }
    grp.count -= n;
    if (grp.count <= 0) {
      State.data.employees = State.data.employees.filter(g => g.id !== grp.id);
    }
    State.save();
    UI.toast(`已撤回 ${n} 人`);
    Router.refresh();
  },

  /* 解雇员工组 */
  fire(groupId) {
    const grp = (State.data.employees || []).find(g => g.id === groupId);
    if (!grp) return;
    const lvl = DATA.employeeLevels['L' + grp.level];
    UI.confirm('解雇员工', `确认解雇 ${grp.count} 名${lvl.name}？无需补偿。`, () => {
      State.data.employees = (State.data.employees || []).filter(g => g.id !== groupId);
      State.save();
      UI.toast('已解雇');
      Router.refresh();
    });
  },

  /* 获取分配到某产业的所有员工组 */
  getAssigned(type, category) {
    return (State.data.employees || []).filter(g =>
      g.assign && g.assign.type === type && g.assign.category === category
    );
  },

  /* 计算某产业的员工加成倍率（各组 count × multiplier 之和） */
  multiplier(type, category) {
    let m = 0;
    this.getAssigned(type, category).forEach(g => {
      m += (g.count || 0) * DATA.employeeLevels['L' + g.level].multiplier;
    });
    return m;
  },

  /* 某产业分配的员工人数 */
  assignedCount(type, category) {
    let n = 0;
    this.getAssigned(type, category).forEach(g => { n += (g.count || 0); });
    return n;
  },

  /* 计算某产业是否有员工 */
  hasStaff(type, category) {
    return this.assignedCount(type, category) > 0;
  },

  /* 每日员工薪水总额 */
  totalSalary() {
    let s = 0;
    (State.data.employees || []).forEach(g => {
      s += (g.count || 0) * DATA.employeeLevels['L' + g.level].salary;
    });
    return s;
  },

  /* 工厂原料满足率（检查仓库库存，和冶金一样） */
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

  /* 工厂消耗仓库原料 */
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

  /* ===== 产业产出原料到仓库 ===== */
  // 矿业/农业每日产出原料，冶金每日产出金属
  produceMaterials(ind, empMult, log) {
    const cat = State.findIndustryCategory(ind.type, ind.category);
    if (!cat || !cat.produces) return;
    if (empMult <= 0) return;  // 无员工不产出
    const qty = ind.quantity || 1;
    const free = this.warehouseFree();
    const produce = cat.produces.qty * qty * empMult * (ind.level || 1);
    const actual = Math.min(produce, free);  // 仓库满了不产出
    if (actual <= 0) {
      if (log) log.details.push({ label: `${cat.name}产出→仓库已满`, amount: 0, type: 'warn' });
      return;
    }
    if (!State.data.inventory) State.data.inventory = {};
    State.data.inventory[cat.produces.code] = (State.data.inventory[cat.produces.code] || 0) + actual;
    if (log) {
      const mat = DATA.rawMaterials.find(m => m.code === cat.produces.code);
      const matName = mat ? mat.name : cat.produces.code;
      log.details.push({ label: `${cat.name}产出 ${matName} +${actual.toFixed(1)}`, amount: 0, type: 'info' });
    }
  },

  /* ===== 仓库系统 ===== */

  /* 获取原料当前市场价 */
  materialPrice(code) {
    if (State.data.materialPrices && State.data.materialPrices[code]) {
      return State.data.materialPrices[code];
    }
    const mat = DATA.rawMaterials.find(m => m.code === code);
    return mat ? mat.price : 0;
  },

  /* 获取原料卖出价（市场价 × 0.98，2% 手续费） */
  materialSellPrice(code) {
    return this.materialPrice(code) * 0.98;
  },

  /* 仓库总容量 */
  warehouseCapacity() {
    let cap = 0;
    State.data.industries.forEach(ind => {
      if (ind.type === 'estate' && ind.category === 'warehouse') {
        cap += (ind.quantity || 1) * DATA.warehouseCapacityPerUnit;
      }
    });
    return cap;
  },

  /* 仓库已用容量 */
  warehouseUsed() {
    let used = 0;
    const inv = State.data.inventory || {};
    Object.values(inv).forEach(qty => { used += qty; });
    return used;
  },

  /* 仓库剩余容量 */
  warehouseFree() {
    return Math.max(0, this.warehouseCapacity() - this.warehouseUsed());
  },

  /* 仓库库存总市值（按当前市场价计算） */
  warehouseValue() {
    const inv = State.data.inventory || {};
    let val = 0;
    Object.entries(inv).forEach(([code, qty]) => {
      val += this.materialPrice(code) * qty;
    });
    return val;
  },

  /* 购买原料（按当前市场价） */
  buyMaterial(code, qty) {
    const mat = DATA.rawMaterials.find(m => m.code === code);
    if (!mat) return;
    const price = this.materialPrice(code);
    const totalCost = Math.floor(price * qty);
    if (State.data.cash < totalCost) {
      UI.toast('现金不足，需要 ¥' + totalCost.toLocaleString('zh-CN'));
      return;
    }
    const free = this.warehouseFree();
    if (qty > free) {
      UI.toast(`仓库容量不足，仅剩 ${free} 单位`);
      return;
    }
    State.data.cash -= totalCost;
    if (!State.data.inventory) State.data.inventory = {};
    State.data.inventory[code] = (State.data.inventory[code] || 0) + qty;
    State.save();
    UI.toast(`购入 ${qty} ${mat.unit} ${mat.name}，单价 ¥${price}`);
    Router.refresh();
  },

  /* 出售原料（按当前市场价，2% 手续费） */
  sellMaterial(code, qty) {
    const mat = DATA.rawMaterials.find(m => m.code === code);
    if (!mat) return;
    if (!State.data.inventory || !State.data.inventory[code]) {
      UI.toast('无库存');
      return;
    }
    qty = Math.min(qty, State.data.inventory[code]);
    if (qty <= 0) return;
    const sellPrice = this.materialSellPrice(code);
    const refund = Math.floor(sellPrice * qty);
    State.data.inventory[code] -= qty;
    if (State.data.inventory[code] <= 0) delete State.data.inventory[code];
    State.data.cash += refund;
    State.save();
    UI.toast(`卖出 ${qty} ${mat.unit}，单价 ¥${sellPrice.toFixed(1)}，到账 ¥${refund.toLocaleString('zh-CN')}`);
    Router.refresh();
  },

  /* 冶金原料满足率（检查仓库库存是否够当日消耗） */
  smelterSatisfaction(smelterCode, smelterQty) {
    const recipe = DATA.smelterRecipes[smelterCode];
    if (!recipe) return 1.0;
    const inv = State.data.inventory || {};
    let minSat = 1.0;
    recipe.forEach(req => {
      const have = inv[req.code] || 0;
      const need = req.qty * smelterQty;
      const sat = need > 0 ? Math.min(1, have / need) : 1;
      minSat = Math.min(minSat, sat);
    });
    return minSat;
  },

  /* 冶金每日消耗原料（从库存扣除） */
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
