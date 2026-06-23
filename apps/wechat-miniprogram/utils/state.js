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

const serviceCategories = ["全部", "测量", "换算", "品牌"];

const services = [
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

module.exports = {
  getHomeData,
  getProfileData,
  getRecordsData,
  getServicesData
};
