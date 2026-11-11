# dsh-flip-clock 安装说明（0.2.0）

一个满屏翻页钟插件：左半屏「时」、右半屏「分」，下方日期与星期；另外带一个 agent 可以调用的 `open_flip_clock` 工具，在对话里说「打开时钟」就能推上屏。

## 1. 解压

```bash
unzip dsh-flip-clock-0.2.0.zip -d ~/plugins
# 得到 ~/plugins/dsh-flip-clock/
```

> 目录里必须是 `package.json`，不能再套一层。安装时传的是**目录的绝对路径**。

## 2. 安装到 profile

在 DeepSeek Harness 的对话里让 agent 调用 `plugin_manager`：

```
plugin_manager({
  action: "install_bundle",
  target: "/Users/你/plugins/dsh-flip-clock"
})
```

返回里 `stage: "enable"`, `application: "applied"` 即成功。

已经装过同名旧版本时，先卸掉再装：

```
plugin_manager({ action: "remove_bundle", target: "@local/dsh-flip-clock" })
plugin_manager({ action: "install_bundle", target: "/Users/你/plugins/dsh-flip-clock" })
```

## 3. 让界面加载

- **新装**：刷新一次 Web UI 页面即可。
- **升级**：先刷新页面（浏览器半边是手写 bundle，没有 dev watcher 时不会自动热重载）。若刷新后工具还在报 `windows: 0`，把 bundle 关再开一次，让宿主半边重新注册：

```
plugin_manager({ action: "set_bundle", enabled: false, target: "@local/dsh-flip-clock" })
plugin_manager({ action: "set_bundle", enabled: true,  target: "@local/dsh-flip-clock" })
```

## 4. 验证

```bash
curl -s http://127.0.0.1:64501/dsh-flip-clock/state
# → {"ok":true,"windows":1,"action":null,"at":0}
```

`windows` 是当前连着信号通道的界面窗口数。若是 `0`，说明页面还没加载新代码（刷新）或界面没开着。

## 5. 使用

- 点侧边栏底部的时钟图标，或
- 在对话里说「打开时钟」，agent 会调 `open_flip_clock`；说「关掉时钟」收起。
- `Esc`、点屏幕任意处、点右上角 × 也能关闭。

## 6. 卸载

```
plugin_manager({ action: "remove_bundle", target: "@local/dsh-flip-clock" })
```

然后刷新页面。

## 备注

- 包名是 `@local/dsh-flip-clock` 且 `private: true`，不会发布到公共 registry，只能这样本地安装。
- `peerDependencies` 写的是 `@deepseek-ai/dsh >=0.2.0-rc.1 <0.3.0-0`，不满足也能装，但 Slot 名（`sidebar.footer.action` / `shell.overlay`）是宿主契约，换大版本后可能变。
- 插件注册了三个只传「开 / 关」的本机路由（`/dsh-flip-clock/stream`、`/state`、`/signal`），不读取也不发送任何会话内容。若所在环境不允许插件开 HTTP 路由，钟仍然可以用侧边栏按钮打开，只是 agent 那句「打开时钟」会回报 `windows: 0`。