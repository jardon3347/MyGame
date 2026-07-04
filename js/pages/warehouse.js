/* warehouse.js — 仓库页：容量管理、原料买卖 */

Pages.warehouse = {
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

        <div class="section-title">我的库存</div>
        ${Object.keys(inv).length === 0 ? '<div class="empty">仓库空空如也</div>' :
          Object.entries(inv).map(([code, qty]) => {
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
          }).join('')
        }

        <div class="section-title">原料市场 · 矿石（冶金消耗）</div>
        ${this.materialList(inv, s, free, ['iron','copper','baux','coal','zinc_ore','lead_ore','tin','tung','gold_ore','silver_ore','rare_earth','phos_ore','quartz_ore'])}

        <div class="section-title">原料市场 · 农产品（工厂消耗）</div>
        ${this.materialList(inv, s, free, ['wheat','rice','soy','corn','cotton','rape','sugarc','tea','veg','fruit','rubber','tobacco'])}

        <div class="section-title">原料市场 · 金属（工厂消耗）</div>
        ${this.materialList(inv, s, free, ['steel','ironR','copperR','alum','zincR','leadR','tinR','tungR','alloy','precious_m'])}

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

        <div style="height:20px;"></div>
        ${UI.bottombar()}
      </div>
    `;
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
  }
};

window.Pages = window.Pages || {};
window.Pages.warehouse = Pages.warehouse;
window.Warehouse = Warehouse;
