using ClickTrainer.Api;
using ClickTrainer.Core;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddSingleton<TrainingPromptGenerator>();
builder.Services.AddSingleton<BindPresetStore>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4300",
                "https://localhost:4300",
                "http://localhost:5173",
                "https://localhost:5173")
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

app.MapGet("/api/bind-presets", async (
    BindPresetStore store,
    CancellationToken cancellationToken) =>
{
    return Results.Ok(await store.GetAllAsync(cancellationToken));
})
.WithName("GetBindPresets");

app.MapPost("/api/bind-presets", async (
    SaveBindPresetRequest request,
    BindPresetStore store,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest(new { error = "Preset name is required." });
    }

    if (request.KeyBinds.Count == 0)
    {
        return Results.BadRequest(new { error = "At least one key bind is required." });
    }

    var preset = await store.CreateAsync(request, cancellationToken);
    return Results.Created($"/api/bind-presets/{preset.Id}", preset);
})
.WithName("CreateBindPreset");

app.MapPut("/api/bind-presets/{id}", async (
    string id,
    SaveBindPresetRequest request,
    BindPresetStore store,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest(new { error = "Preset name is required." });
    }

    if (request.KeyBinds.Count == 0)
    {
        return Results.BadRequest(new { error = "At least one key bind is required." });
    }

    var preset = await store.UpdateAsync(id, request, cancellationToken);
    return preset is null ? Results.NotFound() : Results.Ok(preset);
})
.WithName("UpdateBindPreset");

app.MapDelete("/api/bind-presets/{id}", async (
    string id,
    BindPresetStore store,
    CancellationToken cancellationToken) =>
{
    return await store.DeleteAsync(id, cancellationToken)
        ? Results.NoContent()
        : Results.NotFound();
})
.WithName("DeleteBindPreset");

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
