/* data.js — 静态数据：产业、股票、贵金属、新闻事件库 */

const DATA = {
  /* ===== 难度配置 ===== */
  difficulties: {
    easy:   { name: '简单', cash: 500000,  desc: '资金充裕，适合熟悉玩法' },
    normal: { name: '中等', cash: 250000,  desc: '标准体验，推荐首次玩家' },
    hard:   { name: '困难', cash: 100000,  desc: '白手起家，精打细算' }
  },

  /* ===== 金融板块 ===== */
  deposit: {
    annualRate: 0.03   // 年化 3%，按天计息
  },

  stocks: [
    // 矿业/能源类
    { code: 'LYKY',  name: '龙源矿业',   sector: 'mining',  basePrice: 12.5, industry: '煤炭采选',   desc: '国内领先煤炭生产商，业务覆盖开采、洗选、销售一体化运营。' },
    { code: 'ZSYT',  name: '中石原油',   sector: 'mining',  basePrice: 8.2,  industry: '石油开采',   desc: '上游油气勘探开发龙头，受国际油价波动影响显著。' },
    { code: 'JXME',  name: '江西煤业',   sector: 'mining',  basePrice: 6.4,  industry: '煤炭采选',   desc: '华东地区煤炭骨干企业，主营动力煤与焦煤。' },
    // 农业类
    { code: 'FLNY',  name: '丰乐农业',   sector: 'farm',    basePrice: 8.3,  industry: '种植养殖',   desc: '一体化农业集团，覆盖种子、种植、加工全产业链。' },
    { code: 'BYNK',  name: '北原农牧',   sector: 'farm',    basePrice: 5.6,  industry: '种植养殖',   desc: '东北粮食主产区龙头企业，主营玉米大豆。' },
    { code: 'WTHJ',  name: '万通调料',   sector: 'farm',    basePrice: 14.8, industry: '食品加工',   desc: '调味品行业知名品牌，下游消费需求稳定。' },
    // 冶金类
    { code: 'AGYJ',  name: '鞍钢冶金',   sector: 'metall',  basePrice: 6.8,  industry: '钢铁冶炼',   desc: '大型钢铁联合企业，建材与特种钢双线布局。' },
    { code: 'TBGF',  name: '铜陵股份',   sector: 'metall',  basePrice: 9.5,  industry: '有色金属',   desc: '国内铜冶炼龙头，受国际铜价影响较大。' },
    { code: 'LVAL',  name: '鲁丰铝业',   sector: 'metall',  basePrice: 11.2, industry: '有色金属',   desc: '铝材加工企业，受益新能源轻量化趋势。' },
    // 工厂/制造类
    { code: 'KCDZ',  name: '科创电子',   sector: 'factory', basePrice: 15.2, industry: '消费电子',   desc: '消费电子代工龙头，海外订单饱满。' },
    { code: 'DFJQ',  name: '东方机械',   sector: 'factory', basePrice: 7.8,  industry: '工程机械',   desc: '重型机械制造商，受益基建投资周期。' },
    { code: 'HSPC',  name: '华生汽车',   sector: 'factory', basePrice: 18.6, industry: '汽车制造',   desc: '自主品牌车企，新能源转型中。' },
    // 制药/医疗
    { code: 'HNZY',  name: '华润制药',   sector: 'pharma',  basePrice: 32.5, industry: '医药制造',   desc: '国内医药龙头，覆盖处方药与 OTC 双市场。' },
    { code: 'FBYY',  name: '复必医药',   sector: 'pharma',  basePrice: 28.4, industry: '医药制造',   desc: '创新药研发企业，管线丰富，研发投入大。' },
    { code: 'LKSW',  name: '联康生物',   sector: 'pharma',  basePrice: 9.7,  industry: '生物科技',   desc: '生物制药新锐，专注疫苗与抗体药物。' },
    // 科技/半导体
    { code: 'ZKBD',  name: '中科半导',   sector: 'tech',    basePrice: 42.8, industry: '半导体',     desc: '国产芯片设计龙头，受益国产替代趋势。' },
    { code: 'TXKJ',  name: '通讯科技',   sector: 'tech',    basePrice: 21.5, industry: '5G通讯',     desc: '通信设备供应商，5G 基站建设核心受益标的。' },
    // 消费
    { code: 'BLGF',  name: '保利百货',   sector: 'consume', basePrice: 13.6, industry: '商业零售',   desc: '全国连锁百货集团，受益消费复苏。' },
    { code: 'GNLY',  name: '贵酿酒业',   sector: 'consume', basePrice: 68.5, industry: '白酒',       desc: '高端白酒品牌，毛利率高，现金流稳定。' },
    // 金融
    { code: 'JSYH',  name: '建设银行',   sector: 'finance', basePrice: 5.8,  industry: '银行',       desc: '国有大行，分红稳定，估值低防御性强。' },
    { code: 'TBTB',  name: '太平洋保',   sector: 'finance', basePrice: 19.2, industry: '保险',       desc: '综合保险集团，投资收益受市场波动影响。' }
  ],

  /* ===== 基金（12 只，不同类型） ===== */
  funds: [
    { code: 'CZ001', name: '成长先锋混合',  type: '混合型', risk: '中高', basePrice: 1.8520, sector: 'mixed',    desc: '重点配置成长性股票，兼顾债券平滑波动。' },
    { code: 'JZ002', name: '稳健收益债券',  type: '债券型', risk: '低',   basePrice: 1.1245, sector: 'bond',     desc: '以国债和高评级企业债为主，追求稳健收益。' },
    { code: 'GF003', name: '科创板指数',    type: '指数型', risk: '高',   basePrice: 1.5840, sector: 'index',    desc: '跟踪科创板 50 指数，聚焦硬科技。' },
    { code: 'YY004', name: '医药健康主题',  type: '股票型', risk: '高',   basePrice: 2.3580, sector: 'pharma',   desc: '重仓医药生物板块，长期看好老龄化趋势。' },
    { code: 'XN005', name: '新能源车ETF',   type: '指数型', risk: '高',   basePrice: 1.4230, sector: 'tech',     desc: '跟踪新能源汽车产业链指数。' },
    { code: 'XF006', name: '消费升级混合',  type: '混合型', risk: '中',   basePrice: 1.9850, sector: 'consume',  desc: '配置消费、白酒、零售等受益消费升级标的。' },
    { code: 'JZ007', name: '货币市场基金',  type: '货币型', risk: '极低', basePrice: 1.0000, sector: 'money',    desc: '投资短期货币工具，类似活期存款但收益略高。' },
    { code: 'HN008', name: '沪深300指数',   type: '指数型', risk: '中',   basePrice: 4.1260, sector: 'index',    desc: '跟踪沪深 300 指数，覆盖大盘蓝筹。' },
    { code: 'JG009', name: '军工主题股票',  type: '股票型', risk: '高',   basePrice: 1.8740, sector: 'military', desc: '重点配置军工产业链，受益装备升级。' },
    { code: 'HK010', name: '港股通恒生',    type: 'QDII',   risk: '中高', basePrice: 1.6530, sector: 'hk',       desc: '通过港股通投资恒生指数成分股。' },
    { code: 'YL011', name: '有色金属ETF',   type: '指数型', risk: '中高', basePrice: 1.3460, sector: 'metall',   desc: '跟踪有色金属指数，受大宗商品价格影响。' },
    { code: 'YL012', name: '稀土产业混合',  type: '混合型', risk: '高',   basePrice: 2.0890, sector: 'mining',   desc: '聚焦稀土及战略资源产业链。' }
  ],

  metals: [
    { code: 'gold',     name: '黄金', basePrice: 280,   volatility: 0.008 },
    { code: 'silver',   name: '白银', basePrice: 3.6,   volatility: 0.015 },
    { code: 'platinum', name: '铂金', basePrice: 200,   volatility: 0.012 }
  ],

  /* ===== 五大产业 × 细分品类（含产出配方，联动核心） ===== */
  industries: {
    farm: {
      name: '农业',
      icon: '🌾',
      unit: '亩',
      categories: [
        { code: 'wheat',   name: '小麦',  cost: 800,   dailyIncome: 12,  cycle: '秋种夏收',  produces: { code: 'wheat',   qty: 2.0 } },
        { code: 'rice',    name: '水稻',  cost: 950,   dailyIncome: 15,  cycle: '一年两熟',  produces: { code: 'rice',    qty: 2.5 } },
        { code: 'soy',     name: '大豆',  cost: 700,   dailyIncome: 10,  cycle: '周期短',    produces: { code: 'soy',     qty: 1.8 } },
        { code: 'corn',    name: '玉米',  cost: 750,   dailyIncome: 11,  cycle: '饲料刚需',  produces: { code: 'corn',    qty: 2.0 } },
        { code: 'cotton',  name: '棉花',  cost: 1100,  dailyIncome: 18,  cycle: '工业原料',  produces: { code: 'cotton',  qty: 1.5 } },
        { code: 'rape',    name: '油菜',  cost: 850,   dailyIncome: 13,  cycle: '油料作物',  produces: { code: 'rape',    qty: 1.8 } },
        { code: 'sugarc',  name: '甘蔗',  cost: 1200,  dailyIncome: 20,  cycle: '糖料来源',  produces: { code: 'sugarc',  qty: 3.0 } },
        { code: 'tea',     name: '茶园',  cost: 1800,  dailyIncome: 28,  cycle: '经济作物',  produces: { code: 'tea',     qty: 0.8 } },
        { code: 'veg',     name: '蔬菜',  cost: 600,   dailyIncome: 9,   cycle: '周期最短',  produces: { code: 'veg',     qty: 2.5 } },
        { code: 'fruit',   name: '果树',  cost: 1500,  dailyIncome: 24,  cycle: '多年生',    produces: { code: 'fruit',   qty: 1.2 } },
        { code: 'rubber',  name: '橡胶',  cost: 2200,  dailyIncome: 35,  cycle: '热带作物',  produces: { code: 'rubber',  qty: 0.8 } },
        { code: 'tobacco', name: '烟叶',  cost: 2000,  dailyIncome: 32,  cycle: '专卖作物',  produces: { code: 'tobacco', qty: 0.8 } }
      ]
    },
    mining: {
      name: '矿业',
      icon: '⛏️',
      unit: '份',
      categories: [
        { code: 'coal',   name: '煤矿',   cost: 5000,  dailyIncome: 80,   reserve: 3650, produces: { code: 'coal',     qty: 3.0 } },
        { code: 'iron',   name: '铁矿',   cost: 6800,  dailyIncome: 100,  reserve: 2920, produces: { code: 'iron',     qty: 2.5 } },
        { code: 'copper', name: '铜矿',   cost: 7500,  dailyIncome: 115,  reserve: 2555, produces: { code: 'copper',   qty: 2.0 } },
        { code: 'gold',   name: '金矿',   cost: 12000, dailyIncome: 180,  reserve: 1825, produces: { code: 'gold_ore', qty: 0.3 } },
        { code: 'rare',   name: '稀土',   cost: 20000, dailyIncome: 300,  reserve: 1095, produces: { code: 'rare_earth', qty: 0.2 } },
        { code: 'baux',   name: '铝土矿', cost: 6200,  dailyIncome: 95,   reserve: 2920, produces: { code: 'baux',     qty: 2.5 } },
        { code: 'tung',   name: '钨矿',   cost: 15000, dailyIncome: 220,  reserve: 1460, produces: { code: 'tung',     qty: 1.0 } },
        { code: 'tin',    name: '锡矿',   cost: 9500,  dailyIncome: 145,  reserve: 2190, produces: { code: 'tin',      qty: 1.5 } },
        { code: 'phos',   name: '磷矿',   cost: 4200,  dailyIncome: 65,   reserve: 3650, produces: { code: 'phos_ore', qty: 3.0 } },
        { code: 'quartz', name: '石英矿', cost: 5500,  dailyIncome: 85,   reserve: 3285, produces: { code: 'quartz_ore', qty: 2.5 } }
      ]
    },
    metall: {
      name: '冶金',
      icon: '🔥',
      unit: '单位产能',
      categories: [
        { code: 'steel',    name: '炼钢',       cost: 4500, dailyIncome: 70,  produces: { code: 'steel',    qty: 1.5 } },
        { code: 'copperR',  name: '炼铜',       cost: 5200, dailyIncome: 80,  produces: { code: 'copperR',  qty: 1.2 } },
        { code: 'alum',     name: '炼铝',       cost: 4800, dailyIncome: 75,  produces: { code: 'alum',     qty: 1.3 } },
        { code: 'precious', name: '贵金属冶炼', cost: 8000, dailyIncome: 130, produces: { code: 'precious_m', qty: 0.3 } },
        { code: 'ironR',    name: '炼铁',       cost: 3800, dailyIncome: 58,  produces: { code: 'ironR',    qty: 1.8 } },
        { code: 'zincR',    name: '炼锌',       cost: 4600, dailyIncome: 72,  produces: { code: 'zincR',    qty: 1.2 } },
        { code: 'leadR',    name: '炼铅',       cost: 4200, dailyIncome: 68,  produces: { code: 'leadR',    qty: 1.2 } },
        { code: 'tinR',     name: '炼锡',       cost: 6500, dailyIncome: 100, produces: { code: 'tinR',     qty: 1.0 } },
        { code: 'tungR',    name: '炼钨',       cost: 9000, dailyIncome: 140, produces: { code: 'tungR',    qty: 0.8 } },
        { code: 'alloy',    name: '铝合金',     cost: 7200, dailyIncome: 115, produces: { code: 'alloy',    qty: 1.0 } }
      ]
    },
    factory: {
      name: '工厂',
      icon: '🏭',
      unit: '条生产线',
      categories: [
        { code: 'food',    name: '食品厂',   cost: 3200,  dailyIncome: 52 },
        { code: 'textile', name: '纺织厂',   cost: 2800,  dailyIncome: 45 },
        { code: 'machine', name: '机械厂',   cost: 5800,  dailyIncome: 95 },
        { code: 'electr',  name: '电子厂',   cost: 7200,  dailyIncome: 120 },
        { code: 'fert',    name: '化肥厂',   cost: 4500,  dailyIncome: 72 },
        { code: 'paper',   name: '造纸厂',   cost: 3600,  dailyIncome: 58 },
        { code: 'cement',  name: '水泥厂',   cost: 6200,  dailyIncome: 100 },
        { code: 'furn',    name: '家具厂',   cost: 4000,  dailyIncome: 65 },
        { code: 'brew',    name: '酿酒厂',   cost: 5500,  dailyIncome: 90 },
        { code: 'feed',    name: '饲料厂',   cost: 3400,  dailyIncome: 55 }
      ]
    },
    estate: {
      name: '地产',
      icon: '🏢',
      unit: '套',
      categories: [
        { code: 'residential', name: '住宅',       cost: 15000, dailyIncome: 40 },
        { code: 'commercial',  name: '商业地产',   cost: 22000, dailyIncome: 65 },
        { code: 'industrial',  name: '工业地产',   cost: 9000,  dailyIncome: 28 },
        { code: 'office',      name: '写字楼',     cost: 28000, dailyIncome: 85 },
        { code: 'hotel',       name: '酒店',       cost: 35000, dailyIncome: 110 },
        { code: 'warehouse',   name: '仓库',       cost: 7000,  dailyIncome: 22 },
        { code: 'mall',        name: '购物中心',   cost: 45000, dailyIncome: 140 },
        { code: 'park',        name: '产业园',     cost: 60000, dailyIncome: 180 }
      ]
    }
  },

  /* ===== 产业类型映射（用于新闻联动） ===== */
  // 每个产业 code 对应受影响的新闻关键词
  sectorMap: {
    // 农业
    wheat: ['farm', 'wheat'], rice: ['farm', 'rice'], soy: ['farm', 'soy'],
    corn: ['farm', 'corn'], cotton: ['farm', 'cotton'], rape: ['farm', 'rape'],
    sugarc: ['farm', 'sugarc'], tea: ['farm', 'tea'], veg: ['farm', 'veg'],
    fruit: ['farm', 'fruit'], rubber: ['farm', 'rubber'], tobacco: ['farm', 'tobacco'],
    // 矿业
    coal: ['mining', 'coal'], iron: ['mining', 'iron'], copper: ['mining', 'copper'],
    gold: ['mining', 'gold', 'metal'], rare: ['mining', 'rare'], baux: ['mining', 'baux'],
    tung: ['mining', 'tung'], tin: ['mining', 'tin'], phos: ['mining', 'phos'],
    quartz: ['mining', 'quartz'],
    // 冶金
    steel: ['metall', 'steel', 'iron'], copperR: ['metall', 'copper'],
    alum: ['metall', 'alum'], precious: ['metall', 'gold', 'precious'],
    ironR: ['metall', 'iron', 'steel'], zincR: ['metall', 'zinc'],
    leadR: ['metall', 'lead'], tinR: ['metall', 'tin'],
    tungR: ['metall', 'tung'], alloy: ['metall', 'alum'],
    // 工厂
    food: ['factory', 'food', 'soy', 'corn'], textile: ['factory', 'textile', 'cotton'],
    machine: ['factory', 'machine', 'steel'], electr: ['factory', 'electr'],
    fert: ['factory', 'fert', 'phos'], paper: ['factory', 'paper'],
    cement: ['factory', 'cement', 'limestone'], furn: ['factory', 'furn', 'wood'],
    brew: ['factory', 'brew', 'wheat'], feed: ['factory', 'feed', 'corn'],
    // 地产
    residential: ['estate', 'residential'], commercial: ['estate', 'commercial'],
    industrial: ['estate', 'industrial'], office: ['estate', 'office'],
    hotel: ['estate', 'hotel'], warehouse: ['estate', 'warehouse'],
    mall: ['estate', 'mall'], park: ['estate', 'park']
  },

  /* ===== 工厂配方：消耗仓库原料（农产品+金属） ===== */
  // 所有原料都从仓库出，和冶金一样
  factoryRecipes: {
    food:   [ { code: 'wheat', qty: 0.5 }, { code: 'soy', qty: 0.3 }, { code: 'corn', qty: 0.2 } ],
    brew:   [ { code: 'wheat', qty: 1.2 }, { code: 'fruit', qty: 0.2 } ],
    feed:   [ { code: 'corn', qty: 1.0 }, { code: 'soy', qty: 0.5 } ],
    textile:[ { code: 'cotton', qty: 0.8 } ],
    fert:   [ { code: 'phos_ore', qty: 0.4 }, { code: 'coal', qty: 0.2 } ],
    paper:  [ { code: 'veg', qty: 0.6 }, { code: 'corn', qty: 0.3 } ],
    cement: [ { code: 'coal', qty: 0.5 }, { code: 'iron', qty: 0.1 } ],
    furn:   [ { code: 'rubber', qty: 0.3 }, { code: 'cotton', qty: 0.2 } ],
    machine:[ { code: 'steel', qty: 0.4 }, { code: 'ironR', qty: 0.2 } ],
    electr: [ { code: 'copperR', qty: 0.3 }, { code: 'alum', qty: 0.2 }, { code: 'rare_earth', qty: 0.05 } ]
  },

  /* ===== 员工等级配置（按类分组，工资扁平化） ===== */
  employeeLevels: {
    L1: { name: '初级员工', color: '#9a9a9f', multiplier: 1.0, salary: 168 },
    L2: { name: '中级员工', color: '#185fa5', multiplier: 1.3, salary: 256 },
    L3: { name: '高级员工', color: '#ba7517', multiplier: 1.7, salary: 384 },
    L4: { name: '专家级员工', color: '#e24b4a', multiplier: 2.4, salary: 600 }
  },

  /* ===== 招聘配置（一次招 5 个） ===== */
  recruit: {
    batchCount: 5,   // 每次招聘人数
    // 免费招聘：以初级为主
    free:  { cost: 0,     prob: [0.72, 0.20, 0.06, 0.02] },
    // 付费招聘 ¥3000：中级为主
    paid:  { cost: 3000,  prob: [0.25, 0.45, 0.22, 0.08] },
    // 猎头招聘 ¥15000：必出 5 个专家
    expert:{ cost: 15000, prob: [0, 0, 0, 1.0] }
  },

  /* ===== 冶金配方：消耗仓库矿石原料 ===== */
  smelterRecipes: {
    steel:    [ { code: 'iron', qty: 2.0 }, { code: 'coal', qty: 1.0 } ],
    ironR:    [ { code: 'iron', qty: 2.5 } ],
    copperR:  [ { code: 'copper', qty: 2.0 } ],
    alum:     [ { code: 'baux', qty: 2.5 } ],
    zincR:    [ { code: 'zinc_ore', qty: 2.0 } ],
    leadR:    [ { code: 'lead_ore', qty: 2.0 } ],
    tinR:     [ { code: 'tin', qty: 2.0 } ],
    tungR:    [ { code: 'tung', qty: 1.5 } ],
    precious: [ { code: 'gold_ore', qty: 0.5 }, { code: 'silver_ore', qty: 1.0 } ],
    alloy:    [ { code: 'baux', qty: 1.5 }, { code: 'copper', qty: 0.5 } ]
  },

  /* ===== 全部原料列表（矿石+农产品+金属，可买卖） ===== */
  rawMaterials: [
    // 矿石（矿业产出 / 冶金消耗）
    { code: 'iron',        name: '铁矿石',   price: 60,  unit: '吨', from: '铁矿' },
    { code: 'copper',      name: '铜矿石',   price: 120, unit: '吨', from: '铜矿' },
    { code: 'baux',        name: '铝土矿',   price: 80,  unit: '吨', from: '铝土矿' },
    { code: 'coal',        name: '煤炭',     price: 45,  unit: '吨', from: '煤矿' },
    { code: 'zinc_ore',    name: '锌矿石',   price: 95,  unit: '吨', from: '锌矿' },
    { code: 'lead_ore',    name: '铅矿石',   price: 85,  unit: '吨', from: '铅矿' },
    { code: 'tin',         name: '锡矿石',   price: 180, unit: '吨', from: '锡矿' },
    { code: 'tung',        name: '钨矿石',   price: 320, unit: '吨', from: '钨矿' },
    { code: 'gold_ore',    name: '金矿石',   price: 800, unit: '吨', from: '金矿' },
    { code: 'silver_ore',  name: '银矿石',   price: 150, unit: '吨', from: '银矿' },
    { code: 'rare_earth',  name: '稀土矿',   price: 2000, unit: '吨', from: '稀土' },
    { code: 'phos_ore',    name: '磷矿石',   price: 55,  unit: '吨', from: '磷矿' },
    { code: 'quartz_ore',  name: '石英石',   price: 70,  unit: '吨', from: '石英矿' },
    // 农产品（农业产出 / 工厂消耗）
    { code: 'wheat',       name: '小麦',     price: 50,  unit: '吨', from: '小麦' },
    { code: 'rice',        name: '稻谷',     price: 55,  unit: '吨', from: '水稻' },
    { code: 'soy',         name: '大豆',     price: 65,  unit: '吨', from: '大豆' },
    { code: 'corn',        name: '玉米',     price: 48,  unit: '吨', from: '玉米' },
    { code: 'cotton',      name: '棉花',     price: 90,  unit: '吨', from: '棉花' },
    { code: 'rape',        name: '油菜籽',   price: 70,  unit: '吨', from: '油菜' },
    { code: 'sugarc',      name: '甘蔗',     price: 40,  unit: '吨', from: '甘蔗' },
    { code: 'tea',         name: '茶叶',     price: 200, unit: '吨', from: '茶园' },
    { code: 'veg',         name: '蔬菜',     price: 35,  unit: '吨', from: '蔬菜' },
    { code: 'fruit',       name: '水果',     price: 120, unit: '吨', from: '果树' },
    { code: 'rubber',      name: '橡胶',     price: 150, unit: '吨', from: '橡胶' },
    { code: 'tobacco',     name: '烟叶',     price: 180, unit: '吨', from: '烟叶' },
    // 金属（冶金产出 / 工厂消耗）
    { code: 'steel',       name: '钢材',     price: 180, unit: '吨', from: '炼钢' },
    { code: 'ironR',       name: '生铁',     price: 120, unit: '吨', from: '炼铁' },
    { code: 'copperR',     name: '铜锭',     price: 300, unit: '吨', from: '炼铜' },
    { code: 'alum',        name: '铝锭',     price: 250, unit: '吨', from: '炼铝' },
    { code: 'zincR',       name: '锌锭',     price: 200, unit: '吨', from: '炼锌' },
    { code: 'leadR',       name: '铅锭',     price: 180, unit: '吨', from: '炼铅' },
    { code: 'tinR',        name: '锡锭',     price: 450, unit: '吨', from: '炼锡' },
    { code: 'tungR',       name: '钨锭',     price: 800, unit: '吨', from: '炼钨' },
    { code: 'alloy',       name: '铝合金材', price: 350, unit: '吨', from: '铝合金' },
    { code: 'precious_m',  name: '贵金属锭', price: 2000, unit: '吨', from: '贵金属冶炼' }
  ],

  /* ===== 仓库容量配置 ===== */
  // 每套仓库地产的容量
  warehouseCapacityPerUnit: 5000,   // 每套仓库可存 5000 单位原料

  /* ===== 股票-行业映射（用于新闻联动） ===== */
  stockSectorMap: {
    LYKY: 'mining', ZSYT: 'mining', JXME: 'mining',
    FLNY: 'farm', BYNK: 'farm', WTHJ: 'farm',
    AGYJ: 'metall', TBGF: 'metall', LVAL: 'metall',
    KCDZ: 'factory', DFJQ: 'factory', HSPC: 'factory',
    HNZY: 'pharma', FBYY: 'pharma', LKSW: 'pharma',
    ZKBD: 'tech', TXKJ: 'tech',
    BLGF: 'consume', GNLY: 'consume',
    JSYH: 'finance', TBTB: 'finance'
  },

  /* ===== 行业中文名映射 ===== */
  sectorNames: {
    mining: '矿业能源', farm: '农业食品', metall: '冶金有色',
    factory: '制造工业', pharma: '医药生物', tech: '科技半导体',
    consume: '消费零售', finance: '金融'
  }
};

/* ===== 新闻事件库（覆盖 2018 上半年典型场景） ===== */
const NEWS_LIBRARY = [
  // 政策类
  { id: 'n001', type: 'policy', title: '央行定向降准 释放流动性',
    desc: '中国人民银行宣布定向降准，市场资金面宽松，利好股市整体情绪。',
    effects: { marketSentiment: 0.015 }, minDay: 0 },
  { id: 'n002', type: 'policy', title: '基建投资加码 冶金需求走强',
    desc: '国务院公布新一轮基建计划，钢铁、铜材需求预期上升。',
    effects: { sectors: { 'steel': 0.08, 'copperR': 0.06, 'iron': 0.05 } }, minDay: 0 },
  { id: 'n003', type: 'policy', title: '农业补贴政策落地',
    desc: '财政部下发农业补贴，种植户受益，粮食生产积极性提升。',
    effects: { sectors: { 'wheat': 0.04, 'rice': 0.04, 'corn': 0.04 } }, minDay: 20 },
  { id: 'n004', type: 'policy', title: '房地产调控收紧',
    desc: '多地出台限购限贷政策，住宅市场预期降温。',
    effects: { sectors: { 'residential': -0.07 } }, minDay: 40 },
  { id: 'n005', type: 'policy', title: '稀土出口管制加强',
    desc: '商务部加强对稀土出口的管控，稀土价格预期上涨。',
    effects: { sectors: { 'rare': 0.12 } }, minDay: 60 },

  // 灾害类
  { id: 'n010', type: 'disaster', title: '华北持续干旱 农业减产预警',
    desc: '主产区旱情加剧，小麦、玉米预期减产，粮价看涨。',
    effects: { sectors: { 'wheat': 0.12, 'corn': 0.09, 'soy': 0.03 } }, minDay: 30 },
  { id: 'n011', type: 'disaster', title: '南方暴雨 水稻产区受灾',
    desc: '连续强降雨影响水稻收割，产量预期下降。',
    effects: { sectors: { 'rice': 0.10 } }, minDay: 50 },
  { id: 'n012', type: 'disaster', title: '矿难事故 安全检查升级',
    desc: '某煤矿发生安全事故，全国煤矿安全大检查，短期供给收缩。',
    effects: { sectors: { 'coal': 0.08 } }, minDay: 25 },
  { id: 'n013', type: 'disaster', title: '台风登陆 棉花受损',
    desc: '强台风登陆主要产棉区，棉花品质受损。',
    effects: { sectors: { 'cotton': 0.11 } }, minDay: 70 },
  { id: 'n014', type: 'disaster', title: '禽流感疫情 饲料需求下降',
    desc: '禽流感疫情扩散，养殖业受损，玉米等饲料需求下滑。',
    effects: { sectors: { 'corn': -0.08 } }, minDay: 45 },

  // 市场类
  { id: 'n020', type: 'market', title: '钢铁库存高企 价格承压',
    desc: '社会库存连续四周累积，钢厂出货压力增大。',
    effects: { sectors: { 'steel': -0.06, 'iron': -0.04 } }, minDay: 15 },
  { id: 'n021', type: 'market', title: '电子消费品旺季到来',
    desc: '消费电子进入销售旺季，电子厂订单饱满。',
    effects: { sectors: { 'electr': 0.09 } }, minDay: 80 },
  { id: 'n022', type: 'market', title: '黄金避险需求上升',
    desc: '国际局势不确定性增加，黄金避险买盘活跃。',
    effects: { metals: { 'gold': 0.06 } }, minDay: 35 },
  { id: 'n023', type: 'market', title: '铜价突破新高',
    desc: '伦铜创阶段新高，国内炼铜企业利润改善。',
    effects: { sectors: { 'copperR': 0.07, 'copper': 0.05 } }, minDay: 55 },
  { id: 'n024', type: 'market', title: '纺织出口订单增加',
    desc: '海外需求回暖，纺织厂订单排到下季度。',
    effects: { sectors: { 'textile': 0.08, 'cotton': 0.04 } }, minDay: 65 },
  { id: 'n025', type: 'market', title: '食品价格季节性上涨',
    desc: '春节临近，食品消费旺季，食品厂利润提升。',
    effects: { sectors: { 'food': 0.07, 'soy': 0.03 } }, minDay: 10 },

  // 国际类
  { id: 'n030', type: 'international', title: '中美贸易摩擦升温',
    desc: '美国宣布对华加征关税，大豆等农产品进口受影响。',
    effects: { sectors: { 'soy': 0.10, 'rare': 0.06 }, marketSentiment: -0.01 }, minDay: 20 },
  { id: 'n031', type: 'international', title: '国际油价上涨',
    desc: 'OPEC 减产协议延长，国际油价上行，运输成本增加。',
    effects: { sectors: { 'coal': 0.05, 'machine': -0.03 } }, minDay: 50 },
  { id: 'n032', type: 'international', title: '美联储加息 美元走强',
    desc: '美联储宣布加息，美元指数走强，黄金承压。',
    effects: { metals: { 'gold': -0.05, 'silver': -0.04 } }, minDay: 75 },
  { id: 'n033', type: 'international', title: '一带一路项目落地',
    desc: '多个一带一路基建项目正式开工，国内机械出口增加。',
    effects: { sectors: { 'machine': 0.08, 'steel': 0.05 } }, minDay: 90 }
];

window.DATA = DATA;
window.NEWS_LIBRARY = NEWS_LIBRARY;
