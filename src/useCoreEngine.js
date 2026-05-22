/**
 * useCoreEngine.js
 * Unified React context + custom hook for all app state.
 * No Zustand needed — pure React context with localStorage persistence.
 * All hooks called unconditionally at the top of the provider component.
 */

import React from 'react';

var useState   = React.useState;
var useEffect  = React.useEffect;
var useRef     = React.useRef;
var createContext = React.createContext;
var useContext = React.useContext;

var STORAGE_KEY = 'silo_core_v1';

// ─── EVOLUTION TIERS ──────────────────────────────────────────────────────────
export var TIERS = [
  { minLevel: 1,  maxLevel: 4,  title: 'Singularity Core',    desc: 'Dormant. Awaiting first signal.',                   color: '#475569', glow: 'rgba(71,85,105,0.6)'    },
  { minLevel: 5,  maxLevel: 9,  title: 'Resonant Matrix',     desc: 'Oscillating. Patterns emerging from the noise.',    color: '#4a9eff', glow: 'rgba(74,158,255,0.6)'   },
  { minLevel: 10, maxLevel: 14, title: 'Kinetic Network',     desc: 'Expanding. Signal threads multiplying outward.',    color: '#22c55e', glow: 'rgba(34,197,94,0.6)'    },
  { minLevel: 15, maxLevel: 19, title: 'Cascade Engine',      desc: 'Accelerating. The architecture self-modifies.',     color: '#e879a0', glow: 'rgba(232,121,160,0.6)'  },
  { minLevel: 20, maxLevel: 999,title: 'Monolithic Overlord', desc: 'Fully autonomous. The system has become aware.',    color: '#f59e0b', glow: 'rgba(245,158,11,0.65)'  },
];

export function getTier(level) {
  for (var i = TIERS.length - 1; i >= 0; i--) {
    if (level >= TIERS[i].minLevel) return TIERS[i];
  }
  return TIERS[0];
}

var XP_PER_LEVEL = 200; // XP needed per level

export function getLevelFromXP(totalXP) {
  return Math.max(1, Math.floor(totalXP / XP_PER_LEVEL) + 1);
}

export function getXPIntoLevel(totalXP) {
  return totalXP % XP_PER_LEVEL;
}

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────
function defaultState() {
  return {
    totalXP: 0,
    log: [],          // Array of ParseResult objects (summary only, no raw text)
    streak: 0,
    lastActiveDate: null,
    weeklyShifts: {}, // { 'YYYY-MM-DD': { HEAVY:n, HEAT:n, CLEAR:n, REFLECTIVE:n } }
  };
}

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e) {}
}

function hydrate() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    var parsed = JSON.parse(raw);
    // Merge with defaults to handle schema additions
    return Object.assign({}, defaultState(), parsed);
  } catch(e) {
    return defaultState();
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
var CoreContext = createContext(null);

export function CoreProvider(props) {
  // ALL hooks unconditionally at top
  var s1 = useState(null);   var state = s1[0], setState = s1[1];
  var s2 = useState(false);  var loaded = s2[0], setLoaded = s2[1];
  var s3 = useState(null);   var pendingEvolution = s3[0], setPendingEvolution = s3[1];

  // Load from localStorage on mount
  useEffect(function() {
    var saved = hydrate();

    // Update streak
    var today = todayKey();
    if (saved.lastActiveDate !== today) {
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var yKey = yesterday.toISOString().slice(0, 10);
      if (saved.lastActiveDate === yKey) {
        saved.streak = (saved.streak || 0) + 1;
      } else if (saved.lastActiveDate !== today) {
        // Gap of more than 1 day — reset streak but keep at 1 for today
        saved.streak = saved.lastActiveDate ? 0 : 0;
      }
      saved.lastActiveDate = today;
    }

    setState(saved);
    setLoaded(true);
  }, []);

  // Persist whenever state changes
  useEffect(function() {
    if (state) persist(state);
  }, [state]);

  // Actions
  function commitEntry(parseResult) {
    setState(function(prev) {
      if (!prev) return prev;
      var oldLevel = getLevelFromXP(prev.totalXP);
      var newTotalXP = prev.totalXP + parseResult.xp;
      var newLevel = getLevelFromXP(newTotalXP);

      // Check for tier evolution
      var oldTier = getTier(oldLevel);
      var newTier = getTier(newLevel);
      if (newTier.title !== oldTier.title) {
        setTimeout(function() { setPendingEvolution(newTier); }, 200);
      }

      // Update weekly shifts
      var today = todayKey();
      var weekly = Object.assign({}, prev.weeklyShifts);
      if (!weekly[today]) weekly[today] = { HEAVY: 0, HEAT: 0, CLEAR: 0, REFLECTIVE: 0 };
      if (parseResult.primaryShift) {
        weekly[today][parseResult.primaryShift] = (weekly[today][parseResult.primaryShift] || 0) + 1;
      }

      // Prune weekly data to last 14 days
      var cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 14);
      Object.keys(weekly).forEach(function(k) {
        if (new Date(k) < cutoff) delete weekly[k];
      });

      // Keep log to last 50 entries, store only summary (no raw text)
      var newLog = [{
        id: Date.now(),
        date: today,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        wordCount: parseResult.wordCount,
        charCount: parseResult.charCount,
        primaryShift: parseResult.primaryShift,
        shiftLabel: parseResult.shiftLabel,
        shiftColor: parseResult.shiftColor,
        xp: parseResult.xp,
        action: parseResult.action,
      }].concat(prev.log.slice(0, 49));

      return Object.assign({}, prev, {
        totalXP: newTotalXP,
        log: newLog,
        weeklyShifts: weekly,
        lastActiveDate: today,
        streak: Math.max(prev.streak || 0, 1),
      });
    });
  }

  function dismissEvolution() {
    setPendingEvolution(null);
  }

  function resetAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    setState(defaultState());
  }

  var value = {
    state: state,
    loaded: loaded,
    pendingEvolution: pendingEvolution,
    commitEntry: commitEntry,
    dismissEvolution: dismissEvolution,
    resetAll: resetAll,
    XP_PER_LEVEL: XP_PER_LEVEL,
  };

  return React.createElement(CoreContext.Provider, { value: value }, props.children);
}

export function useCoreEngine() {
  var ctx = useContext(CoreContext);
  if (!ctx) throw new Error('useCoreEngine must be used inside CoreProvider');
  return ctx;
}
