using ClickTrainer.Core;

namespace ClickTrainer.Core.Tests;

public sealed class TrainingPromptGeneratorTests
{
    [Fact]
    public void GenerateGroupReturnsConfiguredNumberOfItems()
    {
        var settings = new TrainingSettings(
            TrainingMode.Grouped,
            [new KeyBind("KeyQ", "Q"), new KeyBind("KeyW", "W")],
            GroupSize: 6);

        var generator = new TrainingPromptGenerator(new Random(42));

        var prompt = generator.GenerateGroup(settings);

        Assert.Equal(6, prompt.Items.Count);
        Assert.All(prompt.Items, item => Assert.Contains(item.Code, new[] { "KeyQ", "KeyW" }));
    }

    [Fact]
    public void GenerateGroupRequiresAtLeastOneKeyBind()
    {
        var settings = new TrainingSettings(TrainingMode.Grouped, []);
        var generator = new TrainingPromptGenerator(new Random(42));

        Assert.Throws<ArgumentException>(() => generator.GenerateGroup(settings));
    }
}
