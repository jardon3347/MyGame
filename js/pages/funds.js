/* funds.js — 基金列表 + 详情 */

Pages.funds = {
  _currentTab: 'holdings',
  render(app) {
    const s = State.data;
    let totalValue = 0;
    let totalCost = 0;
    (s.fundHoldings || []).forEach(h => {
      const price = s.fundPrices[h.code] || 0;
      totalValue += h.shares * price;
      totalCost += h.shares * h.avgCost;
    });
    const totalPnl = totalValue - totalCost;

    app.innerHTML = `
      <div class="page">
        ${UI.navbar('基金')}
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
              <div class="value ${totalPnl >= 0 ? 'up' : 'down'}">${totalCost > 0 ? State.formatPct(totalPnl/totalCost) : '\u2014'}</div>
            </div>
          </div>
        </div>

        <div class="tab-container" style="margin-bottom:12px;">
          <div class="tab-bar">
            <div class="tab${this._currentTab === 'holdings' ? ' active' : ''}" data-fundstab="holdings" onclick="Pages.funds.switchTab('holdings')">&#x2705 \u6211\u7684\u6301\u4ED3 (${(s.fundHoldings||[]).length})</div>
            <div class="tab${this._currentTab === 'market' ? ' active' : ''}" data-fundstab="market" onclick="Pages.funds.switchTab('market')">&#x1F4CA \u57FA\u91D1\u5E02\u573A (${DATA.funds.length})</div>
          </div>
        </div>
        <div id="funds-tab-content">
          ${this._currentTab === 'market' ? this._renderMarketTab() : this._renderHoldingsTab()}
        </div>

        <div class="section-title">\u8BF4\u660E</div>
        <div class="list-item">
          <p class="text-sm text-muted" style="line-height:1.6;">
            \u00b7 \u57FA\u91D1\u6309\u201C\u4EFD\u201D\u7533\u8D2D/\u8D4E\u56DE\uFF0C1 \u4EFD = \u5F53\u524D\u51C0\u503C<br>
            \u00b7 \u7533\u8D2D\u8D39 0.15% \u00b7 \u8D4E\u56DE\u8D39 0.25%\uFF08\u6301\u6709 &lt;7 \u5929\uFF09<br>
            \u00b7 T+1 \u5236\u5EA6\uFF1A\u4ECA\u5929\u7533\u8D2D\u660E\u5929\u786E\u8BA4<br>
            \u00b7 \u98CE\u9669\u5206\u6563\uFF0C\u9002\u5408\u957F\u671F\u914D\u7F6E
          </p>
        </div>

        ${UI.bottombar()}
      </div>
    `;
  },

  switchTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('[data-fundstab]').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-fundstab') === tab);
    });
    const container = document.getElementById('funds-tab-content');
    if (tab === 'holdings') {
      container.innerHTML = this._renderHoldingsTab();
    } else {
      container.innerHTML = this._renderMarketTab();
    }
  },

  _renderHoldingsTab() {
    const s = State.data;
    const holdings = s.fundHoldings || [];
    if (holdings.length === 0) {
      return '<div class="empty">\u6682\u65E0\u6301\u4ED3\uFF0C\u70B9\u51FB\u300C\u57FA\u91D1\u5E02\u573A\u300D\u53EF\u7533\u8D2D\u57FA\u91D1</div>';
    }
    return '<div class="section-title">\u6211\u7684\u6301\u4ED3 (' + holdings.length + ')</div>' +
      holdings.map(h => this.holdingRow(h)).join('');
  },

  _renderMarketTab() {
    return '<div class="section-title">\u57FA\u91D1\u5E02\u573A\uFF08' + DATA.funds.length + ' \u53EA\uFF09</div>' +
      DATA.funds.map(f => this.fundRow(f)).join('');
  },

  holdingRow(h) {
    const price = State.data.fundPrices[h.code] || 0;
    const f = DATA.funds.find(x => x.code === h.code);
    const value = h.shares * price;
    const cost = h.shares * h.avgCost;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? pnl / cost : 0;
    return `
      <div class="list-item" onclick="Router.go('fundDetail',{code:'${h.code}'})" style="cursor:pointer;">
        <div class="list-row">
          <div>
            <div class="font-medium">${f.name}</div>
            <div class="text-sm text-muted">${h.shares.toLocaleString('zh-CN')} \u4EFD @ \u00A5${h.avgCost.toFixed(4)}</div>
          </div>
          <div style="text-align:right;">
            <div class="font-medium">${State.formatMoney(value)}</div>
            <div class="text-sm ${pnl >= 0 ? 'text-up' : 'text-down'}">${pnl >= 0 ? '+' : ''}${State.formatMoney(pnl)} (${State.formatPct(pnlPct)})</div>
          </div>
        </div>
      </div>
    `;
  },

  fundRow(f) {
    const price = State.data.fundPrices[f.code] || f.basePrice;
    const hist = (State.data.fundHistory && State.data.fundHistory[f.code]) || [];
    const prev = hist.length >= 2 ? hist[hist.length-2].close : f.basePrice;
    const change = price - prev;
    const changePct = prev > 0 ? change / prev : 0;
    const holding = (State.data.fundHoldings||[]).find(h => h.code === f.code);
    return `
      <div class="list-item" onclick="Router.go('fundDetail',{code:'${f.code}'})" style="cursor:pointer;">
        <div class="list-row">
          <div>
            <div class="font-medium">${f.name}</div>
            <div class="text-sm text-muted">${f.code} \u00b7 ${f.type} \u00b7 \u98CE\u9669${f.risk}${holding ? ' \u00b7 \u6301\u4ED3 '+holding.shares.toLocaleString('zh-CN')+' \u4EFD' : ''}</div>
          </div>
          <div style="text-align:right;">
            <div class="font-medium">\u00A5${price.toFixed(4)}</div>
            <div class="text-sm ${change >= 0 ? 'text-up' : 'text-down'}">${change >= 0 ? '+' : ''}${State.formatPct(changePct)}</div>
          </div>
        </div>
      </div>
    `;
  }
};

Pages.fundDetail = {
  render(app, params) {
    const code = params.code;
    const f = DATA.funds.find(x => x.code === code);
    if (!f) { Router.back(); return; }
    const s = State.data;
    const price = s.fundPrices[code] || f.basePrice;
    const hist = (s.fundHistory && s.fundHistory[code]) || [];
    const prev = hist.length >= 2 ? hist[hist.length-2].close : f.basePrice;
    const change = price - prev;
    const changePct = prev > 0 ? change / prev : 0;

    let hHigh = 0, hLow = Infinity;
    hist.forEach(h => { if (h.high > hHigh) hHigh = h.high; if (h.low < hLow) hLow = h.low; });
    if (hHigh === 0) hHigh = price;
    if (hLow === Infinity) hLow = price;

    const holding = (s.fundHoldings||[]).find(h => h.code === code);
    const shares = holding ? holding.shares : 0;
    const pnl = holding ? (price - holding.avgCost) * shares : 0;
    const pnlPct = holding && holding.avgCost > 0 ? (price - holding.avgCost) / holding.avgCost : 0;

    app.innerHTML = `
      <div class="page">
        ${UI.navbar(f.name)}
        <div class="topbar">
          <div style="font-size:11px;color:var(--text-secondary);">${f.code} \u00b7 ${f.type} \u00b7 \u98CE\u9669\u7B49\u7EA7\uFF1A${f.risk}</div>
          <div style="font-size:28px;font-weight:600;margin-top:4px;" class="${change >= 0 ? 'text-up' : 'text-down'}">\u00A5${price.toFixed(4)}</div>
          <div class="text-sm ${change >= 0 ? 'text-up' : 'text-down'}">${change >= 0 ? '+' : ''}${(price-prev).toFixed(4)} (${State.formatPct(changePct)})</div>
        </div>

        <div class="section-title">\u51C0\u503C\u8D70\u52BF\uFF08\u8FD1 ${Math.min(hist.length, 30)} \u65E5\uFF09</div>
        <div class="list-item" style="padding:8px;">
          ${this.lineChart(hist.slice(-30), price)}
        </div>

        <div class="section-title">\u57FA\u91D1\u6570\u636E</div>
        <div class="list-item">
          <div class="list-row"><span class="list-label">\u6628\u65E5\u51C0\u503C</span><span class="list-value">\u00A5${prev.toFixed(4)}</span></div>
          <div class="list-row"><span class="list-label">\u65E5\u6DA8\u5E45</span><span class="list-value ${change >= 0 ? 'up' : 'down'}">${State.formatPct(changePct)}</span></div>
          <div class="list-row"><span class="list-label">\u5386\u53F2\u6700\u9AD8</span><span class="list-value text-up">\u00A5${hHigh.toFixed(4)}</span></div>
          <div class="list-row"><span class="list-label">\u5386\u53F2\u6700\u4F4E</span><span class="list-value text-down">\u00A5${hLow.toFixed(4)}</span></div>
          <div class="list-row"><span class="list-label">\u57FA\u91D1\u7C7B\u578B</span><span class="list-value">${f.type}</span></div>
          <div class="list-row"><span class="list-label">\u98CE\u9669\u7B49\u7EA7</span><span class="list-value">${f.risk}</span></div>
        </div>

        <div class="section-title">\u57FA\u91D1\u7B80\u4ECB</div>
        <div class="list-item">
          <p class="text-sm" style="line-height:1.7;">${f.desc}</p>
          <div class="list-row mt-12">
            <span class="list-label">\u6210\u7ACB\u89C4\u6A21</span>
            <span class="list-value">${(Math.random()*50+5).toFixed(2)} \u4EBF\u4EFD</span>
          </div>
          <div class="list-row">
            <span class="list-label">\u57FA\u91D1\u7ECF\u7406</span>
            <span class="list-value">${['\u5F20\u660E','\u674E\u534E','\u738B\u5FD7\u5F3A','\u9648\u9759','\u5218\u4F1F'][Math.floor(Math.random()*5)]}</span>
          </div>
        </div>

        ${shares > 0 ? `
          <div class="section-title">\u6211\u7684\u6301\u4ED3</div>
          <div class="list-item">
            <div class="list-row"><span class="list-label">\u6301\u4ED3</span><span class="list-value">${shares.toLocaleString('zh-CN')} \u4EFD</span></div>
            <div class="list-row"><span class="list-label">\u6210\u672C</span><span class="list-value">\u00A5${holding.avgCost.toFixed(4)}</span></div>
            <div class="list-row"><span class="list-label">\u5E02\u503C</span><span class="list-value">${State.formatMoney(shares*price)}</span></div>
            <div class="list-row"><span class="list-label">\u6D6E\u76C8</span><span class="list-value ${pnl >= 0 ? 'up' : 'down'}">${pnl >= 0 ? '+' : ''}${State.formatMoney(pnl)} (${State.formatPct(pnlPct)})</span></div>
          </div>
        ` : ''}

        <div class="section-title">\u64CD\u4F5C</div>
        <div class="flex gap-8">
          <button class="btn primary" style="flex:1;" onclick="Funds.showBuy('${code}')">\u7533\u8D2D</button>
          <button class="btn ${holding ? 'danger' : ''}" style="flex:1;" ${holding ? '' : 'disabled style="opacity:0.4;flex:1;"'} onclick="Funds.showSell('${code}')">\u8D4E\u56DE</button>
        </div>

        <div style="height:20px;"></div>
        ${UI.bottombar()}
      </div>
    `;
  },

  lineChart(history, currentPrice) {
    if (history.length === 0) return '<div class="empty">\u6682\u65E0\u5386\u53F2\u6570\u636E</div>';
    const W = 320, H = 140;
    const padL = 4, padR = 35, padT = 8, padB = 8;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    let pMin = Infinity, pMax = 0;
    history.forEach(h => {
      const v = h.close;
      if (v < pMin) pMin = v;
      if (v > pMax) pMax = v;
    });
    const pad = (pMax - pMin) * 0.15 || pMax * 0.01;
    pMin -= pad; pMax += pad;
    const range = pMax - pMin || 1;

    const n = history.length;
    const step = chartW / Math.max(1, n - 1);

    let pathD = '';
    let areaD = '';
    history.forEach((h, i) => {
      const x = padL + i * step;
      const y = padT + (1 - (h.close - pMin) / range) * chartH;
      pathD += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      if (i === 0) areaD += 'M' + x.toFixed(1) + ' ' + (padT+chartH) + ' L' + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      else areaD += 'L' + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    });
    areaD += 'L' + (padL + (n-1)*step).toFixed(1) + ' ' + (padT+chartH) + ' Z';

    const isUp = history[history.length-1].close >= history[0].close;
    const color = isUp ? '#e24b4a' : '#1d9e75';

    return `
      <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto;">
        <path d="${areaD}" fill="${color}" opacity="0.1"/>
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.5"/>
        <line x1="${padL}" y1="${padT}" x2="${padL+chartW}" y2="${padT}" stroke="#eee" stroke-width="0.5"/>
        <line x1="${padL}" y1="${padT+chartH/2}" x2="${padL+chartW}" y2="${padT+chartH/2}" stroke="#eee" stroke-width="0.5"/>
        <line x1="${padL}" y1="${padT+chartH}" x2="${padL+chartW}" y2="${padT+chartH}" stroke="#eee" stroke-width="0.5"/>
        <text x="${W - padR + 2}" y="${padT+4}" font-size="9" fill="#9a9a9f">${pMax.toFixed(4)}</text>
        <text x="${W - padR + 2}" y="${padT+chartH/2}" font-size="9" fill="#9a9a9f">${((pMax+pMin)/2).toFixed(4)}</text>
        <text x="${W - padR + 2}" y="${padT+chartH}" font-size="9" fill="#9a9a9f">${pMin.toFixed(4)}</text>
      </svg>
    `;
  }
};

const Funds = {
  showBuy(code) {
    const f = DATA.funds.find(x => x.code === code);
    const price = State.data.fundPrices[code] || f.basePrice;
    const unitCost = price * 1.0015;
    const maxShares = Math.floor(State.data.cash / unitCost);
    if (maxShares <= 0) { UI.toast('\u73B0\u91D1\u4E0D\u8DB3'); return; }

    UI.numberPicker({
      title: '\u7533\u8D2D ' + f.name,
      unit: unitCost,
      unitName: '\u4EFD',
      unitLabel: `\u00A5${price.toFixed(4)}/\u4EFD \u00b7 \u7533\u8D2D\u8D39 0.15%`,
      max: maxShares,
      quickAdds: maxShares >= 10000 ? [100, 1000, 5000, 10000] : [10, 100, 500, 1000],
      onConfirm: (shares) => {
        if (shares <= 0) { UI.toast('\u8BF7\u9009\u62E9\u6570\u91CF'); return; }
        const cost = shares * price;
        const fee = cost * 0.0015;
        const total = cost + fee;
        State.data.cash -= total;
        if (!State.data.fundHoldings) State.data.fundHoldings = [];
        const existing = State.data.fundHoldings.find(h => h.code === code);
        if (existing) {
          const totalShares = existing.shares + shares;
          existing.avgCost = (existing.shares * existing.avgCost + cost) / totalShares;
          existing.shares = totalShares;
        } else {
          State.data.fundHoldings.push({ code, shares, avgCost: price, buyDay: State.data.date.totalDays });
        }
        State.save();
        UI.toast(`\u7533\u8D2D ${shares.toLocaleString('zh-CN')} \u4EFD ${f.name}`);
        Router.refresh();
      }
    });
  },

  showSell(code) {
    const f = DATA.funds.find(x => x.code === code);
    if (!State.data.fundHoldings) { UI.toast('\u65E0\u6301\u4ED3'); return; }
    const holding = State.data.fundHoldings.find(h => h.code === code);
    if (!holding) { UI.toast('\u65E0\u6301\u4ED3'); return; }
    if (State.data.date.totalDays <= (holding.buyDay||0)) {
      UI.toast('T+1 \u9650\u5236\uFF1A\u4ECA\u65E5\u7533\u8D2D\u660E\u65E5\u65B9\u53EF\u8D4E\u56DE');
      return;
    }
    const maxShares = holding.shares;
    const price = State.data.fundPrices[code] || f.basePrice;
    const held7 = State.data.date.totalDays - (holding.buyDay||0) >= 7;
    const feeRate = held7 ? 0 : 0.0025;
    const unitNet = price * (1 - feeRate);

    UI.numberPicker({
      title: '\u8D4E\u56DE ' + f.name,
      unit: unitNet,
      unitName: '\u4EFD',
      unitLabel: `\u00A5${price.toFixed(4)}/\u4EFD \u00b7 \u8D4E\u56DE\u8D39 ${feeRate*100}% \u00b7 \u6301\u6709 ${maxShares.toLocaleString('zh-CN')} \u4EFD`,
      max: maxShares,
      quickAdds: maxShares >= 10000 ? [100, 1000, 5000, 10000] : [10, 100, 500, 1000],
      onConfirm: (shares) => {
        if (shares <= 0) { UI.toast('\u8BF7\u9009\u62E9\u6570\u91CF'); return; }
        if (shares > holding.shares) { UI.toast('\u6301\u4ED3\u4E0D\u8DB3'); return; }
        const revenue = shares * price;
        const fee = revenue * feeRate;
        const net = revenue - fee;
        State.data.cash += net;
        holding.shares -= shares;
        if (holding.shares <= 0) {
          State.data.fundHoldings = State.data.fundHoldings.filter(h => h.code !== code);
        }
        State.save();
        UI.toast(`\u8D4E\u56DE ${shares.toLocaleString('zh-CN')} \u4EFD\uFF0C\u5230\u8D26 ${State.formatMoney(net)}`);
        Router.refresh();
      }
    });
  }
};

window.Pages = window.Pages || {};
window.Pages.funds = Pages.funds;
window.Pages.fundDetail = Pages.fundDetail;
window.Funds = Funds;