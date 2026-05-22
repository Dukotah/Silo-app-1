/**
 * CoreStatus.js — Core Monitoring Panel
 * ALL hooks at top, unconditionally.
 * cond() for all conditional renders.
 */

import React from 'react';
import { useCoreEngine, getTier, getLevelFromXP, getXPIntoLevel, TIERS } from './useCoreEngine.js';

var e        = React.createElement;
var useState = React.useState;

function cond(test, el) { return test ? el : null; }
function mn(sz, cl, x) { return Object.assign({ fontFamily:"'DM Mono',monospace", fontSize:sz, color:cl, letterSpacing:'0.08em' }, x||{}); }

var SHIFT_COLORS = { HEAVY:'#f97316', HEAT:'#ef4444', CLEAR:'#22c55e', REFLECTIVE:'#4a9eff' };
var SHIFT_LABELS = { HEAVY:'Heavy', HEAT:'Heat', CLEAR:'Clear', REFLECTIVE:'Reflect' };

// ─── CORE NUCLEUS SVG (no hooks) ──────────────────────────────────────────────
function CoreNucleus(props) {
  var level  = props.level;
  var tier   = props.tier;
  var xpPct  = props.xpPct;
  var rings  = Math.min(level, 5);
  var kids   = [];
  var arcR   = 36;
  var arcC   = 2 * Math.PI * arcR;
  var arcOff = arcC * (1 - Math.min(xpPct, 100) / 100);

  for (var ri = 0; ri < rings; ri++) {
    var r2 = 42 + ri * 13;
    kids.push(e('circle', { key:'rg'+ri, cx:'80',cy:'80', r:String(r2), fill:'none', stroke:tier.color, strokeWidth:'0.7', opacity:Math.max(0.04,0.09-ri*0.015), style:{animation:'cpulse '+(2+ri*0.7)+'s ease-in-out '+(ri*0.4)+'s infinite'} }));
  }
  kids.push(e('circle', { key:'track', cx:'80',cy:'80', r:String(arcR), fill:'none', stroke:tier.color, strokeWidth:'2', opacity:0.1 }));
  kids.push(e('circle', { key:'arc',   cx:'80',cy:'80', r:String(arcR), fill:'none', stroke:tier.color, strokeWidth:'2.5', opacity:0.9, strokeDasharray:String(arcC), strokeDashoffset:String(arcOff), strokeLinecap:'round', style:{transform:'rotate(-90deg)',transformOrigin:'80px 80px',transition:'stroke-dashoffset 1s ease'} }));
  kids.push(e('circle', { key:'body',  cx:'80',cy:'80', r:'22', fill:tier.color, opacity:0.08 }));
  kids.push(e('circle', { key:'inner', cx:'80',cy:'80', r:'13', fill:tier.color, opacity:0.22, style:{animation:'cpulse 2s ease-in-out infinite'} }));
  kids.push(e('circle', { key:'core',  cx:'80',cy:'80', r:'5',  fill:tier.color, opacity:1,    style:{animation:'cpulse 1.4s ease-in-out infinite'} }));
  kids.push(e('text',   { key:'lvl',   x:'80',y:'85', textAnchor:'middle', fontFamily:"'DM Mono',monospace", fontSize:'11', fontWeight:'700', fill:tier.color, opacity:0.9 }, String(level)));
  return e('svg', { viewBox:'0 0 160 160', xmlns:'http://www.w3.org/2000/svg', style:{width:'100%',maxWidth:160,filter:'drop-shadow(0 0 '+(10+Math.min(level,10)*2)+'px '+tier.glow+')',transition:'filter 1s ease'} }, kids);
}

// ─── WEEKLY GRID (no hooks) ────────────────────────────────────────────────────
function WeeklyGrid(props) {
  var ws   = props.weeklyShifts || {};
  var days = [];
  for (var di = 6; di >= 0; di--) {
    var d = new Date(); d.setDate(d.getDate() - di);
    var key = d.toISOString().slice(0,10);
    var lbl = d.toLocaleDateString('en-US',{weekday:'short'}).slice(0,2).toUpperCase();
    var data = ws[key] || { HEAVY:0, HEAT:0, CLEAR:0, REFLECTIVE:0 };
    var total = data.HEAVY + data.HEAT + data.CLEAR + data.REFLECTIVE;
    days.push({ key:key, lbl:lbl, data:data, total:total });
  }
  var mx = Math.max.apply(null, days.map(function(d2){return d2.total;})) || 1;

  return e('div', { style:{ display:'flex', flexDirection:'column', gap:6 } },
    e('div', { style:{ display:'flex', gap:4, alignItems:'flex-end', height:56 } },
      days.map(function(day) {
        var bh = day.total > 0 ? Math.max((day.total/mx)*48,4) : 0;
        var dom = null; var dv = 0;
        ['HEAVY','HEAT','CLEAR','REFLECTIVE'].forEach(function(k){ if(day.data[k]>dv){dv=day.data[k];dom=k;} });
        var col = dom ? SHIFT_COLORS[dom] : '#151e30';
        return e('div', { key:day.key, style:{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 } },
          e('div', { style:{ width:'100%', background:'#080b12', borderRadius:4, height:48, display:'flex', alignItems:'flex-end', overflow:'hidden', border:'1px solid #0f1520' } },
            cond(day.total > 0,
              e('div', { style:{ width:'100%', height:bh+'px', background:col, borderRadius:'3px 3px 0 0', opacity:0.82, transition:'height 0.8s ease' } })
            )
          ),
          e('span', { style:mn(7,'#2d3748') }, day.lbl)
        );
      })
    ),
    e('div', { style:{ display:'flex', gap:10, flexWrap:'wrap', marginTop:2 } },
      ['HEAVY','HEAT','CLEAR','REFLECTIVE'].map(function(k) {
        return e('div', { key:k, style:{ display:'flex', alignItems:'center', gap:4 } },
          e('div', { style:{ width:5, height:5, borderRadius:'50%', background:SHIFT_COLORS[k] } }),
          e('span', { style:mn(7,'#475569') }, SHIFT_LABELS[k])
        );
      })
    )
  );
}

// ─── HISTORY LOG (has useState — always mounted) ───────────────────────────────
function HistoryLog(props) {
  // Hook unconditionally at top of this component
  var s1 = useState(false); var expanded = s1[0], setExpanded = s1[1];

  var log = props.log || [];

  // Conditional return AFTER hooks
  if (log.length === 0) {
    return e('div', { style:{ padding:'20px', textAlign:'center', color:'#1e2a3a', fontFamily:"'DM Mono',monospace", fontSize:11 } }, 'No transmissions logged yet.');
  }

  var visible = expanded ? log : log.slice(0,5);

  return e('div', { style:{ display:'flex', flexDirection:'column', gap:0 } },
    visible.map(function(entry, i) {
      return e('div', { key:entry.id, style:{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i < visible.length-1 ? '1px solid #0f1520' : 'none' } },
        e('div', { style:{ width:6, height:6, borderRadius:'50%', background: entry.action==='burn' ? '#ef4444' : '#4a9eff', flexShrink:0 } }),
        e('div', { style:{ flexShrink:0, minWidth:52 } },
          e('div', { style:mn(9,'#475569') }, entry.time || ''),
          e('div', { style:mn(8,'#2d3748') }, entry.date || '')
        ),
        e('div', { style:{ flex:1, minWidth:0 } },
          e('div', { style:{ fontSize:10, color:entry.shiftColor||'#94a3b8', fontFamily:"'DM Mono',monospace", fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, entry.shiftLabel||'Ambient'),
          e('div', { style:mn(8,'#2d3748') }, entry.wordCount+' words')
        ),
        e('span', { style:mn(10,'#4a9eff',{fontWeight:700,flexShrink:0}) }, '+'+entry.xp)
      );
    }),
    cond(log.length > 5,
      e('button', {
        onClick: function() { setExpanded(function(x){return !x;}); },
        style:{ marginTop:8, background:'transparent', border:'none', fontSize:9, color:'#2d3748', fontFamily:"'DM Mono',monospace", cursor:'pointer', letterSpacing:'0.1em', display:'block', width:'100%', textAlign:'left' }
      }, expanded ? '- COLLAPSE' : '+ SHOW ALL ' + log.length + ' ENTRIES')
    )
  );
}

// ─── EVOLUTION MODAL (no hooks) ────────────────────────────────────────────────
function EvolveModal(props) {
  if (!props.tier) return null;
  var tier = props.tier;
  return e('div', {
    onClick: props.onClose,
    style:{ position:'fixed', inset:0, zIndex:800, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, cursor:'pointer' }
  },
    e('div', { style:{ textAlign:'center', maxWidth:360, cursor:'default' }, onClick:function(ev){ev.stopPropagation();} },
      e('div', { style:mn(10,tier.color,{letterSpacing:'0.3em',marginBottom:12}) }, '◆ EVOLUTION EVENT'),
      e('div', { style:{ fontSize:26, fontWeight:700, color:'#e2e8f0', marginBottom:10, lineHeight:1.2 } }, tier.title),
      e('div', { style:{ fontSize:13, color:'#94a3b8', lineHeight:1.7, marginBottom:24 } }, tier.desc),
      e('button', {
        onClick: props.onClose,
        style:{ padding:'10px 26px', background:'transparent', border:'1px solid '+tier.color, borderRadius:10, fontSize:11, color:tier.color, fontFamily:"'DM Mono',monospace", letterSpacing:'0.15em', cursor:'pointer' }
      }, 'ACKNOWLEDGE')
    )
  );
}

// ─── MAIN CORESTATUS ──────────────────────────────────────────────────────────
export default function CoreStatus() {
  // ALL hooks unconditionally at top
  var engine = useCoreEngine();

  // No more hooks after this — pure derivation
  var state = engine.state;
  var pe    = engine.pendingEvolution;

  if (!state) {
    return e('div', { style:{ padding:20, fontFamily:"'DM Mono',monospace", fontSize:11, color:'#2d3748', textAlign:'center' } }, 'Initializing core...');
  }

  var totalXP = state.totalXP || 0;
  var level   = getLevelFromXP(totalXP);
  var lvlXP   = getXPIntoLevel(totalXP);
  var xpPct   = Math.round((lvlXP / engine.XP_PER_LEVEL) * 100);
  var tier    = getTier(level);
  var streak  = state.streak || 0;
  var log     = state.log || [];
  var commits = log.filter(function(x){return x.action==='commit';}).length;
  var burns   = log.filter(function(x){return x.action==='burn';}).length;

  function card(children) {
    return e('div', { style:{ background:'#0a0e1a', border:'1px solid #151e30', borderRadius:14, overflow:'hidden', marginBottom:10 } }, children);
  }
  function ch(label, right) {
    return e('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid #0f1520', background:'#080b12' } },
      e('span', { style:mn(9,'#94a3b8',{fontWeight:700,letterSpacing:'0.15em'}) }, label),
      right || null
    );
  }

  return e('div', { style:{ display:'flex', flexDirection:'column' } },
    e('style', null,
      "@keyframes cpulse{0%,100%{opacity:1}50%{opacity:0.3}}" +
      "@keyframes cfadeIn{from{opacity:0}to{opacity:1}}" +
      "@keyframes cscaleIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}"
    ),

    e(EvolveModal, { tier: pe, onClose: engine.dismissEvolution }),

    // ── CORE MONITOR ──────────────────────────────────────────────────────────
    card(e('div', null,
      ch('CORE MONITOR', e('span', { style:mn(8,tier.color,{fontWeight:700}) }, 'LV.'+level)),
      e('div', { style:{ padding:'16px 14px', display:'flex', alignItems:'center', gap:14 } },
        e('div', { style:{ width:96, flexShrink:0 } },
          e(CoreNucleus, { level:level, tier:tier, xpPct:xpPct })
        ),
        e('div', { style:{ flex:1, minWidth:0 } },
          e('div', { style:{ fontSize:14, fontWeight:700, color:tier.color, marginBottom:4, fontFamily:"'DM Mono',monospace", letterSpacing:'0.03em' } }, tier.title),
          e('div', { style:{ fontSize:11, color:'#475569', marginBottom:12, lineHeight:1.5 } }, tier.desc),
          e('div', { style:{ marginBottom:4 } },
            e('div', { style:{ display:'flex', justifyContent:'space-between', marginBottom:5 } },
              e('span', { style:mn(8,'#2d3748') }, 'XP PROGRESS'),
              e('span', { style:mn(8,tier.color) }, lvlXP+' / '+engine.XP_PER_LEVEL)
            ),
            e('div', { style:{ height:4, background:'#0f1520', borderRadius:2, overflow:'hidden' } },
              e('div', { style:{ height:'100%', width:xpPct+'%', background:tier.color, borderRadius:2, transition:'width 1s ease', boxShadow:'0 0 8px '+tier.glow } })
            ),
            e('div', { style:mn(8,'#2d3748',{marginTop:3}) }, (engine.XP_PER_LEVEL-lvlXP)+' XP to Level '+(level+1))
          )
        )
      )
    )),

    // ── TELEMETRY ─────────────────────────────────────────────────────────────
    card(e('div', null,
      ch('TELEMETRY'),
      e('div', { style:{ padding:'12px 14px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 } },
        [
          { label:'STREAK',    value:streak+'d',     color:'#f97316' },
          { label:'COMMITTED', value:String(commits), color:'#4a9eff' },
          { label:'PURGED',    value:String(burns),   color:'#ef4444' },
        ].map(function(item) {
          return e('div', { key:item.label, style:{ background:'#080b12', border:'1px solid #0f1520', borderRadius:10, padding:'10px 12px' } },
            e('div', { style:mn(7,'#2d3748',{marginBottom:5}) }, item.label),
            e('div', { style:{ fontSize:18, fontWeight:700, color:item.color, fontFamily:"'DM Mono',monospace", lineHeight:1 } }, item.value)
          );
        })
      )
    )),

    // ── EVOLUTION TRACK ────────────────────────────────────────────────────────
    card(e('div', null,
      ch('EVOLUTION TRACK'),
      e('div', { style:{ padding:'12px 14px', display:'flex', gap:5 } },
        TIERS.map(function(t, i) {
          var reached  = level >= t.minLevel;
          var current  = tier.title === t.title;
          return e('div', { key:i, style:{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 } },
            e('div', { style:{ width:'100%', height:34, background: reached ? (current?t.color+'18':'rgba(255,255,255,0.03)') : '#080b12', border:'1px solid '+(reached?t.color:'#0f1520'), borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', boxShadow: current?'0 0 10px '+t.glow:'none', transition:'all 0.4s' } },
              e('div', { style:{ width:7, height:7, borderRadius:'50%', background: reached?t.color:'#151e30', opacity: current?1:0.55 } })
            ),
            e('div', { style:mn(6,reached?t.color:'#2d3748',{textAlign:'center',lineHeight:1.3}) }, t.title.split(' ')[0].toUpperCase())
          );
        })
      )
    )),

    // ── WEEKLY LANDSCAPE ─────────────────────────────────────────────────────
    card(e('div', null,
      ch('WEEKLY LANDSCAPE'),
      e('div', { style:{ padding:'12px 14px' } },
        e(WeeklyGrid, { weeklyShifts: state.weeklyShifts })
      )
    )),

    // ── HISTORY ───────────────────────────────────────────────────────────────
    card(e('div', null,
      ch('TRANSMISSION LOG', e('span', { style:mn(8,'#2d3748') }, log.length+' TOTAL')),
      e('div', { style:{ padding:'8px 14px 12px' } },
        e(HistoryLog, { log:log })
      )
    )),

    // Reset
    e('button', {
      onClick: function() {
        if (window.confirm('Reset all Core data? This cannot be undone.')) engine.resetAll();
      },
      style:{ marginTop:4, padding:'9px 14px', background:'transparent', border:'1px solid #0f1520', borderRadius:8, fontSize:8, color:'#1e2a3a', fontFamily:"'DM Mono',monospace", cursor:'pointer', letterSpacing:'0.1em', width:'100%' }
    }, 'RESET CORE DATA')
  );
}
