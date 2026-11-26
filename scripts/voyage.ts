#!/usr/bin/env bun
/**
 * Redraws the profile from public records.
 *
 * Reads the ship log and daily commit counts that andrewwilkinson.io embeds in
 * its home page, the published figures in /metrics.json and public GitHub
 * repository data, then:
 *
 * - renders the engraved galleon and its wake as four SVGs (wide and narrow,
 *   dark and light), one mark per real ship record;
 * - rewrites the `<!-- v:NAME -->...<!-- /v:NAME -->` blocks in the README.
 *
 * The same file runs in ADWilkinson/ADWilkinson and galleonlabs/.github; each
 * repository supplies `scripts/voyage.config.json`. A source that fails to read
 * stops the run without writing, so a bad fetch never blanks the profile.
 *
 *   bun scripts/voyage.ts            fetch, render, rewrite
 *   bun scripts/voyage.ts --check    fail if the committed output is stale
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

// ---------------------------------------------------------------- config

type Config = {
  /** Display name, one word per line in the narrow drawing. */
  name: string[]
  /** One or two short lines under the name. */
  lines: string[]
  /** Projects drawn as lanes, in order from the stern outwards. Omit for every project. */
  lanes?: string[]
  /** README to rewrite, relative to the repository root. */
  readme: string
  /** Directory for the rendered SVGs, relative to the repository root. */
  assets: string
  /** That directory as the README links it (relative paths render on GitHub profiles). */
  assetBase: string
  /** Alt text for the drawing. `{ships}` and `{commits}` are filled in. */
  alt: string
  /** How many recent ships the README log lists. */
  logCount: number
}

const ROOT = resolve(dirname(import.meta.path), '..')
const CONFIG: Config = JSON.parse(readFileSync(join(ROOT, 'scripts/voyage.config.json'), 'utf8'))
const SITE = 'https://andrewwilkinson.io'
const CHECK = process.argv.includes('--check')

// ---------------------------------------------------------------- sources

type Ship = { date: string; project: string; title: string; url: string; kind: 'release' | 'milestone' }
type Activity = { project: string; url: string; days: Record<string, number> }
type Metrics = { work: { name: string; metrics?: { key: string; value: string; label: string; asOf: string }[] }[] }
type Repo = { full_name: string; stargazers_count: number; forks_count: number; archived: boolean; private: boolean }

async function get(url: string, accept = '*/*'): Promise<Response> {
  const headers: Record<string, string> = { 'User-Agent': 'profile-voyage/1.0', Accept: accept }
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (token && url.startsWith('https://api.github.com/')) headers.Authorization = `Bearer ${token}`
  for (let attempt = 1; ; attempt++) {
    let response: Response | undefined
    try {
      response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) })
    } catch (error) {
      if (attempt >= 3) throw error
    }
    if (response?.ok) return response
    // Only server errors and network failures are worth another try.
    if (response && (attempt >= 3 || response.status < 500)) throw new Error(`${url}: HTTP ${response.status}`)
    await Bun.sleep(1500 * attempt)
  }
}

function embedded<T>(html: string, id: string): T {
  const match = html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)</script>`))
  if (!match) throw new Error(`home page: no #${id} record`)
  return JSON.parse(match[1]!) as T
}

async function sources() {
  const html = await (await get(`${SITE}/`, 'text/html')).text()
  const ships = embedded<Ship[]>(html, 'voyage-log')
  const activity = embedded<Activity[]>(html, 'voyage-activity')
  const metrics = (await (await get(`${SITE}/metrics.json`, 'application/json')).json()) as Metrics
  if (!ships.length) throw new Error('home page: the ship log is empty')
  if (!activity.length) throw new Error('home page: the commit activity record is empty')
  if (!metrics.work?.some(w => w.metrics?.length)) throw new Error('metrics.json: no figures')
  return { ships, activity, metrics }
}

const repoCache = new Map<string, Promise<Repo>>()
function repo(name: string): Promise<Repo> {
  if (!repoCache.has(name)) repoCache.set(name, get(`https://api.github.com/repos/${name}`, 'application/vnd.github+json').then(r => r.json() as Promise<Repo>))
  return repoCache.get(name)!
}

// ---------------------------------------------------------------- dates and numbers

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000
const date = (iso: string, year = true) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m! - 1]}${year ? ` ${y}` : ''}`
}
const count = (n: number) => n.toLocaleString('en-GB')

// ---------------------------------------------------------------- the galleon (from andrewwilkinson.io site/ship.ts)

type Op = '+' | '*' | '-'
type Interval = [number, number]
const R = (x: number, y: number, w: number, h: number): number[] => [x, y, x + w, y, x + w, y + h, x, y + h]
const WATERLINE = 136
const SHIP_TOP = -14
const PARTS: [Op, number[]][] = [
  ['+', [14, 104, 44, 110, 196, 114, 238, 98, 228, 124, 206, 150, 56, 150, 26, 136]],
  ...[70, 98, 126, 154, 182].map((x): [Op, number[]] => ['-', R(x, 120, 12, 8)]),
  ['+', R(12, 80, 52, 30)], ...[20, 35, 50].map((x): [Op, number[]] => ['-', R(x, 88, 8, 10)]),
  ['+', R(124, 18, 5, 98)], ['+', R(182, 40, 5, 76)], ['+', R(72, 38, 5, 44)],
  ['+', [98, 28, 156, 28, 164, 90, 90, 90]],
  ['+', [160, 50, 208, 50, 213, 98, 157, 98]],
  ['+', [50, 48, 96, 48, 99, 78, 48, 78]],
  ['+', [214, 100, 252, 88, 216, 60]],
  ['+', [224, 100, 254, 82, 256, 87, 229, 106]],
  ['-', R(90, 57, 76, 4)], ['-', R(156, 72, 60, 4)],
  ['+', R(114, 10, 25, 9)], ['+', R(125, -10, 3, 22)], ['*', [128, -14, 152, -8, 128, 0]],
]

function crossings(shape: number[], y: number): Interval[] {
  const hits: number[] = []
  for (let i = 0, n = shape.length / 2; i < n; i++) {
    const j = (i + 1) % n, x1 = shape[2 * i]!, y1 = shape[2 * i + 1]!, x2 = shape[2 * j]!, y2 = shape[2 * j + 1]!
    if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) hits.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
  }
  hits.sort((a, b) => a - b)
  const out: Interval[] = []
  for (let i = 0; i + 1 < hits.length; i += 2) out.push([hits[i]!, hits[i + 1]!])
  return out
}
function union(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = []
  for (const s of [...a, ...b].sort((p, q) => p[0] - q[0])) {
    const last = out[out.length - 1]
    if (last && s[0] <= last[1]) last[1] = Math.max(last[1], s[1]); else out.push([s[0], s[1]])
  }
  return out
}
function subtract(a: Interval[], b: Interval[]): Interval[] {
  let out = a.map(([s, e]): Interval => [s, e])
  for (const [c, d] of b) out = out.flatMap(([s, e]): Interval[] => d <= s || c >= e ? [[s, e]] : [...(c > s ? [[s, c] as Interval] : []), ...(d < e ? [[d, e] as Interval] : [])])
  return out
}

const fx = (n: number) => String(Math.round(n * 10) / 10)
const bar = (x: number, y: number, w: number, h: number) => `M${fx(x)} ${fx(y)}h${fx(w)}v${fx(h)}h${fx(-w)}z`

/** Engraved ship paths in ship units: ink bars, the ember flag, and a solid backing that hides the sea. */
function engraveShip() {
  const pitch = 6, height = 3.6
  let ink = '', ember = ''
  for (let y = SHIP_TOP + (pitch - height) / 2; y + height <= WATERLINE + 0.5; y += pitch) {
    let inkSpans: Interval[] = [], emberSpans: Interval[] = []
    for (const [op, shape] of PARTS) {
      const span = crossings(shape, y + height / 2)
      if (!span.length) continue
      if (op === '+') { inkSpans = union(inkSpans, span); emberSpans = subtract(emberSpans, span) }
      else if (op === '*') { emberSpans = union(emberSpans, span); inkSpans = subtract(inkSpans, span) }
      else { inkSpans = subtract(inkSpans, span); emberSpans = subtract(emberSpans, span) }
    }
    for (const [a, b] of inkSpans) if (b - a >= 2) ink += bar(a, y, b - a, height)
    for (const [a, b] of emberSpans) if (b - a >= 2) ember += bar(a, y, b - a, height)
  }
  const backing = PARTS.filter(([op]) => op === '+').map(([, s]) => `M${s.map(fx).join(' ').replace(/^(\S+ \S+)/, '$1L')}z`).join('')
  return { ink, ember, backing }
}

// ---------------------------------------------------------------- drawing

type Theme = { ground: string; ink: string; muted: string; line: string; ember: string; sea: string; wake: string }
const THEMES: Record<'dark' | 'light', Theme> = {
  // andrewwilkinson.io DESIGN.md: night ground, bone ink, graphite, one ember accent.
  dark: { ground: '#191d23', ink: '#eee9dd', muted: '#818c9d', line: '#47515f', ember: '#cbaa78', sea: '#818c9d', wake: '#a9b2bf' },
  // The same engraving printed on bone paper, ember deepened for contrast.
  light: { ground: '#f3efe6', ink: '#24303b', muted: '#5d6878', line: '#cfc8b8', ember: '#93682a', sea: '#7d8796', wake: '#4f5a69' },
}

type Layout = {
  width: number; height: number
  name: { x: number; y: number; size: number; lead: number; oneLine: boolean }
  lines: { y: number; size: number; lead: number }
  ship: { left: number; waterline: number; scale: number }
  horizon: number
  wake: { left: number; centreDrop: number; spread: number; lane: number }
  rail: { y: number; label: number; value: number; columns: number[]; stacked: boolean }
}
const LAYOUTS: Record<'wide' | 'narrow', Layout> = {
  wide: {
    width: 1200, height: 620,
    name: { x: 56, y: 116, size: 66, lead: 0, oneLine: true },
    lines: { y: 170, size: 23, lead: 34 },
    ship: { left: 742, waterline: 362, scale: 1.58 },
    horizon: 276,
    wake: { left: 56, centreDrop: 6, spread: 116, lane: 0 },
    rail: { y: 516, label: 15, value: 20, columns: [56, 492, 830], stacked: false },
  },
  narrow: {
    width: 720, height: 1180,
    name: { x: 44, y: 128, size: 80, lead: 88, oneLine: false },
    lines: { y: 290, size: 30, lead: 42 },
    ship: { left: 280, waterline: 640, scale: 1.62 },
    horizon: 560,
    wake: { left: 28, centreDrop: 6, spread: 150, lane: 0 },
    rail: { y: 850, label: 22, value: 30, columns: [44], stacked: true },
  },
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const MONO = 0.6 // JetBrains Mono advance, in em
const fit = (text: string, size: number, room: number) => {
  const max = Math.floor(room / (size * MONO))
  return text.length <= max ? text : `${text.slice(0, Math.max(1, max - 1)).trimEnd()}…`
}

/** Deterministic xorshift so every run draws the same sea. */
function random(seed: number) {
  let s = seed >>> 0 || 1
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }
}

type Voyage = {
  ships: Ship[]; activity: Activity[]; lanes: string[]
  start: string; end: string; commits: number
  rail: { label: string; value: string }[]
}

function render(voyage: Voyage, layoutName: 'wide' | 'narrow', themeName: 'dark' | 'light', font: string, alt: string): string {
  const L = LAYOUTS[layoutName], T = THEMES[themeName]
  const { width: W, height: H } = L
  const s = L.ship.scale
  const pitch = layoutName === 'wide' ? 12 : 14

  // The sea: one tiling row pattern per phase, drifting in alternating directions.
  const period = W / 2
  const rnd = random(0x9e3779b9)
  const patterns: string[] = []
  const PHASES = 5
  for (let k = 0; k < PHASES; k++) {
    let d = ''
    for (let x = rnd() * 40; x < period - 12;) {
      const length = Math.min((1 + Math.floor(rnd() ** 1.6 * 9)) * 7.2 - 2.5, period - x - 4)
      if (length > 2) d += bar(x, (pitch - 1.6) / 2, length, 1.6)
      x += length + (1 + Math.floor(rnd() * 7)) * 7.2
    }
    patterns.push(`<pattern id="sea${k}" width="${period}" height="${pitch}" patternUnits="userSpaceOnUse"><path d="${d}"/></pattern>`)
  }
  let sea = ''
  const seaBottom = L.rail.y - 26
  for (let row = 0, y = L.horizon; y + pitch <= seaBottom; row++, y += pitch) {
    const depth = (y - L.horizon) / (seaBottom - L.horizon)
    const above = y < L.ship.waterline
    const opacity = (above ? 0.05 + depth * 0.16 : 0.14 + depth * 0.12) * (themeName === 'dark' ? 1.5 : 1)
    sea += `<rect class="d${row % 2} s${row % 3}" x="${-period}" y="${y}" width="${W + 2 * period}" height="${pitch}" fill="url(#sea${row % PHASES})" fill-opacity="${fx(opacity * 100) / 100}" style="--y:${y}px"/>`
  }

  // The wake: one lane per project, fanning from the stern towards the horizon.
  const stern = L.ship.left + 14 * s
  const t0 = day(voyage.start), t1 = day(voyage.end)
  const span = Math.max(1, t1 - t0)
  const n = voyage.lanes.length
  const place = (iso: string, lane: number) => {
    const d = Math.min(1, Math.max(0, (t1 - day(iso)) / span))
    const x = stern - 6 - d * (stern - 6 - L.wake.left)
    // Lanes leave the stern together and open out behind it, below the waterline.
    const top = L.ship.waterline + 5 + d * L.wake.centreDrop
    const y = top + (n > 1 ? lane / (n - 1) : 0.5) * (4 + d * L.wake.spread)
    return [x, y] as const
  }
  const perDay = (stern - 6 - L.wake.left) / span
  let streaks = ''
  for (const entry of voyage.activity) {
    const lane = voyage.lanes.indexOf(entry.project)
    if (lane < 0) continue
    for (const [iso, commits] of Object.entries(entry.days)) {
      if (day(iso) < t0 || day(iso) > t1) continue
      const [x, y] = place(iso, lane)
      const length = Math.min(Math.max(2, perDay * 2.2), 1.5 + 1.6 * Math.log2(1 + commits))
      streaks += bar(x - length, y - 0.8, length, 1.6)
    }
  }
  const ordered = [...voyage.ships].sort((a, b) => a.date.localeCompare(b.date))
  let marks = ''
  ordered.forEach((ship, index) => {
    const lane = voyage.lanes.indexOf(ship.project)
    if (lane < 0) return
    const [x, y] = place(ship.date, lane)
    const delay = fx(0.4 + (index / Math.max(1, ordered.length - 1)) * 2.6)
    const latest = index === ordered.length - 1
    const shape = ship.kind === 'milestone'
      ? `${bar(x - 1, y - 16, 2, 16)}${bar(x - 5, y - 18, 10, 3.5)}${bar(x - 6, y - 2, 12, 4)}`
      : bar(x - 5, y - 2, 10, 4)
    marks += `<path class="m${latest ? ' latest' : ''}" style="animation-delay:${delay}s" d="${shape}"/>`
  })

  // The ship, engraved, on its backing so the sea does not show through the sails.
  const ship = engraveShip()
  const shipTransform = `translate(${fx(L.ship.left)} ${fx(L.ship.waterline - WATERLINE * s)}) scale(${s})`

  // Type.
  const N = L.name
  const nameText = N.oneLine
    ? `<text x="${N.x}" y="${N.y}" class="name" font-size="${N.size}">${escape(CONFIG.name.join(' '))}<tspan class="dot">.</tspan></text>`
    : CONFIG.name.map((word, i) => `<text x="${N.x}" y="${N.y + i * N.lead}" class="name" font-size="${N.size}">${escape(word)}${i === CONFIG.name.length - 1 ? '<tspan class="dot">.</tspan>' : ''}</text>`).join('')
  const lineText = CONFIG.lines.map((line, i) => `<text x="${N.x}" y="${L.lines.y + i * L.lines.lead}" class="line" font-size="${L.lines.size}">${escape(line)}</text>`).join('')

  // The rail: what the drawing is made of, in words.
  let rail = `<path class="rule" d="${bar(N.x, L.rail.y, W - 2 * N.x, 1)}"/>`
  voyage.rail.forEach((item, i) => {
    const x = L.rail.stacked ? N.x : L.rail.columns[i]!
    const top = L.rail.stacked ? L.rail.y + 52 + i * (L.rail.label + L.rail.value + 40) : L.rail.y + 40
    const room = L.rail.stacked ? W - 2 * N.x : (L.rail.columns[i + 1] ?? W - N.x) - x - 24
    rail += `<text x="${x}" y="${top}" class="label" font-size="${L.rail.label}">${escape(item.label.toUpperCase())}</text>`
    rail += `<text x="${x}" y="${top + L.rail.value + 12}" class="value" font-size="${L.rail.value}">${escape(fit(item.value, L.rail.value, room))}</text>`
  })

  const drift = (direction: number, seconds: number) => `{from{transform:translateX(${direction > 0 ? -period : 0}px)}to{transform:translateX(${direction > 0 ? 0 : -period}px)}}`
  const css = `
@font-face{font-family:'JBM';src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 800}
text{font-family:'JBM','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
.name{fill:${T.ink};font-weight:500;letter-spacing:-0.01em}
.dot{fill:${T.ember}}
.line{fill:${T.muted}}
.label{fill:${T.muted};letter-spacing:0.08em}
.value{fill:${T.ink}}
.rule{fill:${T.line}}
.sea{fill:${T.sea}}
.ink{fill:${T.ink}}
.ember{fill:${T.ember}}
.backing{fill:${T.ground}}
.streaks{fill:${T.wake};fill-opacity:.55}
.m{fill:${T.ink}}
@keyframes right${drift(1, 0)}
@keyframes left${drift(-1, 0)}
@keyframes heave{from{transform:translateY(-1.5px)}to{transform:translateY(2.5px)}}
@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes glint{0%,70%,100%{opacity:1}85%{opacity:.35}}
.d0{animation:right 140s linear infinite}
.d1{animation:left 170s linear infinite}
.s1{animation-duration:200s}.s2{animation-duration:110s}
.ship{animation:heave 6.5s ease-in-out infinite alternate}
.m{animation:rise .7s cubic-bezier(.2,.7,.2,1) both}
.m.latest{animation:rise .7s cubic-bezier(.2,.7,.2,1) both,glint 4s ease-in-out 4s infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`.trim()

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">${escape(CONFIG.name.join(' '))}</title>
<desc id="d">${escape(alt)}</desc>
<style>${css}</style>
<defs>${patterns.join('')}<clipPath id="frame"><rect width="${W}" height="${H}" rx="12"/></clipPath></defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="${T.ground}"/>
<g class="sea">${sea}</g>
<path class="streaks" d="${streaks}"/>
<g>${marks}</g>
<g class="ship"><g transform="${shipTransform}"><path class="backing" d="${ship.backing}"/><path class="ink" d="${ship.ink}"/><path class="ember" d="${ship.ember}"/></g></g>
${nameText}${lineText}
${rail}
</g>
</svg>
`
}

// ---------------------------------------------------------------- README blocks

/**
 * The ship log only grows. A sharp drop against the committed drawing means a
 * broken or truncated source, so stop rather than publish a thinner profile.
 */
function guardAgainstShrinkage(ships: number) {
  const readme = readFileSync(join(ROOT, CONFIG.readme), 'utf8')
  const previous = Number(readme.match(/drawn from ([\d,]+) ship records/)?.[1]?.replace(/,/g, '') ?? 0)
  if (previous && ships < previous * 0.9) throw new Error(`ship log shrank from ${previous} to ${ships} records; refusing to redraw`)
}

/** Ship titles come from the site; keep them from breaking a Markdown link. */
const linkText = (text: string) => text.replace(/\s+/g, ' ').replace(/([\[\]\\])/g, '\\$1')

async function main() {
  const { ships, activity, metrics } = await sources()
  const known = new Set([...ships.map(s => s.project), ...activity.map(a => a.project)])
  const lanes = (CONFIG.lanes ?? [...new Set([...activity.map(a => a.project), ...ships.map(s => s.project)])]).filter(lane => known.has(lane))
  if (!lanes.length) throw new Error('no configured lane appears in the public records')
  const mine = ships.filter(s => lanes.includes(s.project)).sort((a, b) => b.date.localeCompare(a.date) || a.project.localeCompare(b.project))
  const work = activity.filter(a => lanes.includes(a.project))
  if (!mine.length) throw new Error('no ship records on the configured lanes')

  const commitDays = work.flatMap(a => Object.keys(a.days))
  // The site publishes only the last 180 days of commits, so the voyage is
  // anchored to the first ship record instead: a fixed origin that does not
  // slide (and rescale the wake) every day.
  const start = mine.map(s => s.date).sort()[0]!
  const end = [...commitDays, ...mine.map(s => s.date)].sort().at(-1)!
  const commits = work.reduce((sum, a) => sum + Object.values(a.days).reduce((x, y) => x + y, 0), 0)
  if (!commits) throw new Error('home page: no commits on the configured lanes')
  const latest = mine[0]!
  guardAgainstShrinkage(mine.length)
  const voyage: Voyage = {
    ships: mine, activity: work, lanes, start, end, commits,
    rail: [
      { label: 'Latest ship', value: `${latest.title} · ${date(latest.date, false)}` },
      { label: 'Ship log', value: `${count(mine.length)} ships since ${date(start)}` },
      { label: 'Commits, 180 days', value: count(commits) },
    ],
  }
  const alt = CONFIG.alt.replace('{ships}', count(mine.length)).replace('{commits}', count(commits))

  const font = readFileSync(join(ROOT, CONFIG.assets, 'fonts/JetBrainsMono.woff2')).toString('base64')
  const files: Record<string, string> = {}
  for (const layout of ['wide', 'narrow'] as const) for (const theme of ['dark', 'light'] as const) {
    files[`voyage-${layout}-${theme}.svg`] = render(voyage, layout, theme, font, alt)
  }
  const src = (file: string) => `${CONFIG.assetBase}/${file}`

  const blocks: Record<string, string> = {
    hero: [
      '<picture>',
      `  <source media="(max-width: 600px) and (prefers-color-scheme: dark)" srcset="${src('voyage-narrow-dark.svg')}">`,
      `  <source media="(max-width: 600px)" srcset="${src('voyage-narrow-light.svg')}">`,
      `  <source media="(prefers-color-scheme: dark)" srcset="${src('voyage-wide-dark.svg')}">`,
      `  <img src="${src('voyage-wide-light.svg')}" width="100%" alt="${escape(alt)}">`,
      '</picture>',
    ].join('\n'),
    log: mine.slice(0, CONFIG.logCount).map(s => `- \`${date(s.date)}\` [${linkText(s.title)}](<${s.url}>)`).join('\n'),
    // HTML, not Markdown: a line that opens with the marker comment is a raw HTML block.
    caption: `${count(mine.length)} ships and ${count(commits)} commits since ${date(start)}. Redrawn daily from the public <a href="${SITE}/ships/">ship log</a>.`,
    latest: `[${latest.title}](${latest.url}), ${date(latest.date)}`,
  }
  // Figures arrive already rounded down to their published step, e.g. "$610k+".
  for (const { key, value, asOf } of metrics.work.flatMap(w => w.metrics ?? [])) {
    blocks[`fig:${key}`] = value
    // Month precision: confirming reads re-date figures daily, and a profile
    // commit for an unchanged figure is noise.
    blocks[`asof:${key}`] = `${MONTHS[Number(asOf.slice(5, 7)) - 1]} ${asOf.slice(0, 4)}`
  }

  const readmePath = join(ROOT, CONFIG.readme)
  let readme = readFileSync(readmePath, 'utf8')
  const wanted = [...new Set([...readme.matchAll(/<!-- v:(\S+) -->/g)].map(m => m[1]!))]
  for (const name of wanted) {
    const opens = readme.split(`<!-- v:${name} -->`).length - 1, closes = readme.split(`<!-- /v:${name} -->`).length - 1
    if (opens !== closes) throw new Error(`${CONFIG.readme}: <!-- v:${name} --> has ${opens} opening and ${closes} closing markers`)
    if (name.startsWith('stars:')) {
      const r = await repo(name.slice(6))
      if (r.private || r.archived) throw new Error(`${name}: repository is ${r.private ? 'private' : 'archived'}`)
      blocks[name] = count(r.stargazers_count)
    }
    if (!(name in blocks)) throw new Error(`${CONFIG.readme}: no value for <!-- v:${name} -->`)
  }
  const block = (name: string, value: string) => value.includes('\n') ? `\n${value}\n` : value
  readme = readme.replace(/<!-- v:(\S+) -->[\s\S]*?<!-- \/v:\1 -->/g, (_, name: string) => `<!-- v:${name} -->${block(name, blocks[name]!)}<!-- /v:${name} -->`)

  const outputs: [string, string][] = [[readmePath, readme], ...Object.entries(files).map(([file, svg]): [string, string] => [join(ROOT, CONFIG.assets, file), svg])]
  const stale = outputs.filter(([path, text]) => !existsSync(path) || readFileSync(path, 'utf8') !== text)
  if (CHECK) {
    if (stale.length) { console.error(`stale: ${stale.map(([p]) => p.replace(`${ROOT}/`, '')).join(', ')}`); process.exit(1) }
    console.log('up to date')
    return
  }
  mkdirSync(join(ROOT, CONFIG.assets), { recursive: true })
  for (const [path, text] of stale) writeFileSync(path, text)
  console.log(`${mine.length} ships, ${count(commits)} commits, ${lanes.length} lanes, ${start} to ${end}; latest ${latest.title}`)
  for (const [file, svg] of Object.entries(files)) console.log(`  ${file} ${(svg.length / 1024).toFixed(0)} KB`)
  console.log(stale.length ? `wrote ${stale.length} file(s)` : 'no changes')
}

await main()
