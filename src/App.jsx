import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useSharedPlays } from './hooks/useSharedPlays'
import bixbyRedPlaybook from './bixbyRedPlaybook.json'

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
    { id:'C',   label:'C',   cx,         cy,        color:'#4ADE80', unit:'ol'    },
    { id:'LG',  label:'LG',  cx:cx-38,   cy,        color:'#4ADE80', unit:'ol'    },
    { id:'RG',  label:'RG',  cx:cx+38,   cy,        color:'#4ADE80', unit:'ol'    },
    { id:'LT',  label:'LT',  cx:cx-76,   cy,        color:'#4ADE80', unit:'ol'    },
    { id:'RT',  label:'RT',  cx:cx+76,   cy,        color:'#4ADE80', unit:'ol'    },
    { id:'TE',  label:'TE',  cx:cx+116,  cy,        color:'#4ADE80', unit:'ol'    },
    { id:'QB',  label:'QB',  cx,         cy:cy+60,  color:'#FFE033', unit:'skill' },
    { id:'RB',  label:'RB',  cx:cx+25,   cy:cy+110, color:'#60A5FA', unit:'skill' },
    { id:'WR1', label:'WR',  cx:cx-190,  cy,        color:'#F87171', unit:'skill' },
    { id:'WR2', label:'WR',  cx:cx+195,  cy:cy+5,   color:'#F87171', unit:'skill' },
    { id:'SL',  label:'SL',  cx:cx-125,  cy:cy+40,  color:'#F87171', unit:'skill' },
  ]
}
function makeDefense() {
  const cx = FIELD_W / 2, cy = LOS_Y
  return [
    { id:'DE1', label:'DE',  cx:cx-90,   cy:cy-55,  color:'#F87171', unit:'dl' },
    { id:'DT1', label:'DT',  cx:cx-32,   cy:cy-55,  color:'#F87171', unit:'dl' },
    { id:'DT2', label:'DT',  cx:cx+32,   cy:cy-55,  color:'#F87171', unit:'dl' },
    { id:'DE2', label:'DE',  cx:cx+90,   cy:cy-55,  color:'#F87171', unit:'dl' },
    { id:'MLB', label:'MLB', cx,         cy:cy-90,  color:'#60A5FA', unit:'lb' },
    { id:'WLB', label:'WLB', cx:cx-75,   cy:cy-90,  color:'#60A5FA', unit:'lb' },
    { id:'SLB', label:'SLB', cx:cx+75,   cy:cy-90,  color:'#60A5FA', unit:'lb' },
    { id:'CB1', label:'CB',  cx:cx-195,  cy:cy-55,  color:'#FFE033', unit:'db' },
    { id:'CB2', label:'CB',  cx:cx+195,  cy:cy-55,  color:'#FFE033', unit:'db' },
    { id:'SS',  label:'SS',  cx:cx+100,  cy:cy-155, color:'#C084FC', unit:'db' },
    { id:'FS',  label:'FS',  cx:cx-40,   cy:cy-178, color:'#C084FC', unit:'db' },
  ]
}
function makeLSPlayers() {
  const cx = FIELD_W / 2, cy = LOS_Y
  return [
    { id:'ls_LT', label:'LT',  cx:cx-76,  cy,        color:'#4ADE80',unit:'ol', side:'off' },
    { id:'ls_LG', label:'LG',  cx:cx-38,  cy,        color:'#4ADE80',unit:'ol', side:'off' },
    { id:'ls_C',  label:'C',   cx,        cy,        color:'#4ADE80',unit:'ol', side:'off' },
    { id:'ls_RG', label:'RG',  cx:cx+38,  cy,        color:'#4ADE80',unit:'ol', side:'off' },
    { id:'ls_RT', label:'RT',  cx:cx+76,  cy,        color:'#4ADE80',unit:'ol', side:'off' },
    { id:'ls_TE', label:'TE',  cx:cx+116, cy,        color:'#4ADE80',unit:'ol', side:'off' },
    { id:'ls_FB', label:'FB',  cx,        cy:cy+65,  color:'#60A5FA',unit:'skill',side:'off' },
    { id:'ls_DE1',label:'DE',  cx:cx-95,  cy:cy-58,  color:'#F87171',unit:'dl', side:'def' },
    { id:'ls_DT1',label:'DT',  cx:cx-34,  cy:cy-58,  color:'#F87171',unit:'dl', side:'def' },
    { id:'ls_DT2',label:'DT',  cx:cx+34,  cy:cy-58,  color:'#F87171',unit:'dl', side:'def' },
    { id:'ls_DE2',label:'DE',  cx:cx+95,  cy:cy-58,  color:'#F87171',unit:'dl', side:'def' },
    { id:'ls_MLB',label:'MLB', cx,        cy:cy-125, color:'#60A5FA',unit:'lb', side:'def' },
    { id:'ls_WLB',label:'WLB', cx:cx-70,  cy:cy-125, color:'#60A5FA',unit:'lb', side:'def' },
    { id:'ls_SLB',label:'SLB', cx:cx+70,  cy:cy-125, color:'#60A5FA',unit:'lb', side:'def' },
  ]
}

// ─── Extra formation definitions (relative offsets from FIELD_W/2, LOS_Y) ──
// Defense formations
const DEF_FORMATIONS = {
  'base': { label:'Base 4-3 (default)' },
  '5-3': {
    label:'5-3 Defense',
    players:[
      {id:'xd_LDE', label:'DE', color:'#F87171',unit:'dl',ox:-115,oy:-58},
      {id:'xd_LDT', label:'DT', color:'#F87171',unit:'dl',ox:-42, oy:-58},
      {id:'xd_NT',  label:'NT', color:'#F87171',unit:'dl',ox:0,   oy:-58},
      {id:'xd_RDT', label:'DT', color:'#F87171',unit:'dl',ox:42,  oy:-58},
      {id:'xd_RDE', label:'DE', color:'#F87171',unit:'dl',ox:115, oy:-58},
      {id:'xd_WLB', label:'WLB',color:'#60A5FA',unit:'lb',ox:-75, oy:-115},
      {id:'xd_MLB', label:'MLB',color:'#60A5FA',unit:'lb',ox:0,   oy:-85},
      {id:'xd_SLB', label:'SLB',color:'#60A5FA',unit:'lb',ox:75,  oy:-115},
      {id:'xd_LCB', label:'CB', color:'#FFE033',unit:'db',ox:-185,oy:-58},
      {id:'xd_RCB', label:'CB', color:'#FFE033',unit:'db',ox:185, oy:-58},
      {id:'xd_S',   label:'S',  color:'#C084FC',unit:'db',ox:0,   oy:-180},
    ]
  },
  '5-2': {
    label:'5-2 Defense',
    players:[
      {id:'xd_LDE', label:'DE', color:'#F87171',unit:'dl',ox:-115,oy:-58},
      {id:'xd_LDT', label:'DT', color:'#F87171',unit:'dl',ox:-42, oy:-58},
      {id:'xd_NT',  label:'NT', color:'#F87171',unit:'dl',ox:0,   oy:-58},
      {id:'xd_RDT', label:'DT', color:'#F87171',unit:'dl',ox:42,  oy:-58},
      {id:'xd_RDE', label:'DE', color:'#F87171',unit:'dl',ox:115, oy:-58},
      {id:'xd_WLB', label:'WLB',color:'#60A5FA',unit:'lb',ox:-52, oy:-115},
      {id:'xd_SLB', label:'SLB',color:'#60A5FA',unit:'lb',ox:52,  oy:-115},
      {id:'xd_LCB', label:'CB', color:'#FFE033',unit:'db',ox:-185,oy:-58},
      {id:'xd_RCB', label:'CB', color:'#FFE033',unit:'db',ox:185, oy:-58},
      {id:'xd_SS',  label:'SS', color:'#C084FC',unit:'db',ox:-50, oy:-195},
      {id:'xd_FS',  label:'FS', color:'#C084FC',unit:'db',ox:50,  oy:-185},
    ]
  },
  '4-4': {
    label:'4-4 Defense',
    players:[
      {id:'xd_LDE', label:'DE', color:'#F87171',unit:'dl',ox:-95, oy:-58},
      {id:'xd_LDT', label:'DT', color:'#F87171',unit:'dl',ox:-34, oy:-58},
      {id:'xd_RDT', label:'DT', color:'#F87171',unit:'dl',ox:34,  oy:-58},
      {id:'xd_RDE', label:'DE', color:'#F87171',unit:'dl',ox:95,  oy:-58},
      {id:'xd_WLB', label:'WLB',color:'#60A5FA',unit:'lb',ox:-82, oy:-115},
      {id:'xd_ILB1',label:'ILB',color:'#60A5FA',unit:'lb',ox:-24, oy:-115},
      {id:'xd_ILB2',label:'ILB',color:'#60A5FA',unit:'lb',ox:24,  oy:-115},
      {id:'xd_SLB', label:'SLB',color:'#60A5FA',unit:'lb',ox:82,  oy:-115},
      {id:'xd_LCB', label:'CB', color:'#FFE033',unit:'db',ox:-175,oy:-58},
      {id:'xd_RCB', label:'CB', color:'#FFE033',unit:'db',ox:175, oy:-58},
      {id:'xd_S',   label:'S',  color:'#C084FC',unit:'db',ox:0,   oy:-175},
    ]
  },
  '4-3': {
    label:'4-3 Defense',
    players:[
      {id:'xd_LDE', label:'DE', color:'#F87171',unit:'dl',ox:-95, oy:-58},
      {id:'xd_LDT', label:'DT', color:'#F87171',unit:'dl',ox:-34, oy:-58},
      {id:'xd_RDT', label:'DT', color:'#F87171',unit:'dl',ox:34,  oy:-58},
      {id:'xd_RDE', label:'DE', color:'#F87171',unit:'dl',ox:95,  oy:-58},
      {id:'xd_WLB', label:'WLB',color:'#60A5FA',unit:'lb',ox:-62, oy:-115},
      {id:'xd_MLB', label:'MLB',color:'#60A5FA',unit:'lb',ox:0,   oy:-85},
      {id:'xd_SLB', label:'SLB',color:'#60A5FA',unit:'lb',ox:62,  oy:-115},
      {id:'xd_LCB', label:'CB', color:'#FFE033',unit:'db',ox:-185,oy:-58},
      {id:'xd_RCB', label:'CB', color:'#FFE033',unit:'db',ox:185, oy:-58},
      {id:'xd_SS',  label:'SS', color:'#C084FC',unit:'db',ox:60,  oy:-195},
      {id:'xd_FS',  label:'FS', color:'#C084FC',unit:'db',ox:-20, oy:-190},
    ]
  },
  '3-4': {
    label:'3-4 Defense',
    players:[
      {id:'xd_LDE', label:'DE', color:'#F87171',unit:'dl',ox:-75, oy:-58},
      {id:'xd_NT',  label:'NT', color:'#F87171',unit:'dl',ox:0,   oy:-58},
      {id:'xd_RDE', label:'DE', color:'#F87171',unit:'dl',ox:75,  oy:-58},
      {id:'xd_LOLB',label:'OLB',color:'#60A5FA',unit:'lb',ox:-105,oy:-108},
      {id:'xd_LILB',label:'ILB',color:'#60A5FA',unit:'lb',ox:-32, oy:-115},
      {id:'xd_RILB',label:'ILB',color:'#60A5FA',unit:'lb',ox:32,  oy:-115},
      {id:'xd_ROLB',label:'OLB',color:'#60A5FA',unit:'lb',ox:105, oy:-108},
      {id:'xd_LCB', label:'CB', color:'#FFE033',unit:'db',ox:-185,oy:-58},
      {id:'xd_RCB', label:'CB', color:'#FFE033',unit:'db',ox:185, oy:-58},
      {id:'xd_SS',  label:'SS', color:'#C084FC',unit:'db',ox:50,  oy:-195},
      {id:'xd_FS',  label:'FS', color:'#C084FC',unit:'db',ox:-20, oy:-190},
    ]
  },
  'nickel': {
    label:'Nickel (4-2-5)',
    players:[
      {id:'xd_LDE', label:'DE', color:'#F87171',unit:'dl',ox:-95, oy:-58},
      {id:'xd_LDT', label:'DT', color:'#F87171',unit:'dl',ox:-32, oy:-58},
      {id:'xd_RDT', label:'DT', color:'#F87171',unit:'dl',ox:32,  oy:-58},
      {id:'xd_RDE', label:'DE', color:'#F87171',unit:'dl',ox:95,  oy:-58},
      {id:'xd_ILB1',label:'ILB',color:'#60A5FA',unit:'lb',ox:-28, oy:-115},
      {id:'xd_ILB2',label:'ILB',color:'#60A5FA',unit:'lb',ox:28,  oy:-115},
      {id:'xd_LCB', label:'CB', color:'#FFE033',unit:'db',ox:-185,oy:-58},
      {id:'xd_RCB', label:'CB', color:'#FFE033',unit:'db',ox:185, oy:-58},
      {id:'xd_NB',  label:'NB', color:'#FFE033',unit:'db',ox:-120,oy:-60},
      {id:'xd_SS',  label:'SS', color:'#C084FC',unit:'db',ox:50,  oy:-165},
      {id:'xd_FS',  label:'FS', color:'#C084FC',unit:'db',ox:-20, oy:-185},
    ]
  },
}

// Offense formations (shown when defense adds mock offense)
const OFF_FORMATIONS = {
  'base': { label:'Base Offense (default)' },
  'splitback': {
    label:'Split Back',
    players:[
      {id:'xo_C',  label:'C', color:'#4ADE80',unit:'ol',  ox:0,    oy:0  },
      {id:'xo_LG', label:'LG',color:'#4ADE80',unit:'ol',  ox:-38,  oy:0  },
      {id:'xo_RG', label:'RG',color:'#4ADE80',unit:'ol',  ox:38,   oy:0  },
      {id:'xo_LT', label:'LT',color:'#4ADE80',unit:'ol',  ox:-76,  oy:0  },
      {id:'xo_RT', label:'RT',color:'#4ADE80',unit:'ol',  ox:76,   oy:0  },
      {id:'xo_TE', label:'TE',color:'#4ADE80',unit:'ol',  ox:116,  oy:0  },
      {id:'xo_QB', label:'QB',color:'#FFE033',unit:'skill',ox:0,    oy:55 },
      {id:'xo_LHB',label:'HB',color:'#60A5FA',unit:'skill',ox:-35,  oy:105},
      {id:'xo_RHB',label:'HB',color:'#60A5FA',unit:'skill',ox:35,   oy:105},
      {id:'xo_WRL',label:'WR',color:'#F87171',unit:'skill',ox:-170, oy:0  },
      {id:'xo_WRR',label:'WR',color:'#F87171',unit:'skill',ox:175,  oy:0  },
    ]
  },
  'shotgun': {
    label:'Shotgun Spread',
    players:[
      {id:'xo_C',  label:'C', color:'#4ADE80',unit:'ol',  ox:0,    oy:0  },
      {id:'xo_LG', label:'LG',color:'#4ADE80',unit:'ol',  ox:-38,  oy:0  },
      {id:'xo_RG', label:'RG',color:'#4ADE80',unit:'ol',  ox:38,   oy:0  },
      {id:'xo_LT', label:'LT',color:'#4ADE80',unit:'ol',  ox:-76,  oy:0  },
      {id:'xo_RT', label:'RT',color:'#4ADE80',unit:'ol',  ox:76,   oy:0  },
      {id:'xo_QB', label:'QB',color:'#FFE033',unit:'skill',ox:0,    oy:110},
      {id:'xo_RB', label:'RB',color:'#60A5FA',unit:'skill',ox:40,   oy:110},
      {id:'xo_WRL',label:'WR',color:'#F87171',unit:'skill',ox:-175, oy:0  },
      {id:'xo_WRR',label:'WR',color:'#F87171',unit:'skill',ox:175,  oy:0  },
      {id:'xo_SLL',label:'SL',color:'#F87171',unit:'skill',ox:-110, oy:0  },
      {id:'xo_SLR',label:'SL',color:'#F87171',unit:'skill',ox:110,  oy:0  },
    ]
  },
  'iformation': {
    label:'I Formation',
    players:[
      {id:'xo_C',  label:'C', color:'#4ADE80',unit:'ol',  ox:0,    oy:0  },
      {id:'xo_LG', label:'LG',color:'#4ADE80',unit:'ol',  ox:-38,  oy:0  },
      {id:'xo_RG', label:'RG',color:'#4ADE80',unit:'ol',  ox:38,   oy:0  },
      {id:'xo_LT', label:'LT',color:'#4ADE80',unit:'ol',  ox:-76,  oy:0  },
      {id:'xo_RT', label:'RT',color:'#4ADE80',unit:'ol',  ox:76,   oy:0  },
      {id:'xo_TE', label:'TE',color:'#4ADE80',unit:'ol',  ox:116,  oy:0  },
      {id:'xo_QB', label:'QB',color:'#FFE033',unit:'skill',ox:0,    oy:55 },
      {id:'xo_FB', label:'FB',color:'#60A5FA',unit:'skill',ox:0,    oy:100},
      {id:'xo_RB', label:'RB',color:'#60A5FA',unit:'skill',ox:0,    oy:145},
      {id:'xo_WRL',label:'WR',color:'#F87171',unit:'skill',ox:-170, oy:0  },
      {id:'xo_WRR',label:'WR',color:'#F87171',unit:'skill',ox:175,  oy:0  },
    ]
  },
  'wishbone': {
    label:'Wishbone',
    players:[
      {id:'xo_C',  label:'C', color:'#4ADE80',unit:'ol',  ox:0,    oy:0  },
      {id:'xo_LG', label:'LG',color:'#4ADE80',unit:'ol',  ox:-38,  oy:0  },
      {id:'xo_RG', label:'RG',color:'#4ADE80',unit:'ol',  ox:38,   oy:0  },
      {id:'xo_LT', label:'LT',color:'#4ADE80',unit:'ol',  ox:-76,  oy:0  },
      {id:'xo_RT', label:'RT',color:'#4ADE80',unit:'ol',  ox:76,   oy:0  },
      {id:'xo_QB', label:'QB',color:'#FFE033',unit:'skill',ox:0,    oy:55 },
      {id:'xo_FB', label:'FB',color:'#60A5FA',unit:'skill',ox:0,    oy:95 },
      {id:'xo_LHB',label:'HB',color:'#60A5FA',unit:'skill',ox:-55,  oy:130},
      {id:'xo_RHB',label:'HB',color:'#60A5FA',unit:'skill',ox:55,   oy:130},
      {id:'xo_WRL',label:'WR',color:'#F87171',unit:'skill',ox:-170, oy:0  },
      {id:'xo_WRR',label:'WR',color:'#F87171',unit:'skill',ox:175,  oy:0  },
    ]
  },
  'trips': {
    label:'Trips Right',
    players:[
      {id:'xo_C',  label:'C', color:'#4ADE80',unit:'ol',  ox:0,    oy:0  },
      {id:'xo_LG', label:'LG',color:'#4ADE80',unit:'ol',  ox:-38,  oy:0  },
      {id:'xo_RG', label:'RG',color:'#4ADE80',unit:'ol',  ox:38,   oy:0  },
      {id:'xo_LT', label:'LT',color:'#4ADE80',unit:'ol',  ox:-76,  oy:0  },
      {id:'xo_RT', label:'RT',color:'#4ADE80',unit:'ol',  ox:76,   oy:0  },
      {id:'xo_QB', label:'QB',color:'#FFE033',unit:'skill',ox:0,    oy:110},
      {id:'xo_RB', label:'RB',color:'#60A5FA',unit:'skill',ox:-30,  oy:110},
      {id:'xo_WRL',label:'WR',color:'#F87171',unit:'skill',ox:-170, oy:0  },
      {id:'xo_WR1',label:'WR',color:'#F87171',unit:'skill',ox:120,  oy:0  },
      {id:'xo_WR2',label:'WR',color:'#F87171',unit:'skill',ox:155,  oy:15 },
      {id:'xo_TE', label:'TE',color:'#4ADE80',unit:'ol',  ox:100,  oy:0  },
    ]
  },
}

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
// Uses the SVG's own transformation matrix — correctly handles
// any viewBox, zoom, pan, letterboxing, or CSS transform.
function getSVGPt(ref, e) {
  const svg = ref.current
  if (!svg) return { x: 0, y: 0 }
  const pt = svg.createSVGPoint()
  pt.x = e.touches ? e.touches[0].clientX : e.clientX
  pt.y = e.touches ? e.touches[0].clientY : e.clientY
  const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
  return { x: svgP.x, y: svgP.y }
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
  const s=10,r=11
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
      <text x={cx} y={cy+3} textAnchor="middle" fill={p.color}
        fontSize={p.label.length>2?7:9} fontWeight="bold" fontFamily="monospace"
        style={{pointerEvents:'none'}}>{p.label}</text>
    </g>
  )
}

// ─── Route Layer ───────────────────────────────────────────────────────────────
function RouteLayer({r,lineStyle,endCap,highlight}) {
  if (!r||!r.pts||r.pts.length<2) return null
  const color=highlight?'#fff':(r.color||'#FFE033')
  const cap=r.endCap||endCap||'arrow'
  const last=r.pts[r.pts.length-1]
  const ah=arrowHead(r.pts)
  const tc=tCap(r.pts)

  // Sharp/waypoint routes: always straight polyline, no smoothing ever
  if (r.sharp) {
    const ptStr = r.pts.map(p=>`${p.x},${p.y}`).join(' ')
    return (
      <g>
        <polyline points={ptStr} fill="none" stroke={color}
          strokeWidth={highlight?3:2.5} strokeLinejoin="miter" strokeLinecap="square"
          opacity={highlight?1:0.95}/>
        {cap==='arrow'&&ah&&<path d={ah} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round"/>}
        {cap==='T'&&tc&&<path d={tc} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"/>}
        {cap==='dot'&&<circle cx={last.x} cy={last.y} r={4} fill={color}/>}
      </g>
    )
  }

  // Freehand/smooth routes
  const style=r.lineStyle||lineStyle||'solid'
  const dash=style==='dashed'?'8,5':style==='dotted'?'3,4':'none'
  const d=style==='zigzag'?zigzag(r.pts):catmullRom(r.pts)
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
  const [straightMode,setStraightMode]= useState(false)  // freehand vs waypoint click mode
  const [waypointActive,setWaypointActive]= useState(false)
  const [waypointPts,setWaypointPts]      = useState([])
  const [previewPt,setPreviewPt]          = useState(null)
  const [waypointPlayerId,setWaypointPlayerId]= useState(null)
  // Use ref to avoid stale closures in event handlers
  const wpRef = useRef({active:false,pts:[],playerId:null})
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
  const [defFormation,setDefFormation]= useState('5-3')
  const [offFormation,setOffFormation]= useState('splitback')
  const [myOffFormation,setMyOffFormation]= useState('base')
  const [myDefFormation,setMyDefFormation]= useState('base')
  // Coverage zones
  const [zones,       setZones]       = useState([])
  const [selectedZone,setSelectedZone]= useState(null)
  const [draggingZone,setDraggingZone]= useState(null) // {id, ox, oy}
  const [resizingZone,setResizingZone]= useState(null) // {id, handle, startX, startY, startRx, startRy}
  const [zoneType,    setZoneType]    = useState('zone2') // zone2|zone3|zone4|man|press
  let _zoneId = useRef(1)

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

  // Zoom & pan
  const [zoom,    setZoom]    = useState(1)
  const [panX,    setPanX]    = useState(0)
  const [panY,    setPanY]    = useState(0)
  const [panning, setPanning] = useState(false)
  const [panStart,setPanStart]= useState(null)

  // viewBox derived from zoom+pan, clamped to field bounds
  const vbW = FIELD_W / zoom
  const vbH = FIELD_H / zoom
  const cpX = Math.min(Math.max(panX, 0), FIELD_W - vbW)
  const cpY = Math.min(Math.max(panY, 0), FIELD_H - vbH)
  const viewBox = `${cpX} ${cpY} ${vbW} ${vbH}`

  // Zoom toward the center of the current view
  const zoomToward = useCallback((newZoom) => {
    setZoom(prev => {
      const nz = Math.min(Math.max(newZoom, 1), 4)
      if (nz === 1) { setPanX(0); setPanY(0); return 1 }
      // Keep the center of the current view fixed
      const curVbW = FIELD_W / prev
      const curVbH = FIELD_H / prev
      const centerX = panX + curVbW / 2
      const centerY = panY + curVbH / 2
      const newVbW = FIELD_W / nz
      const newVbH = FIELD_H / nz
      setPanX(centerX - newVbW / 2)
      setPanY(centerY - newVbH / 2)
      return nz
    })
  }, [panX, panY])

  const zoomIn    = () => zoomToward(zoom + 0.5)
  const zoomOut   = () => zoomToward(zoom - 0.5)
  const zoomReset = () => { setZoom(1); setPanX(0); setPanY(0) }

  // Wheel zoom — zooms toward mouse position
  const onWheelZoom = useCallback((e) => {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mouseRelX = (e.clientX - rect.left) / rect.width
    const mouseRelY = (e.clientY - rect.top)  / rect.height
    const delta = e.deltaY < 0 ? 0.3 : -0.3
    setZoom(prev => {
      const nz = Math.min(Math.max(prev + delta, 1), 4)
      if (nz === 1) { setPanX(0); setPanY(0); return 1 }
      const curVbW = FIELD_W / prev
      const curVbH = FIELD_H / prev
      // SVG coordinate under mouse
      const mx = cpX + mouseRelX * curVbW
      const my = cpY + mouseRelY * curVbH
      const newVbW = FIELD_W / nz
      const newVbH = FIELD_H / nz
      // Keep mouse position fixed on screen
      setPanX(mx - mouseRelX * newVbW)
      setPanY(my - mouseRelY * newVbH)
      return nz
    })
  }, [cpX, cpY])

  const svgRef   = useRef(null)
  const lsSvgRef = useRef(null)
  const boardRef = useRef(null)
  const animRef  = useRef(null)

  const {plays,syncStatus,lastSync,storageOk,load,addPlay,deletePlay} = useSharedPlays()

  useEffect(()=>{if(authorName)localStorage.setItem('gs_author',authorName)},[authorName])

  // Attach non-passive wheel listener for zoom
  useEffect(()=>{
    const el=svgRef.current; if(!el)return
    el.addEventListener('wheel',onWheelZoom,{passive:false})
    return()=>el.removeEventListener('wheel',onWheelZoom)
  },[onWheelZoom])

  // ── Mode switch ──────────────────────────────────────────────────────────
  const buildOffensePlayers=(fKey)=>{
    if(fKey==='base'||!OFF_FORMATIONS[fKey]) return makeOffense()
    const bx=FIELD_W/2, by=LOS_Y
    return OFF_FORMATIONS[fKey].players.map(p=>({...p,cx:bx+p.ox,cy:by+p.oy}))
  }
  const buildDefensePlayers=(fKey)=>{
    if(fKey==='base'||!DEF_FORMATIONS[fKey]) return makeDefense()
    const bx=FIELD_W/2, by=LOS_Y
    return DEF_FORMATIONS[fKey].players.map(p=>({...p,cx:bx+p.ox,cy:by+p.oy}))
  }

  const switchMode=(m)=>{
    setMode(m)
    setPlayers(m==='offense'?buildOffensePlayers(myOffFormation):buildDefensePlayers(myDefFormation))
    setRoutes({}); setRouteHistory([])
    setDrawingFor(null); setCurrentPts([])
    setAnimating(false); setAnimSnap(null)
    setSelected(null); setTool('move'); setHasExtra(false)
    setZones([]); setSelectedZone(null)
  }

  const applyMyFormation=(fKey)=>{
    if(mode==='offense'){
      setMyOffFormation(fKey)
      setPlayers(buildOffensePlayers(fKey))
    } else {
      setMyDefFormation(fKey)
      setPlayers(buildDefensePlayers(fKey))
    }
    setRoutes({}); setRouteHistory([])
    setHasExtra(false); setSelected(null)
  }

  // ── Coverage Zone Definitions ─────────────────────────────────────────────
  const ZONE_TYPES = {
    zone2:  { label:'Cover 2 Zone',   fill:'rgba(30,100,255,0.18)', stroke:'#4488ff', dash:'none',  rx:90, ry:55 },
    zone3:  { label:'Cover 3 Zone',   fill:'rgba(20,160,255,0.15)', stroke:'#22aaff', dash:'none',  rx:75, ry:50 },
    zone4:  { label:'Cover 4 Zone',   fill:'rgba(80,60,255,0.15)',  stroke:'#8866ff', dash:'none',  rx:65, ry:45 },
    hook:   { label:'Hook/Curl Zone', fill:'rgba(0,200,200,0.15)',  stroke:'#00cccc', dash:'4,3',   rx:50, ry:38 },
    flat:   { label:'Flat Zone',      fill:'rgba(0,180,100,0.15)',  stroke:'#00bb66', dash:'none',  rx:65, ry:32 },
    man:    { label:'Man Coverage',   fill:'rgba(220,30,30,0.14)',  stroke:'#ff4444', dash:'6,4',   rx:28, ry:28 },
    press:  { label:'Press Man',      fill:'rgba(255,60,0,0.12)',   stroke:'#ff6600', dash:'3,3',   rx:18, ry:18 },
    bracket:{ label:'Bracket/2-Man',  fill:'rgba(200,0,200,0.12)', stroke:'#cc44cc', dash:'5,3',   rx:36, ry:36 },
  }

  const addZone=()=>{
    const def=ZONE_TYPES[zoneType]
    const id=`zone_${_zoneId.current++}`
    setZones(prev=>[...prev,{
      id, type:zoneType,
      cx: FIELD_W/2 + (Math.random()-0.5)*80,
      cy: LOS_Y - 100 - Math.random()*60,
      rx: def.rx, ry: def.ry,
    }])
    setSelectedZone(id)
  }

  const removeZone=(id)=>{ setZones(prev=>prev.filter(z=>z.id!==id)); if(selectedZone===id)setSelectedZone(null) }
  const clearZones=()=>{ setZones([]); setSelectedZone(null) }

  // ── Add position from bench ──────────────────────────────────────────────
  const addFromBench=(p)=>{
    const cx=FIELD_W/2+(Math.random()-0.5)*80
    const cy=mode==='offense'?LOS_Y+60:LOS_Y-60
    setPlayers(prev=>[...prev,{...p,id:uid(),cx,cy}])
  }

  // ── Add/remove opponent ──────────────────────────────────────────────────
  const addExtra=()=>{
    const ex=players.map(p=>p.id)
    const bx=FIELD_W/2, by=LOS_Y
    if(mode==='offense'){
      const formation=DEF_FORMATIONS[defFormation]||DEF_FORMATIONS['5-3']
      const toAdd=formation.players
        .filter(p=>!ex.includes(p.id))
        .map(p=>({...p,isExtra:true,cx:bx+p.ox,cy:by+p.oy}))
      setPlayers(prev=>[...prev,...toAdd])
    } else {
      const formation=OFF_FORMATIONS[offFormation]||OFF_FORMATIONS['splitback']
      const toAdd=formation.players
        .filter(p=>!ex.includes(p.id))
        .map(p=>({...p,isExtra:true,cx:bx+p.ox,cy:by+p.oy}))
      setPlayers(prev=>[...prev,...toAdd])
    }
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
  // ── Find closest player to a point ────────────────────────────────────────
  const closestPlayer = (pt, pList) => {
    let best = null, bestDist = Infinity
    pList.forEach(p => {
      const d = Math.hypot(p.cx - pt.x, p.cy - pt.y)
      if (d < bestDist) { bestDist = d; best = p }
    })
    return best
  }

  // ── Freehand route drawing (field-first, no player click needed) ──────────
  // drawingFor tracks the player id routes are being drawn for.
  // '__field__' means started on empty field — snaps to closest player on commit.
  const makeHandlers=(ref,pList,setPList,rMap,setRMap,rHist,setRHist,dFor,setDFor,cPts,setCPts,drag,setDrag,sel,setSel,curTool,curBT)=>({
    onPlayerDown:(e,id)=>{
      if(animating) return
      e.stopPropagation(); setSel(id)
      if(curTool==='move'){
        const pt=getSVGPt(ref,e)
        const p=pList.find(p=>p.id===id)
        setDrag({id,ox:pt.x-p.cx,oy:pt.y-p.cy})
      }
      // route/block: SVG onPointerDown handles it — no action here
    },
    onMove:(e)=>{
      if(animating) return
      const pt=getSVGPt(ref,e)
      if(drag) setPList(prev=>prev.map(p=>p.id===drag.id?{...p,cx:pt.x-drag.ox,cy:pt.y-drag.oy}:p))
      if(dFor) setCPts(prev=>{
        const l=prev[prev.length-1]
        return(!l||Math.hypot(pt.x-l.x,pt.y-l.y)>4)?[...prev,pt]:prev
      })
    },
    onUp:(startPt)=>{
      if(drag){setDrag(null);return}
      if(dFor&&cPts.length>1){
        setRHist(h=>[...h.slice(-19),{routes:{...rMap}}])
        const isBlock=curTool==='block'
        const targetId = dFor==='__field__'
          ? closestPlayer(startPt||cPts[0], pList)?.id
          : dFor
        if(targetId){
          setRMap(prev=>({...prev,[targetId]:{
            pts:cPts,
            color:isBlock?blockColor(curBT):'#FFE033',
            lineStyle:isBlock?'solid':lineStyle,
            endCap:isBlock?blockCap(curBT):endCap,
            blockType:isBlock?curBT:null,
          }}))
        }
        setDFor(null); setCPts([])
      } else if(dFor){setDFor(null);setCPts([])}
    },
    onSvgClick:(e)=>{ if(e.target===ref.current) setSel(null) },
  })

  // ── Multi-segment waypoint route (field-first) ────────────────────────────
  const wpFinish = useCallback(()=>{
    const {pts}=wpRef.current
    if(pts.length>=2){
      const target=closestPlayer(pts[0], players)
      if(target){
        setRouteHistory(h=>[...h.slice(-19),{routes:{...routes}}])
        setRoutes(prev=>({...prev,[target.id]:{
          pts:[...pts],
          color:'#FFE033', lineStyle, endCap, blockType:null, sharp:true,
        }}))
      }
    }
    wpRef.current={active:false,pts:[],playerId:null}
    setWaypointActive(false); setWaypointPts([]); setPreviewPt(null)
    setWaypointPlayerId(null); setDrawingFor(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[players,routes,lineStyle,endCap])

  const wpCancel = useCallback(()=>{
    wpRef.current={active:false,pts:[],playerId:null}
    setWaypointActive(false); setWaypointPts([]); setPreviewPt(null)
    setWaypointPlayerId(null); setDrawingFor(null)
  },[])

  useEffect(()=>{
    const onKey=(e)=>{
      if(!wpRef.current.active) return
      if(e.key==='Escape') wpCancel()
      if(e.key==='Enter')  wpFinish()
    }
    window.addEventListener('keydown',onKey)
    return()=>window.removeEventListener('keydown',onKey)
  },[wpCancel,wpFinish])

  const mH=makeHandlers(svgRef,players,setPlayers,routes,setRoutes,routeHistory,setRouteHistory,drawingFor,setDrawingFor,currentPts,setCurrentPts,dragging,setDragging,selected,setSelected,tool,blockType)
  const lH=makeHandlers(lsSvgRef,lsPlayers,setLsPlayers,lsRoutes,setLsRoutes,lsRouteHist,setLsRouteHist,lsDrawFor,setLsDrawFor,lsCurPts,setLsCurPts,lsDragging,setLsDragging,lsSelected,setLsSelected,lsTool,lsBlockType)

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

  // ── Import bundled playbook (converted from PDF playbooks) ────────────────
  const [importStatus,setImportStatus]=useState('')
  const importBixbyPlaybook=async()=>{
    const existingNames=new Set(plays.map(p=>p.name))
    const toImport=bixbyRedPlaybook.filter(p=>!existingNames.has(p.name))
    if(toImport.length===0){setImportStatus('Already imported — no new plays.');setTimeout(()=>setImportStatus(''),2500);return}
    setImportStatus(`Importing ${toImport.length} plays…`)
    let base=Date.now()
    for(const p of toImport){
      base+=1
      await addPlay({...p,id:base,savedAt:base})
    }
    setImportStatus(`Imported ${toImport.length} plays!`)
    setTimeout(()=>setImportStatus(''),2500)
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
  const SL=(txt)=><div style={{fontSize:9,color:'#ff9999',letterSpacing:1.5,marginBottom:4,marginTop:6,opacity:0.85,fontWeight:'bold'}}>{txt}</div>
  const BtnRow=(label,active,onClick,color='#FFE033')=>(
    <button onClick={onClick} style={{padding:'4px 6px',borderRadius:4,border:`1px solid ${active?color:'#3a1a1a'}`,background:active?`${color}22`:'rgba(0,0,0,0.2)',color:active?color:'#ccc',fontFamily:'monospace',fontSize:10,fontWeight:'bold',cursor:'pointer',width:'100%',marginBottom:2,textAlign:'left'}}>{label}</button>
  )
  const syncBadge=()=>{
    const cfg={idle:{bg:'rgba(0,0,0,0.4)',color:'#99ff99',txt:'● Live'},saving:{bg:'rgba(0,0,0,0.4)',color:'#FFE033',txt:'⟳ Saving…'},saved:{bg:'rgba(0,80,0,0.4)',color:'#99ff99',txt:'✓ Saved'},error:{bg:'rgba(80,0,0,0.4)',color:'#ff9999',txt:'! Error'},loading:{bg:'rgba(0,0,80,0.4)',color:'#99aaff',txt:'⟳ Loading'}}[syncStatus]||{bg:'rgba(0,0,0,0.4)',color:'#99ff99',txt:'● Live'}
    return <div style={{fontSize:9,padding:'3px 8px',borderRadius:10,background:cfg.bg,color:cfg.color,fontFamily:'monospace'}}>{cfg.txt}</div>
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#110005 0%,#05050f 100%)',color:'#f0e8e8',fontFamily:"'Courier New',monospace",display:'flex',flexDirection:'column'}}>

      {/* Header */}
      <header style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'0 14px',background:'linear-gradient(135deg,#8B0000 0%,#cc0000 40%,#1a1a2e 100%)',
        borderBottom:'3px solid #cc0000',flexWrap:'wrap',gap:5,minHeight:54,
        boxShadow:'0 3px 16px rgba(0,0,0,0.6)',position:'relative',overflow:'hidden',
      }}>
        {/* decorative stripes */}
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,pointerEvents:'none',
          background:'repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(255,255,255,0.03) 60px,rgba(255,255,255,0.03) 61px)'}}/>
        <div style={{display:'flex',alignItems:'center',gap:10,position:'relative'}}>
          {/* helmet icon */}
          <div style={{fontSize:28,lineHeight:1}}>🏈</div>
          <div>
            <div style={{fontSize:18,fontWeight:'900',color:'#ffffff',letterSpacing:2,
              textShadow:'0 0 20px rgba(255,50,50,0.6)',fontFamily:"'Courier New',monospace",lineHeight:1}}>
              BIXBY RED FOOTBALL
            </div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.55)',letterSpacing:3,fontFamily:'monospace'}}>
              GRIDIRON STUDIO
            </div>
          </div>
          {syncBadge()}
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',position:'relative'}}>
          {[['designer','🎯 Designer'],['lineman','🔲 Lineman'],['board','✏️ Board'],['plays','📋 Playbook']].map(([t,lbl])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:'5px 11px',borderRadius:4,border:'1px solid',
              borderColor:tab===t?'#ffffff':'rgba(255,255,255,0.25)',
              background:tab===t?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.2)',
              color:'#ffffff',fontFamily:'monospace',fontWeight:'bold',fontSize:10,
              cursor:'pointer',letterSpacing:0.5,backdropFilter:'blur(4px)',
              boxShadow:tab===t?'0 0 10px rgba(255,100,100,0.4)':'none',
            }}>{lbl}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:5,alignItems:'center',position:'relative'}}>
          <span style={{fontSize:9,color:'rgba(255,255,255,0.6)'}}>👤</span>
          <input value={authorName} onChange={e=>setAuthorName(e.target.value)} placeholder="Your name"
            style={{width:85,padding:'3px 6px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.2)',
              borderRadius:4,color:'#fff',fontFamily:'monospace',fontSize:10}}/>
          <button onClick={()=>setShowInfo(!showInfo)}
            style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',
              borderRadius:4,padding:'3px 8px',cursor:'pointer',fontSize:10}}>?</button>
        </div>
      </header>

      {/* Info modal */}
      {showInfo&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowInfo(false)}>
          <div style={{background:'#0a1a0c',border:'1px solid #2d5a30',borderRadius:8,padding:22,maxWidth:440,color:'#c8e6c9',fontSize:12,lineHeight:1.9}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:14,fontWeight:'bold',color:'#FFE033',marginBottom:8}}>Gridiron Studio</div>
            <div><b style={{color:'#4ADE80'}}>Move ✋</b> — Drag any player anywhere on the field</div>
            <div><b style={{color:'#4ADE80'}}>Freehand mode</b> — Click player then drag to draw a free route</div>
            <div><b style={{color:'#4ADE80'}}>Multi-Segment mode</b> — Click player, then click to place each waypoint (go 5 yds, break left, slant back), double-click or Enter to finish, Esc to cancel</div>
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
          <div style={{width:185,background:'linear-gradient(180deg,#1a0505 0%,#0d0a1a 100%)',borderRight:'2px solid #6b0000',padding:'9px 8px',display:'flex',flexDirection:'column',gap:5,overflowY:'auto'}}>
            {SL('SIDE')}
            <div style={{display:'flex',gap:3}}>
              {['offense','defense'].map(m=>(
                <button key={m} onClick={()=>switchMode(m)} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid',
                  borderColor:mode===m?(m==='offense'?'#4ADE80':'#F87171'):'#3a1a1a',
                  background:mode===m?(m==='offense'?'rgba(74,222,128,0.15)':'rgba(204,0,0,0.2)'):'rgba(0,0,0,0.2)',
                  color:mode===m?(m==='offense'?'#4ADE80':'#ff6666'):'#ccc',
                  fontFamily:'monospace',fontSize:10,fontWeight:'bold',cursor:'pointer',textTransform:'uppercase'}}>{m==='offense'?'OFF':'DEF'}</button>
              ))}
            </div>

            {SL(mode==='offense'?'OFFENSE FORMATION':'DEFENSE FORMATION')}
            <select
              value={mode==='offense'?myOffFormation:myDefFormation}
              onChange={e=>applyMyFormation(e.target.value)}
              style={{padding:'5px 6px',borderRadius:4,
                border:`1px solid ${mode==='offense'?'#4ADE80':'#F87171'}`,
                background:'rgba(0,0,0,0.5)',
                color:mode==='offense'?'#4ADE80':'#ff8888',
                fontFamily:'monospace',fontSize:9,cursor:'pointer',width:'100%',
                boxShadow:mode==='offense'?'0 0 6px rgba(74,222,128,0.2)':'0 0 6px rgba(204,0,0,0.2)'}}>
              {mode==='offense'
                ? Object.entries(OFF_FORMATIONS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)
                : Object.entries(DEF_FORMATIONS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)
              }
            </select>

            {SL('TOOL')}
            <div style={{display:'flex',gap:3}}>
              {[['move','✋'],['route','✏️'],['block','🔲']].map(([t,ic])=>(
                <button key={t} onClick={()=>setTool(t)} title={t} style={{flex:1,padding:'5px 0',borderRadius:4,border:'1px solid',borderColor:tool===t?'#FFE033':'#3a1a1a',background:tool===t?'rgba(255,224,51,0.15)':'rgba(0,0,0,0.2)',color:tool===t?'#FFE033':'#ccc',fontFamily:'monospace',fontSize:14,cursor:'pointer'}}>{ic}</button>
              ))}
            </div>

            {(tool==='route'||tool==='block')&&<>
              {tool==='route'&&<>
                {SL('ROUTE STYLE')}
                {[['solid','─── Route','#FFE033'],['dashed','- - Pass','#60A5FA'],['zigzag','∿ Motion','#F87171']].map(([s,lbl,c])=>BtnRow(lbl,lineStyle===s,()=>setLineStyle(s),c))}
                {SL('END CAP')}
                <div style={{display:'flex',gap:3}}>
                  {[['arrow','→'],['T','T'],['dot','●']].map(([c,lbl])=>(
                    <button key={c} onClick={()=>setEndCap(c)} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid',borderColor:endCap===c?'#FFE033':'#3a1a1a',background:endCap===c?'rgba(255,224,51,0.15)':'rgba(0,0,0,0.2)',color:endCap===c?'#FFE033':'#ccc',fontFamily:'monospace',fontSize:13,cursor:'pointer'}}>{lbl}</button>
                  ))}
                </div>
                {SL('LINE MODE')}
                <button onClick={()=>{setStraightMode(!straightMode);setWaypointActive(false);setWaypointPts([]);setPreviewPt(null);setDrawingFor(null)}} style={{padding:'4px 6px',borderRadius:4,border:`1px solid ${straightMode?'#FFE033':'#3a1a1a'}`,background:straightMode?'rgba(255,224,51,0.15)':'rgba(0,0,0,0.2)',color:straightMode?'#FFE033':'#ccc',fontFamily:'monospace',fontSize:10,cursor:'pointer',width:'100%',textAlign:'left'}}>
                  {straightMode?'✓ Multi-Segment (click)':'~ Freehand (drag)'}
                </button>
                {straightMode&&<div style={{fontSize:9,color:'#ff9999',opacity:0.8,lineHeight:1.5,padding:'2px 0'}}>Click to place points → double-click or Enter to finish · Esc cancels</div>}
              </>}
              {tool==='block'&&<>
                {SL('BLOCK TYPE')}
                {BLOCK_TYPES.filter(b=>b.group==='off').map(b=>BtnRow(b.label,blockType===b.id,()=>setBlockType(b.id),b.color))}
              </>}
            </>}

            {/* Position bench */}
            <BenchPanel mode={mode} onAdd={addFromBench}/>

            {SL('ADD OPPONENT')}
            {!hasExtra ? (
              <div style={{display:'flex',flexDirection:'column',gap:3}}>
                <select
                  value={mode==='offense'?defFormation:offFormation}
                  onChange={e=>mode==='offense'?setDefFormation(e.target.value):setOffFormation(e.target.value)}
                  style={{padding:'4px 5px',borderRadius:4,border:'1px solid #3a1a1a',background:'rgba(0,0,0,0.4)',
                    color:'#ccc',fontFamily:'monospace',fontSize:9,cursor:'pointer',width:'100%'}}>
                  {mode==='offense'
                    ? Object.entries(DEF_FORMATIONS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)
                    : Object.entries(OFF_FORMATIONS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)
                  }
                </select>
                <button onClick={addExtra} style={{padding:'5px 6px',borderRadius:4,
                  background:'linear-gradient(135deg,#6b0000,#cc0000)',
                  border:'1px solid #ff4444',color:'#fff',
                  fontFamily:'monospace',fontSize:10,fontWeight:'bold',cursor:'pointer'}}>
                  + Add {mode==='offense'?'Defense':'Offense'}
                </button>
              </div>
            ) : (
              <button onClick={removeExtra} style={{padding:'4px 6px',borderRadius:4,border:'1px solid #cc0000',background:'rgba(204,0,0,0.15)',color:'#ff6666',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>✕ Remove Added</button>
            )}

            {SL('OPTIONS')}
            <button onClick={()=>setShowGaps(!showGaps)} style={{padding:'3px 6px',borderRadius:4,border:`1px solid ${showGaps?'#FFE033':'#3a1a1a'}`,background:showGaps?'rgba(255,224,51,0.1)':'rgba(0,0,0,0.2)',color:showGaps?'#FFE033':'#ccc',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>{showGaps?'✓ ':''}Gap Labels</button>

            {/* Coverage Zones — defense only */}
            {mode==='defense'&&<>
              {SL('COVERAGE ZONES')}
              <select value={zoneType} onChange={e=>setZoneType(e.target.value)}
                style={{padding:'4px 5px',borderRadius:4,border:'1px solid #3a4a6a',
                  background:'rgba(0,0,0,0.4)',color:'#88aaff',
                  fontFamily:'monospace',fontSize:9,cursor:'pointer',width:'100%'}}>
                {Object.entries(ZONE_TYPES).map(([k,v])=>(
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <button onClick={addZone} style={{padding:'5px 6px',borderRadius:4,
                background:'linear-gradient(135deg,rgba(0,40,120,0.6),rgba(0,80,200,0.4))',
                border:'1px solid #4488ff',color:'#88aaff',
                fontFamily:'monospace',fontSize:10,fontWeight:'bold',cursor:'pointer'}}>
                + Drop Zone
              </button>
              {selectedZone&&(()=>{
                const z=zones.find(z=>z.id===selectedZone)
                if(!z)return null
                const def=ZONE_TYPES[z.type]
                return (
                  <div style={{display:'flex',flexDirection:'column',gap:3,padding:'5px',
                    background:'rgba(0,40,120,0.15)',borderRadius:4,border:'1px solid #2a3a5a'}}>
                    <div style={{fontSize:9,color:'#88aaff',fontFamily:'monospace'}}>{def.label}</div>
                    <div style={{display:'flex',gap:3,alignItems:'center'}}>
                      <span style={{fontSize:8,color:'#666',fontFamily:'monospace',width:20}}>W</span>
                      <input type="range" min={20} max={220} value={z.rx}
                        onChange={e=>setZones(prev=>prev.map(zz=>zz.id===selectedZone?{...zz,rx:+e.target.value}:zz))}
                        style={{flex:1,accentColor:'#4488ff',height:14}}/>
                      <span style={{fontSize:8,color:'#88aaff',fontFamily:'monospace',width:22}}>{z.rx}</span>
                    </div>
                    <div style={{display:'flex',gap:3,alignItems:'center'}}>
                      <span style={{fontSize:8,color:'#666',fontFamily:'monospace',width:20}}>H</span>
                      <input type="range" min={15} max={180} value={z.ry}
                        onChange={e=>setZones(prev=>prev.map(zz=>zz.id===selectedZone?{...zz,ry:+e.target.value}:zz))}
                        style={{flex:1,accentColor:'#4488ff',height:14}}/>
                      <span style={{fontSize:8,color:'#88aaff',fontFamily:'monospace',width:22}}>{z.ry}</span>
                    </div>
                    <button onClick={()=>removeZone(selectedZone)} style={{padding:'3px 0',borderRadius:3,
                      border:'1px solid #cc3333',background:'rgba(180,0,0,0.15)',
                      color:'#ff6666',fontFamily:'monospace',fontSize:9,cursor:'pointer'}}>✕ Remove Zone</button>
                  </div>
                )
              })()}
              {zones.length>0&&<button onClick={clearZones} style={{padding:'3px 6px',borderRadius:3,
                border:'1px solid #3a1a1a',background:'transparent',color:'#888',
                fontFamily:'monospace',fontSize:9,cursor:'pointer'}}>Clear All Zones ({zones.length})</button>}
            </>}

            {/* Actions */}
            <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:3,paddingTop:8,borderTop:'1px solid #4a0a0a'}}>
              <button onClick={startAnim} style={{padding:'6px 0',borderRadius:4,border:'none',background:animating?'#b91c1c':'#FFE033',color:'#060e07',fontFamily:'monospace',fontWeight:'bold',fontSize:12,cursor:'pointer'}}>{animating?'■ Stop':'▶ Play'}</button>
              <div style={{display:'flex',gap:3}}>
                <button onClick={undoRoute} disabled={routeHistory.length===0} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:routeHistory.length===0?'#333':'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:routeHistory.length===0?'default':'pointer'}}>↩ Undo</button>
                <button onClick={()=>{setRoutes({});setRouteHistory([])}} style={{flex:1,padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Clear</button>
              </div>
              {selected&&<button onClick={removeSelected} style={{padding:'4px 0',borderRadius:4,border:'1px solid #b91c1c',background:'rgba(185,28,28,0.08)',color:'#F87171',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>✕ Delete Selected</button>}
              <button onClick={()=>applyMyFormation(mode==='offense'?myOffFormation:myDefFormation)} style={{padding:'4px 0',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>Reset Field</button>
              <input value={playName} onChange={e=>setPlayName(e.target.value)} placeholder="Play name…" style={{padding:'4px 6px',background:'#0d2b10',border:'1px solid #2d5a30',borderRadius:4,color:'#e8f5e9',fontFamily:'monospace',fontSize:10,width:'100%',boxSizing:'border-box'}}/>
              <button onClick={()=>doSave('designer')} disabled={syncStatus==='saving'} style={{padding:'5px 0',borderRadius:4,border:'1px solid #cc3333',background:'linear-gradient(135deg,rgba(139,0,0,0.4),rgba(204,0,0,0.3))',color:'#ff9999',fontFamily:'monospace',fontSize:10,cursor:'pointer',opacity:syncStatus==='saving'?0.5:1}}>{syncStatus==='saving'?'⟳ Saving…':'💾 Save Play'}</button>
            </div>
          </div>

          {/* Field — vertical with zoom */}
          <div style={{flex:1,position:'relative',overflow:'hidden',background:'linear-gradient(135deg,#0d0005 0%,#05050d 100%)'}}>
            {/* Zoom controls */}
            <div style={{position:'absolute',bottom:14,right:14,zIndex:10,display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}>
              <button onClick={zoomIn} title="Zoom In" style={{width:34,height:34,borderRadius:6,border:'1px solid #2d5a30',background:'rgba(10,26,12,0.92)',color:'#FFE033',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>+</button>
              <div style={{fontSize:9,color:'#4ade80',fontFamily:'monospace',textAlign:'center',background:'rgba(10,26,12,0.85)',borderRadius:4,padding:'2px 5px',border:'1px solid #1d4a20'}}>{Math.round(zoom*100)}%</div>
              <button onClick={zoomOut} title="Zoom Out" style={{width:34,height:34,borderRadius:6,border:'1px solid #2d5a30',background:'rgba(10,26,12,0.92)',color:'#FFE033',fontSize:24,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>−</button>
              {zoom>1&&<button onClick={zoomReset} title="Reset Zoom" style={{width:34,height:20,borderRadius:4,border:'1px solid #FFE033',background:'rgba(255,224,51,0.12)',color:'#FFE033',fontSize:8,cursor:'pointer',fontFamily:'monospace',backdropFilter:'blur(4px)'}}>FIT</button>}
            </div>
            <svg ref={svgRef} viewBox={viewBox}
              style={{height:'calc(100vh - 60px)',width:'100%',display:'block',borderRadius:6,
                cursor:panning?'grabbing':tool==='move'?(zoom>1?'grab':'default'):'crosshair',
                userSelect:'none',touchAction:'none'}}
              onPointerMove={(e)=>{
                if(waypointActive) setPreviewPt(getSVGPt(svgRef,e))
                if(draggingZone){
                  const pt=getSVGPt(svgRef,e)
                  setZones(prev=>prev.map(z=>z.id===draggingZone.id?{...z,cx:pt.x-draggingZone.ox,cy:pt.y-draggingZone.oy}:z))
                  return
                }
                if(resizingZone){
                  const pt=getSVGPt(svgRef,e)
                  const dx=pt.x-resizingZone.startX,dy=pt.y-resizingZone.startY
                  setZones(prev=>prev.map(z=>z.id===resizingZone.id?{
                    ...z,
                    rx:Math.max(15,resizingZone.startRx+(resizingZone.handle==='e'?dx:resizingZone.handle==='w'?-dx:0)),
                    ry:Math.max(12,resizingZone.startRy+(resizingZone.handle==='s'?dy:resizingZone.handle==='n'?-dy:0)),
                  }:z))
                  return
                }
                if(panning&&panStart){
                  const svg=svgRef.current,rect=svg.getBoundingClientRect()
                  const scaleX=vbW/rect.width,scaleY=vbH/rect.height
                  setPanX(p=>p-(e.clientX-panStart.x)*scaleX)
                  setPanY(p=>p-(e.clientY-panStart.y)*scaleY)
                  setPanStart({x:e.clientX,y:e.clientY})
                } else { mH.onMove(e) }
              }}
              onPointerDown={(e)=>{
                if(e.button!==0) return
                const pt=getSVGPt(svgRef,e)
                if(zoom>1&&tool==='move'&&!draggingZone&&!resizingZone){
                  e.preventDefault(); setPanning(true); setPanStart({x:e.clientX,y:e.clientY}); return
                }
                if(straightMode&&(tool==='route'||tool==='block')){
                  if(!waypointActive){
                    wpRef.current={active:true,pts:[pt],playerId:'__field__'}
                    setWaypointActive(true); setWaypointPts([pt]); setPreviewPt(pt)
                  }
                  return
                }
                if(tool==='route'||tool==='block'){
                  setDrawingFor('__field__'); setCurrentPts([pt])
                }
              }}
              onPointerUp={(e)=>{
                if(draggingZone){setDraggingZone(null);return}
                if(resizingZone){setResizingZone(null);return}
                if(panning){ setPanning(false); setPanStart(null); return }
                if(!waypointActive){ mH.onUp(currentPts[0]) }
              }}
              onPointerLeave={(e)=>{
                if(draggingZone){setDraggingZone(null);return}
                if(resizingZone){setResizingZone(null);return}
                if(panning){ setPanning(false); setPanStart(null); return }
                if(!waypointActive&&!straightMode) mH.onUp(currentPts[0])
              }}
              onDoubleClick={(e)=>{ if(waypointActive){ e.preventDefault(); wpFinish() } }}
              onClick={(e)=>{
                if(panning) return
                if(waypointActive){
                  const pt=getSVGPt(svgRef,e)
                  wpRef.current.pts=[...wpRef.current.pts,pt]
                  setWaypointPts([...wpRef.current.pts])
                  return
                }
                if(!drawingFor) mH.onSvgClick(e)
              }}>
              <FootballField showGaps={showGaps}/>

              {/* ── Coverage Zones (render under routes and players) ── */}
              {zones.map(z=>{
                const def=ZONE_TYPES[z.type]
                const isSel=selectedZone===z.id
                return (
                  <g key={z.id}>
                    {/* Main ellipse */}
                    <ellipse cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry}
                      fill={def.fill} stroke={def.stroke} strokeWidth={isSel?2.5:1.5}
                      strokeDasharray={def.dash} opacity={isSel?1:0.85}
                      style={{cursor:'move',filter:isSel?`drop-shadow(0 0 6px ${def.stroke})`:'none'}}
                      onPointerDown={e=>{
                        e.stopPropagation()
                        const pt=getSVGPt(svgRef,e)
                        setSelectedZone(z.id)
                        setDraggingZone({id:z.id,ox:pt.x-z.cx,oy:pt.y-z.cy})
                      }}/>
                    {/* Label */}
                    <text x={z.cx} y={z.cy+4} textAnchor="middle"
                      fill={def.stroke} fontSize={10} fontFamily="monospace"
                      fontWeight="bold" opacity={0.9}
                      style={{pointerEvents:'none',userSelect:'none'}}>
                      {def.label.split(' ')[0]}
                    </text>
                    {/* Resize handles when selected */}
                    {isSel&&[
                      {h:'e',hx:z.cx+z.rx,hy:z.cy},
                      {h:'w',hx:z.cx-z.rx,hy:z.cy},
                      {h:'s',hx:z.cx,hy:z.cy+z.ry},
                      {h:'n',hx:z.cx,hy:z.cy-z.ry},
                    ].map(({h,hx,hy})=>(
                      <rect key={h} x={hx-5} y={hy-5} width={10} height={10} rx={2}
                        fill={def.stroke} stroke="#fff" strokeWidth={1} opacity={0.9}
                        style={{cursor:h==='e'||h==='w'?'ew-resize':'ns-resize'}}
                        onPointerDown={e=>{
                          e.stopPropagation()
                          const pt=getSVGPt(svgRef,e)
                          setResizingZone({id:z.id,handle:h,startX:pt.x,startY:pt.y,startRx:z.rx,startRy:z.ry})
                        }}/>
                    ))}
                  </g>
                )
              })}
              {Object.entries(routes).map(([id,r])=><RouteLayer key={id} r={r} lineStyle={lineStyle} endCap={endCap}/>)}
              {/* Freehand preview */}
              {!straightMode&&drawingFor&&currentPts.length>1&&<RouteLayer r={{pts:currentPts,color:'#fff',lineStyle:tool==='block'?'solid':lineStyle,endCap:tool==='block'?blockCap(blockType):endCap}} lineStyle={lineStyle} endCap={endCap} highlight/>}
              {/* Waypoint segments + preview */}
              {waypointActive&&waypointPts.length>0&&(
                <g>
                  {waypointPts.length>1&&<polyline points={waypointPts.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#FFE033" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.95}/>}
                  {previewPt&&<line x1={waypointPts[waypointPts.length-1].x} y1={waypointPts[waypointPts.length-1].y} x2={previewPt.x} y2={previewPt.y} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} strokeDasharray="6,4"/>}
                  {waypointPts.map((p,i)=>(
                    <circle key={i} cx={p.x} cy={p.y} r={i===0?6:4}
                      fill={i===0?'#FFE033':'rgba(255,255,255,0.9)'} stroke="#060e07" strokeWidth={1.5}/>
                  ))}
                  {waypointPts.length>=2&&previewPt&&(
                    <text x={previewPt.x+12} y={previewPt.y-10} fill="rgba(255,255,255,0.45)" fontSize={9} fontFamily="monospace">dbl-click or Enter to finish · Esc cancel</text>
                  )}
                </g>
              )}
              {players.map(p=>(
                <PlayerIcon key={p.id} p={p}
                  selected={selected===p.id}
                  hasRoute={!!routes[p.id]}
                  drawingActive={drawingFor===p.id}
                  cx={animating&&animSnap?getAnimPos(p)?.cx:undefined}
                  cy={animating&&animSnap?getAnimPos(p)?.cy:undefined}
                  onPointerDown={(e)=>mH.onPlayerDown(e,p.id)}/>
              ))}
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
          <div style={{flex:1,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',zIndex:10,fontSize:9,color:'rgba(255,255,255,0.3)',fontFamily:'monospace',pointerEvents:'none'}}>🟩 Offense · 🟥 Defense · Select scheme → click player + drag</div>
            {/* Zoom controls for lineman studio */}
            <div style={{position:'absolute',bottom:14,right:14,zIndex:10,display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}>
              <button onClick={zoomIn} style={{width:34,height:34,borderRadius:6,border:'1px solid #2d5a30',background:'rgba(10,26,12,0.92)',color:'#FFE033',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
              <div style={{fontSize:9,color:'#4ade80',fontFamily:'monospace',textAlign:'center',background:'rgba(10,26,12,0.85)',borderRadius:4,padding:'2px 5px',border:'1px solid #1d4a20'}}>{Math.round(zoom*100)}%</div>
              <button onClick={zoomOut} style={{width:34,height:34,borderRadius:6,border:'1px solid #2d5a30',background:'rgba(10,26,12,0.92)',color:'#FFE033',fontSize:24,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
              {zoom>1&&<button onClick={zoomReset} style={{width:34,height:20,borderRadius:4,border:'1px solid #FFE033',background:'rgba(255,224,51,0.12)',color:'#FFE033',fontSize:8,cursor:'pointer',fontFamily:'monospace'}}>FIT</button>}
            </div>
            <svg ref={lsSvgRef} viewBox={viewBox}
              style={{height:'calc(100vh - 60px)',width:'100%',display:'block',borderRadius:6,
                cursor:panning?'grabbing':lsTool==='move'?(zoom>1?'grab':'default'):'crosshair',
                userSelect:'none',touchAction:'none'}}
              onPointerMove={(e)=>{
                if(panning&&panStart){
                  const svg=lsSvgRef.current,rect=svg.getBoundingClientRect()
                  const scaleX=vbW/rect.width,scaleY=vbH/rect.height
                  const dx=(e.clientX-panStart.x)*scaleX
                  const dy=(e.clientY-panStart.y)*scaleY
                  setPanX(p=>p-dx); setPanY(p=>p-dy)
                  setPanStart({x:e.clientX,y:e.clientY})
                } else { lH.onMove(e) }
              }}
              onPointerDown={(e)=>{ if(e.button===1||(e.button===0&&zoom>1&&lsTool==='move')){e.preventDefault();setPanning(true);setPanStart({x:e.clientX,y:e.clientY})} }}
              onPointerUp={(e)=>{if(panning){setPanning(false);setPanStart(null)}else lH.onUp(e)}}
              onPointerLeave={(e)=>{setPanning(false);setPanStart(null);lH.onUp(e)}}
              onClick={lH.onSvgClick}>
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
            <div style={{fontSize:13,color:'#ff8888',letterSpacing:1}}>📋 PLAYBOOK ({plays.length})</div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              {importStatus&&<span style={{fontSize:9,color:'#4ade80',fontFamily:'monospace'}}>{importStatus}</span>}
              <button onClick={importBixbyPlaybook} style={{padding:'3px 9px',borderRadius:4,border:'1px solid #FFE033',background:'rgba(255,224,51,0.07)',color:'#FFE033',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>⬇ Import Bixby Red Playbook</button>
              <button onClick={()=>load()} style={{padding:'3px 9px',borderRadius:4,border:'1px solid #2d5a30',background:'transparent',color:'#a7f3a7',fontFamily:'monospace',fontSize:10,cursor:'pointer'}}>⟳ Refresh</button>
            </div>
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
