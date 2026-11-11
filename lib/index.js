/**
 * Host half for @local/dsh-flip-clock.
 *
 * The clock itself is a pure client-side surface (see lib/client.js), but the
 * agent needs a way to open it from a conversation. This half provides that:
 *
 *   • `open_flip_clock` tool — the model-facing entry point;
 *   • `GET /dsh-flip-clock/stream` — a same-origin SSE channel the client half
 *     listens on, so a tool call can flip the clock open without a page reload;
 *   • `GET /dsh-flip-clock/state` — the last signal, for polling fallbacks.
 *
 * A tool call means "the model asked the screen to do something", so the answer
 * reports how many browser windows actually received it; zero means no GUI is
 * listening and the user should open or refresh the page.
 */
export const name = 'flip-clock'
export const inject = ['webServer', 'tools']

const P = '/dsh-flip-clock'

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}

export function apply(ctx) {
  /** Live SSE responses; one per open browser window. */
  const streams = new Set()
  const last = { action: null, at: 0 }

  const broadcast = (action) => {
    const payload = { action, at: Date.now() }
    last.action = payload.action
    last.at = payload.at
    const frame = 'event: clock\ndata: ' + JSON.stringify(payload) + '\n\n'
    for (const res of streams) {
      try {
        if (!res.writableEnded) res.write(frame)
      } catch {
        streams.delete(res)
      }
    }
    return streams.size
  }

  const reply = (res, status, body) => {
    res.writeHead(status, JSON_HEADERS)
    res.end(JSON.stringify(body))
  }

  /* ── SSE: 界面这一侧长期订阅，宿主随时可以推一条「开 / 关」 ───── */
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: P + '/stream',
        handler: (req, res) => {
          if (req.method !== 'GET') return reply(res, 405, { ok: false, error: 'method-not-allowed' })
          res.writeHead(200, {
            'content-type': 'text/event-stream; charset=utf-8',
            'cache-control': 'no-store',
            connection: 'keep-alive',
            'x-accel-buffering': 'no',
          })
          res.write('event: hello\ndata: {"ok":true}\n\n')
          // 迟到者也能立刻拿到上一次的信号（携带 at，客户端自行去重）
          if (last.action) res.write('event: clock\ndata: ' + JSON.stringify(last) + '\n\n')
          streams.add(res)

          const heartbeat = setInterval(() => {
            try {
              if (!res.writableEnded) res.write(': ping\n\n')
            } catch {
              /* 连接已断，close 会清理 */
            }
          }, 15000)
          heartbeat.unref?.()
          res.on('close', () => {
            clearInterval(heartbeat)
            streams.delete(res)
          })
        },
      }),
    'flip-clock: stream route',
  )

  /* ── 轮询兜底：SSE 被代理断掉时，界面仍能拉到状态 ─────────────── */
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: P + '/state',
        handler: (req, res) => {
          if (req.method !== 'GET') return reply(res, 405, { ok: false, error: 'method-not-allowed' })
          reply(res, 200, { ok: true, windows: streams.size, action: last.action, at: last.at })
        },
      }),
    'flip-clock: state route',
  )

  /* ── 手动触发（调试 / 脚本用）：POST {"action":"open"} ─────────── */
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: P + '/signal',
        handler: (req, res) => {
          if (req.method !== 'POST') return reply(res, 405, { ok: false, error: 'method-not-allowed' })
          const chunks = []
          let bytes = 0
          req.on('data', (chunk) => {
            bytes += chunk.length
            if (bytes <= 4096) chunks.push(chunk)
          })
          req.on('end', () => {
            let action = 'open'
            try {
              const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
              if (parsed && parsed.action === 'close') action = 'close'
            } catch {
              /* 空 body 按 open 处理 */
            }
            reply(res, 200, { ok: true, action, windows: broadcast(action) })
          })
          req.on('error', () => {
            try {
              reply(res, 400, { ok: false, error: 'bad-request' })
            } catch {
              /* 连接已断 */
            }
          })
        },
      }),
    'flip-clock: signal route',
  )

  /* ── 模型侧接口：说一句话就把钟打开 ──────────────────────────── */
  ctx.effect(
    () =>
      ctx.tools.register({
        name: 'open_flip_clock',
        description:
          'Open (or close) the fullscreen flip clock on the user\'s screen: huge hour digits on the left half, ' +
          'minute digits on the right half, date and weekday underneath. Call this when the user asks to show, ' +
          'open, start or close the clock. It only affects the graphical web UI; the returned `windows` count ' +
          'says how many open GUI windows received the signal — 0 means no window is listening (the user must ' +
          'open or refresh the web UI), so report that instead of claiming the clock is visible.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            action: {
              type: 'string',
              enum: ['open', 'close'],
              description: 'open (default) shows the clock; close hides it.',
            },
          },
        },
        output: {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              ok: { type: 'boolean' },
              action: { type: 'string' },
              windows: { type: 'number' },
              hint: { type: 'string' },
            },
          },
          render(_args, value) {
            if (!value || value.ok !== true) {
              return [{ type: 'text', text: 'Flip clock signal failed.' }]
            }
            const hint =
              value.windows > 0
                ? ''
                : ' No GUI window is listening right now — ask the user to open (or refresh) the DeepSeek Harness web UI, then try again.'
            return [{ type: 'text', text: `Flip clock: ${value.action} sent to ${value.windows} window(s).${hint}` }]
          },
        },
        async execute(args) {
          const requested = args && typeof args.action === 'string' ? args.action : 'open'
          const action = requested === 'close' ? 'close' : 'open'
          const windows = broadcast(action)
          return {
            ok: true,
            action,
            windows,
            hint:
              windows > 0
                ? 'The clock is being displayed on the user\'s screen.'
                : 'No GUI window is connected; the user needs to open or refresh the web UI.',
          }
        },
      }),
    'flip-clock: open_flip_clock tool',
  )
}