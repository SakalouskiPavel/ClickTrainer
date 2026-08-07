namespace ClickTrainer.Core;

public sealed record TrainingPrompt(
    IReadOnlyList<KeyBind> Items,
    DateTimeOffset CreatedAt);
