/* warehouse.js — 仓库页：容量管理、原料买卖（选项卡版） */

Pages.warehouse = {
  currentTab: 'inventory', // 默认选中库存选项卡
  currentSubTab: 'all',    // 库存内子tab：all/farm/ore/metal
  
  /* 材料分类定义 */
  _categories: {
    farm:     { label: '🌾 农产品', codes: ['wheat','rice','soy','corn','cotton','rape','sugarc','tea','veg','fruit','rubber','tobacco','sorghum','wood_bamboo','wood_pine','wood_cedar','wood_walnut','wood_rosewood','wood_nanmu'] },
    ore:      { label: '⛏️ 矿石',  codes: ['iron','copper','baux','coal','zinc_ore','lead_ore','tin','tung','gold_ore','silver_ore','rare_earth','phos_ore','quartz_ore','limestone'] },
    metal:    { label: '🔥 金属',  codes: ['steel','ironR','copperR','alum','zincR','leadR','tinR','tungR','alloy','precious_m'] },
    finished: { label: '🏭 成品',  codes: [] }  // 动态填充
  },

  render(app) {
    const s = State.data;
    const cap = Employees.warehouseCapacity();
    const used = Employees.warehouseUsed();
    const free = Employees.warehouseFree();
    const inv = s.inventory || {};

    app.innerHTML = `
      <div class="page">
        ${UI.navbar('仓库管理')}
        <div class="topbar">
          <div class="topbar-stats">
            <div class="stat-item">
              <div class="label">总容量</div>
              <div class="value">${cap.toLocaleString('zh-CN')}</div>
            </div>
            <div class="stat-item">
              <div class="label">已用</div>
              <div class="value">${used.toLocaleString('zh-CN', {maximumFractionDigits:0})}</div>
            </div>
            <div class="stat-item">
              <div class="label">剩余</div>
              <div class="value ${free < cap * 0.1 ? 'down' : 'up'}">${free.toLocaleString('zh-CN')}</div>
            </div>
          </div>
        </div>

        ${cap === 0 ? `
          <div class="list-item" style="border-left:3px solid var(--warning);">
            <p class="text-sm" style="line-height:1.6;color:var(--warning);">
              ⚠ 尚无仓库地产，无法存放原料。<br>
              请先在【实业 → 地产 → 仓库】购入仓库（每套可存 ${DATA.warehouseCapacityPerUnit.toLocaleString('zh-CN')} 单位原料）。
            </p>
          </div>
        ` : ''}

        <!-- 选项卡栏 -->
        <div class="tab-container">
          <div class="tab-bar">
            <div class="tab ${this.currentTab === 'inventory' ? 'active' : ''}" data-tab="inventory" onclick="Pages.warehouse.switchTab('inventory')">
              📦 我的库存
            </div>
            <div class="tab ${this.currentTab === 'ore' ? 'active' : ''}" data-tab="ore" onclick="Pages.warehouse.switchTab('ore')">
              ⛏️ 矿石市场
            </div>
            <div class="tab ${this.currentTab === 'farm' ? 'active' : ''}" data-tab="farm" onclick="Pages.warehouse.switchTab('farm')">
              🌾 农产品市场
            </div>
            <div class="tab ${this.currentTab === 'metal' ? 'active' : ''}" data-tab="metal" onclick="Pages.warehouse.switchTab('metal')">
              🔥 金属市场
            </div>
            <div class="tab ${this.currentTab === 'finished' ? 'active' : ''}" data-tab="finished" onclick="Pages.warehouse.switchTab('finished')">
              🏭 成品
            </div>
            <div class="tab ${this.currentTab === 'help' ? 'active' : ''}" data-tab="help" onclick="Pages.warehouse.switchTab('help')">
              ❓ 说明
            </div>
          </div>
        </div>

        <!-- 库存选项卡（含子分类） -->
        <div class="tab-content ${this.currentTab === 'inventory' ? 'active' : ''}" id="inventory-tab">
          ${this._renderInventoryTab(inv, s, cap, free)}
        </div>

        <!-- 矿石市场选项卡 -->
        <div class="tab-content ${this.currentTab === 'ore' ? 'active' : ''}" id="ore-tab">
          <div class="section-title">原料市场 · 矿石（冶金消耗）</div>
          ${this.materialList(inv, s, free, this._categories.ore.codes)}
        </div>

        <!-- 农产品市场选项卡 -->
        <div class="tab-content ${this.currentTab === 'farm' ? 'active' : ''}" id="farm-tab">
          <div class="section-title">原料市场 · 农产品（工厂消耗）</div>
          ${this.materialList(inv, s, free, this._categories.farm.codes)}
        </div>

        <!-- 金属市场选项卡 -->
        <div class="tab-content ${this.currentTab === 'metal' ? 'active' : ''}" id="metal-tab">
          <div class="section-title">原料市场 · 金属（工厂消耗）</div>
          ${this.materialList(inv, s, free, this._categories.metal.codes)}
        </div>

        <!-- 成品选项卡 -->
        <div class="tab-content ${this.currentTab === 'finished' ? 'active' : ''}" id="finished-tab">
          ${this._renderFinishedGoodsTab(inv, s, free)}
        </div>

        <!-- 说明选项卡 -->
        <div class="tab-content ${this.currentTab === 'help' ? 'active' : ''}" id="help-tab">
          <div class="section-title">产业链说明</div>
          <div class="list-item">
            <p class="text-sm text-muted" style="line-height:1.7;">
              <strong>完整供应链：</strong><br>
              ⛏️ 矿业 → 产出矿石 → 仓库<br>
              🌾 农业 → 产出农产品 → 仓库<br>
              🔥 冶金 → 消耗矿石 → 产出金属 → 仓库<br>
              🏭 工厂 → 消耗农产品+金属 → 现金收入<br><br>
              <strong>举例：</strong><br>
              买铁矿+煤矿 → 铁矿石+煤炭进仓库 → 炼钢消耗 → 产出钢材 → 机械厂消耗钢材<br><br>
              <strong>市场价格：</strong>原料价格每日波动，新闻事件会影响价格走势。低买高卖可获利，卖出收 2% 手续费。
            </p>
          </div>
          
          <div class="section-title">使用说明</div>
          <div class="list-item">
            <p class="text-sm text-muted" style="line-height:1.7;">
              <strong>🚀 如何使用选项卡：</strong><br>
              1. 点击顶部的选项卡按钮可快速切换分类<br>
              2. <strong>📦 我的库存</strong>：查看已拥有的原料，支持按类型筛选<br>
              3. <strong>⛏️ 矿石市场</strong>：购买煤矿、铁矿等矿石原料<br>
              4. <strong>🌾 农产品市场</strong>：购买小麦、棉花等农产品<br>
              5. <strong>🔥 金属市场</strong>：购买钢材、铜材等金属<br>
              6. <strong>❓ 说明</strong>：查看产业链指导和帮助信息<br><br>
              <strong>🎯 交易技巧：</strong><br>
              • 价格下跌时买入，上涨时卖出<br>
              • 关注新闻事件对价格的影响<br>
              • 确保仓库容量足够存放原料
            </p>
          </div>
        </div>

        <div style="height:20px;"></div>
        ${UI.bottombar()}
      </div>
    `;
  },

  /* 渲染库存选项卡（含子分类tab） */
  _renderInventoryTab(inv, s, cap, free) {
    const subTabs = [
      { key: 'all',   label: '📦 全部' },
      { key: 'farm',  label: '🌾 农产品' },
      { key: 'ore',   label: '⛏️ 矿石' },
      { key: 'metal', label: '🔥 金属' }
    ];

    // 统计每个分类的库存数量和市值
    const catStats = {};
    for (const key in this._categories) {
      const codes = this._categories[key].codes;
      let count = 0, value = 0;
      codes.forEach(code => {
        const qty = inv[code] || 0;
        if (qty > 0) {
          count++;
          value += qty * Employees.materialPrice(code);
        }
      });
      catStats[key] = { count, value };
    }
    // 全部统计
    let allCount = 0, allValue = 0;
    for (const code in inv) {
      if (inv[code] > 0) {
        allCount++;
        allValue += inv[code] * Employees.materialPrice(code);
      }
    }

    // 筛选当前子tab的codes
    let filteredCodes = null;
    if (this.currentSubTab !== 'all') {
      filteredCodes = this._categories[this.currentSubTab].codes;
    }

    // 构建库存列表
    let listHTML = '';
    const entries = Object.entries(inv).filter(([code, qty]) => qty > 0);
    if (entries.length === 0) {
      listHTML = '<div class="empty">仓库空空如也</div>';
    } else {
      const displayEntries = filteredCodes
        ? entries.filter(([code]) => filteredCodes.includes(code))
        : entries;

      if (displayEntries.length === 0) {
        listHTML = '<div class="empty">该分类暂无库存</div>';
      } else {
        listHTML = displayEntries.map(([code, qty]) => {
          const mat = DATA.rawMaterials.find(m => m.code === code);
          if (!mat) return '';
          const mkt = Employees.materialPrice(code);
          const sellP = Employees.materialSellPrice(code);
          const chgPct = (mkt - mat.price) / mat.price;
          const chgColor = chgPct > 0.001 ? 'var(--up)' : (chgPct < -0.001 ? 'var(--down)' : 'var(--text-secondary)');
          const chgArrow = chgPct > 0.001 ? '↑' : (chgPct < -0.001 ? '↓' : '—');
          return `
            <div class="list-item">
              <div class="list-row">
                <div>
                  <div class="font-medium">${mat.name}</div>
                  <div class="text-sm text-muted">${qty.toFixed(1)} ${mat.unit} · 市值 ¥${(qty * mkt).toLocaleString('zh-CN', {maximumFractionDigits:0})}</div>
                </div>
                <div style="text-align:right;">
                  <div class="text-sm" style="color:${chgColor};">市场价 ¥${mkt}/${mat.unit} ${chgArrow}${Math.abs(chgPct*100).toFixed(1)}%</div>
                  <div class="text-sm text-muted">卖出 ¥${(qty * sellP).toLocaleString('zh-CN', {maximumFractionDigits:0})}</div>
                </div>
              </div>
              <div class="flex gap-8 mt-8">
                <button class="btn sm" style="flex:1;" onclick="Warehouse.showSell('${code}', ${qty})">卖出</button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 子tab栏
    let subTabHTML = '<div class="tab-container" style="margin-bottom:8px;"><div class="tab-bar">';
    subTabs.forEach(t => {
      const isActive = this.currentSubTab === t.key;
      let badge = '';
      if (t.key === 'all' && allCount > 0) {
        badge = ` (${allCount})`;
      } else if (t.key !== 'all' && catStats[t.key] && catStats[t.key].count > 0) {
        badge = ` (${catStats[t.key].count})`;
      }
      subTabHTML += `<div class="tab${isActive ? ' active' : ''}" onclick="Pages.warehouse.switchSubTab('${t.key}')">${t.label}${badge}</div>`;
    });
    subTabHTML += '</div></div>';

    // 当前分类市值
    let valueLabel = '';
    if (this.currentSubTab === 'all') {
      valueLabel = allValue > 0 ? `总市值 ¥${allValue.toLocaleString('zh-CN', {maximumFractionDigits:0})}` : '';
    } else {
      const st = catStats[this.currentSubTab];
      if (st && st.value > 0) {
        valueLabel = `${this._categories[this.currentSubTab].label} 市值 ¥${st.value.toLocaleString('zh-CN', {maximumFractionDigits:0})}`;
      }
    }

    return `
      ${subTabHTML}
      ${valueLabel ? `<div class="text-sm text-muted" style="margin-bottom:8px;padding:0 4px;">${valueLabel}</div>` : ''}
      <div class="section-title">我的库存</div>
      ${listHTML}
    `;
  },


  /* 渲染成品选项卡 */
  _renderFinishedGoodsTab(inv, s, free) {
    // 动态获取成品列表
    const finishedCodes = [];
    if (window.FactoryProducts) {
      FactoryProducts._forEachProduct((factoryCode, product) => {
        if (product.output && !finishedCodes.includes(product.output.code)) {
          finishedCodes.push(product.output.code);
        }
      });
    }
    
    if (finishedCodes.length === 0) {
      return '<div class="empty">暂无成品，需先分配工厂产品</div>';
    }
    
    // 统计成品库存
    let totalValue = 0;
    let itemCount = 0;
    const entries = [];
    finishedCodes.forEach(code => {
      const qty = inv[code] || 0;
      if (qty > 0) {
        const mat = DATA.rawMaterials.find(m => m.code === code);
        if (mat) {
          const mkt = Employees.materialPrice(code);
          totalValue += qty * mkt;
          itemCount++;
          entries.push({ code, qty, mat, mkt });
        }
      }
    });
    
    let h = '';
    if (totalValue > 0) {
      h += '<div class="text-sm text-muted" style="margin-bottom:8px;padding:0 4px;">成品总市值 ¥' + totalValue.toLocaleString('zh-CN', {maximumFractionDigits:0}) + ' · ' + itemCount + ' 种</div>';
      h += '<button class="btn sm primary" style="width:100%;margin-bottom:12px;" onclick="Warehouse.sellAllFinished()">一键售出全部成品</button>';
    }
    
    h += '<div class="section-title">成品库存</div>';
    
    if (entries.length === 0) {
      h += '<div class="empty">成品仓库为空</div>';
    } else {
      entries.forEach(({ code, qty, mat, mkt }) => {
        const sellP = Employees.materialSellPrice(code);
        const chgPct = (mkt - mat.price) / mat.price;
        const chgColor = chgPct > 0.001 ? 'var(--up)' : (chgPct < -0.001 ? 'var(--down)' : 'var(--text-secondary)');
        const chgArrow = chgPct > 0.001 ? '↑' : (chgPct < -0.001 ? '↓' : '—');
        h += '<div class="list-item">';
        h += '<div class="list-row"><div>';
        h += '<div class="font-medium">' + mat.name + '</div>';
        h += '<div class="text-sm text-muted">' + qty.toFixed(1) + ' ' + mat.unit + ' · 市值 ¥' + (qty * mkt).toLocaleString('zh-CN', {maximumFractionDigits:0}) + '</div>';
        h += '</div><div style="text-align:right;">';
        h += '<div class="text-sm" style="color:' + chgColor + ';">¥' + mkt + '/' + mat.unit + ' ' + chgArrow + Math.abs(chgPct*100).toFixed(1) + '%</div>';
        h += '<div class="text-sm text-muted">卖出 ¥' + (qty * sellP).toLocaleString('zh-CN', {maximumFractionDigits:0}) + '</div>';
        h += '</div></div>';
        h += '<div class="flex gap-8 mt-8">';
        h += '<button class="btn sm primary" style="flex:1;" onclick="Warehouse.showSell(\'' + code + '\', ' + qty + ')">卖出</button>';
        h += '</div></div>';
      });
    }
    
    return h;
  },

  /* 切换选项卡 */
  switchTab(tabName) {
    this.currentTab = tabName;
    this.render(document.getElementById('app'));
  },

  /* 切换库存子选项卡 */
  switchSubTab(subTab) {
    this.currentSubTab = subTab;
    this.render(document.getElementById('app'));
  },

  /* 按分类渲染原料列表 */
  materialList(inv, s, free, codes) {
    return codes.map(code => {
      const mat = DATA.rawMaterials.find(m => m.code === code);
      if (!mat) return '';
      const have = inv[code] || 0;
      const mkt = Employees.materialPrice(code);
      const chgPct = (mkt - mat.price) / mat.price;
      const chgColor = chgPct > 0.001 ? 'var(--up)' : (chgPct < -0.001 ? 'var(--down)' : 'var(--text-secondary)');
      const chgArrow = chgPct > 0.001 ? '↑' : (chgPct < -0.001 ? '↓' : '—');
      const maxBuy = Math.min(Math.floor(s.cash / mkt), free);
      return `
        <div class="list-item">
          <div class="list-row">
            <div>
              <div class="font-medium">${mat.name}</div>
              <div class="text-sm text-muted">库存 ${have.toFixed(1)} ${mat.unit}${mat.from ? ' · 产自' + mat.from : ''}</div>
            </div>
            <div style="text-align:right;">
              <div class="font-medium" style="color:${chgColor};">¥${mkt}</div>
              <div class="text-sm" style="color:${chgColor};">/${mat.unit} ${chgArrow}${Math.abs(chgPct*100).toFixed(1)}%</div>
            </div>
          </div>
          <div class="flex gap-8 mt-8">
            <button class="btn sm" style="flex:1;" ${have > 0 ? '' : 'disabled style="opacity:0.4;flex:1;"'} onclick="Warehouse.showSell('${code}', ${have})">卖出</button>
            <button class="btn sm ${maxBuy > 0 ? 'primary' : ''}" style="flex:1;" ${maxBuy > 0 ? '' : 'disabled style="opacity:0.4;flex:1;"'} onclick="Warehouse.showBuy('${code}')">
              ${maxBuy > 0 ? '买入' : (s.cash < mkt ? '现金不足' : '仓库满')}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
};

const Warehouse = {
  showBuy(code) {
    const mat = DATA.rawMaterials.find(m => m.code === code);
    if (!mat) return;
    const s = State.data;
    const free = Employees.warehouseFree();
    const mkt = Employees.materialPrice(code);
    const sellP = Employees.materialSellPrice(code);
    const maxBuy = Math.min(Math.floor(s.cash / mkt), free);
    if (maxBuy <= 0) { UI.toast('仓库已满或现金不足'); return; }

    UI.numberPicker({
      title: '买入 ' + mat.name,
      unit: mkt,
      unitName: mat.unit,
      unitLabel: `市场价 ¥${mkt}/${mat.unit} · 卖出价 ¥${sellP.toFixed(1)} (扣2%) · 仓库剩余 ${free}`,
      max: maxBuy,
      quickAdds: maxBuy >= 1000 ? [50, 100, 500, 1000] : [10, 50, 100, 500],
      onConfirm: (qty) => {
        if (qty <= 0) { UI.toast('请选择数量'); return; }
        Employees.buyMaterial(code, qty);
      }
    });
  },

  showSell(code, maxQty) {
    const mat = DATA.rawMaterials.find(m => m.code === code);
    if (!mat) return;
    const mkt = Employees.materialPrice(code);
    const sellP = Employees.materialSellPrice(code);
    UI.numberPicker({
      title: '卖出 ' + mat.name,
      unit: sellP,
      unitName: mat.unit,
      unitLabel: `卖出价 ¥${sellP.toFixed(1)}/${mat.unit} (市场价¥${mkt}扣2%) · 持有 ${maxQty.toFixed(0)} ${mat.unit}`,
      max: Math.floor(maxQty),
      quickAdds: maxQty >= 1000 ? [50, 100, 500, 1000] : [10, 50, 100, 500],
      onConfirm: (qty) => {
        if (qty <= 0) { UI.toast('请选择数量'); return; }
        Employees.sellMaterial(code, qty);
      }
    });
  },
  /* 一键售出全部成品 */
  sellAllFinished() {
    if (!window.FactoryProducts) { UI.toast('产品系统未加载'); return; }
    const inv = State.data.inventory || {};
    let totalSold = 0;
    let totalCash = 0;
    FactoryProducts._forEachProduct((factoryCode, product) => {
      if (!product.output) return;
      const code = product.output.code;
      const qty = inv[code] || 0;
      if (qty <= 0) return;
      const sellP = Employees.materialSellPrice(code);
      const cash = Math.floor(sellP * qty);
      totalCash += cash;
      totalSold += qty;
      delete inv[code];
    });
    if (totalSold <= 0) {
      UI.toast('没有可售出的成品');
      return;
    }
    State.data.cash += totalCash;
    State.save();
    UI.toast('售出全部成品 ' + totalSold.toFixed(0) + ' 单位，到账 ' + State.formatMoney(totalCash));
    Router.refresh();
  }
};
window.Pages = window.Pages || {};
window.Pages.warehouse = Pages.warehouse;
window.Warehouse = Warehouse;