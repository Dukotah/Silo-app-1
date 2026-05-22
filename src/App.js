/**
 * App.js
 * Root application shell.
 * ALL hooks at the very top — unconditionally — before any conditional render.
 * No JSX. No external imports beyond React and our own modules.
 */

import React from 'react';
import { CoreProvider, useCoreEngine, getTier, getLevelFromXP } from './useCoreEngine.js';
import VentBox from './VentBox.js';
import CoreStatus from './CoreStatus.js';

var e         = React.createElement;
var useState  = React.useState;
var useEffect = React.useEffect;

// ─── CSS ──────────────────────────────────────────────────────────────────────
var CSS =
  "@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600;700&display=swap');" +
  "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}" +
  "html,body,#root{height:100%;background:#060910}" +
  "body{overscroll-behavior:none;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}" +
  "::-webkit-scrollbar{width:3px}" +
  "::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}" +
  "textarea,input{outline:none}" +
  "button{cursor:pointer;border:none;background:none;padding:0}" +
  "@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}" +
  "@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}";

// ─── INNER SHELL (needs engine context, so wrapped inside CoreProvider) ────────
function Shell() {
  // ALL hooks unconditionally at the very top
  var engine   = useCoreEngine();
  var s1       = useState(false); var mobilePanel = s1[0], setMobilePanel = s1[1];
  var s2       = useState(null);  var offline = s2[0];

  useEffect(function() {
    function goOff() { s2[1](true); }
    function goOn()  { s2[1](false); }
    window.addEventListener('offline', goOff);
    window.addEventListener('online',  goOn);
    s2[1](!navigator.onLine);
    return function() {
      window.removeEventListener('offline', goOff);
      window.removeEventListener('online',  goOn);
    };
  }, []);

  // Pure variable derivations — no hooks below this line
  var state  = engine.state;
  var loaded = engine.loaded;

  var level  = state ? getLevelFromXP(state.totalXP || 0) : 1;
  var tier   = state ? getTier(level) : { title: 'Initializing...', color: '#475569', glow: 'rgba(71,85,105,0.5)' };
  var xp     = state ? (state.totalXP || 0) : 0;
  var streak = state ? (state.streak || 0) : 0;

  // Loading gate — no hooks after this point
  if (!loaded) {
    return e('div', {
      style: {
        minHeight: '100vh', background: '#060910',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }
    },
      e('style', null, CSS),
      e('div', { style: { width: 10, height: 10, borderRadius: '50%', background: '#4a9eff', animation: 'pulse 1s ease-in-out infinite' } }),
      e('div', { style: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#2d3748', letterSpacing: '0.2em' } }, 'CORE INITIALIZING')
    );
  }

  return e('div', { style: { minHeight: '100vh', background: '#060910', color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" } },
    e('style', null, CSS),

    // Offline banner
    offline && e('div', {
      style: {
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        background: '#0a0e1a', borderBottom: '1px solid #151e30',
        padding: '6px 20px', textAlign: 'center',
        fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#475569', letterSpacing: '0.12em',
      }
    }, 'OFFLINE MODE — ALL DATA LOCAL'),

    // ── HEADER ────────────────────────────────────────────────────────────────
    e('header', {
      style: {
        position: 'sticky', top: 0, zIndex: 200,
        background: 'rgba(6,9,16,0.92)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #0f1520',
        padding: '0 24px',
      }
    },
      e('div', { style: { maxWidth: 1100, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
        // Logo
        e('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
          e('div', {
            style: {
              width: 28, height: 28,
              background: 'rgba(74,158,255,0.08)',
              border: '1px solid ' + tier.color + '44',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 8px ' + tier.glow,
            }
          },
            e('div', { style: { width: 8, height: 8, borderRadius: '50%', background: tier.color, animation: 'pulse 2s ease-in-out infinite' } })
          ),
          e('div', null,
            e('div', { style: { fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: '#e2e8f0' } }, 'SILO'),
            e('div', { style: { fontFamily: "'DM Mono', monospace", fontSize: 8, color: tier.color, letterSpacing: '0.15em' } }, tier.title.toUpperCase())
          )
        ),
        // Header stats
        e('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
          e('div', { style: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(74,158,255,0.06)', border: '1px solid #1e3a5f', borderRadius: 8 } },
            e('span', { style: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4a9eff', fontWeight: 600 } }, String(xp) + ' XP')
          ),
          e('div', { style: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#080b12', border: '1px solid #0f1520', borderRadius: 8 } },
            e('span', { style: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#f97316', fontWeight: 600 } }, 'LV.' + level)
          ),
          // Mobile: toggle panel
          e('button', {
            onClick: function() { setMobilePanel(function(v) { return !v; }); },
            style: {
              display: 'none', // hidden on desktop via media query workaround below
              width: 32, height: 32, background: '#080b12',
              border: '1px solid #0f1520', borderRadius: 8,
              alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#475569',
              // We use inline id to target with CSS
            },
            id: 'mobile-toggle',
          }, mobilePanel ? '×' : '≡')
        )
      )
    ),

    // ── MAIN LAYOUT ───────────────────────────────────────────────────────────
    e('main', { style: { maxWidth: 1100, margin: '0 auto', padding: '24px 24px 80px', display: 'flex', gap: 20, alignItems: 'flex-start' } },

      // Left: Vent Canvas (takes 60% on desktop)
      e('div', { style: { flex: '1 1 0', minWidth: 0 } },
        // Section header
        e('div', { style: { marginBottom: 16, animation: 'fadeUp 0.4s ease' } },
          e('div', { style: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2d3748', letterSpacing: '0.2em', marginBottom: 6 } }, 'TRANSMISSION INTERFACE'),
          e('h1', { style: { fontSize: 22, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2, marginBottom: 4 } }, 'Vent. Process. Release.'),
          e('p', { style: { fontSize: 13, color: '#475569', lineHeight: 1.6 } }, 'Write freely. Commit to the log or burn it entirely. Either way, the Core evolves.')
        ),
        e(VentBox, null)
      ),

      // Right: Core Status Panel (takes 38% on desktop)
      e('div', { id: 'status-panel', style: { width: 320, flexShrink: 0, animation: 'fadeUp 0.5s ease' } },
        e('div', { style: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2d3748', letterSpacing: '0.2em', marginBottom: 12 } }, 'CORE STATUS'),
        e(CoreStatus, null)
      )
    ),

    // ── RESPONSIVE STYLES ─────────────────────────────────────────────────────
    e('style', null,
      "#mobile-toggle{display:none}" +
      "@media(max-width:720px){" +
        "main{flex-direction:column!important;padding:16px 16px 100px!important}" +
        "#status-panel{width:100%!important}" +
        "#mobile-toggle{display:flex!important}" +
      "}"
    )
  );
}

// ─── ROOT (wraps Shell in CoreProvider) ───────────────────────────────────────
export default function App() {
  return e(CoreProvider, null, e(Shell, null));
}
