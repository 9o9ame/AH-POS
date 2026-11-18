# AH-POS development-only bootstrap. No database migrations, seeders or restores.
# Run from repository root: powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-backend.ps1
$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

if (Test-Path 'backend') {
    throw 'backend already exists; refusing to overwrite. Inspect it before proceeding.'
}
foreach ($cmd in @('php', 'composer')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        throw "Required executable not found: $cmd"
    }
}
$phpVersion = & php -r 'echo PHP_VERSION_ID;'
if ($LASTEXITCODE -ne 0 -or [int]$phpVersion -lt 80300) {
    throw 'Laravel 13 needs PHP 8.3 or newer.'
}
& composer create-project laravel/laravel backend '^13.0' --no-interaction
if ($LASTEXITCODE -ne 0) { throw 'Composer project creation failed. Inspect backend/ before retrying.' }
Write-Host 'Laravel backend generated. No database migration was requested by this script.'
Write-Host 'NEXT: configure a NEW empty PostgreSQL test database in backend/.env; do not point it at DBSmilePOS.'
