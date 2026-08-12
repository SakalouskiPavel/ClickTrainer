param(
    [switch]$Ports
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$logsDir = Join-Path $repoRoot "logs"
$pidFile = Join-Path $logsDir "dev-processes.json"
$knownPorts = @(7003, 5049, 4300)

function Stop-ProcessById {
    param(
        [int]$Id,
        [string]$Name
    )

    $process = Get-Process -Id $Id -ErrorAction SilentlyContinue

    if ($null -eq $process) {
        Write-Host "$Name`: PID $Id is not running."
        return 0
    }

    Write-Host "Stopping $Name`: PID $Id"
    Stop-Process -Id $Id -Force
    return 1
}

function Stop-PortOwners {
    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $knownPorts -contains $_.LocalPort }

    $ownerIds = @($connections | Select-Object -ExpandProperty OwningProcess -Unique)

    if ($ownerIds.Count -eq 0) {
        Write-Host "No listeners found on ClickTrainer ports: $($knownPorts -join ', ')."
        return 0
    }

    $count = 0
    foreach ($ownerId in $ownerIds) {
        $count += Stop-ProcessById -Id $ownerId -Name "port owner"
    }

    return $count
}

if (-not (Test-Path $pidFile)) {
    Write-Host "No ClickTrainer dev PID file found."

    if ($Ports) {
        $stoppedByPort = Stop-PortOwners
        Write-Host "Stopped $stoppedByPort process(es) by port."
    }

    exit 0
}

$payload = Get-Content $pidFile -Raw | ConvertFrom-Json
$records = if ($null -ne $payload.processes) { @($payload.processes) } else { @($payload) }
$stopped = 0

foreach ($record in $records) {
    $stopped += Stop-ProcessById -Id $record.id -Name $record.name
}

Remove-Item -LiteralPath $pidFile -Force

if ($Ports) {
    $stopped += Stop-PortOwners
}

Write-Host "Stopped $stopped ClickTrainer dev process(es)."
