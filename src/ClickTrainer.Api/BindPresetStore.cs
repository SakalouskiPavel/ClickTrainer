using System.Text.Json;
using System.Text.Json.Serialization;
using ClickTrainer.Core;

namespace ClickTrainer.Api;

public sealed class BindPresetStore(IWebHostEnvironment environment)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    static BindPresetStore()
    {
        JsonOptions.Converters.Add(new JsonStringEnumConverter());
    }

    private readonly SemaphoreSlim _lock = new(1, 1);
    private readonly string _filePath = Path.Combine(environment.ContentRootPath, "App_Data", "bind-presets.json");

    public async Task<IReadOnlyList<SavedBindPreset>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);

        try
        {
            return await ReadAllUnsafeAsync(cancellationToken);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<SavedBindPreset> CreateAsync(
        SaveBindPresetRequest request,
        CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);

        try
        {
            var presets = await ReadAllUnsafeAsync(cancellationToken);
            var now = DateTimeOffset.UtcNow;
            var preset = new SavedBindPreset(
                Guid.NewGuid().ToString("N"),
                request.Name.Trim(),
                request.KeyBinds,
                now,
                now);

            presets.Add(preset);
            await WriteAllUnsafeAsync(presets, cancellationToken);
            return preset;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<SavedBindPreset?> UpdateAsync(
        string id,
        SaveBindPresetRequest request,
        CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);

        try
        {
            var presets = await ReadAllUnsafeAsync(cancellationToken);
            var index = presets.FindIndex(preset => preset.Id == id);

            if (index < 0)
            {
                return null;
            }

            var updated = presets[index] with
            {
                Name = request.Name.Trim(),
                KeyBinds = request.KeyBinds,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            presets[index] = updated;
            await WriteAllUnsafeAsync(presets, cancellationToken);
            return updated;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);

        try
        {
            var presets = await ReadAllUnsafeAsync(cancellationToken);
            var removed = presets.RemoveAll(preset => preset.Id == id) > 0;

            if (removed)
            {
                await WriteAllUnsafeAsync(presets, cancellationToken);
            }

            return removed;
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task<List<SavedBindPreset>> ReadAllUnsafeAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(_filePath))
        {
            return [];
        }

        await using var stream = File.OpenRead(_filePath);
        var presets = await JsonSerializer.DeserializeAsync<List<SavedBindPreset>>(
            stream,
            JsonOptions,
            cancellationToken);

        return presets ?? [];
    }

    private async Task WriteAllUnsafeAsync(
        IReadOnlyList<SavedBindPreset> presets,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_filePath)!);

        await using var stream = File.Create(_filePath);
        await JsonSerializer.SerializeAsync(stream, presets, JsonOptions, cancellationToken);
    }
}

public sealed record SaveBindPresetRequest(
    string Name,
    IReadOnlyList<SavedKeyBind> KeyBinds);
