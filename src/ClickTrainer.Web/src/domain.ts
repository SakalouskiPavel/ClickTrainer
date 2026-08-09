export type KeyModifier = "Alt" | "Ctrl" | "Shift";

export type KeyBind = {
  code: string;
  label: string;
  modifiers: KeyModifier[];
};

export type TrainingMode = "grouped" | "nonStop";

export type TrainingSettings = {
  mode: TrainingMode;
  groupSize: number;
  groupDelayMs: number;
  durationSeconds: number;
  keyBinds: KeyBind[];
};

export type TrainingStats = {
  correct: number;
  misses: number;
  streak: number;
  bestStreak: number;
};

export const nonStopQueueSize = 4;
export const modifierOrder: KeyModifier[] = ["Ctrl", "Alt", "Shift"];

export const availableBaseKeys: KeyBind[] = [
  "Q",
  "W",
  "E",
  "R",
  "A",
  "S",
  "D",
  "F",
  "Z",
  "X",
  "C",
  "V"
].map((label) => ({
  code: `Key${label}`,
  label,
  modifiers: []
}));

export const defaultKeyBinds: KeyBind[] = availableBaseKeys;

export function normalizeModifiers(modifiers: KeyModifier[]): KeyModifier[] {
  return modifierOrder.filter((modifier) => modifiers.includes(modifier));
}

export function bindKey(bind: KeyBind): string {
  return `${bind.code}:${normalizeModifiers(bind.modifiers).join("+")}`;
}

export function formatBind(bind: KeyBind): string {
  return [...normalizeModifiers(bind.modifiers), bind.label].join("+");
}

export function matchesKeyboardEvent(bind: KeyBind, event: KeyboardEvent): boolean {
  return (
    bind.code === event.code &&
    bind.modifiers.includes("Alt") === event.altKey &&
    bind.modifiers.includes("Ctrl") === event.ctrlKey &&
    bind.modifiers.includes("Shift") === event.shiftKey
  );
}

export function isModifierOnlyKey(event: KeyboardEvent): boolean {
  return ["Alt", "Control", "Shift"].includes(event.key);
}

export function modifiersFromKeyboardEvent(event: KeyboardEvent): KeyModifier[] {
  return normalizeModifiers([
    ...(event.ctrlKey ? (["Ctrl"] as const) : []),
    ...(event.altKey ? (["Alt"] as const) : []),
    ...(event.shiftKey ? (["Shift"] as const) : [])
  ]);
}

export function keyBindFromKeyboardEvent(event: KeyboardEvent): KeyBind | undefined {
  if (isModifierOnlyKey(event)) {
    return undefined;
  }

  return {
    code: event.code,
    label: labelFromKeyboardEvent(event),
    modifiers: modifiersFromKeyboardEvent(event)
  };
}

function labelFromKeyboardEvent(event: KeyboardEvent): string {
  if (/^Key[A-Z]$/.test(event.code)) {
    return event.code.slice(3);
  }

  if (/^Digit[0-9]$/.test(event.code)) {
    return event.code.slice(5);
  }

  if (/^Numpad[0-9]$/.test(event.code)) {
    return `Num ${event.code.slice(6)}`;
  }

  const labels: Record<string, string> = {
    Backquote: "`",
    Backslash: "\\",
    BracketLeft: "[",
    BracketRight: "]",
    Comma: ",",
    Equal: "=",
    Escape: "Esc",
    IntlBackslash: "\\",
    Minus: "-",
    Period: ".",
    Quote: "'",
    Semicolon: ";",
    Slash: "/",
    Space: "Space",
    Tab: "Tab"
  };

  if (event.code in labels) {
    return labels[event.code];
  }

  if (event.code.startsWith("Arrow")) {
    return event.code.replace("Arrow", "");
  }

  if (event.code.startsWith("Numpad")) {
    return event.code.replace("Numpad", "Num ");
  }

  return event.key.length === 1 ? event.key.toUpperCase() : event.key;
}

export function generateBind(settings: TrainingSettings): KeyBind | undefined {
  if (settings.keyBinds.length === 0) {
    return undefined;
  }

  const index = Math.floor(Math.random() * settings.keyBinds.length);
  return settings.keyBinds[index];
}

export function generatePrompt(settings: TrainingSettings): KeyBind[] {
  if (settings.keyBinds.length === 0) {
    return [];
  }

  const count = settings.mode === "grouped" ? settings.groupSize : nonStopQueueSize;

  return Array.from({ length: count }, () => {
    return generateBind(settings)!;
  });
}
