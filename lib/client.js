// 满屏翻页钟 · 客户端半边
// 侧边栏底部一个时钟按钮 → 点开一个满屏翻页钟：左半屏「时」，右半屏「分」，
// 下方一行日期 / 星期；Esc 或点任意处退出。
window.__ModuleLoader__.load({
  id: '@local/dsh-flip-clock',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    const React = require('react')
    const h = React.createElement
    const { Fragment } = React
    const { useEffect, useState } = React

    const NS = 'flip-clock'

    const DICT = {
      zh: {
        open: '打开满屏翻页钟',
        close: '关闭',
        hint: '按 Esc 或点击任意处退出',
        hour: '时',
        minute: '分',
      },
      en: {
        open: 'Open the fullscreen flip clock',
        close: 'Close',
        hint: 'Press Esc or click anywhere to exit',
        hour: 'Hour',
        minute: 'Minute',
      },
    }

    const CSS = [
      /* ── 满屏舞台 ───────────────────────────────────────────── */
      '.fc-screen{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;overflow:hidden;',
      'background:#000;',
      'color:#f5f5f7;pointer-events:auto;cursor:pointer;',
      'font-family:"SF Pro Display",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,"PingFang SC",sans-serif;',
      '-webkit-user-select:none;user-select:none;animation:fc-fade .2s ease both}',
      '@keyframes fc-fade{from{opacity:0}to{opacity:1}}',
      '.fc-stage{position:relative;flex:1;display:grid;grid-template-columns:1fr 1fr;min-height:0;',
      'padding:min(3vh,30px) min(2vw,24px) min(1vh,10px)}',
      '.fc-half{display:flex;align-items:center;justify-content:center;gap:min(2.4vh,22px);min-width:0}',
      '.fc-divider{position:absolute;left:50%;top:18%;bottom:18%;width:1px;transform:translateX(-.5px);',
      'background:linear-gradient(180deg,transparent,rgba(255,255,255,.14),transparent)}',

      /* ── 数字牌 ─────────────────────────────────────────────── */
      '.fc-card{position:relative;flex:none;height:min(88vh,33vw);aspect-ratio:.64;',
      'border-radius:min(3vh,26px);overflow:hidden;perspective:1400px;',
      'background:#141418;',
      'border:1px solid rgba(255,255,255,.12);',
      'box-shadow:0 min(2vh,18px) min(5vh,46px) rgba(0,0,0,.85),inset 0 1px 0 rgba(255,255,255,.045)}',
      '.fc-face{position:absolute;inset:0;z-index:1}',
      '.fc-glyph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;',
      'font-size:calc(min(88vh,33vw) * .78);font-weight:600;line-height:1;letter-spacing:-.035em;',
      'font-variant-numeric:tabular-nums;color:#f5f5f7}',
      '.fc-glyph-top{clip-path:inset(0 0 50.5% 0)}',
      '.fc-glyph-bottom{clip-path:inset(49.5% 0 0 0)}',
      '.fc-card::after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;z-index:4;',
      'background:#000;opacity:.95}',
      '.fc-flap{position:absolute;inset:0;z-index:2;backface-visibility:hidden;border-radius:inherit;',
      'background:linear-gradient(180deg,#1d1d22,#141418)}',
      '.fc-flap-top{clip-path:inset(0 0 50% 0);transform-origin:50% 50%;',
      'animation:fc-flip-top .26s cubic-bezier(.45,.05,.85,.4) forwards}',
      '.fc-flap-bottom{clip-path:inset(50% 0 0 0);transform-origin:50% 50%;',
      'animation:fc-flip-bottom .26s .26s cubic-bezier(.15,.6,.35,1) forwards}',
      '@keyframes fc-flip-top{0%{transform:rotateX(0)}100%{transform:rotateX(-90deg)}}',
      '@keyframes fc-flip-bottom{0%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}',

      /* ── 页脚文字 ───────────────────────────────────────────── */
      '.fc-foot{position:relative;z-index:5;display:flex;flex-direction:column;align-items:center;',
      'gap:min(1.2vh,10px);padding:0 min(4vw,40px) min(4.5vh,40px);text-align:center}',
      '.fc-date{font-size:min(3.4vh,26px);letter-spacing:.14em;color:#9aa0aa}',
      '.fc-hint{font-size:min(1.9vh,13px);letter-spacing:.08em;color:#5f6670}',

      /* ── 关闭按钮 ───────────────────────────────────────────── */
      '.fc-close{position:absolute;z-index:6;top:min(3vh,22px);right:min(3vh,22px);width:38px;height:38px;',
      'display:flex;align-items:center;justify-content:center;padding:0;border-radius:999px;cursor:pointer;',
      'border:1px solid rgba(255,255,255,.14);background:transparent;',
      'color:#9aa0aa}',
      '.fc-close:hover{background:rgba(255,255,255,.09);',
      'color:#f5f5f7}',
      '.fc-close:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-alias-brand-primary,#4f7cff)}',

      /* ── 侧边栏入口 ─────────────────────────────────────────── */
      '.fc-entry{display:flex;align-items:center;justify-content:center}',
      '.fc-entry-btn{width:36px;height:36px;flex:none;display:flex;align-items:center;justify-content:center;',
      'padding:0;border:0;border-radius:10px;background:transparent;cursor:pointer;',
      'color:var(--dsw-alias-label-secondary,#5f6875)}',
      '.fc-entry-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));',
      'color:var(--dsw-alias-label-primary,#1f2329)}',
      '.fc-entry-btn:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-alias-brand-primary,#4f7cff)}',
    ].join('')

    function installStyle() {
      if (typeof document === 'undefined' || document.getElementById('dsh-flip-clock-style')) return
      const style = document.createElement('style')
      style.id = 'dsh-flip-clock-style'
      style.dataset.plugin = '@local/dsh-flip-clock'
      style.textContent = CSS
      document.head.appendChild(style)
    }

    /* ── 打开状态：侧边栏按钮与满屏层共享 ─────────────────────── */
    const store = {
      open: false,
      listeners: new Set(),
      set(next) {
        if (store.open === next) return
        store.open = next
        for (const fn of store.listeners) fn(next)
      },
      subscribe(fn) {
        store.listeners.add(fn)
        return () => {
          store.listeners.delete(fn)
        }
      },
    }

    function useIsOpen() {
      const [open, setOpen] = useState(store.open)
      useEffect(() => {
        const off = store.subscribe(setOpen)
        return () => off()
      }, [])
      return open
    }

    /* ── 时间：对齐到整秒，只在分钟真的变了才会翻牌 ─────────────── */
    function useNow(active) {
      const [now, setNow] = useState(() => new Date())
      useEffect(() => {
        if (!active) return undefined
        let timer = 0
        const tick = () => {
          setNow(new Date())
          timer = window.setTimeout(tick, 1000 - (Date.now() % 1000))
        }
        tick()
        return () => window.clearTimeout(timer)
      }, [active])
      return now
    }

    const pad2 = (n) => (n < 10 ? '0' + n : String(n))

    function formatDate(now, lang) {
      const y = now.getFullYear()
      const m = now.getMonth() + 1
      const d = now.getDate()
      const locale = lang === 'zh' ? 'zh-CN' : 'en-US'
      let weekday = ''
      try {
        weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(now)
      } catch {
        weekday = ''
      }
      if (lang === 'zh') return y + '年' + m + '月' + d + '日　' + weekday
      return weekday + ', ' + new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(now)
    }

    /* ── 单张翻页数字牌 ───────────────────────────────────────── */
    function FlipDigit(props) {
      const digit = props.digit
      const [state, setState] = useState({ current: digit, prev: digit, seq: 0 })

      useEffect(() => {
        setState((s) => (s.current === digit ? s : { current: digit, prev: s.current, seq: s.seq + 1 }))
      }, [digit])

      const animating = state.prev !== state.current

      // 翻牌结束后把「上一张」对齐到当前，撤掉正在翻的牌面。
      useEffect(() => {
        if (!animating) return undefined
        const id = window.setTimeout(() => {
          setState((s) => (s.prev === s.current ? s : { current: s.current, prev: s.current, seq: s.seq }))
        }, 640)
        return () => window.clearTimeout(id)
      }, [animating, state.seq])

      return h(
        'div',
        { className: 'fc-card' },
        h(
          'div',
          { className: 'fc-face' },
          h('span', { className: 'fc-glyph fc-glyph-top' }, state.current),
          h('span', { className: 'fc-glyph fc-glyph-bottom' }, animating ? state.prev : state.current),
        ),
        animating
          ? h(
              Fragment,
              null,
              h(
                'div',
                { key: 't' + state.seq, className: 'fc-flap fc-flap-top' },
                h('span', { className: 'fc-glyph fc-glyph-top' }, state.prev),
              ),
              h(
                'div',
                { key: 'b' + state.seq, className: 'fc-flap fc-flap-bottom' },
                h('span', { className: 'fc-glyph fc-glyph-bottom' }, state.current),
              ),
            )
          : null,
      )
    }

    const CLOSE_ICON = h(
      'svg',
      { viewBox: '0 0 16 16', width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' },
      h('path', { d: 'M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8' }),
    )

    const CLOCK_ICON = h(
      'svg',
      { viewBox: '0 0 20 20', width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('rect', { x: 2.4, y: 3.9, width: 6.1, height: 12.2, rx: 1.6 }),
      h('rect', { x: 11.5, y: 3.9, width: 6.1, height: 12.2, rx: 1.6 }),
      h('path', { d: 'M2.4 10h6.1M11.5 10h6.1' }),
    )

    /* ── 满屏翻页钟 ───────────────────────────────────────────── */
    function FlipClockOverlay(props) {
      const open = useIsOpen()
      const now = useNow(open)
      const t = props.t || ((k) => (DICT.zh[k] || k))
      const lang = typeof props.locale === 'function' ? props.locale() : 'zh'

      useEffect(() => {
        if (!open) return undefined
        const onKey = (e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            store.set(false)
          }
        }
        window.addEventListener('keydown', onKey, true)
        return () => window.removeEventListener('keydown', onKey, true)
      }, [open])

      if (!open) return null

      const hh = pad2(now.getHours())
      const mm = pad2(now.getMinutes())

      const close = () => {
        store.set(false)
        try {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
        } catch {
          /* 退出全屏失败不影响关闭 */
        }
      }

      return h(
        'div',
        {
          className: 'fc-screen',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': t('open'),
          onClick: close,
        },
        h(
          'div',
          { className: 'fc-stage' },
          h('div', { className: 'fc-half' }, h(FlipDigit, { digit: hh[0] }), h(FlipDigit, { digit: hh[1] })),
          h('div', { className: 'fc-divider' }),
          h('div', { className: 'fc-half' }, h(FlipDigit, { digit: mm[0] }), h(FlipDigit, { digit: mm[1] })),
        ),
        h(
          'div',
          { className: 'fc-foot' },
          h('div', { className: 'fc-date' }, formatDate(now, lang)),
          h('div', { className: 'fc-hint' }, t('hint')),
        ),
        h(
          'button',
          {
            className: 'fc-close',
            type: 'button',
            'aria-label': t('close'),
            title: t('close'),
            onClick: (e) => {
              e.stopPropagation()
              close()
            },
          },
          CLOSE_ICON,
        ),
      )
    }

    /* ── 侧边栏底部入口 ───────────────────────────────────────── */
    function FlipClockEntry(props) {
      const t = props.t || ((k) => (DICT.zh[k] || k))
      const open = () => {
        // 全屏请求必须在用户手势里同步发起，所以先要全屏，再切状态。
        try {
          const el = document.documentElement
          if (!document.fullscreenElement && typeof el.requestFullscreen === 'function') {
            const p = el.requestFullscreen()
            if (p && typeof p.catch === 'function') p.catch(() => {})
          }
        } catch {
          /* 宿主不允许全屏时，满屏层本身已经铺满窗口 */
        }
        store.set(true)
      }
      return h(
        'div',
        { className: 'fc-entry' },
        h(
          'button',
          {
            className: 'fc-entry-btn',
            type: 'button',
            'aria-label': t('open'),
            title: t('open'),
            onClick: open,
          },
          CLOCK_ICON,
        ),
      )
    }

    /* ── cordis 插件体 ───────────────────────────────────────── */
    const inject = ['slots', 'locale']

    function apply(ctx) {
      installStyle()

      if (ctx && typeof ctx.effect === 'function' && ctx.locale && typeof ctx.locale.register === 'function') {
        ctx.effect(() => ctx.locale.register(NS, DICT), 'flip-clock: dictionaries')
      }

      const bind = (fallback) => {
        try {
          const t = ctx && ctx.locale && typeof ctx.locale.bind === 'function' ? ctx.locale.bind(NS) : null
          if (typeof t === 'function') return (k) => {
            const v = t(k)
            return typeof v === 'string' && v ? v : fallback(k)
          }
        } catch {
          /* 字典尚未就绪时用内置中文 */
        }
        return fallback
      }
      const t = bind((k) => DICT.zh[k] || k)

      const langOf = () => {
        try {
          const active = ctx && ctx.locale && typeof ctx.locale.getLocale === 'function' ? ctx.locale.getLocale().active : 'zh'
          return active === 'en' ? 'en' : 'zh'
        } catch {
          return 'zh'
        }
      }

      const face = () => ({ t, locale: langOf })

      /* ── agent 通道 ──────────────────────────────────────────
         宿主半边的 open_flip_clock 工具往同源 SSE 推一条信号（另有 /state
         轮询兜底），于是「对话里说一句」就能把钟打开，不需要点侧边栏。 */
      if (typeof ctx.effect === 'function') {
        ctx.effect(() => {
          const startedAt = Date.now()
          let consumedAt = 0
          let source = null
          let timer = null

          const applySignal = (payload) => {
            if (!payload || typeof payload.action !== 'string') return
            const at = typeof payload.at === 'number' ? payload.at : 0
            // 页面加载之前的旧信号不重放，免得每次刷新都蹦出个钟
            if (at !== 0 && at < startedAt - 3000) return
            if (at !== 0) {
              if (at <= consumedAt) return
              consumedAt = at
            }
            if (payload.action === 'open') store.set(true)
            else if (payload.action === 'close') store.set(false)
          }

          if (typeof EventSource === 'function') {
            try {
              source = new EventSource('/dsh-flip-clock/stream')
              source.addEventListener('clock', (event) => {
                try {
                  applySignal(JSON.parse(event.data))
                } catch {
                  /* 坏帧忽略 */
                }
              })
            } catch {
              source = null
            }
          }

          const poll = () => {
            fetch('/dsh-flip-clock/state', { cache: 'no-store' })
              .then((r) => (r.ok ? r.json() : null))
              .then((payload) => {
                if (payload && payload.at !== 0) applySignal(payload)
              })
              .catch(() => {
                /* 宿主未就绪时下一轮再试 */
              })
          }
          timer = globalThis.setInterval(poll, 4000)
          timer.unref?.()

          return () => {
            if (timer !== null) globalThis.clearInterval(timer)
            if (source !== null) {
              try {
                source.close()
              } catch {
                /* 已关闭 */
              }
            }
          }
        }, 'flip-clock: agent channel')
      }

      ctx.slots.inject('sidebar.footer.action', () =>
        ctx.slots.register(
          { name: 'sidebar.footer.action', id: 'flip-clock', order: 10, locale: NS, inject: face },
          FlipClockEntry,
        ),
      )

      ctx.slots.inject('shell.overlay', () =>
        ctx.slots.register(
          { name: 'shell.overlay', id: 'flip-clock-overlay', order: 200, locale: NS, inject: face },
          FlipClockOverlay,
        ),
      )
    }

    exports.inject = inject
    exports.apply = apply
    return module.exports
  },
})
