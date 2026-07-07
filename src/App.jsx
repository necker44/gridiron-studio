import { useState, useRef, useEffect, useCallback } from 'react'
import { useSharedPlays } from './hooks/useSharedPlays'

// ─── Constants ────────────────────────────────────────────────────────────────
const FIELD_W = 900
const FIELD_H = 560
const YARD_W  = FIELD_W / 120
const LOS_X   = FIELD_W * 0.42
const HASH_Y1 = FIELD_H * 0.38
const HASH_Y2 = FIELD_H * 0.62

// ─── Position Definitions ─────────────────────────────────────────────────────
const OFFENSE_POSITIONS = [
  { id:'C',   label:'C',   x:0,    y:0,   color:'#4ADE80', unit:'ol'    },
  { id:'LG',  label:'LG',  x:-28,  y:0,   color:'#4ADE80', unit:'ol'    },
  { id:'RG',  label:'RG',  x:28,   y:0,   color:'#4ADE80', unit:'ol'    },
  { id:'LT',  label:'LT',  x:-58,  y:0,   color:'#4ADE80', unit:'ol'    },
  { id:'RT',  label:'RT',  x:58,   y:0,   color:'#4ADE80', unit:'ol'    },
  { id:'TE',  label:'TE',  x:90,   y:0,   color:'#4ADE80', unit:'ol'    },
  { id:'QB',  label:'QB',  x:0,    y:55,  color:'#FFE033', unit:'skill' },
  { id:'RB',  label:'RB',  x:20,   y:100, color:'#60A5FA', unit:'skill' },
  { id:'WR1', label:'X',   x:-170, y:0,   color:'#F87171', unit:'skill' },
  { id:'WR2', label:'Z',   x:160,  y:5,   color:'#F87171', unit:'skill' },
  { id:'SL',  label:'SL',  x:-100, y:40,  color:'#F87171', unit:'skill' },
]

const DEFENSE_POSITIONS = [
  { id:'DE1', label:'DE',  x:-70,  y:-20,  color:'#F87171', unit:'dl' },
  { id:'DT1', label:'DT',  x:-28,  y:-20,  color:'#F87171', unit:'dl' },
  { id:'DT2', label:'DT',  x:28,   y:-20,  color:'#F87171', unit:'dl' },
  { id:'DE2', label:'DE',  x:70,   y:-20,  color:'#F87171', unit:'dl' },
  { id:'MLB', label:'MLB', x:0,    y:-70,  color:'#60A5FA', unit:'lb'  },
  { id:'WLB', label:'WLB', x:-60,  y:-70,  color:'#60A5FA', unit:'lb'  },
  { id:'SLB', label:'SLB', x:60,   y:-70,  color:'#60A5FA', unit:'lb'  },
  { id:'CB1', label:'CB',  x:-160, y:-20,  color:'#FFE033', unit:'db'  },
  { id:'CB2', label:'CB',  x:160,  y:-20,  color:'#FFE033', unit:'db'  },
  { id:'SS',  label:'SS',  x:80,   y:-130, color:'#C084FC', unit:'db'  },
  { id:'FS',  label:'FS',  x:-30,  y:-150, color:'#C084FC', unit:'db'  },
]

const EXTRA_DEF = [
  { id:'xDE1',label:'DE', x:-70, y:-20,  color:'#F87171',unit:'dl',isExtra:true },
  { id:'xDT1',label:'DT', x:-28, y:-20,  color:'#F87171',unit:'dl',isExtra:true },
  { id:'xDT2',label:'DT', x:28,  y:-20,  color:'#F87171',unit:'dl',isExtra:true },
  { id:'xDE2',label:'DE', x:70,  y:-20,  color:'#F87171',unit:'dl',isExtra:true },
  { id:'xMLB',label:'MLB',x:0,   y:-70,  color:'#60A5FA',unit:'lb',isExtra:true },
  { id:'xWLB',label:'WLB',x:-60, y:-70,  color:'#60A5FA',unit:'lb',isExtra:true },
  { id:'xSLB',label:'SLB',x:60,  y:-70,  color:'#60A5FA',unit:'lb',isExtra:true },
  { id:'xCB1',label:'CB', x:-160,y:-20,  color:'#FFE033',unit:'db',isExtra:true },
  { id:'xCB2',label:'CB', x:160, y:-20,  color:'#FFE033',unit:'db',isExtra:true },
  { id:'xSS', label:'SS', x:80,  y:-130, color:'#C084FC',unit:'db',isExtra:true },
  { id:'xFS', label:'FS', x:-30, y:-150, color:'#C084FC',unit:'db',isExtra:true },
]

const EXTRA_OFF = [
  { id:'xC',  label:'C',  x:0,   y:0,   color:'#4ADE80',unit:'ol',   isExtra:true },
  { id:'xLG', label:'LG', x:-28, y:0,   color:'#4ADE80',unit:'ol',   isExtra:true },
  { id:'xRG', label:'RG', x:28,  y:0,   color:'#4ADE80',unit:'ol',   isExtra:true },
  { id:'xLT', label:'LT', x:-58, y:0,   color:'#4ADE80',unit:'ol',   isExtra:true },
  { id:'xRT', label:'RT', x:58,  y:0,   color:'#4ADE80',unit:'ol',   isExtra:true },
  { id:'xTE', label:'TE', x:90,  y:0,   color:'#4ADE80',unit:'ol',   isExtra:true },
  { id:'xQB', label:'QB', x:0,   y:55,  color:'#FFE033',unit:'skill',isExtra:true },
  { id:'xRB', label:'RB', x:20,  y:100, color:'#60A5FA',unit:'skill',isExtra:true },
  { id:'xWR1',label:'X',  x:-170,y:0,   color:'#F87171',unit:'skill',isExtra:true },
  { id:'xWR2',label:'Z',  x:160, y:5,   color:'#F87171',unit:'skill',isExtra:true },
]

const LINEMAN_STUDIO_POSITIONS = [
  { id:'ls_LT', label:'LT',  x:-58, y:0,   color:'#4ADE80',unit:'ol', side:'off' },
  { id:'ls_LG', label:'LG',  x:-28, y:0,   color:'#4ADE80',unit:'ol', side:'off' },
  { id:'ls_C',  label:'C',   x:0,   y:0,   color:'#4ADE80',unit:'ol', side:'off' },
  { id:'ls_RG', label:'RG',  x:28,  y:0,   color:'#4ADE80',unit:'ol', side:'off' },
  { id:'ls_RT', label:'RT',  x:58,  y:0,   color:'#4ADE80',unit:'ol', side:'off' },
  { id:'ls_TE', label:'TE',  x:90,  y:0,   color:'#4ADE80',unit:'ol', side:'off' },
  { id:'ls_FB', label:'FB',  x:0,   y:55,  color:'#60A5FA',unit:'skill',side:'off' },
  { id:'ls_DE1',label:'DE',  x:-75, y:-28, color:'#F87171',unit:'dl', side:'def' },
  { id:'ls_DT1',label:'DT',  x:-25, y:-28, color:'#F87171',unit:'dl', side:'def' },
  { id:'ls_DT2',label:'DT',  x:25,  y:-28, color:'#F87171',unit:'dl', side:'def' },
  { id:'ls_DE2',label:'DE',  x:75,  y:-28, color:'#F87171',unit:'dl', side:'def' },
  { id:'ls_MLB',label:'MLB', x:0,   y:-80, color:'#60A5FA',unit:'lb', side:'def' },
  { id:'ls_WLB',label:'WLB', x:-55, y:-80, color:'#60A5FA',unit:'lb', side:'def' },
  { id:'ls_SLB',label:'SLB', x:55,  y:-80, color:'#60A5FA',unit:'lb', side:'def' },
]

const BLOCK_TYPES = [
  { id:'drive',   label:'Drive Block',  color:'#4ADE80',endCap:'T',    group:'off' },
  { id:'down',    label:'Down Block',   color:'#4ADE80',endCap:'T',    group:'off' },
  { id:'pullL',   label:'Pull Left',    color:'#FFE033',endCap:'arrow',group:'off' },
  { id:'pullR',   label:'Pull Right',   color:'#FFE033',endCap:'arrow',group:'off' },
  { id:'double',  label:'Double Team',  color:'#60A5FA',endCap:'T',    group:'off' },
  { id:'reach',   label:'Reach Block',  color:'#4ADE80',endCap:'T',    group:'off' },
  { id:'trap',    label:'Trap Block',   color:'#C084FC',endCap:'T',    group:'off' },
  { id:'passset', label:'Pass Set',     color:'#60A5FA',endCap:'dot',  group:'off' },
  { id:'zone',    label:'Zone Step',    color:'#4ADE80',endCap:'T',    group:'off' },
  { id:'combo',   label:'Combo/Climb',  color:'#60A5FA',endCap:'T',    group:'off' },
  { id:'stunt',   label:'Stunt/Twist',  color:'#F87171',endCap:'arrow',group:'def' },
  { id:'slant',   label:'Slant',        color:'#F87171',endCap:'arrow',group:'def' },
  { id:'swim',    label:'Swim/Spin',    color:'#C084FC',endCap:'arrow',group:'def' },
  { id:'blitz',   label:'LB Blitz',     color:'#F87171',endCap:'arrow',group:'def' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initPlayers(mode) {
  const defs = mode === 'offense' ? OFFENSE_POSITIONS : DEFENSE_POSITIONS
  const bx = LOS_X, by = FIELD_H / 2
  return defs.map(p => ({ ...p, cx: bx + p.x, cy: by + p.y }))
}
function initLSPlayers() {
  const bx = LOS_X, by = FIELD_H / 2
  return LINEMAN_STUDIO_POSITIONS.map(p => ({ ...p, cx: bx + p.x, cy: by + p.y }))
}
function blockColor(id) { return BLOCK_TYPES.find(b => b.id === id)?.color || '#4ADE80' }
function blockCap(id)   { return BLOCK_TYPES.find(b => b.id === id)?.endCap || 'T' }
function timeAgo(ts) {
  if (!ts) return ''
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

// ─── SVG path functions ───────────────────────────────────────────────────────
function catmullRom(pts, tension = 0.5) {
  if (!pts || pts.length < 2) return ''
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i]
    const p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}
function arrowHead(pts, size = 10) {
  if (!pts || pts.length < 2) return null
  const l = pts[pts.length - 1], v = pts[pts.length - 2]
  const a = Math.atan2(l.y - v.y, l.x - v.x)
  return `M${l.x},${l.y} L${l.x - size * Math.cos(a - 0.4)},${l.y - size * Math.sin(a - 0.4)} M${l.x},${l.y} L${l.x - size * Math.cos(a + 0.4)},${l.y - size * Math.sin(a + 0.4)}`
}
function tCap(pts, size = 8) {
  if (!pts || pts.length < 2) return null
  const l = pts[pts.length - 1], v = pts[pts.length - 2]
  const a = Math.atan2(l.y - v.y, l.x - v.x)
  const px = Math.sin(a), py = -Math.cos(a)
  return `M${l.x - size * px},${l.y - size * py} L${l.x + size * px},${l.y + size * py}`
}
function zigzag(pts) {
  if (!pts || pts.length < 2) return ''
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i+1].x - pts[i].x, dy = pts[i+1].y - pts[i].y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const steps = Math.max(1, Math.round(dist / 12))
    for (let s = 1; s <= steps; s++) {
      const t = s / steps
      const mx = pts[i].x + dx * (t - 0.5 / steps), my = pts[i].y + dy * (t - 0.5 / steps)
      const perp = ((s % 2 === 0 ? 1 : -1) * 6 * dy) / dist
      d += ` L${mx + perp * -dy / dist},${my + perp * dx / dist}`
    }
    d += ` L${pts[i+1].x},${pts[i+1].y}`
  }
  return d
}
function lerp(a, b, t) { return a + (b - a) * t }
function getSVGPt(ref, e) {
  const svg = ref.current, rect = svg.getBoundingClientRect()
  const cx = e.touches ? e.touches[0].clientX : e.clientX
  const cy = e.touches ? e.touches[0].clientY : e.clientY
  return { x: (cx - rect.left) * (FIELD_W / rect.width), y: (cy - rect.top) * (FIELD_H / rect.height) }
}

// ─── Field Component ──────────────────────────────────────────────────────────
function FootballField({ showGaps = false }) {
  return (
    <g>
      <rect x={0} y={0} width={FIELD_W} height={FIELD_H} fill="#0d2b10" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={(10 + i * 10) * YARD_W} y={0} width={10 * YARD_W} height={FIELD_H}
          fill={i % 2 === 0 ? '#0d2b10' : '#0f3213'} />
      ))}
      <rect x={0} y={0} width={10 * YARD_W} height={FIELD_H} fill="#0b2540" opacity={0.8} />
      <rect x={110 * YARD_W} y={0} width={10 * YARD_W} height={FIELD_H} fill="#2b0b0b" opacity={0.8} />
      {Array.from({ length: 21 }, (_, i) => i * 5).map(y => (
        <line key={y} x1={y * YARD_W} y1={0} x2={y * YARD_W} y2={FIELD_H}
          stroke="rgba(255,255,255,0.15)" strokeWidth={y % 10 === 0 ? 1.5 : 0.5} />
      ))}
      {Array.from({ length: 99 }, (_, i) => i + 11).map(y => (
        <g key={y}>
          <line x1={y * YARD_W - 3} y1={HASH_Y1} x2={y * YARD_W + 3} y2={HASH_Y1} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
          <line x1={y * YARD_W - 3} y1={HASH_Y2} x2={y * YARD_W + 3} y2={HASH_Y2} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
        </g>
      ))}
      {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((n, i) => (
        <text key={i} x={(20 + i * 10) * YARD_W} y={FIELD_H * 0.18} textAnchor="middle"
          fill="rgba(255,255,255,0.28)" fontSize={12} fontFamily="monospace" fontWeight="bold">{n}</text>
      ))}
      <line x1={LOS_X} y1={0} x2={LOS_X} y2={FIELD_H} stroke="#FFE033" strokeWidth={1.5} strokeDasharray="6,4" opacity={0.5} />
      <text x={LOS_X + 4} y={13} fill="#FFE033" fontSize={9} fontFamily="monospace" opacity={0.6}>LOS</text>
      <rect x={0} y={0} width={FIELD_W} height={FIELD_H} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
      {showGaps && [
        { l:'A', x:14 }, { l:'A', x:-14 }, { l:'B', x:42 }, { l:'B', x:-42 }, { l:'C', x:74 }, { l:'C', x:-74 }
      ].map((g, i) => (
        <text key={i} x={LOS_X + g.x} y={FIELD_H / 2 - 20} textAnchor="middle"
          fill="rgba(255,220,50,0.45)" fontSize={10} fontFamily="monospace" fontWeight="bold">{g.l}</text>
      ))}
    </g>
  )
}

// ─── Player Icon ───────────────────────────────────────────────────────────────
function PlayerIcon({ p, selected, hasRoute, drawingActive, onPointerDown, cx: animCx, cy: animCy }) {
  const isLiner = p.unit === 'ol' || p.unit === 'dl'
  const cx = animCx !== undefined ? animCx : p.cx
  const cy = animCy !== undefined ? animCy : p.cy
  const s = 13, r = 14
  const glow = selected ? 'drop-shadow(0 0 7px #FFE033)' : drawingActive ? 'drop-shadow(0 0 6px #fff)' : 'none'
  const sw = selected || hasRoute ? 2.5 : 1.5
  const fillHex = Math.round((p.isExtra ? 0.07 : 0.15) * 255).toString(16).padStart(2, '0')
  return (
    <g style={{ cursor: 'pointer' }} onPointerDown={onPointerDown}>
      {isLiner
        ? <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} rx={2}
            fill={`${p.color}${fillHex}`} stroke={p.color} strokeWidth={sw}
            strokeDasharray={p.isExtra ? '4,3' : 'none'} style={{ filter: glow }} />
        : <circle cx={cx} cy={cy} r={r}
            fill={`${p.color}${fillHex}`} stroke={p.color} strokeWidth={sw}
            strokeDasharray={p.isExtra ? '4,3' : 'none'} style={{ filter: glow }} />
      }
      <text x={cx} y={cy + 4} textAnchor="middle" fill={p.color}
        fontSize={p.label.length > 2 ? 8 : 10} fontWeight="bold" fontFamily="monospace"
        style={{ pointerEvents: 'none' }}>{p.label}</text>
    </g>
  )
}

// ─── Route Layer ───────────────────────────────────────────────────────────────
function RouteLayer({ r, lineStyle, endCap, highlight }) {
  if (!r || !r.pts || r.pts.length < 2) return null
  const color = highlight ? '#fff' : (r.color || '#FFE033')
  const cap   = r.endCap || endCap || 'arrow'
  const style = r.lineStyle || lineStyle || 'solid'
  const dash  = style === 'dashed' ? '8,5' : style === 'dotted' ? '3,4' : 'none'
  const d     = style === 'zigzag' ? zigzag(r.pts) : catmullRom(r.pts)
  const ah    = arrowHead(r.pts)
  const tc    = tCap(r.pts)
  const last  = r.pts[r.pts.length - 1]
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={highlight ? 3 : 2}
        strokeDasharray={dash} opacity={0.92} strokeLinecap="round" strokeLinejoin="round" />
      {cap === 'arrow' && ah && <path d={ah} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />}
      {cap === 'T'     && tc && <path d={tc} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />}
      {cap === 'dot'         && <circle cx={last.x} cy={last.y} r={4} fill={color} />}
    </g>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,         setTab]         = useState('designer')
  const [mode,        setMode]        = useState('offense')
  const [players,     setPlayers]     = useState(() => initPlayers('offense'))
  const [routes,      setRoutes]      = useState({})
  const [drawingFor,  setDrawingFor]  = useState(null)
  const [currentPts,  setCurrentPts]  = useState([])
  const [lineStyle,   setLineStyle]   = useState('solid')
  const [endCap,      setEndCap]      = useState('arrow')
  const [blockType,   setBlockType]   = useState('drive')
  const [dragging,    setDragging]    = useState(null)
  const [selected,    setSelected]    = useState(null)
  const [tool,        setTool]        = useState('move')
  const [animating,   setAnimating]   = useState(false)
  const [animT,       setAnimT]       = useState(0)
  const [animSnap,    setAnimSnap]    = useState(null)
  const [playName,    setPlayName]    = useState('')
  const [authorName,  setAuthorName]  = useState(() => localStorage.getItem('gs_author') || '')
  const [showGaps,    setShowGaps]    = useState(false)
  const [showInfo,    setShowInfo]    = useState(false)
  const [lsPlayers,   setLsPlayers]   = useState(() => initLSPlayers())
  const [lsRoutes,    setLsRoutes]    = useState({})
  const [lsDrawFor,   setLsDrawFor]   = useState(null)
  const [lsCurPts,    setLsCurPts]    = useState([])
  const [lsDragging,  setLsDragging]  = useState(null)
  const [lsSelected,  setLsSelected]  = useState(null)
  const [lsBlockType, setLsBlockType] = useState('drive')
  const [lsTool,      setLsTool]      = useState('move')
  const [lsShowGaps,  setLsShowGaps]  = useState(true)
  const [boardStrokes,setBoardStrokes]= useState([])
  const [boardCurrent,setBoardCurrent]= useState([])
  const [boardColor,  setBoardColor]  = useState('#FFE033')
  const [boardWidth,  setBoardWidth]  = useState(3)
  const [boardDrawing,setBoardDrawing]= useState(false)

  const svgRef   = useRef(null)
  const lsSvgRef = useRef(null)
  const boardRef = useRef(null)
  const animRef  = useRef(null)

  const { plays, syncStatus, lastSync, storageOk, load, addPlay, deletePlay } = useSharedPlays()

  useEffect(() => {
    if (authorName) localStorage.setItem('gs_author', authorName)
  }, [authorName])

  // ── Mode ────────────────────────────────────────────────────────────────────
  const switchMode = (m) => {
    setMode(m); setPlayers(initPlayers(m)); setRoutes({})
    setDrawingFor(null); setCurrentPts([]); setAnimating(false)
    setAnimSnap(null); setSelected(null); setTool('move')
  }
  const hasExtra = players.some(p => p.isExtra)
  const addExtra = (side) => {
    const bx = LOS_X, by = FIELD_H / 2
    const defs = side === 'def' ? EXTRA_DEF : EXTRA_OFF
    const ex = players.map(p => p.id)
    setPlayers(prev => [...prev, ...defs.filter(p => !ex.includes(p.id))
      .map(p => ({ ...p, cx: bx + p.x, cy: by + p.y }))])
  }
  const removeExtra = () => setPlayers(prev => prev.filter(p => !p.isExtra))

  // ── Pointer handlers (shared factory) ──────────────────────────────────────
  const makeHandlers = (ref, pList, setPList, rMap, setRMap, dFor, setDFor, cPts, setCPts, drag, setDrag, sel, setSel, curTool, curBT) => ({
    onPlayerDown: (e, id) => {
      if (animating) return
      e.stopPropagation(); setSel(id)
      const pt = getSVGPt(ref, e)
      if (curTool === 'move') {
        const p = pList.find(p => p.id === id)
        setDrag({ id, ox: pt.x - p.cx, oy: pt.y - p.cy })
      } else {
        setDFor(id); setCPts([{ x: pt.x, y: pt.y }])
      }
    },
    onMove: (e) => {
      if (animating) return
      const pt = getSVGPt(ref, e)
      if (drag) setPList(prev => prev.map(p => p.id === drag.id ? { ...p, cx: pt.x - drag.ox, cy: pt.y - drag.oy } : p))
      if (dFor) setCPts(prev => {
        const l = prev[prev.length - 1]
        return (!l || Math.hypot(pt.x - l.x, pt.y - l.y) > 5) ? [...prev, { x: pt.x, y: pt.y }] : prev
      })
    },
    onUp: () => {
      if (drag) setDrag(null)
      if (dFor && cPts.length > 1) {
        const isBlock = curTool === 'block'
        setRMap(prev => ({ ...prev, [dFor]: {
          pts: cPts,
          color:     isBlock ? blockColor(curBT) : '#FFE033',
          lineStyle: isBlock ? 'solid' : lineStyle,
          endCap:    isBlock ? blockCap(curBT)   : endCap,
          blockType: isBlock ? curBT : null,
        }}))
        setDFor(null); setCPts([])
      } else if (dFor) { setDFor(null); setCPts([]) }
    },
    onSvgClick: (e) => { if (e.target === ref.current) setSel(null) },
  })

  const mH = makeHandlers(svgRef,   players,   setPlayers,   routes,   setRoutes,   drawingFor, setDrawingFor, currentPts, setCurrentPts, dragging,   setDragging,   selected,   setSelected,   tool,   blockType)
  const lH = makeHandlers(lsSvgRef, lsPlayers, setLsPlayers, lsRoutes, setLsRoutes, lsDrawFor,  setLsDrawFor,  lsCurPts,   setLsCurPts,   lsDragging, setLsDragging, lsSelected, setLsSelected, lsTool, lsBlockType)

  // ── Animation ───────────────────────────────────────────────────────────────
  const startAnim = () => {
    if (animating) { cancelAnimationFrame(animRef.current); setAnimating(false); setAnimSnap(null); setAnimT(0); return }
    setAnimating(true); setAnimSnap(players.map(p => ({ ...p })))
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const t = Math.min((ts - start) / 2400, 1)
      setAnimT(t)
      if (t < 1) animRef.current = requestAnimationFrame(step)
      else { setAnimating(false); setAnimSnap(null); setAnimT(0) }
    }
    animRef.current = requestAnimationFrame(step)
  }
  useEffect(() => () => cancelAnimationFrame(animRef.current), [])
  const getAnimPos = (p) => {
    const r = routes[p.id]; if (!r || !animSnap) return null
    const base = animSnap.find(a => a.id === p.id); if (!base) return null
    const tot = r.pts.length - 1; if (tot <= 0) return { cx: base.cx, cy: base.cy }
    const pos = animT * tot, idx = Math.min(Math.floor(pos), tot - 1), frac = pos - idx
    return { cx: lerp(r.pts[idx].x, r.pts[Math.min(idx + 1, tot)].x, frac), cy: lerp(r.pts[idx].y, r.pts[Math.min(idx + 1, tot)].y, frac) }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const doSave = async (section) => {
    if (!playName.trim()) { alert('Enter a play name first.'); return }
    const play = {
      id:      Date.now(),
      name:    playName.trim(),
      mode:    section === 'lineman' ? 'lineman' : mode,
      section,
      author:  authorName || 'Coach',
      savedAt: Date.now(),
      players: section === 'lineman' ? lsPlayers.map(p => ({ ...p })) : players.map(p => ({ ...p })),
      routes:  section === 'lineman' ? { ...lsRoutes } : { ...routes },
    }
    const ok = await addPlay(play)
    if (ok) setPlayName('')
  }
  const loadPlay = (play) => {
    if (play.section === 'lineman') { setLsPlayers(play.players); setLsRoutes(play.routes); setTab('lineman') }
    else { setMode(play.mode); setPlayers(play.players); setRoutes(play.routes); setTab('designer') }
  }

  // ── Quick schemes ────────────────────────────────────────────────────────────
  const applyScheme = (scheme) => {
    const offIds = ['ls_LT','ls_LG','ls_C','ls_RG','ls_RT','ls_TE']
    const getP = (id) => lsPlayers.find(p => p.id === id)
    const nr = {}
    if (scheme === 'zoneL')
      lsPlayers.filter(p => offIds.includes(p.id)).forEach(p => { nr[p.id] = { pts:[{x:p.cx,y:p.cy},{x:p.cx-22,y:p.cy-2}], color:'#4ADE80', lineStyle:'solid', endCap:'T', blockType:'zone' } })
    else if (scheme === 'zoneR')
      lsPlayers.filter(p => offIds.includes(p.id)).forEach(p => { nr[p.id] = { pts:[{x:p.cx,y:p.cy},{x:p.cx+22,y:p.cy-2}], color:'#4ADE80', lineStyle:'solid', endCap:'T', blockType:'zone' } })
    else if (scheme === 'man') {
      const pairs = { ls_LT:'ls_DE1', ls_LG:'ls_DT1', ls_C:'ls_DT2', ls_RG:'ls_DT2', ls_RT:'ls_DE2', ls_TE:'ls_DE2' }
      Object.entries(pairs).forEach(([oid, did]) => { const op=getP(oid), dp=getP(did); if(op&&dp) nr[oid]={pts:[{x:op.cx,y:op.cy},{x:dp.cx,y:dp.cy}],color:'#4ADE80',lineStyle:'solid',endCap:'T',blockType:'drive'} })
    } else if (scheme === 'pass')
      lsPlayers.filter(p => offIds.includes(p.id)).forEach((p, i) => { const dx=i<3?-8:8; nr[p.id]={pts:[{x:p.cx,y:p.cy},{x:p.cx+dx,y:p.cy+28}],color:'#60A5FA',lineStyle:'solid',endCap:'dot',blockType:'passset'} })
    setLsRoutes(nr)
  }

  // ── Board ───────────────────────────────────────────────────────────────────
  const getBPt = (e) => {
    const r = boardRef.current.getBoundingClientRect()
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const cy = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (cx - r.left) * (800 / r.width), y: (cy - r.top) * (500 / r.height) }
  }

  // ── UI helpers ──────────────────────────────────────────────────────────────
  const SL = (txt) => <div style={{fontSize:9,color:'#4ade80',letterSpacing:1.5,marginBottom:4,marginTop:6,opacity:0.9}}>{txt}</div>
  const BtnRow = (label, active, onClick, color = '#FFE033') => (
    <button onClick={onClick} style={{padding:'4px 6px',borderRadius:4,border:`1px solid ${active?color:'#2d5a30'}`,background:active?`${color}22`:'transparent',color:active?color:'#a7f3a7',fontFamily:'monospace',fontSize:10,fontWeight:'bold',cursor:'pointer',width:'100%',marginBottom:2,textAlign:'left'}}>{label}</button>
  )
  const syncBadge = () => {
    const cfg = { idle:{bg:'#1d4a20',color:'#4ade80',txt:'● Live'}, saving:{bg:'#2a3a00',color:'#FFE033',txt:'⟳ Saving…'}, saved:{bg:'#0f3a1a',color:'#4ade80',txt:'✓ Saved'}, error:{bg:'#3a0a0a',color:'#F87171',txt:'! Offline'}, loading:{bg:'#1a2a3a',color:'#60A5FA',txt:'⟳ Loading'} }[syncStatus] || {bg:'#1d4a20',color:'#4ade80',txt:'● Live'}
    return <div style={{fontSize:9,padding:'3px 8px',borderRadius:10,background:cfg.bg,color:cfg.color,fontFamily:'monospace',letterSpacing:0.5,cursor:'default'}}>{cfg.txt}{lastSync && syncStatus==='idle' ? ` · ${timeAgo(lastSync)}` : ''}</div>
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh',background:'#060e07',color:'#e8f5e9',fontFamily:"'Courier New',monospace",display:'flex',flexDirection:'column'}}>

      {/* Header */}
      <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',background:'#0a1a0c',borderBottom:'2px solid #1d4a20',flexWrap:'wrap',gap:6}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:18,fontWeight:'bold',color:'#FFE033',letterSpacing:1}}>🏈 GRIDIRON STUDIO</span>
          {syncBadge()}
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {[['designer','🎯 Designer'],['lineman','🔲 Lineman'],['board','✏️ Board'],['plays','📋 Playbook']].map(([t,lbl])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'4px 10px',borderRadius:4,border:'1px solid',borderColor:tab===t?'#FFE033':'#2d5a30',background:tab===t?'#FFE033':'transparent',color:tab===t?'#060e07':'#a7f3a7',fontFamily:'monospace',fontWeight:'bold',fontSize:10,cursor:'pointer'}}>{lbl}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:5,alignItems:'center'}}>
          <span style={{fontSize:9,color:'#4ade80',opacity:0.7}}>👤</span>
          <input value={authorName} onChange={e=>setAuthorName(e.target.value)} placeholder="Your name" style={{width:90,padding:'3px 6px',background:'#0d2b10',border:'1px solid #2d5a30',borderRadius:4,color:'#e8f5e9',fontFamily:'monospace',fontSize:10}}/>
          <button onClick={()=>setShowInfo(!showInfo)} style={{background:'none',border:'1px solid #2d5a30',color:'#a7f3a7',borderRadius:4,padding:'3px 8px',cursor:'pointer',fontSize:10}}>?</button>
        </div>
      </header>

      {!storageOk && (
        <div style={{background:'#3a1010',borderBottom:'1px solid #7f1d1d',padding:'5px 14px',fontSize:11,color:'#F87171',fontFamily:'monospace'}}>
          ⚠️ Database connection issue — check your Supabase credentials in .env.local
          <button onClick={()=>load()} style={{marginLeft:10,padding:'2px 8px',borderRadius:3,border:'1px solid #F87171',background:'transparent',color:'#F87171',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Retry</button>
        </div>
      )}

      {/* Info modal */}
      {showInfo && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowInfo(false)}>
          <div style={{background:'#0a1a0c',border:'1px solid #2d5a30',borderRadius:8,padding:22,maxWidth:460,color:'#c8e6c9',fontSize:12,lineHeight:1.9}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:14,fontWeight:'bold',color:'#FFE033',marginBottom:8}}>Gridiron Studio — Team Edition</div>
            <div><b style={{color:'#4ADE80'}}>Shared Playbook</b> — Saves go to Supabase; all coaches see updates in real time</div>
            <div><b style={{color:'#4ADE80'}}>Your Name</b> — Set it in the header; it's stored on every play you save</div>
            <div><b style={{color:'#4ADE80'}}>Move / Route / Block</b> — Three tools for skill routes and blocking schemes</div>
            <div><b style={{color:'#4ADE80'}}>Lineman Studio</b> — Full OL vs DL, 10 block types + 4 defensive assignments</div>
            <div><b style={{color:'#4ADE80'}}>Add Opponent</b> — Layer the other unit onto any play</div>
            <div><b style={{color:'#4ADE80'}}>▶ Play</b> — Animate all players along routes</div>
            <div style={{marginTop:6,fontSize:10,color:'#6b7280'}}>Squares = linemen · Circles = skill · Dashed border = added opponent</div>
            <button onClick={()=>setShowInfo(false)} style={{marginTop:12,padding:'5px 16px',background:'#FFE033',color:'#060e07',border:'none',borderRadius:4,fontWeight:'bold',cursor:'pointer',fontFamily:'monospace'}}>Got it</button>
          </div>
        </div>
      )}

      {/* Designer */}
      {tab==='designer' && (
        <div style={{display:'flex',flex:1}}>
          <div style={{width:182,background:'#080f09',borderRight:'1px solid #1d4a20',padding:'10px 8px',display:'flex',flexDirection:'column',gap:6,overflowY:'auto'}}>
            {SL('SIDE')}
            <div style={{display:'flex',gap:3}}>
              {['offense','defense'].map(m=>(
                <button key={m} onClick={()=>switchMode(m)} style={{flex:1,padding:'5px 0',borderRadius:4,border:'1px solid',borderColor:mode===m?(m==='offense'?'#4ADE80':'#F87171'):'#2d5a30',background:mode===m?(m==='offense'?'rgba(74,222,128,0.12)':'rgba(248,113,113,0.12)'):'transparent',color:mode===m?(m==='offense'?'#4ADE80':'#F87171'):'#a7f3a7',fontFamily:'monospace',fontSize:10,fontWeight:'bold',cursor:'pointer',textTransform:'uppercase'}}>{m==='offense'?'OFF':'DEF'}</button>
              ))}
            </div>
            {SL('ADD OPPONENT')}
            {!hasExtra
              ? <button onClick={()=>addExtra(mode==='offense'?'def':'off')} style={{padding:'4px 6px',borderRadius:4,border:'1px dashed #444',background:'rgba(255,255,255,0.03)',color:'#888',fontFamily:'monospace',fontSize:10,cursor:'pointer',textAlign:'left'}}>+ Add {mode==='offense'?'Defense':'Offense'}</button>
              : <button onClick={removeExtra} style={{padding:'4px 6px',borderRadius:4,border:'1px solid #b91c1c',background:'rgba(185,28,28,0.1)',color:'#F87171',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>✕ Remove Added</button>
            }
            {SL('TOOL')}
            <div style={{display:'flex',gap:3}}>
              {[['move','✋'],['route','✏️'],['block','🔲']].map(([t,ic])=>(
                <button key={t} onClick={()=>setTool(t)} title={t} style={{flex:1,padding:'5px 0',borderRadius:4,border:'1px solid',borderColor:tool===t?'#FFE033':'#2d5a30',background:tool===t?'rgba(255,224,51,0.1)':'transparent',color:tool===t?'#FFE033':'#a7f3a7',fontFamily:'monospace',fontSize:14,cursor:'pointer'}}>{ic}</button>
              ))}
            </div>
            {tool==='route' && <>
              {SL('ROUTE STYLE')}
              {[['solid','─── Route','#FFE033'],['dashed','- - Pass','#60A5FA'],['zigzag','∿ Motion','#F87171']].map(([s,lbl,c])=>BtnRow(lbl,lineStyle===s,()=>setLineStyle(s),c))}
              {SL('END CAP')}
              <div style={{display:'flex',gap:3}}>
                {[['arrow','→'],['T','T'],['dot','●']].map(([c,lbl])=>(
                  <button key={c} onClick={()=>setEndCap(c)} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid',borderColor:endCap===c?'#FFE033':'#2d5a30',background:endCap===c?'rgba(255,224,51,0.1)':'transparent',color:endCap===c?'#FFE033':'#a7f3a7',fontFamily:'monospace',fontSize:13,cursor:'pointer'}}>{lbl}</button>
                ))}
              </div>
            </>}
            {tool==='block' && <>
              {SL('BLOCK TYPE')}
              {BLOCK_TYPES.filter(b=>b.group==='off').map(b=>BtnRow(b.label,blockType===b.id,()=>setBlockType(b.id),b.color))}
            </>}
            {SL('OPTIONS')}
            <button onClick={()=>setShowGaps(!showGaps)} style={{padding:'3px 6px',borderRadius:4,border:`1px solid ${showGaps?'#FFE033':'#2d5a30'}`,background:showGaps?'rgba(255,224,51,0.08)':'transparent',color:showGaps?'#FFE033':'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>{showGaps?'✓ ':''}Gap Labels</button>
            <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:3}}>
              <button onClick={startAnim} style={{padding:'6px 0',borderRadius:4,border:'none',background:animating?'#b91c1c':'#FFE033',color:'#060e07',fontFamily:'monospace',fontWeight:'bold',fontSize:12,cursor:'pointer'}}>{animating?'■ Stop':'▶ Play'}</button>
              <button onClick={()=>setRoutes({})} style={{padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Clear Routes</button>
              <button onClick={()=>{setPlayers(initPlayers(mode));setRoutes({})}} style={{padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Reset Field</button>
              <input value={playName} onChange={e=>setPlayName(e.target.value)} placeholder="Play name…" style={{padding:'4px 6px',background:'#0d2b10',border:'1px solid #2d5a30',borderRadius:4,color:'#e8f5e9',fontFamily:'monospace',fontSize:10,width:'100%',boxSizing:'border-box'}}/>
              <button onClick={()=>doSave('designer')} disabled={syncStatus==='saving'} style={{padding:'5px 0',borderRadius:4,border:'1px solid #4ade80',background:'rgba(74,222,128,0.08)',color:'#4ade80',fontFamily:'monospace',fontSize:10,cursor:'pointer',opacity:syncStatus==='saving'?0.5:1}}>{syncStatus==='saving'?'⟳ Saving…':'💾 Save & Share'}</button>
            </div>
          </div>
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:10}}>
            <svg ref={svgRef} viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
              style={{width:'100%',maxWidth:FIELD_W,borderRadius:6,cursor:tool==='move'?(dragging?'grabbing':'default'):'crosshair',userSelect:'none',touchAction:'none',boxShadow:'0 0 28px rgba(0,0,0,0.8)'}}
              onPointerMove={mH.onMove} onPointerUp={mH.onUp} onPointerLeave={mH.onUp} onClick={mH.onSvgClick}>
              <FootballField showGaps={showGaps}/>
              {Object.entries(routes).map(([id,r])=><RouteLayer key={id} r={r} lineStyle={lineStyle} endCap={endCap}/>)}
              {drawingFor && currentPts.length>1 && <RouteLayer r={{pts:currentPts,color:'#fff',lineStyle:tool==='block'?'solid':lineStyle,endCap:tool==='block'?blockCap(blockType):endCap}} lineStyle={lineStyle} endCap={endCap} highlight/>}
              {players.map(p=>{const ap=animating&&animSnap?getAnimPos(p):null;return<PlayerIcon key={p.id} p={p} selected={selected===p.id} hasRoute={!!routes[p.id]} drawingActive={drawingFor===p.id} cx={ap?.cx} cy={ap?.cy} onPointerDown={e=>mH.onPlayerDown(e,p.id)}/>})}
              {!animating && <ellipse cx={LOS_X} cy={FIELD_H/2-8} rx={7} ry={4.5} fill="#8B4513" stroke="#FFE033" strokeWidth={1} opacity={0.9}/>}
            </svg>
          </div>
        </div>
      )}

      {/* Lineman Studio */}
      {tab==='lineman' && (
        <div style={{display:'flex',flex:1}}>
          <div style={{width:200,background:'#080f09',borderRight:'1px solid #1d4a20',padding:'10px 8px',display:'flex',flexDirection:'column',gap:6,overflowY:'auto'}}>
            <div style={{fontSize:11,fontWeight:'bold',color:'#FFE033',marginBottom:2}}>🔲 Lineman Studio</div>
            {SL('TOOL')}
            <div style={{display:'flex',gap:3}}>
              {[['move','✋ Move'],['block','🔲 Assign']].map(([t,lbl])=>(
                <button key={t} onClick={()=>setLsTool(t)} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid',borderColor:lsTool===t?'#FFE033':'#2d5a30',background:lsTool===t?'rgba(255,224,51,0.1)':'transparent',color:lsTool===t?'#FFE033':'#a7f3a7',fontFamily:'monospace',fontSize:9,fontWeight:'bold',cursor:'pointer'}}>{lbl}</button>
              ))}
            </div>
            {SL('OFFENSIVE BLOCKS')}
            {BLOCK_TYPES.filter(b=>b.group==='off').map(b=>BtnRow(b.label,lsBlockType===b.id,()=>setLsBlockType(b.id),b.color))}
            {SL('DEFENSIVE ASSIGNMENTS')}
            {BLOCK_TYPES.filter(b=>b.group==='def').map(b=>BtnRow(b.label,lsBlockType===b.id,()=>setLsBlockType(b.id),b.color))}
            {SL('QUICK SCHEMES')}
            {[['Zone Left',()=>applyScheme('zoneL')],['Zone Right',()=>applyScheme('zoneR')],['Man Block',()=>applyScheme('man')],['Pass Pro',()=>applyScheme('pass')]].map(([lbl,fn])=>(
              <button key={lbl} onClick={fn} style={{padding:'3px 6px',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer',textAlign:'left',marginBottom:2}}>{lbl}</button>
            ))}
            <button onClick={()=>setLsShowGaps(!lsShowGaps)} style={{padding:'3px 6px',borderRadius:4,border:`1px solid ${lsShowGaps?'#FFE033':'#2d5a30'}`,background:lsShowGaps?'rgba(255,224,51,0.08)':'transparent',color:lsShowGaps?'#FFE033':'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>{lsShowGaps?'✓ ':''}A/B/C Gaps</button>
            <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:3}}>
              <button onClick={()=>setLsRoutes({})} style={{padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Clear All</button>
              <button onClick={()=>{setLsPlayers(initLSPlayers());setLsRoutes({})}} style={{padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Reset</button>
              <input value={playName} onChange={e=>setPlayName(e.target.value)} placeholder="Scheme name…" style={{padding:'4px 6px',background:'#0d2b10',border:'1px solid #2d5a30',borderRadius:4,color:'#e8f5e9',fontFamily:'monospace',fontSize:10,width:'100%',boxSizing:'border-box'}}/>
              <button onClick={()=>doSave('lineman')} disabled={syncStatus==='saving'} style={{padding:'5px 0',borderRadius:4,border:'1px solid #4ade80',background:'rgba(74,222,128,0.08)',color:'#4ade80',fontFamily:'monospace',fontSize:10,cursor:'pointer',opacity:syncStatus==='saving'?0.5:1}}>{syncStatus==='saving'?'⟳ Saving…':'💾 Save & Share'}</button>
            </div>
          </div>
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:10,gap:6}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',fontFamily:'monospace'}}>🟩 Offense · 🟥 Defense · Select scheme → click player + drag</div>
            <svg ref={lsSvgRef} viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
              style={{width:'100%',maxWidth:FIELD_W,borderRadius:6,cursor:lsTool==='move'?(lsDragging?'grabbing':'default'):'crosshair',userSelect:'none',touchAction:'none',boxShadow:'0 0 28px rgba(0,0,0,0.8)'}}
              onPointerMove={lH.onMove} onPointerUp={lH.onUp} onPointerLeave={lH.onUp} onClick={lH.onSvgClick}>
              <FootballField showGaps={lsShowGaps}/>
              {lsShowGaps && [{l:'A gap',x:14},{l:'A gap',x:-14},{l:'B gap',x:42},{l:'B gap',x:-42},{l:'C gap',x:74},{l:'C gap',x:-74}].map((g,i)=>(
                <text key={i} x={LOS_X+g.x} y={FIELD_H/2+30} textAnchor="middle" fill="rgba(255,220,50,0.3)" fontSize={9} fontFamily="monospace">{g.l}</text>
              ))}
              {Object.entries(lsRoutes).map(([id,r])=><RouteLayer key={id} r={r} lineStyle="solid" endCap="T"/>)}
              {lsDrawFor && lsCurPts.length>1 && <RouteLayer r={{pts:lsCurPts,color:'#fff',lineStyle:'solid',endCap:blockCap(lsBlockType)}} lineStyle="solid" endCap={blockCap(lsBlockType)} highlight/>}
              {lsPlayers.map(p=><PlayerIcon key={p.id} p={p} selected={lsSelected===p.id} hasRoute={!!lsRoutes[p.id]} drawingActive={lsDrawFor===p.id} onPointerDown={e=>lH.onPlayerDown(e,p.id)}/>)}
              <ellipse cx={LOS_X} cy={FIELD_H/2-8} rx={7} ry={4.5} fill="#8B4513" stroke="#FFE033" strokeWidth={1} opacity={0.9}/>
            </svg>
          </div>
        </div>
      )}

      {/* Board */}
      {tab==='board' && (
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:12,gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',background:'#080f09',borderRadius:6,padding:'7px 12px',border:'1px solid #1d4a20'}}>
            <span style={{fontSize:9,color:'#4ade80',letterSpacing:1}}>COLOR</span>
            {['#FFE033','#4ADE80','#F87171','#60A5FA','#C084FC','#ffffff'].map(c=>(
              <div key={c} onClick={()=>setBoardColor(c)} style={{width:18,height:18,borderRadius:'50%',background:c,cursor:'pointer',border:boardColor===c?'3px solid white':'2px solid transparent'}}/>
            ))}
            <span style={{fontSize:9,color:'#4ade80',marginLeft:6,letterSpacing:1}}>WIDTH</span>
            {[2,4,7].map(w=>(
              <button key={w} onClick={()=>setBoardWidth(w)} style={{width:26,height:20,borderRadius:3,border:'1px solid',borderColor:boardWidth===w?'#FFE033':'#2d5a30',background:'transparent',color:boardWidth===w?'#FFE033':'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>{w}</button>
            ))}
            <button onClick={()=>setBoardStrokes([])} style={{marginLeft:6,padding:'2px 9px',borderRadius:3,border:'1px solid #2d5a30',background:'transparent',color:'#F87171',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>🗑 Clear</button>
            <button onClick={()=>setBoardStrokes(p=>p.slice(0,-1))} style={{padding:'2px 9px',borderRadius:3,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>↩ Undo</button>
          </div>
          <svg ref={boardRef} viewBox="0 0 800 500"
            style={{width:'100%',maxWidth:900,background:'#0a1f0f',borderRadius:8,cursor:'crosshair',touchAction:'none',userSelect:'none',boxShadow:'0 0 28px rgba(0,0,0,0.8)',border:'1px solid #1d4a20'}}
            onPointerDown={e=>{const p=getBPt(e);setBoardDrawing(true);setBoardCurrent([p])}}
            onPointerMove={e=>{if(!boardDrawing)return;setBoardCurrent(prev=>[...prev,getBPt(e)])}}
            onPointerUp={()=>{if(boardDrawing&&boardCurrent.length>1)setBoardStrokes(prev=>[...prev,{pts:boardCurrent,color:boardColor,width:boardWidth}]);setBoardDrawing(false);setBoardCurrent([])}}
            onPointerLeave={()=>{if(boardDrawing&&boardCurrent.length>1)setBoardStrokes(prev=>[...prev,{pts:boardCurrent,color:boardColor,width:boardWidth}]);setBoardDrawing(false);setBoardCurrent([])}}>
            {Array.from({length:26},(_,i)=><line key={`v${i}`} x1={i*32} y1={0} x2={i*32} y2={500} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>)}
            {Array.from({length:17},(_,i)=><line key={`h${i}`} x1={0} y1={i*32} x2={800} y2={i*32} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>)}
            <line x1={320} y1={0} x2={320} y2={500} stroke="#FFE033" strokeWidth={1} strokeDasharray="5,4" opacity={0.18}/>
            {boardStrokes.map((s,i)=><path key={i} d={s.pts.map((p,j)=>`${j===0?'M':'L'}${p.x},${p.y}`).join(' ')} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round"/>)}
            {boardCurrent.length>1 && <path d={boardCurrent.map((p,i)=>`${i===0?'M':'L'}${p.x},${p.y}`).join(' ')} fill="none" stroke={boardColor} strokeWidth={boardWidth} strokeLinecap="round" strokeLinejoin="round"/>}
            {boardStrokes.length===0 && !boardDrawing && <text x={400} y={250} textAnchor="middle" fill="rgba(255,255,255,0.09)" fontSize={14} fontFamily="monospace">Draw your play here…</text>}
          </svg>
        </div>
      )}

      {/* Playbook */}
      {tab==='plays' && (
        <div style={{flex:1,padding:'16px 18px',overflowY:'auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
            <div style={{fontSize:13,color:'#4ade80',letterSpacing:1}}>📋 TEAM PLAYBOOK ({plays.length} plays)</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {syncBadge()}
              <button onClick={()=>load()} style={{padding:'3px 10px',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>⟳ Refresh</button>
            </div>
          </div>
          {plays.length===0 && (
            <div style={{textAlign:'center',color:'rgba(255,255,255,0.18)',fontSize:13,padding:'60px 0',fontFamily:'monospace'}}>
              No plays saved yet.<br/>Design a play and hit 💾 Save &amp; Share.
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
            {[...plays].sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)).map(play=>(
              <div key={play.id} style={{background:'#080f09',border:'1px solid #1d4a20',borderRadius:8,padding:11,display:'flex',flexDirection:'column',gap:7}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <span style={{fontWeight:'bold',color:'#FFE033',fontSize:12}}>{play.name}</span>
                  <span style={{fontSize:8,padding:'2px 6px',borderRadius:10,background:play.mode==='offense'?'rgba(74,222,128,0.12)':play.mode==='lineman'?'rgba(255,224,51,0.12)':'rgba(248,113,113,0.12)',color:play.mode==='offense'?'#4ade80':play.mode==='lineman'?'#FFE033':'#F87171',letterSpacing:0.5}}>{play.mode?.toUpperCase()}</span>
                </div>
                <div style={{fontSize:9,color:'#4b5563',display:'flex',gap:8,flexWrap:'wrap'}}>
                  {play.author && <span>👤 {play.author}</span>}
                  {play.savedAt && <span>🕐 {timeAgo(play.savedAt)}</span>}
                  <span>{Object.keys(play.routes||{}).length} routes</span>
                </div>
                <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} style={{width:'100%',borderRadius:4,background:'#0d2b10'}}>
                  <FootballField showGaps={false}/>
                  {Object.entries(play.routes||{}).map(([id,r])=><RouteLayer key={id} r={r} lineStyle="solid" endCap="T"/>)}
                  {(play.players||[]).map(p=><PlayerIcon key={p.id} p={p} selected={false} hasRoute={!!(play.routes||{})[p.id]} drawingActive={false} onPointerDown={()=>{}}/>)}
                </svg>
                <div style={{display:'flex',gap:5}}>
                  <button onClick={()=>loadPlay(play)} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid #4ade80',background:'rgba(74,222,128,0.07)',color:'#4ade80',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Load</button>
                  <button onClick={()=>deletePlay(play.id)} style={{padding:'4px 10px',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#F87171',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
