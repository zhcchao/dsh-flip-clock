# dsh-flip-clock · 满屏翻页钟

侧边栏底部一个时钟按钮，点开铺满整个窗口的翻页钟：左半屏是「时」，右半屏是「分」，下方一行日期与星期。

0.2.0 起还带一个 **给 agent 用的工具**：在对话里说「打开时钟」，模型调用 `open_flip_clock` 就能把钟推上屏——不用点按钮，也不用刷新页面。

## 交互

| 动作 | 结果 |
| --- | --- |
| 点侧边栏底部的时钟图标 | 进入全屏（浏览器允许时）并打开翻页钟 |
| 在对话里说「打开时钟 / 显示时间」 | agent 调 `open_flip_clock`，钟直接出现 |
| 在对话里说「关掉时钟」 | agent 调 `open_flip_clock`（action: `close`）收起 |
| 按 `Esc` | 关闭 |
| 点击屏幕任意位置 | 关闭 |
| 点右上角 × | 关闭并退出全屏 |

## Agent 接口

模型侧只有一条工具，界面侧靠一条同源 SSE 通道接信号。

### 工具 `open_flip_clock`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `action` | `"open" \| "close"` | 默认 `open` |

返回值 `{ ok, action, windows, hint }`。`windows` 是**真正收到信号的浏览器窗口数**：

- `windows > 0`：钟已经在用户屏幕上；
- `windows = 0`：没有任何界面在监听（用户没开 Web UI，或还跑着旧版页面），工具会提示用户打开 / 刷新界面，**不要**声称钟已经显示。

### HTTP 路由（宿主侧，均由 `lib/index.js` 注册）

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/dsh-flip-clock/stream` | SSE 长连接，事件 `clock`，数据 `{"action":"open","at":<ms>}`；15s 一次 `: ping` 心跳 |
| `GET` | `/dsh-flip-clock/state` | `{ ok, windows, action, at }`，给轮询兜底用 |
| `POST` | `/dsh-flip-clock/signal` | `{"action":"open"\|"close"}`，广播后返回 `{ ok, action, windows }` |

几条设计约束：

- 界面半边用 `EventSource('/dsh-flip-clock/stream')` 订阅，另外每 4s 拉一次 `/state` 兜底——SSE 被代理吃掉时仍然能开钟。
- 页面加载之后才接信号：`at` 早于页面启动时间 3s 的旧信号会被丢弃，所以刷新页面不会莫名其妙蹦出一个钟。
- 路由只传「开 / 关」这一个动作，不携带任何会话内容或用户数据；也不需要页面的访问 token。
- 响应里没用 `windows` 兜底成「成功」：界面没连上就如实回报 0。

## 结构

```
dsh-flip-clock/
├─ package.json          # bundle 清单：dsh.bundle.patch + dsh.client
├─ cordis.patch.yml      # 把本插件插进 Loader 配置
├─ icon.svg              # 插件图标（双卡片时钟）
├─ locale/
│  ├─ zh.json            # meta.title / meta.description
│  └─ en.json
└─ lib/
   ├─ index.js           # Host 半边：open_flip_clock 工具 + SSE / state / signal 路由
   └─ client.js          # 浏览器半边：Slot 注册、翻页钟组件、agent 通道订阅
```

## 实现要点

- **两个 Slot**
  - `sidebar.footer.action` → `flip-clock`，order 10，侧边栏底部按钮
  - `shell.overlay` → `flip-clock-overlay`，order 200，满屏层
- **满屏层**自己 `pointer-events: auto`（overlay 层本身是 click-through）。
- **翻页动画**：每张牌渲染上下两半字形（`clip-path` 切分），数字变化时叠两层 `.fc-flap` 做 `rotateX` 翻转，`.26s` 后由 key 变化自然卸载。
- **计时**用对齐到整秒的 `setTimeout` 链，关闭时停表；数字只在分钟变化时才翻牌，秒不影响。
- **配色**：满屏层固定为纯黑底（`#000`）、浅色数字（`#f5f5f7`）、深灰牌面（`#141418`），不跟随宿主主题——黑底上看时间最安静；侧边栏那个入口按钮与键盘焦点环仍走 `--dsw-alias-*` token，随主题走。
- **文案**通过 `ctx.locale.register('flip-clock', { zh, en })` 注册，跟随界面语言。
- **宿主半边**声明 `inject = ['webServer', 'tools']`，路由和工具都用 `ctx.effect()` 注册，随插件卸载一起清理。

## 从 GitHub 安装

```bash
git clone https://github.com/zhcchao/dsh-flip-clock.git ~/plugins/dsh-flip-clock
```

然后在对话里让 agent 执行：

```
plugin_manager({ action: "install_bundle", target: "/Users/你/plugins/dsh-flip-clock" })
```

装完刷新一次页面。

## 安装 / 卸载

已通过 `plugin_manager` 装进 `desktop` profile。重装：

```
plugin_manager({ action: "install_bundle", target: "/Volumes/zhitai/harness/儿童学习/dsh-flip-clock" })
```

卸载：`plugin_manager({ action: "remove_bundle", target: "@local/dsh-flip-clock" })`。

改完 `lib/` 之后要让新代码生效：宿主半边切一次 `set_bundle enabled=false` → `true`；浏览器半边要**刷新页面**（client bundle 是手写的，没有 `dev:web` watcher 时 HMR 不会自动重载）。

## 调整尺寸

`lib/client.js` 里 `CSS` 常量中这几行控制满屏程度：

```css
.fc-card{ height:min(88vh,33vw); aspect-ratio:.64; }   /* 牌的高度与宽高比 */
.fc-glyph{ font-size:calc(min(88vh,33vw) * .78); }     /* 数字大小，相对牌高 */
.fc-stage{ padding:min(3vh,30px) min(2vw,24px) min(1vh,10px); }
.fc-half{ gap:min(2.4vh,22px); }
```

两个 `min()` 项里取较小者：`88vh` 让牌跟着窗口高度走，`33vw` 是宽屏时的封顶（防止一张牌撑得过宽把四张挤不下）。想让数字更大可以同步上调这两个系数，但保持 `33vw` 那一项不超过约 `34vw`，否则极宽屏会出现横向溢出。

## 自测

不依赖界面也能验：

```bash
curl -s http://127.0.0.1:64501/dsh-flip-clock/state
curl -sN http://127.0.0.1:64501/dsh-flip-clock/stream &   # 另一终端
curl -s -X POST http://127.0.0.1:64501/dsh-flip-clock/signal -H 'content-type: application/json' -d '{"action":"open"}'
```

SSE 端应当立刻收到一帧 `event: clock`。