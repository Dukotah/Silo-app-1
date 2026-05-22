/**
 * VentBox.js
 * Main vent workspace. Commit or Burn input text.
 * No JSX. No external dependencies beyond React.
 */

import React from 'react';
import { parse } from './coreParser.js';
import { useCoreEngine } from './useCoreEngine.js';

var e = React.createElement;
var useState = React.useState;
var useEffect = React.useEffect;
var useRef = React.useRef;

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast(props) {
  // No hooks — pure render
  if (!props.toast) return null;
  var r = props.toast;
  return e('div', {
    style: {
      position: 'fixed', top: 20, right: 20, zIndex: 900,
      background: '#0a0e1a', border: '1px solid ' + (r.shiftColor || '#4a9eff'),
      borderRadius: 14, padding: '14px 18px', maxWidth: 320,
      boxShadow: '0 0 32px ' + (r.shiftColor || '#4a9eff') + '44',
      animation: 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      fontFamily: "'DM Mono', monospace",
    }
  },
    e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } },
      e('span', { style: { fontSize: 11, fontWeight: 700, color: r.shiftColor || '#4a9eff', letterSpacing: '0.15em' } },
        r.action === 'burn' ? '◈ PURGE COMPLETE' : '◆ MATRIX LOG UPDATED'
      ),
      e('button', {
        onClick: props.onClose,
        style: { background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, lineHeight: 1 }
      }, '×')
    ),
    e('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 } },
      [
        { label: 'WORDS', value: r.wordCount },
        { label: 'SHIFT', value: r.shiftLabel ? r.shiftLabel.split(' / ')[0] : 'Ambient' },
        { label: 'XP YIELD', value: '+' + r.xp },
      ].map(function(item) {
        return e('div', { key: item.label, style: { background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' } },
          e('div', { style: { fontSize: 8, color: '#475569', letterSpacing: '0.15em', marginBottom: 4 } }, item.label),
          e('div', { style: { fontSize: 13, fontWeight: 700, color: '#e2e8f0', fontFamily: "'DM Mono', monospace" } }, String(item.value))
        );
      })
    ),
    e('div', { style: { height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1 } },
      e('div', { style: { height: '100%', width: '100%', background: r.shiftColor || '#4a9eff', borderRadius: 1, animation: 'toastBar ' + (props.duration / 1000) + 's linear forwards' } })
    )
  );
}

// ─── MAIN VENTBOX ─────────────────────────────────────────────────────────────
export default function VentBox() {
  // ALL hooks unconditionally at top
  var engine = useCoreEngine();

  var s1 = useState('');    var text = s1[0], setText = s1[1];
  var s2 = useState(null);  var toast = s2[0], setToast = s2[1];
  var s3 = useState(false); var burning = s3[0], setBurning = s3[1];
  var s4 = useState(false); var burnDone = s4[0], setBurnDone = s4[1];
  var s5 = useState(false); var focused = s5[0], setFocused = s5[1];

  var toastTimer = useRef(null);
  var textareaRef = useRef(null);
  var TOAST_DURATION = 4000;

  useEffect(function() {
    return function() {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(result) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(result);
    toastTimer.current = setTimeout(function() { setToast(null); }, TOAST_DURATION);
  }

  function handleCommit() {
    if (!text.trim()) return;
    var result = parse(text, 'commit');
    engine.commitEntry(result);
    showToast(result);
    setText('');
    if (textareaRef.current) textareaRef.current.focus();
  }

  function handleBurn() {
    if (!text.trim()) return;
    var result = parse(text, 'burn');
    setBurning(true);
    setTimeout(function() {
      engine.commitEntry(result);
      showToast(result);
      setText('');
      setBurning(false);
      setBurnDone(true);
      setTimeout(function() { setBurnDone(false); }, 600);
      if (textareaRef.current) textareaRef.current.focus();
    }, 700);
  }

  var hasText = text.trim().length > 0;
  var wordCount = hasText ? text.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length : 0;

  return e('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
    e('style', null,
      "@keyframes toastIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}" +
      "@keyframes toastBar{from{transform:scaleX(1);transform-origin:left}to{transform:scaleX(0);transform-origin:left}}" +
      "@keyframes burnOut{0%{opacity:1;transform:scale(1);filter:blur(0px)}100%{opacity:0;transform:scale(0.94);filter:blur(6px)}}" +
      "@keyframes burnFlash{0%{opacity:0}40%{opacity:1}100%{opacity:0}}" +
      "@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}"
    ),

    // Section label
    e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      e('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
        e('div', { style: { width: 6, height: 6, borderRadius: '50%', background: '#4a9eff', animation: 'pulse 2s ease-in-out infinite' } }),
        e('span', { style: { fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.2em' } }, 'VENT CANVAS')
      ),
      hasText && e('span', { style: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#475569', letterSpacing: '0.1em' } }, wordCount + ' WORDS')
    ),

    // Text input area
    e('div', {
      style: {
        position: 'relative',
        borderRadius: 14,
        border: '1px solid ' + (focused ? '#1e3a5f' : '#151e30'),
        background: '#0a0e1a',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: focused ? '0 0 0 1px #1e3a5f44' : 'none',
        overflow: 'hidden',
        animation: burning ? 'burnOut 0.7s ease-out forwards' : 'none',
      }
    },
      // Burn flash overlay
      burning && e('div', {
        style: {
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'linear-gradient(135deg, #ef444422, #f9731622)',
          animation: 'burnFlash 0.7s ease-out forwards',
          pointerEvents: 'none', borderRadius: 14,
        }
      }),
      e('textarea', {
        ref: textareaRef,
        value: text,
        onChange: function(ev) { setText(ev.target.value); },
        onFocus: function() { setFocused(true); },
        onBlur:  function() { setFocused(false); },
        onKeyDown: function(ev) {
          // Ctrl/Cmd + Enter = commit
          if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); handleCommit(); }
        },
        placeholder: 'Begin transmission. Write anything — no one is watching.\nThis space is yours alone.',
        style: {
          width: '100%', minHeight: 200, padding: '18px 20px',
          background: 'transparent', border: 'none', resize: 'none', outline: 'none',
          fontSize: 15, color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.75, boxSizing: 'border-box',
          caretColor: '#4a9eff',
        }
      }),
      // Character count footer
      e('div', { style: { padding: '8px 20px 14px', display: 'flex', justifyContent: 'flex-end' } },
        e('span', { style: { fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#2d3748', letterSpacing: '0.1em' } },
          text.length + ' CHARS'
        )
      )
    ),

    // Action buttons
    e('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } },
      // Commit button
      e('button', {
        onClick: handleCommit,
        disabled: !hasText || burning,
        style: {
          padding: '13px 16px',
          background: hasText && !burning ? '#0a1628' : '#080b12',
          border: '1px solid ' + (hasText && !burning ? '#1e3a5f' : '#0f1520'),
          borderRadius: 12,
          cursor: hasText && !burning ? 'pointer' : 'default',
          transition: 'all 0.2s',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
        }
      },
        e('span', { style: { fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: hasText && !burning ? '#4a9eff' : '#1e3a5f', letterSpacing: '0.15em' } }, '◆ COMMIT'),
        e('span', { style: { fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#2d3748', letterSpacing: '0.08em' } }, 'TO MATRIX LOG')
      ),
      // Burn button
      e('button', {
        onClick: handleBurn,
        disabled: !hasText || burning,
        style: {
          padding: '13px 16px',
          background: hasText && !burning ? '#150806' : '#080b12',
          border: '1px solid ' + (hasText && !burning ? '#7c2d12' : '#0f1520'),
          borderRadius: 12,
          cursor: hasText && !burning ? 'pointer' : 'default',
          transition: 'all 0.2s',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
        }
      },
        e('span', { style: { fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: hasText && !burning ? '#ef4444' : '#1e3a5f', letterSpacing: '0.15em' } }, '◈ BURN & PURGE'),
        e('span', { style: { fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#2d3748', letterSpacing: '0.08em' } }, 'VAPORIZE · GRANT XP')
      )
    ),

    // Hint
    e('div', { style: { fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#1e2a3a', letterSpacing: '0.08em', textAlign: 'center' } },
      'CTRL+ENTER to commit · All entries are processed locally and never transmitted'
    ),

    // Toast
    e(Toast, { toast: toast, onClose: function() { setToast(null); }, duration: TOAST_DURATION })
  );
}
