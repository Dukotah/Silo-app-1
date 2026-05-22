/**
 * VentBox.js — Vent Canvas
 * ALL hooks at top, unconditionally.
 * Uses cond() for ALL conditional renders — no && patterns.
 */

import React from 'react';
import { parse } from './coreParser.js';
import { useCoreEngine } from './useCoreEngine.js';

var e        = React.createElement;
var useState = React.useState;
var useEffect= React.useEffect;
var useRef   = React.useRef;

function cond(test, el) { return test ? el : null; }

var TOAST_MS = 4000;

var VCSS =
  "@keyframes toastSlide{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}" +
  "@keyframes burnOut{0%{opacity:1;transform:scale(1);filter:blur(0)}80%{opacity:0.3;transform:scale(0.96);filter:blur(4px)}100%{opacity:0;transform:scale(0.94);filter:blur(8px)}}" +
  "@keyframes burnGlow{0%,100%{opacity:0}50%{opacity:1}}" +
  "@keyframes vpulse{0%,100%{opacity:1}50%{opacity:0.35}}";

export default function VentBox() {
  // ── ALL HOOKS UNCONDITIONALLY ────────────────────────────────────────────────
  var engine = useCoreEngine();
  var s1 = useState('');    var text    = s1[0], setText    = s1[1];
  var s2 = useState(null);  var toast   = s2[0], setToast   = s2[1];
  var s3 = useState(false); var burning = s3[0], setBurning = s3[1];
  var s4 = useState(false); var focused = s4[0], setFocused = s4[1];
  var timerRef   = useRef(null);
  var taRef      = useRef(null);

  useEffect(function() {
    return function() { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // ── HANDLERS ─────────────────────────────────────────────────────────────────
  function showToast(result) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(result);
    timerRef.current = setTimeout(function() { setToast(null); }, TOAST_MS);
  }

  function doCommit() {
    if (!text.trim() || burning) return;
    var r = parse(text, 'commit');
    engine.commitEntry(r);
    showToast(r);
    setText('');
    if (taRef.current) taRef.current.focus();
  }

  function doBurn() {
    if (!text.trim() || burning) return;
    var r = parse(text, 'burn');
    setBurning(true);
    setTimeout(function() {
      engine.commitEntry(r);
      showToast(r);
      setText('');
      setBurning(false);
      if (taRef.current) taRef.current.focus();
    }, 720);
  }

  // ── DERIVED ──────────────────────────────────────────────────────────────────
  var hasText  = text.trim().length > 0;
  var wc       = hasText ? text.trim().split(/\s+/).filter(function(w){return w.length>0;}).length : 0;
  var active   = hasText && !burning;

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return e('div', { style: { display:'flex', flexDirection:'column', gap:12 } },
    e('style', null, VCSS),

    // Header row
    e('div', { style: { display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:20 } },
      e('div', { style: { display:'flex', alignItems:'center', gap:8 } },
        e('div', { style: { width:6, height:6, borderRadius:'50%', background:'#4a9eff', animation:'vpulse 2s ease-in-out infinite' } }),
        e('span', { style: { fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.2em' } }, 'VENT CANVAS')
      ),
      e('span', { style: { fontFamily:"'DM Mono',monospace", fontSize:9, color:'#475569', letterSpacing:'0.1em', opacity: hasText ? 1 : 0, transition:'opacity 0.2s' } }, wc + ' WORDS')
    ),

    // Textarea wrapper
    e('div', {
      style: {
        position:'relative', borderRadius:14,
        border:'1px solid ' + (focused ? '#1e3a5f' : '#151e30'),
        background:'#0a0e1a',
        transition:'border-color 0.2s, box-shadow 0.2s',
        boxShadow: focused ? '0 0 0 1px rgba(30,58,95,0.5)' : 'none',
        animation: burning ? 'burnOut 0.72s ease-out forwards' : 'none',
      }
    },
      // Burn flash — absolute overlay, pointerEvents:none so it never blocks input
      e('div', {
        style: {
          position:'absolute', inset:0, zIndex:2, borderRadius:14,
          background:'linear-gradient(135deg,rgba(239,68,68,0.18),rgba(249,115,22,0.12))',
          pointerEvents:'none',
          opacity: burning ? 1 : 0,
          animation: burning ? 'burnGlow 0.72s ease-out forwards' : 'none',
        }
      }),
      e('textarea', {
        ref: taRef,
        value: text,
        onChange:  function(ev) { setText(ev.target.value); },
        onFocus:   function() { setFocused(true); },
        onBlur:    function() { setFocused(false); },
        onKeyDown: function(ev) {
          if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
            ev.preventDefault();
            doCommit();
          }
        },
        placeholder: 'Begin transmission. Write anything — no one is watching.\nThis space is entirely yours.',
        style: {
          position:'relative', zIndex:1,
          width:'100%', minHeight:220, padding:'18px 20px',
          background:'transparent', border:'none', resize:'none', outline:'none',
          fontSize:15, color:'#e2e8f0', fontFamily:"'DM Sans',sans-serif",
          lineHeight:1.8, boxSizing:'border-box', caretColor:'#4a9eff',
          display:'block',
        }
      }),
      e('div', { style: { padding:'6px 20px 12px', display:'flex', justifyContent:'flex-end', position:'relative', zIndex:1 } },
        e('span', { style: { fontFamily:"'DM Mono',monospace", fontSize:8, color:'#1e2a3a', letterSpacing:'0.1em' } }, text.length + ' CHARS')
      )
    ),

    // Action buttons
    e('div', { style: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 } },
      e('button', {
        onClick: doCommit,
        disabled: !active,
        style: {
          padding:'14px 16px',
          background: active ? '#0a1628' : '#070a10',
          border:'1px solid ' + (active ? '#1e3a5f' : '#0f1520'),
          borderRadius:12, cursor: active ? 'pointer' : 'default',
          display:'flex', flexDirection:'column', alignItems:'flex-start', gap:5,
          transition:'all 0.18s',
        }
      },
        e('span', { style: { fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:700, color: active ? '#4a9eff' : '#1a2535', letterSpacing:'0.15em' } }, '◆ COMMIT'),
        e('span', { style: { fontFamily:"'DM Mono',monospace", fontSize:8, color:'#1e2a3a', letterSpacing:'0.1em' } }, 'TO MATRIX LOG')
      ),
      e('button', {
        onClick: doBurn,
        disabled: !active,
        style: {
          padding:'14px 16px',
          background: active ? '#150806' : '#070a10',
          border:'1px solid ' + (active ? '#7c2d12' : '#0f1520'),
          borderRadius:12, cursor: active ? 'pointer' : 'default',
          display:'flex', flexDirection:'column', alignItems:'flex-start', gap:5,
          transition:'all 0.18s',
        }
      },
        e('span', { style: { fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:700, color: active ? '#ef4444' : '#1a2535', letterSpacing:'0.15em' } }, '◈ BURN & PURGE'),
        e('span', { style: { fontFamily:"'DM Mono',monospace", fontSize:8, color:'#1e2a3a', letterSpacing:'0.1em' } }, 'VAPORIZE · GRANT XP')
      )
    ),

    // Hint
    e('div', { style: { fontFamily:"'DM Mono',monospace", fontSize:8, color:'#151e30', letterSpacing:'0.08em', textAlign:'center' } },
      'CTRL+ENTER commits · All processing is local and private'
    ),

    // Toast — fixed position, won't block content below
    cond(toast !== null,
      e('div', {
        style: {
          position:'fixed', top:20, right:20, zIndex:900,
          background:'#0a0e1a',
          border:'1px solid ' + (toast ? toast.shiftColor || '#4a9eff' : '#4a9eff'),
          borderRadius:14, padding:'14px 18px', width:290,
          boxShadow:'0 0 28px ' + (toast ? toast.shiftColor || '#4a9eff' : '#4a9eff') + '44',
          animation:'toastSlide 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          fontFamily:"'DM Mono',monospace",
        }
      },
        e('div', { style: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 } },
          e('span', { style: { fontSize:10, fontWeight:700, color: toast ? toast.shiftColor || '#4a9eff' : '#4a9eff', letterSpacing:'0.15em' } },
            toast && toast.action === 'burn' ? '◈ PURGE COMPLETE' : '◆ MATRIX UPDATED'
          ),
          e('button', {
            onClick: function() { setToast(null); },
            style: { background:'transparent', border:'none', color:'#475569', cursor:'pointer', fontSize:16, lineHeight:1, padding:'0 2px' }
          }, '×')
        ),
        e('div', { style: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 } },
          [
            { label:'WORDS',    value: toast ? String(toast.wordCount) : '0' },
            { label:'SHIFT',    value: toast && toast.shiftLabel ? toast.shiftLabel.split(' / ')[0] : 'Ambient' },
            { label:'XP YIELD', value: toast ? '+' + toast.xp : '+0' },
          ].map(function(item) {
            return e('div', { key: item.label, style: { background:'rgba(255,255,255,0.04)', borderRadius:7, padding:'8px 9px' } },
              e('div', { style: { fontSize:7, color:'#475569', letterSpacing:'0.15em', marginBottom:4 } }, item.label),
              e('div', { style: { fontSize:13, fontWeight:700, color:'#e2e8f0' } }, item.value)
            );
          })
        ),
        // Timer bar
        e('div', { style: { height:2, background:'rgba(255,255,255,0.06)', borderRadius:1, overflow:'hidden' } },
          e('div', {
            style: {
              height:'100%', background: toast ? toast.shiftColor || '#4a9eff' : '#4a9eff',
              borderRadius:1, width:'100%',
              animation: 'toastSlide ' + (TOAST_MS/1000) + 's linear reverse forwards',
              transformOrigin:'right',
            }
          })
        )
      )
    )
  );
}
