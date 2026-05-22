/**
 * coreParser.js
 * Pure client-side emotional landscape parser.
 * Zero external calls. Runs synchronously in <1ms on any device.
 */

var LEXICON = {
  HEAVY: {
    label: 'Heavy / Stress',
    color: '#f97316',
    keywords: [
      'anxious','anxiety','stressed','stress','overwhelmed','exhausted','tired',
      'drained','heavy','burden','pressure','panic','scared','fear','afraid',
      'worried','worry','hopeless','helpless','trapped','stuck','suffocating',
      'numb','empty','alone','lonely','sad','depressed','depression','grief',
      'loss','hurt','pain','crying','cried','tears','broken','shattered','lost',
    ],
  },
  HEAT: {
    label: 'Turbulent / Heat',
    color: '#ef4444',
    keywords: [
      'angry','anger','mad','furious','rage','hate','hatred','disgusted','disgusting',
      'sick','toxic','manipulative','lied','liar','betrayed','betrayal','cheated',
      'cheating','disrespected','ignored','used','abandoned','abused','abuse',
      'controlling','pathetic','worthless','useless','stupid','idiot','loser',
      'bitter','resentment','resent','revenge','break','breaking','broke','destroy',
      'explode','scream','yell','yelling','yelled','slammed',
    ],
  },
  CLEAR: {
    label: 'Clear / Focus',
    color: '#22c55e',
    keywords: [
      'done','complete','completed','finished','progress','clear','clarity',
      'focused','focus','productive','productivity','accomplished','achievement',
      'proud','confidence','confident','strong','strength','growing','growth',
      'better','improved','improvement','moving','forward','healing','healed',
      'accepted','acceptance','peace','peaceful','calm','calmer','grateful',
      'gratitude','thankful','hopeful','hope','positive','good','great','happy',
      'excited','motivated','motivation','ready','determined','free','released',
    ],
  },
  REFLECTIVE: {
    label: 'Reflective / Processing',
    color: '#4a9eff',
    keywords: [
      'thinking','thought','wondering','wonder','realize','realized','realizing',
      'understand','understanding','understood','processing','process','learning',
      'learned','noticed','noticing','pattern','patterns','question','questioning',
      'reflecting','reflection','memory','memories','remember','remembered',
      'considering','reconsidering','maybe','perhaps','possibly','unsure',
      'confused','confusion','working','figuring','asking','seeking',
    ],
  },
};

var XP_RULES = {
  base: 10,
  perWord: 0.5,
  perShift: { HEAVY: 15, HEAT: 20, CLEAR: 25, REFLECTIVE: 18 },
  burnBonus: 8,
  commitBonus: 5,
};

/**
 * parse(text, action)
 * @param {string} text - Raw input from the user
 * @param {'commit'|'burn'} action
 * @returns {object} ParseResult
 */
export function parse(text, action) {
  if (!text || !text.trim()) {
    return {
      wordCount: 0,
      charCount: 0,
      primaryShift: null,
      shiftLabel: 'No Signal',
      shiftColor: '#475569',
      scores: { HEAVY: 0, HEAT: 0, CLEAR: 0, REFLECTIVE: 0 },
      xp: 0,
      action: action,
      timestamp: Date.now(),
    };
  }

  var clean = text.toLowerCase().replace(/[^a-z\s]/g, ' ');
  var words = clean.split(/\s+/).filter(function(w) { return w.length > 0; });
  var wordCount = words.length;
  var charCount = text.trim().length;

  // Score each category
  var scores = { HEAVY: 0, HEAT: 0, CLEAR: 0, REFLECTIVE: 0 };
  var wordSet = new Set(words);

  Object.keys(LEXICON).forEach(function(cat) {
    LEXICON[cat].keywords.forEach(function(kw) {
      if (wordSet.has(kw)) {
        scores[cat] += 1;
      }
      // Partial match for longer words
      words.forEach(function(w) {
        if (w !== kw && w.length > 4 && (w.startsWith(kw) || kw.startsWith(w))) {
          scores[cat] += 0.5;
        }
      });
    });
  });

  // Find dominant shift
  var primaryShift = null;
  var topScore = 0;
  Object.keys(scores).forEach(function(cat) {
    if (scores[cat] > topScore) {
      topScore = scores[cat];
      primaryShift = cat;
    }
  });

  // XP calculation
  var xp = XP_RULES.base;
  xp += Math.floor(wordCount * XP_RULES.perWord);
  if (primaryShift) xp += XP_RULES.perShift[primaryShift] || 0;
  if (action === 'burn')   xp += XP_RULES.burnBonus;
  if (action === 'commit') xp += XP_RULES.commitBonus;
  xp = Math.max(xp, 5); // floor

  return {
    wordCount: wordCount,
    charCount: charCount,
    primaryShift: primaryShift,
    shiftLabel: primaryShift ? LEXICON[primaryShift].label : 'Ambient / Neutral',
    shiftColor: primaryShift ? LEXICON[primaryShift].color : '#94a3b8',
    scores: scores,
    xp: xp,
    action: action,
    timestamp: Date.now(),
  };
}

export var SHIFT_COLORS = {
  HEAVY:      '#f97316',
  HEAT:       '#ef4444',
  CLEAR:      '#22c55e',
  REFLECTIVE: '#4a9eff',
  null:       '#94a3b8',
};
