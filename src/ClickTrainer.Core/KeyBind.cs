namespace ClickTrainer.Core;

public sealed record KeyBind(
    string Code,
    string Label,
    KeyModifier Modifiers = KeyModifier.None)
{
    public string DisplayLabel
    {
        get
        {
            var parts = new List<string>();

            if (Modifiers.HasFlag(KeyModifier.Ctrl))
            {
                parts.Add("Ctrl");
            }

            if (Modifiers.HasFlag(KeyModifier.Alt))
            {
                parts.Add("Alt");
            }

            if (Modifiers.HasFlag(KeyModifier.Shift))
            {
                parts.Add("Shift");
            }

            parts.Add(Label);
            return string.Join("+", parts);
        }
    }
}
