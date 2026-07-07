/* industry.js — 通用产业页（支持农业/矿业/冶金/工厂/地产） */



Pages.industryDetail = {
  _pyMap: { '铁':'t','铜':'t','铝':'l','煤':'m','锌':'x','铉':'q','锡':'x','钨':'w','金':'j','银':'y','稀':'x','磷':'l','石':'s','英':'y','小':'x','稻':'d','大':'d','玉':'y','棉':'m','油':'y','甘':'g','茶':'c','蓔':'s','水':'s','橡':'x','烟':'y','钢':'g','生':'s','合':'h','贵':'g','麦':'m','谷':'g','豆':'d','米':'m','菜':'c','蔗':'z','叶':'y','果':'g','胶':'j','锸':'d','材':'c','矿':'k','粉':'f','葵':'k','绿':'l','红':'h','化':'h','淡':'d','盐':'y','砂':'s','糖':'t','薄':'b','厚':'h' },

  _activeTab: null, // 记住当前标签页（'owned' 或 'shop'），null=默认

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

          let daily = 0;

          // 工厂类型：使用产品系统计算日收入（更精确）
          if (type === 'factory' && window.FactoryProducts && o.products !== undefined) {
            daily = FactoryProducts.factoryDailyIncome(o.category);
          } else {
            let recipeSat = 1.0;
            if (type === 'factory' && DATA.factoryRecipes[o.category]) {
              recipeSat = Employees.recipeSatisfaction(o.category, qty);
            }
            // 有产出的产业使用 产出量×市场价，无产出的使用 dailyIncome
            if (cat.produces) {
              const licenseMult = (type === 'mining' && o.licenseLevel && o.licenseLevel > 1)
              ? (1 + (o.licenseLevel - 1) * 0.2) : 1;
              const produceQty = cat.produces.qty * qty * empMult * recipeSat * licenseMult;
              const matPrice = Employees.materialPrice(cat.produces.code);
              daily = produceQty * matPrice;
            } else {
              daily = (cat.dailyIncome || 0) * Engine.levelMultiplier(o.level || 1) * qty * empMult * recipeSat;
            }
          }
          dailyTotal += daily;

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


        ${this._renderDualTabs(type, ind, owned)}

        ${type === 'logistics' && owned.length > 0 ? this._renderLogisticsPanel(owned) : ''}

        ${UI.bottombar()}

      </div>

    `;

  },





  _isCapacity(type) {

    return type === 'farm' || type === 'metall' || type === 'factory';

  },

  /* 只有地产和物流显示产业等级 */
  _showLevelDisplay(type) {
    return type === 'estate' || type === 'logistics';
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

    el.outerHTML = this._renderDualTabs(type, ind, owned);

    window.scrollTo(0, scrollY);

  },



  _renderDualTabs(type, ind, owned) {
    const isCapacity = this._isCapacity(type);
    const totalCap = isCapacity ? this._totalCapacity(type) : 0;
    const usedCap = isCapacity ? this._usedCapacity(type) : 0;
    const freeCap = totalCap - usedCap;
    const landName = (DATA.landPrereqs[type] || {}).name || '土地';
    const ownedCats = owned.map(o => o.category);
    const ownedCategories = ind.categories.filter(c => ownedCats.includes(c.code));
    const unownedCategories = ind.categories.filter(c => !ownedCats.includes(c.code));
    const defaultTab = owned.length > 0 ? 'owned' : 'shop';
    const activeTab = this._activeTab || defaultTab;
    let h = '';
    h += '<div id="cap-section">';
    if (isCapacity) {
      h += '<div class="list-item" style="margin-bottom:12px;background:var(--bg-soft);">';
      h += '<div class="font-medium">' + ind.icon + ' 产能概览</div>';
      h += '<div class="text-sm text-muted" style="margin-top:4px;">总产能 ' + totalCap + ' ' + ind.unit + ' · 已分配 ' + usedCap + ' · ';
      h += freeCap > 0 ? '<span style="color:var(--info);">剩余 ' + freeCap + '</span>' : '<span style="color:var(--down);">已满</span>';
      h += '</div>';
      if (totalCap === 0) h += '<div class="text-sm" style="color:var(--warning);margin-top:6px;">⚠ 请先在地产购买【' + landName + '】</div>';
      h += '</div>';
    }
    h += '<div class="tab-container">';
    h += '<div class="tab-bar">';
    h += '<div class="tab' + (activeTab === 'owned' ? ' active' : '') + '" onclick="Pages.industryDetail.switchTab(\'' + type + '\', \'owned\', event)">我的产业 (' + ownedCategories.length + ')</div>';
    h += '<div class="tab' + (activeTab === 'shop' ? ' active' : '') + '" onclick="Pages.industryDetail.switchTab(\'' + type + '\', \'shop\', event)">可购入 (' + unownedCategories.length + ')</div>';
    h += '</div>';
    h += '<div class="tab-content' + (activeTab === 'owned' ? ' active' : '') + '" id="tab-owned-' + type + '">';
    h += owned.length === 0 ? '<div class="empty">暂无产业，请在「可购入」中购买</div>' : owned.map(o => this.ownedItem(type, o)).join('');
    h += '</div>';
    h += '<div class="tab-content' + (activeTab === 'shop' ? ' active' : '') + '" id="tab-shop-' + type + '">';
    h += unownedCategories.length === 0 ? '<div class="empty">已购买全部</div>' : unownedCategories.map(cat => this.purchaseItem(type, cat)).join('');
    h += '</div>';
    h += '</div>';
    h += '</div>';
    return h;
  },

  switchTab(type, tab, event) {
    this._activeTab = tab;
    const container = document.getElementById('cap-section');
    if (!container) return;
    const tabs = container.querySelectorAll('.tab');
    const contents = container.querySelectorAll('.tab-content');
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    const tabIndex = tab === 'owned' ? 0 : 1;
    if (tabs[tabIndex]) tabs[tabIndex].classList.add('active');
    const content = document.getElementById('tab-' + tab + '-' + type);
    if (content) content.classList.add('active');
  },

  /* ===== 物流规则面板 ===== */
  _renderLogisticsPanel(owned) {
    var totalStations = 0;
    (State.data.industries || []).forEach(function(ind) {
      if (ind.type === 'logistics') totalStations += (ind.quantity || 1);
    });
    var totalSlots = LogisticsSystem.getTotalSlots();
    var usedSlots = LogisticsSystem.getUsedSlots();
    var freeSlots = totalSlots - usedSlots;
    var bestFee = LogisticsSystem.getBestFeeRate();
    var canBuy = LogisticsSystem.canAutoBuy();
    var rules = State.data.logisticsRules || [];

    var h = '';

    // One-line summary
    h += '<div class="list-item" style="margin-bottom:8px;padding:8px 12px;">';
    h += '<div style="font-size:13px;">';
    h += '\ud83d\ude9a \u7269\u6d41\u7ad9 \xd7 ' + totalStations + ' \xb7 \u69fd\u4f4d ' + usedSlots + '/' + totalSlots + ' \xb7 \u6700\u4f18\u8d39\u7387 ' + (bestFee * 100).toFixed(2) + '%';
    if (canBuy) h += ' \xb7 <span style="color:var(--up);">\u81ea\u52a8\u4e70\u5165\u2714</span>';
    h += '</div></div>';

    // Rules as compact cards
    if (rules.length === 0) {
      h += '<div class="empty" style="padding:16px;">\u6682\u65e0\u89c4\u5219</div>';
    } else {
      for (var ri = 0; ri < rules.length; ri++) {
        var rule = rules[ri];
        var mat = DATA.rawMaterials.find(function(m) { return m.code === rule.materialCode; });
        var matName = mat ? mat.name : rule.materialCode;
        var matUnit = mat ? mat.unit : '';
        var typeLabel = rule.type === 'sell_above' ? '\u5356\u51fa' : '\u4e70\u5165';
        var typeColor = rule.type === 'sell_above' ? 'var(--up)' : 'var(--down)';
        var arrow = rule.type === 'sell_above' ? '\u2191' : '\u2193';
        h += '<div class="list-item" style="margin-bottom:4px;padding:8px 12px;">';
        h += '<div class="list-row">';
        h += '<div style="flex:1;min-width:0;">';
        h += '<span class="font-medium">' + matName + '</span>';
        h += ' <span style="color:' + typeColor + ';font-size:12px;">' + arrow + typeLabel + '</span>';
        h += ' <span class="text-sm text-muted">' + rule.threshold.toLocaleString('zh-CN') + matUnit + ' / ' + rule.percentage + '%</span>';
        h += '</div>';
        h += '<button class="btn sm" style="min-height:26px;font-size:11px;min-width:40px;" onclick="LogisticsSystem.removeRule(' + ri + ');Pages.industryDetail._refreshLogisticsPanel();">\u5220\u9664</button>';
        h += '</div></div>';
      }
    }

    // Add button
    h += '<button class="btn full primary" style="margin-top:8px;" ' + (freeSlots <= 0 ? 'disabled style="opacity:0.4;"' : '') + ' onclick="Pages.industryDetail._showAddRuleModal()">';
    h += freeSlots <= 0 ? '\u89c4\u5219\u69fd\u4f4d\u5df2\u6ee1' : '+ \u6dfb\u52a0\u89c4\u5219';
    h += '</button>';

    return h;
  },

  _refreshLogisticsPanel() {
    Router.refresh();
  },

  _showAddRuleModal() {
    var canBuy = LogisticsSystem.canAutoBuy();
    var freeSlots = LogisticsSystem.getFreeSlots();
    if (freeSlots <= 0) { UI.toast('\u89c4\u5219\u69fd\u4f4d\u5df2\u6ee1'); return; }
    var materials = DATA.rawMaterials;
    var id = 'lr_' + Date.now();

    // Quick templates
    var content = '<div style="display:flex;gap:6px;margin-bottom:12px;">';
    content += '<button class="btn sm" style="flex:1;" onclick="Pages.industryDetail._applyTemplate(\'' + id + '\', \'sell_above\', 100)">\ud83d\udce4 \u5356\u51fa\u8fc7\u5269</button>';
    content += '<button class="btn sm" style="flex:1;" onclick="Pages.industryDetail._applyTemplate(\'' + id + '\', \'buy_below\', 50)"' + (!canBuy ? ' disabled style="opacity:0.4;flex:1;"' : '') + '>\ud83d\udce5 \u4e70\u5165\u7d27\u7f3a</button>';
    content += '<button class="btn sm" style="flex:1;" onclick="Pages.industryDetail._showCustomSettings(\'' + id + '\')">\u2699\ufe0f \u81ea\u5b9a\u4e49</button>';
    content += '</div>';

    // Material selection
    content += '<div class="input-group"><label>\u9009\u62e9\u7269\u6599</label>';
    content += '<input type="text" id="' + id + '_search" placeholder="\u641c\u7d22\u7269\u6599..." oninput="Pages.industryDetail._filterMaterials(\'' + id + '\')" style="width:100%;padding:8px;border-radius:var(--radius-md);border:0.5px solid var(--border-strong);background:var(--bg-card);color:var(--text-primary);font-size:13px;margin-bottom:6px;">';
    content += '<div id="' + id + '_list" class="mat-list" style="max-height:180px;overflow-y:auto;border:0.5px solid var(--border);border-radius:var(--radius-md);background:var(--bg-card);margin-bottom:8px;">';
    for (var i = 0; i < materials.length; i++) {
      var m = materials[i];
      var inv = State.data.inventory || {};
      var have = inv[m.code] || 0;
      var _py = m.name.split('').map(function(ch){ return Pages.industryDetail._pyMap[ch] || ch; }).join('');
      content += '<div class="mat-item" data-code="' + m.code + '" data-pinyin="' + _py + '" onclick="Pages.industryDetail._selectMaterial(\'' + id + '\', \'' + m.code + '\')">';
      content += '<div><span class="font-medium">' + m.name + '</span><span class="text-muted" style="font-size:11px;margin-left:4px;">' + m.unit + '</span></div>';
      content += '<span class="text-sm text-muted">\u5e93\u5b58 ' + have.toFixed(0) + '</span>';
      content += '</div>';
    }
    content += '</div>';
    content += '<input type="hidden" id="' + id + '_mat" value="">';
    content += '<input type="hidden" id="' + id + '_type" value="">';
    content += '<input type="hidden" id="' + id + '_threshold" value="100">';
    content += '<input type="hidden" id="' + id + '_pct" value="50">';
    content += '</div>';

    // Settings area (hidden until template selected)
    content += '<div id="' + id + '_settings" style="display:none;">';
    content += '<div style="padding:8px;background:var(--bg-soft);border-radius:var(--radius-md);margin-bottom:8px;">';
    content += '<div class="text-sm" id="' + id + '_summary" style="margin-bottom:8px;"></div>';
    content += '<div style="margin-bottom:10px;">';
    content += '<div class="text-sm" id="' + id + '_thresh_label">\u9608\u503c\uff1a100</div>';
    content += '<input type="range" id="' + id + '_thresh_slider" min="0" max="1000" value="100" step="1" style="width:100%;" oninput="Pages.industryDetail._updateThreshLabel(\'' + id + '\')">';
    content += '</div>';
    content += '<div style="margin-bottom:8px;">';
    content += '<div class="text-sm" id="' + id + '_pct_label">\u6267\u884c\u6bd4\u4f8b\uff1a50%</div>';
    content += '<input type="range" id="' + id + '_pct_slider" min="1" max="100" value="50" step="1" style="width:100%;" oninput="Pages.industryDetail._updatePctLabel(\'' + id + '\')">';
    content += '</div>';
    content += '</div></div>';

    content += '<p class="text-sm text-muted" style="margin-top:4px;">\u5269\u4f59\u89c4\u5219\u69fd\u4f4d: ' + freeSlots + '</p>';

    window._lrState = { id: id };
    UI.modal('\u6dfb\u52a0\u7269\u6d41\u89c4\u5219', content, [
      { label: '\u53d6\u6d88', onclick: 'UI.closeModal()' },
      { label: '\u786e\u8ba4\u6dfb\u52a0', class: 'primary', onclick: 'Pages.industryDetail._confirmAddRule("' + id + '")' }
    ]);
  },

  _applyTemplate(id, type, pct) {
    var mat = document.getElementById(id + '_mat').value;
    if (!mat) { UI.toast('\u8bf7\u5148\u9009\u62e9\u7269\u6599'); return; }
    document.getElementById(id + '_type').value = type;
    document.getElementById(id + '_pct').value = pct;
    var pctSlider = document.getElementById(id + '_pct_slider');
    if (pctSlider) { pctSlider.value = pct; }
    var inv = State.data.inventory || {};
    var current = inv[mat] || 0;
    var matData = DATA.rawMaterials.find(function(m) { return m.code === mat; });
    var unit = matData ? matData.unit : '';
    var threshold = type === 'sell_above' ? Math.max(100, Math.round(current * 1.2)) : Math.max(50, Math.round(current * 0.5));
    threshold = Math.round(threshold / 10) * 10;
    document.getElementById(id + '_threshold').value = threshold;
    var maxThresh = Math.max(1000, Math.round(current * 3));
    var slider = document.getElementById(id + '_thresh_slider');
    slider.max = maxThresh;
    slider.value = threshold;
    var typeLabel = type === 'sell_above' ? '\u5356\u51fa' : '\u4e70\u5165';
    var matName = matData ? matData.name : mat;
    document.getElementById(id + '_summary').innerHTML = '<strong>' + typeLabel + '</strong> ' + matName + ' ' + unit + ' \xb7 ' + pct + '%';
    this._updateThreshLabel(id);
    this._updatePctLabel(id);
    document.getElementById(id + '_settings').style.display = '';
  },

  _showCustomSettings(id) {
    var mat = document.getElementById(id + '_mat').value;
    if (!mat) { UI.toast('\u8bf7\u5148\u9009\u62e9\u7269\u6599'); return; }
    document.getElementById(id + '_type').value = 'sell_above';
    this._applyTemplate(id, 'sell_above', 50);
  },

  _updateThreshLabel(id) {
    var slider = document.getElementById(id + '_thresh_slider');
    var val = parseInt(slider.value) || 0;
    document.getElementById(id + '_threshold').value = val;
    var mat = document.getElementById(id + '_mat').value;
    var matData = DATA.rawMaterials.find(function(m) { return m.code === mat; });
    var unit = matData ? matData.unit : '';
    var _label = val === 0 ? '\u9608\u503c\uff1a0\uff08\u6709\u8d27\u5373\u5356\uff09' : '\u9608\u503c\uff1a\u8d85\u8fc7 ' + val.toLocaleString('zh-CN') + ' ' + unit + ' \u65f6\u89e6\u53d1';
    document.getElementById(id + '_thresh_label').textContent = _label;
  },

  _updatePctLabel(id) {
    var slider = document.getElementById(id + '_pct_slider');
    var val = parseInt(slider.value) || 50;
    document.getElementById(id + '_pct').value = val;
    document.getElementById(id + '_pct_label').textContent = '\u6267\u884c\u6bd4\u4f8b\uff1a' + val + '%';
  },

  _filterMaterials(id) {
    var search = document.getElementById(id + '_search').value.toLowerCase();
    var list = document.getElementById(id + '_list');
    var items = list.querySelectorAll('.mat-item');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var name = item.querySelector('.font-medium').textContent.toLowerCase();
      var py = (item.getAttribute('data-pinyin') || '').toLowerCase();
      var code = (item.getAttribute('data-code') || '').toLowerCase();
      item.style.display = (name.indexOf(search) >= 0 || py.indexOf(search) >= 0 || code.indexOf(search) >= 0) ? '' : 'none';
    }
  },

  _selectMaterial(id, code) {
    var list = document.getElementById(id + '_list');
    var items = list.querySelectorAll('.mat-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove('selected');
    }
    var selected = list.querySelector('[data-code="' + code + '"]');
    if (selected) selected.classList.add('selected');
    document.getElementById(id + '_mat').value = code;
  },

  _confirmAddRule(id) {
    var mat = document.getElementById(id + '_mat').value;
    var type = document.getElementById(id + '_type').value;
    var threshold = parseFloat(document.getElementById(id + '_threshold').value) || 0;
    var pct = parseFloat(document.getElementById(id + '_pct').value) || 0;
    if (!mat) { UI.toast('\u8bf7\u9009\u62e9\u7269\u6599'); return; }
    if (!type) { UI.toast('\u8bf7\u9009\u62e9\u6a21\u677f\u6216\u81ea\u5b9a\u4e49\u8bbe\u7f6e'); return; }
    if (threshold < 0) { UI.toast('\u9608\u503c\u4e0d\u80fd\u4e3a\u8d1f\u6570'); return; }
    if (pct <= 0 || pct > 100) { UI.toast('\u6bd4\u4f8b\u9700\u57281-100\u4e4b\u95f4'); return; }
    if (LogisticsSystem.getFreeSlots() <= 0) { UI.toast('\u89c4\u5219\u69fd\u4f4d\u5df2\u6ee1'); return; }
    if (type === 'buy_below' && !LogisticsSystem.canAutoBuy()) { UI.toast('\u9700\u8981\u652f\u6301\u81ea\u52a8\u4e70\u5165\u7684\u7269\u6d41\u7ad9'); return; }
    LogisticsSystem.addRule({ materialCode: mat, type: type, threshold: threshold, percentage: pct });
    UI.closeModal();
    this._refreshLogisticsPanel();
    UI.toast('\u89c4\u5219\u5df2\u6dfb\u52a0');
  },

  /* ===== 工厂产品分配卡片渲染 ===== */
  _renderFactoryProductCard(type, o, cat, ind, qty, empCnt, empMult, hasStaff, inv) {
    const products = cat.products || [];
    const alloc = o.products || {};
    const level = o.level || 1;
    const maxLevel = DATA.maxIndustryLevel || 5;

    // 已分配生产线总数
    let allocLines = 0;
    Object.values(alloc).forEach(v => { allocLines += v; });

    // 计算各产品的实时日收入
    const levelMult = Engine.levelMultiplier(level);
    let totalProdIncome = 0;
    const prodIncomes = {};
    products.forEach(p => {
      const lineCount = alloc[p.code] || 0;
      if (lineCount > 0 && hasStaff) {
        const inc = FactoryProducts.productDailyIncome(type + '_' + o.category, p.code, lineCount, empMult, levelMult);
        // 注意：productDailyIncome 需要 factoryCode（如 'food'），这里直接传 category 即可
        const inc2 = p.sellPrice * lineCount * empMult * levelMult;
        prodIncomes[p.code] = inc2;
        totalProdIncome += inc2;
      } else {
        prodIncomes[p.code] = 0;
      }
    });

    const hasAlloc = allocLines > 0;
    const freeLines = qty - allocLines;

    let h = '';
    h += '<div class="list-item">';

    // === 头部：厂名 + 员工 ===
    h += '<div class="list-row">';
    h += '<div>';
    h += '<div class="font-medium">' + cat.name + (Pages.industryDetail._showLevelDisplay(type) ? ' · Lv' + level : '') + ' × ' + qty.toLocaleString('zh-CN') + ' ' + ind.unit + '</div>';
    h += '<div class="text-sm ' + (hasStaff ? 'text-muted' : '') + '" style="' + (hasStaff ? '' : 'color:var(--down);') + '">';
    if (hasStaff) {
      h += '员工 ' + empCnt + '人 · 加成 ×' + empMult.toFixed(1) + ' · 日入 ' + State.formatMoney(totalProdIncome);
    } else {
      h += '⚠️ 无员工 · 无产出';
    }
    h += '</div>';
    h += '</div>';
    h += '<button class="btn sm" style="' + (hasStaff ? 'border-color:var(--info);color:var(--info);' : 'border-color:var(--warning);color:var(--warning);') + '" onclick="Staff.showAssignPickerByIndustry(\'' + type + '\', \'' + o.category + '\')">' + (hasStaff ? '调整' : '派人') + '</button>';
    h += '</div>';

    // === 产能概况 ===
    const tableId = 'pt_' + type + '_' + o.category;
    h += '<div class="text-sm" id="pcap_' + tableId + '" style="margin:6px 0 4px 0;">';
    h += '总产能 <strong>' + qty + '</strong> ' + ind.unit + ' · 已分配 <strong id="pcap_alloc_' + tableId + '">' + allocLines + '</strong> · ';
    h += freeLines > 0 ? '<span style="color:var(--info);">剩余 <strong id="pcap_free_' + tableId + '">' + freeLines + '</strong></span>' : '<span style="color:var(--down);" id="pcap_free_' + tableId + '">已满</span>';
    h += '</div>';

    // === 生产频率提示 ===
    h += '<div class="text-sm text-muted" style="margin:4px 0 6px 0; border-left:2px solid var(--info); padding-left:6px;">';
    h += '⏱ 生产频率：每 3 秒一批 · 实时结算';
    // 显示预计每批产出
    if (hasStaff && hasAlloc) {
      let batchTotal = 0;
      products.forEach(p => {
        const lc = alloc[p.code] || 0;
        if (lc > 0 && empMult > 0) {
          const sat = FactoryProducts.productSatisfaction(o.category, p.code, lc);
          batchTotal += p.sellPrice * lc * empMult * levelMult * sat * 0.05;
        }
      });
      h += ' · <span style="color:var(--up);">预计每批产出 ' + State.formatMoney(batchTotal) + ' / 3秒</span>';
    } else {
      h += ' · <span class="text-muted">需分配员工和产品</span>';
    }
    h += '</div>';

    // === 产品分配表格（可折叠） ===
    const hasAllocSummary = allocLines > 0 ? ('(' + allocLines + '条, ' + (hasStaff ? State.formatMoney(totalProdIncome) : '¥0') + '/日)') : '(未分配)';
    // 恢复上次展开状态
    const wasExpanded = window._expandedProdTables && window._expandedProdTables[tableId];
    const initDisplay = wasExpanded ? '' : 'none';
    const initArrow = wasExpanded ? '▼' : '▶';
    h += '<div style="margin:8px 0;border:1px solid var(--border);border-radius:6px;overflow:hidden;">';
    h += '<div style="padding:5px 8px;background:var(--bg-soft);font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:space-between;" onclick="Industry._toggleProdTable(\'' + tableId + '\', this)">';
    h += '<span>📦 产品分配 <span class="text-muted" style="font-weight:400;font-size:11px;" id="phead_' + tableId + '">' + hasAllocSummary + '</span></span>';
    h += '<span id="' + tableId + '_arrow" style="font-size:14px;transition:transform 0.2s;">' + initArrow + '</span>';
    h += '</div>';
    h += '<div id="' + tableId + '" style="display:' + initDisplay + ';">';

    // 表头
    h += '<div style="display:flex;padding:4px 8px;font-size:11px;color:var(--text-muted);border-bottom:1px solid var(--border);">';
    h += '<div style="flex:1;">产品</div>';
    h += '<div style="width:36px;text-align:center;">产能</div>';
    h += '<div style="width:48px;text-align:center;">日入</div>';
    h += '<div style="width:56px;text-align:center;"></div>';
    h += '</div>';

    // 每个产品行
    products.forEach(p => {
      h += this._renderProductRow(tableId, type, o.category, p, alloc, prodIncomes, freeLines > 0 || (alloc[p.code] || 0) > 0);
    });

    // 产品分配统计行
    h += '<div style="display:flex;padding:5px 8px;font-size:12px;background:var(--bg-soft);border-top:1px solid var(--border);">';
    h += '<div style="flex:1;">合计</div>';
    h += '<div id="psum_qty_' + tableId + '" style="width:36px;text-align:center;font-weight:500;">' + allocLines + '</div>';
    h += '<div id="psum_inc_' + tableId + '" style="width:48px;text-align:center;color:var(--up);font-weight:500;">' + (hasStaff ? State.formatMoney(totalProdIncome) : '¥0') + '</div>';
    h += '<div style="width:56px;"></div>';
    h += '</div>';

    h += '</div>';
    h += '</div>';

    // === 原料紧缺提示 ===
    let anyShortage = false;
    if (hasAlloc && hasStaff) {
      products.forEach(p => {
        const lc = alloc[p.code] || 0;
        if (lc > 0) {
          const sat = FactoryProducts.productSatisfaction(o.category, p.code, lc);
          if (sat < 1) anyShortage = true;
        }
      });
    }
    if (anyShortage) {
      h += '<div class="text-sm" style="color:var(--warning);margin:4px 0;">';
      h += '⚠ 部分产品原料不足，产出下降 · <a onclick="Router.go(\'warehouse\')" style="color:var(--info);text-decoration:underline;">去仓库 →</a>';
      h += '</div>';
    }

    // === 操作按钮 ===
    h += '<div class="flex gap-8 mt-8">';
    h += '<button class="btn sm" style="flex:1;border-color:var(--info);color:var(--info);" onclick="Industry.allocProduct(\'' + type + '\',\'' + o.category + '\')">分配产品</button>';
    h += '<button class="btn sm danger" style="flex:1;" onclick="Industry.sell(\'' + type + '\',\'' + o.category + '\')">减少</button>';
    h += '<button class="btn sm" style="flex:1;" onclick="Industry.buy(\'' + type + '\',\'' + o.category + '\')">增加</button>';
    h += '</div>';

    h += '</div>';
    return h;
  },

  /* 渲染单个产品行 */
  _renderProductRow(tableId, type, categoryCode, product, alloc, prodIncomes, canAdjust) {
    const qty = alloc[product.code] || 0;
    const income = prodIncomes[product.code] || 0;
    const tierName = FactoryProducts.tierNames[product.tier] || '';
    const tierColor = FactoryProducts.tierColors[product.tier] || '#9a9a9f';
    const recipeStr = FactoryProducts.formatRecipe(product.recipe);

    // 原料库存状态
    const inv = State.data.inventory || {};
    let shortage = false;
    if (qty > 0) {
      product.recipe.forEach(r => {
        const have = inv[r.code] || 0;
        if (have < r.qty * qty) shortage = true;
      });
    }

    let h = '';
    h += '<div style="display:flex;align-items:center;padding:6px 8px;border-bottom:1px solid var(--border);">';
    h += '<div style="flex:1;min-width:0;">';
    h += '<div style="font-size:13px;font-weight:500;">';
    h += product.name;
    if (tierName) {
      h += '<span style="font-size:10px;color:' + tierColor + ';margin-left:4px;padding:1px 4px;border:1px solid ' + tierColor + ';border-radius:3px;">' + tierName + '</span>';
    }
    if (shortage) {
      h += '<span style="font-size:10px;color:var(--warning);margin-left:4px;">⚠</span>';
    }
    h += '</div>';
    h += '<div class="text-muted" style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">';
    h += '配方: ' + recipeStr + ' · ¥' + product.sellPrice + '/' + (product.unit || '条');
    h += '</div>';
    h += '</div>';
    // 产能数量
    h += '<div style="width:36px;text-align:center;font-weight:500;font-size:13px;" id="pq_' + tableId + '_' + product.code + '">' + qty + '</div>';
    // 日收入
    h += '<div style="width:48px;text-align:center;font-size:12px;color:var(--up);">' + (income > 0 ? State.formatMoney(income) : '—') + '</div>';
    // 操作按钮
    h += '<div style="width:56px;display:flex;gap:2px;justify-content:flex-end;">';
    h += '<button class="btn sm" style="min-width:24px;padding:1px 5px;font-size:14px;line-height:1;" onclick="Industry.incProdAlloc(\'' + type + '\',\'' + categoryCode + '\',\'' + product.code + '\')">+</button>';
    h += '<button class="btn sm danger' + (qty <= 0 ? ' disabled-look' : '') + '" style="min-width:24px;padding:1px 5px;font-size:14px;line-height:1;' + (qty <= 0 ? 'opacity:0.3;' : '') + '" onclick="Industry.decProdAlloc(\'' + type + '\',\'' + categoryCode + '\',\'' + product.code + '\')">−</button>';
    h += '</div>';
    h += '</div>';
    return h;
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

    // ★ 工厂产品分配视图：如果该工厂有产品定义，使用全新的产品卡片布局
    if (type === 'factory' && window.FactoryProducts && cat.products && cat.products.length > 0) {
      return this._renderFactoryProductCard(type, o, cat, ind, qty, empCnt, empMult, hasStaff, inv);
    }



    let recipeSat = 1.0;

    let recipeInfo = '';



    // 农业/矿业：显示产出信息

    if ((type === 'farm' || type === 'mining') && cat.produces) {

      const mat = DATA.rawMaterials.find(m => m.code === cat.produces.code);

      const matName = mat ? mat.name : cat.produces.code;

      const licenseMult = (type === 'mining' && o.licenseLevel && o.licenseLevel > 1)
        ? (1 + (o.licenseLevel - 1) * 0.2) : 1;
      const dailyProduce = hasStaff ? cat.produces.qty * qty * empMult * licenseMult : 0;

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

        const dailyProduce = hasStaff ? cat.produces.qty * qty * empMult : 0;

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



    // 有产出的产业使用 产出量×市场价，无产出的使用 dailyIncome
    let daily = 0;
    if (hasStaff) {
      if (cat.produces) {
        const licenseMult = (type === 'mining' && o.licenseLevel && o.licenseLevel > 1)
              ? (1 + (o.licenseLevel - 1) * 0.2) : 1;
              const produceQty = cat.produces.qty * qty * empMult * recipeSat * licenseMult;
        const matPrice = Employees.materialPrice(cat.produces.code);
        daily = produceQty * matPrice;
      } else {
        daily = (cat.dailyIncome || 0) * Engine.levelMultiplier(o.level || 1) * qty * empMult * recipeSat;
      }
    }

    // 采矿许可证信息
    let licenseInfo = '';
    const licenseMaxLevel = DATA.industries.mining.licenseMaxLevel || 5;
    if (type === 'mining') {
      const licLv = o.licenseLevel || 1;
      const bonusPct = (licLv - 1) * 20;
      licenseInfo = `<div class="text-sm text-muted" style="margin-top:4px;">📜 许可证 Lv${licLv}${bonusPct > 0 ? ' · 产出+' + bonusPct + '% · 维护-' + Math.round((1 - 1/(1+(licLv-1)*0.1))*100) + '%' : ''}</div>`;
    }

    return `

      <div class="list-item">

        <div class="list-row">

          <div>

            <div class="font-medium">${cat.name}${Pages.industryDetail._showLevelDisplay(type) ? ' · Lv' + (o.level||1) : ''} × ${qty.toLocaleString('zh-CN')} ${ind.unit}</div>

            <div class="text-sm ${hasStaff ? 'text-muted' : ''}" style="${hasStaff ? '' : 'color:var(--down);'}">

              ${hasStaff

                ? `员工 ${empCnt}人 · 加成 ×${empMult.toFixed(1)} · 日入 <span id="ind_daily_${type}_${o.category}">${State.formatMoney(daily)}</span>`

                : '⚠️ 无员工 · 无产出'}

            </div>

            ${recipeInfo}
            ${licenseInfo}

          </div>

          <div class="flex gap-8">

            <button class="btn sm" style="${hasStaff ? 'border-color:var(--info);color:var(--info);' : 'border-color:var(--warning);color:var(--warning);'}" onclick="Staff.showAssignPickerByIndustry('${type}', '${o.category}')">${hasStaff ? '调整' : '派人'}</button>

          </div>

        </div>

        <div class="flex gap-8 mt-8">

          <button class="btn sm danger" style="flex:1;" onclick="Industry.sell('${type}','${o.category}')">${!cat.cost ? '减少' : '出售'}</button>
          ${Pages.industryDetail._showLevelDisplay(type) && cat.cost ? `<button class="btn sm" style="flex:1;" ${(o.level||1) >= (DATA.maxIndustryLevel||5) ? 'disabled style="opacity:0.4;flex:1;"' : ''} onclick="Industry.upgrade('${type}','${o.category}')">${(o.level||1) >= (DATA.maxIndustryLevel||5) ? '已满级' : '升级'}</button>` : ''}
          ${type === 'mining' ? `<button class="btn sm" style="flex:1;border-color:var(--warning);color:var(--warning);" ${(o.licenseLevel||1) >= (DATA.industries.mining.licenseMaxLevel||5) ? 'disabled style="opacity:0.4;flex:1;"' : ''} onclick="Industry.upgradeLicense('${type}','${o.category}')">${(o.licenseLevel||1) >= (DATA.industries.mining.licenseMaxLevel||5) ? '许可证已满级' : '升级许可证'}</button>` : ''}

          <button class="btn sm" style="flex:1;" onclick="Industry.buy('${type}','${o.category}')">${!cat.cost ? '增加' : '加购'}</button>

        </div>

      </div>

    `;

  },



  purchaseItem(type, cat) {

    const ind = DATA.industries[type];

    const isCap = Pages.industryDetail._isCapacity(type) && !cat.cost;
    const capTotal = isCap ? Pages.industryDetail._totalCapacity(type) : 0;
    const capUsed = isCap ? Pages.industryDetail._usedCapacity(type) : 0;
    const capFree = capTotal - capUsed;
    // 矿业：首次购买含许可证费用
    const hasMining = type === 'mining' ? (State.data.industries || []).some(i => i.type === 'mining' && i.category === cat.code) : false;
    const totalCost = type === 'mining' ? (cat.cost + (hasMining ? 0 : (cat.licenseCost || 0))) : cat.cost;
    const maxQty = totalCost ? Math.floor(State.data.cash / totalCost) : 0;
    const canAfford = maxQty > 0;

    let estDaily = cat.produces ? cat.produces.qty * Employees.materialPrice(cat.produces.code) : (cat.dailyIncome || 0);
    const payback = cat.cost && estDaily > 0 ? (cat.cost / estDaily).toFixed(0) : '—';

    // 日产量相关变量
    const estDailyProduce = cat.produces ? cat.produces.qty : 0;
    const produceMat = cat.produces ? DATA.rawMaterials.find(m => m.code === cat.produces.code) : null;
    const produceUnit = produceMat ? produceMat.unit : '';
    const produceName = produceMat ? produceMat.name : '';

    // check land prereq
    const _prereq = DATA.landPrereqs ? DATA.landPrereqs[type] : null;
    let _hasPrereq = true;
    let _reqLabel = '';
    if (_prereq) {
      _hasPrereq = (State.data.industries || []).some(i => i.type === 'estate' && i.category === _prereq.code && (i.quantity || 1) > 0);
      _reqLabel = _hasPrereq ? '' : '需先在地产购买 ' + _prereq.name;
    }

    let _btnOnclick, _btnDisabled, _btnClass, _btnLabel;
    if (isCap) {
      _btnOnclick = "Industry.allocPlus('" + type + "','" + cat.code + "')";
      _btnDisabled = capFree <= 0 || !_hasPrereq;
      _btnClass = capFree > 0 && _hasPrereq ? 'primary' : '';
      if (!_hasPrereq) {
        _btnLabel = '需购 ' + _prereq.name;
      } else if (capFree > 0) {
        _btnLabel = '分配产能（剩余 ' + capFree + ' ' + ind.unit + '）';
      } else {
        _btnLabel = '产能已满，请购 ' + ((DATA.landPrereqs || {})[type] || {}).name;
      }
    } else {
      _btnOnclick = "Industry.buy('" + type + "','" + cat.code + "')";
      _btnDisabled = !_hasPrereq || !canAfford;
      _btnClass = !_btnDisabled ? 'primary' : '';
      if (!_hasPrereq) {
        _btnLabel = '需购 ' + _prereq.name;
      } else if (canAfford) {
        _btnLabel = '购入（可买 ' + maxQty.toLocaleString('zh-CN') + ' ' + ind.unit + '）';
      } else {
        _btnLabel = '现金不足';
      }
    }

    return `
      <div class="list-item">
        <div class="list-row">
          <div>
            <div class="font-medium">${cat.name}</div>
            <div class="text-sm text-muted">日入 ${State.formatMoney(cat.produces ? cat.produces.qty * Employees.materialPrice(cat.produces.code) : cat.dailyIncome)}/${ind.unit} · 回本 ${payback} 天${cat.cycle ? ' · ' + cat.cycle : ''}${cat.reserve ? ' · 储量 ' + cat.reserve + ' 天' : ''}${type === 'mining' && cat.licenseCost && !hasMining ? ' · 含采矿许可证 ' + State.formatMoney(cat.licenseCost) : ''}${type === 'factory' && cat.products && cat.products.length > 0 ? ' · ' + cat.products.length + '种产品可分配' : ''}${type === 'factory' && !cat.products && DATA.factoryRecipes[cat.code] ? ' · 需: ' + DATA.factoryRecipes[cat.code].map(r => { const m = DATA.rawMaterials.find(m2 => m2.code === r.code); return (m ? m.name : r.code) + '×' + r.qty; }).join('+') : ''}${type === 'metall' && DATA.smelterRecipes[cat.code] ? ' · 需: ' + DATA.smelterRecipes[cat.code].map(r => { const m = DATA.rawMaterials.find(m2 => m2.code === r.code); return (m ? m.name : r.code) + '×' + r.qty; }).join('+') : ''}</div>
    ${estDailyProduce > 0 ? `<div class="text-sm text-muted">📦 日产量 ${estDailyProduce}${produceUnit}${produceName ? '(' + produceName + ')' : ''}/${ind.unit}</div>` : ''}
          </div>
          <div style="text-align:right;">
            <div class="font-medium">${totalCost ? State.formatMoney(totalCost) : '—'}</div>
            <div class="text-sm text-muted">/${ind.unit}${type === 'mining' && !hasMining ? ' +许可证' : ''}</div>
          </div>
        </div>
        ${!_hasPrereq ? '<div class="text-sm" style="color:var(--warning);margin-top:6px;">' + _reqLabel + '</div>' : ''}
        <div class="mt-8">
          <button class="btn sm full ${_btnClass}" ${_btnDisabled ? 'disabled style="opacity:0.4;"' : ''} onclick="${_btnOnclick}">
            ${_btnLabel}
          </button>
        </div>
      </div>
    `;}

};



const Industry = {

  allocPlus(type, categoryCode) {

    const total = Pages.industryDetail._totalCapacity(type);

    const used = Pages.industryDetail._usedCapacity(type);

    const free = total - used;

    if (free <= 0) {

      UI.toast('产能已满，请先在地产购买更多' + ((DATA.landPrereqs || {})[type] || {}).name);

      return;

    }

    const existing = State.data.industries.find(i => i.type === type && i.category === categoryCode);

    const currentQty = existing ? (existing.quantity || 0) : 0;

    const cat = State.findIndustryCategory(type, categoryCode);

    const ind = DATA.industries[type];

    UI.capacitySlider({

      title: '可分配 ' + cat.name,

      max: free + currentQty,

      current: currentQty,

      unitLabel: cat.name + '（' + ind.unit + '）',

      onConfirm: (qty) => {

        if (qty <= 0) { UI.toast('请选择数量'); return; }

        if (existing) {

          existing.quantity = qty;

        } else if (qty > 0) {

          State.data.industries.push({

            type: type, category: categoryCode, level: 1, quantity: qty,

            purchaseDay: State.data.date.totalDays

          });

        }

        State.save();

        Pages.industryDetail._refreshCapacity(type);

        UI.toast('已分配 ' + qty + ' ' + ind.unit);

      }

    });

  },



  allocMinus(type, categoryCode) {

    const existing = State.data.industries.find(i => i.type === type && i.category === categoryCode);

    if (!existing || (existing.quantity || 0) <= 0) {

      UI.toast('没有可减少的产能');

      return;

    }

    const currentQty = existing.quantity || 0;

    const cat = State.findIndustryCategory(type, categoryCode);

    const ind = DATA.industries[type];

    UI.capacitySlider({

      title: '减少 ' + cat.name,

      max: currentQty,

      current: currentQty,

      unitLabel: cat.name + '（' + ind.unit + '）',

      onConfirm: (qty) => {

        if (qty >= currentQty) {

          State.data.industries = State.data.industries.filter(i => !(i.type === type && i.category === categoryCode));

          (State.data.employees || []).forEach(g => {

            if (g.assign && g.assign.type === type && g.assign.category === categoryCode) {

              g.assign = null;

            }

          });

          UI.toast('已移除 ' + cat.name);

        } else {

          existing.quantity = qty;

          UI.toast('已减少至 ' + qty + ' ' + ind.unit);

        }

        State.save();

        Pages.industryDetail._refreshCapacity(type);

      }

    });

  },



  buy(type, categoryCode) {

    const cat = State.findIndustryCategory(type, categoryCode);

    if (!cat) return;

    // 产能产业（农业/冶金/工厂）没有 cost 属性，使用容量滑块调整产能
    if (Pages.industryDetail._isCapacity(type) && !cat.cost) {
      Industry.allocPlus(type, categoryCode);
      return;
    }

    const _prereq = DATA.landPrereqs ? DATA.landPrereqs[type] : null;

    if (_prereq) {

      const _has = (State.data.industries || []).some(i => i.type === 'estate' && i.category === _prereq.code && (i.quantity || 1) > 0);

      if (!_has) {

        UI.toast('需先在地产购买【' + _prereq.name + '】');

        return;

      }

    }

    const ind = DATA.industries[type];
    const hasMining = type === 'mining' ? (State.data.industries || []).some(i => i.type === 'mining' && i.category === categoryCode) : false;
    const unitCost = type === 'mining' ? (cat.cost + (hasMining ? 0 : (cat.licenseCost || 0))) : cat.cost;
    const maxQty = Math.floor(State.data.cash / unitCost);

    if (maxQty <= 0) { UI.toast('现金不足'); return; }



    UI.numberPicker({

      title: '可购入 ' + cat.name,

      unit: unitCost,

      unitName: ind.unit,

      unitLabel: `${State.formatMoney(unitCost)}/${ind.unit} · 日入 ${State.formatMoney(cat.dailyIncome)}/${ind.unit}${type === 'mining' && !hasMining ? ' · 含许可证 ' + State.formatMoney(cat.licenseCost || 0) : ''}`,

      max: maxQty,

      quickAdds: maxQty >= 1000 ? [10, 100, 500, 1000] : [5, 10, 50, 100],

      onConfirm: (qty) => {

        if (qty <= 0) { UI.toast('请选择数量'); return; }

        const totalCost = unitCost * qty;

        State.data.cash -= totalCost;

        const existing = State.data.industries.find(i => i.type === type && i.category === categoryCode);

        if (existing) {

          existing.quantity = (existing.quantity || 1) + qty;

        } else {

          const newInd = {
            type: type,
            category: categoryCode,
            level: 1,
            quantity: qty,
            purchaseDay: State.data.date.totalDays
          };
          // 矿业：自动赠送许可证 Lv1
          if (type === 'mining') newInd.licenseLevel = 1;
          State.data.industries.push(newInd);

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

    const baseCost = cat.cost || ((cat.produces ? cat.produces.qty * Employees.materialPrice(cat.produces.code) : (cat.dailyIncome || 0)) * 30);
    const upgradeCost = baseCost * 0.8 * (owned.level || 1) * qty;

    if (State.data.cash < upgradeCost) { UI.toast('现金不足，需要 ' + State.formatMoney(upgradeCost)); return; }

    UI.confirm('升级 ' + cat.name, `Lv${owned.level} → Lv${owned.level+1}（全部 ${qty.toLocaleString('zh-CN')} ${ind.unit}）<br>花费 ${State.formatMoney(upgradeCost)}<br>日收入提升 20%（每级×1.2，上限Lv5）`, () => {

      State.data.cash -= upgradeCost;

      owned.level = (owned.level || 1) + 1;

      State.save();

      UI.toast('升级成功');

      Router.refresh();

    });

  },



  upgradeLicense(type, categoryCode) {

    const owned = State.data.industries.find(i => i.type === type && i.category === categoryCode);
    if (!owned) return;
    const cat = State.findIndustryCategory(type, categoryCode);
    const qty = owned.quantity || 1;
    const maxLevel = DATA.industries.mining.licenseMaxLevel || 5;
    const curLevel = owned.licenseLevel || 1;
    if (curLevel >= maxLevel) {
      UI.toast('\u8bb8\u53ef\u8bc1\u5df2\u8fbe\u6700\u9ad8\u7b49\u7ea7 Lv' + maxLevel);
      return;
    }
    const baseLicenseCost = cat.licenseCost || 0;
    const upgradeCost = Math.floor(baseLicenseCost * 0.8 * curLevel * qty);
    if (State.data.cash < upgradeCost) { UI.toast('\u73b0\u91d1\u4e0d\u8db3\uff0c\u9700\u8981 ' + State.formatMoney(upgradeCost)); return; }
    UI.confirm('\u5347\u7ea7\u8bb8\u53ef\u8bc1 - ' + cat.name, 'Lv' + curLevel + ' \u2192 Lv' + (curLevel + 1) + '\uff08\u5168\u90e8 ' + qty.toLocaleString('zh-CN') + ' \u4e2a\uff09<br>\u82b1\u8d39 ' + State.formatMoney(upgradeCost) + '<br>\u65e5\u6536\u63d0\u5347 20%\uff0c\u6210\u672c\u964d\u4f4e 10%\uff08\u6bcf\u7ea7\u00d71.2\uff0c\u4e0a\u9650Lv' + maxLevel + '\uff09', () => {
      State.data.cash -= upgradeCost;
      owned.licenseLevel = curLevel + 1;
      State.save();
      UI.toast('\u8bb8\u53ef\u8bc1\u5347\u7ea7\u6210\u529f Lv' + owned.licenseLevel);
      Router.refresh();
    });
  },



  sell(type, categoryCode) {

    const owned = State.data.industries.find(i => i.type === type && i.category === categoryCode);

    if (!owned) return;

    const cat = State.findIndustryCategory(type, categoryCode);

    const ind = DATA.industries[type];

    // 产能类型（农业/冶金/工厂）无 cost，使用 allocMinus 减少产能
    if (Pages.industryDetail._isCapacity(type) && !cat.cost) {
      Industry.allocMinus(type, categoryCode);
      return;
    }

    const qty = owned.quantity || 1;

    const baseCost = cat.cost || ((cat.produces ? cat.produces.qty * Employees.materialPrice(cat.produces.code) : (cat.dailyIncome || 0)) * 30);
    const refundPer = baseCost * 0.8;
    // 矿业：退款基数加入许可证费用（按持有量均摊，80%回收）
    let licenseRefund = 0;
    if (type === 'mining' && cat.licenseCost && cat.licenseCost > 0) {
      licenseRefund = Math.floor(cat.licenseCost * 0.8 / qty);
    }
    const finalRefundPer = refundPer + licenseRefund;



    UI.numberPicker({

      title: '出售 ' + cat.name,

      unit: finalRefundPer,

      unitName: ind.unit,

      unitLabel: `${State.formatMoney(finalRefundPer)}/${ind.unit} · 持有 ${qty.toLocaleString("zh-CN")} ${ind.unit}${licenseRefund > 0 ? " · 含许可证回收" : ""}`,

      max: qty,

      quickAdds: qty >= 1000 ? [10, 100, 500, 1000] : [5, 10, 50, 100],

      onConfirm: (sellQty) => {

        if (sellQty <= 0) { UI.toast('请选择数量'); return; }

        const refund = finalRefundPer * sellQty;

        State.data.cash += refund;

        owned.quantity = qty - sellQty;

        if (owned.quantity <= 0) {

          // 出售清空：释放分配到该产业的员工
          (State.data.employees || []).forEach(e => {
            if (e.assign && e.assign.type === type && e.assign.category === categoryCode) {
              e.assign = null;
            }
          });
          State.data.industries = State.data.industries.filter(i => !(i.type === type && i.category === categoryCode));

        }

        State.save();

        UI.toast(`出售 ${sellQty.toLocaleString('zh-CN')} ${ind.unit}，到账 ${State.formatMoney(refund)}`);

        Router.refresh();

      }

    });

  }

};

/* ===== 工厂产品分配系统 ===== */

Industry._ensureProductAlloc = function(type, categoryCode) {
  const owned = State.data.industries.find(i => i.type === type && i.category === categoryCode);
  if (owned) {
    if (!owned.products) owned.products = {};
    return owned;
  }
  return null;
};

/* 增量更新产品分配UI（不重新渲染整个卡片） */
Industry._updateProdAllocUI = function(type, categoryCode) {
  const tableId = 'pt_' + type + '_' + categoryCode;
  const owned = State.data.industries.find(i => i.type === type && i.category === categoryCode);
  if (!owned || !owned.products) return;
  const cat = State.findIndustryCategory(type, categoryCode);
  if (!cat) return;
  const qty = owned.quantity || 1;
  const level = owned.level || 1;
  const empMult = Employees.multiplier(type, categoryCode);
  const hasStaff = empMult > 0;
  const levelMult = Engine.levelMultiplier(level);

  // 重新计算
  let allocLines = 0;
  Object.values(owned.products).forEach(v => { allocLines += v; });
  const freeLines = qty - allocLines;
  let totalIncome = 0;
  (cat.products || []).forEach(p => {
    const lc = owned.products[p.code] || 0;
    const inc = lc > 0 && hasStaff ? p.sellPrice * lc * empMult * levelMult : 0;
    totalIncome += inc;
  });

  // 更新产能概况
  const allocEl = document.getElementById('pcap_alloc_' + tableId);
  if (allocEl) allocEl.textContent = allocLines;
  const freeEl = document.getElementById('pcap_free_' + tableId);
  if (freeEl) {
    if (freeLines > 0) {
      freeEl.textContent = freeLines;
    } else {
      freeEl.textContent = '已满';
    }
  }

  // 更新每个产品行的数量
  (cat.products || []).forEach(p => {
    const el = document.getElementById('pq_' + tableId + '_' + p.code);
    if (el) el.textContent = owned.products[p.code] || 0;
  });

  // 更新合计行
  const sumQty = document.getElementById('psum_qty_' + tableId);
  if (sumQty) sumQty.textContent = allocLines;
  const sumInc = document.getElementById('psum_inc_' + tableId);
  if (sumInc) sumInc.textContent = hasStaff ? State.formatMoney(totalIncome) : '¥0';

  // 更新折叠摘要
  const headEl = document.getElementById('phead_' + tableId);
  if (headEl) {
    headEl.textContent = allocLines > 0
      ? '(' + allocLines + '条, ' + (hasStaff ? State.formatMoney(totalIncome) : '¥0') + '/日)'
      : '(未分配)';
  }

  // 更新详情页头部的日入显示
  const headerDailyEl = document.getElementById('ind_daily_' + type + '_' + categoryCode);
  if (headerDailyEl) {
    headerDailyEl.textContent = hasStaff ? State.formatMoney(totalIncome) : '¥0';
  }

  // 更新缺料提示
  let anyShortage = false;
  if (allocLines > 0 && hasStaff) {
    (cat.products || []).forEach(p => {
      const lc = owned.products[p.code] || 0;
      if (lc > 0) {
        const sat = FactoryProducts.productSatisfaction(categoryCode, p.code, lc);
        if (sat < 1) anyShortage = true;
      }
    });
  }
  const listItem = document.getElementById('pcap_' + tableId);
  if (listItem) {
    // 找已有缺料提示
    const existing = listItem.parentElement.querySelector('.shortage-hint');
    if (existing) existing.remove();
    if (anyShortage) {
      const hint = document.createElement('div');
      hint.className = 'text-sm shortage-hint';
      hint.style.cssText = 'color:var(--warning);margin:4px 0;';
      hint.innerHTML = '⚠ 部分产品原料不足，产出下降 · <a onclick="Router.go(\'warehouse\')" style="color:var(--info);text-decoration:underline;">去仓库 →</a>';
      listItem.parentElement.insertBefore(hint, listItem.nextSibling);
    }
  }
};

/* 快速 +1 分配一条生产线到指定产品 */
Industry.incProdAlloc = function(type, categoryCode, productCode) {
  const owned = this._ensureProductAlloc(type, categoryCode);
  if (!owned) { UI.toast('工厂不存在'); return; }
  const cat = State.findIndustryCategory(type, categoryCode);
  if (!cat || !cat.products) { UI.toast('工厂数据异常'); return; }
  const product = cat.products.find(p => p.code === productCode);
  if (!product) { UI.toast('产品不存在'); return; }

  const qty = owned.quantity || 1;
  let allocTotal = 0;
  Object.values(owned.products).forEach(v => { allocTotal += v; });
  if (allocTotal >= qty) { UI.toast('产能已用完，无法再分配'); return; }

  if (Employees.multiplier(type, categoryCode) <= 0) {
    UI.toast('请先派员工再分配产品');
    return;
  }

  owned.products[productCode] = (owned.products[productCode] || 0) + 1;
  State.save();
  UI.toast(product.name + ' +1 条生产线');
  this._updateProdAllocUI(type, categoryCode);
};

/* 快速 -1 从指定产品撤回一条生产线 */
Industry.decProdAlloc = function(type, categoryCode, productCode) {
  const owned = this._ensureProductAlloc(type, categoryCode);
  if (!owned) { UI.toast('工厂不存在'); return; }
  if (!owned.products[productCode] || owned.products[productCode] <= 0) {
    UI.toast('该产品未分配产线');
    return;
  }
  const product = FactoryProducts.getProduct(categoryCode, productCode);
  const name = product ? product.name : productCode;

  owned.products[productCode]--;
  if (owned.products[productCode] <= 0) delete owned.products[productCode];
  State.save();
  UI.toast(name + ' -1 条生产线');
  this._updateProdAllocUI(type, categoryCode);
};

/* 批量分配产品弹窗 */
Industry.allocProduct = function(type, categoryCode) {
  const owned = this._ensureProductAlloc(type, categoryCode);
  if (!owned) { UI.toast('工厂不存在'); return; }
  const cat = State.findIndustryCategory(type, categoryCode);
  if (!cat || !cat.products || cat.products.length === 0) { UI.toast('该工厂没有可分配的产品'); return; }

  const qty = owned.quantity || 1;
  let allocTotal = 0;
  Object.values(owned.products).forEach(v => { allocTotal += v; });
  const freeLines = qty - allocTotal;

  if (freeLines <= 0 && allocTotal > 0) {
    UI.toast('产能已全部用完，请先减少某些产品的分配');
    return;
  }
  if (freeLines <= 0) {
    UI.toast('没有剩余产能，请先增加工厂生产线');
    return;
  }
  if (Employees.multiplier(type, categoryCode) <= 0) {
    UI.toast('请先派员工再分配产品');
    return;
  }

  const id = 'alloc_' + Date.now();
  let content = '';
  content += '<div class="text-sm text-muted" style="margin-bottom:8px;">';
  content += '剩余可分配: <strong style="color:var(--info);">' + freeLines + '</strong> 条生产线';
  content += '</div>';
  content += '<div style="max-height:300px;overflow-y:auto;">';
  cat.products.forEach(p => {
    const current = owned.products[p.code] || 0;
    const recipeStr = FactoryProducts.formatRecipe(p.recipe);
    const tierName = FactoryProducts.tierNames[p.tier] || '';
    content += '<div style="display:flex;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);">';
    content += '<div style="flex:1;min-width:0;">';
    content += '<div style="font-size:13px;">' + p.name;
    if (tierName) content += ' <span style="font-size:10px;color:var(--text-muted);">(' + tierName + ')</span>';
    content += '</div>';
    content += '<div class="text-muted" style="font-size:11px;">' + recipeStr + ' · ¥' + p.sellPrice + '/条</div>';
    content += '</div>';
    content += '<div style="display:flex;align-items:center;gap:4px;">';
    content += '<button class="btn sm danger" style="min-width:24px;padding:1px 5px;font-size:14px;" onclick="Industry._allocPickDec(' + "'" + id + "'" + ',' + "'" + p.code + "'" + ')">\u2212</button>';
    content += '<span id="' + id + '_' + p.code + '_val" style="min-width:20px;text-align:center;font-weight:500;">' + current + '</span>';
    content += '<button class="btn sm" style="min-width:24px;padding:1px 5px;font-size:14px;" onclick="Industry._allocPickInc(' + "'" + id + "'" + ',' + "'" + p.code + "'" + ')">+</button>';
    content += '</div>';
    content += '</div>';
  });
  content += '</div>';

  window._allocState = { id, categoryCode, type, allocs: {} };
  cat.products.forEach(p => {
    window._allocState.allocs[p.code] = owned.products[p.code] || 0;
  });

  UI.modal('分配产品 - ' + cat.name, content, [
    { label: '取消', class: '', onclick: 'UI.closeModal(); delete window._allocState;' },
    { label: '确认分配', class: 'primary', onclick: 'Industry._allocSubmit()' }
  ]);
};

Industry._allocPickInc = function(id, productCode) {
  const st = window._allocState;
  if (!st) return;
  let total = 0;
  Object.values(st.allocs).forEach(v => { total += v; });
  const owned = State.data.industries.find(i => i.type === st.type && i.category === st.categoryCode);
  const maxTotal = owned ? (owned.quantity || 1) : 0;
  if (total >= maxTotal) { UI.toast('产能已用完'); return; }
  st.allocs[productCode] = (st.allocs[productCode] || 0) + 1;
  const el = document.getElementById(id + '_' + productCode + '_val');
  if (el) el.textContent = st.allocs[productCode];
};

Industry._allocPickDec = function(id, productCode) {
  const st = window._allocState;
  if (!st) return;
  const current = st.allocs[productCode] || 0;
  if (current <= 0) { UI.toast('已经是0'); return; }
  st.allocs[productCode] = current - 1;
  const el = document.getElementById(id + '_' + productCode + '_val');
  if (el) el.textContent = st.allocs[productCode];
};

/* 折叠/展开产品分配表格 */
Industry._toggleProdTable = function(tableId, headerEl) {
  const table = document.getElementById(tableId);
  const arrow = document.getElementById(tableId + '_arrow');
  if (!table || !arrow) return;
  if (!window._expandedProdTables) window._expandedProdTables = {};
  if (table.style.display === 'none') {
    table.style.display = '';
    arrow.textContent = '▼';
    window._expandedProdTables[tableId] = true;
  } else {
    table.style.display = 'none';
    arrow.textContent = '▶';
    delete window._expandedProdTables[tableId];
  }
};

Industry._allocSubmit = function() {
  const st = window._allocState;
  if (!st) return;
  const owned = State.data.industries.find(i => i.type === st.type && i.category === st.categoryCode);
  if (!owned) { UI.toast('工厂不存在'); UI.closeModal(); return; }
  if (!owned.products) owned.products = {};
  Object.entries(st.allocs).forEach(([code, qty]) => {
    if (qty > 0) {
      owned.products[code] = qty;
    } else {
      delete owned.products[code];
    }
  });
  State.save();
  UI.closeModal();
  delete window._allocState;
  UI.toast('产品分配已更新');
  Pages.industryDetail._refreshCapacity(st.type);
};

window.Industry = Industry;
