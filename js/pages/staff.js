/* staff.js — 员工管理页：按类分组显示、批量招聘、分配 */

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

        <div class="section-title">招聘（每次招 ${DATA.recruit.batchCount} 人）</div>
        <div class="card-grid">
          <button class="card" onclick="Employees.recruit('free')" ${count + DATA.recruit.batchCount > cap ? 'disabled style="opacity:0.4;"' : ''}>
            <div class="card-title">免费招聘</div>
            <div class="card-sub">无需花费</div>
            <div class="card-value" style="font-size:11px;color:var(--text-secondary);">
              初级 72% · 中级 20%<br>高级 6% · 专家 2%
            </div>
          </button>
          <button class="card" onclick="Employees.recruit('paid')" ${count + DATA.recruit.batchCount > cap || s.cash < DATA.recruit.paid.cost ? 'disabled style="opacity:0.4;"' : ''}>
            <div class="card-title">付费招聘</div>
            <div class="card-sub">¥${DATA.recruit.paid.cost.toLocaleString('zh-CN')}</div>
            <div class="card-value" style="font-size:11px;color:var(--text-secondary);">
              初级 25% · 中级 45%<br>高级 22% · 专家 8%
            </div>
          </button>
          <button class="card" onclick="Employees.recruit('expert')" ${count + DATA.recruit.batchCount > cap || s.cash < DATA.recruit.expert.cost ? 'disabled style="opacity:0.4;"' : ''}>
            <div class="card-title" style="color:var(--up);">猎头招聘</div>
            <div class="card-sub">¥${DATA.recruit.expert.cost.toLocaleString('zh-CN')}</div>
            <div class="card-value" style="font-size:11px;color:var(--up);">
              必出 ${DATA.recruit.batchCount} 名专家
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

        <div class="section-title">已分配员工</div>
        ${this.assignedList()}

        <div class="section-title">产业分配概览</div>
        ${this.assignmentOverview()}

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

  /* 选数量并分配 */
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

  /* 模式 B：指定产业 → 完整员工管理弹窗（当前员工+可调入） */
  showAssignPickerByIndustry(type, category) {
    const cat = State.findIndustryCategory(type, category);
    if (!cat) return;
    const ind = DATA.industries[type];

    // 当前已派到此品类的员工组
    const current = Employees.getAssigned(type, category);
    // 未分配员工
    const unassigned = (State.data.employees || []).filter(g => !g.assign && g.count > 0);
    // 同产业类型下、其他品类的已分配员工（可调拨）
    const otherAssigned = (State.data.employees || []).filter(g =>
      g.assign && g.assign.type === type && g.assign.category !== category && g.count > 0
    );

    let html = '';

    // —— 当前员工 ——
    if (current.length > 0) {
      html += '<div class="text-sm text-muted" style="margin:0 0 6px;">当前员工（' + Employees.assignedCount(type, category) + '人）</div>';
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
    } else {
      html += '<div class="text-sm" style="color:var(--down);margin:0 0 8px;">⚠ 尚无员工，无产出</div>';
    }

    // —— 可调入 ——
    const hasAvailable = unassigned.length > 0 || otherAssigned.length > 0;
    if (hasAvailable) {
      html += '<div class="text-sm text-muted" style="margin:12px 0 6px;">可调入</div>';

      // 未分配
      if (unassigned.length > 0) {
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
      }

      // 同产业其他品类
      if (otherAssigned.length > 0) {
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
      }
    } else if (current.length === 0) {
      html += '<div class="empty" style="margin-top:8px;">没有可分配的员工，请先招聘</div>';
    }

    UI.modal(`${ind.icon} ${cat.name} · 员工管理`, html, [
      { label: '关闭', onclick: 'UI.closeModal()' }
    ]);
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

window.Pages = window.Pages || {};
window.Pages.staff = Pages.staff;
window.Staff = Staff;
