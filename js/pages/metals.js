/* metals.js — 贵金属页 */

Pages.metals = {
  render(app) {
    const s = State.data;
    let totalValue = 0;
    let totalCost = 0;
    s.metals.forEach(m => {
      const price = s.metalPrices[m.code] || 0;
      totalValue += m.grams * price;
      totalCost += m.grams * m.avgCost;
    });
    const totalPnl = totalValue - totalCost;

    app.innerHTML = `
      <div class="page">
        ${UI.navbar('贵金属')}
        <div class="topbar">
          <div class="topbar-stats">
            <div class="stat-item">
              <div class="label">持仓市值</div>
              <div class="value">${State.formatMoney(totalValue)}</div>
            </div>
            <div class="stat-item">
              <div class="label">总盈亏</div>
              <div class="value ${totalPnl >= 0 ? 'up' : 'down'}">${totalPnl >= 0 ? '+' : ''}${State.formatMoney(totalPnl)}</div>
            </div>
            <div class="stat-item">
              <div class="label">收益率</div>
              <div class="value ${totalPnl >= 0 ? 'up' : 'down'}">${totalCost > 0 ? State.formatPct(totalPnl/totalCost) : '—'}</div>
            </div>
          </div>
        </div>

        <div class="section-title">行情（¥/克）</div>
        ${DATA.metals.map(m => this.metalRow(m)).join('')}

        <div class="section-title">我的持仓</div>
        ${s.metals.length === 0 ? '<div class="empty">暂无持仓</div>' :
          s.metals.map(m => this.holdingRow(m)).join('')}

        <div class="section-title">现金</div>
        <div class="list-item">
          <div class="list-row">
            <span class="list-label">可用现金</span>
            <span class="list-value">${State.formatMoney(s.cash)}</span>
          </div>
        </div>

        <div class="section-title">说明</div>
        <div class="list-item">
          <p class="text-sm text-muted" style="line-height:1.6;">
            · 以 ¥/克 计价，最小交易单位 1 克<br>
            · 买卖手续费 0.2%<br>
            · 避险资产：危机事件时价格上涨<br>
            · 适合对冲股票风险
          </p>
        </div>

        ${UI.bottombar()}
      </div>
    `;
  },

  /* 渲染列表部分（供金融页嵌入），不含 NavBar 和底部栏 */
  renderList() {
    const s = State.data;
    const totalValue = s.metals.reduce((sum, m) => sum + m.grams * (s.metalPrices[m.code] || 0), 0);
    const totalCost = s.metals.reduce((sum, m) => sum + m.grams * m.avgCost, 0);
    const totalPnl = totalValue - totalCost;
    return `
      <div class="topbar">
        <div class="topbar-stats">
          <div class="stat-item">
            <div class="label">持仓市值</div>
            <div class="value">${State.formatMoney(totalValue)}</div>
          </div>
          <div class="stat-item">
            <div class="label">总盈亏</div>
            <div class="value ${totalPnl >= 0 ? 'up' : 'down'}">${totalPnl >= 0 ? '+' : ''}${State.formatMoney(totalPnl)}</div>
          </div>
          <div class="stat-item">
            <div class="label">收益率</div>
            <div class="value ${totalPnl >= 0 ? 'up' : 'down'}">${totalCost > 0 ? State.formatPct(totalPnl/totalCost) : '—'}</div>
          </div>
        </div>
      </div>
      <div class="section-title">行情（¥/克）</div>
      ${DATA.metals.map(m => this.metalRow(m)).join('')}
      <div class="section-title">我的持仓</div>
      ${s.metals.length === 0 ? '<div class="empty">暂无持仓</div>' :
        s.metals.map(m => this.holdingRow(m)).join('')}
    `;
  },

  metalRow(m) {
    const price = State.data.metalPrices[m.code] || 0;
    const holding = State.data.metals.find(x => x.code === m.code);
    const grams = holding ? holding.grams : 0;
    return `
      <div class="list-item">
        <div class="list-row">
          <div>
            <div class="font-medium">${m.name}</div>
            <div class="text-sm text-muted">${m.code} · 持仓 ${grams.toLocaleString('zh-CN')} 克</div>
          </div>
          <div style="text-align:right;">
            <div class="font-medium">¥${price.toFixed(2)}/克</div>
          </div>
        </div>
        <div class="flex gap-8 mt-12">
          <button class="btn sm" style="flex:1;" onclick="Metals.showBuy('${m.code}')">买入</button>
          <button class="btn sm" style="flex:1;" ${holding ? '' : 'disabled style="opacity:0.4;flex:1;"'} onclick="Metals.showSell('${m.code}')">卖出</button>
        </div>
      </div>
    `;
  },

  holdingRow(m) {
    const price = State.data.metalPrices[m.code] || 0;
    const meta = DATA.metals.find(x => x.code === m.code);
    const value = m.grams * price;
    const cost = m.grams * m.avgCost;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? pnl / cost : 0;
    const unitCost = price * 1.002;
    const maxBuy = Math.floor(State.data.cash / unitCost);
    return `
      <div class="list-item">
        <div class="list-row">
          <div>
            <div class="font-medium">${meta.name}</div>
            <div class="text-sm text-muted">${m.grams.toLocaleString('zh-CN')} 克 @ ¥${m.avgCost.toFixed(2)}</div>
          </div>
          <div style="text-align:right;">
            <div class="font-medium">${State.formatMoney(value)}</div>
            <div class="text-sm ${pnl >= 0 ? 'text-up' : 'text-down'}">${pnl >= 0 ? '+' : ''}${State.formatMoney(pnl)} (${State.formatPct(pnlPct)})</div>
          </div>
        </div>
        <div class="flex gap-8 mt-8">
          ${maxBuy > 0 ? '<button class="btn sm" style="min-width:0;padding:1px 6px;font-size:11px;border-color:var(--info);color:var(--info);" onclick="Metals._quickBuy(\'' + m.code + '\')">加仓</button>' : ''}
          ${m.grams > 0 ? '<button class="btn sm" style="min-width:0;padding:1px 6px;font-size:11px;border-color:var(--down);color:var(--down);" onclick="Metals._quickSell(\'' + m.code + '\')">清仓</button>' : ''}
        </div>
      </div>
    `;
  }
};

const Metals = {
  showBuy(code) {
    const m = DATA.metals.find(x => x.code === code);
    const price = State.data.metalPrices[code] || 0;
    const unitCost = price * 1.002;
    const maxGrams = Math.floor(State.data.cash / unitCost);
    if (maxGrams <= 0) { UI.toast('现金不足'); return; }

    UI.numberPicker({
      title: '买入 ' + m.name,
      unit: unitCost,
      unitName: '克',
      unitLabel: `¥${price.toFixed(2)}/克 · 含手续费`,
      max: maxGrams,
      onConfirm: (grams) => {
        if (grams <= 0) { UI.toast('请选择数量'); return; }
        const cost = grams * price;
        const fee = cost * 0.002;
        const total = cost + fee;
        State.data.cash -= total;
        const existing = State.data.metals.find(x => x.code === code);
        if (existing) {
          const totalGrams = existing.grams + grams;
          existing.avgCost = (existing.grams * existing.avgCost + cost) / totalGrams;
          existing.grams = totalGrams;
        } else {
          State.data.metals.push({ code, grams, avgCost: price });
        }
        State.save();
        UI.toast(`买入 ${grams.toLocaleString('zh-CN')} 克 ${m.name}`);
        Router.refresh();
      }
    });
  },

  showSell(code) {
    const m = DATA.metals.find(x => x.code === code);
    const holding = State.data.metals.find(x => x.code === code);
    if (!holding) { UI.toast('无持仓'); return; }
    const maxGrams = holding.grams;
    const price = State.data.metalPrices[code] || 0;
    const unitNet = price * (1 - 0.002);

    UI.numberPicker({
      title: '卖出 ' + m.name,
      unit: unitNet,
      unitName: '克',
      unitLabel: `¥${price.toFixed(2)}/克 · 扣手续费 · 持有 ${maxGrams.toLocaleString('zh-CN')} 克`,
      max: maxGrams,
      onConfirm: (grams) => {
        if (grams <= 0) { UI.toast('请选择数量'); return; }
        if (grams > holding.grams) { UI.toast('持仓不足'); return; }
        const revenue = grams * price;
        const fee = revenue * 0.002;
        const net = revenue - fee;
        State.data.cash += net;
        holding.grams -= grams;
        if (holding.grams <= 0) {
          State.data.metals = State.data.metals.filter(x => x.code !== code);
        }
        State.save();
        UI.toast(`卖出 ${grams.toLocaleString('zh-CN')} 克，到账 ${State.formatMoney(net)}`);
        Router.refresh();
      }
    });
  },

  /* 快捷加仓 */
  _quickBuy(code) {
    const price = State.data.metalPrices[code] || 0;
    const unitCost = price * 1.002;
    const maxGrams = Math.floor(State.data.cash / unitCost);
    if (maxGrams <= 0) { UI.toast('现金不足'); return; }
    const cost = maxGrams * price;
    const fee = cost * 0.002;
    const total = cost + fee;
    State.data.cash -= total;
    const existing = State.data.metals.find(m => m.code === code);
    if (existing) {
      const totalGrams = existing.grams + maxGrams;
      existing.avgCost = (existing.grams * existing.avgCost + cost) / totalGrams;
      existing.grams = totalGrams;
    } else {
      State.data.metals.push({ code, grams: maxGrams, avgCost: price });
    }
    State.save();
    UI.toast(`加仓 ${maxGrams} 克，花费 ${State.formatMoney(total)}`);
    Router.refresh();
  },

  /* 快捷清仓 */
  _quickSell(code) {
    const holding = State.data.metals.find(m => m.code === code);
    if (!holding) { UI.toast('无持仓'); return; }
    const price = State.data.metalPrices[code] || 0;
    const grams = holding.grams;
    const revenue = grams * price;
    const fee = revenue * 0.002;
    const net = revenue - fee;
    State.data.cash += net;
    State.data.metals = State.data.metals.filter(m => m.code !== code);
    State.save();
    UI.toast(`清仓 ${grams} 克，到账 ${State.formatMoney(net)}`);
    Router.refresh();
  }
};

window.Metals = Metals;
