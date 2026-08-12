# ClickTrainer

Web-first trainer for keyboard binds and typing-like reaction practice.

## Stack

- Frontend: React, TypeScript, Vite
- Backend: ASP.NET Core Minimal API on .NET 10
- Core logic: shared C# project with bind models, presets, and prompt generation
- Tests: xUnit for domain logic

## Layout

```text
src/
  ClickTrainer.Api/
  ClickTrainer.Core/
  ClickTrainer.Web/
tests/
  ClickTrainer.Core.Tests/
```

The frontend handles low-latency keyboard input in the browser. The backend stores bind presets and is intended to grow into history, statistics, and future synchronization.

Bind presets are exposed through `/api/bind-presets` and stored locally by the API in `src/ClickTrainer.Api/App_Data/bind-presets.json`.

## Run

Backend:

```powershell
dotnet run --project src\ClickTrainer.Api\ClickTrainer.Api.csproj --launch-profile https
```

Frontend:

```powershell
cd src\ClickTrainer.Web
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:4300/.

## Verify

```powershell
dotnet build ClickTrainer.slnx --no-restore
dotnet test ClickTrainer.slnx --no-build
cd src\ClickTrainer.Web
npm run build
```
