import React from 'react';
var useState = React.useState;
var useEffect = React.useEffect;
var createContext = React.createContext;
var useContext = React.useContext;

var SK = 'silo_core_v3';
var XPL = 300;

export var TIERS = [
  { min:1,  title:'Quiescent Matrix',  desc:'Dormant. Awaiting first signal.',               color:'#475569', glow:'rgba(71,85,105,0.5)'    },
  { min:4,  title:'Resonant Core',     desc:'Oscillating. Patterns emerging from noise.',    color:'#4a9eff', glow:'rgba(74,158,255,0.55)'  },
  { min:8,  title:'Kinetic Lattice',   desc:'Expanding. Signal threads multiplying outward.',color:'#22c55e', glow:'rgba(34,197,94,0.55)'   },
  { min:13, title:'Cascade Engine',    desc:'Accelerating. The architecture self-modifies.', color:'#e879a0', glow:'rgba(232,121,160,0.55)' },
  { min:18, title:'Sovereign Nexus',   desc:'Autonomous. The system rewrites itself.',        color:'#a78bfa', glow:'rgba(167,139,250,0.6)'  },
  { min:24, title:'Monolithic Overlord',desc:'Fully sentient. The Core has become aware.',    color:'#f59e0b', glow:'rgba(245,158,11,0.65)'  },
];

export function getTier(level) {
  for (var i = TIERS.length - 1; i >= 0; i--) {
    if (level >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}

export var ACTIVITIES = [
  { id:'run',      label:'Run / Sprint',       xp:75,  icon:'🏃', stat:'body', desc:'Physical output' },
  { id:'gym',      label:'Lift / Train',        xp:100, icon:'🏋', stat:'body', desc:'Resistance work' },
  { id:'cold',     label:'Cold exposure',       xp:60,  icon:'🚿', stat:'body', desc:'Stress inoculation' },
  { id:'sleep',    label:'Full sleep cycle',    xp:50,  icon:'🌙', stat:'body', desc:'Recovery protocol' },
  { id:'meditate', label:'Meditation',          xp:55,  icon:'🧘', stat:'mind', desc:'Signal clarity' },
  { id:'journal',  label:'Deep journal entry',  xp:45,  icon:'📓', stat:'mind', desc:'Pattern processing' },
  { id:'noscroll', label:'No-scroll block',     xp:40,  icon:'📵', stat:'mind', desc:'Noise reduction' },
  { id:'read',     label:'Read / Study',        xp:45,  icon:'📚', stat:'mind', desc:'Signal intake' },
  { id:'social',   label:'Real connection',     xp:80,  icon:'🤝', stat:'soul', desc:'Human bandwidth' },
  { id:'outside',  label:'Time in nature',      xp:55,  icon:'🌲', stat:'soul', desc:'Ground signal' },
  { id:'creative', label:'Creative work',       xp:60,  icon:'🎨', stat:'soul', desc:'Expression output' },
  { id:'gratitude',label:'Gratitude log',       xp:35,  icon:'💛', stat:'soul', desc:'Polarity shift' },
];

export function getLevelFromXP(xp) { return Math.max(1, Math.floor(xp / XPL) + 1); }
export function getLvlXP(xp)       { return xp % XPL; }

function todayKey() { return new Date().toISOString().slice(0, 10); }

function defaults() {
  return {
    totalXP: 0,
    log: [],
    streak: 0,
    lastDate: null,
    weeklyShifts: {},
    activityLog: [],
    loggedToday: {},
    loggedDate: null,
    journalEntries: [],
  };
}

function persist(st) { try { localStorage.setItem(SK, JSON.stringify(st)); } catch(x) {} }
function hydrate() {
  try {
    var r = localStorage.getItem(SK);
    return r ? Object.assign({}, defaults(), JSON.parse(r)) : defaults();
  } catch(x) { return defaults(); }
}

var Ctx = createContext(null);

export function CoreProvider(props) {
  var s1 = useState(null);   var state = s1[0], setState = s1[1];
  var s2 = useState(false);  var loaded = s2[0], setLoaded = s2[1];
  var s3 = useState(null);   var evolution = s3[0], setEvolution = s3[1];

  useEffect(function() {
    var st = hydrate();
    var today = todayKey();
    if (st.lastDate !== today) {
      var yest = new Date(); yest.setDate(yest.getDate() - 1);
      var ykey = yest.toISOString().slice(0, 10);
      st.streak = st.lastDate === ykey ? (st.streak || 0) + 1 : 0;
      st.loggedToday = {};
      st.loggedDate = today;
      st.lastDate = today;
    }
    setState(st);
    setLoaded(true);
  }, []);

  useEffect(function() { if (state) persist(state); }, [state]);

  function addXP(amt, state_) {
    var nx = (state_.totalXP || 0) + amt;
    var old = getTier(getLevelFromXP(state_.totalXP || 0));
    var nw  = getTier(getLevelFromXP(nx));
    if (nw.title !== old.title) setTimeout(function() { setEvolution(nw); }, 250);
    return nx;
  }

  function commitEntry(parseResult) {
    setState(function(prev) {
      if (!prev) return prev;
      var today = todayKey();
      var weekly = Object.assign({}, prev.weeklyShifts || {});
      if (!weekly[today]) weekly[today] = { HEAVY:0, HEAT:0, CLEAR:0, REFLECTIVE:0 };
      if (parseResult.primaryShift) weekly[today][parseResult.primaryShift] = (weekly[today][parseResult.primaryShift] || 0) + 1;
      var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
      Object.keys(weekly).forEach(function(k) { if (new Date(k) < cutoff) delete weekly[k]; });
      var newEntry = {
        id: Date.now(), date: today,
        time: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
        wordCount: parseResult.wordCount, charCount: parseResult.charCount,
        primaryShift: parseResult.primaryShift, shiftLabel: parseResult.shiftLabel,
        shiftColor: parseResult.shiftColor, xp: parseResult.xp, action: parseResult.action,
      };
      var newLog = [newEntry].concat((prev.log || []).slice(0, 49));
      var newJournal = parseResult.action === 'commit'
        ? [{ id: Date.now(), date: today, time: newEntry.time, text: parseResult.rawText || '', mood: parseResult.primaryShift, xp: parseResult.xp }].concat((prev.journalEntries || []).slice(0, 99))
        : (prev.journalEntries || []);
      return Object.assign({}, prev, {
        totalXP: addXP(parseResult.xp, prev),
        log: newLog, weeklyShifts: weekly,
        journalEntries: newJournal,
        lastDate: today, streak: Math.max(prev.streak || 0, 1),
      });
    });
  }

  function logActivity(id, xp) {
    setState(function(prev) {
      if (!prev || (prev.loggedToday || {})[id]) return prev;
      var today = todayKey();
      var lt = Object.assign({}, prev.loggedToday || {}); lt[id] = true;
      var al = (prev.activityLog || []).concat([{ id: id, date: today, xp: xp }]);
      return Object.assign({}, prev, {
        totalXP: addXP(xp, prev),
        loggedToday: lt, loggedDate: today,
        activityLog: al.slice(-500),
        lastDate: today, streak: Math.max(prev.streak || 0, 1),
      });
    });
  }

  function dismissEvolution() { setEvolution(null); }
  function resetAll() { try { localStorage.removeItem(SK); } catch(x) {} setState(defaults()); }

  return React.createElement(Ctx.Provider, {
    value: { state, loaded, evolution, commitEntry, logActivity, dismissEvolution, resetAll, XPL }
  }, props.children);
}

export function useCoreEngine() {
  var ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCoreEngine outside CoreProvider');
  return ctx;
}
