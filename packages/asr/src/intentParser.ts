import type { EventType } from "@sexmetrics/core";

type IntentRule = {
  type: EventType;
  patterns: RegExp[];
};

const rules: IntentRule[] = [
  {
    type: "STOP",
    patterns: [/\bstop\b/i, /\bwait\b/i, /\bhold on\b/i, /\bno\b/i]
  },
  {
    type: "GO",
    patterns: [/\bgo\b/i, /\bcontinue\b/i, /\bkeep going\b/i]
  },
  {
    type: "POSITIVE_FEEDBACK",
    patterns: [/\byes\b/i, /\bgood\b/i, /\bthat feels good\b/i, /\blike that\b/i]
  },
  {
    type: "NEGATIVE_FEEDBACK",
    patterns: [/\bnope\b/i, /\bnot that\b/i, /\bdon't\b/i]
  },
  {
    type: "POSITION_CHANGE_REQUEST",
    patterns: [/\bswitch\b/i, /\bchange position\b/i, /\bturn around\b/i]
  },
  {
    type: "PACE_CHANGE_REQUEST",
    patterns: [/\bslower\b/i, /\bfaster\b/i, /\bgentle\b/i]
  }
];

export function parseIntent(text: string): EventType[] {
  const intents: EventType[] = [];
  const trimmed = text.trim();
  if (!trimmed) return intents;
  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(trimmed))) {
      intents.push(rule.type);
    }
  }
  return intents;
}
