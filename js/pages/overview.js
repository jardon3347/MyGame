/* overview.js — 集团概览（合并新闻 + 时间推进，单页常驻） */

Pages.overview = {
  render(app) {
    const s = State.data;
    const total = State.totalAssets();
    const income = State.dailyIncome();

    // 资产分布
    let stockValue = 0;
    s.stocks.forEach(st => { stockValue += st.shares * (s.stockPrices[st.code] || 0); });
    let fundValue = 0;
    (s.fundHoldings||[]).forEach(h => { fundValue += h.shares * (s.fundPrices[h.code] || 0); });
    let metalValue = 0;
    s.metals.forEach(m => { metalValue += m.grams * (s.metalPrices[m.code] || 0); });
    let industryValue = 0;
    let industryDaily = 0;
    let industryCount = 0;
    s.industries.forEach(ind => {
      const cat = State.findIndustryCategory(ind.type, ind.category);
      if (cat) {
        const qty = ind.quantity || 1;
        const empM = Employees.multiplier(ind.type, ind.category);

        // 实业估值 = 购入成本 + 已实现利润
        if (cat.cost) {
          let val = cat.cost * qty;
          if (ind.type === 'mining' && cat.licenseCost && ind.licenseLevel) {
            val += cat.licenseCost * (ind.licenseLevel || 1);
          }
          industryValue += val;
        }
        industryValue += (ind.cumulativeProfit || 0);
        industryDaily += State.IndustryDailyIncome(ind.type, ind.category, qty, ind);
        industryCount += qty;
      }
    });
    const empSalary = Employees.totalSalary();
    // 30日趋势统计
    const trendStats = this._computeTrendStats(s.dailyStats || []);
    app.innerHTML = `
      <div class="page">
        ${UI.navbar('盛世集团 · 概览', false)}

        <!-- 时间条 + 推进按钮（从 home.js 迁移） -->
        <div class="time-bar">
          <div class="time-bar-track">
            <div class="time-bar-fill" id="time-progress-bar"></div>
          </div>
          <div class="time-bar-info">
            <span id="time-remaining">10:00</span>
            <button id="time-pause-btn" class="time-pause-btn" onclick="TimeManager.togglePause()">⏸</button>
          </div>
        </div>

        <div class="section-title">时间推进</div>
        <div class="speed-bar">
          <button class="speed-btn" onclick="Home.advance(1)">
            过完今天
            <span class="speed-label">×1 看明细</span>
          </button>
          <button class="speed-btn" onclick="Home.advance(7)">
            跳过一周
            <span class="speed-label">×7 遇事件暂停</span>
          </button>
          <button class="speed-btn" onclick="Home.advance(30)">
            跳过一月
            <span class="speed-label">×30 快进</span>
          </button>
        </div>

        <button class="btn full" style="margin-top:8px;" onclick="Overview.showManual()">
          📖 产业说明书
        </button>

        <!-- 顶部统计条 -->
        <div class="topbar">
          <div class="topbar-stats">
            <div class="stat-item">
              <div class="label">总资产</div>
              <div class="value">${State.formatMoney(total)}</div>
            </div>
            <div class="stat-item">
              <div class="label">日收入</div>
              <div class="value ${income >= 0 ? 'up' : 'down'}">${income >= 0 ? '+' : ''}${State.formatMoney(income)}</div>
            </div>
            <div class="stat-item">
              <div class="label">日期</div>
              <div class="value" style="font-size:12px;">${Engine.dateString()}</div>
            </div>
          </div>
        </div>

                <!-- 近30日净收入趋势 -->
        <div class="section-title">📈 近30日净收入趋势</div>
        <div class="list-item" style="padding:8px 12px;">
          <canvas id="overview-trend-canvas" style="width:100%;height:80px;display:block;"></canvas>
          <div class="flex between text-sm text-muted" style="margin-top:6px;">
            <span>最高 <span class="up">${State.formatMoney(trendStats.max)}</span></span>
            <span>最低 <span class="down">${State.formatMoney(trendStats.min)}</span></span>
            <span>平均 ${State.formatMoney(trendStats.avg)}</span>
          </div>
        </div>
        <!-- 资产分布 + 产业收入 双栏并排 -->
        <div class="overview-duo">
          <div class="overview-duo-col">
            <div class="section-title">资产分布</div>
            <div class="list-item">
              ${this.assetRow('现金', s.cash, total)}
              ${this.assetRow('银行存款', s.deposit, total)}
              ${(s.loan || 0) > 0 ? this.assetRow('贷款', -s.loan, total) : ''}
              ${this.assetRow('股票', stockValue, total)}
              ${this.assetRow('基金', fundValue, total)}
              ${this.assetRow('贵金属', metalValue, total)}
              ${this.assetRow('实业', industryValue, total)}
            </div>
          </div>
          <div class="overview-duo-col">
            <div class="section-title">产业收入</div>
            <div class="list-item">
              ${this.industryIncomeRow('🌾 农业', 'farm')}
              ${this.industryIncomeRow('⛏️ 矿业', 'mining')}
              ${this.industryIncomeRow('🔥 冶金', 'metall')}
              ${this.industryIncomeRow('🏭 工厂', 'factory')}
              ${this._logisticsIncomeRow()}
              ${this.industryIncomeRow('🏢 地产', 'estate')}
              <div class="list-row">
                <span class="list-label">👥 员工薪水（${Employees.count()}/${Employees.capacity()}人）</span>
                <span class="list-value down">-${State.formatMoney(empSalary)}</span>
              </div>
              <div class="list-row" style="margin-top:8px; padding-top:8px; border-top:0.5px solid var(--border);">
                <span class="font-medium">合计净收入</span>
                <span class="list-value ${industryDaily - empSalary >= 0 ? 'up' : 'down'}">${State.formatMoney(industryDaily - empSalary)}/日</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 新闻区（原 renderNews 内联） -->
        ${this._renderNewsSection()}

        <!-- 排行榜概要 -->
        <div class="section-title">🏆 竞争排行榜</div>
        <div class="list-item" style="margin-bottom:12px;">
          <div class="list-row">
            <span class="list-label">你的集团排名</span>
            <span class="list-value" id="overview-rank-text"></span>
          </div>
          <div id="overview-rank-list"></div>
          <button class="btn full" style="margin-top:8px;" onclick="Router.go('competitors')">查看完整排行榜</button>
        </div>

                <!-- 操作 -->
        <div class="section-title">操作</div>
        <div class="card-grid">
          <button class="card" onclick="Overview.toggleTheme()" id="theme-toggle-btn">
            <div class="card-title">${document.documentElement.getAttribute('data-theme') === 'dark' ? '浅色主题' : '深色主题'}</div>
            <div class="card-sub">点击切换外观</div>
          </button>
          <button class="card" onclick="UI.confirm('重置游戏','将清空当前进度，确认重置？',()=>{State.reset();})">
            <div class="card-title" style="color:var(--down);">重置游戏</div>
            <div class="card-sub">清空存档重新开始</div>
          </button>
        </div>

        ${UI.bottombar()}
      </div>
    `;
    Pages.overview._renderTrendChart();
    Pages.overview._renderRankingPreview();
  },

  assetRow(name, value, total) {
    const pct = total > 0 ? (value / total * 100).toFixed(1) : '0.0';
    return `
      <div class="list-row">
        <span class="list-label">${name}</span>
        <span class="list-value">${State.formatMoney(value)} <span class="text-muted text-sm">(${pct}%)</span></span>
      </div>
    `;
  },

  industryIncomeRow(label, type) {
    const owned = State.data.industries.filter(i => i.type === type);
    const ind = DATA.industries[type];
    let daily = 0;
    let count = 0;
    let unstaffed = 0;
    owned.forEach(o => {
      const cat = State.findIndustryCategory(type, o.category);
      if (cat) {
        const qty = o.quantity || 1;
        const empMult = Employees.multiplier(type, o.category);
        if (empMult > 0) {
          let recipeSat = 1.0;
          if (type === 'factory' && DATA.factoryRecipes[o.category]) {
            recipeSat = Employees.recipeSatisfaction(o.category, qty);
          }
          if (type === 'factory' && window.FactoryProducts && o.products !== undefined) {
            const prodIncome = FactoryProducts.factoryDailyIncome(o.category);
            if (!isNaN(prodIncome)) daily += prodIncome;
          } else if (cat.produces) {
            const licenseMult = (type === 'mining' && o.licenseLevel && o.licenseLevel > 1)
              ? (1 + (o.licenseLevel - 1) * 0.2) : 1;
            const produceQty = cat.produces.qty * qty * empMult * licenseMult;
            const matPrice = Employees.materialPrice(cat.produces.code);
            daily += produceQty * matPrice;
          } else {
            const levelMult = (type === 'farm' || type === 'mining' || type === 'metall') ? 1 : Engine.levelMultiplier(o.level || 1);
            daily += (cat.dailyIncome || 0) * levelMult * qty * empMult * (recipeSat || 1);
          }
        } else {
          unstaffed += qty;
        }
        count += qty;
      }
    });
    const unstaffedTag = unstaffed > 0 ? ` · ${unstaffed}待派` : '';
    return `
      <div class="list-row">
        <span class="list-label">${label}（${count.toLocaleString('zh-CN')} ${ind.unit}${unstaffedTag}）</span>
        <span class="list-value ${daily > 0 ? 'up' : ''}">${daily > 0 ? '+' : ''}${State.formatMoney(daily)}</span>
      </div>
    `;
  },

  _logisticsIncomeRow() {
    const income = State.data.lastLogisticsIncome || 0;
    const expense = State.data.lastLogisticsExpense || 0;
    const net = income - expense;
    const usedSlots = window.LogisticsSystem ? LogisticsSystem.getUsedSlots() : 0;
    const totalSlots = window.LogisticsSystem ? LogisticsSystem.getTotalSlots() : 0;
    const feeRate = window.LogisticsSystem ? LogisticsSystem.getBestFeeRate() : 0.02;
    const canBuy = window.LogisticsSystem ? LogisticsSystem.canAutoBuy() : false;
    const label = `🚛 物流（${usedSlots}/${totalSlots}槽 · 费率${(feeRate*100).toFixed(1)}%${canBuy ? ' · 自动买入✔' : ''}）`;
    return `<div class="list-row"><span class="list-label">${label}</span><span class="list-value ${net >= 0 ? 'up' : 'down'}">${net >= 0 ? '+' : ''}${State.formatMoney(net)}/日</span></div>`;
  },

  /* ===== 新闻区（内联到概览页，不再单独成页） ===== */
  _renderNewsSection() {
    const s = State.data;
    const news = s.news || [];
    const activeEffects = s.activeEffects || [];

    let html = '';

    // 1) 当前生效事件
    if (activeEffects.length > 0) {
      html += `
        <div class="section-title">⚡ 当前生效事件（${activeEffects.length} 个）</div>
        ${activeEffects.map(eff => {
          const tags = Engine.getNewsTags(eff);
          const origDur = eff.effects._origDuration || eff.remainingDays || 5;
          const remainingPercent = Math.max(0, Math.min(1, eff.remainingDays / origDur));
          return `
            <div class="news-item active" style="border-left: 3px solid var(--warning); margin-bottom: 8px;">
              <div class="flex between" style="margin-bottom: 4px;">
                <span class="news-title" style="font-size:13px;">📌 ${eff.title}</span>
                <span class="text-sm" style="color:var(--warning); white-space:nowrap;">剩 ${eff.remainingDays} 天</span>
              </div>
              <div class="time-bar-track" style="height:3px; margin-bottom:6px; background:var(--bg-secondary);">
                <div class="time-bar-fill" style="width:${remainingPercent*100}%; height:3px; background:var(--warning);"></div>
              </div>
              ${tags.length ? `<div class="news-tags">${tags.map(t => `<span class="news-tag ${t.type}">${t.label}</span>`).join('')}</div>` : ''}
            </div>
          `;
        }).join('')}
      `;
    }

    // 2) 利率变动记录
    const rateEvents = news.filter(n => n.effects && n.effects.interestRate != null);
    if (rateEvents.length > 0) {
      html += `
        <div class="section-title">📊 利率变动记录</div>
        <div class="list-item">
          ${rateEvents.slice(0, 8).map(n => {
            const dir = n.effects.interestRate > 0 ? 'up' : 'down';
            const sign = n.effects.interestRate > 0 ? '+' : '';
            return `
              <div class="list-row">
                <span class="list-label">${n.date || ''} ${n.title}</span>
                <span class="list-value ${dir}">${sign}${(n.effects.interestRate*100).toFixed(1)}%</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 3) 新闻历史（默认折叠，只显示3条）
    const previewCount = 3;
    const hasMore = news.length > previewCount;
    html += `
      <div class="section-title">📰 新闻历史（${news.length} 条）</div>
      ${news.length === 0 ? '<div class="empty">暂无新闻，多推进几天试试</div>' :
        news.slice(0, previewCount).map(n => this.newsItem(n)).join('')}
      ${hasMore ? `
        <div id="news-folded" style="display:none;">
          ${news.slice(previewCount, 20).map(n => this.newsItem(n)).join('')}
        </div>
        <button class="btn sm full" id="news-toggle-btn" onclick="Overview._toggleNewsExpand()" style="margin-top:4px;">
          展开更多（${news.length - previewCount} 条）
        </button>
      ` : ''}
      ${news.length > 20 ? `<div class="text-sm text-muted" style="text-align:center; padding:8px;">仅显示最近 20 条，共 ${news.length} 条</div>` : ''}
    `;
    return html;
  },

  newsItem(n) {
    const news = NEWS_LIBRARY.find(x => x.id === n.id) || n;
    const tags = Engine.getNewsTags(news);
    const typeClass = n.type === 'disaster' ? 'danger' : (n.type === 'policy' ? 'success' : '');
    return `
      <div class="news-item ${typeClass}">
        <div class="flex between">
          <span class="text-sm text-muted">${n.date}</span>
          <span class="text-sm text-muted">第 ${n.day} 天</span>
        </div>
        <div class="news-title">${n.title}</div>
        <div class="news-desc">${n.desc}</div>
        ${tags.length ? `<div class="news-tags">${tags.map(t => `<span class="news-tag ${t.type}">${t.label}</span>`).join('')}</div>` : ''}
      </div>
    `;
  },
  _computeTrendStats(stats) {
    if (!stats || stats.length === 0) return { max: 0, min: 0, avg: 0 };
    const values = stats.map(s => s.netIncome || 0);
    return {
      max: Math.max(...values),
      min: Math.min(...values),
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    };
  },
  _renderRankingPreview() {
    if (!window.Competitors) return;
    Competitors.init();
    const ranking = Competitors.getRanking();
    const playerRank = ranking.findIndex(r => r.isPlayer) + 1;
    const rankText = document.getElementById('overview-rank-text');
    const rankList = document.getElementById('overview-rank-list');
    if (rankText) rankText.textContent = '第 ' + playerRank + ' / ' + ranking.length + ' 名';
    if (rankList) {
      rankList.innerHTML = ranking.map((r, i) => {
        return '<div class="list-row" style="padding:4px 0;">' +
          '<span class="list-label">' + (i + 1) + '. ' + r.name + (r.isPlayer ? ' (你)' : '') + '</span>' +
          '<span class="list-value' + (r.isPlayer ? ' up' : '') + '">' + State.formatMoney(r.assets) + '</span>' +
        '</div>';
      }).join('');
    }
  },

    _renderTrendChart() {
    const canvas = document.getElementById('overview-trend-canvas');
    if (!canvas || !window.Charts) return;
    const stats = State.data.dailyStats || [];
    const w = canvas.clientWidth || canvas.parentElement.clientWidth - 24 || 320;
    Charts.lineChart(canvas, stats, { width: w, height: 80 });
  },

};

window.Pages = window.Pages || {};
window.Pages.overview = Pages.overview;

const Overview = {
  toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
      html.removeAttribute('data-theme');
      try { localStorage.setItem('shengshi_theme', 'light'); } catch (e) {}
    } else {
      html.setAttribute('data-theme', 'dark');
      try { localStorage.setItem('shengshi_theme', 'dark'); } catch (e) {}
    }
    // 刷新按钮文字
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      const title = btn.querySelector('.card-title');
      if (title) title.textContent = isDark ? '深色主题' : '浅色主题';
    }
    UI.toast(isDark ? '已切换为浅色主题' : '已切换为深色主题');
  },

  initTheme() {
    try {
      const saved = localStorage.getItem('shengshi_theme');
      if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (e) {
      // localStorage unavailable (e.g. file:// protocol)
    }
  },


  showManual() {
    const types = ['farm', 'mining', 'metall', 'factory', 'estate', 'logistics'];
    const firstType = types[0];
    const firstDesc = DATA.industries[firstType].description;

    let tabsHtml = '<div class="tab-container" style="margin-bottom:12px;"><div class="tab-bar">';
    types.forEach((t, i) => {
      const ind = DATA.industries[t];
      tabsHtml += '<div class="tab' + (i === 0 ? ' active' : '') + '" data-mantab="' + t + '" onclick="Overview._switchManualTab(\'' + t + '\')">' + ind.icon + ' ' + ind.name + '</div>';
    });
    tabsHtml += '</div></div>';

    tabsHtml += '<div id="manual-tab-content" style="max-height:50vh;overflow-y:auto;-webkit-overflow-scrolling:touch;">';
    tabsHtml += '<div class="font-medium" style="margin-bottom:8px;">' + firstDesc.title + '</div>';
    tabsHtml += '<p class="text-sm text-muted" style="line-height:1.7;white-space:pre-line;">' + firstDesc.content + '</p>';
    tabsHtml += '</div>';

    UI.modal('\ud83d\udcd6 产业说明书', tabsHtml, [
      { label: '关闭', onclick: 'UI.closeModal()' }
    ]);
  },

  _switchManualTab(type) {
    // Update tab active state
    document.querySelectorAll('[data-mantab]').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-mantab') === type);
    });
    // Update content
    const desc = DATA.industries[type].description;
    const content = document.getElementById('manual-tab-content');
    if (content && desc) {
      content.innerHTML = '<div class="font-medium" style="margin-bottom:8px;">' + desc.title + '</div>' +
        '<p class="text-sm text-muted" style="line-height:1.7;white-space:pre-line;">' + desc.content + '</p>';
    }
  }
,

  _toggleNewsExpand() {
    var folded = document.getElementById('news-folded');
    var btn = document.getElementById('news-toggle-btn');
    if (!folded || !btn) return;
    var expanded = folded.style.display !== 'none';
    folded.style.display = expanded ? 'none' : '';
    btn.textContent = expanded ? '\u5c55\u5f00\u66f4\u591a' : '\u6536\u8d77';
  }
};

window.Overview = Overview;
