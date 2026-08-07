namespace ClickTrainer.Core;

public sealed class TrainingPromptGenerator(Random? random = null)
{
    private readonly Random _random = random ?? Random.Shared;

    public TrainingPrompt GenerateGroup(TrainingSettings settings)
    {
        var normalized = settings.Normalize();

        if (normalized.KeyBinds.Count == 0)
        {
            throw new ArgumentException("At least one key bind is required.", nameof(settings));
        }

        var items = Enumerable
            .Range(0, normalized.GroupSize)
            .Select(_ => normalized.KeyBinds[_random.Next(normalized.KeyBinds.Count)])
            .ToArray();

        return new TrainingPrompt(items, DateTimeOffset.UtcNow);
    }
}
