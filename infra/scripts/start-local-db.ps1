# Starts a self-contained local PostgreSQL cluster for EduStream dev — no Docker,
# no admin rights, no password. Listens on localhost:5433, database "edustream".
# Data lives in %LOCALAPPDATA%\edustream\pgdata (outside the repo and OneDrive).
#
#   powershell -ExecutionPolicy Bypass -File infra/scripts/start-local-db.ps1
$ErrorActionPreference = "Stop"

# Auto-detect the newest installed PostgreSQL (17, 16, ...).
$pgRoot = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\pg_ctl.exe" -ErrorAction SilentlyContinue |
  Sort-Object FullName -Descending | Select-Object -First 1
if (-not $pgRoot) {
  Write-Error "PostgreSQL not found under C:\Program Files\PostgreSQL. Install PG 16/17, or use Docker: 'docker compose up -d'."
}
$pgBin = Split-Path $pgRoot.FullName
$base  = Join-Path $env:LOCALAPPDATA "edustream"
$data  = Join-Path $base "pgdata"
$log   = Join-Path $base "pg.log"
$port  = 5433

New-Item -ItemType Directory -Force $base | Out-Null

if (-not (Test-Path (Join-Path $data "PG_VERSION"))) {
  Write-Host "Initializing cluster at $data ..."
  & "$pgBin\initdb.exe" -D $data -U postgres --auth-local=trust --auth-host=trust -E UTF8 --locale=C | Out-Null
}

$status = & "$pgBin\pg_ctl.exe" -D $data status 2>&1
if ($status -match "server is running") {
  Write-Host "PostgreSQL already running."
} else {
  & "$pgBin\pg_ctl.exe" -D $data -l $log -o "-p $port" -w start
}

# Ensure the database exists (ignore "already exists").
$env:PGPASSWORD = ""
& "$pgBin\createdb.exe" -h 127.0.0.1 -p $port -U postgres edustream 2>$null | Out-Null

Write-Host ""
Write-Host "Ready -> postgresql://postgres@localhost:$port/edustream"
Write-Host "Set backend/.env DATABASE_URL accordingly (already the default)."
