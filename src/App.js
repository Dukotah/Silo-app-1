/**
 * App.js — Root shell
 * ALL hooks unconditionally at top of Shell.
 * cond() for all conditional renders.
 * No onboarding — drops straight into workspace.
 */

import React from 'react';
import { CoreProvider, useCoreEngine, getTier, getLevelFromXP } from './useCoreEngine.js';
import VentBox from './VentBox.js';
import CoreStatus from './CoreStatus.js';

var e        = React.createElement;
var useState = React.useState;
var useEffect= React.useEffect;

function cond(test, el) { return test ? el : null; }

var ACSS =
  "@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600;700&display=swap');" +
  "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
  "html,body,#root{height:100%;background:#060910}" +
  "body{overscroll-behavior:none;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}" +
  "::-webkit-scrollbar{width:3px}" +
  "::-webkit-scrollbar-thumb{background:#1a2d4a;border-radius:2px}" +
  "textarea,input{outline:none}" +
  "button{cursor:pointer;border:none;background:none;padding:0}" +
  "@keyframes afadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}" +
  "@keyframes apulse{0%,100%{opacity:1}50%{opacity:0.3}}" +
  "@media(max-width:720px){.layout{flex-direction:column!important}.sidebar{width:100%!important}}";

// ─── SHELL (inside CoreProvider so useCoreEngine works) ───────────────────────
function Shell() {
  // ALL hooks unconditionally — no exceptions
  var engine  = useCoreEngine();
  var s1 = useState(false); var offline = s1[0], setOffline = s1[1];

  useEffect(function() {
    function goOff() { setOffline(true); }
    function goOn()  { setOffline(false); }
    window.addEventListener('offline', goOff);
    window.addEventListener('online',  goOn);
    setOffline(!navigator.onLine);
    return function() {
      window.removeEventListener('offline', goOff);
      window.removeEventListener('online',  goOn);
    };
  }, []);

  // Pure derivation — no hooks below here
  var loaded = engine.loaded;
  var state  = engine.state;
  var level  = state ? getLevelFromXP(state.totalXP || 0) : 1;
  var tier   = getTier(level);
  var xp     = state ? (state.totalXP || 0) : 0;

  // Loading state
  if (!loaded) {
    return e('div', { style:{ minHeight:'100vh', background:'#060910', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 } },
      e('style', null, ACSS),
      e('div', { style:{ width:10, height:10, borderRadius:'50%', background:'#4a9eff', animation:'apulse 1s ease-in-out infinite' } }),
      e('div', { style:{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'#2d3748', letterSpacing:'0.2em', marginTop:8 } }, 'CORE INITIALIZING')
    );
  }

  return e('div', { style:{ minHeight:'100vh', background:'#060910', color:'#e2e8f0', fontFamily:"'DM Sans',sans-serif" } },
    e('style', null, ACSS),

    // Offline banner
    cond(offline,
      e('div', { style:{ background:'#0a0e1a', borderBottom:'1px solid #0f1520', padding:'6px 20px', textAlign:'center', fontFamily:"'DM Mono',monospace", fontSize:9, color:'#475569', letterSpacing:'0.12em' } },
        'OFFLINE MODE — ALL DATA LOCAL'
      )
    ),

    // ── HEADER ────────────────────────────────────────────────────────────────
    e('header', {
      style:{
        position:'sticky', top:0, zIndex:100,
        background:'rgba(6,9,16,0.94)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
        borderBottom:'1px solid #0f1520',
      }
    },
      e('div', { style:{ maxWidth:1100, margin:'0 auto', padding:'0 24px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between' } },
        // Logo + title
        e('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
          e('div', { style:{ width:26, height:26, background:'rgba(74,158,255,0.07)', border:'1px solid '+tier.color+'33', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 8px '+tier.glow } },
            e('div', { style:{ width:7, height:7, borderRadius:'50%', background:tier.color, animation:'apulse 2s ease-in-out infinite' } })
          ),
          e('div', null,
            e('div', { style:{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700, letterSpacing:'0.2em', color:'#e2e8f0', lineHeight:1 } }, 'SILO'),
            e('div', { style:{ fontFamily:"'DM Mono',monospace", fontSize:8, color:tier.color, letterSpacing:'0.12em', marginTop:2 } }, tier.title.toUpperCase())
          )
        ),
        // Stats
        e('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
          e('div', { style:{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background:'rgba(74,158,255,0.06)', border:'1px solid #1e3a5f', borderRadius:8 } },
            e('span', { style:{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'#4a9eff', fontWeight:600 } }, xp+' XP')
          ),
          e('div', { style:{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background:'#080b12', border:'1px solid #0f1520', borderRadius:8 } },
            e('span', { style:{ fontFamily:"'DM Mono',monospace", fontSize:10, color:tier.color, fontWeight:600 } }, 'LV.'+level)
          )
        )
      )
    ),

    // ── MAIN LAYOUT ───────────────────────────────────────────────────────────
    e('div', {
      className:'layout',
      style:{ maxWidth:1100, margin:'0 auto', padding:'28px 24px 80px', display:'flex', gap:22, alignItems:'flex-start' }
    },
      // Left: Vent Canvas
      e('div', { style:{ flex:'1 1 0', minWidth:0, animation:'afadeUp 0.4s ease' } },
        e('div', { style:{ marginBottom:20 } },
          e('div', { style:{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'#2d3748', letterSpacing:'0.2em', marginBottom:6 } }, 'TRANSMISSION INTERFACE'),
          e('h1', { style:{ fontSize:22, fontWeight:700, color:'#e2e8f0', lineHeight:1.25, marginBottom:6 } }, 'Vent. Process. Release.'),
          e('p',  { style:{ fontSize:13, color:'#475569', lineHeight:1.65 } }, 'Write freely. Commit to the log or burn it. Either way, the Core evolves.')
        ),
        e(VentBox, null)
      ),

      // Right: Status Panel
      e('div', {
        className:'sidebar',
        style:{ width:310, flexShrink:0, animation:'afadeUp 0.5s ease' }
      },
        e('div', { style:{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'#2d3748', letterSpacing:'0.2em', marginBottom:10 } }, 'CORE STATUS'),
        e(CoreStatus, null)
      )
    )
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  return e(CoreProvider, null, e(Shell, null));
}
