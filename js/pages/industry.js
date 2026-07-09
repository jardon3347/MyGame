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
    if (this._tab === 'staff') return this._renderStaffFull();
    if (this._tab === 'warehouse') return this._renderWarehouseFull();
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

  /* ===== 员工 Tab 完整渲染 ===== */
  _renderStaffFull() {
    const cap = Employees.capacity();
    const count = Employees.count();
    const canHire = count < cap;
    const unassigned = Employees.unassignedCount();
    const salary = Employees.totalSalary();

    // 住宅列表
    const houses = (State.data.industries || []).filter(i => i.type === 'estate' && i.category === 'residential');
    const houseList = houses.map(h => {
      const cat = State.findIndustryCategory('estate', 'residential');
      const perUnit = 10 * Engine.levelMultiplier(h.level || 1);
      return `
        <div class="list-row">
          <span class="list-label">${cat ? cat.name : '住宅'} ×${h.quantity || 1}（Lv.${h.level || 1}）</span>
          <span class="list-value">+${perUnit * (h.quantity || 1)} 人</span>
        </div>`;
    }).join('');

    // 产业分配概览
    const ownedIndustries = State.data.industries || [];
    let industryRows = '';
    if (ownedIndustries.length === 0) {
      industryRows = '<div class="empty">尚无产业</div>';
    } else {
      ownedIndustries.forEach(o => {
        const cat = State.findIndustryCategory(o.type, o.category);
        if (!cat) return;
        const ind = DATA.industries[o.type];
        const empCnt = Employees.assignedCount(o.type, o.category);
        const mult = Employees.multiplier(o.type, o.category);
        industryRows += `
          <div class="list-item" style="margin-bottom:4px;">
            <div class="list-row">
              <div>
                <div class="font-medium">${ind.icon} ${cat.name} ×${o.quantity||1}</div>
                <div class="text-sm ${empCnt > 0 ? 'text-muted' : ''}" style="${empCnt > 0 ? '' : 'color:var(--down);'}">
                  ${empCnt > 0 ? empCnt + '人 · 加成 ×' + mult.toFixed(1) : '⚠ 暂无员工 · 无产出'}
                </div>
              </div>
              <div style="display:flex;gap:4px;align-items:center;">
                <button class="btn" style="font-size:12px;" onclick="Staff.showAssignPickerByIndustry('${o.type}', '${o.category}')">
                  ${empCnt > 0 ? '调整' : '派人'}
                </button>
                <button class="btn sm" style="min-width:28px;padding:1px 4px;font-size:12px;" onclick="Staff._quickAdjust('${o.type}', '${o.category}', 1)" title="+1">+1</button>
                <button class="btn sm" style="min-width:28px;padding:1px 4px;font-size:12px;${empCnt <= 0 ? 'opacity:0.4;' : ''}" onclick="Staff._quickAdjust('${o.type}', '${o.category}', -1)" title="-1" ${empCnt <= 0 ? 'disabled' : ''}>-1</button>
                ${empCnt > 0 ? `<button class="btn sm" style="font-size:11px;min-width:0;padding:2px 6px;color:var(--down);border-color:var(--down);" onclick="Staff._unassignAll('${o.type}', '${o.category}')" title="全部撤回">全撤</button>` : ''}
              </div>
            </div>
          </div>`;
      });
    }

    // 未分配员工列表（按加成降序）
    const unassignedList = (State.data.employees || []).filter(e => !e.assign).sort((a, b) => b.multiplier - a.multiplier);
    const unassignedHtml = unassignedList.length > 0 ? unassignedList.slice(0, 10).map(emp => `
      <div class="list-row" style="padding:4px 0;">
        <div>
          <span class="font-medium">${emp.name}</span>
          <span class="text-sm text-muted" style="margin-left:4px;">×${emp.multiplier}</span>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn sm" style="font-size:11px;min-width:0;padding:2px 6px;" onclick="Staff.showAssignPicker('${emp.id}')">分配</button>
          <button class="btn sm danger" style="font-size:11px;min-width:0;padding:2px 6px;" onclick="Employees.fire('${emp.id}')">解雇</button>
        </div></div>`).join('')
    : '<div class="empty">无未分配员工</div>';

    return `
      <!-- 统计条 -->
      <div class="topbar">
        <div class="topbar-stats">
          <div class="stat-item">
            <div class="label">员工总数</div>
            <div class="value">${count} / ${cap}</div></div>
          <div class="stat-item">
            <div class="label">未分配</div>
            <div class="value ${unassigned > 0 ? 'down' : ''}">${unassigned}</div></div>
          <div class="stat-item">
            <div class="label">日薪支出</div>
            <div class="value down">-${State.formatMoney(salary)}</div></div></div></div>

      ${cap === 0 ? `
        <div class="list-item" style="border-left:3px solid var(--warning);margin:8px 0;">
          <p class="text-sm" style="line-height:1.6;color:var(--warning);">
            ⚠ 尚无住宅，无法招聘员工。<br>
            请先在【地产】购入住宅。</p>
          <button class="btn primary sm full" style="margin-top:8px;"
                  onclick="Router.go('industryDetail', {type:'estate'})">前往地产 ›</button></div>
      ` : ''}

      <!-- 招聘 -->
      <div class="section-title">招聘</div>
      <div class="list-item">
        <div class="flex gap-8 center" style="margin-bottom:8px;">
          <button class="btn sm" onclick="Industry._quickHire(1)">+1 人</button>
          <button class="btn sm" onclick="Industry._quickHire(5)">+5 人</button>
          <button class="btn sm" onclick="Industry._quickHire(10)">+10 人</button></div>
        <button class="btn primary sm full" onclick="Industry._recruitPicker()"
                ${canHire ? '' : 'disabled style="opacity:0.4;"'}>
          精确招聘</button></div>

      <!-- 住宅容量 -->
      <div class="section-title">住宅容量</div>
      <div class="list-item">
        ${houseList || '<div class="empty">尚未购买住宅</div>'}
        <button class="btn sm full" style="margin-top:8px;"
                onclick="Router.go('industryDetail', {type:'estate'})">购买住宅 ›</button></div>

      <!-- 未分配员工 -->
      <div class="section-title">未分配员工（${unassigned}）</div>
      <div class="list-item">${unassignedHtml}</div>

      <!-- 已分配员工（折叠） -->
      ${Staff._collapsibleSection('assigned', '已分配员工', Staff._collapse.assigned, Staff._assignedSummary(), Pages.staff.assignedList())}

      <!-- 产业分配概览（折叠） -->
      ${Staff._collapsibleSection('overview', '产业分配概览', Staff._collapse.overview, Staff._overviewSummary(), Pages.staff.assignmentOverview())}
    `;
  },
  _renderWarehouseFull() {
    const cap = Employees.warehouseCapacity();
    const used = Employees.warehouseUsed();
    const free = Employees.warehouseFree();
    const usagePct = cap > 0 ? Math.round(used / cap * 100) : 0;

    // 库存清单
    const inv = State.data.inventory || {};
    const invEntries = Object.entries(inv).filter(([, qty]) => qty > 0);
    const invRows = invEntries.map(([code, qty]) => {
      const mat = DATA.rawMaterials.find(m => m.code === code);
      if (!mat) return '';
      const mkt = Employees.materialPrice(code);
      return `
        <div class="list-row">
          <span class="list-label">${mat.name}</span>
          <span class="list-value">${qty.toFixed(1)} ${mat.unit} · ¥${(qty * mkt).toLocaleString('zh-CN', {maximumFractionDigits: 0})}</span>
        </div>
      `;
    }).join('');

    // 库存总市值
    const totalValue = invEntries.reduce((sum, [code, qty]) => {
      return sum + Employees.materialPrice(code) * qty;
    }, 0);

    return `
      <!-- 容量条 -->
      <div class="topbar">
        <div class="topbar-stats">
          <div class="stat-item">
            <div class="label">总容量</div>
            <div class="value">${cap.toLocaleString('zh-CN')}</div>
          </div>
          <div class="stat-item">
            <div class="label">已用</div>
            <div class="value ${usagePct >= 90 ? 'down' : ''}">${used.toLocaleString('zh-CN', {maximumFractionDigits: 0})}</div>
          </div>
          <div class="stat-item">
            <div class="label">剩余</div>
            <div class="value ${free < cap * 0.1 ? 'down' : 'up'}">
              ${free.toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      </div>

      ${cap > 0 ? `
        <!-- 进度条 -->
        <div class="list-item" style="padding:0;overflow:hidden;margin-bottom:8px;">
          <div style="height:8px;background:var(--bg-secondary);width:100%;">
            <div style="height:100%;width:${Math.min(usagePct, 100)}%;
                        background:${usagePct >= 90 ? 'var(--down)' : 'var(--up)'};transition:width 0.3s;"></div>
          </div>
        </div>

        <!-- 扩容操作 -->
        <div class="section-title">仓库扩容</div>
        <div class="list-item">
          <div class="flex gap-8 center" style="margin-bottom:8px;">
            <button class="btn sm" onclick="Industry._quickExpand(1)">+1 套</button>
            <button class="btn sm" onclick="Industry._quickExpand(3)">+3 套</button>
            <button class="btn sm" onclick="Industry._quickExpand(5)">+5 套</button>
          </div>
          <button class="btn primary sm full" onclick="Industry.buy('estate', 'warehouse')">
            选择数量扩容
          </button>
        </div>
      ` : `
        <!-- 无仓库提示 -->
        <div class="list-item" style="border-left:4px solid var(--warning);background:rgba(186,117,23,0.1);padding:14px 16px;">
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <span style="font-size:28px;line-height:1;">⚠️</span>
            <div style="flex:1;">
              <div style="font-size:14px;font-weight:600;color:var(--warning);margin-bottom:6px;">仓库尚未建造</div>
              <p class="text-sm" style="line-height:1.6;color:var(--text-secondary);margin:0 0 10px 0;">
                尚无仓库地产，产出的原料无法存放，将自动以98折价卖出。<br>
                请先在 <span style="color:var(--info);">实业 → 地产 → 仓库</span> 购入仓库（每套可存 ${DATA.warehouseCapacityPerUnit.toLocaleString('zh-CN')} 单位原料）。
              </p>
              <button class="btn primary sm full" onclick="Industry.buy('estate', 'warehouse')">
                购买仓库 ›
              </button>
            </div>
          </div>
        </div>
      `}

      <!-- 库存清单 -->
      ${invRows ? `
        <div class="section-title">库存明细${totalValue > 0 ? '（总市值 ¥' + totalValue.toLocaleString('zh-CN', {maximumFractionDigits: 0}) + '）' : ''}</div>
        <div class="list-item">${invRows}</div>
      ` : `
        <div class="section-title">库存明细</div>
        <div class="empty">仓库空空如也</div>
      `}

      <!-- 更多操作 -->
      <div class="list-item" style="margin-top:8px;">
        <button class="btn sm full" onclick="Router.go('warehouse')">
          进入仓库管理（买卖原料） ›
        </button>
      </div>

      <!-- 使用提示 -->
      <div class="list-item" style="margin-top:8px;">
        <p class="text-sm text-muted" style="line-height:1.5;">
          · 产业的原料、产品都存放在仓库。<br>
          · 仓库满了不能继续生产，请及时扩容。<br>
          · 点击顶部"产业" Tab 返回产业界面。
        </p>
      </div>
    `;
  },

  /* ===== 就地刷新内容区 ===== */
  refreshTab() {
    const content = document.getElementById('industry-tab-content');
    if (content) content.innerHTML = this._renderTabContent();
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
  },

  switchToStaff() {
    if (Router.current !== 'industry') {
      Router.go('industry');
      setTimeout(() => {
        this._tab = 'staff';
        document.querySelectorAll('[data-indtab]').forEach(t => {
          t.classList.toggle('active', t.getAttribute('data-indtab') === 'staff');
        });
        const content = document.getElementById('industry-tab-content');
        if (content) content.innerHTML = this._renderTabContent();
      }, 50);
      return;
    }
    this._tab = 'staff';
    document.querySelectorAll('[data-indtab]').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-indtab') === 'staff');
    });
    const content = document.getElementById('industry-tab-content');
    if (content) content.innerHTML = this._renderTabContent();
  }
};

// 追加快捷方法到已有的 Industry 对象（由 industryDetail.js 创建）
if (window.Industry) {

  /* 快捷免费招聘（已有） */
  /* 快捷招聘 */
  Industry._quickHire = function(n) {
    const room = Employees.capacity() - Employees.count();
    if (room <= 0) { UI.toast('宿舍已满'); return; }
    Employees.recruit('free', Math.min(n, room));
  };

  Industry._quickExpand = function() {
    Industry.buy('estate', 'warehouse');
  };

  /* 精确招聘弹窗 */
  Industry._recruitPicker = function() {
    if (Employees.count() >= Employees.capacity()) { UI.toast('宿舍已满'); return; }
    const freeCfg = DATA.recruit.free;
    const paidCfg = DATA.recruit.paid;
    const freeMin = freeCfg.tiers[0].min;
    const freeMax = freeCfg.tiers[freeCfg.tiers.length - 1].max;
    UI.modal('选择招聘模式', `
      <div class="text-sm text-muted" style="margin-bottom:12px;">选择招聘模式后，可设定招聘数量</div>
      <div class="card-grid">
        <button class="card full" style="margin-bottom:10px;" onclick="UI.closeModal();Staff.recruitWithPicker('free')">
          <div class="card-title">免费招聘</div>
          <div class="card-sub">加成 ${freeMin} ~ ${freeMax}</div></button>
        <button class="card full" onclick="UI.closeModal();Staff.recruitWithPicker('paid')">
          <div class="card-title">付费招聘</div>
          <div class="card-sub">¥${paidCfg.cost}/人 · 加成 ${paidCfg.minMult} ~ ${paidCfg.maxMult}</div></button></div>
    `, [{ label: '取消', onclick: 'UI.closeModal()' }]);
  };
}
