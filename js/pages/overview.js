/* overview.js — 集团概览 + 产业总览 + 新闻页 */

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
    let warehouseValue = window.Employees ? Employees.warehouseValue() : 0;
    let industryValue = 0;
    let industryDaily = 0;
    let industryCount = 0;
    s.industries.forEach(ind => {
      const cat = State.findIndustryCategory(ind.type, ind.category);
      if (cat) {
        const qty = ind.quantity || 1;
        industryValue += cat.cost * 0.8 * qty;
        const empMult = Employees.multiplier(ind.type, ind.category);
        if (empMult > 0) {
          let recipeSat = 1.0;
          if (ind.type === 'factory' && DATA.factoryRecipes[ind.category]) {
            recipeSat = Employees.recipeSatisfaction(ind.category, qty);
          }
          industryDaily += cat.dailyIncome * (ind.level || 1) * qty * empMult * recipeSat;
        }
        industryCount += qty;
      }
    });
    const empSalary = Employees.totalSalary();

    app.innerHTML = `
      <div class="page">
        ${UI.navbar('集团概览')}
        <div class="topbar">
          <div class="topbar-stats">
            <div class="stat-item">
              <div class="label">总资产</div>
              <div class="value">${State.formatMoney(total)}</div>
            </div>
            <div class="stat-item">
              <div class="label">日收入</div>
              <div class="value up">${State.formatMoney(income)}</div>
            </div>
            <div class="stat-item">
              <div class="label">日期</div>
              <div class="value" style="font-size:12px;">${s.date.year}/${s.date.month}/${s.date.day}</div>
            </div>
          </div>
        </div>

        <div class="section-title">资产分布</div>
        <div class="list-item">
          ${this.assetRow('现金', s.cash, total)}
          ${this.assetRow('存款', s.deposit, total)}
          ${this.assetRow('股票', stockValue, total)}
          ${this.assetRow('基金', fundValue, total)}
          ${this.assetRow('贵金属', metalValue, total)}
          ${this.assetRow('仓库库存', warehouseValue, total)}
          ${this.assetRow('实业', industryValue, total)}
        </div>

        <div class="section-title">产业收入</div>
        <div class="list-item">
          ${this.industryIncomeRow('🌾 农业', 'farm')}
          ${this.industryIncomeRow('⛏️ 矿业', 'mining')}
          ${this.industryIncomeRow('🔥 冶金', 'metall')}
          ${this.industryIncomeRow('🏭 工厂', 'factory')}
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

        <div class="section-title">操作</div>
        <div class="card-grid">
          <button class="card" onclick="Router.go('news')">
            <div class="card-title">市场新闻</div>
            <div class="card-sub">查看历史动态</div>
          </button>
          <button class="card" onclick="UI.confirm('重置游戏','将清空当前进度，确认重置？',()=>{State.reset();})">
            <div class="card-title" style="color:var(--down);">重置游戏</div>
            <div class="card-sub">清空存档重新开始</div>
          </button>
        </div>

        ${UI.bottombar()}
      </div>
    `;
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
          daily += cat.dailyIncome * (o.level || 1) * qty * empMult * recipeSat;
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

  /* 新闻页 */
  renderNews(app) {
    const news = State.data.news;
    app.innerHTML = `
      <div class="page">
        ${UI.navbar('市场新闻')}
        <div class="section-title">历史新闻（${news.length} 条）</div>
        ${news.length === 0 ? '<div class="empty">暂无新闻，多推进几天试试</div>' :
          news.map(n => this.newsItem(n)).join('')}
        ${UI.bottombar()}
      </div>
    `;
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
  }
};

window.Pages = window.Pages || {};
window.Pages.overview = Pages.overview;
