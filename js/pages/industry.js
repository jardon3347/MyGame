/* industry.js — 实业主页面（顶部三 Tab：产业 / 员工 / 仓库） */

window.Pages = window.Pages || {};
window.Pages.industry = {
  _tab: 'plants',   // 'plants' | 'staff' | 'warehouse'

  render(app, params) {
    // 支持从 URL 参数恢复 Tab
    if (params && params.tab) this._tab = params.tab;

    app.innerHTML = `
      <div class="page">
        ${UI.navbar('实业', false)}

        <!-- 顶部常驻 Tab（与 finance.js 统一用 .tab-bar + .tab 样式） -->
        <div class="tab-container">
          <div class="tab-bar">
            <div class="tab${this._tab === 'plants' ? ' active' : ''}" data-indtab="plants" onclick="Pages.industry.switchTab('plants')">🏭 产业</div>
            <div class="tab${this._tab === 'staff' ? ' active' : ''}" data-indtab="staff" onclick="Pages.industry.switchTab('staff')">👥 员工</div>
            <div class="tab${this._tab === 'warehouse' ? ' active' : ''}" data-indtab="warehouse" onclick="Pages.industry.switchTab('warehouse')">📦 仓库</div>
          </div>
        </div>

        <!-- Tab 内容区 -->
        <div id="industry-tab-content">
          ${this._renderTabContent()}
        </div>

        ${UI.bottombar()}
      </div>
    `;
  },

  _renderTabContent() {
    if (!State.data) return '<div class="empty">数据加载中...</div>';
    if (this._tab === 'staff') return this._staffPreview();
    if (this._tab === 'warehouse') return this._warehousePreview();
    return this._plantsContent();
  },

  _plantsContent() {
    return `
      <div class="card-grid">
        ${UI.industryCard('farm')}
        ${UI.industryCard('mining')}
        ${UI.industryCard('metall')}
        ${UI.industryCard('factory')}
        ${UI.industryCard('estate')}
        ${UI.industryCard('logistics')}
      </div>
    `;
  },

  _staffPreview() {
    const count = Employees.count();
    const cap = Employees.capacity();
    const unassigned = Employees.unassignedCount();
    const salary = Employees.totalSalary();
    const sub = cap === 0 ? '需购住宅' : (unassigned > 0 ? `${unassigned} 待分配` : `${count}/${cap} 人`);
    return `
      <div class="card-grid grid-1">
        <button class="card card-preview" onclick="Router.go('staff')">
          <div class="card-title">👥 员工</div>
          <div class="card-sub" style="${unassigned > 0 ? 'color:var(--warning);' : ''}">${sub}</div>
          <div class="card-value ${salary > 0 ? 'down' : ''}">${salary > 0 ? '-' : ''}${State.formatMoney(salary)}/日</div>
          <div class="enter-hint">点击进入 ›</div>
        </button>
      </div>
    `;
  },

  _warehousePreview() {
    const cap = Employees.warehouseCapacity();
    const used = Employees.warehouseUsed();
    const free = cap - used;
    const sub = cap === 0 ? '需购仓库' : `${used.toFixed(0)}/${cap}`;
    return `
      <div class="card-grid grid-1">
        <button class="card card-preview" onclick="Router.go('warehouse')">
          <div class="card-title">📦 仓库</div>
          <div class="card-sub" style="${cap > 0 && free < cap * 0.1 ? 'color:var(--warning);' : ''}">${sub}</div>
          <div class="card-value ${cap === 0 ? '' : 'text-muted'}" style="${cap === 0 ? 'font-size:13px;' : ''}">${cap === 0 ? '点击前往' : '剩余 ' + free.toLocaleString('zh-CN')}</div>
          <div class="enter-hint">点击进入 ›</div>
        </button>
      </div>
    `;
  },

  switchTab(tab) {
    this._tab = tab;
    // 更新 Tab 高亮（与 finance.js 统一用 data-indtab）
    document.querySelectorAll('[data-indtab]').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-indtab') === tab);
    });
    // 刷新内容区
    const content = document.getElementById('industry-tab-content');
    if (content) content.innerHTML = this._renderTabContent();
  }
};

// 注意：不要声明 `window.Industry` — industryDetail.js 已有同名 `const Industry` 定义
// 浏览器中重复 const 声明会导致 SyntaxError，阻止整个脚本执行
// Tab 按钮直接通过 Pages.industry.switchTab() 调用即可
