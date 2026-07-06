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
      // 栈空了，回主页
      this.goRoot('home');
    }
  },

  /* 刷新当前页（不压栈，用于交易后更新数据） */
  refresh() {
    this.render();
    // 记住当前滚动位置
    if (this.current) {
      this.scrollPositions[this.current] = window.scrollY;
    }
    this.render();
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

    // 时间管理：仅主页启用自然流逝；详情页/交易页暂停
    const pausePages = ['stockDetail', 'fundDetail'];
    if (page === 'home') {
      TimeManager.enabled = true;
      TimeManager.autoPaused = false;
    } else if (pausePages.includes(page)) {
      TimeManager.enabled = false;
    } else {
      // 列表页：时间继续，但弹窗会自动暂停
      TimeManager.enabled = true;
      TimeManager.autoPaused = false;
    }

    if (page === 'home') Pages.home.render(app);
    else if (page === 'deposit') Pages.deposit.render(app);
    else if (page === 'stocks') Pages.stocks.render(app);
    else if (page === 'stockDetail') Pages.stockDetail.render(app, this.params);
    else if (page === 'funds') Pages.funds.render(app);
    else if (page === 'fundDetail') Pages.fundDetail.render(app, this.params);
    else if (page === 'metals') Pages.metals.render(app);
    else if (page === 'industry') Pages.industry.render(app, this.params);
    else if (page === 'staff') Pages.staff.render(app);
    else if (page === 'warehouse') Pages.warehouse.render(app);
    else if (page === 'overview') Pages.overview.render(app);
    else if (page === 'news') Pages.overview.renderNews(app);

    // 渲染后刷新一次时间 UI
    TimeManager.updateUI();
  }
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
    document.body.appendChild(el);
    setTimeout(() => el.remove(), duration);
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

  numberPicker({ title, unit, unitName, unitLabel, max, quickAdds, onConfirm }) {
    const id = 'np_' + Date.now();
    const step = this._calcStep(max);
    window._npState = { id, unit, unitName, max, value: 0, onConfirm };

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
        ${quickAdds.map(n => `<button class="np-quick-btn" onclick="UI._npAdd('${id}', ${n})" ${n > max ? 'disabled' : ''}>+${n.toLocaleString('zh-CN')}</button>`).join('')}
        <button class="np-quick-btn np-max-btn" onclick="UI._npSet('${id}', ${max})">最大</button>
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
        <button onclick="Router.goRoot('overview')">集团概览</button>
        <button onclick="Router.goRoot('deposit')">银行</button>
        <button onclick="Router.goRoot('news')">新闻</button>
      </div>
    `;
  }
};

window.Router = Router;
window.UI = UI;
