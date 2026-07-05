/* home.js — 主界面 */

const Pages = window.Pages || {};

Pages.home = {
  render(app) {
    const s = State.data;
    const total = State.totalAssets();
    const income = State.dailyIncome();

    app.innerHTML = `
      <div class="page">
        <div class="topbar">
          <div class="topbar-title">
            <h1>盛世集团</h1>
            <span class="topbar-date">${Engine.dateString()}</span>
          </div>
          <div class="topbar-stats">
            <div class="stat-item">
              <div class="label">现金</div>
              <div class="value">${State.formatMoney(s.cash)}</div>
            </div>
            <div class="stat-item">
              <div class="label">净资产</div>
              <div class="value">${State.formatMoney(total)}</div>
            </div>
            <div class="stat-item">
              <div class="label">日收入</div>
              <div class="value ${income >= 0 ? 'up' : 'down'}">${State.formatMoney(income)}</div>
            </div>
          </div>
        </div>

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

        <div class="section-title">金融</div>
        <div class="card-grid">
          ${this.financeCard('deposit', '存款', s.deposit, DATA.deposit.annualRate, '年化利率')}
          ${this.stockCard()}
          ${this.fundCard()}
          ${this.metalCard()}
        </div>

        <div class="section-title">实业</div>
        <div class="card-grid">
          ${this.industryCard('farm')}
          ${this.industryCard('mining')}
          ${this.industryCard('metall')}
          ${this.industryCard('factory')}
          ${this.industryCard('estate')}
          ${this.staffCard()}
          ${this.warehouseCard()}
        </div>

        ${UI.bottombar()}
      </div>
    `;
  },

  financeCard(page, name, amount, rate, sub) {
    return `
      <button class="card" onclick="Router.go('${page}')">
        <div class="card-title">${name}</div>
        <div class="card-sub">${sub} ${(rate*100).toFixed(1)}%</div>
        <div class="card-value">${State.formatMoney(amount)}</div>
      </button>
    `;
  },

  stockCard() {
    const s = State.data;
    let value = 0;
    s.stocks.forEach(st => { value += st.shares * (s.stockPrices[st.code] || 0); });
    return `
      <button class="card" onclick="Router.go('stocks')">
        <div class="card-title">股票</div>
        <div class="card-sub">持仓 ${s.stocks.length} 只</div>
        <div class="card-value">${State.formatMoney(value)}</div>
      </button>
    `;
  },

  fundCard() {
    const s = State.data;
    let value = 0;
    (s.fundHoldings||[]).forEach(h => { value += h.shares * (s.fundPrices[h.code] || 0); });
    return `
      <button class="card" onclick="Router.go('funds')">
        <div class="card-title">📊 基金</div>
        <div class="card-sub">持仓 ${(s.fundHoldings||[]).length} 只</div>
        <div class="card-value">${State.formatMoney(value)}</div>
      </button>
    `;
  },

  metalCard() {
    const s = State.data;
    let value = 0;
    s.metals.forEach(m => { value += m.grams * (s.metalPrices[m.code] || 0); });
    return `
      <button class="card" onclick="Router.go('metals')">
        <div class="card-title">贵金属</div>
        <div class="card-sub">持仓 ${s.metals.length} 种</div>
        <div class="card-value">${State.formatMoney(value)}</div>
      </button>
    `;
  },

  industryCard(type) {
    const ind = DATA.industries[type];
    const owned = State.data.industries.filter(i => i.type === type);
    let count = 0;
    let daily = 0;
    let unstaffed = 0;
    owned.forEach(o => {
      const cat = State.findIndustryCategory(type, o.category);
      if (cat) {
        const qty = o.quantity || 1;
        count += qty;
        const empMult = Employees.multiplier(type, o.category);
        if (empMult <= 0) {
          unstaffed += qty;
        } else {
          let recipeSat = 1.0;
          if (type === 'factory' && DATA.factoryRecipes[o.category]) {
            recipeSat = Employees.recipeSatisfaction(o.category, qty);
          }
          daily += cat.dailyIncome * (o.level || 1) * qty * empMult * recipeSat;
        }
      }
    });
    const sub = unstaffed > 0 ? `${unstaffed} 待派人` : `${count.toLocaleString('zh-CN')} ${ind.unit}`;
    return `
      <button class="card" onclick="Router.go('industry', {type:'${type}'})">
        <div class="card-title">${ind.icon} ${ind.name}</div>
        <div class="card-sub ${unstaffed > 0 ? 'text-muted' : ''}" style="${unstaffed > 0 ? 'color:var(--warning);' : ''}">${sub}</div>
        <div class="card-value ${daily > 0 ? 'up' : ''}">${daily > 0 ? '+' : ''}${State.formatMoney(daily)}/日</div>
      </button>
    `;
  },

  staffCard() {
    const count = Employees.count();
    const cap = Employees.capacity();
    const unassigned = Employees.unassignedCount();
    const salary = Employees.totalSalary();
    const sub = cap === 0 ? '需购住宅' : (unassigned > 0 ? `${unassigned} 待分配` : `${count}/${cap}`);
    return `
      <button class="card" onclick="Router.go('staff')">
        <div class="card-title">👥 员工</div>
        <div class="card-sub" style="${unassigned > 0 ? 'color:var(--warning);' : ''}">${sub}</div>
        <div class="card-value ${salary > 0 ? 'down' : ''}">${salary > 0 ? '-' : ''}${State.formatMoney(salary)}/日</div>
      </button>
    `;
  },

  warehouseCard() {
    const cap = Employees.warehouseCapacity();
    const used = Employees.warehouseUsed();
    const free = cap - used;
    const sub = cap === 0 ? '需购仓库' : `${used.toFixed(0)}/${cap}`;
    return `
      <button class="card" onclick="Router.go('warehouse')">
        <div class="card-title">📦 仓库</div>
        <div class="card-sub" style="${cap > 0 && free < cap * 0.1 ? 'color:var(--warning);' : ''}">${sub}</div>
        <div class="card-value ${cap === 0 ? '' : 'text-muted'}" style="${cap === 0 ? 'font-size:13px;' : ''}">${cap === 0 ? '点击前往' : '剩余 ' + free.toLocaleString('zh-CN')}</div>
      </button>
    `;
  }
};

const Home = {
  _advancing: false,
  advance(days) {
    if (this._advancing) return;
    this._advancing = true;
    // 加速期间暂停自然流逝，避免叠加
    TimeManager.autoPause();
    
    let result;
    try {
      result = Engine.advance(days);
    } catch (e) {
      console.error('推进失败:', e);
      this._advancing = false;
      TimeManager.remaining = TimeManager.totalSec;
      TimeManager.autoResume();
      TimeManager.updateUI();
      UI.toast('推进出错: ' + e.message);
      if (Router.current === 'home') Router.refresh();
      return;
    }
    // 加速完成：重置倒计时，恢复自然流逝
    TimeManager.remaining = TimeManager.totalSec;
    TimeManager.autoResume();

    // 显示结算弹窗
    let content = '';
    if (result.summaries.length === 1) {
      const log = result.summaries[0];
      content = `
        <p style="font-size:13px; color:var(--text-secondary); margin-bottom:10px;">${log.date}</p>
        ${log.details.length ? log.details.map(d => `
          <div class="list-row">
            <span class="list-label">${d.label}</span>
            ${d.type === 'info' ? `<span class="list-value" style="color:var(--text-secondary);">—</span>` :
              `<span class="list-value ${d.type === 'income' ? 'up' : 'down'}">${d.type === 'income' ? '+' : '-'}${State.formatMoney(Math.abs(d.amount))}</span>`}
          </div>
        `).join('') : '<div class="empty">今日无收支</div>'}
        <div class="list-row" style="margin-top:10px; padding-top:10px; border-top:0.5px solid var(--border);">
          <span class="font-medium">净收入</span>
          <span class="list-value ${log.net >= 0 ? 'up' : 'down'}">${log.net >= 0 ? '+' : ''}${State.formatMoney(log.net)}</span>
        </div>
      `;
    } else {
      let totalIncome = 0;
      result.summaries.forEach(l => totalIncome += l.net);
      content = `
        <p style="font-size:13px; color:var(--text-secondary); margin-bottom:10px;">
          已推进 ${result.summaries.length} 天
        </p>
        <div class="list-row">
          <span class="list-label">累计净收入</span>
          <span class="list-value ${totalIncome >= 0 ? 'up' : 'down'}">${totalIncome >= 0 ? '+' : ''}${State.formatMoney(totalIncome)}</span>
        </div>
      `;
    }

    // 新闻合并到结算弹窗
    if (result.events.length > 0) {
      const news = result.events[0];
      const tags = Engine.getNewsTags(news);
      const typeClass = news.type === 'disaster' ? 'danger' : 'success';
      content = `
        <div class="news-item ${typeClass}" style="margin-bottom:12px;">
          <div class="news-title">📰 ${news.title}</div>
          <div class="news-desc">${news.desc}</div>
          <div class="news-tags">
            ${tags.map(t => `<span class="news-tag ${t.type}">${t.label}</span>`).join('')}
          </div>
        </div>
        ${content}
      `;
    }

    const mask = UI.modal(days === 1 ? '当日结算' : `推进 ${result.summaries.length} 天`, content, [
      { label: '关闭', class: 'primary', onclick: 'Home._dismissAdvanceModal()' }
    ]);
    // 结算弹窗不可通过点击外面关闭，确保 _advancing 被正确重置
    if (mask) {
      const modalEl = mask.querySelector('.modal');
      if (modalEl) modalEl.dataset.dismissable = 'false';
    }
  },

  _dismissAdvanceModal() {
    try { UI.closeModal(); Router.refresh(); }
    finally {
      this._advancing = false;
      TimeManager.autoResume();
      TimeManager.updateUI();
    }
  }
};

window.Pages = Pages;
window.Home = Home;
