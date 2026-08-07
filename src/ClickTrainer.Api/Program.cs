using ClickTrainer.Core;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddSingleton<TrainingPromptGenerator>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "https://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("Frontend");

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    app = "ClickTrainer"
}));

app.MapGet("/api/presets", () => Results.Ok(PresetCatalog.CreateDefaults()))
    .WithName("GetPresets");

app.MapPost("/api/training/prompts", (
    TrainingPromptRequest request,
    TrainingPromptGenerator generator) =>
{
    var settings = new TrainingSettings(
        request.Mode,
        request.KeyBinds,
        request.GroupSize,
        TimeSpan.FromMilliseconds(request.GroupDelayMs),
        TimeSpan.FromSeconds(request.DurationSeconds));

    return Results.Ok(generator.GenerateGroup(settings));
})
.WithName("CreateTrainingPrompt");

app.Run();

public sealed record TrainingPromptRequest(
    TrainingMode Mode,
    IReadOnlyList<KeyBind> KeyBinds,
    int GroupSize = 4,
    int GroupDelayMs = 900,
    int DurationSeconds = 60);
