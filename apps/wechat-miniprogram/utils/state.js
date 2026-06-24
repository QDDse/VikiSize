const profile = {
  name: "微信用户",
  summary: "已保存 12 条尺码记录",
  height: "172cm",
  weight: "64kg",
  shoulder: "43cm"
};

const recentRecords = [
  {
    id: "jeans-l",
    title: "牛仔裤 / 推荐 L",
    time: "今天 14:20",
    tone: "soft-green"
  },
  {
    id: "shirt-m",
    title: "衬衫 / 推荐 M",
    time: "昨天 19:08",
    tone: "soft-blue"
  }
];

const shortcuts = [
  {
    id: "size-calc",
    title: "尺码计算",
    detail: "快速生成推荐",
    tone: "soft-blue",
    target: "/pages/services/index"
  },
  {
    id: "wardrobe",
    title: "衣橱档案",
    detail: "管理常穿尺码",
    tone: "soft-green",
    target: "/pages/records/index"
  },
  {
    id: "family",
    title: "家人管理",
    detail: "多人尺码记录",
    tone: "soft-amber",
    target: "/pages/profile/index"
  }
];

const serviceCategories = ["全部", "测量", "换算", "品牌", "旅游"];

const services = [
  {
    id: "travel-tokyo",
    title: "关东东京 8 天旅行计划",
    detail: "东京市区、镰仓、箱根、迪士尼海洋完整行程",
    tone: "soft-violet",
    target: "/pages/travel/index"
  },
  {
    id: "photo-measure",
    title: "拍照测量",
    detail: "用参考物估算关键围度",
    tone: "soft-green"
  },
  {
    id: "size-convert",
    title: "尺码换算",
    detail: "中美欧日尺码快速转换",
    tone: "soft-blue"
  },
  {
    id: "brand-library",
    title: "品牌尺码库",
    detail: "按品牌查看推荐规则",
    tone: "soft-amber"
  },
  {
    id: "outfit-advice",
    title: "搭配建议",
    detail: "根据身材生成穿搭提示",
    tone: "soft-violet"
  }
];

const travelPlan = {
  title: "关东东京 8 天旅行计划",
  kicker: "2026.09.24 出发 · 关东 · 8 天左右",
  subtitle: "东京进出方案：市区经典、台场夜景、镰仓海边、箱根温泉与迪士尼海洋。9 月下旬仍可能闷热下雨，户外尽量放在上午和傍晚。",
  summary: [
    { label: "天数", value: "8 天" },
    { label: "城市", value: "东京/关东" },
    { label: "节奏", value: "情侣轻量" }
  ],
  tips: [
    "同一天尽量只跨一个大区，避免把旅行排成通勤测试。",
    "9 月雨天多，箱根和镰仓遇强风大雨就改东京室内。",
    "每天保留 60-90 分钟机动时间，应对下雨、排队和临时购物。"
  ],
  reminders: [
    { id: "passport", item: "确认护照、签证/入境材料、旅行保险", leadDays: 60 },
    { id: "flight", item: "预订国际机票和东京酒店", leadDays: 45 },
    { id: "ghibli", item: "抢三鹰之森吉卜力美术馆 9 月票", leadDays: 45 },
    { id: "disney", item: "购买迪士尼海洋日期票", leadDays: 30 },
    { id: "views", item: "预约 SHIBUYA SKY / 晴空塔 / teamLab", leadDays: 14 },
    { id: "hakone", item: "确认箱根天气与交通，购买 Hakone Freepass", leadDays: 7 }
  ],
  days: [
    {
      id: "day1",
      date: "2026-09-24",
      weekday: "周四",
      theme: "抵达东京 · 新宿夜景轻量适应",
      tip: "首日只安排一个夜景点，给入境、取行李和交通留足时间。",
      slots: [
        { period: "下午", time: "14:00-17:00", name: "抵达东京并进城", note: "东京站或新宿站作为第一晚落脚点，后续移动最省心。", transport: "N'EX / 京急 / 东京单轨 · 20-80 分钟", ticket: "约 ¥500-5,200", booking: "提前 45 天" },
        { period: "傍晚", time: "17:30-18:40", name: "新宿御苑周边散步", note: "飞行后用平缓散步恢复节奏，晚间可直接转新宿吃饭。", transport: "JR/地铁到新宿", ticket: "入园参考 ¥500" },
        { period: "晚上", time: "19:30-21:00", name: "东京都厅展望室", note: "免费夜景，适合作为到达东京的第一眼。", transport: "新宿站步行 10-15 分钟", ticket: "免费" }
      ],
      dining: ["新宿つな八 总本店 · 天妇罗定食"]
    },
    {
      id: "day2",
      date: "2026-09-25",
      weekday: "周五",
      theme: "浅草 · 晴空塔 · 隅田川",
      tip: "上午去浅草避开人潮，午后进商场或展望台避雨避热。",
      slots: [
        { period: "上午", time: "08:30-11:00", name: "浅草寺与雷门", note: "东京最经典的下町氛围，早到更适合拍照。", transport: "银座线/浅草线", ticket: "免费" },
        { period: "中午", time: "11:20-13:00", name: "合羽桥道具街", note: "餐具、杯子、厨具和食品模型很好逛，适合买轻便伴手礼。", transport: "浅草步行 12 分钟", ticket: "免费" },
        { period: "傍晚", time: "16:30-19:30", name: "东京晴空塔", note: "傍晚上塔可同时看白天、日落和夜景。", transport: "东武/地铁", ticket: "天望甲板约 ¥2,100 起", booking: "提前 14 天" }
      ],
      dining: ["尾张屋 本店 · 天妇罗荞麦面", "浅草花月堂 · 菠萝包"]
    },
    {
      id: "day3",
      date: "2026-09-26",
      weekday: "周六",
      theme: "涩谷 · 原宿 · 表参道",
      tip: "周六人多，上午先明治神宫，下午再进商圈。",
      slots: [
        { period: "上午", time: "08:30-10:30", name: "明治神宫", note: "森林参道适合慢走，和涩谷商圈形成反差。", transport: "JR 原宿站步行", ticket: "免费" },
        { period: "中午", time: "11:00-14:30", name: "表参道与青山咖啡", note: "设计店、咖啡和轻购物集中，雨天也容易调整。", transport: "步行", ticket: "免费" },
        { period: "傍晚", time: "16:30-19:30", name: "涩谷 Scramble Crossing / SHIBUYA SKY", note: "涩谷十字路口和屋顶展望台组合，是都市感最强的一晚。", transport: "JR/银座线/半藏门线", ticket: "展望台约 ¥2,200 起", booking: "提前 14 天" }
      ],
      dining: ["Afuri 原宿 · 柚子盐拉面", "牛かつもと村 涩谷 · 牛炸牛排定食"]
    },
    {
      id: "day4",
      date: "2026-09-27",
      weekday: "周日",
      theme: "台场 · teamLab · 东京湾夜景",
      tip: "周日把核心订票点放在午后，上午睡到自然醒也不影响。",
      slots: [
        { period: "上午", time: "09:30-11:30", name: "筑地场外市场", note: "用海鲜小吃和玉子烧当早午餐，周日部分店休。", transport: "日比谷线/大江户线", ticket: "免费" },
        { period: "中午", time: "13:00-15:30", name: "teamLab Planets Tokyo", note: "沉浸式光影和水中展区适合情侣拍照。", transport: "百合海鸥线 新丰洲站", ticket: "成人票约 ¥4,000 起", booking: "提前 14 天" },
        { period: "傍晚", time: "16:30-19:30", name: "台场海滨公园与彩虹桥", note: "东京湾夕景稳定，累了可直接进商场吃饭。", transport: "百合海鸥线", ticket: "免费" }
      ],
      dining: ["筑地虎杖 鱼河岸千两 · 海鲜丼", "台场 Aqua City 餐厅区"]
    },
    {
      id: "day5",
      date: "2026-09-28",
      weekday: "周一",
      theme: "镰仓 · 江之岛海边一日",
      tip: "海边行程受风雨影响大，若早上预报强降雨就换成东京室内日。",
      slots: [
        { period: "上午", time: "09:30-12:00", name: "镰仓小町通与鹤冈八幡宫", note: "从车站一路逛到神社，节奏轻松，适合吃小食。", transport: "JR 湘南新宿线/横须贺线", ticket: "神社免费" },
        { period: "中午", time: "12:30-14:00", name: "镰仓大佛 高德院", note: "露天大佛是镰仓代表点，雨不大也能逛。", transport: "江之电 长谷站步行", ticket: "成人参考 ¥300" },
        { period: "傍晚", time: "15:30-18:30", name: "江之岛与片濑西滨", note: "晴天有机会远望富士山，傍晚海边比正午更舒服。", transport: "江之电/小田急", ticket: "户外免费" }
      ],
      dining: ["镰仓 松原庵 · 天妇罗荞麦", "江之岛商店街 · 章鱼仙贝"]
    },
    {
      id: "day6",
      date: "2026-09-29",
      weekday: "周二",
      theme: "箱根温泉 · 芦之湖 · 富士山远景",
      tip: "箱根是交通最复杂的一天，前一晚确认缆车、海盗船和天气。",
      slots: [
        { period: "上午", time: "07:30-09:30", name: "新宿出发至箱根汤本", note: "小田急浪漫特快更舒服，普通列车更省钱。", transport: "小田急线/浪漫特快", ticket: "Hakone Freepass 约 ¥6,100 起", booking: "提前 7 天" },
        { period: "中午", time: "11:00-13:00", name: "大涌谷", note: "火山地貌和黑鸡蛋是箱根经典，开放受天气影响。", transport: "登山电车+缆车+索道", ticket: "通票或分段购票" },
        { period: "傍晚", time: "14:00-17:30", name: "芦之湖与箱根神社", note: "天气好时是本行程最开阔的风景。", transport: "箱根海盗船/巴士", ticket: "神社免费" }
      ],
      dining: ["大涌谷食堂 · 黑鸡蛋", "新宿 思出横丁 · 烤鸡串"]
    },
    {
      id: "day7",
      date: "2026-09-30",
      weekday: "周三",
      theme: "吉卜力 · 吉祥寺 · 秋叶原",
      tip: "吉卜力票最难，抢不到就改国立新美术馆或东京国立博物馆。",
      slots: [
        { period: "上午", time: "10:00-12:30", name: "三鹰之森吉卜力美术馆", note: "小而精的动画美术馆，预约制让体验更完整。", transport: "JR 到三鹰/吉祥寺后步行或巴士", ticket: "成人 ¥1,000", booking: "提前 45 天" },
        { period: "中午", time: "12:40-15:30", name: "井之头公园与吉祥寺", note: "公园、杂货、咖啡和小店很适合放慢节奏。", transport: "步行", ticket: "免费" },
        { period: "傍晚", time: "17:00-20:00", name: "秋叶原电器街", note: "电子、手办、游戏和扭蛋集中，适合最后一晚购物。", transport: "JR 中央线转山手/总武线", ticket: "免费" }
      ],
      dining: ["Satou 吉祥寺 · 炸牛肉丸", "肉之万世 秋叶原 · 汉堡排"]
    },
    {
      id: "day8",
      date: "2026-10-01",
      weekday: "周四",
      theme: "迪士尼海洋或轻量返程",
      tip: "如果当天晚航班，可只做上午东京站/上野；若多留一晚，迪士尼海洋放今天最顺。",
      slots: [
        { period: "上午", time: "08:30-12:30", name: "东京迪士尼海洋", note: "情侣更推荐 DisneySea，景观和氛围比刷项目更重要。", transport: "JR 京叶线到舞滨 + Disney Resort Line", ticket: "成人 ¥7,900 起", booking: "提前 30 天" },
        { period: "中午", time: "11:00-14:00", name: "东京站与丸之内", note: "适合买伴手礼、寄存行李、从容去机场。", transport: "JR/地铁", ticket: "免费" },
        { period: "下午", time: "15:00-18:00", name: "前往机场返程", note: "国际航班建议至少提前 3 小时到机场。", transport: "N'EX / 京急 / 东京单轨", ticket: "约 ¥500-3,000", booking: "提前 3 天" }
      ],
      dining: ["东京站拉面街 · 酱油拉面", "东京站 GRANSTA · 限定伴手礼"]
    }
  ]
};

const trendBars = [
  { id: "jan", label: "1月", level: "h42" },
  { id: "feb", label: "2月", level: "h64" },
  { id: "mar", label: "3月", level: "h48" },
  { id: "apr", label: "4月", level: "h78", active: true },
  { id: "may", label: "5月", level: "h56" }
];

const purchaseRecords = [
  { id: "uniqlo-tee", title: "优衣库 T 恤 / M", tone: "soft-blue" },
  { id: "nike-jacket", title: "Nike 外套 / L", tone: "soft-green" },
  { id: "levis-jeans", title: "Levi's 牛仔裤 / 31", tone: "soft-amber" }
];

const profileStats = [
  { id: "records", value: "12", label: "尺码记录" },
  { id: "family", value: "4", label: "家庭成员" },
  { id: "brands", value: "8", label: "品牌收藏" }
];

const profileMenus = [
  { id: "profile", title: "我的档案", tone: "soft-blue" },
  { id: "family", title: "家人尺码", tone: "soft-green" },
  { id: "privacy", title: "隐私与授权", tone: "soft-amber" },
  { id: "help", title: "帮助反馈", tone: "soft-violet" }
];

function getHomeData() {
  return {
    shortcuts,
    recentRecords
  };
}

function getServicesData() {
  return {
    categories: serviceCategories,
    services
  };
}

function getRecordsData() {
  return {
    profile,
    purchaseRecords,
    trendBars
  };
}

function getProfileData() {
  return {
    menus: profileMenus,
    profile,
    stats: profileStats
  };
}

function getTravelPlan() {
  return travelPlan;
}

module.exports = {
  getHomeData,
  getProfileData,
  getRecordsData,
  getServicesData,
  getTravelPlan
};
