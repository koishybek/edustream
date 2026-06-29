# Stops the local EduStream PostgreSQL dev cluster started by start-local-db.ps1.
#   powershell -ExecutionPolicy Bypass -File infra/scripts/stop-local-db.ps1
$ErrorActionPreference = "Stop"

$pgRoot = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\pg_ctl.exe" -ErrorAction SilentlyContinue |
  Sort-Object FullName -Descending | Select-Object -First 1
if (-not $pgRoot) { Write-Error "PostgreSQL not found." }
$pgBin = Split-Path $pgRoot.FullName
$data  = Join-Path (Join-Path $env:LOCALAPPDATA "edustream") "pgdata"

& "$pgBin\pg_ctl.exe" -D $data -m fast stop
Write-Host "Stopped."
