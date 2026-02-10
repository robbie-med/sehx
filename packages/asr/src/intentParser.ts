import type { EventType } from "@sexmetrics/core";

export type IntentMatch = {
  type: EventType;
  confidence: number;
};

type IntentPattern = {
  regex: RegExp;
  weight: number;
};

type IntentRule = {
  type: EventType;
  minScore: number;
  patterns: IntentPattern[];
};

const rules: IntentRule[] = [
  {
    type: "STOP",
    minScore: 1.2,
    patterns: [
      { regex: /\bstop\b/i, weight: 1.4 },
      { regex: /\bwait\b/i, weight: 1.0 },
      { regex: /\bhold on\b/i, weight: 1.2 },
      { regex: /\bno\b/i, weight: 0.6 },
      { regex: /\bdon'?t\b/i, weight: 1.1 }
    ]
  },
  {
    type: "GO",
    minScore: 1.1,
    patterns: [
      { regex: /\bgo\b/i, weight: 0.8 },
      { regex: /\bkeep going\b/i, weight: 1.4 },
      { regex: /\bcontinue\b/i, weight: 1.1 },
      { regex: /\bmore\b/i, weight: 0.7 }
    ]
  },
  {
    type: "POSITIVE_FEEDBACK",
    minScore: 1.1,
    patterns: [
      { regex: /\byes\b/i, weight: 0.7 },
      { regex: /\bgood\b/i, weight: 0.7 },
      { regex: /\bthat feels good\b/i, weight: 1.5 },
      { regex: /\blike that\b/i, weight: 1.2 },
      { regex: /\bright there\b/i, weight: 1.0 }
    ]
  },
  {
    type: "NEGATIVE_FEEDBACK",
    minScore: 1.1,
    patterns: [
      { regex: /\bnope\b/i, weight: 1.0 },
      { regex: /\bnot that\b/i, weight: 1.2 },
      { regex: /\btoo much\b/i, weight: 1.1 },
      { regex: /\bdon'?t\b/i, weight: 0.8 }
    ]
  },
  {
    type: "POSITION_CHANGE_REQUEST",
    minScore: 1.1,
    patterns: [
      { regex: /\bswitch\b/i, weight: 1.0 },
      { regex: /\bchange position\b/i, weight: 1.4 },
      { regex: /\bturn around\b/i, weight: 1.3 },
      { regex: /\bnew position\b/i, weight: 1.1 }
    ]
  },
  {
    type: "PACE_CHANGE_REQUEST",
    minScore: 1.1,
    patterns: [
      { regex: /\bslower\b/i, weight: 1.2 },
      { regex: /\bfaster\b/i, weight: 1.2 },
      { regex: /\bgentle\b/i, weight: 0.9 },
      { regex: /\bsofter\b/i, weight: 0.9 }
    ]
  }
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseIntent(text: string): IntentMatch[] {
  const intents: IntentMatch[] = [];
  const normalized = normalize(text);
  if (!normalized) return intents;

  for (const rule of rules) {
    let score = 0;
    let maxScore = 0;
    for (const pattern of rule.patterns) {
      maxScore += pattern.weight;
      if (pattern.regex.test(normalized)) {
        score += pattern.weight;
      }
    }
    if (score >= rule.minScore) {
      intents.push({
        type: rule.type,
        confidence: Math.min(1, score / Math.max(1, maxScore))
      });
    }
  }

  return intents;
}
