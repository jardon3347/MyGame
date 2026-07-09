/* data.js — 静态数据：产业、股票、贵金属、新闻事件库 */

const DATA = {
  maxIndustryLevel: 5,
  /* ===== 难度配置 ===== */
  difficulties: {
    easy:   { name: '简单', cash: 500000,  desc: '资金充足，适合熟悉玩法' },
    normal: { name: '中等', cash: 500000,  desc: '标准体验，推荐首次玩家' },
    hard:   { name: '困难', cash: 250000,  desc: '白手起家，精打细算' }
  },

  /* ===== 金融板块 ===== */
  bank: {
    baseRate: 0.015,          // 基准年利率 1.5%（2026年央行1年期存款基准）
    rateMin: 0.005,          // 最低利率 0.5%
    rateMax: 0.08,           // 最高利率 8%
    loanRateMultiplier: 2.5, // 贷款利率 = 存款利率 × 2.5（约3.75%≈LPR）
    maxLoanRatio: 0.5,       // 最高贷款 = 现金 × 0.5
    rateDriftPerDay: 0.0003,  // 每日利率自然漂移幅度（±0.03%/天）
    creditRatings: {
      A: { name: 'AAA', assetRatio: 0.5, rateMultiplier: 1.5 },
      B: { name: 'AA',  assetRatio: 0.4, rateMultiplier: 2.0 },
      C: { name: 'A',   assetRatio: 0.3, rateMultiplier: 2.5 },
      D: { name: 'B',   assetRatio: 0.2, rateMultiplier: 3.0 }
    },
    defaultCredit: 'B',
    creditUpgradeDays: 90,    // 连续 90 天无贷款可升级
    creditDowngradeDays: 30   // 连续 30 天有贷款未还清可降级
  },

  /* ===== 经济周期系统 ===== */
  economicCycle: {
    phases: [
      { id: 'boom',       name: '繁荣', minDays: 25, maxDays: 45,
        productMult: 1.20, materialMult: 1.10, interestMult: 1.0, resignMult: 1.0, disasterMult: 0.5,
        newsTitle: '经济快讯：市场繁荣', newsDesc: '经济增长强劲，消费需求旺盛，产品价格大幅上涨。原料价格温和上升，员工离职率处于低位。' },
      { id: 'stable',     name: '平稳', minDays: 25, maxDays: 45,
        productMult: 1.00, materialMult: 1.00, interestMult: 1.0, resignMult: 1.0, disasterMult: 1.0,
        newsTitle: '经济快讯：市场平稳', newsDesc: '经济运行平稳，各项指标处于正常区间。' },
      { id: 'recession',  name: '衰退', minDays: 25, maxDays: 45,
        productMult: 0.80, materialMult: 0.90, interestMult: 1.5, resignMult: 2.0, disasterMult: 1.5,
        newsTitle: '经济快讯：进入衰退', newsDesc: '经济增速放缓，市场需求萎缩，产品价格承压下行。员工士气受挫，离职率上升。' },
      { id: 'depression', name: '萧条', minDays: 20, maxDays: 35,
        productMult: 0.65, materialMult: 0.80, interestMult: 2.0, resignMult: 4.0, disasterMult: 2.0,
        newsTitle: '经济快讯：深度萧条', newsDesc: '经济陷入深度萧条，产品价格暴跌，原料价格大幅下滑。贷款利息飙升，员工大量流失。' }
    ],
    rollbackChance: 0.3   // 阶段结束时30%概率回退到上一阶段
  },

  stocks: [
    // 矿业/能源类
    { code: 'LYKY',  name: '龙源矿业',   sector: 'mining',  basePrice: 15.0, industry: '煤炭采选',   desc: '国内领先煤炭生产商，业务覆盖开采、洗选、销售一体化运营。' },
    { code: 'ZSYT',  name: '中石原油',   sector: 'mining',  basePrice: 8.0,  industry: '石油开采',   desc: '上游油气勘探开发龙头，受国际油价波动影响显著。' },
    { code: 'JXME',  name: '江西煤业',   sector: 'mining',  basePrice: 7.5,  industry: '煤炭采选',   desc: '华东地区煤炭骨干企业，主营动力煤与焦煤。' },
    // 农业类
    { code: 'FLNY',  name: '丰乐农业',   sector: 'farm',    basePrice: 10.0, industry: '种植养殖',   desc: '一体化农业集团，覆盖种子、种植、加工全产业链。' },
    { code: 'BYNK',  name: '北原农牧',   sector: 'farm',    basePrice: 9.0,  industry: '种植养殖',   desc: '东北粮食主产区龙头企业，主营玉米大豆。' },
    { code: 'WTHJ',  name: '万通调料',   sector: 'farm',    basePrice: 18.0, industry: '食品加工',   desc: '调味品行业知名品牌，下游消费需求稳定。' },
    // 冶金类
    { code: 'AGYJ',  name: '鞍钢冶金',   sector: 'metall',  basePrice: 5.0,  industry: '钢铁冶炼',   desc: '大型钢铁联合企业，建材与特种钢双线布局。' },
    { code: 'TBGF',  name: '铜陵股份',   sector: 'metall',  basePrice: 12.0, industry: '有色金属',   desc: '国内铜冶炼龙头，受国际铜价影响较大。' },
    { code: 'LVAL',  name: '鲁丰铝业',   sector: 'metall',  basePrice: 8.0,  industry: '有色金属',   desc: '铝材加工企业，受益新能源轻量化趋势。' },
    // 工厂/制造类
    { code: 'KCDZ',  name: '科创电子',   sector: 'factory', basePrice: 22.0, industry: '消费电子',   desc: '消费电子代工龙头，海外订单饱满。' },
    { code: 'DFJQ',  name: '东方机械',   sector: 'factory', basePrice: 12.0, industry: '工程机械',   desc: '重型机械制造商，受益基建投资周期。' },
    { code: 'HSPC',  name: '华生汽车',   sector: 'factory', basePrice: 25.0, industry: '汽车制造',   desc: '自主品牌车企，新能源转型中。' },
    // 制药/医疗
    { code: 'HNZY',  name: '华润制药',   sector: 'pharma',  basePrice: 38.0, industry: '医药制造',   desc: '国内医药龙头，覆盖处方药与 OTC 双市场。' },
    { code: 'FBYY',  name: '复必医药',   sector: 'pharma',  basePrice: 30.0, industry: '医药制造',   desc: '创新药研发企业，管线丰富，研发投入大。' },
    { code: 'LKSW',  name: '联康生物',   sector: 'pharma',  basePrice: 15.0, industry: '生物科技',   desc: '生物制药新锐，专注疫苗与抗体药物。' },
    // 科技/半导体
    { code: 'ZKBD',  name: '中科半导',   sector: 'tech',    basePrice: 55.0, industry: '半导体',     desc: '国产芯片设计龙头，受益国产替代趋势。' },
    { code: 'TXKJ',  name: '通讯科技',   sector: 'tech',    basePrice: 28.0, industry: '5G通讯',     desc: '通信设备供应商，5G 基站建设核心受益标的。' },
    // 消费
    { code: 'BLGF',  name: '保利百货',   sector: 'consume', basePrice: 10.0, industry: '商业零售',   desc: '全国连锁百货集团，受益消费复苏。' },
    { code: 'GNLY',  name: '贵酿酒业',   sector: 'consume', basePrice: 180.0,industry: '白酒',       desc: '高端白酒品牌，毛利率高，现金流稳定。' },
    // 金融
    { code: 'JSYH',  name: '建设银行',   sector: 'finance', basePrice: 7.5,  industry: '银行',       desc: '国有大行，分红稳定，估值低防御性强。' },
    { code: 'TBTB',  name: '太平洋保',   sector: 'finance', basePrice: 25.0, industry: '保险',       desc: '综合保险集团，投资收益受市场波动影响。' }
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
    { code: 'gold',     name: '黄金', basePrice: 913,   volatility: 0.012 },
    { code: 'silver',   name: '白银', basePrice: 14,    volatility: 0.022 },
    { code: 'platinum', name: '铂金', basePrice: 637,   volatility: 0.018 }
  ],

  /* ===== 五大产业 × 细分品类（含产出配方，联动核心） ===== */
  industries: {
    farm: {
      name: '农业',
      icon: '🌾',
      unit: '亩',
      description: {
        title: '农业产出机制',
        content: '农业每日产出农产品存入仓库，供工厂消耗。\n\n• 小麦→食品厂/酿酒厂\n• 棉花→纺织厂\n• 大豆→饲料厂\n• 玉米→食品厂/饲料厂\n• 稻谷→酿酒厂/食品厂\n• 甘蔗→食品厂\n• 高粱→酿酒厂\n• 竹子/松木/杉木→造纸厂\n• 胡桃木/紫檀木/楠木→家具厂\n\n需要有仓库才能存放产出，仓库满则溢出自动售出。',
      },
      categories: [
        { code: 'wheat',   name: '小麦',  dailyIncome: 0,  cycle: '秋播夏收',  produces: { code: 'wheat',   qty: 1.5 } },
        { code: 'rice',    name: '水稻',  dailyIncome: 0,  cycle: '一年两熟',  produces: { code: 'rice',    qty: 1.5 } },
        { code: 'soy',     name: '大豆',  dailyIncome: 0,  cycle: '周期短',    produces: { code: 'soy',     qty: 1.2 } },
        { code: 'corn',    name: '玉米',  dailyIncome: 0,  cycle: '饲料刚需',  produces: { code: 'corn',    qty: 1.8 } },
        { code: 'cotton',  name: '棉花',  dailyIncome: 0,  cycle: '工业原料',  produces: { code: 'cotton',  qty: 0.5 } },
        { code: 'rape',    name: '油菜',  dailyIncome: 0,  cycle: '油料作物',  produces: { code: 'rape',    qty: 1.2 } },
        { code: 'sugarc',  name: '甘蔗',  dailyIncome: 0,  cycle: '糖料来源',  produces: { code: 'sugarc',  qty: 2.5 } },
        { code: 'tea',     name: '茶园',  dailyIncome: 0,  cycle: '经济作物',  produces: { code: 'tea',     qty: 0.15 } },
        { code: 'veg',     name: '蓔菜',  dailyIncome: 0,  cycle: '周期最短',  produces: { code: 'veg',     qty: 2 } },
        { code: 'fruit',   name: '果树',  dailyIncome: 0,  cycle: '多年生',    produces: { code: 'fruit',   qty: 0.4 } },
        { code: 'rubber',  name: '橡胶',  dailyIncome: 0,  cycle: '热带作物',  produces: { code: 'rubber',  qty: 0.25 } },
        { code: 'tobacco', name: '烟叶',  dailyIncome: 0,  cycle: '专卖作物',  produces: { code: 'tobacco', qty: 0.15 } },
        { code: 'sorghum', name: '高粱', dailyIncome: 0, cycle: '酿酒刚需', produces: { code: 'sorghum', qty: 1.5 } },
        { code: 'bamboo',   name: '竹林',   dailyIncome: 0,  cycle: '速生林',  produces: { code: 'wood_bamboo',   qty: 1.5 } },
        { code: 'pine',     name: '松林',   dailyIncome: 0,  cycle: '轮伐期',  produces: { code: 'wood_pine',     qty: 1 } },
        { code: 'cedar',    name: '杉木林', dailyIncome: 0,  cycle: '中速生长', produces: { code: 'wood_cedar',    qty: 0.6 } },
        { code: 'walnut',   name: '胡桃林', dailyIncome: 0,  cycle: '慢生硬木', produces: { code: 'wood_walnut',   qty: 0.2 } },
        { code: 'rosewood', name: '紫檀林', dailyIncome: 0, cycle: '珍稀硬木', produces: { code: 'wood_rosewood', qty: 0.08 } },
        { code: 'nanmu',    name: '楠木林', dailyIncome: 0, cycle: '顶级硬木', produces: { code: 'wood_nanmu',    qty: 0.04 } }
      ]
    },
    mining: {
      name: '矿业',
      icon: '⛏️',
      unit: '份',
      description: {
        title: '矿业产出机制',
        content: '矿业每日产出矿石存入仓库，供冶金消耗。\n\n• 铁矿石→炼钢/炼铁\n• 铜矿石→炼铜\n• 铝土矿→炼铝\n• 煤炭→炼钢/水泥厂\n• 金矿石/银矿石→贵金属冶炼\n\n首次购买矿场需支付许可证费用。许可证可升级，提升产出并降低维护成本。'
      },
      categories: [
        // cost = 原料单价 × 日产量 × 30天; licenseCost = cost × 3
        // yieldVolatility: 日产量波动率 ∈ [1-vol, 1+vol]
        { code: 'coal',   name: '煤矿',   cost: 60000,  licenseCost: 180000, dailyIncome: 0,   reserve: 3650, yieldVolatility: 0.08, produces: { code: 'coal',     qty: 2.5 } },
        { code: 'iron',   name: '铁矿',   cost: 39000,  licenseCost: 117000, dailyIncome: 0,  reserve: 2920, yieldVolatility: 0.08, produces: { code: 'iron',     qty: 2 } },
        { code: 'copper', name: '铜矿',   cost: 270000,  licenseCost: 810000, dailyIncome: 0,  reserve: 2555, yieldVolatility: 0.10, produces: { code: 'copper',   qty: 0.3 } },
        { code: 'gold',   name: '金矿',   cost: 68000, licenseCost: 204000, dailyIncome: 0,  reserve: 1825, yieldVolatility: 0.20, produces: { code: 'gold_ore', qty: 0.05 } },
        { code: 'silver', name: '银矿',   cost: 105000,  licenseCost: 315000, dailyIncome: 0,  reserve: 2190, yieldVolatility: 0.12, produces: { code: 'silver_ore', qty: 0.5 } },
        { code: 'rare',   name: '稀土',   cost: 35000, licenseCost: 105000, dailyIncome: 0,  reserve: 1095, yieldVolatility: 0.15, produces: { code: 'rare_earth', qty: 0.03 } },
        { code: 'baux',   name: '铝土矿', cost: 33000,  licenseCost: 99000, dailyIncome: 0,   reserve: 2920, yieldVolatility: 0.07, produces: { code: 'baux',     qty: 2 } },
        { code: 'tung',   name: '钨矿',   cost: 1260000, licenseCost: 3780000, dailyIncome: 0,  reserve: 1460, yieldVolatility: 0.12, produces: { code: 'tung',     qty: 0.15 } },
        { code: 'tin',    name: '锡矿',   cost: 1500000,  licenseCost: 4500000, dailyIncome: 0,  reserve: 2190, yieldVolatility: 0.10, produces: { code: 'tin',      qty: 0.2 } },
        { code: 'phos',   name: '磷矿',   cost: 60000,  licenseCost: 180000, dailyIncome: 0,   reserve: 3650, yieldVolatility: 0.06, produces: { code: 'phos_ore', qty: 2 } },
        { code: 'quartz', name: '石英矿', cost: 11000,  licenseCost: 33000, dailyIncome: 0,   reserve: 3285, yieldVolatility: 0.05, produces: { code: 'quartz_ore', qty: 1.5 } },
        { code: 'limestone', name: '石灰矿', cost: 9000, licenseCost: 27000, dailyIncome: 0, reserve: 5000, yieldVolatility: 0.05, produces: { code: 'limestone', qty: 3 } },
      ],
      licenseMaxLevel: 5
    },
    metall: {
      name: '冶金',
      icon: '🔥',
      unit: '单位产能',
      description: {
        title: '冶金联动机制',
        content: '冶金从仓库消费矿石，产出金属存入仓库供工厂使用。\n\n• 炼钢：铁矿石+煤炭→钢材\n• 炼铜：铜矿石→铜锭\n• 炼铝：铝土矿→铝锭\n• 贵金属冶炼：金矿石+银矿石→贵金属\n\n原料不足时产出按比例下降，需要矿业供应或从仓库购买。'
      },
      categories: [
        { code: 'steel',    name: '炼钢',       dailyIncome: 0,  produces: { code: 'steel',    qty: 1 } },
        { code: 'copperR',  name: '炼铜',       dailyIncome: 0,  produces: { code: 'copperR',  qty: 0.6 } },
        { code: 'alum',     name: '炼铝',       dailyIncome: 0,  produces: { code: 'alum',     qty: 0.7 } },
        { code: 'precious', name: '贵金属冶炼', dailyIncome: 0, produces: { code: 'precious_m', qty: 0.15 } },
        { code: 'ironR',    name: '炼铁',       dailyIncome: 0,  produces: { code: 'ironR',    qty: 1.2 } },
        { code: 'zincR',    name: '炼锌',       dailyIncome: 0,  produces: { code: 'zincR',    qty: 0.6 } },
        { code: 'leadR',    name: '炼铅',       dailyIncome: 0,  produces: { code: 'leadR',    qty: 0.6 } },
        { code: 'tinR',     name: '炼锡',       dailyIncome: 0,  produces: { code: 'tinR',     qty: 0.4 } },
        { code: 'tungR',    name: '炼钨',       dailyIncome: 0,  produces: { code: 'tungR',    qty: 0.3 } },
        { code: 'alloy',    name: '铝合金',     dailyIncome: 0,  produces: { code: 'alloy',    qty: 0.5 } }
      ]
    },
    factory: {
      name: '工厂',
      icon: '🏭',
      unit: '条生产线',
      description: {
        title: '工厂生产机制',
        content: '工厂从仓库消费原料（农产品+金属），产出成品可售出获利。\n\n• 食品厂：小麦+大豆+玉米\n• 纺织厂：棉花\n• 机械厂：钢材+生铁\n• 电子厂：铜锭+铝锭+稀土\n\n工厂需要分配产品才能生产，每3秒结算一批。原料不足时产出按比例下降。'
      },
      categories: [
        { code: 'food',    name: '食品厂',   dailyIncome: 0 },
        { code: 'textile', name: '纺织厂',   dailyIncome: 0 },
        { code: 'machine', name: '机械厂',   dailyIncome: 0 },
        { code: 'electr',  name: '电子厂',   dailyIncome: 0 },
        { code: 'fert',    name: '化肥厂',   dailyIncome: 0 },
        { code: 'paper',   name: '造纸厂',   dailyIncome: 0 },
        { code: 'cement',  name: '水泥厂',   dailyIncome: 0 },
        { code: 'furn',    name: '家具厂',   dailyIncome: 0 },
        { code: 'brew',    name: '酿酒厂',   dailyIncome: 0 },
        { code: 'feed',    name: '饲料厂',   dailyIncome: 0 }      ]
    },
    estate: {
      name: '地产',
      icon: '🏢',
      unit: '套',
      description: {
        title: '地产功能说明',
        content: '地产提供基础设施支持：\n\n• 住宅：每套容纳10名员工（可升级扩容）\n• 仓库：每套存5000单位原料（可升级扩容）\n• 农用地：农业产能前置\n• 工业用地：冶金产能前置\n• 产业园：工厂产能前置\n• 物流产业园：物流产能前置\n\n地产可升级，提升容量和收益。'
      },
      categories: [
        { code: 'residential', name: '住宅',       cost: 2000000, dailyIncome: 200 },
        { code: 'warehouse',   name: '仓库',       cost: 1200000,  dailyIncome: 200 },
        { code: 'farmland',    name: '农用地',     cost: 150000,  dailyIncome: 20 },
        { code: 'factory_land',name: '工业用地', cost: 800000,  dailyIncome: 100 },
        { code: 'industrial_park', name: '产业园', cost: 4500000, dailyIncome: 750 },
        { code: 'logistics_park',  name: '物流产业园', cost: 3000000, dailyIncome: 550 }
      ]
    },
    logistics: {
      name: '物流',
      icon: '🚛',
      unit: '站',
      description: {
        title: '物流规则系统',
        content: '物流站提供自动买卖规则，管理仓库库存。\n\n• 快递网点：仅自动卖出，入门级\n• 区域物流中心：支持自动买入+卖出\n• 智能物流港：全功能，含冷链成品管理\n\n每条规则占用1个槽位，等级越高槽位越多、手续费越低。'
      },
      categories: [
        { code: 'courier_station', name: '快递网点',      cost: 120000,  dailyIncome: 220,  slots: 5,  feeRate: 0.02 },
        { code: 'regional_center', name: '区域物流中心',  cost: 1200000, dailyIncome: 1800, slots: 15, feeRate: 0.01, canBuy: true },
        { code: 'smart_hub',       name: '智能物流港',    cost: 8000000,dailyIncome: 5500, slots: 30, feeRate: 0.005,canBuy: true, finishedOnly: true }
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
    gold: ['mining', 'gold', 'metal'], silver: ['mining', 'silver'], rare: ['mining', 'rare'], baux: ['mining', 'baux'],
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
    residential: ['estate', 'residential'], warehouse: ['estate', 'warehouse'],
    farmland: ['estate', 'farmland'],
    factory_land: ['estate', 'factory_land'],
    industrial_park: ['estate', 'industrial_park']
  },

  /* ===== 工厂配方：消耗仓库原料（农产品+金属） ===== */
  // 所有原料都从仓库出，和冶金一样
  factoryRecipes: {
    food:   [ { code: 'wheat', qty: 1.0 }, { code: 'soy', qty: 0.6 }, { code: 'corn', qty: 0.4 } ],
    brew:   [ { code: 'wheat', qty: 2.4 }, { code: 'fruit', qty: 0.4 } ],
    feed:   [ { code: 'corn', qty: 2.0 }, { code: 'soy', qty: 1.0 } ],
    textile:[ { code: 'cotton', qty: 1.6 } ],
    fert:   [ { code: 'phos_ore', qty: 0.8 }, { code: 'coal', qty: 0.4 } ],
    paper:  [ { code: 'veg', qty: 1.2 }, { code: 'corn', qty: 0.6 } ],
    cement: [ { code: 'coal', qty: 1.0 }, { code: 'iron', qty: 0.2 } ],
    furn:   [ { code: 'rubber', qty: 0.6 }, { code: 'cotton', qty: 0.4 } ],
    machine:[ { code: 'steel', qty: 0.8 }, { code: 'ironR', qty: 0.4 } ],
    electr: [ { code: 'copperR', qty: 0.6 }, { code: 'alum', qty: 0.4 }, { code: 'rare_earth', qty: 0.10 } ]
  },

  /* ===== 员工等级配置（按类分组，工资扁平化） ===== */
  /* ===== 招聘配置 ===== */
  recruit: {
    free: {
      cost: 0,
      tiers: [
        { min: 1.5, max: 2.5 },
        { min: 2.5, max: 3.5 },
        { min: 3.5, max: 4.5 },
        { min: 4.5, max: 5.5 }
      ]
    },
    paid: { cost: 2000, minMult: 3.0, maxMult: 5.5 }
  },

  /* ===== 冶金配方：消耗仓库矿石原料 ===== */
  smelterRecipes: {
    steel:    [ { code: 'iron', qty: 4.0 }, { code: 'coal', qty: 2.0 } ],
    ironR:    [ { code: 'iron', qty: 5.0 } ],
    copperR:  [ { code: 'copper', qty: 4.0 } ],
    alum:     [ { code: 'baux', qty: 5.0 } ],
    zincR:    [ { code: 'zinc_ore', qty: 4.0 } ],
    leadR:    [ { code: 'lead_ore', qty: 4.0 } ],
    tinR:     [ { code: 'tin', qty: 4.0 } ],
    tungR:    [ { code: 'tung', qty: 3.0 } ],
    precious: [ { code: 'gold_ore', qty: 1.0 }, { code: 'silver_ore', qty: 2.0 } ],
    alloy:    [ { code: 'baux', qty: 3.0 }, { code: 'copper', qty: 1.0 } ]
  },

  /* ===== 土地前置需求：产业→所需土地类型 ===== */
  landPrereqs: {
    farm:      { code: 'farmland',        name: '农用地' },
    factory:   { code: 'industrial_park', name: '产业园' },
    metall:    { code: 'factory_land',    name: '工业用地' },
    logistics: { code: 'logistics_park',  name: '物流产业园' }
  },

  /* ===== 产能配置 ===== */
  capacityPerLand: { farm: 12, metall: 10, factory: 10 },

  /* ===== 全部原料列表（矿石+农产品+金属，可买卖） ===== */
  /* 价格基于2026年7月中国市场真实现货价（¥/吨），来源：SMM/LME/国家统计局/发改委 */
  rawMaterials: [
    // 矿石（矿业产出 / 冶金消耗）
    { code: 'iron',        name: '铁矿石',   price: 650,   unit: '吨', from: '铁矿', volatility: 0.012 },
    { code: 'copper',      name: '铜矿石',   price: 30000, unit: '吨', from: '铜矿', volatility: 0.018 },
    { code: 'baux',        name: '铝土矿',   price: 550,   unit: '吨', from: '铝土矿', volatility: 0.010 },
    { code: 'coal',        name: '煤炭',     price: 800,   unit: '吨', from: '煤矿', volatility: 0.015 },
    { code: 'zinc_ore',    name: '锌矿石',   price: 14000, unit: '吨', from: '锌矿', volatility: 0.020 },
    { code: 'lead_ore',    name: '铅矿石',   price: 10000, unit: '吨', from: '铅矿', volatility: 0.018 },
    { code: 'tin',         name: '锡矿石',   price: 250000, unit: '吨', from: '锡矿', volatility: 0.022 },
    { code: 'tung',        name: '钨矿石',   price: 280000, unit: '吨', from: '钨矿', volatility: 0.020 },
    { code: 'gold_ore',    name: '金矿石',   price: 45000, unit: '吨', from: '金矿', volatility: 0.015 },
    { code: 'silver_ore',  name: '银矿石',   price: 7000,  unit: '吨', from: '银矿', volatility: 0.025 },
    { code: 'rare_earth',  name: '稀土矿',   price: 38500, unit: '吨', from: '稀土', volatility: 0.025 },
    { code: 'phos_ore',    name: '磷矿石',   price: 1000,  unit: '吨', from: '磷矿', volatility: 0.012 },
    { code: 'quartz_ore',  name: '石英石',   price: 250,   unit: '吨', from: '石英矿', volatility: 0.008 },
    // 农产品（农业产出 / 工厂消耗）
    { code: 'wheat',       name: '小麦',     price: 2450,  unit: '吨', from: '小麦', volatility: 0.010 },
    { code: 'rice',        name: '稻谷',     price: 2750,  unit: '吨', from: '水稻', volatility: 0.008 },
    { code: 'soy',         name: '大豆',     price: 5000,  unit: '吨', from: '大豆', volatility: 0.012 },
    { code: 'corn',        name: '玉米',     price: 2350,  unit: '吨', from: '玉米', volatility: 0.010 },
    { code: 'cotton',      name: '棉花',     price: 18600, unit: '吨', from: '棉花', volatility: 0.015 },
    { code: 'rape',        name: '油菜籽',   price: 6500,  unit: '吨', from: '油菜', volatility: 0.012 },
    { code: 'sugarc',      name: '甘蔗',     price: 500,   unit: '吨', from: '甘蔗', volatility: 0.010 },
    { code: 'tea',         name: '茶叶',     price: 50000, unit: '吨', from: '茶园', volatility: 0.018 },
    { code: 'veg',         name: '蔬菜',     price: 4000,  unit: '吨', from: '蔬菜', volatility: 0.015 },
    { code: 'fruit',       name: '水果',     price: 10000, unit: '吨', from: '果树', volatility: 0.015 },
    { code: 'rubber',      name: '橡胶',     price: 17700, unit: '吨', from: '橡胶', volatility: 0.018 },
    { code: 'tobacco',     name: '烟叶',     price: 30000, unit: '吨', from: '烟叶', volatility: 0.010 },
    { code: 'wood_bamboo',   name: '竹子',     price: 500,   unit: '吨', from: '竹林', volatility: 0.008 },
    { code: 'wood_pine',     name: '松木',     price: 1000,  unit: '吨', from: '松林', volatility: 0.008 },
    { code: 'wood_cedar',    name: '杉木',     price: 1300,  unit: '吨', from: '杉木林', volatility: 0.008 },
    { code: 'wood_walnut',   name: '胡桃木',   price: 16000, unit: '吨', from: '胡桃林', volatility: 0.012 },
    { code: 'wood_rosewood', name: '紫檀木',   price: 120000, unit: '吨', from: '紫檀林', volatility: 0.015 },
    { code: 'wood_nanmu',    name: '金丝楠木', price: 250000, unit: '吨', from: '楠木林', volatility: 0.018 },
    { code: 'limestone',     name: '石灰石',   price: 100,   unit: '吨', from: '石灰矿', volatility: 0.005 },
    { code: 'sorghum',       name: '高粱',     price: 2500,  unit: '吨', from: '高粱', volatility: 0.010 },
    // 金属（冶金产出 / 工厂消耗）
    { code: 'steel',       name: '钢材',     price: 3300,  unit: '吨', from: '炼钢', volatility: 0.012 },
    { code: 'ironR',       name: '生铁',     price: 3100,  unit: '吨', from: '炼铁', volatility: 0.012 },
    { code: 'copperR',     name: '铜锭',     price: 102500, unit: '吨', from: '炼铜', volatility: 0.018 },
    { code: 'alum',        name: '铝锭',     price: 23000, unit: '吨', from: '炼铝', volatility: 0.015 },
    { code: 'zincR',       name: '锌锭',     price: 24000, unit: '吨', from: '炼锌', volatility: 0.020 },
    { code: 'leadR',       name: '铅锭',     price: 16000, unit: '吨', from: '炼铅', volatility: 0.018 },
    { code: 'tinR',        name: '锡锭',     price: 411000, unit: '吨', from: '炼锡', volatility: 0.022 },
    { code: 'tungR',       name: '钨锭',     price: 550000, unit: '吨', from: '炼钨', volatility: 0.020 },
    { code: 'alloy',       name: '铝合金材', price: 24000, unit: '吨', from: '铝合金', volatility: 0.014 },
    { code: 'precious_m',  name: '贵金属锭', price: 550000, unit: '吨', from: '贵金属冶炼', volatility: 0.022 }
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


/* ===== 随机事件模板（非历史事件，用于新闻系统动态生成） ===== */
const RANDOM_EVENT_TEMPLATES = [
  // ---- 利率事件 ----
  { id: 'r001', type: 'rate', title: '央行加息', desc: '央行上调基准利率，存款收益上升但贷款成本增加。',
    effects: { interestRate: 0.015 }, minDay: 0 },
  { id: 'r002', type: 'rate', title: '央行降息', desc: '央行下调基准利率，存款收益下降但贷款成本减少。',
    effects: { interestRate: -0.01 }, minDay: 0 },
  { id: 'r003', type: 'rate', title: '市场利率走高', desc: '市场资金面收紧，利率自然上行。',
    effects: { interestRate: 0.008 }, minDay: 10 },
  { id: 'r004', type: 'rate', title: '流动性宽松', desc: '央行逆回购操作，市场利率下行。',
    effects: { interestRate: -0.007 }, minDay: 10 },

  // ---- 大盘情绪 ----
  { id: 'm001', type: 'market', title: '外资大举流入', desc: '北向资金单日净流入创纪录，市场情绪高涨。',
    effects: { marketSentiment: 0.03 }, minDay: 0 },
  { id: 'm002', type: 'market', title: '全球股市震荡', desc: '美股暴跌引发全球避险情绪，A股承压。',
    effects: { marketSentiment: -0.025 }, minDay: 15 },
  { id: 'm003', type: 'market', title: '政策利好密集出台', desc: '多项经济刺激政策集中发布，市场全面走强。',
    effects: { marketSentiment: 0.025, sectors: { 'steel': 0.05, 'copperR': 0.04, 'machine': 0.06 } }, minDay: 30 },
  { id: 'm004', type: 'market', title: '消费者信心指数大跌', desc: '消费数据不及预期，消费类股票承压。',
    effects: { marketSentiment: -0.02, sectors: { 'food': -0.05, 'textile': -0.04 } }, minDay: 20 },

  // ---- 行业事件 ----
  { id: 's001', type: 'sector', title: '新能源补贴加码', desc: '新能源汽车补贴标准提高，产业链受益。',
    effects: { sectors: { 'electr': 0.08, 'alum': 0.06, 'copperR': 0.05 } }, minDay: 25 },
  { id: 's002', type: 'sector', title: '粮食丰收预期', desc: '主产区气候适宜，粮食丰收在望，粮价承压。',
    effects: { sectors: { 'wheat': -0.06, 'corn': -0.05, 'rice': -0.04 } }, minDay: 40 },
  { id: 's003', type: 'sector', title: '芯片短缺加剧', desc: '全球半导体产能不足，芯片价格持续上涨。',
    effects: { sectors: { 'electr': 0.10, 'rare': 0.08 } }, minDay: 50 },
  { id: 's004', type: 'sector', title: '国际金价飙升', desc: '地缘冲突升级，避险资金涌入黄金市场。',
    effects: { metals: { 'gold': 0.10, 'silver': 0.08 } }, minDay: 35 },
  { id: 's005', type: 'sector', title: '纺织业出口遇冷', desc: '海外订单大幅下滑，纺织厂开工不足。',
    effects: { sectors: { 'textile': -0.08, 'cotton': -0.06 } }, minDay: 45 },
  { id: 's006', type: 'sector', title: '建材需求旺季', desc: '基建项目集中开工，水泥钢材需求激增。',
    effects: { sectors: { 'cement': 0.08, 'steel': 0.06, 'iron': 0.04 } }, minDay: 15 },
  { id: 's007', type: 'sector', title: '白酒消费旺季', desc: '节日临近，高端白酒销量大增。',
    effects: { sectors: { 'food': 0.06, 'soy': 0.03 } }, minDay: 60 },
  { id: 's008', type: 'sector', title: '房地产市场回暖', desc: '多地放宽限购，房地产交易量回升。',
    effects: { sectors: { 'residential': 0.07, 'steel': 0.04, 'cement': 0.05 } }, minDay: 70 },
  { id: 's009', type: 'sector', title: '煤炭需求旺季', desc: '冬季供暖需求增加，煤炭价格上行。',
    effects: { sectors: { 'coal': 0.08 } }, minDay: 80 },
  { id: 's010', type: 'sector', title: '化肥出口受限', desc: '化肥出口关税上调，国内价格承压。',
    effects: { sectors: { 'fert': -0.06, 'phos': -0.04 } }, minDay: 55 },

  // ---- 原料事件 ----
  { id: 'p001', type: 'material', title: '铁矿石涨价潮', desc: '澳大利亚铁矿石供应减少，价格跳涨。',
    effects: { materials: { 'iron': 0.15, 'steel': 0.08 } }, minDay: 20 },
  { id: 'p002', type: 'material', title: '铜进口关税下调', desc: '铜进口关税下调，国内铜价回落。',
    effects: { materials: { 'copper': -0.08, 'copperR': -0.05 } }, minDay: 30 },
  { id: 'p003', type: 'material', title: '稀土出口管制升级', desc: '稀土出口配额进一步收紧，价格预期大涨。',
    effects: { materials: { 'rare_earth': 0.20 } }, minDay: 50 },
  { id: 'p004', type: 'material', title: '棉花产区暴雨', desc: '主产区遭遇暴雨，棉花产量受损。',
    effects: { materials: { 'cotton': 0.12, 'textile': -0.04 } }, minDay: 40 },
  { id: 'p005', type: 'material', title: '原油价格暴跌', desc: 'OPEC增产超预期，油价大幅回落。',
    effects: { materials: { 'coal': -0.06, 'rubber': -0.04 }, sectors: { 'coal': -0.05 } }, minDay: 60 },
  { id: 'p006', type: 'material', title: '粮食进口增加', desc: '进口粮食到港量增加，国内粮价稳中有降。',
    effects: { materials: { 'wheat': -0.06, 'corn': -0.05, 'soy': -0.04 } }, minDay: 35 },
  { id: 'p007', type: 'material', title: '黄金避险需求爆发', desc: '国际局势紧张，黄金避险需求爆发式增长。',
    effects: { materials: { 'gold_ore': 0.18, 'precious_m': 0.15 }, metals: { 'gold': 0.12 } }, minDay: 80 },

  // ---- 综合事件 ----
  { id: 'c001', type: 'combo', title: '经济刺激一揽子计划', desc: '政府推出大规模经济刺激计划，股市全面走强，利率上行。',
    effects: { marketSentiment: 0.03, interestRate: 0.01, sectors: { 'steel': 0.06, 'machine': 0.05, 'cement': 0.05, 'electr': 0.04 } }, minDay: 90 },
  { id: 'c002', type: 'combo', title: '通货膨胀预期升温', desc: 'CPI数据超预期，通胀预期升温，贵金属受益，消费承压。',
    effects: { interestRate: 0.012, metals: { 'gold': 0.08, 'silver': 0.06 }, sectors: { 'food': -0.04, 'textile': -0.03 }, marketSentiment: -0.01 }, minDay: 45 },
  { id: 'c003', type: 'combo', title: '全球经济衰退担忧', desc: '主要经济体数据疲软，衰退担忧蔓延，避险资产受追捧。',
    effects: { marketSentiment: -0.03, interestRate: -0.01, metals: { 'gold': 0.06 } }, minDay: 65 },
  // ---- 产品需求事件 ----
  { id: 'p101', type: 'product', title: '食品安全事件爆发', desc: '某知名品牌被曝质量问题，消费者转向小品牌食品，食品类产品需求激增。',
    effects: { products: { bread: 2.0, biscuit: 1.8, noodles: 1.5, tofu: 1.6, food_oil: 1.4, seasoning: 1.3 } }, minDay: 20 },
  { id: 'p102', type: 'product', title: '智能手机换代潮', desc: '某科技巨头发布革命性新机，带动整个手机产业链需求暴涨。',
    effects: { products: { phone: 2.0, pc: 1.3, router: 1.5, charger: 1.8 } }, minDay: 30 },
  { id: 'p103', type: 'product', title: '纺织出口订单暴增', desc: '海外电商平台大促，中国纺织品出口订单激增。',
    effects: { products: { cloth: 1.8, silk: 2.0, denim: 1.6, wool: 1.5, knit: 1.4 } }, minDay: 25 },
  { id: 'p104', type: 'product', title: '白酒消费旺季', desc: '中秋国庆双节临近，白酒需求进入年度高峰。',
    effects: { products: { baijiu: 2.0, red_w: 1.8, fruit_w: 1.5 } }, minDay: 40 },
  { id: 'p105', type: 'product', title: '基建项目集中开工', desc: '多地公布大型基建计划，建材需求激增。',
    effects: { products: { ordinary: 1.8, special: 1.6, pipe_c: 1.4 } }, minDay: 15 },
  { id: 'p106', type: 'product', title: '家电以旧换新补贴', desc: '政府推出家电以旧换新补贴政策，白色家电销量暴涨。',
    effects: { products: { fridge: 2.0, washer: 1.8, ac: 1.6, fan: 1.5 } }, minDay: 35 },
  { id: 'p107', type: 'product', title: '宠物经济爆发', desc: '宠物食品和用品市场快速增长，饲料需求结构变化。',
    effects: { products: { pig: 1.3, chicken: 1.2, fish_f: 2.0, shrimp_f: 2.0, crab_f: 1.8 } }, minDay: 45 },
  { id: 'p108', type: 'product', title: '高端家具需求回暖', desc: '房地产市场回暖带动高端家具消费。',
    effects: { products: { bed: 2.0, cabinet: 1.6, screen: 1.8, table: 1.4 } }, minDay: 50 },
  { id: 'p109', type: 'product', title: '化肥出口受限', desc: '国际化肥供应紧张，国内化肥价格预期上涨。',
    effects: { products: { nitro: 1.8, compound: 1.6, organic: 2.0, slow_r: 1.5 } }, minDay: 55 },
  { id: 'p110', type: 'product', title: '造纸原料涨价', desc: '木材供应收紧，纸制品价格上调。',
    effects: { products: { news_p: 1.5, print_p: 1.4, board: 1.8, carton: 1.6 } }, minDay: 60 }
];

/* ===== 真实历史事件（2018—2025，按游戏天数触发） ===== */
// 游戏起始日 2018-01-01 = day 0；下方 minDay 为距今的大致天数
const NEWS_HISTORY = [
  { id: 'h001', type: 'international', title: '中美贸易摩擦升级',
    desc: '美国宣布对500亿美元中国商品加征25%关税，大豆等农产品出口受阻。', minDay: 80,
    effects: { sectors: { 'soy': 0.12, 'machine': -0.06, 'electr': -0.05 }, marketSentiment: -0.02 } },
  { id: 'h002', type: 'policy', title: '央行降准释放流动性',
    desc: '中国人民银行宣布下调存款准备金率1个百分点，释放约1.2万亿资金。', minDay: 100,
    effects: { marketSentiment: 0.02, interestRate: -0.01 } },
  { id: 'h003', type: 'international', title: '中兴通讯遭禁运',
    desc: '美国商务部禁止向中兴出口芯片，半导体国产替代预期升温。', minDay: 105,
    effects: { sectors: { 'electr': 0.08, 'rare': 0.06 }, marketSentiment: -0.015 } },
  { id: 'h004', type: 'policy', title: '资管新规正式落地',
    desc: '央行发布资管新规细则，银行理财打破刚兑，市场资金面短期偏紧。', minDay: 120,
    effects: { interestRate: 0.01, marketSentiment: -0.01 } },
  { id: 'h005', type: 'international', title: '中美互征关税生效',
    desc: '美国对340亿中国商品加征关税正式生效，中方同步反制。', minDay: 186,
    effects: { sectors: { 'soy': 0.08, 'machine': -0.05, 'electr': -0.04 }, marketSentiment: -0.02 } },
  { id: 'h006', type: 'disaster', title: '非洲猪瘟疫情扩散',
    desc: '全国多地爆发非洲猪瘟，生猪存栏大幅下降，饲料需求锐减。', minDay: 210,
    effects: { sectors: { 'corn': -0.10, 'soy': -0.08, 'food': -0.06 } } },
  { id: 'h007', type: 'policy', title: '科创板正式开板',
    desc: '科创板在上交所正式开板，注册制改革启动，科技股估值重塑。', minDay: 250,
    effects: { sectors: { 'electr': 0.10 }, marketSentiment: 0.03 } },
  { id: 'h008', type: 'market', title: '华为事件升级 全球供应链紧张',
    desc: '华为CFO在加拿大被扣留，中美科技战升级，半导体板块波动加剧。', minDay: 334,
    effects: { sectors: { 'electr': 0.12, 'rare': 0.10 }, marketSentiment: -0.025 } },
  { id: 'h009', type: 'policy', title: '中美达成第一阶段协议',
    desc: '中美签署第一阶段经贸协议，中方承诺增加自美进口，市场情绪回暖。', minDay: 380,
    effects: { marketSentiment: 0.025, sectors: { 'soy': -0.06 } } },
  { id: 'h010', type: 'international', title: '新冠全球大流行',
    desc: 'WHO宣布新冠疫情构成全球大流行，全球股市暴跌，避险情绪飙升。', minDay: 450,
    effects: { marketSentiment: -0.04, metals: { 'gold': 0.15 }, sectors: { 'food': 0.08, 'textile': -0.10 } } },
  { id: 'h011', type: 'disaster', title: '武汉封城 全国经济停摆',
    desc: '武汉因新冠疫情封城，全国经济活动骤减，多行业停工停产。', minDay: 752,
    effects: { marketSentiment: -0.05, sectors: { 'machine': -0.15, 'steel': -0.12, 'residential': -0.10 }, interestRate: -0.015 } },
  { id: 'h012', type: 'market', title: '全球股市熔断潮',
    desc: '沙特发动石油价格战叠加疫情恐慌，美股一周三次熔断，A股跟跌。', minDay: 790,
    effects: { marketSentiment: -0.04, metals: { 'gold': 0.10, 'silver': 0.05 } } },
  { id: 'h013', type: 'market', title: 'WTI原油期货跌至负值',
    desc: '纽约原油期货史上首次跌至负值，全球大宗商品市场剧烈震荡。', minDay: 840,
    effects: { sectors: { 'coal': -0.12, 'machine': -0.06 }, materials: { 'coal': -0.15, 'rubber': -0.10 } } },
  { id: 'h014', type: 'policy', title: '中国经济率先复苏',
    desc: '中国疫情控制得力，二季度GDP增速转正，全球资金加速流入A股。', minDay: 900,
    effects: { marketSentiment: 0.03, sectors: { 'machine': 0.08, 'steel': 0.06, 'electr': 0.05 } } },
  { id: 'h015', type: 'policy', title: '双碳目标正式提出',
    desc: '中国宣布2030碳达峰、2060碳中和目标，新能源产业链长期利好。', minDay: 1000,
    effects: { sectors: { 'alum': 0.06, 'copperR': 0.05, 'electr': 0.08 }, marketSentiment: 0.02 } },
  { id: 'h016', type: 'policy', title: '教培行业双减政策',
    desc: '中央出台"双减"政策，教培行业遭受毁灭性打击，消费板块受拖累。', minDay: 1300,
    effects: { marketSentiment: -0.025 } },
  { id: 'h017', type: 'market', title: '恒大债务危机爆发',
    desc: '恒大集团出现债务违约，地产板块全面承压，水泥钢材需求预期下滑。', minDay: 1362,
    effects: { sectors: { 'residential': -0.12, 'steel': -0.08, 'cement': -0.10, 'warehouse': -0.08 }, marketSentiment: -0.02 } },
  { id: 'h018', type: 'international', title: '俄乌冲突爆发',
    desc: '俄罗斯对乌克兰发动特别军事行动，全球能源和粮食价格飙升。', minDay: 1515,
    effects: { sectors: { 'wheat': 0.15, 'corn': 0.12, 'coal': 0.10 }, metals: { 'gold': 0.12 }, marketSentiment: -0.03 } },
  { id: 'h019', type: 'policy', title: '金融委会议稳定市场',
    desc: '国务院金融委会议释放积极信号，平台经济政策趋于明朗，中概股/港股反弹。', minDay: 1535,
    effects: { marketSentiment: 0.03 } },
  { id: 'h020', type: 'policy', title: '中国宣布放开疫情管控',
    desc: '"新十条"发布，长达三年的动态清零政策终结，消费板块强势反弹。', minDay: 1796,
    effects: { marketSentiment: 0.04, sectors: { 'food': 0.10, 'brew': 0.08, 'textile': 0.06 } } },
  { id: 'h021', type: 'international', title: '硅谷银行倒闭 全球金融震荡',
    desc: '美国硅谷银行突然倒闭，引发全球银行股抛售潮，避险资产受追捧。', minDay: 1889,
    effects: { marketSentiment: -0.03, metals: { 'gold': 0.08 }, interestRate: -0.005 } },
  { id: 'h022', type: 'policy', title: '史诗级经济刺激计划出台',
    desc: '央行降准降息+降低存量房贷利率+设立股市平准基金，A股放量大涨。', minDay: 2446,
    effects: { marketSentiment: 0.04, sectors: { 'residential': 0.10, 'steel': 0.08, 'machine': 0.06 }, interestRate: -0.02 } },
  { id: 'h023', type: 'international', title: '特朗普重返白宫 关税预期升温',
    desc: '特朗普赢得美国大选，市场担忧新一轮全面关税，出口导向行业承压。', minDay: 2564,
    effects: { sectors: { 'electr': -0.06, 'textile': -0.05, 'machine': -0.04 }, metals: { 'gold': 0.05 }, marketSentiment: -0.01 } }
];

/* ===== 整合全部事件到统一池（历史事件 + 预置模板） ===== */
// 此函数由 engine.js 的 rollNews 调用，传入当前 gameDay 返回可用事件池
function getNewsPool(gameDay) {
  let pool = [];
  // 历史事件：只在对应日期附近（±10天窗口内）且未超过时加入
  NEWS_HISTORY.forEach(n => {
    if (gameDay >= n.minDay && gameDay <= n.minDay + 10) {
      pool.push(n);
    }
  });
  // 预设新闻库（始终可用，受 minDay 限制）
  NEWS_LIBRARY.forEach(n => {
    if (gameDay >= n.minDay) pool.push(n);
  });
  // 随机事件模板（始终可用，受 minDay 限制）
  RANDOM_EVENT_TEMPLATES.forEach(n => {
    if (gameDay >= n.minDay) pool.push(n);
  });
  return pool;
}
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
window.NEWS_HISTORY = NEWS_HISTORY;
window.RANDOM_EVENT_TEMPLATES = RANDOM_EVENT_TEMPLATES;
window.getNewsPool = getNewsPool;