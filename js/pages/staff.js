/* staff.js — 员工管理页：按类分组显示、批量招聘、分配（选项卡版） */

Pages.staff = {
  render(app) {
    const s = State.data;
    const cap = Employees.capacity();
    const count = Employees.count();
    const unassigned = Employees.unassignedCount();
    const salary = Employees.totalSalary();
    const unassignedByLvl = Employees.unassignedByLevel();

    app.innerHTML = `
      <div class="page">
        ${UI.navbar('员工管理')}
        <div class="topbar">
          <div class="topbar-stats">
            <div class="stat-item">
              <div class="label">员工总数</div>
              <div class="value">${count} / ${cap}</div>
            </div>
            <div class="stat-item">
              <div class="label">未分配</div>
              <div class="value">${unassigned}</div>
            </div>
            <div class="stat-item">
              <div class="label">日薪支出</div>
              <div class="value down">-${State.formatMoney(salary)}</div>
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

        <div class="section-title">招聘（可选数量）</div>
        <div class="card-grid">
          <button class="card" onclick="Staff.recruitWithPicker('free')" ${count >= cap ? 'disabled style="opacity:0.4;"' : ''}>
            <div class="card-title">免费招聘</div>
            <div class="card-sub">人均免费</div>
            <div class="card-value" style="font-size:11px;color:var(--text-secondary);">
              初级 72% · 中级 20%<br>高级 6% · 专家 2%
            </div>
          </button>
          <button class="card" onclick="Staff.recruitWithPicker('paid')" ${count >= cap || s.cash < Math.ceil(DATA.recruit.paid.cost/DATA.recruit.batchCount) ? 'disabled style="opacity:0.4;"' : ''}>
            <div class="card-title">付费招聘</div>
            <div class="card-sub">人均 ¥600</div>
            <div class="card-value" style="font-size:11px;color:var(--text-secondary);">
              初级 25% · 中级 45%<br>高级 22% · 专家 8%
            </div>
          </button>
          <button class="card" onclick="Staff.recruitWithPicker('expert')" ${count >= cap || s.cash < Math.ceil(DATA.recruit.expert.cost/DATA.recruit.batchCount) ? 'disabled style="opacity:0.4;"' : ''}>
            <div class="card-title" style="color:var(--up);">猎头招聘</div>
            <div class="card-sub">¥${Math.ceil(DATA.recruit.expert.cost/DATA.recruit.batchCount).toLocaleString('zh-CN') + '/人'}</div>
            <div class="card-value" style="font-size:11px;color:var(--up);">
              必出专家
            </div>
          </button>
        </div>

        <div class="section-title">员工等级</div>
        <div class="list-item">
          ${Object.entries(DATA.employeeLevels).map(([k, v]) => `
            <div class="list-row">
              <span class="list-label" style="color:${v.color};">● ${v.name}</span>
              <span class="list-value text-sm">产出 ×${v.multiplier} · 日薪 ¥${v.salary}/人</span>
            </div>
          `).join('')}
        </div>

        <div class="section-title">未分配员工（${unassigned}）</div>
        ${unassigned === 0 ? '<div class="empty">没有未分配的员工</div>' :
          unassignedByLvl.map((cnt, i) => {
            if (cnt === 0) return '';
            const lvl = DATA.employeeLevels['L' + (i+1)];
            const grp = (s.employees || []).find(g => !g.assign && g.level === i+1);
            if (!grp) return '';
            return `
              <div class="list-item">
                <div class="list-row">
                  <div>
                    <span class="font-medium" style="color:${lvl.color};">● ${lvl.name}</span>
                    <span class="text-sm text-muted" style="margin-left:6px;">×${cnt} 人 · 产出 ×${lvl.multiplier}/人</span>
                  </div>
                  <div style="text-align:right;">
                    <div class="text-sm text-muted">日薪 ¥${lvl.salary * cnt}</div>
                  </div>
                </div>
                <div class="mt-8">
                  <button class="btn primary sm full" onclick="Staff.showAssignPicker('${grp.id}')">分配到产业</button>
                </div>
              </div>
            `;
          }).join('')
        }

        ${Staff._collapsibleSection('assigned', '已分配员工', Staff._collapse.assigned, Staff._assignedSummary(), this.assignedList())}
        ${Staff._collapsibleSection('overview', '产业分配概览', Staff._collapse.overview, Staff._overviewSummary(), this.assignmentOverview())}

        <div style="height:20px;"></div>
        ${UI.bottombar()}
      </div>
    `;
  },

  assignedList() {
    const assigned = (State.data.employees || []).filter(g => g.assign);
    if (assigned.length === 0) return '<div class="empty">尚无已分配员工</div>';
    return assigned.map(g => {
      const lvl = DATA.employeeLevels['L' + g.level];
      const ind = DATA.industries[g.assign.type];
      const cat = State.findIndustryCategory(g.assign.type, g.assign.category);
      return `
        <div class="list-item">
          <div class="list-row">
            <div>
              <span class="font-medium" style="color:${lvl.color};">● ${lvl.name} ×${g.count}</span>
              <div class="text-sm text-muted">${ind ? ind.icon : ''} ${cat ? cat.name : ''} · 加成 ×${(lvl.multiplier * g.count).toFixed(1)}</div>
            </div>
            <div style="text-align:right;">
              <div class="text-sm text-muted">日薪 ¥${lvl.salary * g.count}</div>
            </div>
          </div>
          <div class="flex gap-8 mt-8">
            <button class="btn sm" style="flex:1;" onclick="Staff.showUnassignPicker('${g.id}')">撤回</button>
            <button class="btn sm" style="flex:1;color:var(--down);" onclick="Employees.fire('${g.id}')">解雇</button>
          </div>
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
          <div class="list-item">
            <div class="list-row">
              <div>
                <div class="font-medium">${ind.icon} ${cat.name} ×${o.quantity||1}</div>
                <div class="text-sm ${empCnt > 0 ? 'text-muted' : ''}" style="${empCnt > 0 ? '' : 'color:var(--down);'}">
                  ${empCnt > 0
                    ? empCnt + '人 · 加成 ×' + mult.toFixed(1)
                    : '⚠ 无员工 · 无产出'
                  }
                </div>
              </div>
              <button class="btn" style="font-size:12px;" onclick="Staff.showAssignPickerByIndustry('${type}', '${o.category}')">
                ${empCnt > 0 ? '调整' : '派人'}
              </button>
            </div>
          </div>
        `;
      });
    });
    return html || '<div class="empty">尚无任何产业</div>';
  }
};

const Staff = {
  // 可折叠面板状态
  _collapse: { assigned: false, overview: false },

  toggleCollapse(id) {
    this._collapse[id] = !this._collapse[id];
    const el = document.getElementById('collapse-' + id);
    if (el) el.classList.toggle('open', this._collapse[id]);
  },

  _collapsibleSection(id, title, isOpen, summary, bodyHtml) {
    return `<div class="collapsible ${isOpen ? 'open' : ''}" id="collapse-${id}">
        <div class="collapsible-header" onclick="Staff.toggleCollapse('${id}')">
          <div class="section-title" style="margin:0;">${title}</div>
          <span style="display:flex;align-items:center;gap:6px;">
            ${summary ? '<span class="collapsible-summary">' + summary + '</span>' : ''}
            <span class="collapsible-chevron">▶</span>
          </span>
        </div>
        <div class="collapsible-body">
          ${bodyHtml}
        </div>
      </div>`;
  },

  _assignedSummary() {
    const assigned = (State.data.employees || []).filter(g => g.assign);
    if (assigned.length === 0) return '';
    const total = assigned.reduce((s, g) => s + g.count, 0);
    return total + '人·' + assigned.length + '组';
  },

  _overviewSummary() {
    const industries = State.data.industries || [];
    if (industries.length === 0) return '';
    let withEmp = 0, withoutEmp = 0;
    industries.forEach(ind => {
      const cnt = Employees.assignedCount(ind.type, ind.category);
      if (cnt > 0) withEmp++; else withoutEmp++;
    });
    const parts = [];
    if (withEmp > 0) parts.push(withEmp + '有员');
    if (withoutEmp > 0) parts.push(withoutEmp + '缺员');
    return parts.join('·');
  },

  // 选项卡状态
  currentAssignTab: 'quick',
  currentAssignedInd: null,

  /* 模式 A：指定员工组，选产业 + 数量 */
  showAssignPicker(groupId) {
    const grp = (State.data.employees || []).find(g => g.id === groupId);
    if (!grp) return;
    const lvl = DATA.employeeLevels['L' + grp.level];

    let options = '';
    State.data.industries.forEach(ind => {
      const cat = State.findIndustryCategory(ind.type, ind.category);
      if (!cat) return;
      const indData = DATA.industries[ind.type];
      const cur = Employees.assignedCount(ind.type, ind.category);
      options += `
        <button class="card full" style="margin-bottom:8px;" onclick="Staff.showQtyPicker('${groupId}', '${ind.type}', '${ind.category}', ${grp.count})">
          <div class="card-title">${indData.icon} ${cat.name} ×${ind.quantity||1}</div>
          <div class="card-sub">当前 ${cur} 人 · 点击分配</div>
        </button>
      `;
    });

    UI.modal('分配 ' + lvl.name + '（' + grp.count + '人）', options || '<div class="empty">尚无产业</div>', [
      { label: '关闭', onclick: 'UI.closeModal()' }
    ]);
  },

  /* 模式 B：指定产业 → 选项卡式员工管理弹窗 */
  showAssignPickerByIndustry(type, category) {
    const cat = State.findIndustryCategory(type, category);
    if (!cat) return;
    const ind = DATA.industries[type];

    // 设置当前状态
    this.currentAssignTab = 'quick';
    this.currentAssignedInd = { type, category };

    // 选项卡界面
    const tabsHtml = `
      <div class="tab-container" style="margin-bottom:12px;">
        <div class="tab-bar">
          <div class="tab active" data-tab="quick" onclick="Staff.switchAssignTab('quick')">
            ⚡ 快速分配
          </div>
          <div class="tab" data-tab="unassigned" onclick="Staff.switchAssignTab('unassigned')">
            🆕 可分配
          </div>
          <div class="tab" data-tab="transfer" onclick="Staff.switchAssignTab('transfer')">
            🔄 可调拨
          </div>
          <div class="tab" data-tab="current" onclick="Staff.switchAssignTab('current')">
            📦 当前员工
          </div>
        </div>
      </div>
      <div id="assign-tab-content" style="max-height:50vh; overflow-y:auto; -webkit-overflow-scrolling:touch;">
        ${this._renderQuickTab(type, category)}
      </div>
    `;

    UI.modal(`${ind.icon} ${cat.name} · 员工管理`, tabsHtml, [
      { label: '关闭', onclick: 'UI.closeModal()' }
    ]);
  },

  /* 切换选项卡 */
  switchAssignTab(tabName) {
    this.currentAssignTab = tabName;
    const { type, category } = this.currentAssignedInd || {};
    if (!type || !category) return;

    // 更新选项卡样式
    document.querySelectorAll('#assign-tab-content').forEach(el => {
      const modal = el.closest('.modal-mask');
      if (modal) {
        const tabs = modal.querySelectorAll('.tab');
        tabs.forEach(tab => {
          const tabType = tab.getAttribute('data-tab');
          tab.classList.toggle('active', tabType === tabName);
        });
      }
    });

    // 更新内容
    const contentDiv = document.getElementById('assign-tab-content');
    if (!contentDiv) return;

    let html = '';
    switch (tabName) {
      case 'current':
        html = this._renderCurrentTab(type, category);
        break;
      case 'unassigned':
        html = this._renderUnassignedTab(type, category);
        break;
      case 'transfer':
        html = this._renderTransferTab(type, category);
        break;
      case 'quick':
        html = this._renderQuickTab(type, category);
        break;
    }

    contentDiv.innerHTML = html;
  },

  /* 当前员工选项卡 */
  _renderCurrentTab(type, category) {
    const current = Employees.getAssigned(type, category);
    const total = Employees.assignedCount(type, category);
    
    if (current.length === 0) {
      return `
        <div class="empty">尚无员工，无产出</div>
        <div class="list-item" style="margin-top:12px;background:var(--bg-soft);padding:12px;">
          <p class="text-sm text-muted" style="line-height:1.6;margin-bottom:8px;">
            ⚡ <strong>快速开始</strong>：点击上方<strong>快速分配</strong>选项卡可一键分配员工。</p>
        </div>
      `;
    }
    
    let html = `<div class="text-sm text-muted" style="margin:0 0 8px;">当前员工（${total}人）</div>`;
    
    current.forEach(g => {
      const lvl = DATA.employeeLevels['L' + g.level];
      html += `
        <div class="list-item" style="padding:10px 12px;">
          <div class="list-row">
            <div>
              <span class="font-medium" style="color:${lvl.color};">● ${lvl.name} ×${g.count}</span>
              <div class="text-sm text-muted">加成 ×${(lvl.multiplier * g.count).toFixed(1)} · 日薪 ¥${lvl.salary * g.count}</div>
            </div>
            <button class="btn sm" onclick="Staff.showUnassignPicker('${g.id}')">撤回</button>
          </div>
        </div>
      `;
    });
    
    // 添加一键全部撤回按钮
    html += `
      <div class="mt-12">
        <button class="btn full danger" onclick="Staff._unassignAll('${type}', '${category}')">
          ❌ 撤回所有员工
        </button>
      </div>
    `;
    
    return html;
  },

  /* 可分配员工选项卡 */
  _renderUnassignedTab(type, category) {
    const unassigned = (State.data.employees || []).filter(g => !g.assign && g.count > 0);
    
    if (unassigned.length === 0) {
      return `
        <div class="empty">暂无未分配员工</div>
        <div class="list-item" style="margin-top:12px;background:var(--bg-soft);padding:12px;">
          <p class="text-sm text-muted" style="line-height:1.6;">
            💡 <strong>提示</strong>：可以去<strong>招聘</strong>页面招聘新员工，
            或者从其他产业<strong>调拨</strong>员工过来。</p>
        </div>
      `;
    }
    
    let html = `<div class="text-sm text-muted" style="margin:0 0 8px;">未分配员工（${unassigned.length}组）</div>`;
    
    unassigned.forEach(g => {
      const lvl = DATA.employeeLevels['L' + g.level];
      html += `
        <div class="list-item" style="padding:10px 12px;">
          <div class="list-row">
            <div>
              <span class="font-medium" style="color:${lvl.color};">● ${lvl.name} ×${g.count}</span>
              <span class="text-sm text-muted" style="margin-left:4px;">未分配</span>
            </div>
            <button class="btn sm primary" onclick="Staff.showQtyPicker('${g.id}', '${type}', '${category}', ${g.count})">调入</button>
          </div>
        </div>
      `;
    });
    
    return html;
  },

  /* 可调拨员工选项卡 */
  _renderTransferTab(type, category) {
    const otherAssigned = (State.data.employees || []).filter(g =>
      g.assign && g.assign.type === type && g.assign.category !== category && g.count > 0
    );
    
    if (otherAssigned.length === 0) {
      return `
        <div class="empty">无可调拨员工</div>
        <div class="list-item" style="margin-top:12px;background:var(--bg-soft);padding:12px;">
          <p class="text-sm text-muted" style="line-height:1.6;">
            ℹ️ <strong>说明</strong>：这里显示同一个产业类型下，
            其他项目的员工。可以调拨一部分员工过来。</p>
        </div>
      `;
    }
    
    let html = `<div class="text-sm text-muted" style="margin:0 0 8px;">同产业可调拨员工（${otherAssigned.length}组）</div>`;
    
    otherAssigned.forEach(g => {
      const lvl = DATA.employeeLevels['L' + g.level];
      const fromCat = State.findIndustryCategory(type, g.assign.category);
      html += `
        <div class="list-item" style="padding:10px 12px;">
          <div class="list-row">
            <div>
              <span class="font-medium" style="color:${lvl.color};">● ${lvl.name} ×${g.count}</span>
              <span class="text-sm text-muted" style="margin-left:4px;">来自 ${fromCat ? fromCat.name : ''}</span>
            </div>
            <button class="btn sm" onclick="Staff.showTransferPicker('${g.id}', '${type}', '${category}', ${g.count})">调拨</button>
          </div>
        </div>
      `;
    });
    
    return html;
  },

  /* 快速分配选项卡 */
  _renderQuickTab(type, category) {
    const unassigned = (State.data.employees || []).filter(g => !g.assign && g.count > 0);
    const totalUnassigned = unassigned.reduce((sum, g) => sum + g.count, 0);
    const owned = State.data.industries.find(i => i.type === type && i.category === category);
    const qty = owned ? (owned.quantity || 1) : 1;

    // 统计各等级未分配员工
    const lvlCounts = {1: 0, 2: 0, 3: 0, 4: 0};
    unassigned.forEach(g => {
      lvlCounts[g.level] = (lvlCounts[g.level] || 0) + g.count;
    });

    let html = `<div class="text-sm text-muted" style="margin:0 0 8px;">快速分配助手</div>`;

    // 智能推荐
    const recommended = this._calculateRecommended(type, category, qty, lvlCounts);
    if (recommended.total > 0) {
      html += `
        <div class="text-sm text-muted" style="margin:16px 0 8px;">智能推荐</div>
        <div class="list-item" style="background:var(--bg-soft);">
          <div class="font-medium">🧠 根据产业规模推荐</div>
          <div class="text-sm text-muted" style="margin:6px 0 10px;">
            基于您拥有${qty}个产业单位，推荐分配：<br>
            ${Object.entries(recommended.byLevel).filter(([_, c]) => c > 0).map(([lvl, cnt]) => `
              <span style="color:${DATA.employeeLevels['L' + lvl].color};">${DATA.employeeLevels['L' + lvl].name} ${cnt}名</span>
            `).join(' · ')}
          </div>
          <button class="btn primary full" onclick="Staff._assignRecommended('${type}', '${category}')">
            ✅ 按推荐分配
          </button>
        </div>
      `;
    }

    // 一键全派
    html += `
      <div class="list-item" style="margin-bottom:12px;background:var(--bg-soft);">
        <div class="font-medium">🚀 一键全派</div>
        <div class="text-sm text-muted" style="margin:6px 0 10px;">
          将所有${totalUnassigned}名未分配员工全部派到此产业
        </div>
        <button class="btn primary full" onclick="Staff._assignAllUnassigned('${type}', '${category}')"
          ${totalUnassigned <= 0 ? 'disabled' : ''}>
          📋 分配全部${totalUnassigned}名员工
        </button>
      </div>
    `;

    // 按等级分配
    html += `<div class="text-sm text-muted" style="margin:16px 0 8px;">按等级分配</div>`;

    [1, 2, 3, 4].forEach(level => {
      const count = lvlCounts[level] || 0;
      if (count === 0) return;
      const lvl = DATA.employeeLevels['L' + level];

      html += `
        <div class="list-item" style="padding:10px 12px;margin-bottom:8px;">
          <div class="list-row">
            <div>
              <span class="font-medium" style="color:${lvl.color};">• ${lvl.name} ×${count}</span>
              <div class="text-sm text-muted">产出 ×${lvl.multiplier}/人 · 日薪 ¥${lvl.salary}/人</div>
            </div>
          </div>
          <div class="flex gap-8 mt-8">
            <button class="btn sm" style="flex:1;" onclick="Staff._quickAssignLevel('${type}', '${category}', ${level}, 1)"
              ${count < 1 ? 'disabled' : ''}>派1名</button>
            <button class="btn sm" style="flex:1;" onclick="Staff._quickAssignLevel('${type}', '${category}', ${level}, 5)"
              ${count < 5 ? 'disabled' : ''}>派5名</button>
            <button class="btn sm primary" style="flex:1;" onclick="Staff._quickAssignLevel('${type}', '${category}', ${level}, ${count})">全派</button>
          </div>
        </div>
      `;
    });

    if (totalUnassigned === 0 && Object.values(lvlCounts).every(c => c === 0)) {
      html = `
        <div class="empty">暂无未分配员工</div>
        <div class="list-item" style="margin-top:12px;background:var(--bg-soft);padding:12px;">
          <p class="text-sm text-muted" style="line-height:1.6;">
            💡 <strong>提示</strong>：您需要先招聘员工或从其他产业调拨员工。</p>
        </div>
      `;
    }

    return html;
  },

  /* 计算推荐员工分配 */
  _calculateRecommended(type, category, qty, lvlCounts) {
    // 简单的推荐算法：每个产业单位分配1-2名员工，优先高等级
    const target = Math.min(qty * 2, Object.values(lvlCounts).reduce((a, b) => a + b, 0));
    let remaining = target;
    const byLevel = {1: 0, 2: 0, 3: 0, 4: 0};
    
    // 按等级从高到低分配
    for (let level = 4; level >= 1; level--) {
      if (remaining <= 0) break;
      const available = Math.min(lvlCounts[level] || 0, remaining);
      if (available > 0) {
        byLevel[level] = available;
        remaining -= available;
      }
    }
    
    return {
      total: target - remaining,
      byLevel
    };
  },
  
  /* 撤回所有员工 */
  _unassignAll(type, category) {
    const current = Employees.getAssigned(type, category);
    if (current.length === 0) {
      UI.toast('当前没有员工');
      return;
    }
    
    UI.confirm('撤回所有员工', `确认撤回所有${Employees.assignedCount(type, category)}名员工？`, () => {
      current.forEach(g => {
        Employees.unassign(g.id);
      });
      UI.closeModal();
      UI.toast('已撤回所有员工');
    });
  },
  
  /* 分配所有未分配员工 */
  _assignAllUnassigned(type, category) {
    const unassigned = (State.data.employees || []).filter(g => !g.assign && g.count > 0);
    const total = unassigned.reduce((sum, g) => sum + g.count, 0);
    
    if (total === 0) {
      UI.toast('暂无未分配员工');
      return;
    }
    
    UI.confirm('分配所有未分配员工', `确认将${total}名未分配员工全部派到此产业？`, () => {
      unassigned.forEach(g => {
        Employees.assign(g.id, g.count, type, category);
      });
      UI.closeModal();
    });
  },
  
  /* 快速分配某等级员工 */
  _quickAssignLevel(type, category, level, count) {
    const unassigned = (State.data.employees || []).find(g => !g.assign && g.level === level);
    if (!unassigned) {
      UI.toast('没有该等级的未分配员工');
      return;
    }
    
    const available = unassigned.count;
    const assignCount = Math.min(count, available);
    
    if (assignCount <= 0) {
      UI.toast('数量无效');
      return;
    }
    
    Employees.assign(unassigned.id, assignCount, type, category);
    UI.closeModal();
  },
  
  /* 按推荐分配 */
  _assignRecommended(type, category) {
    const owned = State.data.industries.find(i => i.type === type && i.category === category);
    const qty = owned ? (owned.quantity || 1) : 1;
    const unassigned = (State.data.employees || []).filter(g => !g.assign && g.count > 0);
    
    // 统计各等级未分配员工
    const lvlCounts = {1: 0, 2: 0, 3: 0, 4: 0};
    unassigned.forEach(g => {
      lvlCounts[g.level] = (lvlCounts[g.level] || 0) + g.count;
    });
    
    const recommended = this._calculateRecommended(type, category, qty, lvlCounts);
    
    if (recommended.total === 0) {
      UI.toast('暂无推荐员工');
      return;
    }
    
    // 按等级分配
    Object.entries(recommended.byLevel).forEach(([level, count]) => {
      if (count > 0) {
        const grp = (State.data.employees || []).find(g => !g.assign && g.level === parseInt(level));
        if (grp) {
          Employees.assign(grp.id, count, type, category);
        }
      }
    });
    
    UI.closeModal();
  },

  /* 招聘：弹出数量选择器 */
  recruitWithPicker(mode) {
    const cap = Employees.capacity();
    const cnt = Employees.count();
    const maxAvailable = cap - cnt;
    if (maxAvailable <= 0) { UI.toast('宿舍已满，无法招聘'); return; }
    const perPerson = DATA.recruit.costPerPerson(mode);
    const modeLabel = mode === 'free' ? '免费招聘' : (mode === 'paid' ? '付费招聘' : '猎头招聘');
    UI.numberPicker({
      title: modeLabel,
      unit: perPerson,
      unitName: '人',
      unitLabel: '人均 ¥' + perPerson.toLocaleString('zh-CN') + ' · 最多 ' + maxAvailable + ' 人',
      max: maxAvailable,
      quickAdds: maxAvailable >= 20 ? [1, 5, 10, 20] : [1, 3, 5, maxAvailable],
      onConfirm: (qty) => {
        if (qty <= 0) { UI.toast('请选择数量'); return; }
        Employees.recruit(mode, qty);
      }
    });
  },

  /* 分配数量选择（已有，保持兼容） */
  showQtyPicker(groupId, type, category, max) {
    UI.closeModal();
    setTimeout(() => {
      UI.numberPicker({
        title: '分配数量',
        unit: 1,
        unitName: '人',
        unitLabel: `最多 ${max} 人`,
        max: max,
        quickAdds: max >= 50 ? [5, 10, 20, 50] : [1, 5, 10, max],
        onConfirm: (n) => {
          if (n <= 0) { UI.toast('请选择数量'); return; }
          Employees.assign(groupId, n, type, category);
        }
      });
    }, 100);
  },

  /* 调拨数量选择（跨品类转移） */
  showTransferPicker(fromGroupId, toType, toCategory, max) {
    UI.closeModal();
    setTimeout(() => {
      const grp = (State.data.employees || []).find(g => g.id === fromGroupId);
      if (!grp || !grp.assign) return;
      const fromCat = State.findIndustryCategory(grp.assign.type, grp.assign.category);
      const toCat = State.findIndustryCategory(toType, toCategory);

      UI.numberPicker({
        title: `调拨：${fromCat ? fromCat.name : ''} → ${toCat ? toCat.name : ''}`,
        unit: 1,
        unitName: '人',
        unitLabel: `最多 ${max} 人 · 同等级直接转移`,
        max: max,
        quickAdds: max >= 50 ? [5, 10, 20, 50] : [1, 5, 10, max],
        onConfirm: (n) => {
          if (n <= 0) { UI.toast('请选择数量'); return; }
          Employees.transfer(fromGroupId, n, toType, toCategory);
        }
      });
    }, 100);
  },

  /* 撤回数量选择 */
  showUnassignPicker(groupId) {
    const grp = (State.data.employees || []).find(g => g.id === groupId);
    if (!grp || !grp.assign) return;
    const lvl = DATA.employeeLevels['L' + grp.level];

    UI.closeModal();
    setTimeout(() => {
      UI.modal('撤回 ' + lvl.name, `
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">当前 ${grp.count} 人，选择撤回数量：</p>
        <div class="flex gap-8">
          <button class="btn" style="flex:1;" onclick="Employees.unassignSome('${grp.id}', 1)">撤回 1 人</button>
          <button class="btn" style="flex:1;" onclick="Employees.unassignSome('${grp.id}', Math.floor(${grp.count}/2))">撤回一半</button>
          <button class="btn primary" style="flex:1;" onclick="Employees.unassign('${grp.id}')">全部撤回</button>
        </div>
      `, [
        { label: '取消', onclick: 'UI.closeModal()' }
      ]);
    }, 100);
  }
};

Staff.recruitWithPicker = Staff.recruitWithPicker;
window.Pages = window.Pages || {};
window.Pages.staff = Pages.staff;
window.Staff = Staff;
