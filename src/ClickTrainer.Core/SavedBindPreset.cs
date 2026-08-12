namespace ClickTrainer.Core;

public sealed record SavedBindPreset(
    string Id,
    string Name,
    IReadOnlyList<SavedKeyBind> KeyBinds,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record SavedKeyBind(
    string Code,
    string Label,
    IReadOnlyList<KeyModifier> Modifiers);
