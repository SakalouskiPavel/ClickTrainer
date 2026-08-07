namespace ClickTrainer.Core;

public sealed record TrainingSettings(
    TrainingMode Mode,
    IReadOnlyList<KeyBind> KeyBinds,
    int GroupSize = 4,
    TimeSpan GroupDelay = default,
    TimeSpan Duration = default)
{
    public TrainingSettings Normalize()
    {
        return this with
        {
            GroupSize = Math.Max(1, GroupSize),
            GroupDelay = GroupDelay == default ? TimeSpan.FromMilliseconds(900) : GroupDelay,
            Duration = Duration == default ? TimeSpan.FromSeconds(60) : Duration
        };
    }
}
