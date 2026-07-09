/* achievements.js — 成就与评级系统 */

const Achievements = {

  /* ===== 评级等级定义 ===== */
  ratings: [
    { id: "individual", name: "个体户", minAssets: 0, unlocks: [] },
    { id: "small_micro", name: "小微企业", minAssets: 500000, unlocks: ["logistics_auto"] },
    { id: "medium", name: "中小企业", minAssets: 5000000, unlocks: ["futures_trade"] },
    { id: "large", name: "大型企业", minAssets: 20000000, unlocks: ["stock_issuance"] },
    { id: "listed", name: "上市公司", minAssets: 100000000, unlocks: ["overseas_invest"] },
    { id: "fortune500", name: "世界500强", minAssets: 500000000, unlocks: ["monopoly"] }
  ],

  /* ===== 成就定义 ===== */
  definitions: [
    // 资产里程碑
    { id: "assets_50w", name: "小有积蓄", desc: "总资产突破 ¥50万", condition: s => s.totalAssets >= 500000 },
    { id: "assets_500w", name: "财富积累", desc: "总资产突破 ¥500万", condition: s => s.totalAssets >= 5000000 },
    { id: "assets_2000w", name: "千万富翁", desc: "总资产突破 ¥2000万", condition: s => s.totalAssets >= 20000000 },
    { id: "assets_1yi", name: "亿万富豪", desc: "总资产突破 ¥1亿", condition: s => s.totalAssets >= 100000000 },
    { id: "assets_5yi", name: "商业帝国", desc: "总资产突破 ¥5亿", condition: s => s.totalAssets >= 500000000 },

    // 产业里程碑
    { id: "all_industries", name: "产业全覆盖", desc: "同时拥有全部6种产业", condition: s => {
      const types = new Set((s.industries || []).map(i => i.type));
      return types.has('farm') && types.has('mining') && types.has('metall') && 
             types.has('factory') && types.has('estate') && types.has('logistics');
    }},
    { id: "factory_lines_100", name: "工业巨擘", desc: "工厂产线总数达到100条", condition: s => {
      return (s.industries || []).filter(i => i.type === 'factory').reduce((sum, i) => sum + (i.quantity || 0), 0) >= 100;
    }},

    // 金融里程碑
    { id: "all_stocks", name: "投资达人", desc: "持有全部20只股票", condition: s => (s.stocks || []).length >= 20 },
    { id: "futures_profit_100w", name: "期货高手", desc: "期货累计盈利突破 ¥100万", condition: s => (s.futuresStats || {}).totalProfit >= 1000000 },

    // 生存里程碑
    { id: "survive_100d", name: "百年老店", desc: "连续存活100天", condition: s => (s.date || {}).totalDays >= 100 },
    { id: "monthly_income_100w", name: "日进斗金", desc: "单月净收入突破 ¥100万", condition: s => (s.dailyStats || []).slice(-30).reduce((sum, d) => sum + (d.netIncome || 0), 0) >= 1000000 }
  ],

  /* ===== 计算当前评级 ===== */
  getCurrentRating() {
    const assets = (State.totalAssets && State.totalAssets()) || 0;
    let current = this.ratings[0];
    for (const rating of this.ratings) {
      if (assets >= rating.minAssets) current = rating;
    }
    return current;
  },

  /* ===== 获取下一个评级 ===== */
  getNextRating() {
    const assets = (State.totalAssets && State.totalAssets()) || 0;
    for (const rating of this.ratings) {
      if (assets < rating.minAssets) return rating;
    }
    return null;
  },

  /* ===== 检测新成就 ===== */
  checkAchievements() {
    const state = State.data;
    const stats = {
      totalAssets: (State.totalAssets && State.totalAssets()) || 0,
      industries: state.industries || [],
      stocks: state.stocks || [],
      futuresStats: state.futuresStats || {},
      date: state.date || {},
      dailyStats: state.dailyStats || []
    };

    const unlocked = state.achievements || [];
    const newAchievements = [];

    for (const def of this.definitions) {
      if (unlocked.includes(def.id)) continue;
      try {
        if (def.condition(stats)) {
          newAchievements.push(def);
          unlocked.push(def.id);
        }
      } catch (e) {
        // 条件判断出错时跳过
      }
    }

    state.achievements = unlocked;
    return newAchievements;
  },

  /* ===== 获取已解锁成就 ===== */
  getUnlockedAchievements() {
    const unlocked = (State.data.achievements || []);
    return this.definitions.filter(d => unlocked.includes(d.id));
  },

  /* ===== 检查功能是否解锁 ===== */
  isUnlocked(featureId) {
    const rating = this.getCurrentRating();
    return rating.unlocks.includes(featureId);
  }
};

window.Achievements = Achievements;
