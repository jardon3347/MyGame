/* staff.js — 员工管理页：独立员工模型 { id, name, multiplier, assign } */
import { Pages } from './home.js';
import { State } from '../state.js';
import { Employees } from '../employees.js';
import { DATA } from '../data.js';
import { TimeManager } from '../time.js';
import { Router, UI } from '../ui.js';

Pages.staff = {
  render(app) {
    const s = State.data;
    const cap = Employees.capacity();
    const count = Employees.count();
    const unassigned = Employees.unassignedCount();
    const salary = Employees.totalSalary();
    const avgMorale = Math.round(Employees.averageMorale());
    const lowCount = Employees.lowMoraleCount();
    const moraleColor = avgMorale >= 60 ? 'var(--up)' : (avgMorale >= 30 ? 'var(--warning)' : 'var(--down)');

    app.innerHTML = `
      <div class="page">
        ${UI.navbar('员工管理')}
        <div class="topbar">
          <div class="topbar-stats" style="grid-template-columns:repeat(4,1fr);">
            <div class="stat-item">
              <div class="label">员工总数</div>
              <div class="value" id="staff-stat-count">${count} / ${cap}</div>
            </div>
            <div class="stat-item">
              <div class="label">未分配</div>
              <div class="value" id="staff-stat-unassigned">${unassigned}</div>
            </div>
            <div class="stat-item">
              <div class="label">日薪支出</div>
              <div class="value down" id="staff-stat-salary">-${State.formatMoney(salary)}</div>
            </div>
            <div class="stat-item">
              <div class="label">士气 ${lowCount > 0 ? '⚠' + lowCount : ''}</div>
              <div class="value" id="staff-stat-morale" style="color:${moraleColor};">${avgMorale}</div>
            </div>
          </div>
        </div>

        ${cap === 0 ? `
          <div class="list-item" style="border-left:3px solid var(--warning);">
            <p class="text-sm" style="line-height:1.6;color:var(--warning);">
              ⚠ 尚无住宅，无法招聘员工。<br>
              请先在【实业 → 地产 → 住宅】购入住宅（每套可容纳 10 名员工）。
            </p>
          </div>
        ` : ''}

        <div class="section-title">招聘</div>
        <div class="card-grid">
          <button class="card" onclick="Staff.recruitWithPicker('free')" ${count >= cap ? 'disabled style="opacity:0.4;"' : ''}>
            <div class="card-title">免费招聘</div>
            <div class="card-sub">加成 1.6 ~ 6.0（4档各25%）</div>
            <div class="card-value" style="font-size:11px;color:var(--text-secondary);">日薪 = 加成 × ¥100</div>
          </button>
          <button class="card" onclick="Staff.recruitWithPicker('paid')" ${count >= cap || s.cash < 2000 ? 'disabled style="opacity:0.4;"' : ''}>
            <div class="card-title">付费招聘</div>
            <div class="card-sub">¥2,000/人</div>
            <div class="card-value" style="font-size:11px;color:var(--up);">加成 4.0 ~ 6.0</div>
          </button>
        </div>

        <!-- 奖金激励 -->
        ${Staff._bonusSectionHtml(s.cash)}

        <div class="section-title">未分配员工（${unassigned}）</div>
        ${unassigned === 0 ? '<div class="empty">没有未分配的员工</div>' :
          (s.employees || []).filter(e => !e.assign).sort((a, b) => b.multiplier - a.multiplier).slice(0, 10).map(emp => {
            const m = emp.morale || 100;
            const mc = m >= 60 ? 'var(--up)' : (m >= 30 ? 'var(--warning)' : 'var(--down)');
            const warn = m < 30 ? ' ⚠' : '';
            return `
            <div class="list-item">
              <div class="list-row">
                <div>
                  <span class="font-medium">${emp.name}</span>
                  <span class="text-sm text-muted" style="margin-left:6px;">加成 ×${emp.multiplier}</span>
                </div>
                <span class="text-sm" style="color:${mc};">士气 ${m}${warn}</span>
              </div>
              <div class="list-row" style="margin-top:2px;">
                <span class="text-sm text-muted">日薪 ¥${Math.round(emp.multiplier * 120)}</span>
                <button class="btn primary sm" style="font-size:11px;min-width:0;padding:2px 8px;" onclick="Staff.showAssignPicker('${emp.id}')">分配</button>
              </div>
            </div>
          `;}).join('')
        }

        ${Staff._collapsibleSection('assigned', '已分配员工', Staff._collapse.assigned, Staff._assignedSummary(), this.assignedList())}
        ${Staff._collapsibleSection('overview', '产业分配概览', Staff._collapse.overview, Staff._overviewSummary(), this.assignmentOverview())}

        <div style="height:20px;"></div>
        ${UI.bottombar()}
      </div>
    `;
  },

  assignedList() {
    const assigned = (State.data.employees || []).filter(e => e.assign);
    if (assigned.length === 0) return '<div class="empty">尚无已分配员工</div>';
    const groups = {};
    assigned.forEach(e => {
      const key = e.assign.type + '|' + e.assign.category;
      if (!groups[key]) groups[key] = { type: e.assign.type, category: e.assign.category, employees: [] };
      groups[key].employees.push(e);
    });
    return Object.values(groups).map(grp => {
      const ind = DATA.industries[grp.type];
      const cat = State.findIndustryCategory(grp.type, grp.category);
      const totalMult = grp.employees.reduce((s, e) => s + e.multiplier, 0);
      return `
        <div class="list-item" style="margin-bottom:8px;">
          <div class="font-medium" style="margin-bottom:4px;">${ind ? ind.icon : ''} ${cat ? cat.name : ''} ×${grp.employees.length}人 · 加成 ×${totalMult.toFixed(1)}</div>
          ${grp.employees.sort((a, b) => b.multiplier - a.multiplier).map(e => {
            const m = e.morale || 100;
            const mc = m >= 60 ? 'var(--up)' : (m >= 30 ? 'var(--warning)' : 'var(--down)');
            const warn = m < 30 ? ' ⚠' : '';
            return `
            <div class="list-row" style="padding:4px 0;">
              <div>
                <span class="text-sm">${e.name}</span>
                <span class="text-sm text-muted" style="margin-left:4px;">×${e.multiplier}</span>
                <span class="text-sm" style="margin-left:4px;color:${mc};">${m}${warn}</span>
              </div>
              <div style="display:flex;gap:4px;">
                <button class="btn sm" style="font-size:11px;min-width:0;padding:2px 6px;" onclick="Employees.unassign('${e.id}')">撤回</button>
                <button class="btn sm danger" style="font-size:11px;min-width:0;padding:2px 6px;" onclick="Employees.fire('${e.id}')">解雇</button>
              </div>
            </div>
          `;}).join('')}
        </div>
      `;
    }).join('');
  },

  assignmentOverview() {
    let html = '';
    Object.entries(DATA.industries).forEach(([type, ind]) => {
      const owned = State.data.industries.filter(i => i.type === type);
      if (owned.length === 0) return;
      owned.forEach(o => {
        const cat = State.findIndustryCategory(type, o.category);
        if (!cat) return;
        const empCnt = Employees.assignedCount(type, o.category);
        const mult = Employees.multiplier(type, o.category);
        html += `
          <div class="list-item" id="ov_${type}_${o.category}">
            <div class="list-row">
              <div>
                <div class="font-medium">${ind.icon} ${cat.name} ×${o.quantity||1}</div>
                <div class="text-sm ${empCnt > 0 ? 'text-muted' : ''}" style="${empCnt > 0 ? '' : 'color:var(--down);'}">
                  ${empCnt > 0 ? empCnt + '人 · 加成 ×' + mult.toFixed(1) : '⚠ 无员工 · 无产出'}
                </div>
              </div>
              <div style="display:flex;gap:4px;align-items:center;">
                <button class="btn" style="font-size:12px;" onclick="Staff.showAssignPickerByIndustry('${type}', '${o.category}')">
                  ${empCnt > 0 ? '调整' : '派人'}
                </button>
                <button class="btn sm" style="min-width:28px;padding:1px 4px;font-size:12px;" onclick="Staff._quickAdjust('${type}', '${o.category}', 1)" title="+1">+1</button>
                <button class="btn sm" style="min-width:28px;padding:1px 4px;font-size:12px;${empCnt <= 0 ? 'opacity:0.4;' : ''}" onclick="Staff._quickAdjust('${type}', '${o.category}', -1)" title="-1" ${empCnt <= 0 ? 'disabled' : ''}>-1</button>
                ${empCnt > 0 ? '<button class="btn sm" style="font-size:11px;min-width:0;padding:2px 6px;color:var(--down);border-color:var(--down);" onclick="Staff._unassignAll(\'' + type + '\', \'' + o.category + '\')" title="全部撤回">全撤</button>' : ''}
              </div>
            </div>
          </div>
        `;
      });
    });
    return html || '<div class="empty">尚无任何产业</div>';
  }
};

export const Staff = {
  _collapse: { assigned: false, overview: false },

  toggleCollapse(id) {
    this._collapse[id] = !this._collapse[id];
    const el = document.getElementById('collapse-' + id);
    if (el) el.classList.toggle('open', this._collapse[id]);
  },

  _collapsibleSection(id, title, isOpen, summary, bodyHtml) {
    return '<div class="collapsible ' + (isOpen ? 'open' : '') + '" id="collapse-' + id + '">' +
      '<div class="collapsible-header" onclick="Staff.toggleCollapse(\'' + id + '\')">' +
      '<div class="section-title" style="margin:0;">' + title + '</div>' +
      '<span style="display:flex;align-items:center;gap:6px;">' +
      (summary ? '<span class="collapsible-summary">' + summary + '</span>' : '') +
      '<span class="collapsible-chevron">▶</span></span></div>' +
      '<div class="collapsible-body">' + bodyHtml + '</div></div>';
  },

  _assignedSummary() {
    const n = (State.data.employees || []).filter(e => e.assign).length;
    return n > 0 ? n + '人' : '';
  },

  _overviewSummary() {
    const industries = State.data.industries || [];
    if (industries.length === 0) return '';
    let withEmp = 0, withoutEmp = 0;
    industries.forEach(ind => {
      if (Employees.assignedCount(ind.type, ind.category) > 0) withEmp++; else withoutEmp++;
    });
    const parts = [];
    if (withEmp > 0) parts.push(withEmp + '有员');
    if (withoutEmp > 0) parts.push(withoutEmp + '缺员');
    return parts.join('·');
  },

  _bonusSectionHtml(cash) {
    const count = (State.data.employees || []).length;
    if (count === 0) return '';
    const smallCost = Employees.getBonusCost('small');
    const medCost = Employees.getBonusCost('medium');
    const largeCost = Employees.getBonusCost('large');
    return `
      <div class="section-title">奖金激励</div>
      <div class="card-grid" style="grid-template-columns:repeat(3,1fr);">
        <button class="card" onclick="Employees.giveBonus('small')" style="${cash < smallCost ? 'opacity:0.4;' : ''}" ${cash < smallCost ? 'disabled' : ''}>
          <div class="card-title" style="font-size:12px;">小额激励</div>
          <div class="card-sub" style="font-size:11px;">士气 +5</div>
          <div class="card-value" style="font-size:11px;">${State.formatMoney(smallCost)}</div>
        </button>
        <button class="card" onclick="Employees.giveBonus('medium')" style="${cash < medCost ? 'opacity:0.4;' : ''}" ${cash < medCost ? 'disabled' : ''}>
          <div class="card-title" style="font-size:12px;">发奖金</div>
          <div class="card-sub" style="font-size:11px;">士气 +20</div>
          <div class="card-value" style="font-size:11px;">${State.formatMoney(medCost)}</div>
        </button>
        <button class="card" onclick="Employees.giveBonus('large')" style="${cash < largeCost ? 'opacity:0.4;' : ''}" ${cash < largeCost ? 'disabled' : ''}>
          <div class="card-title" style="font-size:12px;">大额分红</div>
          <div class="card-sub" style="font-size:11px;">士气 +50</div>
          <div class="card-value" style="font-size:11px;">${State.formatMoney(largeCost)}</div>
        </button>
      </div>`;
  },

  currentAssignTab: 'quick',
  currentAssignedInd: null,

  showAssignPicker(empId) {
    const emp = (State.data.employees || []).find(e => e.id === empId);
    if (!emp) return;
    let options = '';
    State.data.industries.forEach(ind => {
      const cat = State.findIndustryCategory(ind.type, ind.category);
      if (!cat) return;
      const indData = DATA.industries[ind.type];
      const cur = Employees.assignedCount(ind.type, ind.category);
      options += '<button class="card full" style="margin-bottom:8px;" onclick="Employees.assign(\'' + empId + '\', \'' + ind.type + '\', \'' + ind.category + '\')">' +
        '<div class="card-title">' + indData.icon + ' ' + cat.name + ' ×' + (ind.quantity||1) + '</div>' +
        '<div class="card-sub">当前 ' + cur + ' 人 · 点击分配</div></button>';
    });
    UI.modal('分配 ' + emp.name + '（×' + emp.multiplier + '）', options || '<div class="empty">尚无产业</div>', [
      { label: '关闭', onclick: 'UI.closeModal()' }
    ]);
  },


  // 当前弹窗跟踪
  _currentModal: null,

  // 构建弹窗 HTML 内容
  _buildEmpModalHtml(type, category) {
    const unassigned = (State.data.employees || []).filter(e => !e.assign).sort((a, b) => b.multiplier - a.multiplier);
    const current = Employees.getAssigned(type, category);
    const totalMult = Employees.multiplier(type, category);
    let h = '';

    // ===== Sticky header：当前员工统计 + 操作按钮 =====
    h += '<div style="position:sticky;top:0;background:var(--bg-card);z-index:2;padding-bottom:4px;">';
    if (current.length > 0) {
      h += '<div class="text-sm text-muted" style="margin-bottom:6px;">当前员工：' + current.length + '人 · 加成 ×' + totalMult.toFixed(1) + '</div>';
      h += '<div style="display:flex;gap:6px;margin-bottom:6px;">';
      h += '<button class="btn sm" style="font-size:11px;min-width:0;padding:2px 8px;color:var(--down);border-color:var(--down);flex:1;" onclick="Staff._unassignAll(\x27' + type + '\x27,\x27' + category + '\x27);Staff._refreshEmpModal()">全撤</button>';
      if (unassigned.length > 0) {
        h += '<button class="btn sm primary" style="font-size:11px;min-width:0;padding:2px 8px;flex:1;" onclick="Staff._bulkAssign(\x27' + type + '\x27, \x27' + category + '\x27, ' + unassigned.length + ')">📥 批量调入（' + unassigned.length + '人）</button>';
      }
      h += '</div>';
      h += '<div style="margin-bottom:6px;border-top:0.5px solid var(--border);"></div>';
    } else {
      h += '<div class="text-sm text-muted" style="margin-bottom:6px;">暂无员工</div>';
      if (unassigned.length > 0) {
        h += '<div style="margin-bottom:6px;"><button class="btn primary full" onclick="Staff._bulkAssign(\x27' + type + '\x27, \x27' + category + '\x27, ' + unassigned.length + ')">📥 批量调入（共 ' + unassigned.length + ' 人可用）</button></div>';
        h += '<div style="margin-bottom:6px;border-top:0.5px solid var(--border);"></div>';
      }
    }
    h += '</div>';

    // ===== 当前员工列表（可滚动，最多显示5个后滚动） =====
    if (current.length > 0) {
      current.sort((a, b) => b.multiplier - a.multiplier);
      // 前5个直接显示，后面的在可滚动区域里
      var visibleCount = Math.min(5, current.length);
      for (var i = 0; i < visibleCount; i++) {
        var e = current[i];
        var em = e.morale || 100;
        var ec = em >= 60 ? 'color:var(--up);' : (em >= 30 ? 'color:var(--warning);' : 'color:var(--down);');
        var ew = em < 30 ? ' ⚠' : '';
        h += '<div class="list-row" style="padding:4px 0;"><span class="text-sm">' + e.name + ' ×' + e.multiplier + '</span>' +
          '<span class="text-sm" style="margin-left:4px;' + ec + '">' + em + ew + '</span>' +
          '<button class="btn sm" style="font-size:11px;min-width:0;padding:2px 6px;" onclick="Employees.unassign(\x27' + e.id + '\x27, true);Staff._refreshEmpModal()">撤回</button></div>';
      }
      if (current.length > 5) {
        h += '<div style="max-height:120px;overflow-y:auto;border-top:0.5px solid var(--border);margin-top:4px;padding-top:2px;">';
        for (var i = 5; i < current.length; i++) {
          var e = current[i];
          var em = e.morale || 100;
          var ec = em >= 60 ? 'color:var(--up);' : (em >= 30 ? 'color:var(--warning);' : 'color:var(--down);');
          var ew = em < 30 ? ' ⚠' : '';
          h += '<div class="list-row" style="padding:3px 0;"><span class="text-sm">' + e.name + ' ×' + e.multiplier + '</span>' +
            '<span class="text-sm" style="margin-left:4px;' + ec + '">' + em + ew + '</span>' +
            '<button class="btn sm" style="font-size:11px;min-width:0;padding:2px 6px;" onclick="Employees.unassign(\x27' + e.id + '\x27, true);Staff._refreshEmpModal()">撤回</button></div>';
        }
        h += '</div>';
      }
    } else if (unassigned.length === 0) {
      h += '<div class="empty">暂无员工 · 请先招聘</div>';
    }
    if (unassigned.length > 0) {
      h += '<div class="text-sm text-muted" style="margin:6px 0;">或单个调入（按加成降序）：</div>';
      h += '<div style="max-height:180px;overflow-y:auto;">';
      unassigned.forEach(function(e) {
        var em = e.morale || 100;
        var ec = em >= 60 ? 'color:var(--up);' : (em >= 30 ? 'color:var(--warning);' : 'color:var(--down);');
        var ew = em < 30 ? ' ⚠' : '';
        h += '<div class="list-row" style="padding:4px 0;"><span class="text-sm">' + e.name + ' ×' + e.multiplier + ' · ¥' + Math.round(e.multiplier*100) + '/日</span>' +
          '<span class="text-sm" style="margin-left:4px;' + ec + '">' + em + ew + '</span>' +
          '<button class="btn sm primary" style="font-size:11px;min-width:0;padding:2px 6px;" onclick="Employees.assign(\x27' + e.id + '\x27,\x27' + type + '\x27,\x27' + category + '\x27, true);Staff._refreshEmpModal()">调入</button></div>';
      });
      h += '</div>';
    }
    return h;
  },

  // 原地刷新弹窗内容
  _refreshEmpModal() {
    const { type, category } = this._currentModal || {};
    if (!type || !category) return;
    const body = document.querySelector('.modal-body');
    if (!body) return;
    body.innerHTML = this._buildEmpModalHtml(type, category);
  },

  // 弹窗关闭后刷新背景页面
  _onEmpModalClose() {
    const { type, category } = this._currentModal || {};
    document.querySelectorAll('.modal-mask').forEach(m => m.remove());
    TimeManager.autoResume();
    if (!type || !category) return;
    if (typeof Router !== 'undefined' && Router.current === 'industryDetail') {
      Pages.industryDetail._refreshCapacity(type);
    } else if (typeof Router !== 'undefined' && Router.current === 'staff') {
      this._refreshSingleCard(type, category);
      this._refreshTopStats();
      this._refreshAssignedSection();
    }
    this._currentModal = null;
  },

  // 刷新「已分配员工」折叠区域
  _refreshAssignedSection() {
    const el = document.getElementById('collapse-assigned');
    if (!el) return;
    const scrollY = window.scrollY;
    const summary = el.querySelector('.collapsible-summary');
    if (summary) summary.textContent = this._assignedSummary() || '';
    const body = el.querySelector('.collapsible-body');
    if (body) body.innerHTML = this.assignedList();
    window.scrollTo(0, scrollY);
  },

  // 打开弹窗（或已有弹窗时原地刷新）
  showAssignPickerByIndustry(type, category) {
    const cat = State.findIndustryCategory(type, category);
    if (!cat) return;
    const ind = DATA.industries[type];
    this._currentModal = { type, category };

    const existing = document.querySelector('.modal-mask');
    if (existing) {
      const body = existing.querySelector('.modal-body');
      if (body) body.innerHTML = this._buildEmpModalHtml(type, category);
      const title = existing.querySelector('h2');
      if (title) title.textContent = ind.icon + ' ' + cat.name + ' \u00b7 \u5458\u5de5\u7ba1\u7406';
      return;
    }

    const mask = UI.modal(ind.icon + ' ' + cat.name + ' \u00b7 \u5458\u5de5\u7ba1\u7406', this._buildEmpModalHtml(type, category), [
      { label: '\u5173\u95ed', onclick: 'Staff._onEmpModalClose()' }
    ]);
    mask.onclick = function(e) { if (e.target === mask) Staff._onEmpModalClose(); };
  },

  _bulkAssign(type, category, maxQty) {
    UI.numberPicker({
      title: '批量调入',
      unit: 1,
      unitName: '人',
      unitLabel: '共 ' + maxQty + ' 人可分配 · 按加成高到低调入',
      max: maxQty,
      onConfirm: (qty) => {
        if (qty <= 0) { UI.toast('请选择数量'); return; }
        const unassigned = (State.data.employees || []).filter(e => !e.assign).sort((a, b) => b.multiplier - a.multiplier);
        const toAssign = unassigned.slice(0, qty);
        toAssign.forEach(e => { e.assign = { type, category }; });
        State.save();
        UI.toast('已调入 ' + toAssign.length + ' 人');
        Staff._refreshEmpModal();
        Staff._refreshTopStats();
        Staff._refreshSingleCard(type, category);
      }
    });
  },

  switchAssignTab(tabName) {
    this.currentAssignTab = tabName;
    const { type, category } = this.currentAssignedInd || {};
    if (!type || !category) return;

    const modal = document.querySelector('.modal-mask');
    if (modal) {
      const tabs = modal.querySelectorAll('.tab');
      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
      });
    }

    const contentDiv = document.getElementById('assign-tab-content');
    if (!contentDiv) return;

    let html = '';
    switch (tabName) {
      case 'current': html = this._renderCurrentTab(type, category); break;
      case 'unassigned': html = this._renderUnassignedTab(type, category); break;
      case 'transfer': html = this._renderTransferTab(type, category); break;
      case 'quick': html = this._renderQuickTab(type, category); break;
    }
    contentDiv.innerHTML = html;
  },

  _renderCurrentTab(type, category) {
    const current = Employees.getAssigned(type, category);
    const total = Employees.assignedCount(type, category);
    if (current.length === 0) {
      return '<div class="empty">尚无员工，无产出</div>' +
        '<div class="list-item" style="margin-top:12px;background:var(--bg-soft);padding:12px;">' +
        '<p class="text-sm text-muted" style="line-height:1.6;margin-bottom:8px;">⚡ <strong>快速开始</strong>：点击上方<strong>快速分配</strong>选项卡可一键分配员工。</p></div>';
    }
    let html = '<div class="text-sm text-muted" style="margin:0 0 8px;">当前员工（' + total + '人）</div>';
    current.forEach(e => {
      var em = e.morale || 100;
      var ec = em >= 60 ? 'color:var(--up);' : (em >= 30 ? 'color:var(--warning);' : 'color:var(--down);');
      var ew = em < 30 ? ' ⚠' : '';
      html += '<div class="list-item" style="padding:10px 12px;"><div class="list-row"><div>' +
        '<span class="font-medium">' + e.name + '</span>' +
        '<span class="text-sm text-muted" style="margin-left:6px;">加成 ×' + e.multiplier + '</span>' +
        '<span class="text-sm" style="margin-left:4px;' + ec + '">' + em + ew + '</span></div>' +
        '<button class="btn sm" onclick="Employees.unassign(\'' + e.id + '\');Staff.switchAssignTab(\'current\')">撤回</button></div></div>';
    });
    html += '<div class="mt-12"><button class="btn full danger" onclick="Staff._unassignAll(\'' + type + '\', \'' + category + '\')">❌ 撤回所有员工</button></div>';
    return html;
  },

  _renderUnassignedTab(type, category) {
    const unassigned = (State.data.employees || []).filter(e => !e.assign);
    if (unassigned.length === 0) {
      return '<div class="empty">无可分配员工</div>';
    }
    let html = '<div class="text-sm text-muted" style="margin:0 0 8px;">可分配员工（' + unassigned.length + '人）</div>';
    unassigned.sort((a, b) => b.multiplier - a.multiplier).forEach(e => {
      var em = e.morale || 100;
      var ec = em >= 60 ? 'color:var(--up);' : (em >= 30 ? 'color:var(--warning);' : 'color:var(--down);');
      var ew = em < 30 ? ' ⚠' : '';
      html += '<div class="list-item" style="padding:10px 12px;"><div class="list-row"><div>' +
        '<span class="font-medium">' + e.name + '</span>' +
        '<span class="text-sm text-muted" style="margin-left:4px;">加成 ×' + e.multiplier + '</span>' +
        '<span class="text-sm" style="margin-left:4px;' + ec + '">' + em + ew + '</span></div>' +
        '<button class="btn sm primary" onclick="Employees.assign(\'' + e.id + '\',\'' + type + '\',\'' + category + '\');Staff.switchAssignTab(\'current\')">调入</button></div></div>';
    });
    return html;
  },

  _renderTransferTab(type, category) {
    const otherAssigned = (State.data.employees || []).filter(e =>
      e.assign && e.assign.type === type && e.assign.category !== category
    );
    if (otherAssigned.length === 0) {
      return '<div class="empty">无可调拨员工</div>';
    }
    let html = '<div class="text-sm text-muted" style="margin:0 0 8px;">可调拨员工（' + otherAssigned.length + '人）</div>';
    otherAssigned.sort((a, b) => b.multiplier - a.multiplier).forEach(e => {
      var tm = e.morale || 100;
      var tc = tm >= 60 ? 'color:var(--up);' : (tm >= 30 ? 'color:var(--warning);' : 'color:var(--down);');
      var tw = tm < 30 ? ' ⚠' : '';
      const fromCat = State.findIndustryCategory(type, e.assign.category);
      html += '<div class="list-item" style="padding:10px 12px;"><div class="list-row"><div>' +
        '<span class="font-medium">' + e.name + '</span>' +
        '<span class="text-sm text-muted" style="margin-left:4px;">×' + e.multiplier + '</span>' +
        '<span class="text-sm" style="margin-left:4px;' + tc + '">' + tm + tw + '</span>' +
        '<span class="text-sm text-muted" style="margin-left:4px;">来自 ' + (fromCat ? fromCat.name : '') + '</span></div>' +
        '<button class="btn sm" onclick="Employees.transfer(\'' + e.id + '\',\'' + type + '\',\'' + category + '\');Staff.switchAssignTab(\'current\')">调拨</button></div></div>';
    });
    return html;
  },

  _renderQuickTab(type, category) {
    const unassigned = (State.data.employees || []).filter(e => !e.assign);
    if (unassigned.length === 0) {
      return '<div class="empty">暂无可分配员工</div>';
    }
    unassigned.sort((a, b) => b.multiplier - a.multiplier);
    let html = '<div class="text-sm text-muted" style="margin:0 0 8px;">快速分配（' + unassigned.length + '人可用）</div>';
    html += '<button class="btn primary full" style="margin-bottom:8px;" onclick="Staff._assignAllUnassigned(\'' + type + '\',\'' + category + '\')">一键全部调入</button>';
    unassigned.forEach(e => {
      var qm = e.morale || 100;
      var qc = qm >= 60 ? 'color:var(--up);' : (qm >= 30 ? 'color:var(--warning);' : 'color:var(--down);');
      var qw = qm < 30 ? ' ⚠' : '';
      html += '<div class="list-item" style="padding:10px 12px;"><div class="list-row"><div>' +
        '<span class="font-medium">' + e.name + '</span>' +
        '<span class="text-sm text-muted" style="margin-left:4px;">加成 ×' + e.multiplier + '</span>' +
        '<span class="text-sm" style="margin-left:4px;' + qc + '">' + qm + qw + '</span>' +
        '<span class="text-sm text-muted" style="margin-left:4px;">日薪 ¥' + Math.round(e.multiplier * 120) + '</span></div>' +
        '<button class="btn sm primary" onclick="Employees.assign(\'' + e.id + '\',\'' + type + '\',\'' + category + '\');Staff.switchAssignTab(\'current\')">调入</button></div></div>';
    });
    return html;
  },

  _calculateRecommended(type, category) {
    const owned = State.data.industries.find(i => i.type === type && i.category === category);
    const qty = owned ? (owned.quantity || 1) : 1;
    const unassigned = (State.data.employees || []).filter(e => !e.assign);
    const target = Math.min(qty * 2, unassigned.length);
    return { total: target };
  },

  _unassignAll(type, category) {
    const assigned = Employees.getAssigned(type, category);
    if (assigned.length === 0) { UI.toast('该产业无员工'); return; }
    const cat = State.findIndustryCategory(type, category);
    UI.confirm('全部撤回', '确认撤回 ' + (cat ? cat.name : '') + ' 全部 ' + assigned.length + ' 名员工？', () => {
      assigned.forEach(e => { e.assign = null; });
      State.save();
      UI.toast('已撤回 ' + assigned.length + ' 人');
      Staff._refreshSingleCard(type, category);
      Staff._refreshTopStats();
      Staff._refreshEmpModal();
    });
  },

  _refreshTopStats() {
    const count = Employees.count();
    const cap = Employees.capacity();
    const unassigned = Employees.unassignedCount();
    const salary = Employees.totalSalary();
    const avgMorale = Math.round(Employees.averageMorale());
    const lowCount = Employees.lowMoraleCount();
    const moraleColor = avgMorale >= 60 ? 'var(--up)' : (avgMorale >= 30 ? 'var(--warning)' : 'var(--down)');
    const el1 = document.getElementById('staff-stat-count');
    const el2 = document.getElementById('staff-stat-unassigned');
    const el3 = document.getElementById('staff-stat-salary');
    const el4 = document.getElementById('staff-stat-morale');
    if (el1) el1.textContent = count + ' / ' + cap;
    if (el2) el2.textContent = unassigned;
    if (el3) el3.textContent = '-' + State.formatMoney(salary);
    if (el4) { el4.textContent = avgMorale; el4.style.color = moraleColor; }
  },

  _refreshSingleCard(type, category) {
    const el = document.getElementById('ov_' + type + '_' + category);
    if (!el) { Router.refresh(); return; }
    var scrollY = window.scrollY;
    const ind = DATA.industries[type];
    const cat = State.findIndustryCategory(type, category);
    if (!cat) return;
    const o = (State.data.industries || []).find(i => i.type === type && i.category === category);
    const empCnt = Employees.assignedCount(type, category);
    const mult = Employees.multiplier(type, category);
    const qty = o ? (o.quantity || 1) : 1;
    el.outerHTML = '<div class="list-item" id="ov_' + type + '_' + category + '">' +
      '<div class="list-row"><div>' +
      '<div class="font-medium">' + ind.icon + ' ' + cat.name + ' ×' + qty + '</div>' +
      '<div class="text-sm ' + (empCnt > 0 ? 'text-muted' : '') + '" style="' + (empCnt > 0 ? '' : 'color:var(--down);') + '">' +
      (empCnt > 0 ? empCnt + '人 · 加成 ×' + mult.toFixed(1) : '⚠ 无员工 · 无产出') +
      '</div></div>' +
      '<div style="display:flex;gap:4px;align-items:center;">' +
      '<button class="btn" style="font-size:12px;" onclick="Staff.showAssignPickerByIndustry(\'' + type + '\', \'' + category + '\')">' +
      (empCnt > 0 ? '调整' : '派人') + '</button>' +
      '<button class="btn sm" style="min-width:28px;padding:1px 4px;font-size:12px;" onclick="Staff._quickAdjust(\'' + type + '\', \'' + category + '\', 1)" title="+1">+1</button>' +
      '<button class="btn sm" style="min-width:28px;padding:1px 4px;font-size:12px;' + (empCnt <= 0 ? 'opacity:0.4;' : '') + '" onclick="Staff._quickAdjust(\'' + type + '\', \'' + category + '\', -1)" title="-1"' + (empCnt <= 0 ? ' disabled' : '') + '>-1</button>' +
      (empCnt > 0 ? '<button class="btn sm" style="font-size:11px;min-width:0;padding:2px 6px;color:var(--down);border-color:var(--down);" onclick="Staff._unassignAll(\'' + type + '\', \'' + category + '\')" title="全部撤回">全撤</button>' : '') +
      '</div></div></div>';
    this._refreshTopStats();
    window.scrollTo(0, scrollY);
  },

  _quickAdjust(type, category, delta) {
    if (delta > 0) {
      const best = Employees.getBestUnassigned();
      if (!best) { UI.toast('无可分配员工'); return; }
      Employees.assign(best.id, type, category, true);
    } else {
      const worst = Employees.getWorstAssigned(type, category);
      if (!worst) { UI.toast('无可撤回员工'); return; }
      Employees.unassign(worst.id, true);
    }
    this._refreshSingleCard(type, category);
  },

  _assignAllUnassigned(type, category) {
    const unassigned = (State.data.employees || []).filter(e => !e.assign);
    if (unassigned.length === 0) { UI.toast('无可分配员工'); return; }
    unassigned.forEach(e => { e.assign = { type, category }; });
    State.save();
    UI.toast('已调入 ' + unassigned.length + ' 人');
    Staff.switchAssignTab('current');
    Staff._refreshSingleCard(type, category);
  },

  _quickAssignLevel(type, category, level, count) {
    const unassigned = (State.data.employees || []).filter(e => !e.assign)
      .sort((a, b) => b.multiplier - a.multiplier);
    const toAssign = unassigned.slice(0, count);
    toAssign.forEach(e => { e.assign = { type, category }; });
    State.save();
    UI.toast('已调入 ' + toAssign.length + ' 人');
    Staff.switchAssignTab('current');
    Staff._refreshSingleCard(type, category);
  },

  _assignRecommended(type, category) {
    const rec = this._calculateRecommended(type, category);
    if (rec.total === 0) { UI.toast('暂无推荐员工'); return; }
    const unassigned = (State.data.employees || []).filter(e => !e.assign)
      .sort((a, b) => b.multiplier - a.multiplier);
    const toAssign = unassigned.slice(0, rec.total);
    toAssign.forEach(e => { e.assign = { type, category }; });
    State.save();
    UI.toast('已按推荐分配 ' + toAssign.length + ' 人');
    Staff.switchAssignTab('current');
    Staff._refreshSingleCard(type, category);
  },

  recruitWithPicker(mode) {
    const cap = Employees.capacity();
    const cnt = Employees.count();
    const maxAvailable = cap - cnt;
    if (maxAvailable <= 0) { UI.toast('宿舍已满'); return; }
    const cfg = DATA.recruit[mode];
    const costPer = cfg.cost;
    const modeLabel = mode === 'free' ? '免费招聘' : '付费招聘';
    UI.numberPicker({
      title: modeLabel,
      unit: costPer,
      unitName: '人',
      unitLabel: costPer > 0 ? '¥' + costPer.toLocaleString('zh-CN') + '/人 · 最多 ' + maxAvailable + ' 人' : '免费 · 最多 ' + maxAvailable + ' 人',
      max: maxAvailable,
      onConfirm: (qty) => {
        if (qty <= 0) { UI.toast('请选择数量'); return; }
        Employees.recruit(mode, qty);
      }
    });
  },

  showQtyPicker(empId, type, category) {
    const emp = (State.data.employees || []).find(e => e.id === empId);
    if (!emp) return;
    UI.confirm('分配', '确认将 ' + emp.name + '（加成 ×' + emp.multiplier + '）分配到该产业？', () => {
      Employees.assign(empId, type, category);
    });
  },

  showTransferPicker(empId, toType, toCategory) {
    const emp = (State.data.employees || []).find(e => e.id === empId);
    if (!emp) return;
    const toCat = State.findIndustryCategory(toType, toCategory);
    UI.confirm('调拨', '确认将 ' + emp.name + ' 调拨至 ' + (toCat ? toCat.name : '') + '？', () => {
      Employees.transfer(empId, toType, toCategory);
      Staff.switchAssignTab('current');
    });
  },

  showUnassignPicker(empId) {
    const emp = (State.data.employees || []).find(e => e.id === empId);
    if (!emp) return;
    UI.confirm('撤回', '确认撤回 ' + emp.name + '（加成 ×' + emp.multiplier + '）？', () => {
      Employees.unassign(empId);
      Staff.switchAssignTab('current');
    });
  }
};

Staff.recruitWithPicker = Staff.recruitWithPicker;
window.Pages = window.Pages || {};
window.Pages.staff = Pages.staff;
window.Staff = Staff;
