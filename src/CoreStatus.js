/**
 * CoreStatus.js
 * Analytical monitoring dashboard.
 * Renders Core evolution, XP, streak, weekly landscape, and history log.
 * No JSX. No external dependencies beyond React.
 */

import React from 'react';
import { useCoreEngine, getTier, getLevelFromXP, getXPIntoLevel, TIERS } from './useCoreEngine.js';

var e = React.createElement;
var useState = React.useState;

var SHIFT_COLORS = {
  HEAVY:      '#f97316',
  HEAT:       '#ef4444',
  CLEAR:      '#22c55e',
  REFLECTIVE: '#4a9eff',
};

var SHIFT_LABELS = {
  HEAVY:      'Heavy',
  HEAT:       'Heat',
  CLEAR:      'Clear',
  REFLECTIVE: 'Reflect',
};

function mn(sz, cl, x) {
  return Object.assign({ fontFamily: "'DM Mono', monospace", fontSize: sz, color: cl, letterSpacing: '0.08em' }, x || {});
}

// ─── CORE NUCLEUS SVG ─────────────────────────────────────────────────────────
function CoreNucleus(props) {
  var level = props.level;
  var tier  = props.tier;
  var xpPct = props.xpPct; // 0-100

  var rings = Math.min(level, 5);
  var kids  = [];

  // Outer rings
  for (var ri = 0; ri < rings; ri++) {
    var r = 40 + ri * 14;
    var opacity = 0.06 + ri * 0.025;
    kids.push(e('circle', {
      key: 'ring' + ri,
      cx: '80', cy: '80', r: String(r),
      fill: 'none', stroke: tier.color, strokeWidth: '0.8', opacity: opacity,
      style: { animation: 'pulse ' + (2 + ri * 0.7) + 's ease-in-out ' + (ri * 0.4) + 's infinite' }
    }));
  }

  // Progress arc
  var arcR = 34;
  var arcCircumference = 2 * Math.PI * arcR;
  var arcOffset = arcCircumference * (1 - xpPct / 100);
  kids.push(e('circle', {
    key: 'track',
    cx: '80', cy: '80', r: String(arcR),
    fill: 'none', stroke: tier.color, strokeWidth: '2', opacity: 0.12,
  }));
  kids.push(e('circle', {
    key: 'arc',
    cx: '80', cy: '80', r: String(arcR),
    fill: 'none', stroke: tier.color, strokeWidth: '2.5', opacity: 0.9,
    strokeDasharray: String(arcCircumference),
    strokeDashoffset: String(arcOffset),
    strokeLinecap: 'round',
    style: { transform: 'rotate(-90deg)', transformOrigin: '80px 80px', transition: 'stroke-dashoffset 1s ease' }
  }));

  // Core body
  kids.push(e('circle', { key: 'body', cx: '80', cy: '80', r: '22', fill: tier.color, opacity: 0.1 }));
  kids.push(e('circle', { key: 'inner', cx: '80', cy: '80', r: '14', fill: tier.color, opacity: 0.25, style: { animation: 'pulse 2s ease-in-out infinite' } }));
  kids.push(e('circle', { key: 'core', cx: '80', cy: '80', r: '6', fill: tier.color, opacity: 1, style: { animation: 'pulse 1.4s ease-in-out infinite' } }));

  // Level text
  kids.push(e('text', {
    key: 'lvl',
    x: '80', y: '85',
    textAnchor: 'middle',
    fontFamily: "'DM Mono', monospace",
    fontSize: '11',
    fontWeight: '700',
    fill: tier.color,
    opacity: 0.9,
  }, String(level)));

  return e('svg', {
    viewBox: '0 0 160 160',
    xmlns: 'http://www.w3.org/2000/svg',
    style: {
      width: '100%', maxWidth: 160,
      filter: 'drop-shadow(0 0 ' + (12 + Math.min(level, 10) * 2) + 'px ' + tier.glow + ')',
      transition: 'filter 1s ease',
    }
  }, kids);
}

// ─── EVOLUTION MODAL ──────────────────────────────────────────────────────────
function EvolutionModal(props) {
  if (!props.tier) return null;
  var tier = props.tier;
  return e('div', {
    onClick: props.onClose,
    style: {
      position: 'fixed', inset: 0, zIndex: 800,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      animation: 'fadeIn 0.3s ease',
    }
  },
    e('div', {
      style: {
        textAlign: 'center', maxWidth: 380,
        animation: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }
    },
      e('div', { style: { fontSize: 11, letterSpacing: '0.3em', color: tier.color, fontFamily: "'DM Mono', monospace", marginBottom: 12 } }, '◆ EVOLUTION EVENT'),
      e('div', { style: { fontSize: 28, fontWeight: 700, color: '#e2e8f0', marginBottom: 10, lineHeight: 1.2 } }, tier.title),
      e('div', { style: { fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 28 } }, tier.desc),
      e('button', {
        onClick: props.onClose,
        style: {
          padding: '11px 28px', background: 'transparent',
          border: '1px solid ' + tier.color, borderRadius: 10,
          fontSize: 11, color: tier.color, fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.15em', cursor: 'pointer',
        }
      }, 'ACKNOWLEDGE')
    )
  );
}

// ─── WEEKLY LANDSCAPE GRID ────────────────────────────────────────────────────
function WeeklyGrid(props) {
  var weeklyShifts = props.weeklyShifts || {};

  // Build last 7 days
  var days = [];
  for (var di = 6; di >= 0; di--) {
    var d = new Date();
    d.setDate(d.getDate() - di);
    var key = d.toISOString().slice(0, 10);
    var label = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2).toUpperCase();
    var data = weeklyShifts[key] || { HEAVY: 0, HEAT: 0, CLEAR: 0, REFLECTIVE: 0 };
    var total = data.HEAVY + data.HEAT + data.CLEAR + data.REFLECTIVE;
    days.push({ key: key, label: label, data: data, total: total });
  }

  var maxTotal = Math.max.apply(null, days.map(function(d) { return d.total; })) || 1;

  return e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
    // Day columns
    e('div', { style: { display: 'flex', gap: 4, alignItems: 'flex-end', height: 52 } },
      days.map(function(day) {
        var barH = day.total > 0 ? Math.max((day.total / maxTotal) * 44, 4) : 0;
        // Dominant shift for color
        var dom = null; var domV = 0;
        ['HEAVY','HEAT','CLEAR','REFLECTIVE'].forEach(function(k) {
          if (day.data[k] > domV) { domV = day.data[k]; dom = k; }
        });
        var col = dom ? SHIFT_COLORS[dom] : '#151e30';
        return e('div', { key: day.key, style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'default' } },
          e('div', { style: { width: '100%', background: '#0a0e1a', borderRadius: 4, height: 44, display: 'flex', alignItems: 'flex-end', overflow: 'hidden', border: '1px solid #0f1520' } },
            day.total > 0 && e('div', { style: { width: '100%', height: barH + 'px', background: col, borderRadius: '3px 3px 0 0', opacity: 0.85, transition: 'height 0.8s ease' } })
          ),
          e('span', { style: mn(7, '#2d3748') }, day.label)
        );
      })
    ),
    // Shift legend
    e('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 } },
      ['HEAVY','HEAT','CLEAR','REFLECTIVE'].map(function(k) {
        return e('div', { key: k, style: { display: 'flex', alignItems: 'center', gap: 4 } },
          e('div', { style: { width: 6, height: 6, borderRadius: '50%', background: SHIFT_COLORS[k] } }),
          e('span', { style: mn(7, '#475569') }, SHIFT_LABELS[k])
        );
      })
    )
  );
}

// ─── HISTORY LOG ──────────────────────────────────────────────────────────────
function HistoryLog(props) {
  var log = props.log || [];
  var s1 = useState(false); var expanded = s1[0], setExpanded = s1[1];

  var visible = expanded ? log : log.slice(0, 5);

  if (log.length === 0) {
    return e('div', { style: { padding: '20px', textAlign: 'center', color: '#2d3748', fontFamily: "'DM Mono', monospace", fontSize: 11 } },
      'No transmissions logged yet.'
    );
  }

  return e('div', { style: { display: 'flex', flexDirection: 'column', gap: 0 } },
    visible.map(function(entry, i) {
      return e('div', {
        key: entry.id,
        style: {
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 0',
          borderBottom: i < visible.length - 1 ? '1px solid #0f1520' : 'none',
        }
      },
        // Action indicator
        e('div', { style: { width: 6, height: 6, borderRadius: '50%', background: entry.action === 'burn' ? '#ef4444' : '#4a9eff', flexShrink: 0 } }),
        // Date/time
        e('div', { style: { flexShrink: 0 } },
          e('div', { style: mn(9, '#475569') }, entry.time),
          e('div', { style: mn(8, '#2d3748') }, entry.date)
        ),
        // Shift
        e('div', { style: { flex: 1, minWidth: 0 } },
          e('div', { style: { fontSize: 10, color: entry.shiftColor || '#94a3b8', fontFamily: "'DM Mono', monospace", fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
            entry.shiftLabel || 'Ambient'
          ),
          e('div', { style: mn(8, '#2d3748') }, entry.wordCount + ' words')
        ),
        // XP
        e('span', { style: mn(10, '#4a9eff', { fontWeight: 700, flexShrink: 0 }) }, '+' + entry.xp)
      );
    }),
    log.length > 5 && e('button', {
      onClick: function() { setExpanded(function(x) { return !x; }); },
      style: { marginTop: 8, background: 'transparent', border: 'none', fontSize: 9, color: '#2d3748', fontFamily: "'DM Mono', monospace", cursor: 'pointer', letterSpacing: '0.1em' }
    }, expanded ? 'COLLAPSE' : 'SHOW ALL ' + log.length + ' ENTRIES')
  );
}

// ─── MAIN CORESTATUS ──────────────────────────────────────────────────────────
export default function CoreStatus() {
  // ALL hooks unconditionally at top
  var engine = useCoreEngine();

  var state = engine.state;
  var pendingEvolution = engine.pendingEvolution;

  // Loading
  if (!state) {
    return e('div', { style: { padding: 20, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#2d3748', textAlign: 'center' } }, 'Initializing...');
  }

  var totalXP  = state.totalXP || 0;
  var level    = getLevelFromXP(totalXP);
  var lvlXP    = getXPIntoLevel(totalXP);
  var xpPct    = Math.round((lvlXP / engine.XP_PER_LEVEL) * 100);
  var tier     = getTier(level);
  var streak   = state.streak || 0;
  var log      = state.log || [];

  // Total entries by action type
  var totalCommit = log.filter(function(e2) { return e2.action === 'commit'; }).length;
  var totalBurn   = log.filter(function(e2) { return e2.action === 'burn'; }).length;

  function card(children, extra) {
    return e('div', {
      style: Object.assign({
        background: '#0a0e1a', border: '1px solid #151e30',
        borderRadius: 14, overflow: 'hidden', marginBottom: 10,
      }, extra || {})
    }, children);
  }

  function cardHeader(label, right) {
    return e('div', {
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid #0f1520', background: '#080b12',
      }
    },
      e('span', { style: mn(9, '#94a3b8', { fontWeight: 700, letterSpacing: '0.15em' }) }, label),
      right || null
    );
  }

  return e('div', { style: { display: 'flex', flexDirection: 'column' } },
    e('style', null,
      "@keyframes fadeIn{from{opacity:0}to{opacity:1}}" +
      "@keyframes scaleIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}" +
      "@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}"
    ),

    // Evolution modal
    e(EvolutionModal, { tier: pendingEvolution, onClose: engine.dismissEvolution }),

    // ── CORE MONITOR ──────────────────────────────────────────────────────────
    card(
      e('div', null,
        cardHeader('CORE MONITOR', e('span', { style: mn(8, tier.color, { fontWeight: 700 }) }, 'LV.' + level)),
        e('div', { style: { padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 16 } },
          // Nucleus visualization
          e('div', { style: { width: 100, flexShrink: 0 } },
            e(CoreNucleus, { level: level, tier: tier, xpPct: xpPct })
          ),
          // Info panel
          e('div', { style: { flex: 1, minWidth: 0 } },
            e('div', { style: { fontSize: 15, fontWeight: 700, color: tier.color, marginBottom: 4, fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em' } }, tier.title),
            e('div', { style: { fontSize: 11, color: '#475569', marginBottom: 14, lineHeight: 1.5 } }, tier.desc),
            // XP bar
            e('div', { style: { marginBottom: 4 } },
              e('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 5 } },
                e('span', { style: mn(8, '#2d3748') }, 'XP PROGRESS'),
                e('span', { style: mn(8, tier.color) }, lvlXP + ' / ' + engine.XP_PER_LEVEL)
              ),
              e('div', { style: { height: 4, background: '#0f1520', borderRadius: 2, overflow: 'hidden' } },
                e('div', { style: { height: '100%', width: xpPct + '%', background: tier.color, borderRadius: 2, transition: 'width 1s ease', boxShadow: '0 0 8px ' + tier.glow } })
              )
            ),
            e('div', { style: mn(8, '#2d3748', { marginTop: 3 }) }, (engine.XP_PER_LEVEL - lvlXP) + ' XP to Level ' + (level + 1))
          )
        )
      )
    ),

    // ── TELEMETRY GRID ────────────────────────────────────────────────────────
    card(
      e('div', null,
        cardHeader('TELEMETRY'),
        e('div', { style: { padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 } },
          [
            { label: 'STREAK',   value: streak + 'd',          color: '#f97316' },
            { label: 'COMMITTED',value: String(totalCommit),   color: '#4a9eff' },
            { label: 'PURGED',   value: String(totalBurn),     color: '#ef4444' },
          ].map(function(item) {
            return e('div', { key: item.label, style: { background: '#080b12', border: '1px solid #0f1520', borderRadius: 10, padding: '10px 12px' } },
              e('div', { style: mn(7, '#2d3748', { marginBottom: 5 }) }, item.label),
              e('div', { style: { fontSize: 18, fontWeight: 700, color: item.color, fontFamily: "'DM Mono', monospace", lineHeight: 1 } }, item.value)
            );
          })
        )
      )
    ),

    // ── EVOLUTION TIER TRACK ──────────────────────────────────────────────────
    card(
      e('div', null,
        cardHeader('EVOLUTION TRACK'),
        e('div', { style: { padding: '12px 14px', display: 'flex', gap: 6 } },
          TIERS.map(function(t, i) {
            var reached  = level >= t.minLevel;
            var current  = tier.title === t.title;
            return e('div', { key: i, style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 } },
              e('div', { style: {
                width: '100%', height: 36,
                background: reached ? (current ? t.color + '22' : 'rgba(255,255,255,0.04)') : '#080b12',
                border: '1px solid ' + (reached ? t.color : '#0f1520'),
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: current ? '0 0 12px ' + t.glow : 'none',
                transition: 'all 0.4s',
              } },
                e('div', { style: { width: 8, height: 8, borderRadius: '50%', background: reached ? t.color : '#151e30', opacity: current ? 1 : 0.6 } })
              ),
              e('div', { style: mn(6, reached ? t.color : '#2d3748', { textAlign: 'center', lineHeight: 1.3, letterSpacing: '0.04em' }) },
                t.title.split(' ')[0].toUpperCase()
              )
            );
          })
        )
      )
    ),

    // ── WEEKLY LANDSCAPE ──────────────────────────────────────────────────────
    card(
      e('div', null,
        cardHeader('WEEKLY LANDSCAPE'),
        e('div', { style: { padding: '12px 14px' } },
          e(WeeklyGrid, { weeklyShifts: state.weeklyShifts })
        )
      )
    ),

    // ── HISTORY LOG ───────────────────────────────────────────────────────────
    card(
      e('div', null,
        cardHeader('TRANSMISSION LOG', e('span', { style: mn(8, '#2d3748') }, log.length + ' TOTAL')),
        e('div', { style: { padding: '8px 14px 12px' } },
          e(HistoryLog, { log: log })
        )
      )
    ),

    // Reset
    e('button', {
      onClick: function() {
        if (window.confirm('Reset all Core data? This cannot be undone.')) engine.resetAll();
      },
      style: {
        marginTop: 4, padding: '8px 14px',
        background: 'transparent', border: '1px solid #0f1520',
        borderRadius: 8, fontSize: 8, color: '#1e2a3a',
        fontFamily: "'DM Mono', monospace", cursor: 'pointer',
        letterSpacing: '0.1em', width: '100%',
      }
    }, 'RESET CORE DATA')
  );
}
