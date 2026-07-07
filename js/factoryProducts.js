/* factoryProducts.js — 工厂产品系统：每个工厂的具象化产品定义、配方、产出 */

const FactoryProducts = {

  /* ===== 产品定义：每个工厂 10 个产品 ===== */
  data: {
    food: [
      { code: 'bread',    name: '面包',   tier: 'basic', sellPrice: 85,  recipe: [{ code: 'wheat', qty: 0.8 }], output: { code: 'food_bread', qty: 1.0 }, unit: '箱' },
      { code: 'biscuit',  name: '饼干',   tier: 'basic', sellPrice: 95,  recipe: [{ code: 'wheat', qty: 0.7 }, { code: 'soy', qty: 0.3 }], output: { code: 'food_biscuit', qty: 1.0 }, unit: '箱' },
      { code: 'noodles',  name: '方便面', tier: 'mid',   sellPrice: 110, recipe: [{ code: 'wheat', qty: 1.0 }, { code: 'rape', qty: 0.2 }], output: { code: 'food_noodles', qty: 1.0 }, unit: '箱' },
      { code: 'tofu',     name: '豆腐',   tier: 'basic', sellPrice: 70,  recipe: [{ code: 'soy', qty: 0.5 }], output: { code: 'food_tofu', qty: 1.0 }, unit: '箱' },
      { code: 'food_oil', name: '食用油', tier: 'mid',   sellPrice: 115, recipe: [{ code: 'rape', qty: 1.0 }], output: { code: 'food_oil', qty: 1.0 }, unit: '桶' },
      { code: 'sugar',    name: '白糖',   tier: 'basic', sellPrice: 90,  recipe: [{ code: 'sugarc', qty: 1.2 }], output: { code: 'food_sugar', qty: 1.0 }, unit: '袋' },
      { code: 'candy',    name: '糖果',   tier: 'high',  sellPrice: 160, recipe: [{ code: 'sugarc', qty: 1.0 }, { code: 'fruit', qty: 0.25 }], output: { code: 'food_candy', qty: 1.0 }, unit: '箱' },
      { code: 'jam',      name: '果酱',   tier: 'mid',   sellPrice: 105, recipe: [{ code: 'fruit', qty: 0.6 }], output: { code: 'food_jam', qty: 1.0 }, unit: '箱' },
      { code: 'chips',    name: '薯片',   tier: 'basic', sellPrice: 80,  recipe: [{ code: 'corn', qty: 0.9 }], output: { code: 'food_chips', qty: 1.0 }, unit: '箱' },
      { code: 'seasoning',name: '调味品', tier: 'high',  sellPrice: 140, recipe: [{ code: 'wheat', qty: 0.5 }, { code: 'soy', qty: 0.4 }, { code: 'rape', qty: 0.2 }], output: { code: 'food_seasoning', qty: 1.0 }, unit: '箱' }
    ],
    textile: [
      { code: 'cloth',    name: '棉布',   tier: 'basic', sellPrice: 65,  recipe: [{ code: 'cotton', qty: 0.8 }], output: { code: 'txt_cloth', qty: 1.0 }, unit: '匹' },
      { code: 'silk',     name: '丝绸',   tier: 'high',  sellPrice: 140, recipe: [{ code: 'cotton', qty: 0.75 }], output: { code: 'txt_silk', qty: 1.0 }, unit: '匹' },
      { code: 'fiber',    name: '化纤',   tier: 'basic', sellPrice: 60,  recipe: [{ code: 'coal', qty: 0.6 }], output: { code: 'txt_fiber', qty: 1.0 }, unit: '吨' },
      { code: 'denim',    name: '牛仔布', tier: 'mid',   sellPrice: 90,  recipe: [{ code: 'cotton', qty: 0.9 }], output: { code: 'txt_denim', qty: 1.0 }, unit: '匹' },
      { code: 'wool',     name: '毛料',   tier: 'high',  sellPrice: 130, recipe: [{ code: 'cotton', qty: 1.0 }], output: { code: 'txt_wool', qty: 1.0 }, unit: '匹' },
      { code: 'knit',     name: '针织品', tier: 'basic', sellPrice: 55,  recipe: [{ code: 'cotton', qty: 0.7 }], output: { code: 'txt_knit', qty: 1.0 }, unit: '件' },
      { code: 'socks',    name: '袜子',   tier: 'basic', sellPrice: 50,  recipe: [{ code: 'cotton', qty: 0.5 }], output: { code: 'txt_socks', qty: 1.0 }, unit: '箱' },
      { code: 'towel',    name: '毛巾',   tier: 'mid',   sellPrice: 80,  recipe: [{ code: 'cotton', qty: 0.8 }], output: { code: 'txt_towel', qty: 1.0 }, unit: '箱' },
      { code: 'sheet',    name: '床单',   tier: 'mid',   sellPrice: 95,  recipe: [{ code: 'cotton', qty: 1.0 }], output: { code: 'txt_sheet', qty: 1.0 }, unit: '套' },
      { code: 'curtain',  name: '窗帘',   tier: 'high',  sellPrice: 120, recipe: [{ code: 'cotton', qty: 1.0 }], output: { code: 'txt_curtain', qty: 1.0 }, unit: '套' }
    ],
    machine: [
      { code: 'farm',      name: '农机',     tier: 'basic', sellPrice: 120, recipe: [{ code: 'steel', qty: 0.8 }], output: { code: 'mac_farm', qty: 1.0 }, unit: '台' },
      { code: 'engineering',name: '工程机械', tier: 'high',  sellPrice: 280, recipe: [{ code: 'steel', qty: 1.2 }, { code: 'ironR', qty: 0.4 }], output: { code: 'mac_eng', qty: 1.0 }, unit: '台' },
      { code: 'auto',      name: '汽车零件', tier: 'high',  sellPrice: 300, recipe: [{ code: 'steel', qty: 1.0 }, { code: 'alum', qty: 0.6 }], output: { code: 'mac_auto', qty: 1.0 }, unit: '套' },
      { code: 'lathe',     name: '机床',     tier: 'high',  sellPrice: 320, recipe: [{ code: 'steel', qty: 1.5 }, { code: 'ironR', qty: 0.8 }], output: { code: 'mac_lathe', qty: 1.0 }, unit: '台' },
      { code: 'pump',      name: '泵阀',     tier: 'basic', sellPrice: 110, recipe: [{ code: 'steel', qty: 0.6 }], output: { code: 'mac_pump', qty: 1.0 }, unit: '台' },
      { code: 'bearing',   name: '轴承',     tier: 'mid',   sellPrice: 180, recipe: [{ code: 'steel', qty: 0.8 }], output: { code: 'mac_bearing', qty: 1.0 }, unit: '套' },
      { code: 'gear',      name: '齿轮',     tier: 'mid',   sellPrice: 190, recipe: [{ code: 'steel', qty: 0.9 }], output: { code: 'mac_gear', qty: 1.0 }, unit: '套' },
      { code: 'spring',    name: '弹簧',     tier: 'basic', sellPrice: 100, recipe: [{ code: 'steel', qty: 0.5 }], output: { code: 'mac_spring', qty: 1.0 }, unit: '箱' },
      { code: 'pipe_m',    name: '管道',     tier: 'basic', sellPrice: 115, recipe: [{ code: 'steel', qty: 0.7 }], output: { code: 'mac_pipe', qty: 1.0 }, unit: '根' },
      { code: 'tools',     name: '工具',     tier: 'mid',   sellPrice: 165, recipe: [{ code: 'steel', qty: 0.8 }, { code: 'ironR', qty: 0.3 }], output: { code: 'mac_tools', qty: 1.0 }, unit: '套' }
    ],
    electr: [
      { code: 'phone',     name: '手机',   tier: 'high',  sellPrice: 420, recipe: [{ code: 'copperR', qty: 0.6 }, { code: 'alum', qty: 0.4 }, { code: 'rare_earth', qty: 0.015 }], output: { code: 'ele_phone', qty: 1.0 }, unit: '台' },
      { code: 'pc',        name: '电脑',   tier: 'high',  sellPrice: 380, recipe: [{ code: 'copperR', qty: 0.8 }, { code: 'alum', qty: 0.5 }], output: { code: 'ele_pc', qty: 1.0 }, unit: '台' },
      { code: 'tv',        name: '电视',   tier: 'mid',   sellPrice: 250, recipe: [{ code: 'copperR', qty: 0.5 }, { code: 'alum', qty: 0.3 }], output: { code: 'ele_tv', qty: 1.0 }, unit: '台' },
      { code: 'speaker',   name: '音响',   tier: 'mid',   sellPrice: 200, recipe: [{ code: 'copperR', qty: 0.4 }, { code: 'alum', qty: 0.2 }], output: { code: 'ele_speaker', qty: 1.0 }, unit: '台' },
      { code: 'ac',        name: '空调',   tier: 'high',  sellPrice: 350, recipe: [{ code: 'copperR', qty: 0.7 }, { code: 'alum', qty: 0.4 }, { code: 'rare_earth', qty: 0.005 }], output: { code: 'ele_ac', qty: 1.0 }, unit: '台' },
      { code: 'fridge',    name: '冰箱',   tier: 'mid',   sellPrice: 280, recipe: [{ code: 'copperR', qty: 0.6 }, { code: 'alum', qty: 0.3 }], output: { code: 'ele_fridge', qty: 1.0 }, unit: '台' },
      { code: 'washer',    name: '洗衣机', tier: 'mid',   sellPrice: 260, recipe: [{ code: 'copperR', qty: 0.5 }, { code: 'alum', qty: 0.3 }], output: { code: 'ele_washer', qty: 1.0 }, unit: '台' },
      { code: 'fan',       name: '电风扇', tier: 'basic', sellPrice: 120, recipe: [{ code: 'copperR', qty: 0.3 }], output: { code: 'ele_fan', qty: 1.0 }, unit: '台' },
      { code: 'router',    name: '路由器', tier: 'basic', sellPrice: 160, recipe: [{ code: 'copperR', qty: 0.4 }, { code: 'alum', qty: 0.2 }], output: { code: 'ele_router', qty: 1.0 }, unit: '台' },
      { code: 'charger',   name: '充电器', tier: 'basic', sellPrice: 110, recipe: [{ code: 'copperR', qty: 0.3 }], output: { code: 'ele_charger', qty: 1.0 }, unit: '个' }
    ],
    fert: [
      { code: 'nitro',    name: '氮肥',       tier: 'basic', sellPrice: 85,  recipe: [{ code: 'phos_ore', qty: 0.8 }, { code: 'coal', qty: 0.4 }], output: { code: 'fert_nitro', qty: 1.0 }, unit: '袋' },
      { code: 'phos_f',   name: '磷肥',       tier: 'basic', sellPrice: 90,  recipe: [{ code: 'phos_ore', qty: 1.0 }], output: { code: 'fert_phos', qty: 1.0 }, unit: '袋' },
      { code: 'potass',   name: '钾肥',       tier: 'basic', sellPrice: 88,  recipe: [{ code: 'limestone', qty: 1.0 }, { code: 'coal', qty: 0.5 }], output: { code: 'fert_pot', qty: 1.0 }, unit: '袋' },
      { code: 'compound', name: '复合肥',     tier: 'mid',   sellPrice: 145, recipe: [{ code: 'phos_ore', qty: 1.2 }, { code: 'coal', qty: 0.6 }], output: { code: 'fert_comp', qty: 1.0 }, unit: '袋' },
      { code: 'organic',  name: '有机肥',     tier: 'mid',   sellPrice: 135, recipe: [{ code: 'veg', qty: 1.5 }], output: { code: 'fert_org', qty: 1.0 }, unit: '袋' },
      { code: 'foliar',   name: '叶面肥',     tier: 'high',  sellPrice: 200, recipe: [{ code: 'phos_ore', qty: 1.8 }, { code: 'coal', qty: 0.3 }], output: { code: 'fert_foliar', qty: 1.0 }, unit: '瓶' },
      { code: 'slow_r',   name: '缓释肥',     tier: 'high',  sellPrice: 220, recipe: [{ code: 'phos_ore', qty: 2.0 }, { code: 'coal', qty: 0.8 }], output: { code: 'fert_slow', qty: 1.0 }, unit: '袋' },
      { code: 'water_f',  name: '水溶肥',     tier: 'mid',   sellPrice: 150, recipe: [{ code: 'phos_ore', qty: 1.3 }], output: { code: 'fert_water', qty: 1.0 }, unit: '桶' },
      { code: 'bio_f',    name: '生物肥',     tier: 'high',  sellPrice: 240, recipe: [{ code: 'phos_ore', qty: 1.0 }, { code: 'fruit', qty: 0.3 }], output: { code: 'fert_bio', qty: 1.0 }, unit: '袋' },
      { code: 'trace',    name: '微量元素肥', tier: 'high',  sellPrice: 230, recipe: [{ code: 'phos_ore', qty: 1.5 }, { code: 'iron', qty: 0.3 }], output: { code: 'fert_trace', qty: 1.0 }, unit: '袋' }
    ],
    paper: [
      { code: 'news',    name: '新闻纸', tier: 'basic', sellPrice: 75,  recipe: [{ code: 'wood_bamboo', qty: 1.5 }, { code: 'coal', qty: 0.3 }], output: { code: 'pap_news', qty: 1.0 }, unit: '令' },
      { code: 'print_p', name: '打印纸', tier: 'basic', sellPrice: 80,  recipe: [{ code: 'wood_pine', qty: 1.2 }, { code: 'coal', qty: 0.3 }], output: { code: 'pap_print', qty: 1.0 }, unit: '令' },
      { code: 'pack_p',  name: '包装纸', tier: 'basic', sellPrice: 70,  recipe: [{ code: 'wood_bamboo', qty: 1.0 }, { code: 'coal', qty: 0.2 }], output: { code: 'pap_pack', qty: 1.0 }, unit: '令' },
      { code: 'toilet',  name: '卫生纸', tier: 'basic', sellPrice: 65,  recipe: [{ code: 'wood_pine', qty: 0.8 }, { code: 'coal', qty: 0.2 }], output: { code: 'pap_toilet', qty: 1.0 }, unit: '提' },
      { code: 'box_p',   name: '纸箱',   tier: 'mid',   sellPrice: 140, recipe: [{ code: 'wood_bamboo', qty: 1.2 }, { code: 'wood_pine', qty: 0.5 }, { code: 'coal', qty: 0.3 }], output: { code: 'pap_box', qty: 1.0 }, unit: '个' },
      { code: 'cup_p',   name: '纸杯',   tier: 'mid',   sellPrice: 130, recipe: [{ code: 'wood_pine', qty: 1.0 }, { code: 'coal', qty: 0.3 }], output: { code: 'pap_cup', qty: 1.0 }, unit: '箱' },
      { code: 'tissue',  name: '纸巾',   tier: 'basic', sellPrice: 75,  recipe: [{ code: 'wood_pine', qty: 0.8 }, { code: 'coal', qty: 0.2 }], output: { code: 'pap_tissue', qty: 1.0 }, unit: '提' },
      { code: 'bag_p',   name: '纸袋',   tier: 'mid',   sellPrice: 135, recipe: [{ code: 'wood_bamboo', qty: 1.0 }, { code: 'coal', qty: 0.2 }], output: { code: 'pap_bag', qty: 1.0 }, unit: '个' },
      { code: 'board',   name: '纸板',   tier: 'high',  sellPrice: 190, recipe: [{ code: 'wood_bamboo', qty: 1.5 }, { code: 'wood_pine', qty: 0.8 }, { code: 'coal', qty: 0.4 }], output: { code: 'pap_board', qty: 1.0 }, unit: '张' },
      { code: 'carton',  name: '纸盒',   tier: 'high',  sellPrice: 180, recipe: [{ code: 'wood_pine', qty: 1.2 }, { code: 'coal', qty: 0.3 }], output: { code: 'pap_carton', qty: 1.0 }, unit: '个' }
    ],
    cement: [
      { code: 'ordinary', name: '普通水泥', tier: 'basic', sellPrice: 130, recipe: [{ code: 'limestone', qty: 2.0 }, { code: 'coal', qty: 0.5 }], output: { code: 'cem_ordinary', qty: 1.0 }, unit: '吨' },
      { code: 'special',  name: '特种水泥', tier: 'high',  sellPrice: 280, recipe: [{ code: 'limestone', qty: 3.0 }, { code: 'coal', qty: 0.8 }, { code: 'iron', qty: 0.3 }], output: { code: 'cem_special', qty: 1.0 }, unit: '吨' },
      { code: 'pipe_c',   name: '水泥管',   tier: 'mid',   sellPrice: 180, recipe: [{ code: 'limestone', qty: 2.2 }, { code: 'coal', qty: 0.5 }], output: { code: 'cem_pipe', qty: 1.0 }, unit: '根' },
      { code: 'slab',     name: '水泥板',   tier: 'mid',   sellPrice: 170, recipe: [{ code: 'limestone', qty: 2.0 }, { code: 'coal', qty: 0.5 }], output: { code: 'cem_slab', qty: 1.0 }, unit: '块' },
      { code: 'pile',     name: '水泥桩',   tier: 'high',  sellPrice: 300, recipe: [{ code: 'limestone', qty: 3.0 }, { code: 'coal', qty: 0.8 }, { code: 'iron', qty: 0.3 }], output: { code: 'cem_pile', qty: 1.0 }, unit: '根' },
      { code: 'brick',    name: '水泥砖',   tier: 'basic', sellPrice: 120, recipe: [{ code: 'limestone', qty: 1.5 }, { code: 'coal', qty: 0.3 }], output: { code: 'cem_brick', qty: 1.0 }, unit: '块' },
      { code: 'tile_c',   name: '水泥瓦',   tier: 'basic', sellPrice: 125, recipe: [{ code: 'limestone', qty: 1.8 }, { code: 'coal', qty: 0.4 }], output: { code: 'cem_tile', qty: 1.0 }, unit: '块' },
      { code: 'column',   name: '水泥柱',   tier: 'mid',   sellPrice: 190, recipe: [{ code: 'limestone', qty: 2.5 }, { code: 'coal', qty: 0.6 }], output: { code: 'cem_column', qty: 1.0 }, unit: '根' },
      { code: 'beam',     name: '水泥梁',   tier: 'high',  sellPrice: 290, recipe: [{ code: 'limestone', qty: 2.8 }, { code: 'coal', qty: 0.7 }, { code: 'iron', qty: 0.2 }], output: { code: 'cem_beam', qty: 1.0 }, unit: '根' },
      { code: 'block',    name: '水泥块',   tier: 'basic', sellPrice: 115, recipe: [{ code: 'limestone', qty: 1.5 }, { code: 'coal', qty: 0.3 }], output: { code: 'cem_block', qty: 1.0 }, unit: '块' }
    ],
    furn: [
      { code: 'table',    name: '木桌',   tier: 'basic', sellPrice: 90,  recipe: [{ code: 'wood_cedar', qty: 0.7 }, { code: 'rubber', qty: 0.1 }], output: { code: 'fur_table', qty: 1.0 }, unit: '张' },
      { code: 'chair',    name: '木椅',   tier: 'basic', sellPrice: 80,  recipe: [{ code: 'wood_pine', qty: 0.6 }, { code: 'rubber', qty: 0.1 }], output: { code: 'fur_chair', qty: 1.0 }, unit: '把' },
      { code: 'bed',      name: '木床',   tier: 'high',  sellPrice: 210, recipe: [{ code: 'wood_rosewood', qty: 0.6 }, { code: 'cotton', qty: 0.3 }], output: { code: 'fur_bed', qty: 1.0 }, unit: '张' },
      { code: 'cabinet',  name: '木柜',   tier: 'mid',   sellPrice: 150, recipe: [{ code: 'wood_walnut', qty: 0.8 }, { code: 'rubber', qty: 0.15 }], output: { code: 'fur_cabinet', qty: 1.0 }, unit: '个' },
      { code: 'shelf',    name: '木架',   tier: 'basic', sellPrice: 70,  recipe: [{ code: 'wood_pine', qty: 0.5 }], output: { code: 'fur_shelf', qty: 1.0 }, unit: '个' },
      { code: 'box_f',    name: '木箱',   tier: 'basic', sellPrice: 75,  recipe: [{ code: 'wood_pine', qty: 0.5 }], output: { code: 'fur_box', qty: 1.0 }, unit: '个' },
      { code: 'stool',    name: '木凳',   tier: 'basic', sellPrice: 60,  recipe: [{ code: 'wood_pine', qty: 0.4 }], output: { code: 'fur_stool', qty: 1.0 }, unit: '张' },
      { code: 'coffee',   name: '木几',   tier: 'mid',   sellPrice: 140, recipe: [{ code: 'wood_cedar', qty: 0.7 }, { code: 'rubber', qty: 0.1 }], output: { code: 'fur_coffee', qty: 1.0 }, unit: '张' },
      { code: 'screen',   name: '木屏风', tier: 'high',  sellPrice: 190, recipe: [{ code: 'wood_walnut', qty: 1.0 }, { code: 'cotton', qty: 0.2 }], output: { code: 'fur_screen', qty: 1.0 }, unit: '扇' },
      { code: 'cabinet2', name: '电视柜', tier: 'mid',   sellPrice: 145, recipe: [{ code: 'wood_cedar', qty: 0.9 }, { code: 'rubber', qty: 0.15 }], output: { code: 'fur_cabinet2', qty: 1.0 }, unit: '个' }
    ],
    brew: [
      { code: 'baijiu',   name: '白酒',   tier: 'high',  sellPrice: 280, recipe: [{ code: 'sorghum', qty: 1.2 }, { code: 'wheat', qty: 0.3 }], output: { code: 'brew_baijiu', qty: 1.0 }, unit: '箱' },
      { code: 'beer',     name: '啤酒',   tier: 'basic', sellPrice: 120, recipe: [{ code: 'wheat', qty: 0.9 }, { code: 'fruit', qty: 0.06 }], output: { code: 'brew_beer', qty: 1.0 }, unit: '箱' },
      { code: 'red_w',    name: '红酒',   tier: 'high',  sellPrice: 260, recipe: [{ code: 'fruit', qty: 1.5 }], output: { code: 'brew_red', qty: 1.0 }, unit: '箱' },
      { code: 'rice_w',   name: '黄酒',   tier: 'mid',   sellPrice: 170, recipe: [{ code: 'rice', qty: 1.2 }, { code: 'wheat', qty: 0.2 }], output: { code: 'brew_rice', qty: 1.0 }, unit: '箱' },
      { code: 'mijiu',    name: '米酒',   tier: 'basic', sellPrice: 100, recipe: [{ code: 'rice', qty: 1.1 }], output: { code: 'brew_mijiu', qty: 1.0 }, unit: '箱' },
      { code: 'fruit_w',  name: '果酒',   tier: 'mid',   sellPrice: 180, recipe: [{ code: 'fruit', qty: 1.2 }], output: { code: 'brew_fruit', qty: 1.0 }, unit: '箱' },
      { code: 'med_w',    name: '药酒',   tier: 'high',  sellPrice: 270, recipe: [{ code: 'sorghum', qty: 0.9 }, { code: 'fruit', qty: 0.2 }], output: { code: 'brew_med', qty: 1.0 }, unit: '箱' },
      { code: 'cooking',  name: '料酒',   tier: 'basic', sellPrice: 90,  recipe: [{ code: 'rice', qty: 0.7 }, { code: 'wheat', qty: 0.12 }], output: { code: 'brew_cooking', qty: 1.0 }, unit: '箱' },
      { code: 'cocktail', name: '鸡尾酒', tier: 'high',  sellPrice: 250, recipe: [{ code: 'sorghum', qty: 0.6 }, { code: 'fruit', qty: 0.6 }], output: { code: 'brew_cocktail', qty: 1.0 }, unit: '箱' },
      { code: 'sparkle',  name: '汽酒',   tier: 'mid',   sellPrice: 160, recipe: [{ code: 'wheat', qty: 0.6 }, { code: 'fruit', qty: 0.5 }], output: { code: 'brew_sparkle', qty: 1.0 }, unit: '箱' }
    ],
    feed: [
      { code: 'pig',      name: '猪饲料', tier: 'basic', sellPrice: 85,  recipe: [{ code: 'corn', qty: 1.2 }, { code: 'soy', qty: 0.6 }], output: { code: 'feed_pig', qty: 1.0 }, unit: '袋' },
      { code: 'chicken',  name: '鸡饲料', tier: 'basic', sellPrice: 80,  recipe: [{ code: 'corn', qty: 1.1 }, { code: 'soy', qty: 0.5 }], output: { code: 'feed_chicken', qty: 1.0 }, unit: '袋' },
      { code: 'duck',     name: '鸭饲料', tier: 'basic', sellPrice: 78,  recipe: [{ code: 'corn', qty: 1.0 }, { code: 'soy', qty: 0.4 }], output: { code: 'feed_duck', qty: 1.0 }, unit: '袋' },
      { code: 'goose',    name: '鹅饲料', tier: 'basic', sellPrice: 75,  recipe: [{ code: 'corn', qty: 1.0 }, { code: 'soy', qty: 0.4 }], output: { code: 'feed_goose', qty: 1.0 }, unit: '袋' },
      { code: 'cattle',   name: '牛饲料', tier: 'mid',   sellPrice: 130, recipe: [{ code: 'corn', qty: 1.5 }, { code: 'soy', qty: 0.7 }], output: { code: 'feed_cattle', qty: 1.0 }, unit: '袋' },
      { code: 'sheep',    name: '羊饲料', tier: 'mid',   sellPrice: 120, recipe: [{ code: 'corn', qty: 1.3 }, { code: 'soy', qty: 0.7 }], output: { code: 'feed_sheep', qty: 1.0 }, unit: '袋' },
      { code: 'rabbit',   name: '兔饲料', tier: 'basic', sellPrice: 70,  recipe: [{ code: 'corn', qty: 0.9 }, { code: 'soy', qty: 0.3 }], output: { code: 'feed_rabbit', qty: 1.0 }, unit: '袋' },
      { code: 'fish_f',   name: '鱼饲料', tier: 'high',  sellPrice: 150, recipe: [{ code: 'corn', qty: 1.7 }, { code: 'soy', qty: 0.9 }], output: { code: 'feed_fish', qty: 1.0 }, unit: '袋' },
      { code: 'shrimp_f', name: '虾饲料', tier: 'high',  sellPrice: 160, recipe: [{ code: 'corn', qty: 1.8 }, { code: 'soy', qty: 1.1 }], output: { code: 'feed_shrimp', qty: 1.0 }, unit: '袋' },
      { code: 'crab_f',   name: '蟹饲料', tier: 'high',  sellPrice: 170, recipe: [{ code: 'corn', qty: 1.9 }, { code: 'soy', qty: 1.2 }], output: { code: 'feed_crab', qty: 1.0 }, unit: '袋' }
    ]
  },

  /* ===== 等级名称映射 ===== */
  tierNames: { basic: '基础', mid: '中端', high: '高端' },
  tierColors: { basic: '#9a9a9f', mid: '#185fa5', high: '#ba7517' },

  /* ===== 初始化：将产品注入 DATA 和成品注入 rawMaterials ===== */
  init() {
    if (!window.DATA) return;
    // 为每个工厂类型注入 products
    const factoryCats = DATA.industries.factory.categories;
    factoryCats.forEach(cat => {
      const products = this.data[cat.code];
      if (products) cat.products = products;
    });
    // 注入成品到 rawMaterials
    if (!DATA.rawMaterials) DATA.rawMaterials = [];
    this._forEachProduct((factoryCode, product) => {
      // 避免重复注入
      if (!DATA.rawMaterials.find(m => m.code === product.output.code)) {
        DATA.rawMaterials.push({
          code: product.output.code,
          name: product.name,
          price: product.sellPrice,
          unit: product.unit,
          from: this.getFactoryName(factoryCode),
          category: 'finished'
        });
      }
    });
  },

  /* ===== 查找辅助 ===== */
  getFactoryName(factoryCode) {
    const cat = DATA.industries.factory.categories.find(c => c.code === factoryCode);
    return cat ? cat.name : factoryCode;
  },

  getProduct(factoryCode, productCode) {
    const products = this.data[factoryCode];
    if (!products) return null;
    return products.find(p => p.code === productCode) || null;
  },

  getProducts(factoryCode) {
    return this.data[factoryCode] || [];
  },

  /* 获取工厂的总基础日收入（所有产品 sellPrice 之和 / 产品数） */
  factoryAvgSellPrice(factoryCode) {
    const products = this.data[factoryCode];
    if (!products || products.length === 0) return 0;
    let sum = 0;
    products.forEach(p => { sum += p.sellPrice; });
    return sum / products.length;
  },

  /* 遍历所有产品 */
  _forEachProduct(callback) {
    Object.keys(this.data).forEach(factoryCode => {
      this.data[factoryCode].forEach(product => {
        callback(factoryCode, product);
      });
    });
  },

  /* 获取某产品的原料满足率 */
  productSatisfaction(factoryCode, productCode, lineCount) {
    const product = this.getProduct(factoryCode, productCode);
    if (!product) return 1.0;
    const inv = State.data.inventory || {};
    let minSat = 1.0;
    product.recipe.forEach(req => {
      const have = inv[req.code] || 0;
      const need = req.qty * lineCount;
      const sat = need > 0 ? Math.min(1, have / need) : 1;
      minSat = Math.min(minSat, sat);
    });
    return minSat;
  },

  /* 消耗某产品的原料 */
  consumeProductMaterials(factoryCode, productCode, lineCount, satisfaction) {
    const product = this.getProduct(factoryCode, productCode);
    if (!product) return;
    if (!State.data.inventory) return;
    product.recipe.forEach(req => {
      const consume = req.qty * lineCount * satisfaction;
      State.data.inventory[req.code] = (State.data.inventory[req.code] || 0) - consume;
      if (State.data.inventory[req.code] <= 0.01) delete State.data.inventory[req.code];
    });
  },

  /* 生产成品到仓库 */
  produceProductOutput(factoryCode, productCode, lineCount, satisfaction) {
    const product = this.getProduct(factoryCode, productCode);
    if (!product || !product.output) return;
    const outputQty = product.output.qty * lineCount * satisfaction;
    if (outputQty <= 0) return;
    const free = Employees.warehouseFree();
    const stored = Math.min(outputQty, free);
    const overflow = outputQty - stored;
    if (!State.data.inventory) State.data.inventory = {};
    if (stored > 0) {
      State.data.inventory[product.output.code] = (State.data.inventory[product.output.code] || 0) + stored;
    }
    return { stored, overflow, outputCode: product.output.code, sellPrice: product.sellPrice };
  },

  /* 计算某产品的日收入 */
  productDailyIncome(factoryCode, productCode, lineCount, empMult, levelMult) {
    const product = this.getProduct(factoryCode, productCode);
    if (!product) return 0;
    const satisfaction = this.productSatisfaction(factoryCode, productCode, lineCount);
    return product.sellPrice * lineCount * (empMult || 0) * (levelMult || 1) * satisfaction;
  },

  /* 获取某工厂已分配的总生产线数 */
  allocatedLines(factoryCode) {
    const owned = State.data.industries.find(i => i.type === 'factory' && i.category === factoryCode);
    if (!owned || !owned.products) return 0;
    let total = 0;
    Object.values(owned.products).forEach(qty => { total += qty; });
    return total;
  },

  /* 获取某工厂的总产能 */
  totalCapacity() {
    return Pages.industry._totalCapacity('factory');
  },

  /* 获取某工厂的剩余产能 */
  freeCapacity() {
    return this.totalCapacity() - Pages.industry._usedCapacity('factory');
  },

  /* 格式化配方描述 */
  formatRecipe(recipe) {
    if (!recipe || recipe.length === 0) return '无原料';
    return recipe.map(r => {
      const mat = DATA.rawMaterials.find(m => m.code === r.code);
      return (mat ? mat.name : r.code) + ' x' + r.qty;
    }).join(' + ');
  },

  /* 单批生产（3 秒一批，用于工厂实时结算） */
  produceBatch(ind, empMult, levelMult) {
    if (!ind || !ind.products) return 0;
    const factoryCode = ind.category;
    let totalIncome = 0;
    Object.entries(ind.products).forEach(([prodCode, lineCount]) => {
      if (lineCount <= 0) return;
      const product = this.getProduct(factoryCode, prodCode);
      if (!product) return;
      const satisfaction = this.productSatisfaction(factoryCode, prodCode, lineCount);
      // 消耗原材料
      this.consumeProductMaterials(factoryCode, prodCode, lineCount, satisfaction);
      // 产出成品到仓库
      this.produceProductOutput(factoryCode, prodCode, lineCount, satisfaction);
      // 单批产量 = lineCount × empMult × levelMult × satisfaction × 0.05
      const batchIncome = product.sellPrice * lineCount * (empMult || 0) * (levelMult || 1) * satisfaction * 0.05;
      totalIncome += batchIncome;
    });
    return totalIncome;
  },

  /* 获取工厂总日收入（基于产品分配） */
  factoryDailyIncome(factoryCode) {
    const owned = State.data.industries.find(i => i.type === 'factory' && i.category === factoryCode);
    if (!owned || !owned.products) return 0;
    const empMult = Employees.multiplier('factory', factoryCode);
    if (empMult <= 0) return 0;
    const levelMult = Engine.levelMultiplier(owned.level || 1);
    let total = 0;
    Object.entries(owned.products).forEach(([prodCode, lineCount]) => {
      if (lineCount <= 0) return;
      total += this.productDailyIncome(factoryCode, prodCode, lineCount, empMult, levelMult);
    });
    return total;
  }
};

/* 运行时初始化 */
FactoryProducts.init();

window.FactoryProducts = FactoryProducts;
