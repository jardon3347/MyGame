/* industry.js — 通用产业页（支持农业/矿业/冶金/工厂/地产） */

Pages.industry = {
  render(app, params) {
    const type = params.type;
    const ind = DATA.industries[type];
    const owned = State.data.industries.filter(i => i.type === type);
    let dailyTotal = 0;
    let countTotal = 0;
    let unstaffedCount = 0;
    owned.forEach(o => {
      const cat = State.findIndustryCategory(type, o.category);
      if (cat) {
        const qty = o.quantity || 1;
        countTotal += qty;
        const empMult = Employees.multiplier(type, o.category);
        if (empMult <= 0) {
          unstaffedCount += qty;
        } else {
          let recipeSat = 1.0;
          if (type === 'factory' && DATA.factoryRecipes[o.category]) {
            recipeSat = Employees.recipeSatisfaction(o.category, qty);
          }
          dailyTotal += cat.dailyIncome * (o.level || 1) * qty * empMult * recipeSat;
        }
      }
    });

    app.innerHTML = `
      <div class="page">
        ${UI.navbar(ind.icon + ' ' + ind.name)}
        <div class="topbar">
          <div class="topbar-stats">
            <div class="stat-item">
              <div class="label">持有（${ind.unit}）</div>
              <div class="value">${countTotal.toLocaleString('zh-CN')}</div>
            </div>
            <div class="stat-item">
              <div class="label">日收入</div>
              <div class="value up">${State.formatMoney(dailyTotal)}</div>
            </div>
            <div class="stat-item">
              <div class="label">现金</div>
              <div class="value">${State.formatMoney(State.data.cash)}</div>
            </div>
          </div>
        </div>

        ${unstaffedCount > 0 ? `
          <div class="list-item" style="border-left:3px solid var(--warning);margin-bottom:12px;">
            <p class="text-sm" style="line-height:1.6;color:var(--warning);">
              ⚠ 有 ${unstaffedCount} ${ind.unit}产业未派员工，无产出。<br>
              <a onclick="Router.go('staff')" style="color:var(--info);text-decoration:underline;">前往员工管理 →</a>
            </p>
          </div>
        ` : ''}

        ${type === 'farm' ? `
          <div class="list-item" style="margin-bottom:12px;background:var(--bg-soft);">
            <p class="text-sm text-muted" style="line-height:1.6;">
              🌾 <strong>农业产出</strong>：农业每日产出农产品存入仓库，供工厂消耗。<br>
              如小麦→食品厂/酿酒厂，棉花→纺织厂，玉米→饲料厂。<br>
              需要有<a onclick="Router.go('warehouse')" style="color:var(--info);text-decoration:underline;">仓库</a>才能存放产出。
            </p>
          </div>
        ` : ''}

        ${type === 'mining' ? `
          <div class="list-item" style="margin-bottom:12px;background:var(--bg-soft);">
            <p class="text-sm text-muted" style="line-height:1.6;">
              ⛏️ <strong>矿业产出</strong>：矿业每日产出矿石存入仓库，供冶金消耗。<br>
              如铁矿石→炼钢/炼铁，铜矿石→炼铜，煤炭→炼钢/水泥厂。<br>
              需要有<a onclick="Router.go('warehouse')" style="color:var(--info);text-decoration:underline;">仓库</a>才能存放产出。
            </p>
          </div>
        ` : ''}

        ${type === 'factory' ? `
          <div class="list-item" style="margin-bottom:12px;background:var(--bg-soft);">
            <p class="text-sm text-muted" style="line-height:1.6;">
              🏭 <strong>工厂消耗</strong>：工厂从仓库消耗原料，原料不足时产出按比例下降。<br>
              如食品厂需小麦+大豆+玉米，机械厂需钢材+生铁。<br>
              没原料？去<a onclick="Router.go('warehouse')" style="color:var(--info);text-decoration:underline;">仓库</a>买或自己种/挖。
            </p>
          </div>
        ` : ''}

        ${type === 'metall' ? `
          <div class="list-item" style="margin-bottom:12px;background:var(--bg-soft);">
            <p class="text-sm text-muted" style="line-height:1.6;">
              🔥 <strong>冶金联动</strong>：冶金从仓库消耗矿石，产出金属存入仓库供工厂用。<br>
              如炼钢需铁矿石+煤炭→产出钢材，炼铜需铜矿石→产出铜锭。<br>
              没矿场？去<a onclick="Router.go('warehouse')" style="color:var(--info);text-decoration:underline;">仓库</a>直接买原料。
            </p>
          </div>
        ` : ''}

        <div class="section-title">我的产业</div>
        ${owned.length === 0 ? '<div class="empty">暂无产业，下方可购入</div>' :
          owned.map(o => this.ownedItem(type, o)).join('')}

        <div class="section-title">可购入（单位：${ind.unit}）</div>
        ${ind.categories.map(cat => this.purchaseItem(type, cat)).join('')}

        ${UI.bottombar()}
      </div>
    `;
  },

  ownedItem(type, o) {
    const cat = State.findIndustryCategory(type, o.category);
    if (!cat) return '';
    const ind = DATA.industries[type];
    const qty = o.quantity || 1;
    const empCnt = Employees.assignedCount(type, o.category);
    const empMult = Employees.multiplier(type, o.category);
    const hasStaff = empCnt > 0;
    const inv = State.data.inventory || {};

    let recipeSat = 1.0;
    let recipeInfo = '';

    // 农业/矿业：显示产出信息
    if ((type === 'farm' || type === 'mining') && cat.produces) {
      const mat = DATA.rawMaterials.find(m => m.code === cat.produces.code);
      const matName = mat ? mat.name : cat.produces.code;
      const dailyProduce = hasStaff ? cat.produces.qty * qty * empMult * (o.level || 1) : 0;
      const have = inv[cat.produces.code] || 0;
      recipeInfo = `<div class="text-sm text-muted">⬆ 产出 ${matName} +${dailyProduce.toFixed(1)}/日 · 仓库存 ${have.toFixed(1)}</div>`;
    }

    // 冶金：消耗矿石 + 产出金属
    if (type === 'metall') {
      if (DATA.smelterRecipes[o.category]) {
        recipeSat = Employees.smelterSatisfaction(o.category, qty);
        const recipe = DATA.smelterRecipes[o.category];
        recipeInfo = '<div class="text-sm text-muted">⬇ 消耗：' + recipe.map(r => {
          const mat = DATA.rawMaterials.find(m => m.code === r.code);
          const have = inv[r.code] || 0;
          const need = r.qty * qty;
          const sat = have >= need ? '✓' : (have > 0 ? '△' : '✗');
          return `${mat ? mat.name : r.code} ${have.toFixed(0)}/${need.toFixed(0)}${sat}`;
        }).join(' · ') + '</div>';
      }
      if (cat.produces) {
        const mat = DATA.rawMaterials.find(m => m.code === cat.produces.code);
        const matName = mat ? mat.name : cat.produces.code;
        const dailyProduce = hasStaff ? cat.produces.qty * qty * empMult * (o.level || 1) : 0;
        recipeInfo += `<div class="text-sm text-muted">⬆ 产出 ${matName} +${dailyProduce.toFixed(1)}/日</div>`;
      }
      if (recipeSat < 1) {
        recipeInfo += `<div class="text-sm" style="color:var(--warning);">原料不足，产出仅 ${Math.round(recipeSat*100)}% · <a onclick="Router.go('warehouse')" style="color:var(--info);text-decoration:underline;">去仓库 →</a></div>`;
      }
    }

    // 工厂：消耗农产品/金属
    if (type === 'factory' && DATA.factoryRecipes[o.category]) {
      recipeSat = Employees.recipeSatisfaction(o.category, qty);
      const recipe = DATA.factoryRecipes[o.category];
      recipeInfo = '<div class="text-sm text-muted">⬇ 消耗：' + recipe.map(r => {
        const mat = DATA.rawMaterials.find(m => m.code === r.code);
        const have = inv[r.code] || 0;
        const need = r.qty * qty;
        const sat = have >= need ? '✓' : (have > 0 ? '△' : '✗');
        return `${mat ? mat.name : r.code} ${have.toFixed(0)}/${need.toFixed(0)}${sat}`;
      }).join(' · ') + '</div>';
      if (recipeSat < 1) {
        recipeInfo += `<div class="text-sm" style="color:var(--warning);">原料不足，产出仅 ${Math.round(recipeSat*100)}% · <a onclick="Router.go('warehouse')" style="color:var(--info);text-decoration:underline;">去仓库 →</a></div>`;
      }
    }

    const daily = hasStaff ? cat.dailyIncome * (o.level || 1) * qty * empMult * recipeSat : 0;
    return `
      <div class="list-item">
        <div class="list-row">
          <div>
            <div class="font-medium">${cat.name} · Lv${o.level||1} × ${qty.toLocaleString('zh-CN')} ${ind.unit}</div>
            <div class="text-sm ${hasStaff ? 'text-muted' : ''}" style="${hasStaff ? '' : 'color:var(--down);'}">
              ${hasStaff
                ? `员工 ${empCnt}人 · 加成 ×${empMult.toFixed(1)} · 日入 ${State.formatMoney(daily)}`
                : '⚠ 无员工 · 无产出'}
            </div>
            ${recipeInfo}
          </div>
          <div class="flex gap-8">
            <button class="btn sm" onclick="Staff.showAssignPickerByIndustry('${type}', '${o.category}')">${hasStaff ? '调整' : '派人'}</button>
          </div>
        </div>
        <div class="flex gap-8 mt-8">
          <button class="btn sm" style="flex:1;" onclick="Industry.upgrade('${type}','${o.category}')">升级</button>
          <button class="btn sm danger" style="flex:1;" onclick="Industry.sell('${type}','${o.category}')">出售</button>
        </div>
      </div>
    `;
  },

  purchaseItem(type, cat) {
    const ind = DATA.industries[type];
    const maxQty = Math.floor(State.data.cash / cat.cost);
    const canAfford = maxQty > 0;
    const payback = cat.dailyIncome > 0 ? (cat.cost / cat.dailyIncome).toFixed(0) : '—';
    return `
      <div class="list-item">
        <div class="list-row">
          <div>
            <div class="font-medium">${cat.name}</div>
            <div class="text-sm text-muted">日入 ${State.formatMoney(cat.dailyIncome)}/${ind.unit} · 回本 ${payback} 天${cat.cycle ? ' · ' + cat.cycle : ''}${cat.reserve ? ' · 储量 ' + cat.reserve + ' 天' : ''}</div>
          </div>
          <div style="text-align:right;">
            <div class="font-medium">${State.formatMoney(cat.cost)}</div>
            <div class="text-sm text-muted">/${ind.unit}</div>
          </div>
        </div>
        <div class="mt-8">
          <button class="btn sm full ${canAfford ? 'primary' : ''}" ${canAfford ? '' : 'disabled style="opacity:0.4;"'} onclick="Industry.buy('${type}','${cat.code}')">
            ${canAfford ? `购入（可买 ${maxQty.toLocaleString('zh-CN')} ${ind.unit}）` : '现金不足'}
          </button>
        </div>
      </div>
    `;
  }
};

const Industry = {
  buy(type, categoryCode) {
    const cat = State.findIndustryCategory(type, categoryCode);
    if (!cat) return;
    const ind = DATA.industries[type];
    const maxQty = Math.floor(State.data.cash / cat.cost);
    if (maxQty <= 0) { UI.toast('现金不足'); return; }

    UI.numberPicker({
      title: '购入 ' + cat.name,
      unit: cat.cost,
      unitName: ind.unit,
      unitLabel: `${State.formatMoney(cat.cost)}/${ind.unit} · 日入 ${State.formatMoney(cat.dailyIncome)}/${ind.unit}`,
      max: maxQty,
      quickAdds: maxQty >= 1000 ? [10, 100, 500, 1000] : [1, 5, 10, 50],
      onConfirm: (qty) => {
        if (qty <= 0) { UI.toast('请选择数量'); return; }
        const totalCost = cat.cost * qty;
        State.data.cash -= totalCost;
        const existing = State.data.industries.find(i => i.type === type && i.category === categoryCode);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + qty;
        } else {
          State.data.industries.push({
            type: type,
            category: categoryCode,
            level: 1,
            quantity: qty,
            purchaseDay: State.data.date.totalDays
          });
        }
        State.save();
        UI.toast(`购入 ${qty.toLocaleString('zh-CN')} ${ind.unit} ${cat.name}`);
        Router.refresh();
      }
    });
  },

  upgrade(type, categoryCode) {
    const owned = State.data.industries.find(i => i.type === type && i.category === categoryCode);
    if (!owned) return;
    const cat = State.findIndustryCategory(type, categoryCode);
    const ind = DATA.industries[type];
    const qty = owned.quantity || 1;
    const upgradeCost = cat.cost * 0.5 * (owned.level || 1) * qty;
    if (State.data.cash < upgradeCost) { UI.toast('现金不足，需要 ' + State.formatMoney(upgradeCost)); return; }
    UI.confirm('升级 ' + cat.name, `Lv${owned.level} → Lv${owned.level+1}（全部 ${qty.toLocaleString('zh-CN')} ${ind.unit}）<br>花费 ${State.formatMoney(upgradeCost)}<br>日收入提升 50%`, () => {
      State.data.cash -= upgradeCost;
      owned.level = (owned.level || 1) + 1;
      State.save();
      UI.toast('升级成功');
      Router.refresh();
    });
  },

  sell(type, categoryCode) {
    const owned = State.data.industries.find(i => i.type === type && i.category === categoryCode);
    if (!owned) return;
    const cat = State.findIndustryCategory(type, categoryCode);
    const ind = DATA.industries[type];
    const qty = owned.quantity || 1;
    const refundPer = cat.cost * 0.8;

    UI.numberPicker({
      title: '出售 ' + cat.name,
      unit: refundPer,
      unitName: ind.unit,
      unitLabel: `${State.formatMoney(refundPer)}/${ind.unit} · 持有 ${qty.toLocaleString('zh-CN')} ${ind.unit} · 按购入价80%回收`,
      max: qty,
      quickAdds: qty >= 1000 ? [10, 100, 500, 1000] : [1, 5, 10, 50],
      onConfirm: (sellQty) => {
        if (sellQty <= 0) { UI.toast('请选择数量'); return; }
        const refund = refundPer * sellQty;
        State.data.cash += refund;
        owned.quantity = qty - sellQty;
        if (owned.quantity <= 0) {
          State.data.industries = State.data.industries.filter(i => !(i.type === type && i.category === categoryCode));
        }
        State.save();
        UI.toast(`出售 ${sellQty.toLocaleString('zh-CN')} ${ind.unit}，到账 ${State.formatMoney(refund)}`);
        Router.refresh();
      }
    });
  }
};

window.Industry = Industry;
