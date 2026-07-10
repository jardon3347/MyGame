/* ui.js — UI 渲染工具：路由、卡片、弹窗、Toast */

const Router = {
  current: null,
  history: [],
  scrollPositions: {},

  /* 普通跳转：压栈，支持返回 */
  go(page, params = {}) {
    if (this.current) {
      this.scrollPositions[this.current] = window.scrollY;
    }
    this.history.push({ page: this.current, params: this.params || {} });
    this.current = page;
    this.params = params;
    this.render();
    window.scrollTo(0, 0);
  },

  /* 根跳转：清空栈，用于底部栏导航（主入口） */
  goRoot(page, params = {}) {
    this.history = [];
    this.current = page;
    this.params = params;
    this.render();
    window.scrollTo(0, 0);
  },

  back() {
    // 如果有弹窗打开，先关闭弹窗，不执行返回导航
    const modal = document.querySelector('.modal-mask');
    if (modal) {
      UI.closeModal();
      return;
    }
    if (this.history.length > 0) {
      if (this.current) {
        this.scrollPositions[this.current] = window.scrollY;
      }
      const prev = this.history.pop();
      this.current = prev.page;
      this.params = prev.params || {};
      this.render();
      const saved = this.scrollPositions[this.current];
      window.scrollTo(0, saved || 0);
    } else {
      // 栈空了，回概览页
      this.goRoot('overview');
    }
  },

  /* 刷新当前页（不压栈，用于交易后更新数据） */
  refresh() {
    this.render();
    // 记住当前滚动位置
    if (this.current) {
      this.scrollPositions[this.current] = window.scrollY;
    }
    // 恢复滚动位置
    if (this.current) {
      const saved = this.scrollPositions[this.current] || 0;
      // 使用setTimeout确保DOM已经渲染完成
      setTimeout(() => window.scrollTo(0, saved), 50);
    }
  },

  render() {
    const app = document.getElementById('app');
    const page = this.current;

    // 时间管理
    const pausePages = ['stockDetail', 'fundDetail', 'metalDetail'];
    if (page === 'home' || page === 'overview') {
      TimeManager.enabled = true;
      TimeManager.autoPaused = false;
    } else if (pausePages.includes(page)) {
      TimeManager.enabled = false;
    } else {
      TimeManager.enabled = true;
      TimeManager.autoPaused = false;
    }

    if (page === 'home' || page === 'overview') Pages.overview.render(app);
    else if (page === 'finance') Pages.finance.render(app);
    else if (page === 'industry') Pages.industry.render(app);
    else if (page === 'deposit') Pages.deposit.render(app);
    else if (page === 'stocks') Pages.stocks.render(app);
    else if (page === 'stockDetail') Pages.stockDetail.render(app, this.params);
    else if (page === 'funds') Pages.funds.render(app);
    else if (page === 'fundDetail') Pages.fundDetail.render(app, this.params);
    else if (page === 'metals') Pages.metals.render(app);
    else if (page === 'industryDetail') Pages.industryDetail.render(app, this.params);
    else if (page === 'staff') Pages.staff.render(app);
    else if (page === 'warehouse') Pages.warehouse.render(app);
    else if (page === 'futures') Pages.futures.render(app);
    else if (page === 'competitors') Pages.competitors.render(app);
    else if (page === 'news') Router.goRoot('overview');

    // 更新底部栏选中态
    this._updateActiveTab();

    // 渲染后刷新一次时间 UI
    TimeManager.updateUI();
  },

  /* 更新底部栏按钮选中态 */
  _updateActiveTab() {
    const rootPages = ['overview', 'deposit', 'finance', 'industry'];
    const bar = document.querySelector('.bottombar');
    if (!bar) return;
    bar.querySelectorAll('button').forEach(btn => {
      btn.classList.remove('active');
    });
    if (rootPages.includes(this.current)) {
      const idx = rootPages.indexOf(this.current);
      const btns = bar.querySelectorAll('button');
      if (btns[idx]) btns[idx].classList.add('active');
    }
  },
};

const UI = {

  /* 导航栏 */
  navbar(title, showBack = true) {
    return `
      <div class="navbar">
        ${showBack ? '<button class="back" onclick="Router.back()">‹</button>' : ''}
        <h1>${title}</h1>
      </div>
    `;
  },

  /* Toast */
  toast(msg, duration = 2000) {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    el.onclick = function() { el.remove(); };
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, duration);
  },

  /* 弹窗 */
  modal(title, content, actions = []) {
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.innerHTML = `
      <div class="modal" onclick="event.stopPropagation()">
        <h2>${title}</h2>
        <div class="modal-body">${content}</div>
        ${actions.length ? `<div class="actions">${actions.map((a, i) => `<button class="btn ${a.class||''}" data-action-idx="${i}">${a.label}</button>`).join('')}</div>` : ''}
      </div>
    `;
    // JS event listeners replace inline onclick (more reliable on mobile)
    if (actions.length) {
      const btns = mask.querySelectorAll('.actions button');
      btns.forEach((btn, i) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const fn = new Function(actions[i].onclick);
          fn();
        });
      });
    }
    mask.addEventListener('click', () => {
      if (mask.querySelector('.modal').dataset.dismissable !== 'false') {
        mask.remove();
        TimeManager.autoResume();
      }
    });
    document.body.appendChild(mask);
    // 弹窗打开 → 自动暂停时间
    TimeManager.autoPause();
    return mask;
  },

  /* 关闭所有弹窗 */
  closeModal() {
    document.querySelectorAll('.modal-mask').forEach(m => m.remove());
    TimeManager.autoResume();
  },

  /* 数量选择器：滑块 + 快捷按钮 */
  /* 根据 max 计算滑块步进：小额+1，逐步增大为整数步 */
  _calcStep(max) {
    if (max <= 10) return 1;
    if (max <= 50) return 2;
    if (max <= 100) return 5;
    if (max <= 500) return 10;
    if (max <= 1000) return 50;
    if (max <= 5000) return 100;
    if (max <= 10000) return 500;
    if (max <= 50000) return 1000;
    if (max <= 100000) return 5000;
    return 10000;
  },

  /* 根据 max 生成统一快捷数量按钮 */
  _defaultQuickAdds(max) {
    const m = Math.floor(max);
    if (m <= 50) return [m, Math.ceil(m / 2), Math.ceil(m / 4), Math.ceil(m / 10)];
    if (m <= 500) return [m, 100, 50, 10];
    if (m <= 5000) return [m, 500, 100, 50];
    return [m, 1000, 500, 100];
  },

  numberPicker({ title, unit, unitName, unitLabel, max, quickAdds, onConfirm, noPlusOne }) {
    const id = 'np_' + Date.now();
    const step = this._calcStep(max);
    window._npState = { id, unit, unitName, max, value: 0, onConfirm };
    // 统一 quickAdds：不传则自动生成，所有按钮直设数值
    var qa = quickAdds && quickAdds.length > 0 ? quickAdds : this._defaultQuickAdds(max);

    const content = `
      <div class="np-info">
        <div class="np-unit">${unitLabel}</div>
        <div class="np-max">最多 ${max.toLocaleString('zh-CN')}</div>
      </div>
      <div class="np-display" id="${id}_val">0</div>
      <div class="np-unit-text" id="${id}_unit">${unitName || ''}</div>
      <input type="range" class="np-slider" id="${id}_slider"
             min="0" max="${max}" value="0" step="${step}"
             oninput="UI._npUpdate('${id}', this.value)">
      <div class="np-quick">
        ${qa.filter(function(n) { return n > 0 && n <= max; }).map(function(n) { return '<button class="np-quick-btn" onclick="UI._npSet(\'' + id + '\', ' + n + ')">' + n.toLocaleString('zh-CN') + '</button>'; }).join('')}
      </div>
      <div class="np-total">
        <span>合计</span>
        <span id="${id}_total">¥0</span>
      </div>
    `;

    this.modal(title, content, [
      { label: '取消', onclick: 'UI.closeModal()' },
      { label: '确认', class: 'primary', onclick: `UI._npSubmit('${id}')` }
    ]);
  },

  _npUpdate(id, val) {
    val = parseInt(val) || 0;
    const st = window._npState;
    st.value = val;
    document.getElementById(id + '_val').textContent = val.toLocaleString('zh-CN');
    document.getElementById(id + '_slider').value = val;
    document.getElementById(id + '_total').textContent = '¥' + State.formatNum(val * st.unit);
  },

  _npAdd(id, n) {
    const st = window._npState;
    const newVal = Math.min(st.value + n, st.max);
    this._npUpdate(id, newVal);
  },

  _npSet(id, val) {
    this._npUpdate(id, Math.min(val, window._npState.max));
  },

  _npSubmit(id) {
    const st = window._npState;
    const val = st.value;
    this.closeModal();
    if (st.onConfirm) st.onConfirm(val);
  },
  capacitySlider({ title, max, current, unitLabel, onConfirm, showTotal = true }) {
    const id = 'cs_' + Date.now();
    const step = max <= 10 ? 1 : (max <= 50 ? 5 : (max <= 100 ? 10 : 50));

    const content = `
      <div class="np-info">
        <div class="np-unit">${unitLabel}</div>
        <div class="np-max">最多 ${max.toLocaleString('zh-CN')}</div>
      </div>
      <div class="np-display" id="${id}_val">${current.toLocaleString('zh-CN')}</div>
            <input type="range" class="np-slider" id="${id}_slider"
             min="0" max="${max}" value="${current}" step="${step}"
             oninput="UI._csUpdate('${id}', this.value)">
      <div class="np-quick">
        ${[1, 5, 10, 50].filter(n => n <= max).map(n => `<button class="np-quick-btn" onclick="UI._csAdd('${id}', ${n})">+${n}</button>`).join('')}
        <button class="np-quick-btn np-max-btn" onclick="UI._csSet('${id}', ${max})">最大</button>
      </div>
      ${showTotal ? `<div class="np-total"><span>分配后</span><span id="${id}_result">${current.toLocaleString('zh-CN')}</span></div>` : ''}
    `;

    this.modal(title, content, [
      { label: '取消', onclick: 'UI.closeModal()' },
      { label: '确认', class: 'primary', onclick: `UI._csSubmit('${id}')` }
    ]);

    window._csState = { id, max, current, value: current, onConfirm, _labelUpdater: null };
  },

  _csUpdate(id, val) {
    val = parseInt(val) || 0;
    const st = window._csState;
    st.value = val;
    const display = st._labelUpdater ? st._labelUpdater(val) : val.toLocaleString('zh-CN');
    const vEl = document.getElementById(id + '_val');
    if (vEl) vEl.textContent = display;
    const rEl = document.getElementById(id + '_result');
    if (rEl) rEl.textContent = display;
  },

  /* 为容量滑块设置自定义标签更新器 */
  _customLabelUpdater(id, updater) {
    const st = window._csState;
    if (st) st._labelUpdater = updater;
  },

  _csSet(id, val) {
    const st = window._csState;
    val = Math.max(0, Math.min(st.max, val));
    st.value = val;
    const display = st._labelUpdater ? st._labelUpdater(val) : val.toLocaleString('zh-CN');
    document.getElementById(id + '_val').textContent = display;
    document.getElementById(id + '_slider').value = val;
    document.getElementById(id + '_result').textContent = display;
  },

  _csAdd(id, n) {
    const st = window._csState;
    const newVal = Math.min(st.value + n, st.max);
    this._csSet(id, newVal);
  },

  _csSubmit(id) {
    const st = window._csState;
    const val = st.value;
    this.closeModal();
    if (st.onConfirm) st.onConfirm(val);
  },



  /* 输入弹窗 */
  prompt(title, label, placeholder, defaultValue, onSubmit) {
    const mask = this.modal(title, `
      <div class="input-group">
        <label>${label}</label>
        <input type="number" id="prompt-input" placeholder="${placeholder}" value="${defaultValue||''}" autofocus>
      </div>
    `, [
      { label: '取消', onclick: 'UI.closeModal()' },
      { label: '确认', class: 'primary', onclick: `UI.submitPrompt('${onSubmit.name}')` }
    ]);
    mask.dataset.prompt = '1';
    window._promptCallback = onSubmit;
    // 回车提交
    setTimeout(() => {
      const input = document.getElementById('prompt-input');
      if (input) {
        input.focus();
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') this.submitPrompt(onSubmit.name);
        });
      }
    }, 100);
  },

  submitPrompt() {
    const input = document.getElementById('prompt-input');
    if (input && window._promptCallback) {
      const val = parseFloat(input.value);
      if (!isNaN(val)) {
        window._promptCallback(val);
      }
    }
    this.closeModal();
  },

  /* 确认弹窗 */
  confirm(title, msg, onConfirm) {
    window._confirmCallback = onConfirm;
    this.modal(title, `<p style="font-size:13px; color:var(--text-secondary);">${msg}</p>`, [
      { label: '取消', onclick: 'UI.closeModal()' },
      { label: '确认', class: 'primary', onclick: 'UI.runConfirm()' }
    ]);
  },

  runConfirm() {
    this.closeModal();
    if (window._confirmCallback) window._confirmCallback();
  },

  /* 底部固定栏 */
  /* 底部固定栏（主入口导航，使用 goRoot 清空栈） */
  bottombar() {
    return `
      <div class="bottombar">
        <button onclick="Router.goRoot('overview')">
          <span class="bb-icon">📊</span>
          <span>概览</span>
        </button>
        <button onclick="Router.goRoot('deposit')">
          <span class="bb-icon">🏦</span>
          <span>银行</span>
        </button>
        <button onclick="Router.goRoot('finance')">
          <span class="bb-icon">📈</span>
          <span>金融</span>
        </button>
        <button onclick="Router.goRoot('industry')">
          <span class="bb-icon">🏭</span>
          <span>实业</span>
        </button>
      </div>
    `;
  },

  /* ===== 实业卡片（从 home.js 提取，供 industry.js / home.js 共用） ===== */
  industryCard(type) {
    const ind = DATA.industries[type];
    if (!ind) return `<div class="card" style="text-align:center;color:var(--text-muted);">未知产业: ${type}</div>`;
    const owned = (State.data && State.data.industries) ? State.data.industries.filter(i => i.type === type) : [];
    let count = 0;
    let daily = 0;
    let unstaffed = 0;
    owned.forEach(o => {
      const cat = State.findIndustryCategory(type, o.category);
      if (cat) {
        const qty = o.quantity || 1;
        count += qty;
        const empMult = Employees.multiplier(type, o.category);
        if (empMult <= 0 && !['farmland', 'factory_land'].includes(o.category)) {
          unstaffed += qty;
        } else {
          daily += State.IndustryDailyIncome(type, o.category, qty, o);
        }
      }
    });
    const sub = unstaffed > 0 ? `${unstaffed} 待派人` : `${count.toLocaleString('zh-CN')} ${ind.unit}`;
    return `
      <button class="card" onclick="Router.go('industryDetail', {type:'${type}'})">
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

window.Router = Router;
window.UI = UI;
