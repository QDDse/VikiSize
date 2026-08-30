# Design QA

## Comparison target

- Source visual truth — 旅行：`/Users/qdd/.codex/generated_images/01a02340-b9b2-7a00-8b12-e0113983b508/exec-ff20d519-88e3-44c5-9eec-71ccce2ebd26.png`
- Source visual truth — 健身：`/Users/qdd/.codex/generated_images/01a02340-b9b2-7a00-8b12-e0113983b508/exec-f7d6ec40-6dcf-47f2-9da4-ef8092e80cfa.png`
- Implementation — 旅行：`/Users/qdd/.codex/visualizations/2026/08/21/01a02340-b9b2-7a00-8b12-e0113983b508/vikisize-implementation/travel-final-icons.png`
- Implementation — 健身：`/Users/qdd/.codex/visualizations/2026/08/21/01a02340-b9b2-7a00-8b12-e0113983b508/vikisize-implementation/fitness-final-icons.png`
- Runtime：微信开发者工具 RC 2.02.2608031，iPhone 12/13 (Pro) 模拟器，小程序基础库 3.17.1。

## Viewport and normalization

- Source pixels：旅行 `852 × 1846`；健身 `853 × 1844`。
- Implementation pixels：两页均为 `734 × 1588`。
- Implementation CSS viewport：约 `390 × 844` CSS px；截图密度约 `1.882×`。
- Source 约为同一手机纵横比的高密度无系统栏设计稿；implementation 包含微信状态栏、胶囊按钮、原生 tab bar 和安全区。比较时按相同手机内容宽度归一化，系统栏占位不作为视觉缺陷。
- State：旅行空间有 8 天行程、34 天后出发、真实任务与预算；健身有 6 份周报、1 份体测、0 项待确认，提醒状态取当前真实订阅配置。

## Full-view comparison evidence

- 两轮对照均把每页 reference 与微信模拟器截图放在同一个比较输入中检查。
- 最终两页均保留定稿的信息顺序：标题与文字入口 → 低对比概览 → 关键动作/账本 → 分组列表 → 原生底部导航。
- 页面采用暖白 `#f7f6f2`、浅灰绿 `#eef2ed`、深墨色 `#18231f`、单一强调绿 `#267d69`；无渐变、无阴影、无装饰性图形。
- 卡片圆角、细描边、页面边距、文字层级和列表密度与 reference 的安静工具感一致；动态业务数据没有被替换成演示数字。

## Focused-region comparison evidence

- 标题区：检查了旅行“成员”和健身“接入数据”的图标、基线、点击面积与微信胶囊按钮避让。
- 概览区：检查了旅行倒计时/日期/角色，以及健身周区间/状态/记录入口的字号、行距和卡片比例。
- 账本与列表：检查了任务、预算、体测、提醒、周报和行程列表的真实图标、分隔线、箭头、状态文本和内容换行。
- 原生 tab bar：检查了旅行/健身图标、文字选中态、安全区和页面内容遮挡。
- 全尺寸截图中的文字和控件均可清晰辨认，因此不需要额外裁切图；上述区域均在原图缩放到 100% 后逐项检查。

## Required fidelity surfaces

- Fonts and typography：使用 PingFang SC / 系统中文字体；标题、区块标题、正文和辅助文本的层级、字重与换行稳定，无截断。
- Spacing and layout rhythm：40rpx 页面边距、低密度卡片、细分隔线和分组列表形成稳定节奏；原生顶部/底部安全区已纳入实现。
- Colors and tokens：暖白、灰绿、墨色与单一森林绿映射一致；未引入渐变或高饱和装饰色。
- Image quality and asset fidelity：可见功能图标均使用 Google Material Icons 官方 48px PNG，不使用 CSS 绘图、文本符号或手写 SVG；许可证位于 `apps/wechat-miniprogram/assets/icons/LICENSE-MATERIAL-ICONS.txt`。
- Copy and content：静态文案与定稿一致；日期、任务数、预算、周报数和提醒状态来自真实页面数据。
- Accessibility and interaction：关键入口均有不小于约 44px 的触达区；正文对比度充足；动态列表与按钮保持原有路由和业务行为。

## Comparison history

### Iteration 1

- Earlier evidence：`travel-runtime.png`、`fitness-runtime.png`。
- [P1] 原生 `button` 出现大面积边框，改变了定稿的文字入口层级。
- [P1] 健身标题与副标题横排，旅行页额外展示四段标签栏，均改变了首屏结构。
- [P2] 行程日期显示 ISO 格式，页面纵向间距偏松。
- Fixes：文字入口改为轻量 `view` 控件；健身标题改为纵向；移除默认旅行标签栏并让任务/预算账本直接切换；格式化中文日期；压缩概览、账本、分组列表的间距。
- Post-fix evidence：`travel-final.png`、`fitness-final.png`，大边框与结构漂移消失。

### Iteration 2

- Earlier evidence：`travel-final.png`、`fitness-final.png`。
- [P2] 定稿中的成员、日历、任务、预算、接入、体测、提醒、箭头与底部导航图标缺失，交互提示不足。
- Fixes：引入官方 Material Icons PNG 及许可证；补齐页面功能图标、行级箭头和原生 tab bar 图标；保持图标透明背景和统一视觉尺寸。
- Post-fix evidence：`travel-final-icons.png`、`fitness-final-icons.png`，功能图标和交互指向完整，未使用替代性 CSS/字符绘图。

### Iteration 3

- Earlier evidence：第一次加入首屏下方“旅行动态 / 浏览模板”辅助入口后的模拟器截图。
- [P2] 辅助入口文字在默认滚动位置贴近并部分进入原生 tab bar 覆盖区。
- Fixes：把辅助入口继续下移到首屏下方，只在主动滚动后出现；保留功能可达性，同时避免与持久导航重叠。
- Post-fix evidence：最终 `travel-final-icons.png`，原生 tab bar 上方没有被遮挡或裁切的辅助文字。

## Runtime and interaction verification

- 最终控制台 `grep -i error` 无命中。
- 旅行：任务入口把 `tab` 从 `itinerary` 切到 `tasks`；“行程”返回成功；预算入口精确切到 `budget`。
- 健身：“查看训练记录”进入 `pages/fitness-detail/index` 且返回成功；提醒 `switch` 与周报行均存在。
- 原生底部导航从健身 `switchTab` 到 `pages/plans/index` 成功。

## Follow-up polish

- [P3] 原生 tab bar 的 PNG 不受 `selectedColor` 自动染色，选中图标保持单色，选中文字仍正确使用森林绿。为了保持原生导航稳定性，不为这一点引入自定义 tab bar。
- [P3] reference 未包含微信状态栏和胶囊按钮，因此真实首屏可见内容比无系统栏设计稿少约一个归档行；滚动和持久导航不受影响。
- [P3] 健身 reference 展示开启状态的提醒开关；最终实现遵循真实订阅状态，当前未授权时显示关闭，未为截图伪造授权。

## Final result

final result: passed
