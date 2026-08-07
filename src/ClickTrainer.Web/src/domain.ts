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

export function generatePrompt(settings: TrainingSettings): KeyBind[] {
  if (settings.keyBinds.length === 0) {
    return [];
  }

  const count = settings.mode === "grouped" ? settings.groupSize : 1;

  return Array.from({ length: count }, () => {
    const index = Math.floor(Math.random() * settings.keyBinds.length);
    return settings.keyBinds[index];
  });
}
