namespace ClickTrainer.Core;

public sealed record KeyBindPreset(
    string Id,
    string Name,
    string Description,
    IReadOnlyList<KeyBind> KeyBinds);
