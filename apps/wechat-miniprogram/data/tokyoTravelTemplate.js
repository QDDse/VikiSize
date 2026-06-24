const tokyoTravelTemplate = {
  id: "template-travel-tokyo-8d-v1",
  name: "关东东京 8 天旅行小队",
  sourceName: "关东东京8天旅行计划.html",
  version: "1.0.0",
  createdAt: "2026-06-24T00:00:00.000Z",
  summary: "东京进出，覆盖浅草、涩谷、台场、镰仓、箱根、吉卜力、迪士尼海洋。",
  budgetCategories: [
    { id: "transport", name: "交通", estimatedCost: 5200, confirmedCost: 0 },
    { id: "lodging", name: "住宿", estimatedCost: 36000, confirmedCost: 0 },
    { id: "food", name: "餐饮", estimatedCost: 18000, confirmedCost: 0 },
    { id: "tickets", name: "门票", estimatedCost: 22000, confirmedCost: 0 },
    { id: "shopping", name: "购物", estimatedCost: 20000, confirmedCost: 0 },
    { id: "contingency", name: "机动", estimatedCost: 10000, confirmedCost: 0 }
  ],
  reminderSuggestions: [
    { id: "passport", title: "确认护照、入境材料和保险", leadDays: 60, type: "due_soon" },
    { id: "flight-hotel", title: "预订国际机票和东京酒店", leadDays: 45, type: "assigned_to_me" },
    { id: "ghibli", title: "抢三鹰之森吉卜力美术馆票", leadDays: 45, type: "needs_confirmation" },
    { id: "disney", title: "购买迪士尼海洋日期票", leadDays: 30, type: "assigned_to_me" },
    { id: "views", title: "预约 SHIBUYA SKY / 晴空塔 / teamLab", leadDays: 14, type: "needs_confirmation" },
    { id: "hakone-weather", title: "确认箱根天气与交通", leadDays: 7, type: "due_soon" }
  ],
  taskSeeds: [
    { title: "预订东京酒店", description: "确认新宿或东京站周边住宿，便于后续换乘。", status: "todo", category: "hotels", estimate: 36000 },
    { title: "购买迪士尼海洋门票", description: "按最终返程安排选择日期票。", status: "pending_confirmation", category: "tickets", estimate: 16000 },
    { title: "预约 teamLab / SHIBUYA SKY", description: "优先锁定傍晚或雨天更稳的时段。", status: "todo", category: "tickets", estimate: 9000 },
    { title: "准备箱根交通方案", description: "确认 Hakone Freepass、浪漫特快和天气备选。", status: "in_progress", category: "transport", estimate: 6100 },
    { title: "整理出发打包清单", description: "雨具、转换插头、常用药、轻便鞋。", status: "todo", category: "packing", estimate: 0 },
    { title: "确认餐厅和重点预约", description: "新宿、浅草、台场、吉祥寺优先保留备选。", status: "todo", category: "restaurants", estimate: 0 }
  ],
  days: [
    {
      id: "day1",
      date: "2026-09-24",
      weekday: "周四",
      theme: "抵达东京 · 新宿夜景轻量适应",
      tip: "首日只安排一个夜景点，给入境、取行李和交通留足时间。",
      nodes: [
        { id: "d1-arrive", period: "下午", time: "14:00-17:00", title: "抵达东京并进城", location: "成田/羽田 → 新宿", route: "N'EX / 京急 / 东京单轨", booking: "提前 45 天", estimatedCost: 5200, notes: "东京站或新宿站作为第一晚落脚点。" },
        { id: "d1-walk", period: "傍晚", time: "17:30-18:40", title: "新宿御苑周边散步", location: "新宿", route: "JR/地铁到新宿", booking: "", estimatedCost: 500, notes: "飞行后用平缓散步恢复节奏。" },
        { id: "d1-view", period: "晚上", time: "19:30-21:00", title: "东京都厅展望室", location: "东京都厅", route: "新宿站步行", booking: "", estimatedCost: 0, notes: "免费夜景，适合作为到达东京的第一眼。" }
      ]
    },
    {
      id: "day2",
      date: "2026-09-25",
      weekday: "周五",
      theme: "浅草 · 晴空塔 · 隅田川",
      tip: "上午去浅草避开人潮，午后进商场或展望台避雨避热。",
      nodes: [
        { id: "d2-asakusa", period: "上午", time: "08:30-11:00", title: "浅草寺与雷门", location: "浅草", route: "银座线/浅草线", booking: "", estimatedCost: 0, notes: "早到更适合拍照。" },
        { id: "d2-kappabashi", period: "中午", time: "11:20-13:00", title: "合羽桥道具街", location: "合羽桥", route: "浅草步行", booking: "", estimatedCost: 0, notes: "适合买轻便伴手礼。" },
        { id: "d2-skytree", period: "傍晚", time: "16:30-19:30", title: "东京晴空塔", location: "押上", route: "东武/地铁", booking: "提前 14 天", estimatedCost: 2100, notes: "傍晚上塔可同时看白天、日落和夜景。" }
      ]
    },
    {
      id: "day3",
      date: "2026-09-26",
      weekday: "周六",
      theme: "涩谷 · 原宿 · 表参道",
      tip: "周六人多，上午先明治神宫，下午再进商圈。",
      nodes: [
        { id: "d3-meiji", period: "上午", time: "08:30-10:30", title: "明治神宫", location: "原宿", route: "JR 原宿站步行", booking: "", estimatedCost: 0, notes: "森林参道适合慢走。" },
        { id: "d3-omotesando", period: "中午", time: "11:00-14:30", title: "表参道与青山咖啡", location: "表参道", route: "步行", booking: "", estimatedCost: 0, notes: "设计店、咖啡和轻购物集中。" },
        { id: "d3-shibuya", period: "傍晚", time: "16:30-19:30", title: "涩谷十字路口 / SHIBUYA SKY", location: "涩谷", route: "JR/地铁", booking: "提前 14 天", estimatedCost: 2200, notes: "都市感最强的一晚。" }
      ]
    },
    {
      id: "day4",
      date: "2026-09-27",
      weekday: "周日",
      theme: "台场 · teamLab · 东京湾夜景",
      tip: "周日把核心订票点放在午后，上午睡到自然醒也不影响。",
      nodes: [
        { id: "d4-tsukiji", period: "上午", time: "09:30-11:30", title: "筑地场外市场", location: "筑地", route: "日比谷线/大江户线", booking: "", estimatedCost: 0, notes: "用海鲜小吃和玉子烧当早午餐。" },
        { id: "d4-teamlab", period: "中午", time: "13:00-15:30", title: "teamLab Planets Tokyo", location: "新丰洲", route: "百合海鸥线", booking: "提前 14 天", estimatedCost: 4000, notes: "沉浸式光影和水中展区。" },
        { id: "d4-odaiba", period: "傍晚", time: "16:30-19:30", title: "台场海滨公园与彩虹桥", location: "台场", route: "百合海鸥线", booking: "", estimatedCost: 0, notes: "东京湾夕景稳定。" }
      ]
    },
    {
      id: "day5",
      date: "2026-09-28",
      weekday: "周一",
      theme: "镰仓 · 江之岛海边一日",
      tip: "海边行程受风雨影响大，若早上预报强降雨就换成东京室内日。",
      nodes: [
        { id: "d5-komachi", period: "上午", time: "09:30-12:00", title: "小町通与鹤冈八幡宫", location: "镰仓", route: "JR 湘南新宿线/横须贺线", booking: "", estimatedCost: 0, notes: "从车站一路逛到神社。" },
        { id: "d5-daibutsu", period: "中午", time: "12:30-14:00", title: "镰仓大佛 高德院", location: "长谷", route: "江之电", booking: "", estimatedCost: 300, notes: "露天大佛是镰仓代表点。" },
        { id: "d5-enoshima", period: "傍晚", time: "15:30-18:30", title: "江之岛与片濑西滨", location: "江之岛", route: "江之电/小田急", booking: "", estimatedCost: 0, notes: "晴天有机会远望富士山。" }
      ]
    },
    {
      id: "day6",
      date: "2026-09-29",
      weekday: "周二",
      theme: "箱根温泉 · 芦之湖 · 富士山远景",
      tip: "箱根是交通最复杂的一天，前一晚确认缆车、海盗船和天气。",
      nodes: [
        { id: "d6-hakone", period: "上午", time: "07:30-09:30", title: "新宿出发至箱根汤本", location: "箱根汤本", route: "小田急线/浪漫特快", booking: "提前 7 天", estimatedCost: 6100, notes: "通票更省心。" },
        { id: "d6-owakudani", period: "中午", time: "11:00-13:00", title: "大涌谷", location: "大涌谷", route: "登山电车+缆车+索道", booking: "", estimatedCost: 0, notes: "开放受天气影响。" },
        { id: "d6-lake", period: "傍晚", time: "14:00-17:30", title: "芦之湖与箱根神社", location: "芦之湖", route: "海盗船/巴士", booking: "", estimatedCost: 0, notes: "天气好时是最开阔的风景。" }
      ]
    },
    {
      id: "day7",
      date: "2026-09-30",
      weekday: "周三",
      theme: "吉卜力 · 吉祥寺 · 秋叶原",
      tip: "吉卜力票最难，抢不到就改国立新美术馆或东京国立博物馆。",
      nodes: [
        { id: "d7-ghibli", period: "上午", time: "10:00-12:30", title: "三鹰之森吉卜力美术馆", location: "三鹰", route: "JR 到三鹰/吉祥寺", booking: "提前 45 天", estimatedCost: 1000, notes: "预约制让体验更完整。" },
        { id: "d7-kichijoji", period: "中午", time: "12:40-15:30", title: "井之头公园与吉祥寺", location: "吉祥寺", route: "步行", booking: "", estimatedCost: 0, notes: "公园、杂货、咖啡适合放慢节奏。" },
        { id: "d7-akihabara", period: "傍晚", time: "17:00-20:00", title: "秋叶原电器街", location: "秋叶原", route: "JR 中央线转山手/总武线", booking: "", estimatedCost: 0, notes: "适合最后一晚购物。" }
      ]
    },
    {
      id: "day8",
      date: "2026-10-01",
      weekday: "周四",
      theme: "迪士尼海洋或轻量返程",
      tip: "如果当天晚航班，可只做上午东京站/上野；若多留一晚，迪士尼海洋放今天最顺。",
      nodes: [
        { id: "d8-disney", period: "上午", time: "08:30-12:30", title: "东京迪士尼海洋", location: "舞滨", route: "JR 京叶线 + Disney Resort Line", booking: "提前 30 天", estimatedCost: 7900, notes: "情侣更推荐 DisneySea。" },
        { id: "d8-marunouchi", period: "中午", time: "11:00-14:00", title: "东京站与丸之内", location: "东京站", route: "JR/地铁", booking: "", estimatedCost: 0, notes: "适合买伴手礼、寄存行李。" },
        { id: "d8-airport", period: "下午", time: "15:00-18:00", title: "前往机场返程", location: "成田/羽田", route: "N'EX / 京急 / 东京单轨", booking: "提前 3 天", estimatedCost: 3000, notes: "国际航班建议至少提前 3 小时到机场。" }
      ]
    }
  ]
};

module.exports = {
  tokyoTravelTemplate
};
