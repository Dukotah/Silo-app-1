import React from 'react';
import { CoreProvider, useCoreEngine, getTier, getLevelFromXP, getLvlXP, TIERS, ACTIVITIES } from './useCoreEngine.js';
import { parse } from './coreParser.js';

var e        = React.createElement;
var useState = React.useState;
var useEffect= React.useEffect;
var useRef   = React.useRef;
function cond(test, el) { return test ? el : null; }

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
var CSS =
  "@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600;700&display=swap');" +
  "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
  "html,body,#root{height:100%;background:#060910}" +
  "body{overscroll-behavior:none;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}" +
  "::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1a2d4a;border-radius:2px}" +
  "textarea,input{outline:none}button{cursor:pointer;border:none;background:none;padding:0}" +
  "@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}" +
  "@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}" +
  "@keyframes scaleIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}" +
  "@keyframes burnOut{0%{opacity:1;transform:scale(1);filter:blur(0)}100%{opacity:0;transform:scale(0.95);filter:blur(6px)}}" +
  "@keyframes burnGlow{0%,100%{opacity:0}50%{opacity:1}}" +
  "@keyframes slideUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}";

// ─── SHARED STYLE HELPERS ─────────────────────────────────────────────────────
function mn(sz,cl,x){return Object.assign({fontFamily:"'DM Mono',monospace",fontSize:sz,color:cl,letterSpacing:'0.08em'},x||{});}
function row(x){return Object.assign({display:'flex',alignItems:'center'},x||{});}
function cond2(t,a,b){return t?a:b;}

// ─── STAT BAR ─────────────────────────────────────────────────────────────────
function StatBar(props) {
  var pct = props.max > 0 ? Math.min((props.val/props.max)*100,100) : 0;
  return e('div',{style:{flex:1}},
    e('div',{style:row({justifyContent:'space-between',marginBottom:4})},
      e('span',{style:mn(8,'#475569')},props.label),
      e('span',{style:mn(8,props.val>0?props.color:'#2d3748')},String(props.val))
    ),
    e('div',{style:{height:3,background:'#0f1520',borderRadius:2,overflow:'hidden'}},
      e('div',{style:{height:'100%',width:pct+'%',background:props.color,borderRadius:2,transition:'width 0.9s ease'}})
    )
  );
}

// ─── CORE ENTITY SVG ──────────────────────────────────────────────────────────
function CoreEntity(props) {
  var lv  = props.level;
  var t   = props.tier;
  var pct = props.xpPct;
  var kids = [];
  var arcR = 44; var arcC = 2*Math.PI*arcR;
  var off  = arcC*(1-Math.min(pct,100)/100);
  // Aura rings
  for (var ri=0; ri<Math.min(lv,6); ri++) {
    kids.push(e('circle',{key:'r'+ri,cx:'100',cy:'100',r:String(52+ri*15),fill:'none',stroke:t.color,strokeWidth:'0.7',opacity:Math.max(0.03,0.1-ri*0.015),style:{animation:'pulse '+(2.2+ri*0.7)+'s ease-in-out '+(ri*0.35)+'s infinite'}}));
  }
  // XP arc track
  kids.push(e('circle',{key:'track',cx:'100',cy:'100',r:String(arcR),fill:'none',stroke:t.color,strokeWidth:'2',opacity:0.1}));
  kids.push(e('circle',{key:'arc',cx:'100',cy:'100',r:String(arcR),fill:'none',stroke:t.color,strokeWidth:'3',opacity:0.85,strokeDasharray:String(arcC.toFixed(1)),strokeDashoffset:String(off.toFixed(1)),strokeLinecap:'round',style:{transform:'rotate(-90deg)',transformOrigin:'100px 100px',transition:'stroke-dashoffset 1s ease'}}));
  // Body geometry — evolves with level
  var bodyParts = [];
  // Core nucleus
  bodyParts.push(e('circle',{key:'b0',cx:'100',cy:'100',r:'28',fill:t.color,opacity:0.07}));
  bodyParts.push(e('circle',{key:'b1',cx:'100',cy:'100',r:'18',fill:t.color,opacity:0.15,style:{animation:'pulse 2s ease-in-out infinite'}}));
  bodyParts.push(e('circle',{key:'b2',cx:'100',cy:'100',r:'8', fill:t.color,opacity:0.9, style:{animation:'pulse 1.5s ease-in-out infinite'}}));
  // Spokes grow with level
  var spokes = Math.min(lv*2, 12);
  for (var si=0; si<spokes; si++) {
    var ang = (si/spokes)*Math.PI*2;
    var x1  = 100 + Math.cos(ang)*18;
    var y1  = 100 + Math.sin(ang)*18;
    var x2  = 100 + Math.cos(ang)*(26+lv*2.5);
    var y2  = 100 + Math.sin(ang)*(26+lv*2.5);
    bodyParts.push(e('line',{key:'sp'+si,x1:String(x1.toFixed(1)),y1:String(y1.toFixed(1)),x2:String(x2.toFixed(1)),y2:String(y2.toFixed(1)),stroke:t.color,strokeWidth:'1',opacity:0.3+lv*0.04}));
  }
  // Orbiting nodes at higher levels
  if (lv >= 4) {
    var orbs = Math.min(lv-2, 8);
    for (var oi=0; oi<orbs; oi++) {
      var oa = (oi/orbs)*Math.PI*2;
      var ox = 100 + Math.cos(oa)*38;
      var oy = 100 + Math.sin(oa)*38;
      bodyParts.push(e('circle',{key:'o'+oi,cx:String(ox.toFixed(1)),cy:String(oy.toFixed(1)),r:'3',fill:t.color,opacity:0.6,style:{animation:'pulse '+(1.5+oi*0.25)+'s ease-in-out '+(oi*0.18)+'s infinite'}}));
    }
  }
  // Level indicator
  bodyParts.push(e('text',{key:'lv',x:'100',y:'105',textAnchor:'middle',fontFamily:"'DM Mono',monospace",fontSize:'13',fontWeight:'700',fill:t.color,opacity:0.9},String(lv)));
  kids = kids.concat(bodyParts);
  return e('svg',{viewBox:'0 0 200 200',xmlns:'http://www.w3.org/2000/svg',
    style:{width:'100%',maxWidth:props.size||200,filter:'drop-shadow(0 0 '+(12+Math.min(lv,12)*3)+'px '+t.glow+')',transition:'filter 1.2s ease'}
  },kids);
}

// ─── EVOLUTION MODAL ──────────────────────────────────────────────────────────
function EvolveModal(props) {
  if (!props.tier) return null;
  var t = props.tier;
  return e('div',{onClick:props.onClose,style:{position:'fixed',inset:0,zIndex:800,background:'rgba(0,0,0,0.92)',display:'flex',alignItems:'center',justifyContent:'center',padding:24,cursor:'pointer'}},
    e('div',{style:{textAlign:'center',maxWidth:380,cursor:'default',animation:'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)'},onClick:function(ev){ev.stopPropagation();}},
      e('div',{style:mn(10,t.color,{letterSpacing:'0.3em',marginBottom:14})},'EVOLUTION EVENT'),
      e('div',{style:{fontSize:26,fontWeight:700,color:'#e2e8f0',marginBottom:10,lineHeight:1.2}},t.title),
      e('div',{style:{fontSize:13,color:'#94a3b8',lineHeight:1.7,marginBottom:24}},t.desc),
      e('button',{onClick:props.onClose,style:{padding:'10px 26px',background:'transparent',border:'1px solid '+t.color,borderRadius:10,fontSize:11,color:t.color,fontFamily:"'DM Mono',monospace",letterSpacing:'0.15em',cursor:'pointer'}},'ACKNOWLEDGE')
    )
  );
}

// ─── XP TOAST ─────────────────────────────────────────────────────────────────
function XPToast(props) {
  if (!props.data) return null;
  var d = props.data;
  return e('div',{style:{position:'fixed',top:20,right:20,zIndex:900,background:'#0a0e1a',border:'1px solid '+(d.shiftColor||'#4a9eff'),borderRadius:14,padding:'13px 17px',width:270,boxShadow:'0 0 24px '+(d.shiftColor||'#4a9eff')+'44',animation:'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',fontFamily:"'DM Mono',monospace"}},
    e('div',{style:row({justifyContent:'space-between',marginBottom:9})},
      e('span',{style:mn(10,d.shiftColor||'#4a9eff',{fontWeight:700,letterSpacing:'0.15em'})},d.action==='burn'?'PURGE COMPLETE':'MATRIX UPDATED'),
      e('button',{onClick:props.onClose,style:{background:'transparent',border:'none',color:'#475569',cursor:'pointer',fontSize:16,lineHeight:1,padding:'0 2px'}},'×')
    ),
    e('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}},
      [{l:'WORDS',v:d.wordCount},{l:'SIGNAL',v:d.shiftLabel?d.shiftLabel.split(' / ')[0]:'Ambient'},{l:'XP',v:'+'+d.xp}].map(function(item){
        return e('div',{key:item.l,style:{background:'rgba(255,255,255,0.04)',borderRadius:7,padding:'7px 9px'}},
          e('div',{style:mn(7,'#475569',{marginBottom:3})},item.l),
          e('div',{style:{fontSize:12,fontWeight:700,color:'#e2e8f0'}},String(item.v))
        );
      })
    )
  );
}

// ─── TAB CONSTANTS ────────────────────────────────────────────────────────────
var TABS = [
  {id:'HOME',     label:'Home',    glyph:'⬡'},
  {id:'JOURNAL',  label:'Journal', glyph:'◎'},
  {id:'TRAIN',    label:'Train',   glyph:'◈'},
  {id:'SIGNALS',  label:'Signals', glyph:'◇'},
];

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
function HomeTab(props) {
  var s=props.state, engine=props.engine;
  var level  = getLevelFromXP(s.totalXP||0);
  var lvlXP  = getLvlXP(s.totalXP||0);
  var pct    = Math.round((lvlXP/props.XPL)*100);
  var tier   = getTier(level);
  var actLog = s.activityLog||[];
  var stats  = {body:0,mind:0,soul:0};
  actLog.forEach(function(a){
    var def=ACTIVITIES.find(function(x){return x.id===a.id;});
    if(def)stats[def.stat]=Math.min(stats[def.stat]+1,999);
  });
  var mx = Math.max(stats.body,stats.mind,stats.soul,1);
  var streak=s.streak||0;
  var nextMil=null;
  var milestones=[{days:1,label:'First Hold'},{days:3,label:'3-Day Lock'},{days:7,label:'One Week'},{days:14,label:'Fortnight'},{days:30,label:'30-Day Protocol'},{days:60,label:'Signal Silence'}];
  for(var i=0;i<milestones.length;i++){if(milestones[i].days>streak){nextMil=milestones[i];break;}}
  var todayActs=Object.keys(s.loggedToday||{}).length;
  var todayXP=Object.keys(s.loggedToday||{}).reduce(function(sum,id){
    var def=ACTIVITIES.find(function(x){return x.id===id;});
    return sum+(def?def.xp:0);
  },0);

  var card={background:'#0a0e1a',border:'1px solid #151e30',borderRadius:16,overflow:'hidden',marginBottom:12};
  var cardH={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 15px',borderBottom:'1px solid #0f1520',background:'#080b12'};

  return e('div',{style:{display:'flex',flexDirection:'column',gap:0,animation:'fadeUp 0.35s ease'}},
    // Character hero card
    e('div',{style:Object.assign({},card,{background:'linear-gradient(145deg,#0a0e1a,#0d1220)',marginBottom:12})},
      e('div',{style:cardH},
        e('span',{style:mn(9,'#94a3b8',{fontWeight:700})},'CORE ENTITY'),
        e('span',{style:mn(9,tier.color,{fontWeight:700})},tier.title.toUpperCase())
      ),
      e('div',{style:{padding:'20px 16px',display:'flex',alignItems:'center',gap:16}},
        e('div',{style:{width:160,flexShrink:0}},e(CoreEntity,{level:level,tier:tier,xpPct:pct})),
        e('div',{style:{flex:1,minWidth:0}},
          e('div',{style:{fontSize:17,fontWeight:700,color:'#e2e8f0',marginBottom:3,fontFamily:"'DM Mono',monospace"}},'Level '+level),
          e('div',{style:{fontSize:12,color:'#475569',marginBottom:14,lineHeight:1.5}},tier.desc),
          e('div',{style:{marginBottom:12}},
            e('div',{style:row({justifyContent:'space-between',marginBottom:4})},e('span',{style:mn(8,'#2d3748')},'FORM XP'),e('span',{style:mn(8,tier.color)},lvlXP+'/'+props.XPL)),
            e('div',{style:{height:5,background:'#0f1520',borderRadius:3,overflow:'hidden'}},
              e('div',{style:{height:'100%',width:pct+'%',background:tier.color,borderRadius:3,transition:'width 1s ease',boxShadow:'0 0 8px '+tier.glow}})
            ),
            e('div',{style:mn(8,'#2d3748',{marginTop:3})},level<24?(props.XPL-lvlXP)+' XP to next level':'MAXIMUM FORM')
          ),
          e('div',{style:row({gap:8})},
            e(StatBar,{label:'BODY',val:stats.body,max:mx,color:'#22c55e'}),
            e(StatBar,{label:'MIND',val:stats.mind,max:mx,color:'#4a9eff'}),
            e(StatBar,{label:'SOUL',val:stats.soul,max:mx,color:'#f97316'})
          )
        )
      )
    ),
    // Status strip
    e('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}},
      [{label:'STREAK',val:streak+'d',color:'#f97316'},{label:'TODAY XP',val:'+'+todayXP,color:'#4a9eff'},{label:'ACTIONS',val:todayActs+' logged',color:'#22c55e'}].map(function(item){
        return e('div',{key:item.label,style:{background:'#0a0e1a',border:'1px solid #151e30',borderRadius:12,padding:'12px 14px'}},
          e('div',{style:mn(7,'#2d3748',{marginBottom:5})},item.label),
          e('div',{style:{fontSize:15,fontWeight:700,color:item.color,fontFamily:"'DM Mono',monospace",lineHeight:1}},item.val)
        );
      })
    ),
    // Evolution track
    e('div',{style:card},
      e('div',{style:cardH},e('span',{style:mn(9,'#94a3b8',{fontWeight:700})},'EVOLUTION TRACK')),
      e('div',{style:{padding:'12px 14px',display:'flex',gap:5}},
        TIERS.map(function(t2,i){
          var reached=level>=t2.min, current=tier.title===t2.title;
          return e('div',{key:i,style:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}},
            e('div',{style:{width:'100%',height:32,background:reached?t2.color+'18':'#080b12',border:'1px solid '+(reached?t2.color:'#0f1520'),borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:current?'0 0 10px '+t2.glow:'none',transition:'all 0.4s'}},
              e('div',{style:{width:7,height:7,borderRadius:'50%',background:reached?t2.color:'#151e30',opacity:current?1:0.55}})
            ),
            e('div',{style:mn(6,reached?t2.color:'#2d3748',{textAlign:'center',lineHeight:1.3})},t2.title.split(' ')[0].toUpperCase())
          );
        })
      )
    ),
    // Next milestone
    e('div',{style:Object.assign({},card,{padding:'13px 15px'})},
      e('div',{style:row({justifyContent:'space-between',marginBottom:8})},
        e('span',{style:mn(9,'#94a3b8',{fontWeight:700})},'NEXT MILESTONE'),
        e('span',{style:mn(9,'#2d3748')},streak+'d streak')
      ),
      nextMil
        ? e('div',null,
            e('div',{style:{fontSize:14,fontWeight:700,color:'#e2e8f0',marginBottom:5}},nextMil.label),
            e('div',{style:{height:4,background:'#0f1520',borderRadius:2,overflow:'hidden'}},
              e('div',{style:{height:'100%',width:Math.min((streak/nextMil.days)*100,100)+'%',background:'#4a9eff',borderRadius:2,transition:'width 1s ease'}})
            ),
            e('div',{style:mn(9,'#2d3748',{marginTop:4})},(nextMil.days-streak)+' days away')
          )
        : e('div',{style:{fontSize:13,color:'#22c55e'}},'All milestones reached.')
    )
  );
}

// ─── JOURNAL TAB ──────────────────────────────────────────────────────────────
function JournalTab(props) {
  var engine=props.engine, state=props.state;
  var s1=useState('');    var text=s1[0],setText=s1[1];
  var s2=useState(null);  var toast=s2[0],setToast=s2[1];
  var s3=useState(false); var burning=s3[0],setBurning=s3[1];
  var s4=useState(false); var focused=s4[0],setFocused=s4[1];
  var s5=useState(null);  var expanded=s5[0],setExpanded=s5[1];
  var timerRef=useRef(null);
  var taRef=useRef(null);

  useEffect(function(){return function(){if(timerRef.current)clearTimeout(timerRef.current);};},[]); 

  function showToast(r){
    if(timerRef.current)clearTimeout(timerRef.current);
    setToast(r);
    timerRef.current=setTimeout(function(){setToast(null);},3500);
  }
  function doCommit(){
    if(!text.trim()||burning)return;
    var r=parse(text,'commit');
    engine.commitEntry(r);
    showToast(r);
    setText('');
    if(taRef.current)taRef.current.focus();
  }
  function doBurn(){
    if(!text.trim()||burning)return;
    var r=parse(text,'burn');
    setBurning(true);
    setTimeout(function(){
      engine.commitEntry(r);
      showToast(r);
      setText('');
      setBurning(false);
      if(taRef.current)taRef.current.focus();
    },720);
  }

  var hasText=text.trim().length>0;
  var active=hasText&&!burning;
  var wc=hasText?text.trim().split(/\s+/).filter(function(w){return w.length>0;}).length:0;
  var card={background:'#0a0e1a',border:'1px solid #151e30',borderRadius:16,overflow:'hidden',marginBottom:12};
  var SHIFT_COLORS={HEAVY:'#f97316',HEAT:'#ef4444',CLEAR:'#22c55e',REFLECTIVE:'#4a9eff'};
  var entries=state.journalEntries||[];

  return e('div',{style:{animation:'fadeUp 0.35s ease'}},
    e('style',null,
      "@keyframes burnOut2{0%{opacity:1;transform:scale(1);filter:blur(0)}100%{opacity:0;transform:scale(0.95);filter:blur(6px)}}" +
      "@keyframes burnGlow2{0%,100%{opacity:0}50%{opacity:1}}"
    ),
    // Input card
    e('div',{style:card},
      e('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 15px',borderBottom:'1px solid #0f1520',background:'#080b12'}},
        e('span',{style:mn(9,'#94a3b8',{fontWeight:700})},'VENT CANVAS'),
        e('span',{style:mn(9,'#2d3748',{opacity:hasText?1:0,transition:'opacity 0.2s'})},wc+' WORDS')
      ),
      e('div',{style:{position:'relative',animation:burning?'burnOut2 0.72s ease-out forwards':'none'}},
        e('div',{style:{position:'absolute',inset:0,zIndex:2,borderRadius:0,background:'linear-gradient(135deg,rgba(239,68,68,0.18),rgba(249,115,22,0.12))',pointerEvents:'none',opacity:burning?1:0,animation:burning?'burnGlow2 0.72s ease-out forwards':'none'}}),
        e('textarea',{ref:taRef,value:text,onChange:function(ev){setText(ev.target.value);},onFocus:function(){setFocused(true);},onBlur:function(){setFocused(false);},
          onKeyDown:function(ev){if((ev.ctrlKey||ev.metaKey)&&ev.key==='Enter'){ev.preventDefault();doCommit();}},
          placeholder:'Begin transmission. Write anything — this space is entirely private and local.\nCommit to save analytics. Burn to vaporize completely.',
          style:{position:'relative',zIndex:1,width:'100%',minHeight:200,padding:'16px 18px',background:'transparent',border:'none',resize:'none',outline:'none',fontSize:14,color:'#e2e8f0',fontFamily:"'DM Sans',sans-serif",lineHeight:1.8,boxSizing:'border-box',caretColor:'#4a9eff',borderLeft:focused?'2px solid #1e3a5f':'2px solid transparent',transition:'border-left-color 0.2s'}
        }),
        e('div',{style:{padding:'6px 18px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}},
          e('span',{style:mn(8,'#1e2a3a')},text.length+' CHARS · CTRL+ENTER TO COMMIT'),
          e('div',null)
        )
      ),
      // Buttons
      e('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0,borderTop:'1px solid #0f1520'}},
        e('button',{onClick:doCommit,disabled:!active,style:{padding:'13px 16px',background:active?'#0a1628':'#080b12',borderRight:'1px solid #0f1520',display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3,transition:'all 0.15s',cursor:active?'pointer':'default'}},
          e('span',{style:mn(10,active?'#4a9eff':'#1a2535',{fontWeight:700,letterSpacing:'0.15em'})},'◆ COMMIT'),
          e('span',{style:mn(8,'#1e2a3a',{letterSpacing:'0.08em'})},'SAVE ANALYTICS · GRANT XP')
        ),
        e('button',{onClick:doBurn,disabled:!active,style:{padding:'13px 16px',background:active?'#150806':'#080b12',display:'flex',flexDirection:'column',alignItems:'flex-start',gap:3,transition:'all 0.15s',cursor:active?'pointer':'default'}},
          e('span',{style:mn(10,active?'#ef4444':'#1a2535',{fontWeight:700,letterSpacing:'0.15em'})},'◈ BURN & PURGE'),
          e('span',{style:mn(8,'#1e2a3a',{letterSpacing:'0.08em'})},'VAPORIZE · GRANT XP')
        )
      )
    ),
    // Journal log
    e('div',{style:card},
      e('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 15px',borderBottom:'1px solid #0f1520',background:'#080b12'}},
        e('span',{style:mn(9,'#94a3b8',{fontWeight:700})},'TRANSMISSION LOG'),
        e('span',{style:mn(9,'#2d3748')},entries.length+' ENTRIES')
      ),
      entries.length===0
        ? e('div',{style:{padding:'28px 18px',textAlign:'center',color:'#2d3748',fontFamily:"'DM Mono',monospace",fontSize:11}},'No transmissions logged yet.')
        : e('div',null,entries.slice(0,20).map(function(en,i){
            var isX=expanded===en.id;
            var sc=en.mood?SHIFT_COLORS[en.mood]||'#94a3b8':'#94a3b8';
            return e('div',{key:en.id,onClick:function(){setExpanded(isX?null:en.id);},style:{borderBottom:i<entries.length-1?'1px solid #0a0d14':'none',cursor:'pointer',transition:'background 0.12s'},onMouseEnter:function(ev){ev.currentTarget.style.background='#0d1117';},onMouseLeave:function(ev){ev.currentTarget.style.background='transparent';}},
              e('div',{style:row({justifyContent:'space-between',padding:'11px 15px'})},
                e('div',{style:row({gap:10,flex:1,minWidth:0})},
                  e('div',{style:{width:6,height:6,borderRadius:'50%',background:sc,flexShrink:0}}),
                  e('div',{style:{minWidth:0}},
                    e('div',{style:{fontSize:12,color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},en.text?en.text.slice(0,60)+(en.text.length>60?'...':''):'[purged]'),
                    e('div',{style:mn(8,'#2d3748',{marginTop:2})},en.date+' '+en.time+' · +'+en.xp+' XP')
                  )
                ),
                e('span',{style:{color:'#2d3748',fontSize:12,flexShrink:0,marginLeft:8}},isX?'▲':'▼')
              ),
              cond(isX&&en.text,
                e('div',{style:{padding:'0 15px 13px',fontSize:13,color:'#475569',lineHeight:1.75,borderTop:'1px solid #0a0d14',paddingTop:11,whiteSpace:'pre-wrap'}},en.text)
              )
            );
          }))
    ),
    e(XPToast,{data:toast,onClose:function(){setToast(null);}})
  );
}

// ─── TRAIN TAB ────────────────────────────────────────────────────────────────
function TrainTab(props) {
  var engine=props.engine, state=props.state;
  var s1=useState(null); var toastAct=s1[0],setToastAct=s1[1];
  var timerRef=useRef(null);
  useEffect(function(){return function(){if(timerRef.current)clearTimeout(timerRef.current);};},[]); 

  function doLog(act){
    if((state.loggedToday||{})[act.id])return;
    engine.logActivity(act.id,act.xp);
    if(timerRef.current)clearTimeout(timerRef.current);
    setToastAct(act);
    timerRef.current=setTimeout(function(){setToastAct(null);},2500);
  }

  var actLog=state.activityLog||[];
  var stats={body:0,mind:0,soul:0};
  actLog.forEach(function(a){
    var def=ACTIVITIES.find(function(x){return x.id===a.id;});
    if(def)stats[def.stat]=Math.min(stats[def.stat]+1,999);
  });
  var mx=Math.max(stats.body,stats.mind,stats.soul,1);
  var todayCount=Object.keys(state.loggedToday||{}).length;
  var todayXP=Object.keys(state.loggedToday||{}).reduce(function(sum,id){
    var def=ACTIVITIES.find(function(x){return x.id===id;});
    return sum+(def?def.xp:0);
  },0);
  var level=getLevelFromXP(state.totalXP||0);
  var tier=getTier(level);
  var card={background:'#0a0e1a',border:'1px solid #151e30',borderRadius:16,overflow:'hidden',marginBottom:12};
  var groups=[{label:'BODY',stat:'body',color:'#22c55e'},{label:'MIND',stat:'mind',color:'#4a9eff'},{label:'SOUL',stat:'soul',color:'#f97316'}];

  return e('div',{style:{animation:'fadeUp 0.35s ease'}},
    // Header stats
    e('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}},
      [{label:'TODAY XP',val:'+'+todayXP,color:'#4a9eff'},{label:'LOGGED',val:todayCount+' acts',color:'#22c55e'},{label:'TOTAL XP',val:state.totalXP||0,color:tier.color}].map(function(item){
        return e('div',{key:item.label,style:{background:'#0a0e1a',border:'1px solid #151e30',borderRadius:12,padding:'12px 14px'}},
          e('div',{style:mn(7,'#2d3748',{marginBottom:5})},item.label),
          e('div',{style:{fontSize:15,fontWeight:700,color:item.color,fontFamily:"'DM Mono',monospace",lineHeight:1}},String(item.val))
        );
      })
    ),
    // Stat overview
    e('div',{style:Object.assign({},card,{padding:'14px 15px',marginBottom:12})},
      e('div',{style:mn(9,'#2d3748',{marginBottom:10,letterSpacing:'0.15em'})},'CUMULATIVE STATS'),
      e('div',{style:{display:'flex',gap:12}},
        groups.map(function(g){
          return e('div',{key:g.stat,style:{flex:1}},
            e('div',{style:row({justifyContent:'space-between',marginBottom:4})},
              e('span',{style:mn(8,g.color,{fontWeight:700})},'▪ '+g.label),
              e('span',{style:mn(8,'#475569')},stats[g.stat]+' actions')
            ),
            e('div',{style:{height:4,background:'#0f1520',borderRadius:2,overflow:'hidden'}},
              e('div',{style:{height:'100%',width:(stats[g.stat]/mx*100)+'%',background:g.color,borderRadius:2,transition:'width 0.9s ease'}})
            )
          );
        })
      )
    ),
    // Activity groups
    groups.map(function(grp){
      var acts=ACTIVITIES.filter(function(a){return a.stat===grp.stat;});
      return e('div',{key:grp.stat,style:card},
        e('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 15px',borderBottom:'1px solid #0f1520',background:'#080b12'}},
          e('span',{style:mn(9,grp.color,{fontWeight:700})},'▪ '+grp.label),
          e('span',{style:mn(9,'#2d3748')},stats[grp.stat]+' LIFETIME ACTIONS')
        ),
        e('div',{style:{padding:'10px 12px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}},
          acts.map(function(act){
            var done=!!(state.loggedToday||{})[act.id];
            return e('button',{key:act.id,onClick:function(){doLog(act);},style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:done?'rgba(16,38,14,0.8)':'#080b12',border:'1px solid '+(done?'#14532d':'#0f1520'),borderRadius:11,cursor:done?'default':'pointer',transition:'all 0.15s',fontFamily:"'DM Sans',sans-serif"},
              onMouseEnter:function(ev){if(!done)ev.currentTarget.style.borderColor=grp.color+'66';},
              onMouseLeave:function(ev){if(!done)ev.currentTarget.style.borderColor='#0f1520';}
            },
              e('div',{style:row({gap:9})},
                e('span',{style:{fontSize:16}}),
                e('div',null,
                  e('div',{style:{fontSize:11,color:done?'#4ade80':'#94a3b8',textAlign:'left',fontWeight:done?600:400}},act.icon+' '+act.label),
                  e('div',{style:mn(8,done?'#16a34a':grp.color)},'+'+act.xp+' XP · '+act.desc)
                )
              ),
              e('div',{style:{width:18,height:18,borderRadius:'50%',background:done?'#14532d':'#0a0d14',border:'1px solid '+(done?'#22c55e':'#151e30'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:done?'#22c55e':'#2d3748',flexShrink:0}},done?'✓':'+')
            );
          })
        )
      );
    }),
    // Activity toast
    cond(toastAct!==null,
      e('div',{style:{position:'fixed',top:20,right:20,zIndex:900,background:'#0a0e1a',border:'1px solid #22c55e',borderRadius:14,padding:'12px 16px',boxShadow:'0 0 24px rgba(34,197,94,0.3)',animation:'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',fontFamily:"'DM Mono',monospace"}},
        e('div',{style:mn(10,'#22c55e',{fontWeight:700,marginBottom:5,letterSpacing:'0.15em'})},'ACTIVITY LOGGED'),
        e('div',{style:{fontSize:13,color:'#e2e8f0',marginBottom:3}},toastAct?toastAct.icon+' '+toastAct.label:''),
        e('div',{style:mn(9,'#22c55e')},'+'+( toastAct?toastAct.xp:0)+' XP · Core evolving')
      )
    )
  );
}

// ─── SIGNALS TAB ──────────────────────────────────────────────────────────────
function SignalsTab(props) {
  var state=props.state;
  var ws=state.weeklyShifts||{};
  var log=state.log||[];
  var SHIFT_COLORS={HEAVY:'#f97316',HEAT:'#ef4444',CLEAR:'#22c55e',REFLECTIVE:'#4a9eff'};
  var SHIFT_LABELS={HEAVY:'Heavy / Stress',HEAT:'Turbulent / Heat',CLEAR:'Clear / Focus',REFLECTIVE:'Reflective'};
  var card={background:'#0a0e1a',border:'1px solid #151e30',borderRadius:16,overflow:'hidden',marginBottom:12};

  // Build 7-day chart data
  var days=[];
  for(var di=6;di>=0;di--){
    var d=new Date(); d.setDate(d.getDate()-di);
    var key=d.toISOString().slice(0,10);
    var lbl=d.toLocaleDateString('en-US',{weekday:'short'}).slice(0,2).toUpperCase();
    var data=ws[key]||{HEAVY:0,HEAT:0,CLEAR:0,REFLECTIVE:0};
    var total=data.HEAVY+data.HEAT+data.CLEAR+data.REFLECTIVE;
    var dom=null,dv=0;
    ['HEAVY','HEAT','CLEAR','REFLECTIVE'].forEach(function(k){if(data[k]>dv){dv=data[k];dom=k;}});
    days.push({key:key,lbl:lbl,data:data,total:total,dom:dom});
  }
  var mx=Math.max.apply(null,days.map(function(d2){return d2.total;}))||1;

  // Shift totals across all log
  var totals={HEAVY:0,HEAT:0,CLEAR:0,REFLECTIVE:0};
  log.forEach(function(e2){if(e2.primaryShift)totals[e2.primaryShift]=(totals[e2.primaryShift]||0)+1;});
  var totalSig=totals.HEAVY+totals.HEAT+totals.CLEAR+totals.REFLECTIVE||1;

  return e('div',{style:{animation:'fadeUp 0.35s ease'}},
    // Weekly landscape
    e('div',{style:card},
      e('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 15px',borderBottom:'1px solid #0f1520',background:'#080b12'}},
        e('span',{style:mn(9,'#94a3b8',{fontWeight:700})},'WEEKLY SIGNAL LANDSCAPE'),
        e('span',{style:mn(9,'#2d3748')},log.length+' TRANSMISSIONS')
      ),
      e('div',{style:{padding:'14px 15px'}},
        e('div',{style:{display:'flex',gap:4,alignItems:'flex-end',height:72,marginBottom:8}},
          days.map(function(day){
            var bh=day.total>0?Math.max((day.total/mx)*60,4):2;
            var col=day.dom?SHIFT_COLORS[day.dom]:'#151e30';
            return e('div',{key:day.key,style:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}},
              e('div',{style:{width:'100%',height:64,display:'flex',alignItems:'flex-end',background:'#080b12',borderRadius:4,overflow:'hidden',border:'1px solid #0a0d14'}},
                cond(day.total>0,e('div',{style:{width:'100%',height:bh+'px',background:col,borderRadius:'3px 3px 0 0',opacity:0.85,transition:'height 0.8s ease'}}))
              ),
              e('span',{style:mn(7,'#2d3748')},day.lbl)
            );
          })
        ),
        e('div',{style:{display:'flex',gap:12,flexWrap:'wrap'}},
          ['HEAVY','HEAT','CLEAR','REFLECTIVE'].map(function(k){
            return e('div',{key:k,style:row({gap:5})},
              e('div',{style:{width:6,height:6,borderRadius:'50%',background:SHIFT_COLORS[k]}}),
              e('span',{style:mn(8,'#475569')},k==='REFLECTIVE'?'Reflect':SHIFT_LABELS[k].split(' / ')[0])
            );
          })
        )
      )
    ),
    // Signal breakdown
    e('div',{style:card},
      e('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 15px',borderBottom:'1px solid #0f1520',background:'#080b12'}},
        e('span',{style:mn(9,'#94a3b8',{fontWeight:700})},'ALL-TIME SIGNAL PROFILE')
      ),
      log.length===0
        ? e('div',{style:{padding:'24px',textAlign:'center',color:'#2d3748',fontFamily:"'DM Mono',monospace",fontSize:11}},'No signals recorded yet.')
        : e('div',{style:{padding:'14px 15px',display:'flex',flexDirection:'column',gap:10}},
            ['HEAVY','HEAT','CLEAR','REFLECTIVE'].map(function(k){
              var pct2=Math.round((totals[k]/totalSig)*100);
              return e('div',{key:k},
                e('div',{style:row({justifyContent:'space-between',marginBottom:5})},
                  e('div',{style:row({gap:7})},
                    e('div',{style:{width:7,height:7,borderRadius:'50%',background:SHIFT_COLORS[k]}}),
                    e('span',{style:{fontSize:12,fontWeight:600,color:SHIFT_COLORS[k],fontFamily:"'DM Mono',monospace"}}),
                    e('span',{style:{fontSize:12,color:'#94a3b8'}},SHIFT_LABELS[k])
                  ),
                  e('span',{style:mn(11,SHIFT_COLORS[k],{fontWeight:600})},totals[k]+' ('+pct2+'%)')
                ),
                e('div',{style:{height:4,background:'#0f1520',borderRadius:2,overflow:'hidden'}},
                  e('div',{style:{height:'100%',width:pct2+'%',background:SHIFT_COLORS[k],borderRadius:2,transition:'width 1s ease'}})
                )
              );
            })
          )
    ),
    // Streak + activity summary
    e('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}},
      e('div',{style:{background:'#0a0e1a',border:'1px solid #151e30',borderRadius:12,padding:'14px 15px'}},
        e('div',{style:mn(7,'#2d3748',{marginBottom:8,letterSpacing:'0.15em'})},'CURRENT STREAK'),
        e('div',{style:{fontSize:28,fontWeight:700,color:'#f97316',fontFamily:"'DM Mono',monospace",lineHeight:1,marginBottom:4}},(state.streak||0)+'d'),
        e('div',{style:mn(9,'#2d3748')},'consecutive active days')
      ),
      e('div',{style:{background:'#0a0e1a',border:'1px solid #151e30',borderRadius:12,padding:'14px 15px'}},
        e('div',{style:mn(7,'#2d3748',{marginBottom:8,letterSpacing:'0.15em'})},'TOTAL ACTIVITY LOGS'),
        e('div',{style:{fontSize:28,fontWeight:700,color:'#4a9eff',fontFamily:"'DM Mono',monospace",lineHeight:1,marginBottom:4}},(state.activityLog||[]).length+''),
        e('div',{style:mn(9,'#2d3748')},'lifetime actions logged')
      )
    ),
    // Recent log
    e('div',{style:card},
      e('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 15px',borderBottom:'1px solid #0f1520',background:'#080b12'}},
        e('span',{style:mn(9,'#94a3b8',{fontWeight:700})},'RECENT TRANSMISSIONS')
      ),
      log.length===0
        ? e('div',{style:{padding:'24px',textAlign:'center',color:'#2d3748',fontFamily:"'DM Mono',monospace",fontSize:11}},'No transmissions yet.')
        : e('div',{style:{padding:'8px 14px 12px'}},
            log.slice(0,10).map(function(entry,i){
              return e('div',{key:entry.id,style:{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<Math.min(log.length,10)-1?'1px solid #0a0d14':'none'}},
                e('div',{style:{width:6,height:6,borderRadius:'50%',background:entry.action==='burn'?'#ef4444':'#4a9eff',flexShrink:0}}),
                e('div',{style:mn(9,'#475569',{flexShrink:0,minWidth:52})},entry.time),
                e('div',{style:{flex:1,minWidth:0}},
                  e('div',{style:{fontSize:11,color:entry.shiftColor||'#94a3b8',fontFamily:"'DM Mono',monospace",fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},entry.shiftLabel||'Ambient'),
                  e('div',{style:mn(8,'#2d3748')},entry.wordCount+' words · '+entry.action)
                ),
                e('span',{style:mn(10,'#4a9eff',{fontWeight:700,flexShrink:0})},'+'+entry.xp)
              );
            })
          )
    )
  );
}

// ─── SHELL ────────────────────────────────────────────────────────────────────
function Shell() {
  var engine  = useCoreEngine();
  var s1=useState('HOME'); var tab=s1[0],setTab=s1[1];
  var s2=useState(false);  var offline=s2[0],setOffline=s2[1];

  useEffect(function(){
    function goOff(){setOffline(true);}
    function goOn(){setOffline(false);}
    window.addEventListener('offline',goOff);
    window.addEventListener('online',goOn);
    setOffline(!navigator.onLine);
    return function(){window.removeEventListener('offline',goOff);window.removeEventListener('online',goOn);};
  },[]);

  var loaded=engine.loaded;
  var state=engine.state;
  var level=state?getLevelFromXP(state.totalXP||0):1;
  var tier=getTier(level);
  var xp=state?(state.totalXP||0):0;

  if(!loaded){
    return e('div',{style:{minHeight:'100vh',background:'#060910',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}},
      e('style',null,CSS),
      e('div',{style:{width:10,height:10,borderRadius:'50%',background:'#4a9eff',animation:'pulse 1s ease-in-out infinite'}}),
      e('div',{style:mn(9,'#2d3748',{letterSpacing:'0.2em',marginTop:8})},'CORE INITIALIZING')
    );
  }

  var pageContent;
  if(tab==='HOME')    pageContent=e(HomeTab,   {state:state,engine:engine,XPL:engine.XPL});
  else if(tab==='JOURNAL') pageContent=e(JournalTab,{state:state,engine:engine});
  else if(tab==='TRAIN')   pageContent=e(TrainTab,  {state:state,engine:engine});
  else                     pageContent=e(SignalsTab, {state:state,engine:engine});

  return e('div',{style:{minHeight:'100vh',background:'#060910',color:'#e2e8f0',fontFamily:"'DM Sans',sans-serif"}},
    e('style',null,CSS),
    e(EvolveModal,{tier:engine.evolution,onClose:engine.dismissEvolution}),
    cond(offline,
      e('div',{style:{background:'#0a0e1a',borderBottom:'1px solid #0f1520',padding:'5px 20px',textAlign:'center',fontFamily:"'DM Mono',monospace",fontSize:9,color:'#475569',letterSpacing:'0.12em'}},'OFFLINE — ALL DATA LOCAL')
    ),
    // Header
    e('header',{style:{position:'sticky',top:0,zIndex:100,background:'rgba(6,9,16,0.95)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderBottom:'1px solid #0f1520'}},
      e('div',{style:{maxWidth:680,margin:'0 auto',padding:'0 16px',height:50,display:'flex',alignItems:'center',justifyContent:'space-between'}},
        e('div',{style:row({gap:9})},
          e('div',{style:{width:24,height:24,background:'rgba(74,158,255,0.07)',border:'1px solid '+tier.color+'33',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center'}},
            e('div',{style:{width:6,height:6,borderRadius:'50%',background:tier.color,animation:'pulse 2s ease-in-out infinite'}})
          ),
          e('span',{style:mn(14,'#e2e8f0',{fontWeight:700,letterSpacing:'0.18em'})},'SILO')
        ),
        e('div',{style:row({gap:8})},
          e('div',{style:{padding:'3px 9px',background:'rgba(74,158,255,0.06)',border:'1px solid #1e3a5f',borderRadius:7}},
            e('span',{style:mn(10,'#4a9eff',{fontWeight:600})},xp+' XP')
          ),
          e('div',{style:{padding:'3px 9px',background:'#080b12',border:'1px solid #0f1520',borderRadius:7}},
            e('span',{style:mn(10,tier.color,{fontWeight:600})},'LV.'+level)
          ),
          e('button',{onClick:function(){if(window.confirm('Reset all Core data?'))engine.resetAll();},style:{width:28,height:28,background:'#080b12',border:'1px solid #0f1520',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',color:'#2d3748',fontSize:12}},'⚙')
        )
      )
    ),
    // Content
    e('div',{style:{maxWidth:680,margin:'0 auto',padding:'0 16px 100px'}},
      // Tab nav
      e('nav',{style:{display:'flex',gap:2,margin:'12px 0 18px',background:'#0a0e1a',border:'1px solid #151e30',borderRadius:12,padding:3}},
        TABS.map(function(tb){
          var on=tab===tb.id;
          return e('button',{key:tb.id,onClick:function(){setTab(tb.id);},style:{flex:1,padding:'8px 4px',background:on?'#0a1628':'transparent',border:'1px solid '+(on?'#1e3a5f':'transparent'),borderRadius:10,fontSize:8,fontWeight:on?700:400,color:on?'#4a9eff':'#2d3748',letterSpacing:'0.1em',fontFamily:"'DM Mono',monospace",display:'flex',flexDirection:'column',alignItems:'center',gap:2,cursor:'pointer',transition:'all 0.2s'}},
            e('span',{style:{fontSize:13}},tb.glyph),
            tb.label.toUpperCase()
          );
        })
      ),
      pageContent,
      e('div',{style:{marginTop:20,textAlign:'center',fontFamily:"'DM Mono',monospace",fontSize:8,color:'#151e30',letterSpacing:'0.12em'}},
        'SILO v9.0 · PRIVATE · ZERO-KNOWLEDGE · ALL DATA LOCAL'
      )
    ),
    // Fixed bottom nav
    e('nav',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:200,background:'rgba(6,9,16,0.96)',borderTop:'1px solid #0f1520',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'}},
      e('div',{style:{maxWidth:680,margin:'0 auto',display:'flex',padding:'8px 8px 12px'}},
        TABS.map(function(tb){
          var on=tab===tb.id;
          return e('button',{key:tb.id,onClick:function(){setTab(tb.id);},style:{flex:1,padding:'8px 4px 4px',background:'transparent',border:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:2,cursor:'pointer'}},
            e('span',{style:{fontSize:17,filter:on?'drop-shadow(0 0 6px #4a9eff)':'none',transition:'filter 0.2s'}},tb.glyph),
            e('span',{style:mn(8,on?'#4a9eff':'#2d3748',{fontWeight:on?700:400,transition:'color 0.2s'})},tb.label.toUpperCase()),
            cond(on,e('div',{style:{width:16,height:2,background:'#4a9eff',borderRadius:1,marginTop:1}}))
          );
        })
      )
    )
  );
}

export default function App() {
  return e(CoreProvider,null,e(Shell,null));
}
