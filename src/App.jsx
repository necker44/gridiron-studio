import { useState, useRef, useEffect, useCallback } from 'react'
import { useSharedPlays } from './hooks/useSharedPlays'

// ─── Constants ────────────────────────────────────────────────────────────────
// Vertical field: wider than tall, lines run horizontally
const FIELD_W = 560
const FIELD_H = 900
const YARD_H  = FIELD_H / 120   // yards run top-to-bottom
const LOS_Y   = FIELD_H * 0.52  // line of scrimmage (horizontal)
const HASH_X1 = FIELD_W * 0.38
const HASH_X2 = FIELD_W * 0.62

// ─── Position Bench (all available positions) ─────────────────────────────────
const OFFENSE_BENCH = [
  { label:'QB',  color:'#FFE033', unit:'skill' },
  { label:'RB',  color:'#60A5FA', unit:'skill' },
  { label:'FB',  color:'#60A5FA', unit:'skill' },
  { label:'WR',  color:'#F87171', unit:'skill' },
  { label:'TE',  color:'#4ADE80', unit:'ol'    },
  { label:'C',   color:'#4ADE80', unit:'ol'    },
  { label:'LG',  color:'#4ADE80', unit:'ol'    },
  { label:'RG',  color:'#4ADE80', unit:'ol'    },
  { label:'LT',  color:'#4ADE80', unit:'ol'    },
  { label:'RT',  color:'#4ADE80', unit:'ol'    },
  { label:'K',   color:'#a78bfa', unit:'skill' },
  { label:'P',   color:'#a78bfa', unit:'skill' },
]
const DEFENSE_BENCH = [
  { label:'DE',  color:'#F87171', unit:'dl' },
  { label:'DT',  color:'#F87171', unit:'dl' },
  { label:'NT',  color:'#F87171', unit:'dl' },
  { label:'MLB', color:'#60A5FA', unit:'lb' },
  { label:'WLB', color:'#60A5FA', unit:'lb' },
  { label:'SLB', color:'#60A5FA', unit:'lb' },
  { label:'OLB', color:'#60A5FA', unit:'lb' },
  { label:'ILB', color:'#60A5FA', unit:'lb' },
  { label:'CB',  color:'#FFE033', unit:'db' },
  { label:'SS',  color:'#C084FC', unit:'db' },
  { label:'FS',  color:'#C084FC', unit:'db' },
  { label:'NB',  color:'#FFE033', unit:'db' },
]

// ─── Default formations ───────────────────────────────────────────────────────
function makeOffense() {
  const cx = FIELD_W / 2, cy = LOS_Y
  return [
    { id:'C',   label:'C',   cx, cy, color:'#4ADE80', unit:'ol'    },
    { id:'LG',  label:'LG',  cx:cx-32,  cy, color:'#4ADE80', unit:'ol'    },
    { id:'RG',  label:'RG',  cx:cx+32,  cy, color:'#4ADE80', unit:'ol'    },
    { id:'LT',  label:'LT',  cx:cx-65,  cy, color:'#4ADE80', unit:'ol'    },
    { id:'RT',  label:'RT',  cx:cx+65,  cy, color:'#4ADE80', unit:'ol'    },
    { id:'TE',  label:'TE',  cx:cx+100, cy, color:'#4ADE80', unit:'ol'    },
    { id:'QB',  label:'QB',  cx, cy:cy+55,  color:'#FFE033', unit:'skill' },
    { id:'RB',  label:'RB',  cx:cx+20,  cy:cy+100, color:'#60A5FA', unit:'skill' },
    { id:'WR1', label:'WR',  cx:cx-170, cy, color:'#F87171', unit:'skill' },
    { id:'WR2', label:'WR',  cx:cx+175, cy:cy+5,   color:'#F87171', unit:'skill' },
    { id:'SL',  label:'SL',  cx:cx-110, cy:cy+40,  color:'#F87171', unit:'skill' },
  ]
}
function makeDefense() {
  const cx = FIELD_W / 2, cy = LOS_Y
  return [
    { id:'DE1', label:'DE',  cx:cx-75,  cy:cy-25,  color:'#F87171', unit:'dl' },
    { id:'DT1', label:'DT',  cx:cx-25,  cy:cy-25,  color:'#F87171', unit:'dl' },
    { id:'DT2', label:'DT',  cx:cx+25,  cy:cy-25,  color:'#F87171', unit:'dl' },
    { id:'DE2', label:'DE',  cx:cx+75,  cy:cy-25,  color:'#F87171', unit:'dl' },
    { id:'MLB', label:'MLB', cx,        cy:cy-80,  color:'#60A5FA', unit:'lb' },
    { id:'WLB', label:'WLB', cx:cx-65,  cy:cy-80,  color:'#60A5FA', unit:'lb' },
    { id:'SLB', label:'SLB', cx:cx+65,  cy:cy-80,  color:'#60A5FA', unit:'lb' },
    { id:'CB1', label:'CB',  cx:cx-175, cy:cy-25,  color:'#FFE033', unit:'db' },
    { id:'CB2', label:'CB',  cx:cx+175, cy:cy-25,  color:'#FFE033', unit:'db' },
    { id:'SS',  label:'SS',  cx:cx+90,  cy:cy-145, color:'#C084FC', unit:'db' },
    { id:'FS',  label:'FS',  cx:cx-35,  cy:cy-165, color:'#C084FC', unit:'db' },
  ]
}
function makeLSPlayers() {
  const cx = FIELD_W / 2, cy = LOS_Y
  return [
    { id:'ls_LT', label:'LT',  cx:cx-65, cy, color:'#4ADE80',unit:'ol',side:'off' },
    { id:'ls_LG', label:'LG',  cx:cx-32, cy, color:'#4ADE80',unit:'ol',side:'off' },
    { id:'ls_C',  label:'C',   cx,       cy, color:'#4ADE80',unit:'ol',side:'off' },
    { id:'ls_RG', label:'RG',  cx:cx+32, cy, color:'#4ADE80',unit:'ol',side:'off' },
    { id:'ls_RT', label:'RT',  cx:cx+65, cy, color:'#4ADE80',unit:'ol',side:'off' },
    { id:'ls_TE', label:'TE',  cx:cx+100,cy, color:'#4ADE80',unit:'ol',side:'off' },
    { id:'ls_FB', label:'FB',  cx,       cy:cy+60, color:'#60A5FA',unit:'skill',side:'off' },
    { id:'ls_DE1',label:'DE',  cx:cx-80, cy:cy-30, color:'#F87171',unit:'dl',side:'def' },
    { id:'ls_DT1',label:'DT',  cx:cx-27, cy:cy-30, color:'#F87171',unit:'dl',side:'def' },
    { id:'ls_DT2',label:'DT',  cx:cx+27, cy:cy-30, color:'#F87171',unit:'dl',side:'def' },
    { id:'ls_DE2',label:'DE',  cx:cx+80, cy:cy-30, color:'#F87171',unit:'dl',side:'def' },
    { id:'ls_MLB',label:'MLB', cx,       cy:cy-90, color:'#60A5FA',unit:'lb',side:'def' },
    { id:'ls_WLB',label:'WLB', cx:cx-60, cy:cy-90, color:'#60A5FA',unit:'lb',side:'def' },
    { id:'ls_SLB',label:'SLB', cx:cx+60, cy:cy-90, color:'#60A5FA',unit:'lb',side:'def' },
  ]
}

const EXTRA_DEF = DEFENSE_BENCH.map((p,i)=>({...p,id:`xd_${p.label}_${i}`,cx:FIELD_W/2+(i-5)*35,cy:LOS_Y-25,isExtra:true}))
const EXTRA_OFF = OFFENSE_BENCH.map((p,i)=>({...p,id:`xo_${p.label}_${i}`,cx:FIELD_W/2+(i-5)*35,cy:LOS_Y,isExtra:true}))

const BLOCK_TYPES = [
  { id:'drive',   label:'Drive',       color:'#4ADE80',endCap:'T',    group:'off' },
  { id:'down',    label:'Down Block',  color:'#4ADE80',endCap:'T',    group:'off' },
  { id:'pullL',   label:'Pull Left',   color:'#FFE033',endCap:'arrow',group:'off' },
  { id:'pullR',   label:'Pull Right',  color:'#FFE033',endCap:'arrow',group:'off' },
  { id:'double',  label:'Double Team', color:'#60A5FA',endCap:'T',    group:'off' },
  { id:'reach',   label:'Reach',       color:'#4ADE80',endCap:'T',    group:'off' },
  { id:'trap',    label:'Trap',        color:'#C084FC',endCap:'T',    group:'off' },
  { id:'passset', label:'Pass Set',    color:'#60A5FA',endCap:'dot',  group:'off' },
  { id:'zone',    label:'Zone Step',   color:'#4ADE80',endCap:'T',    group:'off' },
  { id:'combo',   label:'Combo/Climb', color:'#60A5FA',endCap:'T',    group:'off' },
  { id:'stunt',   label:'Stunt/Twist', color:'#F87171',endCap:'arrow',group:'def' },
  { id:'slant',   label:'Slant',       color:'#F87171',endCap:'arrow',group:'def' },
  { id:'swim',    label:'Swim/Spin',   color:'#C084FC',endCap:'arrow',group:'def' },
  { id:'blitz',   label:'LB Blitz',    color:'#F87171',endCap:'arrow',group:'def' },
]

// ─── Path helpers ──────────────────────────────────────────────────────────────
function catmullRom(pts, tension=0.5) {
  if (!pts||pts.length<2) return ''
  if (pts.length===2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`
  let d=`M${pts[0].x},${pts[0].y}`
  for (let i=0;i<pts.length-1;i++) {
    const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)]
    const cp1x=p1.x+((p2.x-p0.x)*tension)/3,cp1y=p1.y+((p2.y-p0.y)*tension)/3
    const cp2x=p2.x-((p3.x-p1.x)*tension)/3,cp2y=p2.y-((p3.y-p1.y)*tension)/3
    d+=` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}
// Straighten: just use start and end with any corner points sampled every ~80px
function straighten(pts) {
  if (!pts||pts.length<2) return pts
  // sample key waypoints (start, any major direction changes, end)
  const out=[pts[0]]
  const step=Math.floor(pts.length/4)
  if (step>0) {
    for (let i=step;i<pts.length-step;i+=step) out.push(pts[i])
  }
  out.push(pts[pts.length-1])
  // reduce to just 2 points (pure straight) or keep corners
  return [pts[0], pts[pts.length-1]]
}
function arrowHead(pts,size=10) {
  if (!pts||pts.length<2) return null
  const l=pts[pts.length-1],v=pts[pts.length-2]
  const a=Math.atan2(l.y-v.y,l.x-v.x)
  return `M${l.x},${l.y} L${l.x-size*Math.cos(a-0.4)},${l.y-size*Math.sin(a-0.4)} M${l.x},${l.y} L${l.x-size*Math.cos(a+0.4)},${l.y-size*Math.sin(a+0.4)}`
}
function tCap(pts,size=8) {
  if (!pts||pts.length<2) return null
  const l=pts[pts.length-1],v=pts[pts.length-2]
  const a=Math.atan2(l.y-v.y,l.x-v.x)
  const px=Math.sin(a),py=-Math.cos(a)
  return `M${l.x-size*px},${l.y-size*py} L${l.x+size*px},${l.y+size*py}`
}
function zigzag(pts) {
  if (!pts||pts.length<2) return ''
  let d=`M${pts[0].x},${pts[0].y}`
  for (let i=0;i<pts.length-1;i++) {
    const dx=pts[i+1].x-pts[i].x,dy=pts[i+1].y-pts[i].y
    const dist=Math.sqrt(dx*dx+dy*dy)
    const steps=Math.max(1,Math.round(dist/12))
    for (let s=1;s<=steps;s++) {
      const t=s/steps,mx=pts[i].x+dx*(t-0.5/steps),my=pts[i].y+dy*(t-0.5/steps)
      const perp=((s%2===0?1:-1)*6*dy)/dist
      d+=` L${mx+perp*-dy/dist},${my+perp*dx/dist}`
    }
    d+=` L${pts[i+1].x},${pts[i+1].y}`
  }
  return d
}
function lerp(a,b,t){return a+(b-a)*t}
function getSVGPt(ref,e) {
  const svg=ref.current,rect=svg.getBoundingClientRect()
  const cx=e.touches?e.touches[0].clientX:e.clientX
  const cy=e.touches?e.touches[0].clientY:e.clientY
  return {x:(cx-rect.left)*(FIELD_W/rect.width),y:(cy-rect.top)*(FIELD_H/rect.height)}
}
function blockColor(id){return BLOCK_TYPES.find(b=>b.id===id)?.color||'#4ADE80'}
function blockCap(id){return BLOCK_TYPES.find(b=>b.id===id)?.endCap||'T'}
function timeAgo(ts){
  if(!ts)return ''
  const s=Math.floor((Date.now()-ts)/1000)
  if(s<60)return `${s}s ago`
  if(s<3600)return `${Math.floor(s/60)}m ago`
  return `${Math.floor(s/3600)}h ago`
}
let _uid=1
function uid(){return `p_${Date.now()}_${_uid++}`}

// ─── Vertical Football Field ───────────────────────────────────────────────────
function FootballField({showGaps=false}) {
  const yards=Array.from({length:25},(_,i)=>i*5) // every 5 yards
  return (
    <g>
      <rect x={0} y={0} width={FIELD_W} height={FIELD_H} fill="#0d2b10"/>
      {/* alternating bands horizontal */}
      {Array.from({length:10},(_,i)=>(
        <rect key={i} x={0} y={(10+i*10)*YARD_H} width={FIELD_W} height={10*YARD_H}
          fill={i%2===0?'#0d2b10':'#0f3213'}/>
      ))}
      {/* end zones top and bottom */}
      <rect x={0} y={0} width={FIELD_W} height={10*YARD_H} fill="#0b2540" opacity={0.85}/>
      <rect x={0} y={110*YARD_H} width={FIELD_W} height={10*YARD_H} fill="#2b0b0b" opacity={0.85}/>
      {/* yard lines horizontal */}
      {yards.map(y=>(
        <line key={y} x1={0} y1={y*YARD_H} x2={FIELD_W} y2={y*YARD_H}
          stroke="rgba(255,255,255,0.2)" strokeWidth={y%10===0?1.5:0.5}/>
      ))}
      {/* hash marks */}
      {Array.from({length:99},(_,i)=>i+11).map(y=>(
        <g key={y}>
          <line x1={HASH_X1-4} y1={y*YARD_H} x2={HASH_X1+4} y2={y*YARD_H} stroke="rgba(255,255,255,0.45)" strokeWidth={1}/>
          <line x1={HASH_X2-4} y1={y*YARD_H} x2={HASH_X2+4} y2={y*YARD_H} stroke="rgba(255,255,255,0.45)" strokeWidth={1}/>
        </g>
      ))}
      {/* yard numbers */}
      {[10,20,30,40,50,40,30,20,10].map((n,i)=>(
        <text key={i} x={FIELD_W*0.08} y={(20+i*10)*YARD_H+5} textAnchor="middle"
          fill="rgba(255,255,255,0.28)" fontSize={11} fontFamily="monospace" fontWeight="bold">{n}</text>
      ))}
      {/* LOS line - horizontal */}
      <line x1={0} y1={LOS_Y} x2={FIELD_W} y2={LOS_Y}
        stroke="#FFE033" strokeWidth={1.5} strokeDasharray="6,4" opacity={0.55}/>
      <text x={8} y={LOS_Y-4} fill="#FFE033" fontSize={9} fontFamily="monospace" opacity={0.65}>LOS</text>
      {/* sidelines */}
      <rect x={0} y={0} width={FIELD_W} height={FIELD_H} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2}/>
      {/* gap labels */}
      {showGaps && [
        {l:'A',x:FIELD_W/2+16},{l:'A',x:FIELD_W/2-16},
        {l:'B',x:FIELD_W/2+48},{l:'B',x:FIELD_W/2-48},
        {l:'C',x:FIELD_W/2+80},{l:'C',x:FIELD_W/2-80},
      ].map((g,i)=>(
        <text key={i} x={g.x} y={LOS_Y-8} textAnchor="middle"
          fill="rgba(255,220,50,0.5)" fontSize={9} fontFamily="monospace" fontWeight="bold">{g.l}</text>
      ))}
    </g>
  )
}

// ─── Player Icon ───────────────────────────────────────────────────────────────
function PlayerIcon({p,selected,hasRoute,drawingActive,onPointerDown,cx:animCx,cy:animCy}) {
  const isLiner=p.unit==='ol'||p.unit==='dl'
  const cx=animCx!==undefined?animCx:p.cx
  const cy=animCy!==undefined?animCy:p.cy
  const s=13,r=14
  const glow=selected?'drop-shadow(0 0 7px #FFE033)':drawingActive?'drop-shadow(0 0 6px #fff)':'none'
  const sw=selected||hasRoute?2.5:1.5
  const fillHex=Math.round((p.isExtra?0.07:0.15)*255).toString(16).padStart(2,'0')
  return (
    <g style={{cursor:'pointer'}} onPointerDown={onPointerDown}>
      {isLiner
        ?<rect x={cx-s} y={cy-s} width={s*2} height={s*2} rx={2}
            fill={`${p.color}${fillHex}`} stroke={p.color} strokeWidth={sw}
            strokeDasharray={p.isExtra?'4,3':'none'} style={{filter:glow}}/>
        :<circle cx={cx} cy={cy} r={r}
            fill={`${p.color}${fillHex}`} stroke={p.color} strokeWidth={sw}
            strokeDasharray={p.isExtra?'4,3':'none'} style={{filter:glow}}/>
      }
      <text x={cx} y={cy+4} textAnchor="middle" fill={p.color}
        fontSize={p.label.length>2?8:10} fontWeight="bold" fontFamily="monospace"
        style={{pointerEvents:'none'}}>{p.label}</text>
    </g>
  )
}

// ─── Route Layer ───────────────────────────────────────────────────────────────
function RouteLayer({r,lineStyle,endCap,highlight}) {
  if (!r||!r.pts||r.pts.length<2) return null
  const color=highlight?'#fff':(r.color||'#FFE033')
  const cap=r.endCap||endCap||'arrow'
  const style=r.lineStyle||lineStyle||'solid'
  const dash=style==='dashed'?'8,5':style==='dotted'?'3,4':'none'
  const d=style==='zigzag'?zigzag(r.pts):catmullRom(r.pts)
  const ah=arrowHead(r.pts)
  const tc=tCap(r.pts)
  const last=r.pts[r.pts.length-1]
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={highlight?3:2}
        strokeDasharray={dash} opacity={0.92} strokeLinecap="round" strokeLinejoin="round"/>
      {cap==='arrow'&&ah&&<path d={ah} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"/>}
      {cap==='T'&&tc&&<path d={tc} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"/>}
      {cap==='dot'&&<circle cx={last.x} cy={last.y} r={4} fill={color}/>}
    </g>
  )
}

// ─── Position Bench Panel ─────────────────────────────────────────────────────
function BenchPanel({mode, onAdd}) {
  const bench = mode==='offense' ? OFFENSE_BENCH : DEFENSE_BENCH
  return (
    <div>
      <div style={{fontSize:9,color:'#4ade80',letterSpacing:1.5,marginBottom:5,marginTop:4}}>ADD POSITIONS</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
        {bench.map((p,i)=>{
          const isLiner=p.unit==='ol'||p.unit==='dl'
          return (
            <button key={i} onClick={()=>onAdd(p)}
              title={`Add ${p.label} to field`}
              style={{
                width:36,height:36,borderRadius:isLiner?4:18,
                border:`1.5px solid ${p.color}`,
                background:`${p.color}22`,
                color:p.color,fontFamily:'monospace',fontSize:10,
                fontWeight:'bold',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>{p.label}</button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,         setTab]         = useState('designer')
  const [mode,        setMode]        = useState('offense')
  const [players,     setPlayers]     = useState(()=>makeOffense())
  const [routes,      setRoutes]      = useState({})
  const [routeHistory,setRouteHistory]= useState([]) // undo stack
  const [drawingFor,  setDrawingFor]  = useState(null)
  const [currentPts,  setCurrentPts]  = useState([])
  const [lineStyle,   setLineStyle]   = useState('solid')
  const [endCap,      setEndCap]      = useState('arrow')
  const [straightMode,setStraightMode]= useState(false)  // auto-straighten toggle
  const [blockType,   setBlockType]   = useState('drive')
  const [dragging,    setDragging]    = useState(null)
  const [selected,    setSelected]    = useState(null)
  const [tool,        setTool]        = useState('move')
  const [animating,   setAnimating]   = useState(false)
  const [animT,       setAnimT]       = useState(0)
  const [animSnap,    setAnimSnap]    = useState(null)
  const [playName,    setPlayName]    = useState('')
  const [authorName,  setAuthorName]  = useState(()=>localStorage.getItem('gs_author')||'')
  const [showGaps,    setShowGaps]    = useState(false)
  const [showInfo,    setShowInfo]    = useState(false)
  const [hasExtra,    setHasExtra]    = useState(false)

  // Lineman Studio
  const [lsPlayers,   setLsPlayers]   = useState(()=>makeLSPlayers())
  const [lsRoutes,    setLsRoutes]    = useState({})
  const [lsRouteHist, setLsRouteHist] = useState([])
  const [lsDrawFor,   setLsDrawFor]   = useState(null)
  const [lsCurPts,    setLsCurPts]    = useState([])
  const [lsDragging,  setLsDragging]  = useState(null)
  const [lsSelected,  setLsSelected]  = useState(null)
  const [lsBlockType, setLsBlockType] = useState('drive')
  const [lsTool,      setLsTool]      = useState('move')
  const [lsShowGaps,  setLsShowGaps]  = useState(true)

  // Board
  const [boardStrokes,setBoardStrokes]= useState([])
  const [boardCurrent,setBoardCurrent]= useState([])
  const [boardColor,  setBoardColor]  = useState('#FFE033')
  const [boardWidth,  setBoardWidth]  = useState(3)
  const [boardDrawing,setBoardDrawing]= useState(false)

  const svgRef   = useRef(null)
  const lsSvgRef = useRef(null)
  const boardRef = useRef(null)
  const animRef  = useRef(null)

  const {plays,syncStatus,lastSync,storageOk,load,addPlay,deletePlay} = useSharedPlays()

  useEffect(()=>{if(authorName)localStorage.setItem('gs_author',authorName)},[authorName])

  // ── Mode switch ──────────────────────────────────────────────────────────
  const switchMode=(m)=>{
    setMode(m)
    setPlayers(m==='offense'?makeOffense():makeDefense())
    setRoutes({}); setRouteHistory([])
    setDrawingFor(null); setCurrentPts([])
    setAnimating(false); setAnimSnap(null)
    setSelected(null); setTool('move'); setHasExtra(false)
  }

  // ── Add position from bench ──────────────────────────────────────────────
  const addFromBench=(p)=>{
    const cx=FIELD_W/2+(Math.random()-0.5)*80
    const cy=mode==='offense'?LOS_Y+60:LOS_Y-60
    setPlayers(prev=>[...prev,{...p,id:uid(),cx,cy}])
  }

  // ── Add/remove opponent ──────────────────────────────────────────────────
  const addExtra=()=>{
    const defs=mode==='offense'?EXTRA_DEF:EXTRA_OFF
    const ex=players.map(p=>p.id)
    setPlayers(prev=>[...prev,...defs.filter(p=>!ex.includes(p.id))])
    setHasExtra(true)
  }
  const removeExtra=()=>{
    setPlayers(prev=>prev.filter(p=>!p.isExtra))
    setHasExtra(false)
  }

  // ── Remove selected player ───────────────────────────────────────────────
  const removeSelected=()=>{
    if(!selected)return
    setPlayers(prev=>prev.filter(p=>p.id!==selected))
    setRoutes(prev=>{const n={...prev};delete n[selected];return n})
    setSelected(null)
  }

  // ── Undo last route ──────────────────────────────────────────────────────
  const undoRoute=()=>{
    if(routeHistory.length===0)return
    const prev=routeHistory[routeHistory.length-1]
    setRoutes(prev.routes)
    setRouteHistory(h=>h.slice(0,-1))
  }

  // ── Pointer helpers ──────────────────────────────────────────────────────
  const makeHandlers=(ref,pList,setPList,rMap,setRMap,rHist,setRHist,dFor,setDFor,cPts,setCPts,drag,setDrag,sel,setSel,curTool,curBT,straight)=>({
    onPlayerDown:(e,id)=>{
      if(animating)return
      e.stopPropagation(); setSel(id)
      const pt=getSVGPt(ref,e)
      if(curTool==='move'){
        const p=pList.find(p=>p.id===id)
        setDrag({id,ox:pt.x-p.cx,oy:pt.y-p.cy})
      } else {
        setDFor(id); setCPts([{x:pt.x,y:pt.y}])
      }
    },
    onMove:(e)=>{
      if(animating)return
      const pt=getSVGPt(ref,e)
      if(drag) setPList(prev=>prev.map(p=>p.id===drag.id?{...p,cx:pt.x-drag.ox,cy:pt.y-drag.oy}:p))
      if(dFor) setCPts(prev=>{
        const l=prev[prev.length-1]
        return(!l||Math.hypot(pt.x-l.x,pt.y-l.y)>5)?[...prev,{x:pt.x,y:pt.y}]:prev
      })
    },
    onUp:()=>{
      if(drag)setDrag(null)
      if(dFor&&cPts.length>1){
        const isBlock=curTool==='block'
        // straighten if toggle is on and it's a route (not block)
        const finalPts=(!isBlock&&straight)?straighten(cPts):cPts
        // push current state onto undo stack
        setRHist(h=>[...h.slice(-19),{routes:{...rMap}}])
        setRMap(prev=>({...prev,[dFor]:{
          pts:finalPts,
          color:isBlock?blockColor(curBT):'#FFE033',
          lineStyle:isBlock?'solid':lineStyle,
          endCap:isBlock?blockCap(curBT):endCap,
          blockType:isBlock?curBT:null,
        }}))
        setDFor(null); setCPts([])
      } else if(dFor){setDFor(null);setCPts([])}
    },
    onSvgClick:(e)=>{if(e.target===ref.current)setSel(null)},
  })

  const mH=makeHandlers(svgRef,players,setPlayers,routes,setRoutes,routeHistory,setRouteHistory,drawingFor,setDrawingFor,currentPts,setCurrentPts,dragging,setDragging,selected,setSelected,tool,blockType,straightMode)
  const lH=makeHandlers(lsSvgRef,lsPlayers,setLsPlayers,lsRoutes,setLsRoutes,lsRouteHist,setLsRouteHist,lsDrawFor,setLsDrawFor,lsCurPts,setLsCurPts,lsDragging,setLsDragging,lsSelected,setLsSelected,lsTool,lsBlockType,false)

  // ── Animation ────────────────────────────────────────────────────────────
  const startAnim=()=>{
    if(animating){cancelAnimationFrame(animRef.current);setAnimating(false);setAnimSnap(null);setAnimT(0);return}
    setAnimating(true);setAnimSnap(players.map(p=>({...p})))
    let start=null
    const step=(ts)=>{
      if(!start)start=ts
      const t=Math.min((ts-start)/2400,1)
      setAnimT(t)
      if(t<1)animRef.current=requestAnimationFrame(step)
      else{setAnimating(false);setAnimSnap(null);setAnimT(0)}
    }
    animRef.current=requestAnimationFrame(step)
  }
  useEffect(()=>()=>cancelAnimationFrame(animRef.current),[])
  const getAnimPos=(p)=>{
    const r=routes[p.id];if(!r||!animSnap)return null
    const base=animSnap.find(a=>a.id===p.id);if(!base)return null
    const tot=r.pts.length-1;if(tot<=0)return{cx:base.cx,cy:base.cy}
    const pos=animT*tot,idx=Math.min(Math.floor(pos),tot-1),frac=pos-idx
    return{cx:lerp(r.pts[idx].x,r.pts[Math.min(idx+1,tot)].x,frac),cy:lerp(r.pts[idx].y,r.pts[Math.min(idx+1,tot)].y,frac)}
  }

  // ── Save / Load ──────────────────────────────────────────────────────────
  const doSave=async(section)=>{
    if(!playName.trim()){alert('Enter a play name first.');return}
    const play={
      id:Date.now(),name:playName.trim(),
      mode:section==='lineman'?'lineman':mode,section,
      author:authorName||'Coach',savedAt:Date.now(),
      players:section==='lineman'?lsPlayers.map(p=>({...p})):players.map(p=>({...p})),
      routes:section==='lineman'?{...lsRoutes}:{...routes},
    }
    const ok=await addPlay(play)
    if(ok)setPlayName('')
  }
  const loadPlay=(play)=>{
    if(play.section==='lineman'){setLsPlayers(play.players);setLsRoutes(play.routes);setTab('lineman')}
    else{setMode(play.mode);setPlayers(play.players);setRoutes(play.routes);setTab('designer')}
  }

  // ── Quick schemes ────────────────────────────────────────────────────────
  const applyScheme=(scheme)=>{
    const offIds=['ls_LT','ls_LG','ls_C','ls_RG','ls_RT','ls_TE']
    const getP=(id)=>lsPlayers.find(p=>p.id===id)
    const nr={}
    if(scheme==='zoneL') lsPlayers.filter(p=>offIds.includes(p.id)).forEach(p=>{nr[p.id]={pts:[{x:p.cx,y:p.cy},{x:p.cx-22,y:p.cy-2}],color:'#4ADE80',lineStyle:'solid',endCap:'T',blockType:'zone'}})
    else if(scheme==='zoneR') lsPlayers.filter(p=>offIds.includes(p.id)).forEach(p=>{nr[p.id]={pts:[{x:p.cx,y:p.cy},{x:p.cx+22,y:p.cy+2}],color:'#4ADE80',lineStyle:'solid',endCap:'T',blockType:'zone'}})
    else if(scheme==='man'){
      const pairs={ls_LT:'ls_DE1',ls_LG:'ls_DT1',ls_C:'ls_DT2',ls_RG:'ls_DT2',ls_RT:'ls_DE2',ls_TE:'ls_DE2'}
      Object.entries(pairs).forEach(([oid,did])=>{const op=getP(oid),dp=getP(did);if(op&&dp)nr[oid]={pts:[{x:op.cx,y:op.cy},{x:dp.cx,y:dp.cy}],color:'#4ADE80',lineStyle:'solid',endCap:'T',blockType:'drive'}})
    } else if(scheme==='pass') lsPlayers.filter(p=>offIds.includes(p.id)).forEach((p,i)=>{const dx=i<3?-8:8;nr[p.id]={pts:[{x:p.cx,y:p.cy},{x:p.cx+dx,y:p.cy+28}],color:'#60A5FA',lineStyle:'solid',endCap:'dot',blockType:'passset'}})
    setLsRoutes(nr)
  }

  // ── Board ────────────────────────────────────────────────────────────────
  const getBPt=(e)=>{
    const r=boardRef.current.getBoundingClientRect()
    const cx=e.touches?e.touches[0].clientX:e.clientX
    const cy=e.touches?e.touches[0].clientY:e.clientY
    return{x:(cx-r.left)*(560/r.width),y:(cy-r.top)*(900/r.height)}
  }

  // ── UI helpers ───────────────────────────────────────────────────────────
  const SL=(txt)=><div style={{fontSize:9,color:'#4ade80',letterSpacing:1.5,marginBottom:4,marginTop:6,opacity:0.9}}>{txt}</div>
  const BtnRow=(label,active,onClick,color='#FFE033')=>(
    <button onClick={onClick} style={{padding:'4px 6px',borderRadius:4,border:`1px solid ${active?color:'#2d5a30'}`,background:active?`${color}22`:'transparent',color:active?color:'#a7f3a7',fontFamily:'monospace',fontSize:10,fontWeight:'bold',cursor:'pointer',width:'100%',marginBottom:2,textAlign:'left'}}>{label}</button>
  )
  const syncBadge=()=>{
    const cfg={idle:{bg:'#1d4a20',color:'#4ade80',txt:'● Saved'},saving:{bg:'#2a3a00',color:'#FFE033',txt:'⟳ Saving…'},saved:{bg:'#0f3a1a',color:'#4ade80',txt:'✓ Saved'},error:{bg:'#3a0a0a',color:'#F87171',txt:'! Error'},loading:{bg:'#1a2a3a',color:'#60A5FA',txt:'⟳ Loading'}}[syncStatus]||{bg:'#1d4a20',color:'#4ade80',txt:'● Ready'}
    return <div style={{fontSize:9,padding:'3px 8px',borderRadius:10,background:cfg.bg,color:cfg.color,fontFamily:'monospace'}}>{cfg.txt}</div>
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh',background:'#060e07',color:'#e8f5e9',fontFamily:"'Courier New',monospace",display:'flex',flexDirection:'column'}}>

      {/* Header */}
      <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 12px',background:'#0a1a0c',borderBottom:'2px solid #1d4a20',flexWrap:'wrap',gap:5}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <span style={{fontSize:17,fontWeight:'bold',color:'#FFE033',letterSpacing:1}}>🏈 GRIDIRON STUDIO</span>
          {syncBadge()}
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {[['designer','🎯 Designer'],['lineman','🔲 Lineman'],['board','✏️ Board'],['plays','📋 Playbook']].map(([t,lbl])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'4px 9px',borderRadius:4,border:'1px solid',borderColor:tab===t?'#FFE033':'#2d5a30',background:tab===t?'#FFE033':'transparent',color:tab===t?'#060e07':'#a7f3a7',fontFamily:'monospace',fontWeight:'bold',fontSize:10,cursor:'pointer'}}>{lbl}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:5,alignItems:'center'}}>
          <span style={{fontSize:9,color:'#4ade80',opacity:0.7}}>👤</span>
          <input value={authorName} onChange={e=>setAuthorName(e.target.value)} placeholder="Your name" style={{width:85,padding:'3px 6px',background:'#0d2b10',border:'1px solid #2d5a30',borderRadius:4,color:'#e8f5e9',fontFamily:'monospace',fontSize:10}}/>
          <button onClick={()=>setShowInfo(!showInfo)} style={{background:'none',border:'1px solid #2d5a30',color:'#a7f3a7',borderRadius:4,padding:'3px 7px',cursor:'pointer',fontSize:10}}>?</button>
        </div>
      </header>

      {/* Info modal */}
      {showInfo&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowInfo(false)}>
          <div style={{background:'#0a1a0c',border:'1px solid #2d5a30',borderRadius:8,padding:22,maxWidth:440,color:'#c8e6c9',fontSize:12,lineHeight:1.9}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:14,fontWeight:'bold',color:'#FFE033',marginBottom:8}}>Gridiron Studio</div>
            <div><b style={{color:'#4ADE80'}}>Move ✋</b> — Drag any player anywhere on the field</div>
            <div><b style={{color:'#4ADE80'}}>Route ✏️</b> — Click a player then drag to draw their route</div>
            <div><b style={{color:'#4ADE80'}}>Block 🔲</b> — Click a lineman then drag to assign a block</div>
            <div><b style={{color:'#4ADE80'}}>Straight Lines</b> — Toggle to auto-straighten freehand routes</div>
            <div><b style={{color:'#4ADE80'}}>Undo</b> — Removes the last route drawn</div>
            <div><b style={{color:'#4ADE80'}}>Add Positions</b> — Drop extra WRs, RBs, DBs onto the field</div>
            <div><b style={{color:'#4ADE80'}}>Delete Player</b> — Select a player then hit Delete Selected</div>
            <div><b style={{color:'#4ADE80'}}>▶ Play</b> — Animates all players along their routes</div>
            <div style={{marginTop:6,fontSize:10,color:'#6b7280'}}>Squares = linemen · Circles = skill players</div>
            <button onClick={()=>setShowInfo(false)} style={{marginTop:12,padding:'5px 14px',background:'#FFE033',color:'#060e07',border:'none',borderRadius:4,fontWeight:'bold',cursor:'pointer',fontFamily:'monospace'}}>Got it</button>
          </div>
        </div>
      )}

      {/* ══ DESIGNER ══════════════════════════════════════════════════════════ */}
      {tab==='designer'&&(
        <div style={{display:'flex',flex:1,overflow:'hidden'}}>

          {/* Sidebar */}
          <div style={{width:185,background:'#080f09',borderRight:'1px solid #1d4a20',padding:'9px 8px',display:'flex',flexDirection:'column',gap:5,overflowY:'auto'}}>
            {SL('SIDE')}
            <div style={{display:'flex',gap:3}}>
              {['offense','defense'].map(m=>(
                <button key={m} onClick={()=>switchMode(m)} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid',borderColor:mode===m?(m==='offense'?'#4ADE80':'#F87171'):'#2d5a30',background:mode===m?(m==='offense'?'rgba(74,222,128,0.12)':'rgba(248,113,113,0.12)'):'transparent',color:mode===m?(m==='offense'?'#4ADE80':'#F87171'):'#a7f3a7',fontFamily:'monospace',fontSize:10,fontWeight:'bold',cursor:'pointer',textTransform:'uppercase'}}>{m==='offense'?'OFF':'DEF'}</button>
              ))}
            </div>

            {SL('TOOL')}
            <div style={{display:'flex',gap:3}}>
              {[['move','✋'],['route','✏️'],['block','🔲']].map(([t,ic])=>(
                <button key={t} onClick={()=>setTool(t)} title={t} style={{flex:1,padding:'5px 0',borderRadius:4,border:'1px solid',borderColor:tool===t?'#FFE033':'#2d5a30',background:tool===t?'rgba(255,224,51,0.1)':'transparent',color:tool===t?'#FFE033':'#a7f3a7',fontFamily:'monospace',fontSize:14,cursor:'pointer'}}>{ic}</button>
              ))}
            </div>

            {(tool==='route'||tool==='block')&&<>
              {tool==='route'&&<>
                {SL('ROUTE STYLE')}
                {[['solid','─── Route','#FFE033'],['dashed','- - Pass','#60A5FA'],['zigzag','∿ Motion','#F87171']].map(([s,lbl,c])=>BtnRow(lbl,lineStyle===s,()=>setLineStyle(s),c))}
                {SL('END CAP')}
                <div style={{display:'flex',gap:3}}>
                  {[['arrow','→'],['T','T'],['dot','●']].map(([c,lbl])=>(
                    <button key={c} onClick={()=>setEndCap(c)} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid',borderColor:endCap===c?'#FFE033':'#2d5a30',background:endCap===c?'rgba(255,224,51,0.1)':'transparent',color:endCap===c?'#FFE033':'#a7f3a7',fontFamily:'monospace',fontSize:13,cursor:'pointer'}}>{lbl}</button>
                  ))}
                </div>
                {SL('LINE MODE')}
                <button onClick={()=>setStraightMode(!straightMode)} style={{padding:'4px 6px',borderRadius:4,border:`1px solid ${straightMode?'#FFE033':'#2d5a30'}`,background:straightMode?'rgba(255,224,51,0.1)':'transparent',color:straightMode?'#FFE033':'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer',width:'100%',textAlign:'left'}}>
                  {straightMode?'✓ Straight Lines':'~ Freehand'}
                </button>
              </>}
              {tool==='block'&&<>
                {SL('BLOCK TYPE')}
                {BLOCK_TYPES.filter(b=>b.group==='off').map(b=>BtnRow(b.label,blockType===b.id,()=>setBlockType(b.id),b.color))}
              </>}
            </>}

            {/* Position bench */}
            <BenchPanel mode={mode} onAdd={addFromBench}/>

            {SL('OPPONENT')}
            {!hasExtra
              ?<button onClick={addExtra} style={{padding:'4px 6px',borderRadius:4,border:'1px dashed #444',background:'rgba(255,255,255,0.03)',color:'#888',fontFamily:'monospace',fontSize:10,cursor:'pointer',textAlign:'left'}}>+ Add {mode==='offense'?'Defense':'Offense'}</button>
              :<button onClick={removeExtra} style={{padding:'4px 6px',borderRadius:4,border:'1px solid #b91c1c',background:'rgba(185,28,28,0.1)',color:'#F87171',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>✕ Remove Added</button>
            }

            {SL('OPTIONS')}
            <button onClick={()=>setShowGaps(!showGaps)} style={{padding:'3px 6px',borderRadius:4,border:`1px solid ${showGaps?'#FFE033':'#2d5a30'}`,background:showGaps?'rgba(255,224,51,0.08)':'transparent',color:showGaps?'#FFE033':'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>{showGaps?'✓ ':''}Gap Labels</button>

            {/* Actions */}
            <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:3,paddingTop:8,borderTop:'1px solid #1d4a20'}}>
              <button onClick={startAnim} style={{padding:'6px 0',borderRadius:4,border:'none',background:animating?'#b91c1c':'#FFE033',color:'#060e07',fontFamily:'monospace',fontWeight:'bold',fontSize:12,cursor:'pointer'}}>{animating?'■ Stop':'▶ Play'}</button>
              <div style={{display:'flex',gap:3}}>
                <button onClick={undoRoute} disabled={routeHistory.length===0} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:routeHistory.length===0?'#333':'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:routeHistory.length===0?'default':'pointer'}}>↩ Undo</button>
                <button onClick={()=>{setRoutes({});setRouteHistory([])}} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Clear</button>
              </div>
              {selected&&<button onClick={removeSelected} style={{padding:'4px 0',borderRadius:4,border:'1px solid #b91c1c',background:'rgba(185,28,28,0.08)',color:'#F87171',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>✕ Delete Selected</button>}
              <button onClick={()=>{switchMode(mode)}} style={{padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Reset Field</button>
              <input value={playName} onChange={e=>setPlayName(e.target.value)} placeholder="Play name…" style={{padding:'4px 6px',background:'#0d2b10',border:'1px solid #2d5a30',borderRadius:4,color:'#e8f5e9',fontFamily:'monospace',fontSize:10,width:'100%',boxSizing:'border-box'}}/>
              <button onClick={()=>doSave('designer')} disabled={syncStatus==='saving'} style={{padding:'5px 0',borderRadius:4,border:'1px solid #4ade80',background:'rgba(74,222,128,0.08)',color:'#4ade80',fontFamily:'monospace',fontSize:10,cursor:'pointer',opacity:syncStatus==='saving'?0.5:1}}>{syncStatus==='saving'?'⟳ Saving…':'💾 Save Play'}</button>
            </div>
          </div>

          {/* Field — vertical */}
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:10,background:'#060e07',overflow:'auto'}}>
            <svg ref={svgRef} viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
              style={{height:'calc(100vh - 60px)',maxHeight:900,width:'auto',borderRadius:6,cursor:tool==='move'?(dragging?'grabbing':'default'):'crosshair',userSelect:'none',touchAction:'none',boxShadow:'0 0 28px rgba(0,0,0,0.8)'}}
              onPointerMove={mH.onMove} onPointerUp={mH.onUp} onPointerLeave={mH.onUp} onClick={mH.onSvgClick}>
              <FootballField showGaps={showGaps}/>
              {Object.entries(routes).map(([id,r])=><RouteLayer key={id} r={r} lineStyle={lineStyle} endCap={endCap}/>)}
              {drawingFor&&currentPts.length>1&&<RouteLayer r={{pts:straightMode?straighten(currentPts):currentPts,color:'#fff',lineStyle:tool==='block'?'solid':lineStyle,endCap:tool==='block'?blockCap(blockType):endCap}} lineStyle={lineStyle} endCap={endCap} highlight/>}
              {players.map(p=>{const ap=animating&&animSnap?getAnimPos(p):null;return<PlayerIcon key={p.id} p={p} selected={selected===p.id} hasRoute={!!routes[p.id]} drawingActive={drawingFor===p.id} cx={ap?.cx} cy={ap?.cy} onPointerDown={e=>mH.onPlayerDown(e,p.id)}/>})}
              {/* football */}
              {!animating&&<ellipse cx={FIELD_W/2} cy={LOS_Y+8} rx={5} ry={8} fill="#8B4513" stroke="#FFE033" strokeWidth={1} opacity={0.9}/>}
            </svg>
          </div>
        </div>
      )}

      {/* ══ LINEMAN STUDIO ════════════════════════════════════════════════════ */}
      {tab==='lineman'&&(
        <div style={{display:'flex',flex:1,overflow:'hidden'}}>
          <div style={{width:200,background:'#080f09',borderRight:'1px solid #1d4a20',padding:'9px 8px',display:'flex',flexDirection:'column',gap:5,overflowY:'auto'}}>
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
            <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:3,paddingTop:8,borderTop:'1px solid #1d4a20'}}>
              <div style={{display:'flex',gap:3}}>
                <button onClick={()=>{if(lsRouteHist.length===0)return;const p=lsRouteHist[lsRouteHist.length-1];setLsRoutes(p.routes);setLsRouteHist(h=>h.slice(0,-1))}} disabled={lsRouteHist.length===0} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:lsRouteHist.length===0?'#333':'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:lsRouteHist.length===0?'default':'pointer'}}>↩ Undo</button>
                <button onClick={()=>setLsRoutes({})} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Clear</button>
              </div>
              <button onClick={()=>{setLsPlayers(makeLSPlayers());setLsRoutes({})}} style={{padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Reset</button>
              <input value={playName} onChange={e=>setPlayName(e.target.value)} placeholder="Scheme name…" style={{padding:'4px 6px',background:'#0d2b10',border:'1px solid #2d5a30',borderRadius:4,color:'#e8f5e9',fontFamily:'monospace',fontSize:10,width:'100%',boxSizing:'border-box'}}/>
              <button onClick={()=>doSave('lineman')} disabled={syncStatus==='saving'} style={{padding:'5px 0',borderRadius:4,border:'1px solid #4ade80',background:'rgba(74,222,128,0.08)',color:'#4ade80',fontFamily:'monospace',fontSize:10,cursor:'pointer',opacity:syncStatus==='saving'?0.5:1}}>{syncStatus==='saving'?'⟳ Saving…':'💾 Save Scheme'}</button>
            </div>
          </div>
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:10,gap:6,overflow:'auto'}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',fontFamily:'monospace'}}>🟩 Offense · 🟥 Defense · Select scheme → click player + drag</div>
            <svg ref={lsSvgRef} viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
              style={{height:'calc(100vh - 80px)',maxHeight:900,width:'auto',borderRadius:6,cursor:lsTool==='move'?(lsDragging?'grabbing':'default'):'crosshair',userSelect:'none',touchAction:'none',boxShadow:'0 0 28px rgba(0,0,0,0.8)'}}
              onPointerMove={lH.onMove} onPointerUp={lH.onUp} onPointerLeave={lH.onUp} onClick={lH.onSvgClick}>
              <FootballField showGaps={lsShowGaps}/>
              {lsShowGaps&&[{l:'A',x:FIELD_W/2+16},{l:'A',x:FIELD_W/2-16},{l:'B',x:FIELD_W/2+48},{l:'B',x:FIELD_W/2-48},{l:'C',x:FIELD_W/2+80},{l:'C',x:FIELD_W/2-80}].map((g,i)=>(
                <text key={i} x={g.x} y={LOS_Y+24} textAnchor="middle" fill="rgba(255,220,50,0.3)" fontSize={9} fontFamily="monospace">{g.l} gap</text>
              ))}
              {Object.entries(lsRoutes).map(([id,r])=><RouteLayer key={id} r={r} lineStyle="solid" endCap="T"/>)}
              {lsDrawFor&&lsCurPts.length>1&&<RouteLayer r={{pts:lsCurPts,color:'#fff',lineStyle:'solid',endCap:blockCap(lsBlockType)}} lineStyle="solid" endCap={blockCap(lsBlockType)} highlight/>}
              {lsPlayers.map(p=><PlayerIcon key={p.id} p={p} selected={lsSelected===p.id} hasRoute={!!lsRoutes[p.id]} drawingActive={lsDrawFor===p.id} onPointerDown={e=>lH.onPlayerDown(e,p.id)}/>)}
              <ellipse cx={FIELD_W/2} cy={LOS_Y+8} rx={5} ry={8} fill="#8B4513" stroke="#FFE033" strokeWidth={1} opacity={0.9}/>
            </svg>
          </div>
        </div>
      )}

      {/* ══ BOARD ═════════════════════════════════════════════════════════════ */}
      {tab==='board'&&(
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:10,gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',background:'#080f09',borderRadius:6,padding:'7px 12px',border:'1px solid #1d4a20'}}>
            <span style={{fontSize:9,color:'#4ade80',letterSpacing:1}}>COLOR</span>
            {['#FFE033','#4ADE80','#F87171','#60A5FA','#C084FC','#ffffff'].map(c=>(
              <div key={c} onClick={()=>setBoardColor(c)} style={{width:18,height:18,borderRadius:'50%',background:c,cursor:'pointer',border:boardColor===c?'3px solid white':'2px solid transparent'}}/>
            ))}
            <span style={{fontSize:9,color:'#4ade80',marginLeft:6,letterSpacing:1}}>WIDTH</span>
            {[2,4,7].map(w=>(
              <button key={w} onClick={()=>setBoardWidth(w)} style={{width:26,height:20,borderRadius:3,border:'1px solid',borderColor:boardWidth===w?'#FFE033':'#2d5a30',background:'transparent',color:boardWidth===w?'#FFE033':'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>{w}</button>
            ))}
            <button onClick={()=>setBoardStrokes(p=>p.slice(0,-1))} style={{padding:'2px 9px',borderRadius:3,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>↩ Undo</button>
            <button onClick={()=>setBoardStrokes([])} style={{padding:'2px 9px',borderRadius:3,border:'1px solid #2d5a30',background:'transparent',color:'#F87171',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>🗑 Clear</button>
          </div>
          <svg ref={boardRef} viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
            style={{height:'calc(100vh - 110px)',maxHeight:900,width:'auto',background:'#0a1f0f',borderRadius:8,cursor:'crosshair',touchAction:'none',userSelect:'none',boxShadow:'0 0 28px rgba(0,0,0,0.8)',border:'1px solid #1d4a20'}}
            onPointerDown={e=>{const p=getBPt(e);setBoardDrawing(true);setBoardCurrent([p])}}
            onPointerMove={e=>{if(!boardDrawing)return;setBoardCurrent(prev=>[...prev,getBPt(e)])}}
            onPointerUp={()=>{if(boardDrawing&&boardCurrent.length>1)setBoardStrokes(prev=>[...prev,{pts:boardCurrent,color:boardColor,width:boardWidth}]);setBoardDrawing(false);setBoardCurrent([])}}
            onPointerLeave={()=>{if(boardDrawing&&boardCurrent.length>1)setBoardStrokes(prev=>[...prev,{pts:boardCurrent,color:boardColor,width:boardWidth}]);setBoardDrawing(false);setBoardCurrent([])}}>
            {Array.from({length:20},(_,i)=><line key={`v${i}`} x1={i*30} y1={0} x2={i*30} y2={FIELD_H} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>)}
            {Array.from({length:30},(_,i)=><line key={`h${i}`} x1={0} y1={i*30} x2={FIELD_W} y2={i*30} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>)}
            <line x1={0} y1={LOS_Y} x2={FIELD_W} y2={LOS_Y} stroke="#FFE033" strokeWidth={1} strokeDasharray="5,4" opacity={0.18}/>
            <text x={8} y={LOS_Y-4} fill="#FFE033" fontSize={8} fontFamily="monospace" opacity={0.3}>LOS</text>
            {boardStrokes.map((s,i)=><path key={i} d={s.pts.map((p,j)=>`${j===0?'M':'L'}${p.x},${p.y}`).join(' ')} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round"/>)}
            {boardCurrent.length>1&&<path d={boardCurrent.map((p,i)=>`${i===0?'M':'L'}${p.x},${p.y}`).join(' ')} fill="none" stroke={boardColor} strokeWidth={boardWidth} strokeLinecap="round" strokeLinejoin="round"/>}
            {boardStrokes.length===0&&!boardDrawing&&<text x={FIELD_W/2} y={FIELD_H/2} textAnchor="middle" fill="rgba(255,255,255,0.09)" fontSize={14} fontFamily="monospace">Draw your play here…</text>}
          </svg>
        </div>
      )}

      {/* ══ PLAYBOOK ══════════════════════════════════════════════════════════ */}
      {tab==='plays'&&(
        <div style={{flex:1,padding:'14px 16px',overflowY:'auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
            <div style={{fontSize:13,color:'#4ade80',letterSpacing:1}}>📋 PLAYBOOK ({plays.length})</div>
            <button onClick={()=>load()} style={{padding:'3px 9px',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>⟳ Refresh</button>
          </div>
          {plays.length===0&&<div style={{textAlign:'center',color:'rgba(255,255,255,0.18)',fontSize:13,padding:'60px 0',fontFamily:'monospace'}}>No plays saved yet.<br/>Design a play and hit 💾 Save Play.</div>}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10}}>
            {[...plays].sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)).map(play=>(
              <div key={play.id} style={{background:'#080f09',border:'1px solid #1d4a20',borderRadius:8,padding:10,display:'flex',flexDirection:'column',gap:6}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <span style={{fontWeight:'bold',color:'#FFE033',fontSize:12}}>{play.name}</span>
                  <span style={{fontSize:8,padding:'2px 6px',borderRadius:10,background:play.mode==='offense'?'rgba(74,222,128,0.12)':play.mode==='lineman'?'rgba(255,224,51,0.12)':'rgba(248,113,113,0.12)',color:play.mode==='offense'?'#4ade80':play.mode==='lineman'?'#FFE033':'#F87171',letterSpacing:0.5}}>{play.mode?.toUpperCase()}</span>
                </div>
                <div style={{fontSize:9,color:'#4b5563',display:'flex',gap:8}}>
                  {play.author&&<span>👤 {play.author}</span>}
                  {play.savedAt&&<span>🕐 {timeAgo(play.savedAt)}</span>}
                </div>
                <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} style={{width:'100%',borderRadius:4,background:'#0d2b10'}}>
                  <FootballField showGaps={false}/>
                  {Object.entries(play.routes||{}).map(([id,r])=><RouteLayer key={id} r={r} lineStyle="solid" endCap="T"/>)}
                  {(play.players||[]).map(p=><PlayerIcon key={p.id} p={p} selected={false} hasRoute={!!(play.routes||{})[p.id]} drawingActive={false} onPointerDown={()=>{}}/>)}
                </svg>
                <div style={{display:'flex',gap:4}}>
                  <button onClick={()=>loadPlay(play)} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid #4ade80',background:'rgba(74,222,128,0.07)',color:'#4ade80',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Load</button>
                  <button onClick={()=>deletePlay(play.id)} style={{padding:'4px 9px',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#F87171',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
