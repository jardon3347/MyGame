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

              <div class="label">拥有（${ind.unit}）</div>

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

              ⚠️ 有 ${unstaffedCount} ${ind.unit}产业未派员工，无产出。<br>

              <a onclick="Router.go('staff')" style="color:var(--info);text-decoration:underline;">前往员工管理 →</a>

            </p>

          </div>

        ` : ''}



        ${type === 'farm' ? `

          <div class="list-item" style="margin-bottom:12px;background:var(--bg-soft);">

            <p class="text-sm text-muted" style="line-height:1.6;">

              🌾 <strong>农业产出</strong>：农业每日产出农产品存入仓库，供工厂消费。<br>

              如小麦→食品厂/酿酒厂，棉花→纺织厂，玉米→饲料厂。<br>

              需要有<a onclick="Router.go('warehouse')" style="color:var(--info);text-decoration:underline;">仓库</a>才能存放产出。

            </p>

          </div>

        ` : ''}



        ${type === 'mining' ? `

          <div class="list-item" style="margin-bottom:12px;background:var(--bg-soft);">

            <p class="text-sm text-muted" style="line-height:1.6;">

              ⛏️ <strong>矿业产出</strong>：矿业每日产出矿石存入仓库，供冶金消费。<br>

              如铁矿石→炼钢（炼铁），铜矿石→炼铜，煤矿→炼钢/水泥厂。<br>

              需要有<a onclick="Router.go('warehouse')" style="color:var(--info);text-decoration:underline;">仓库</a>才能存放产出。

            </p>

          </div>

        ` : ''}



        ${type === 'factory' ? `

          <div class="list-item" style="margin-bottom:12px;background:var(--bg-soft);">

            <p class="text-sm text-muted" style="line-height:1.6;">

              🏭 <strong>工厂消费</strong>：工厂从仓库消费原料，原料不足时产出按比例下降。<br>

              如食品厂需小麦+大豆+玉米，机械厂需钢材+生铁。<br>

              没原料？去<a onclick="Router.go('warehouse')" style="color:var(--info);text-decoration:underline;">仓库</a>买或自己挖。

            </p>

          </div>

        ` : ''}



        ${type === 'metall' ? `

          <div class="list-item" style="margin-bottom:12px;background:var(--bg-soft);">

            <p class="text-sm text-muted" style="line-height:1.6;">

              🔥 <strong>冶金联动</strong>：冶金从仓库消费矿石，产出金属存入仓库供工厂用。<br>

              如炼钢需铁矿石+煤矿→产出钢材，炼铜需铜矿石→产出铜锭。<br>

              没矿场？去<a onclick="Router.go('warehouse')" style="color:var(--info);text-decoration:underline;">仓库</a>直接买原料。

            </p>

          </div>

        ` : ''}



        ${this._isCapacity(type) ? this._capacitySection(type, ind, owned) : `

        <div class="section-title">我的产业</div>

        ${owned.length === 0 ? '<div class="empty">暂无产业，下方可购入</div>' :

          owned.map(o => this.ownedItem(type, o)).join('')}



        <div class="section-title">可购入（单位：${ind.unit}）</div>

        ${ind.categories.map(cat => this.purchaseItem(type, cat)).join('')}`}



        ${UI.bottombar()}

      </div>

    `;

  },





  _isCapacity(type) {

    return type === 'farm' || type === 'metall' || type === 'factory';

  },



  _totalCapacity(type) {

    const lp = (DATA.landPrereqs || {})[type];

    if (!lp) return 0;

    const cpl = (DATA.capacityPerLand || {})[type] || 10;

    let t = 0;

    (State.data.industries || []).forEach(i => {

      if (i.type === 'estate' && i.category === lp.code) t += (i.quantity || 1) * cpl * Engine.levelMultiplier(i.level || 1);

    });

    return t;

  },



  _usedCapacity(type) {

    let u = 0;

    (State.data.industries || []).forEach(i => {

      if (i.type === type) u += (i.quantity || 0);

    });

    return u;

  },





  _refreshCapacity(type) {

    const el = document.getElementById('cap-section');

    if (!el) { Router.refresh(); return; }

    const ind = DATA.industries[type];

    const owned = State.data.industries.filter(i => i.type === type);

    const scrollY = window.scrollY;

    el.outerHTML = this._capacitySection(type, ind, owned);

    window.scrollTo(0, scrollY);

  },



  _capacitySection(type, ind, owned) {

    const total = this._totalCapacity(type);

    const used = this._usedCapacity(type);

    const free = total - used;

    const landName = (DATA.landPrereqs[type] || {}).name || '\u571f\u5730';

    const unit = ind.unit;

    let h = '';

    h += '<div id="cap-section">';

    h += '<div class="list-item" style="margin-bottom:12px;background:var(--bg-soft);">';

    h += '<div class="font-medium">' + ind.icon + ' \u4ea7\u80fd\u6982\u89c8</div>';

    h += '<div class="text-sm text-muted" style="margin-top:4px;">';

    h += '\u603b\u4ea7\u80fd ' + total + ' ' + unit + ' \u00b7 \u5df2\u5206\u914d ' + used + ' \u00b7 ';

    h += free > 0 ? '<span style="color:var(--info);">\u5269\u4f59 ' + free + '</span>' : '<span style="color:var(--down);">\u5df2\u6ee1</span>';

    h += '</div>';

    if (total === 0) {

      h += '<div class="text-sm" style="color:var(--warning);margin-top:6px;">\u26a0 \u8bf7\u5148\u5728\u5730\u4ea7\u8d2d\u4e70\u3010' + landName + '\u3011</div>';

    }

    h += '</div>';

    if (owned.length > 0) {

      h += '<div class="section-title">\u5df2\u5206\u914d</div>';

      owned.forEach(o => {

        const cat = State.findIndustryCategory(type, o.category);

        if (!cat) return;

        const qty = o.quantity || 0;

        const empCnt = Employees.assignedCount(type, o.category);

        const empMult = Employees.multiplier(type, o.category);

        const hasStaff = empCnt > 0;

        let recipeSat = 1.0;

        if (type === 'factory' && DATA.factoryRecipes[o.category]) recipeSat = Employees.recipeSatisfaction(o.category, qty);

        if (type === 'metall' && DATA.smelterRecipes[o.category]) recipeSat = Employees.smelterSatisfaction(o.category, qty);

        const daily = hasStaff ? cat.dailyIncome * qty * empMult * recipeSat : 0;

        h += '<div class="list-item">';

        h += '<div class="list-row"><div>';

        h += '<div class="font-medium">' + cat.name + ' \u00d7 ' + qty + ' ' + unit + '</div>';

        h += '<div class="text-sm ' + (hasStaff ? 'text-muted' : '') + '" style="' + (hasStaff ? '' : 'color:var(--down);') + '">';

        h += hasStaff ? '\u5458\u5de5 ' + empCnt + '\u4eba \u00b7 \u52a0\u6210 \u00d7' + empMult.toFixed(1) + ' \u00b7 \u65e5\u5165 ' + State.formatMoney(daily) : '\u26a0 \u65e0\u5458\u5de5 \u00b7 \u65e0\u4ea7\u51fa';

        h += '</div></div></div>';

        // Production/consumption info

        if (hasStaff && qty > 0) {

          const inv = State.data.inventory || {};

          if (type === 'farm' && cat.produces) {

            const mat = (DATA.rawMaterials || []).find(m => m.code === cat.produces.code);

            const matName = mat ? mat.name : cat.produces.code;

            const produce = cat.produces.qty * qty * empMult;

            const have = inv[cat.produces.code] || 0;

            h += '<div class="text-sm text-muted" style="margin:4px 0 0;">\ud83d\udce5 \u4ea7\u51fa ' + matName + ' +' + produce.toFixed(1) + '/\u65e5 \u00b7 \u4ed3\u5e93\u5b58 ' + have.toFixed(1) + '</div>';

          }

          if (type === 'metall') {

            if (DATA.smelterRecipes[o.category]) {

              const recipe = DATA.smelterRecipes[o.category];

              const sat = Employees.smelterSatisfaction(o.category, qty);

              h += '<div class="text-sm text-muted" style="margin:4px 0 0;">\ud83d\udce5 \u6d88\u8017' + recipe.map(r => {

                const m = (DATA.rawMaterials || []).find(x => x.code === r.code);

                const have = inv[r.code] || 0;

                const need = r.qty * qty;

                const s = have >= need ? '\u2705' : (have > 0 ? '\u25a0' : '\u274c');

                return ' ' + (m ? m.name : r.code) + ' ' + have.toFixed(0) + '/' + need.toFixed(0) + s;

              }).join(' \u00b7') + '</div>';

            }

            if (cat.produces) {

              const mat = (DATA.rawMaterials || []).find(m => m.code === cat.produces.code);

              const matName = mat ? mat.name : cat.produces.code;

              const produce = cat.produces.qty * qty * empMult;

              h += '<div class="text-sm text-muted" style="margin:2px 0 0;">\ud83d\udce4 \u4ea7\u51fa ' + matName + ' +' + produce.toFixed(1) + '/\u65e5</div>';

            }

            if (recipeSat < 1) {

              h += '<div class="text-sm" style="color:var(--warning);margin:2px 0 0;">\u539f\u6599\u4e0d\u8db3\uff0c\u4ea7\u51fa\u4ec5 ' + Math.round(recipeSat*100) + '%</div>';

            }

          }

          if (type === 'factory' && DATA.factoryRecipes[o.category]) {

            const recipe = DATA.factoryRecipes[o.category];

            h += '<div class="text-sm text-muted" style="margin:4px 0 0;">\ud83d\udce5 \u6d88\u8017' + recipe.map(r => {

              const m = (DATA.rawMaterials || []).find(x => x.code === r.code);

              const have = inv[r.code] || 0;

              const need = r.qty * qty;

              const s = have >= need ? '\u2705' : (have > 0 ? '\u25a0' : '\u274c');

              return ' ' + (m ? m.name : r.code) + ' ' + have.toFixed(0) + '/' + need.toFixed(0) + s;

            }).join(' \u00b7') + '</div>';

            if (recipeSat < 1) {

              h += '<div class="text-sm" style="color:var(--warning);margin:2px 0 0;">\u539f\u6599\u4e0d\u8db3\uff0c\u4ea7\u51fa\u4ec5 ' + Math.round(recipeSat*100) + '%</div>';

            }

          }

        }

        h += '<div class="flex gap-8 mt-8">';

        h += '<button class="btn sm" style="flex:1;" onclick="Industry.allocMinus(\'' + type + '\',\'' + o.category + '\')">\u2212 \u51cf\u5c11</button>';

        h += '<button class="btn sm primary" style="flex:1;" onclick="Staff.showAssignPickerByIndustry(\'' + type + '\',\'' + o.category + '\')">' + (hasStaff ? '\u8c03\u6574\u5458\u5de5' : '\u6d3e\u4eba') + '</button>';

        h += '<button class="btn sm" style="flex:1;" onclick="Industry.allocPlus(\'' + type + '\',\'' + o.category + '\')">+ \u589e\u52a0</button>';

        h += '</div></div>';

      });

    }

    if (free > 0 && total > 0) {

      h += '<div class="section-title">\u5206\u914d\u4ea7\u80fd\uff08\u5269\u4f59 ' + free + ' ' + unit + '\uff09</div>';

      ind.categories.forEach(cat => {

        const existing = owned.find(o => o.category === cat.code);

        const cur = existing ? (existing.quantity || 0) : 0;

        h += '<div class="list-item">';

        h += '<div class="list-row"><div>';

        h += '<div class="font-medium">' + cat.name + (cur > 0 ? ' \u00d7 ' + cur : '') + '</div>';

        h += '<div class="text-sm text-muted">\u57fa\u7840\u65e5\u5165 ' + State.formatMoney(cat.dailyIncome) + '/' + unit;

        if (cat.cycle) h += ' \u00b7 ' + cat.cycle;

        h += '</div></div>';

        h += '<button class="btn sm primary" onclick="Industry.allocPlus(\'' + type + '\',\'' + cat.code + '\')">+ \u5206\u914d</button>';

        h += '</div></div>';

      });

    }

    h += '</div>';

    return h;

  },



  ownedItem(type, o) {

    if (this._isCapacity(type)) return '';

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

      recipeInfo = `<div class="text-sm text-muted">📥 产出 ${matName} +${dailyProduce.toFixed(1)}/日 · 仓库存 ${have.toFixed(1)}</div>`;

    }



    // 冶金：消耗矿石 + 产出金属

    if (type === 'metall') {

      if (DATA.smelterRecipes[o.category]) {

        recipeSat = Employees.smelterSatisfaction(o.category, qty);

        const recipe = DATA.smelterRecipes[o.category];

        recipeInfo = '<div class="text-sm text-muted">📥 消费：' + recipe.map(r => {

          const mat = DATA.rawMaterials.find(m => m.code === r.code);

          const have = inv[r.code] || 0;

          const need = r.qty * qty;

          const sat = have >= need ? '✅' : (have > 0 ? '▲' : '❌');

          return `${mat ? mat.name : r.code} ${have.toFixed(0)}/${need.toFixed(0)}${sat}`;

        }).join(' · ') + '</div>';

      }

      if (cat.produces) {

        const mat = DATA.rawMaterials.find(m => m.code === cat.produces.code);

        const matName = mat ? mat.name : cat.produces.code;

        const dailyProduce = hasStaff ? cat.produces.qty * qty * empMult * (o.level || 1) : 0;

        recipeInfo += `<div class="text-sm text-muted">📤 产出 ${matName} +${dailyProduce.toFixed(1)}/日</div>`;

      }

      if (recipeSat < 1) {

        recipeInfo += `<div class="text-sm" style="color:var(--warning);">原料不足，产出仅 ${Math.round(recipeSat*100)}% · <a onclick="Router.go('warehouse')" style="color:var(--info);text-decoration:underline;">去仓库 →</a></div>`;

      }

    }



    // 工厂：消耗农产品/金属

    if (type === 'factory' && DATA.factoryRecipes[o.category]) {

      recipeSat = Employees.recipeSatisfaction(o.category, qty);

      const recipe = DATA.factoryRecipes[o.category];

      recipeInfo = '<div class="text-sm text-muted">📥 消费：' + recipe.map(r => {

        const mat = DATA.rawMaterials.find(m => m.code === r.code);

        const have = inv[r.code] || 0;

        const need = r.qty * qty;

        const sat = have >= need ? '✅' : (have > 0 ? '▲' : '❌');

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

                : '⚠️ 无员工 · 无产出'}

            </div>

            ${recipeInfo}

          </div>

          <div class="flex gap-8">

            <button class="btn sm" onclick="Staff.showAssignPickerByIndustry('${type}', '${o.category}')">${hasStaff ? '调整' : '派人'}</button>

          </div>

        </div>

        <div class="flex gap-8 mt-8">

          <button class="btn sm" style="flex:1;" ${(o.level||1) >= (DATA.maxIndustryLevel||5) ? 'disabled style="opacity:0.4;flex:1;"' : ''} onclick="Industry.upgrade('${type}','${o.category}')">${(o.level||1) >= (DATA.maxIndustryLevel||5) ? '已满级' : '升级'}</button>

          <button class="btn sm danger" style="flex:1;" onclick="Industry.sell('${type}','${o.category}')">出售</button>

        </div>

      </div>

    `;

  },



  purchaseItem(type, cat) {

    if (this._isCapacity(type)) return '';

    const ind = DATA.industries[type];

    const maxQty = Math.floor(State.data.cash / cat.cost);

    const canAfford = maxQty > 0;

    const payback = cat.dailyIncome > 0 ? (cat.cost / cat.dailyIncome).toFixed(0) : '—';

    // check land prereq

    const _prereq = DATA.landPrereqs ? DATA.landPrereqs[type] : null;

    let _hasPrereq = true;

    let _reqLabel = '';

    if (_prereq) {

      _hasPrereq = (State.data.industries || []).some(i => i.type === 'estate' && i.category === _prereq.code && (i.quantity || 1) > 0);

      _reqLabel = _hasPrereq ? '' : '需先在地产购买 ' + _prereq.name;

    }

    const _buyDisabled = !_hasPrereq || !canAfford;

    return `

      <div class="list-item">

        <div class="list-row">

          <div>

            <div class="font-medium">${cat.name}</div>

            <div class="text-sm text-muted">日入 ${State.formatMoney(cat.dailyIncome)}/${ind.unit} · 回本 ${payback} 天${cat.cycle ? ' · ' + cat.cycle : ''}${cat.reserve ? ' · 储量 ' + cat.reserve + ' 天' : ''}${type === 'factory' && DATA.factoryRecipes[cat.code] ? ' · 需: ' + DATA.factoryRecipes[cat.code].map(r => { const m = DATA.rawMaterials.find(m2 => m2.code === r.code); return (m ? m.name : r.code) + '×' + r.qty; }).join('+') : ''}${type === 'metall' && DATA.smelterRecipes[cat.code] ? ' · 需: ' + DATA.smelterRecipes[cat.code].map(r => { const m = DATA.rawMaterials.find(m2 => m2.code === r.code); return (m ? m.name : r.code) + '×' + r.qty; }).join('+') : ''}</div>

          </div>

          <div style="text-align:right;">

            <div class="font-medium">${State.formatMoney(cat.cost)}</div>

            <div class="text-sm text-muted">/${ind.unit}</div>

          </div>

        </div>

        ${!_hasPrereq ? '<div class="text-sm" style="color:var(--warning);margin-top:6px;">' + _reqLabel + '</div>' : ''}

        <div class="mt-8">

          <button class="btn sm full ${!_buyDisabled ? 'primary' : ''}" ${_buyDisabled ? 'disabled style="opacity:0.4;"' : ''} onclick="Industry.buy('${type}','${cat.code}')">

            ${!_hasPrereq ? '⌂ 需购' + _prereq.name : (canAfford ? '购入（可买 ' + maxQty.toLocaleString('zh-CN') + ' ' + ind.unit + '）' : '现金不足')}

          </button>

        </div>

      </div>

    `;

  }

};



const Industry = {

  allocPlus(type, categoryCode) {

    const total = Pages.industry._totalCapacity(type);

    const used = Pages.industry._usedCapacity(type);

    if (used >= total) {

      UI.toast('产能已满，请先在地产购买更多' + ((DATA.landPrereqs || {})[type] || {}).name);

      return;

    }

    const existing = State.data.industries.find(i => i.type === type && i.category === categoryCode);

    if (existing) {

      existing.quantity = (existing.quantity || 0) + 1;

    } else {

      State.data.industries.push({

        type: type, category: categoryCode, level: 1, quantity: 1,

        purchaseDay: State.data.date.totalDays

      });

    }

    State.save();

    UI.toast('已分配 1 单位');

    Pages.industry._refreshCapacity(type);

  },



  allocMinus(type, categoryCode) {

    const existing = State.data.industries.find(i => i.type === type && i.category === categoryCode);

    if (!existing || (existing.quantity || 0) <= 0) {

      UI.toast('无可减少的产能');

      return;

    }

    existing.quantity -= 1;

    if (existing.quantity <= 0) {

      State.data.industries = State.data.industries.filter(i => !(i.type === type && i.category === categoryCode));

      (State.data.employees || []).forEach(g => {

        if (g.assign && g.assign.type === type && g.assign.category === categoryCode) g.assign = null;

      });

    }

    State.save();

    UI.toast('已减少 1 单位');

    Pages.industry._refreshCapacity(type);

  },



  buy(type, categoryCode) {

    if (Pages.industry._isCapacity(type)) { UI.toast('该产业使用产能分配模式'); return; }

    const cat = State.findIndustryCategory(type, categoryCode);

    if (!cat) return;

    const _prereq = DATA.landPrereqs ? DATA.landPrereqs[type] : null;

    if (_prereq) {

      const _has = (State.data.industries || []).some(i => i.type === 'estate' && i.category === _prereq.code && (i.quantity || 1) > 0);

      if (!_has) {

        UI.toast('需先在地产购买【' + _prereq.name + '】');

        return;

      }

    }

    const ind = DATA.industries[type];

    const maxQty = Math.floor(State.data.cash / cat.cost);

    if (maxQty <= 0) { UI.toast('现金不足'); return; }



    UI.numberPicker({

      title: '购入 ' + cat.name,

      unit: cat.cost,

      unitName: ind.unit,

      unitLabel: `${State.formatMoney(cat.cost)}/${ind.unit} · 日入 ${State.formatMoney(cat.dailyIncome)}/${ind.unit}`,

      max: maxQty,

      quickAdds: maxQty >= 1000 ? [10, 100, 500, 1000] : [5, 10, 50, 100],

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

    if ((owned.level || 1) >= (DATA.maxIndustryLevel || 5)) {

      UI.toast('已达最高等级 Lv' + (DATA.maxIndustryLevel || 5) + '，不可再升级');

      return;

    }

    const upgradeCost = cat.cost * 0.8 * (owned.level || 1) * qty;

    if (State.data.cash < upgradeCost) { UI.toast('现金不足，需要 ' + State.formatMoney(upgradeCost)); return; }

    UI.confirm('升级 ' + cat.name, `Lv${owned.level} → Lv${owned.level+1}（全部 ${qty.toLocaleString('zh-CN')} ${ind.unit}）<br>花费 ${State.formatMoney(upgradeCost)}<br>日收入提升 20%（每级×1.2，上限Lv5）`, () => {

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

      quickAdds: qty >= 1000 ? [10, 100, 500, 1000] : [5, 10, 50, 100],

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

