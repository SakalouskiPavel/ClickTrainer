namespace ClickTrainer.Core;

public static class PresetCatalog
{
    public static IReadOnlyList<KeyBindPreset> CreateDefaults()
    {
        var basicDotaKeys = new[]
        {
            new KeyBind("KeyQ", "Q"),
            new KeyBind("KeyW", "W"),
            new KeyBind("KeyE", "E"),
            new KeyBind("KeyR", "R"),
            new KeyBind("KeyA", "A"),
            new KeyBind("KeyS", "S"),
            new KeyBind("KeyD", "D"),
            new KeyBind("KeyF", "F"),
            new KeyBind("KeyZ", "Z"),
            new KeyBind("KeyX", "X"),
            new KeyBind("KeyC", "C"),
            new KeyBind("KeyV", "V")
        };

        var altItemKeys = basicDotaKeys
            .Take(8)
            .Select(key => key with { Modifiers = KeyModifier.Alt })
            .ToArray();

        return
        [
            new KeyBindPreset(
                "dota-basic",
                "Dota basic",
                "Core ability and item-like keys without modifiers.",
                basicDotaKeys),
            new KeyBindPreset(
                "dota-alt",
                "Dota Alt combinations",
                "Alt combinations for practicing modifier timing.",
                altItemKeys)
        ];
    }
}
