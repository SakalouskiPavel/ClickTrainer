import { Keyboard, Pause, Play, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  availableBaseKeys,
  bindKey,
  defaultKeyBinds,
  formatBind,
  generateBind,
  generatePrompt,
  isModifierOnlyKey,
  KeyBind,
  keyBindFromKeyboardEvent,
  KeyModifier,
  matchesKeyboardEvent,
  normalizeModifiers,
  TrainingMode,
  TrainingSettings,
  TrainingStats
} from "./domain";

const modifierOptions: KeyModifier[] = ["Alt", "Ctrl", "Shift"];
const initialStats: TrainingStats = { correct: 0, misses: 0, streak: 0, bestStreak: 0 };
const defaultSelectedCodes = defaultKeyBinds.map((bind) => bind.code);

export function App() {
  const [mode, setMode] = useState<TrainingMode>("grouped");
  const [keyBinds, setKeyBinds] = useState<KeyBind[]>(defaultKeyBinds);
  const [selectedCodes, setSelectedCodes] = useState<string[]>(defaultSelectedCodes);
  const [selectedModifiers, setSelectedModifiers] = useState<KeyModifier[]>([]);
  const [groupSize, setGroupSize] = useState(4);
  const [groupDelayMs, setGroupDelayMs] = useState(900);
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForGroup, setIsWaitingForGroup] = useState(false);
  const [prompt, setPrompt] = useState<KeyBind[]>([]);
  const [cursor, setCursor] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [stats, setStats] = useState<TrainingStats>(initialStats);
  const [lastResult, setLastResult] = useState<"hit" | "miss" | null>(null);
  const [isRecordingBind, setIsRecordingBind] = useState(false);
  const [recordedBind, setRecordedBind] = useState<KeyBind | null>(null);

  const settings: TrainingSettings = useMemo(
    () => ({
      mode,
      groupSize,
      groupDelayMs,
      durationSeconds,
      keyBinds
    }),
    [durationSeconds, groupDelayMs, groupSize, keyBinds, mode]
  );

  const activeBind = prompt[cursor];
  const accuracy = stats.correct + stats.misses === 0
    ? 100
    : Math.round((stats.correct / (stats.correct + stats.misses)) * 100);

  const createPrompt = useCallback(() => {
    setCursor(0);
    setPrompt(generatePrompt(settings));
    setIsWaitingForGroup(false);
  }, [settings]);

  const resetTraining = useCallback(() => {
    setIsRunning(false);
    setIsWaitingForGroup(false);
    setPrompt([]);
    setCursor(0);
    setRemainingSeconds(durationSeconds);
    setStats(initialStats);
    setLastResult(null);
  }, [durationSeconds]);

  const startTraining = useCallback(() => {
    if (keyBinds.length === 0) {
      return;
    }

    setStats(initialStats);
    setRemainingSeconds(durationSeconds);
    setLastResult(null);
    setIsRunning(true);
    createPrompt();
  }, [createPrompt, durationSeconds, keyBinds.length]);

  const queueNextPrompt = useCallback(() => {
    if (mode === "grouped") {
      setIsWaitingForGroup(true);
      return;
    }

    setCursor(0);
    setPrompt((value) => {
      const nextBind = generateBind(settings);

      if (!nextBind) {
        return [];
      }

      if (value.length <= 1) {
        return generatePrompt(settings);
      }

      return [...value.slice(1), nextBind];
    });
  }, [mode, settings]);

  const advancePrompt = useCallback(() => {
    if (mode === "grouped" && cursor < prompt.length - 1) {
      setCursor((value) => value + 1);
      return;
    }

    queueNextPrompt();
  }, [cursor, mode, prompt.length, queueNextPrompt]);

  useEffect(() => {
    setRemainingSeconds(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => {
        if (value <= 1) {
          setIsRunning(false);
          setIsWaitingForGroup(false);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || !isWaitingForGroup) {
      return;
    }

    const timer = window.setTimeout(createPrompt, groupDelayMs);
    return () => window.clearTimeout(timer);
  }, [createPrompt, groupDelayMs, isRunning, isWaitingForGroup]);

  useEffect(() => {
    if (!isRunning || !activeBind || isWaitingForGroup) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isModifierOnlyKey(event)) {
        return;
      }

      event.preventDefault();

      if (matchesKeyboardEvent(activeBind, event)) {
        setStats((value) => {
          const streak = value.streak + 1;
          return {
            correct: value.correct + 1,
            misses: value.misses,
            streak,
            bestStreak: Math.max(value.bestStreak, streak)
          };
        });
        setLastResult("hit");
        advancePrompt();
        return;
      }

      setStats((value) => ({
        correct: value.correct,
        misses: value.misses + 1,
        streak: 0,
        bestStreak: value.bestStreak
      }));
      setLastResult("miss");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeBind, advancePrompt, isRunning, isWaitingForGroup]);

  useEffect(() => {
    if (!isRecordingBind) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const bind = keyBindFromKeyboardEvent(event);

      if (!bind) {
        return;
      }

      setKeyBinds((value) => {
        if (value.some((item) => bindKey(item) === bindKey(bind))) {
          return value;
        }

        return [...value, bind];
      });
      setRecordedBind(bind);
      setIsRecordingBind(false);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isRecordingBind]);

  const toggleBaseKey = (code: string) => {
    setSelectedCodes((value) =>
      value.includes(code) ? value.filter((item) => item !== code) : [...value, code]
    );
  };

  const toggleModifier = (modifier: KeyModifier) => {
    setSelectedModifiers((value) =>
      value.includes(modifier)
        ? value.filter((item) => item !== modifier)
        : normalizeModifiers([...value, modifier])
    );
  };

  const addSelectedBinds = () => {
    const selectedBaseKeys = availableBaseKeys.filter((bind) => selectedCodes.includes(bind.code));
    const additions = selectedBaseKeys.map((bind) => ({
      ...bind,
      modifiers: normalizeModifiers(selectedModifiers)
    }));

    setKeyBinds((value) => {
      const known = new Set(value.map(bindKey));
      return [...value, ...additions.filter((bind) => !known.has(bindKey(bind)))];
    });
  };

  const startRecordingBind = () => {
    setRecordedBind(null);
    setIsRecordingBind((value) => !value);
  };

  const removeBind = (target: KeyBind) => {
    setKeyBinds((value) => value.filter((bind) => bindKey(bind) !== bindKey(target)));
  };

  const resetBinds = () => {
    setKeyBinds(defaultKeyBinds);
    setSelectedCodes(defaultSelectedCodes);
    setSelectedModifiers([]);
  };

  const trainerTitle = isWaitingForGroup
    ? "Next group incoming"
    : isRunning
      ? "Press the highlighted bind"
      : "Ready when you are";

  return (
    <main className="appShell">
      <section className="workspace">
        <aside className="settingsPanel">
          <div className="brandRow">
            <Keyboard aria-hidden="true" />
            <div>
              <h1>ClickTrainer</h1>
              <p>Bind and reaction practice</p>
            </div>
          </div>

          <div className="fieldGroup">
            <label>Mode</label>
            <div className="segmented">
              <button className={mode === "grouped" ? "active" : ""} onClick={() => setMode("grouped")}>
                Groups
              </button>
              <button className={mode === "nonStop" ? "active" : ""} onClick={() => setMode("nonStop")}>
                Non-stop
              </button>
            </div>
          </div>

          <div className="fieldGrid">
            <label>
              Group size
              <input
                disabled={mode === "nonStop"}
                min={1}
                max={12}
                type="number"
                value={groupSize}
                onChange={(event) => setGroupSize(Number(event.target.value))}
              />
            </label>
            <label>
              Delay ms
              <input
                disabled={mode === "nonStop"}
                min={100}
                step={50}
                type="number"
                value={groupDelayMs}
                onChange={(event) => setGroupDelayMs(Number(event.target.value))}
              />
            </label>
            <label>
              Duration sec
              <input
                min={10}
                step={5}
                type="number"
                value={durationSeconds}
                onChange={(event) => setDurationSeconds(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="fieldGroup">
            <label>Keys</label>
            <div className="keyGrid">
              {availableBaseKeys.map((bind) => (
                <button
                  key={bind.code}
                  className={selectedCodes.includes(bind.code) ? "active" : ""}
                  onClick={() => toggleBaseKey(bind.code)}
                >
                  {bind.label}
                </button>
              ))}
            </div>
          </div>

          <div className="fieldGroup">
            <label>Modifiers</label>
            <div className="modifierRow">
              {modifierOptions.map((modifier) => (
                <button
                  key={modifier}
                  className={selectedModifiers.includes(modifier) ? "active" : ""}
                  onClick={() => toggleModifier(modifier)}
                >
                  {modifier}
                </button>
              ))}
            </div>
            <div className="presetActions">
              <button className="addButton" disabled={selectedCodes.length === 0} onClick={addSelectedBinds}>
                Add combo
              </button>
              <button onClick={resetBinds}>Reset</button>
            </div>
          </div>

          <div className="fieldGroup">
            <label>Custom hotkey</label>
            <button
              className={`recordButton ${isRecordingBind ? "recording" : ""}`}
              disabled={isRunning}
              onClick={startRecordingBind}
            >
              {isRecordingBind ? "Press any key..." : "Record hotkey"}
            </button>
            <p className="captureStatus">
              {isRecordingBind
                ? "Waiting for a key or combination"
                : recordedBind
                  ? `Added ${formatBind(recordedBind)}`
                  : "Use this for any keyboard key outside the Dota preset"}
            </p>
          </div>

          <div className="bindList" aria-label="Training key binds">
            {keyBinds.map((bind) => (
              <button
                key={bindKey(bind)}
                className="bindChip"
                title="Remove bind"
                onClick={() => removeBind(bind)}
              >
                <span>{formatBind(bind)}</span>
                <Trash2 aria-hidden="true" />
              </button>
            ))}
          </div>
        </aside>

        <section className="trainerSurface">
          <div className="trainerHeader">
            <div>
              <span className="eyebrow">Session</span>
              <h2>{trainerTitle}</h2>
            </div>
            <div className="controls">
              <button
                disabled={keyBinds.length === 0}
                title={isRunning ? "Pause" : "Start"}
                onClick={() => (isRunning ? setIsRunning(false) : startTraining())}
              >
                {isRunning ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              </button>
              <button title="Reset" onClick={resetTraining}>
                <RotateCcw aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={`promptLine ${lastResult ?? ""} ${isWaitingForGroup ? "waiting" : ""}`}>
            {keyBinds.length === 0 ? (
              <span className="placeholder">No binds</span>
            ) : isWaitingForGroup ? (
              <span className="placeholder">...</span>
            ) : prompt.length === 0 ? (
              <span className="placeholder">Start</span>
            ) : (
              prompt.map((bind, index) => (
                <span
                  key={`${index}-${bindKey(bind)}`}
                  className={index === cursor ? "current" : "upcoming"}
                >
                  {formatBind(bind)}
                </span>
              ))
            )}
          </div>

          <div className="statsGrid">
            <Stat label="Time" value={`${remainingSeconds}s`} />
            <Stat label="Correct" value={stats.correct.toString()} />
            <Stat label="Misses" value={stats.misses.toString()} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
          </div>
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
