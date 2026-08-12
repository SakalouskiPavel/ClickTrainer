param(
    [switch]$NoBuild
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$logsDir = Join-Path $repoRoot "logs"
$pidFile = Join-Path $logsDir "dev-processes.json"
$apiProject = Join-Path $repoRoot "src\ClickTrainer.Api\ClickTrainer.Api.csproj"
$webRoot = Join-Path $repoRoot "src\ClickTrainer.Web"
$viteEntry = Join-Path $webRoot "node_modules\vite\bin\vite.js"
$requiredPorts = @(7003, 5049, 4300)

function Normalize-ProcessPath {
    $pathValue = [Environment]::GetEnvironmentVariable("Path", "Process")

    if ([string]::IsNullOrWhiteSpace($pathValue)) {
        $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
        $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
        $pathValue = @($machinePath, $userPath) -join ";"
    }

    [Environment]::SetEnvironmentVariable("PATH", $null, "Process")
    [Environment]::SetEnvironmentVariable("Path", $pathValue, "Process")
}

function Get-RunningDevProcess {
    if (-not (Test-Path $pidFile)) {
        return @()
    }

    $payload = Get-Content $pidFile -Raw | ConvertFrom-Json
    $records = if ($null -ne $payload.processes) { @($payload.processes) } else { @($payload) }

    return @($records | Where-Object {
        $process = Get-Process -Id $_.id -ErrorAction SilentlyContinue
        $null -ne $process -and $process.HasExited -eq $false
    })
}

function Test-PortOpen {
    param([int]$Port)

    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)

    try {
        $listener.Start()
        return $false
    }
    catch {
        return $true
    }
    finally {
        $listener.Stop()
    }
}

Normalize-ProcessPath
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$running = Get-RunningDevProcess
if ($running.Count -gt 0) {
    Write-Host "ClickTrainer dev processes are already running:"
    $running | ForEach-Object {
        Write-Host " - $($_.name): PID $($_.id), $($_.url)"
    }
    Write-Host "Run scripts\stop-dev.ps1 first if you want to restart them."
    exit 0
}

$occupiedPorts = @($requiredPorts | Where-Object { Test-PortOpen -Port $_ })
if ($occupiedPorts.Count -gt 0) {
    Write-Host "Cannot start ClickTrainer because these ports are already in use: $($occupiedPorts -join ', ')."
    Write-Host "Stop the existing dev server or choose different ports first."
    exit 1
}

if (-not (Test-Path $viteEntry)) {
    Write-Host "Frontend dependencies are missing. Running npm install..."
    & npm install --prefix $webRoot
}

$dotnetArgs = @("run", "--project", $apiProject, "--launch-profile", "https")
if ($NoBuild) {
    $dotnetArgs += "--no-build"
}

$apiProcess = Start-Process `
    -FilePath "dotnet" `
    -ArgumentList $dotnetArgs `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logsDir "api.out.log") `
    -RedirectStandardError (Join-Path $logsDir "api.err.log") `
    -PassThru

$nodeCommand = Get-Command "node" -ErrorAction Stop
$webProcess = Start-Process `
    -FilePath $nodeCommand.Source `
    -ArgumentList @($viteEntry, "--host", "127.0.0.1") `
    -WorkingDirectory $webRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logsDir "web.out.log") `
    -RedirectStandardError (Join-Path $logsDir "web.err.log") `
    -PassThru

$records = @(
    [ordered]@{
        name = "api"
        id = $apiProcess.Id
        url = "https://localhost:7003"
        startedAt = (Get-Date).ToString("o")
    },
    [ordered]@{
        name = "web"
        id = $webProcess.Id
        url = "http://127.0.0.1:4300"
        startedAt = (Get-Date).ToString("o")
    }
)

[ordered]@{
    processes = $records
} | ConvertTo-Json -Depth 5 | Set-Content -Path $pidFile -Encoding utf8

Write-Host "ClickTrainer dev environment started."
Write-Host "API: https://localhost:7003"
Write-Host "Web: http://127.0.0.1:4300"
Write-Host "Logs: $logsDir"
Write-Host "Stop: scripts\stop-dev.ps1"
